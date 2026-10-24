# hearth

A fork of [Topcoat](https://github.com/tokio-rs/topcoat) (v0.10.0) for
**local-first web apps written entirely in Rust**. You write Rust; the
framework renders the first view on the server and compiles the
interactive parts to JavaScript that runs against a small local database
in the browser (tables, optimistic writes, indexed live queries; ~24 KB
gzipped for the whole runtime).

```rust
#[derive(Table, Clone, Debug, Default, Serialize, Deserialize)]
#[table(name = "issues", model = Issue, scope = issue_scope, writable(open, title, assignee_id), update = update_issue)]
pub struct IssueRow { #[key] pub id: String, #[index] pub modified: i64, /* ... */ }

let issues = live_query! {
    ListItem from i in IssueRow
    left join c in UserRow on i.creator_id == c.id
    where if $(!text.get().is_empty()) { i.title contains $(text.get()) }
    order by i.modified desc  limit 200
    select { id: i.id, title: i.title, open: i.open, creator: c.login }
};

view! {
    if $(path.starts_with("/issues")) {
        <ul> for issue in $(issues) {
            <li>
                <button @click=$(|_e| issues_t.set(issue.id.clone(), "open", !issue.open))>
                    $(if issue.open { "○" } else { "●" })
                </button>
                <a data-hearth-link="" :href=$("/issue/".to_owned() + issue.short_id.to_text())>
                    $(issue.title.clone())
                </a>
            </li>
        } </ul>
    }
}
```

## What hearth adds to Topcoat
| | |
|---|---|
| `#[derive(Table)]` + `routes!` | a Toasty model synced to the browser: columns, key, indexes, **required read scope**, whitelisted writes, load/mutate endpoints, typed IR→SQL lowering |
| `live_query!` | one query → SSR (SQL for the base table, in-memory joins) **and** an indexed live query in the browser (re-runs in ~0.2-5 ms at 50k rows) |
| `for x in $(query) { … }` | client keyed list; `$()` in the body reads the live row |
| `if $(cond) { … }` | client-switchable region (routing, toggles), kept alive |
| `route::path/segment` | reactive URL in `$()`; `data-hearth-link` anchors navigate client-side |
| `table_handle::<T>()` | optimistic `set/insert/remove/toggle` from `$()` handlers, validated by the table's Rust write fns, rolled back on rejection |
| `$()` vocabulary | `str.parse_i64()`, `int.to_text()`, `String + &str`, `Option::unwrap_or` (Rust + TS, tested) |

The browser store matches TanStack DB's optimistic-write semantics, checked by
a differential test against it (`crates/topcoat-runtime/browser/src/hearth/store.test.ts`).

Fork surface vs upstream: see `docs/hearth/` (design, results, diff).
Upstream examples under `examples/` are unchanged. Topcoat is MIT licensed;
hearth keeps its license and attribution.

## Benchmarks
`/bench/react` (React 19 + TanStack DB) and `/bench/topcoat` (plain Topcoat)
implement the same tracker against the same data; see
`benchmarks/localfirst/run.md`.

## Example
[`examples/hearth-tracker`](examples/hearth-tracker): a Linear/Jira-style
tracker (after Zero's zbugs), no app JS/TS.

```sh
pnpm install && pnpm build:runtime           # browser runtime (committed in dist/)
cargo run -p hearth-tracker --release -- seed --synthetic 50000
PORT=3100 cargo topcoat dev -r -p hearth-tracker
# or: scripts/rebuild-tracker.sh  (release build + restart on :3100)
```

Styling: Tailwind via `topcoat::tailwind` (`build.rs` + `stylesheet!()`), including classes chosen in `$()` client expressions. Requires rustc 1.99 (pinned). `legacy/zbugs-ts` is the earlier TypeScript
experiment, kept for comparison.
