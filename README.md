# fastcoat

A fork of [Topcoat](https://github.com/tokio-rs/topcoat) (v0.10.0) for
**local-first web apps written entirely in Rust**. You write Rust; the
framework renders the first view on the server and compiles the
interactive parts to JavaScript that runs against a local database
([TanStack DB](https://tanstack.com/db)) in the browser.

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
                <a data-fastcoat-link="" :href=$("/issue/".to_owned() + issue.short_id.to_text())>
                    $(issue.title.clone())
                </a>
            </li>
        } </ul>
    }
}
```

## What fastcoat adds to Topcoat
| | |
|---|---|
| `#[derive(Table)]` + `routes!` | a Toasty model synced to the browser: columns, key, indexes, **required read scope**, whitelisted writes, load/mutate endpoints, typed IR→SQL lowering |
| `live_query!` | one query → SSR (SQL for the base table, in-memory joins) **and** a TanStack DB live query in the browser |
| `for x in $(query) { … }` | client keyed list; `$()` in the body reads the live row |
| `if $(cond) { … }` | client-switchable region (routing, toggles), kept alive |
| `route::path/segment` | reactive URL in `$()`; `data-fastcoat-link` anchors navigate client-side |
| `table_handle::<T>()` | optimistic `set/insert/remove/toggle` from `$()` handlers, validated by the table's Rust write fns, rolled back on rejection |
| `$()` vocabulary | `str.parse_i64()`, `int.to_text()`, `String + &str`, `Option::unwrap_or` (Rust + TS, tested) |

Fork surface vs upstream: see `docs/fastcoat/` (design, results, diff).
Upstream examples under `examples/` are unchanged.

## Example
[`examples/fastissuetracker`](examples/fastissuetracker): a Linear/Jira-style
tracker (after Zero's zbugs), no app JS/TS.

```sh
pnpm install && pnpm build:runtime           # browser runtime (committed in dist/)
cargo run -p fastissuetracker --release -- seed --synthetic 50000
PORT=3100 cargo topcoat dev -r -p fastissuetracker
```

Styling: Tailwind via `topcoat::tailwind` (`build.rs` + `stylesheet!()`), including classes chosen in `$()` client expressions. Requires rustc 1.99 (pinned). `legacy/zbugs-ts` is the earlier TypeScript
experiment, kept for comparison.
