# hearth: Rust-authored Topcoat apps with TanStack DB on the client

Read so far: `tokio-rs/topcoat` @ `b7a85c3` (crate 0.10.0), `@tanstack/db` 0.15.2 (2026-10-21), `rocicorp/mono` `apps/zbugs`.
Toolchain: Topcoat 0.10 needs **rustc ≥ 1.99**, so `rust-toolchain.toml` pins 1.99.1.

## 0. Decisions (rev 2)

| Topic | Decision | Why |
|---|---|---|
| Deploy target | **One native Linux container image.** Run it on Vercel (Container runtime) first, then Cloudflare Containers or Fly. Don't target Workers/wasm. | See §1. Topcoat on Workers loses WebSockets and the Toasty SQLite driver; a container keeps both. |
| Transport | All data goes over **HTTP procedures**. WebSocket/SSE carries **invalidation only** and is optional. | Vercel WebSockets close at the function's max duration (300s on Hobby). Correctness must not depend on a socket staying open. |
| Server DB | Toasty, Topcoat's default. SQLite locally; **Turso** (Toasty's `turso*` features) when deployed. | A container filesystem is ephemeral. Nothing on the server is TanStack-specific, so any Toasty backend works. |
| Sync engines | **None.** No Electric, PowerSync or Zero. | We're only testing the "translate to TanStack DB" layer. |
| Client DB | TanStack DB in memory. Persistence (`@tanstack/browser-db-sqlite-persistence`, wa-sqlite) comes later as an opt-in mode. | Needed for client-first render (§4). |
| Render | **Both modes, chosen per page**, and benchmarked against each other: `ssr` (rows in HTML, snapshot hydrates the collection) and `local` (shell from the server, rows from the local DB, network refresh behind it). | You've seen flicker-free local reads when the query fits the frame budget. Measure it rather than guess. |
| JS toolchain | pnpm + **Vite 8** library mode (Rolldown) + Vitest. | Vite+ (`vite-plus` 1.4) wraps the same tools and can be swapped in later. |
| Query syntax | Dedicated macro DSL: `live_query!(...)`. | Better errors, and easier to lower to IR. |
| Test app | **zbugs clone**: user, project, issue, comment, label, issueLabel, emoji, viewState, userPref. | Has real joins and the scale of a Linear-style tracker. |
| Repo | This directory: a git repo with a Cargo workspace and a pnpm workspace. | |
| Topcoat | crates.io `topcoat = "=0.10.0"`. Fork only via `[patch]` if Phase 3 needs it. | §2 |

## 1. Deployment facts (checked 2026-10-23)

**Vercel**
- WebSockets in Functions went **GA on 2026-10-20**. A connection is pinned to one instance and closes at the function's
  max duration: Hobby 300s; Pro 800s, or 1800s in the extended beta.
- **Container runtime (beta)**: put a `Dockerfile.vercel` at the root, listen on `$PORT`. It runs on Fluid compute with
  active-CPU billing. Vercel's own KB has a "Deploy Rust (Axum) with Docker" guide. A Topcoat binary plus its `assets/` bundle fits.
- The Rust runtime (`vercel_runtime`, beta) uses one function per `[[bin]]`. It doesn't suit a single Topcoat router.
- Implications:
  - Topcoat's `runtime::connected` live renders will reconnect every ≤5–13 min. Topcoat already reruns state on reconnect.
  - Cross-instance invalidation needs a pub/sub store such as Redis or Turso polling.
  - The filesystem is ephemeral, which rules out SQLite on disk. Use Turso.

**Cloudflare**
- **Workers**: Topcoat ships an example (`Router::handle`, `default-features = false`), but there are no runtime WebSockets and no tokio.
  Toasty's SQLite driver is native, so a Workers build would need D1 behind a different data layer. Not worth it for this experiment.
- **Containers** (Workers Paid plan): a Worker/Durable Object fronts the native container. WebSockets go through the DO, and the image is the same one as Vercel's.

**Fly / VPS**: the same image, long-lived, no socket limits. This is the control group.

## 2. Topcoat findings that shape the design

| Fact | Consequence |
|---|---|
| `$(...)` is transpiled in the proc macro to a JS string and run with `new Function("cx", ...)`. Method calls pass straight through. Rust typechecks against *surrogate* types that have TS twins. | A `LiveCollection<T>` surrogate plus a TS twin works inside `$()` with no grammar change. |
| `raw!("js ${x}", rust_fallback)` is an official escape hatch. | Phase 0/1 run without a fork. |
| The browser runtime is a prebuilt bundle (`browser/dist/index.js`) served by `asset!()`. Users never touch npm. | Our bundle ships the same way: Vite lib build → `client/dist/hearth.js` → `asset!()`. |
| **No client-side list rendering.** `for` in `view!` is server-only; changing a signal the server read reruns the page or shard. | Keyed client lists are the main thing we build (Phase 3). |
| A page or shard rerun removes nodes a script added (#540). | Our regions must be fenced off from Topcoat's morph. |
| Shards and procedures **bypass page/layout guards**. The docs say to authorize inside each one. | Generated load and mutate procedures must require an auth scope (§5). |
| Maintainers want the server to stay authoritative, and the Rust→JS compiler proposal (#275) is undecided. | Don't count on upstreaming. Keep the fork surface tiny. |

**Extend or fork:** extend. Use a sibling crate plus a JS package on unmodified Topcoat. Phase 3 may need one marker kind in
`browser/src/dom/{markers,hydrate}.ts`; carry it as `[patch.crates-io]` on a branch. If that patch grows past ~300 lines, or needs the grammar
crate, stop and re-evaluate.

## 3. Architecture

```text
Rust app code (only thing the user writes)
  #[derive(toasty::Model)] #[hearth::record] struct Issue {..}
  collection!(ISSUES: Issue, key = id, scope = issue_scope, load = .., mutate = ..)
  let rows = live_query!(from i in ISSUES
                         join c in USERS on c.id == i.creator_id
                         where i.open == true order_by i.modified desc limit 100
                         select { id: i.id, title: i.title, creator: c.login })
  view! { <ul> for_live r in rows { <li>$(r.title) " · " $(r.creator)</li> } </ul> }
        │ macros emit
        │  (a) query IR (serde JSON), the one source of truth
        │  (b) Rust SSR evaluation of that IR (Toasty query, or a Vec interpreter in tests)
        │  (c) row <template> and row-scoped $() expressions
        ▼
HTML: rows (ssr mode) or shell (local mode) + markers + collection snapshot
        ▼
Browser: topcoat runtime (upstream) + hearth.js (Vite lib, bundles @tanstack/db, no React)
   collections.ts  descriptor → createCollection(queryCollectionOptions → Topcoat procedure)
   ir.ts           IR → TanStack query builder → createLiveQueryCollection
   list.ts         subscribeChanges → keyed DOM ops; row exprs bound via Topcoat Scope
   bridge.ts       TanStack changes → Topcoat effect scheduling; mutations → optimistic tx → procedure
   persist.ts      (later) wa-sqlite persistence, namespaced by user + schema hash
```

## 4. Render modes, as a benchmark

| | `ssr` | `local` |
|---|---|---|
| First request | Server runs the IR query, renders rows, embeds the snapshot | Server renders the shell plus the query descriptors |
| Client start | Hydrates the collection from the snapshot, then attaches the list | Opens the persisted DB, runs the live query, renders rows, then refreshes from the network |
| Risk | TTFB rises with query cost; SSR and client results can differ | Cold cache means an empty shell; the persistence boot must fit the frame budget |
| Metric | TTFB, LCP, hydration time | time-to-rows from navigation start, CLS, first-frame miss rate |

The harness is a Playwright script that measures both modes on the issue list, both warm and cold, at 5k / 50k / 200k issues.

## 5. Auth (the hard part with these frameworks)

The server is authoritative, so auth uses Topcoat sessions, and every byte the client gets comes from a procedure that has `cx`.
What's specific to local-first:
1. **Read scope**: `collection!(..., scope = fn(&Cx) -> Result<Scope>)` is **required**, so it can't be forgotten. zbugs already has
   `issue.visibility` = public/internal (internal is crew-only), which makes it a ready-made test.
2. **SSR and local use the same path**: the SSR snapshot goes through the same scope function as the load procedure.
3. **Revocation**: rows a client saw earlier can lose visibility, for example when a role changes. On scope-hash change or role change, clear the
   collection and reload it. Mid-session revocation for a single row needs a server delete or invalidate.
4. **Writes**: each mutate procedure authorizes the actual row on the server. A rejection rolls back the optimistic transaction.
5. **Persistence**: the local DB is keyed by `user_id + schema_hash` and wiped on logout or user switch. Nothing is persisted before login.
6. Login for the experiment: a "sign in as <seeded user>" picker backed by Topcoat sessions. No GitHub OAuth.

## 6. Test app: the zbugs schema in Toasty

Tables: `user(id, login, name, avatar, role, github_id, email)`, `project(id, name, lower_case_name, issue_count_estimate, ...)`,
`issue(id, short_id, title, open, modified, created, project_id, creator_id, assignee_id?, description, visibility)`,
`comment(id, issue_id, created, body, creator_id)`, `label(id, name, project_id)`, `issue_label(label_id, issue_id, project_id)`,
`emoji(id, value, annotation, subject_id, creator_id, created)`, `view_state(user_id, issue_id, viewed)`, `user_pref(key, user_id, value)`.

Seed data:
- Real: zbugs `seed-data/github/*.csv` (Apache-2.0, ~4.2k issues and 5.4k comments), vendored in `apps/zbugs/seed/github`.
- Scale: the gigabugs S3 bucket now returns 403, so `zbugs seed synthetic --issues N` generates data instead (deterministic RNG).

Screens, each exercising a feature:
- **Issue list**: filters for open/closed, assignee, creator and label (join through `issue_label`), plus sort. Joins: creator, assignee, labels.
- **Issue detail**: comments, each comment's creator, emoji per subject, `view_state` upsert.
- **Mutations**: toggle open, assign, add or remove a label, add a comment, react with an emoji, edit the title.
- **Two tabs or two users**: staleness and invalidation, plus `internal` issue visibility.

## 7. Phases (each ends with a browser check)

- **P0 Handwritten feel test.** zbugs models, seed, login picker. Issue list via a hand-written TS collection
  (`queryCollectionOptions` → Topcoat procedure) and a hand-written keyed list. Measure bundle size, toggle latency, flicker,
  morph clobbering (#540), and the 50k-row load. *Gate: is this better than Topcoat shards for this page? If not, stop.*
- **P0 done**, see RESULTS.md. Proceed.
- **P1 Collections in Rust.** `collection!` with the required `scope`. A JSON descriptor goes into the head, and an SSR snapshot preloads the collection.
  Also derive TanStack indexes from Toasty `#[index]` (P0: queries go from 0.6–4.4s to 3–24ms). Swap query-db-collection for a ~1KB custom sync adapter (P0 bundle: 118KB gz).
- **P2 `live_query!`.** Compile once and parameterize (P0: 60ms floor per filter is the query rebuild). SSR embeds only first-view rows; collections backfill or use on-demand `loadSubset` → Toasty. IR crate; SSR evaluation in Rust; a client IR interpreter; IR parity tests over shared fixtures (Rust ↔ vitest);
  a `LiveCollection<T>` surrogate for `.len()` and `.first()` in `$()`.
- **P3 `for_live` keyed lists.** Templates plus row scopes. Fork decision here. 1k-row create/update/swap benchmark.
- **P4 Mutations from Rust handlers.** A `mutate!` macro (assignment isn't in Topcoat's grammar) → optimistic tx → procedure,
  with rollback and a pending-state signal.
- **P5 Render-mode benchmark.** wa-sqlite persistence and the `local` mode; the Playwright harness from §4.
- **P6 Invalidation and deploy.** `invalidate(collection, keys?)` over SSE/WS plus refetch on focus; Dockerfile for Vercel containers; Turso.

## 8. Success metrics
1. Handwritten TS in `apps/zbugs`: 0 lines by P4.
2. Bundle: Topcoat runtime + TanStack DB + glue. P0 measured 118 KB gz; target ≤80 KB gz after dropping query-core.
3. Fork patch under 300 lines (ideally 0).
4. Parity: the IR fixtures agree in Rust and TS.
5. Issue list at 50k issues: filter change within 1 frame (local), toggle feels instant.
6. Deploys to Vercel containers with WS reconnect and no data loss.

## 9. Risks
- TanStack DB is beta (0.15.x, weekly releases) and Topcoat is experimental (0.10). Pin both exactly.
- Two reactive systems: TanStack DB holds the data and Topcoat effects are the only DOM writers.
- SSR/CSR drift: the IR plus parity tests cover this.
- Topcoat has a fast-moving MSRV: 1.99 already.
