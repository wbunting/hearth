# P0 results: handwritten TanStack DB on Topcoat (2026-10-23)

Setup: zbugs schema in Toasty/SQLite; 516 real zbugs issues + 50,000 synthetic.
Release build, `topcoat dev -r`, localhost, Chromium (T3 preview), M-series Mac.
Re-run with `bench/issues-probe.js` (LOAD / INTERACT) on `/issues?mode=ssr|local`.

## What works
- Rust/Toasty server, Topcoat sessions, scoped JSON endpoints, and a handwritten
  TanStack DB client (no React) delivered as one Vite lib bundle via `asset!()`.
- Auth: unauthenticated `/api/*` returns 307 to `/login`. A non-crew user gets
  48,036 issues and 0 internal; crew gets 50,516 with 2,480 internal. The SSR
  snapshot and the API go through the same `read_scope`. A non-crew edit of
  someone else's issue returns 403, and the optimistic change rolls back.
- The keyed list adopts SSR rows by `data-key` (no flicker), then reconciles
  live-query results. Verified in a vitest/happy-dom test.
- Optimistic toggle: about 10–18ms from click to the next frame. Server
  confirmation uses `writeUpsert` of the returned row, not a 50k refetch.

## Numbers at 50k issues (indexed)

| | ssr | local |
|---|---|---|
| TTFB | 260–300ms | 1ms |
| First paint (rows visible) | ~300–340ms, SSR rows | 24ms shell; rows at ~870–900ms |
| Collections ready | ~960–1000ms (17MB inline JSON parse) | ~870–900ms (1.5MB br over 2 requests) |
| Filter change → frame | 56–75ms | 56–75ms |
| Label filter (join through issue_labels) | ~413ms | ~413ms |
| Title text filter (`ilike`) | ~210–300ms | ~210–300ms |
| Toggle click → frame | 14–18ms | 13–14ms |
| JS heap | 177MB | 177MB |

## Findings, in order of importance
1. **Indexes are mandatory and opt-in.** Without `createIndex`, orderBy+limit
   with 2 left joins at 50k cost 0.6s (open), 2.3s (closed) and 4.4s (all) in
   the browser. With BTree indexes the same queries take 3–24ms in isolation
   (`client/test/query-bench.test.ts`). P1 must emit indexes from Toasty's
   `#[index]` attributes automatically.
2. **The ~60ms floor per filter change is rebuilding the live query**
   (`createLiveQueryCollection` per change), not evaluating it. In P2, compile
   the query once and parameterize it, or reuse the pipeline.
3. **The label-filter join (~413ms) and `ilike` (~210ms) are unindexed paths.**
   Reshape them as `issue_labels where labelId = X` → `inArray`/semi-join, and
   push title search to the server or a dedicated index.
4. **Full-table sync is too big for SSR at 50k.** The SSR page is 17MB raw
   (2MB compressed) and parsing it costs about 600ms after first paint. The
   `local` mode fetches the same data as 1.5MB compressed in parallel. SSR
   mode should embed **only the rows the first view needs** and let the
   collection backfill, or use TanStack `syncMode: "on-demand"` with
   `loadSubset` mapped to Toasty queries. The IR (P2) is where that mapping
   lives.
5. **Bundle size: 118KB gz** (TanStack DB ~716KB src, query-core and
   query-db-collection ~256KB src), against Topcoat's own runtime at 15KB gz.
   The 60KB budget was wrong for this design. Options: replace
   `query-db-collection` and `query-core` with a ~1KB custom `sync` adapter
   (we only need fetch → begin/write/commit), likely saving ~35–40KB gz.
6. Paper cuts:
   - Vite lib mode leaves `process.env.NODE_ENV`; a `define` is required.
   - `topcoat dev` doesn't watch `asset!()` files outside the crate; touch a
     `.rs` file after `pnpm build`.
   - Topcoat 0.10 needs rustc 1.99.
   - `topcoat new` isn't in the published 0.10 CLI.
   - TanStack's `orderBy`/`where` builder types fight dynamic condition lists
     (`and(...)` needs 2+ arguments).

## Gate decision
**Proceed.** Toggle and most filters are instant at 50k once indexed, which
Topcoat shards (server rerun per interaction) cannot do. The real P1/P2 work:
generated indexes, parameterized queries, and partial (first-view) snapshots
instead of full-table SSR.

# P0.5 (same day): detail view, Rust-emitted schema/indexes, first-view SSR

Changes:
- Issue detail page (`/issue/{short_id}`): description, comments, reactions,
  labels, assignee, inline title edit, close/reopen. Client-side routing
  between list and detail, with `j`/`k`/`esc`. Deep links render via SSR.
- **Rust emits the client schema**: `client_schema.rs` reads Toasty's model
  metadata (`#[index]`, `#[unique]`, primary keys) and emits collection
  descriptors (key, endpoints, BTree index fields). The generic TS
  `runtime.ts` builds every collection and index from it. No hand-listed
  indexes remain.
- Replaced `@tanstack/query-db-collection` and `query-core` with an
  80-line sync adapter: **118 → 97 KB gz**.
- SSR embeds only the **first view** (100 open issues + their labels, or one
  issue + its comments), queried by index in SQL, and backfills full tables
  after. Label filter uses an index lookup + `inArray` instead of a join.

| 50k issues, localhost | before | after |
|---|---|---|
| SSR TTFB `/issues` | 260–300ms | **4–8ms** |
| SSR HTML | 17MB (2MB br) | **74KB (12KB br)** |
| Rows visible (FCP) | ~320ms | **48–76ms** |
| Interactive (collections ready for first view) | ~1000ms | **48–74ms** (list), **22–24ms** (detail) |
| Full 50k backfill complete | n/a | ~2.0–2.9s (background) |
| `local` mode interactive | ~880ms | ~1.7s (cold, no persistence yet) |
| List → detail (click → frame) | (no detail) | **26–32ms** (first: 100ms) |
| Detail → list (back) | n/a | **15–19ms** |
| Label filter | 413ms | **97ms** |
| Optimistic comment / label / reaction | n/a | **4–7ms** to frame, server-confirmed |
| Title text filter | ~210ms | ~290ms (still unindexed `ilike`) |

# Fork spike: pure-Rust app logic (2026-10-23)

`apps/zbugs/src/app/rs.rs` is the issue list and detail page with **zero app
JS/TS**: a `live_query!` with two joins and three signal-driven filters, a client
`for row in $(query)` loop, a Rust toggle closure that becomes an optimistic
TanStack write, and `if $(path...)` client routing between list and detail.

| 50k issues, localhost, release | P0.5 (handwritten TS) | **pure Rust (fork)** |
|---|---|---|
| TTFB list / detail | 4–8ms / ~3ms | 20–24ms / 11–13ms |
| FCP list / detail | 48–76ms / 36–44ms | 52–88ms / 32–44ms |
| Interactive list / detail | 48–74ms / 22–24ms | **92–141ms / 41–48ms** |
| List → detail (click → frame) | 26–32ms | **10–18ms** |
| Detail → list (back) | 15–19ms | **15–18ms** |
| Filter change | 21–73ms | 28–55ms |
| Title text filter | ~290ms | **~55ms** (IR `contains` → ilike, no join) |
| Optimistic toggle | 17ms | 16–19ms |
| Full backfill (background) | 2.0–2.9s | 0.95–1.2s |
| Bundle (gz) | 15KB topcoat + 97KB app | **102KB total** (one runtime) |

Fork size vs topcoat v0.10.0: **13 files, +1032/−7** (`docs/topcoat-fork.diff`);
~90% new files (`browser/src/fastcoat/*`, the `ClientIf`/client-`for` lowering).
Upstream files touched: hydrate (region skip), text (first-render flag), scope
(per-scope context), context (`cx.row`, `cx.db`, `cx.route`), `Expr::evaluate_dynamic`.
New Rust crates `fastcoat` + `fastcoat-macro`: ~1.2k lines.

Learned:
- Topcoat's `$()` → JS lowering + `#[record]` surrogates were the right
  foundation: row templates needed only `cx.row(n)` as the capture's JS.
- Planner rules matter more than the engine: point lookups must drop
  orderBy/limit (163ms → 0.4ms); keep-alive route arms (no query rebuild)
  took navigation from 50–140ms to 10–18ms.
- Spike shortcuts to replace: capture analysis is a heuristic ident scan;
  `Table` impls + endpoints are hand-written (want `#[derive(Table)]`);
  SSR evaluates joins in memory over SQL-limited base rows; route regions keep
  arms alive forever.

# fastissuetracker on the fastcoat fork (2026-10-24)

Pure-Rust example (`examples/fastissuetracker`, ~700 lines of app Rust, 0 app JS/TS).
50,516 issues, release, localhost, Chromium.

| | |
|---|---|
| TTFB `/issues` / `/issue/3016` | 15–16ms / 12–13ms |
| HTML (compressed) | 23–24KB |
| DOM interactive | 32–40ms |
| Full tables backfilled (background) | 0.83–0.91s |
| List → detail / back (warm) | 4–7ms / 2ms (sync work); first visit ~16ms |
| Filters (open/closed/creator/assignee/text) | 18–72ms, results verified |
| Optimistic toggle / comment / reaction / label | 1–8ms to DOM, server-confirmed |
| Other user's edit visible after focus | 324ms |
| Runtime bundle (gz) | ~103KB |

Fixed along the way: reactions on comments 403'd (subject resolved as issue
only); region effects subscribed to signals read during mounting (routing
stopped reacting); nested list rows (`cx.row(<list id>)`); inserts needed
server-owned fields (now defaulted).

"Make it real" status: capture analysis ✅ (syn visitor, tested); `#[derive(Table)]`
+ `routes!` ✅; IR→SQL for base-table SSR ✅ (joins in memory); `$()` vocab ✅;
multi-user freshness ✅ (focus/online refresh, full refetch); keep-alive route
arms (no LRU yet) ◐; SSR row markup still repeats `$()` JS per row (compresses
well; ~1.2MB raw) ◐; delta sync ✗.
