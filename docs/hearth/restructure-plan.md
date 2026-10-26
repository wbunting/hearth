# Restructure: hearth = fork of topcoat

> Historical research from the initial Topcoat-based prototype. Names, commands and benchmark results below describe that prototype, not the current Hearth release. See ../releasing.md for current package guidance.

## Layout
```
hearth/                       (repo root = the fork; topcoat v0.10.0 history-less import)
  crates/topcoat*/              upstream crates, patched (names kept so upstream merges stay easy)
  crates/hearth/              local-first layer: Table, live_query!, client lists, routing
  crates/hearth-macro/        live_query!, #[hearth::row], #[derive(Table)], routes!
  examples/hearth-tracker/    pure-Rust zbugs-style tracker (no app JS/TS)
  examples/...                  upstream topcoat examples (unchanged)
  docs/hearth/                design notes, results, fork diff
  legacy/zbugs-ts/              P0/P0.5 TypeScript experiment (kept for benchmarks)
```
Crate names stay `topcoat-*` internally (minimal fork diff, upstream merges
via `git merge` from a `topcoat-upstream` remote); the user-facing facade is
`hearth`, which re-exports `topcoat` + the local-first layer.

## "Make it real" list (from the spike)
1. **Capture analysis**: replace the ident-scan heuristic with real name
   resolution. Approach: the client-`for`/`if` body is lowered with the
   same `Bindings` machinery Topcoat uses; captures = free idents of all
   `$()`/`()` exprs in the body minus pattern bindings minus names bound by
   inner `let`/`for`, resolved by *trying* to clone only identifiers that
   are in scope (generate `let x = Clone::clone(&x);` only for idents that
   appear in expression position and aren't method/field names). Plus a
   compile test suite.
2. **`#[derive(Table)]`**: on a wire struct with `#[table(name, key,
   model = Issue, scope = fn, update = fn)]`; generates `Table` impl, columns,
   indexes from the Toasty model's `#[index]`es, and a `hearth::routes!`
   registration for load/mutate endpoints.
3. **IR → SQL for SSR**: lower `where/order/limit` on the base table to Toasty
   expressions (eq/ne/lt/…/and/or/not/in/contains→like) so the SSR first view
   is one indexed query; joins resolved by `in_list` on the join keys.
4. **`$()` vocabulary**: add `parse::<i64>()`-style `parse_i64()` and
   `to_string()` on ints to the runtime surrogates (Rust + TS + coherence-ish
   test) so routes don't need precomputed string columns.
5. **Route region lifecycle**: keep-alive with an LRU (keep last N arms),
   dispose beyond.
6. **SSR size**: render the row template once; per-row SSR markup omits the
   `$()` JS (browser re-derives it from the template by position).
7. **Sync**: delta sync (`?since=<modified>`) instead of full-table backfill;
   refetch on focus/online.
8. **Multi-user check**: two browser tabs as different users; mutation in one
   appears in the other after focus/poll.

## Example scope (hearth-tracker)
List with filters (open/closed, creator, assignee, label, text, sort),
issue detail with comments (add), reactions on issue and comments, labels
toggle, assignee, close/reopen, inline title edit, login picker, j/k nav.
All in Rust.
