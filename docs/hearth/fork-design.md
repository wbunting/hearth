# Fork design notes (spike)

## Key mechanism: row templates in the existing `$()` compiler

A client loop
```rust
for issue in $(open_issues) {          // open_issues: Expr<LiveQuery<IssueRow>>
    <li data-key=(issue.id)>
        <button @click=$(|_| ISSUES.toggle_open(issue.id.clone()))>$(if issue.open {"○"} else {"●"})</button>
        <a href=$(issue.href())>$(issue.title)</a>
    </li>
}
```
is lowered by the forked `view!` grammar (`ForLoop` with a `$()` iterable) to:

1. **Server**: evaluate the query (SSR rows) and render the body once per row
   exactly as today. Inside the body, `issue` is a `Row<IssueRow>` value, so
   `$(issue.title)` is an ordinary expression whose *server value* is the row's
   field.
2. **JS for each `$()` in the body**: `issue` is a capture, and today a capture
   becomes `cx.hydrate(<json snapshot>)`. In a client loop we instead want
   `issue` to mean "the current row of this list item". The forked grammar
   lowers captures of the loop pattern to `cx.row(<depth>)`, a per-item
   reactive ref the list region provides. That's a 30-line change in
   `NameResolver` plus a `RowCapture` marker type.
3. **Markers**: the list region emits
   `<!-- ::topcoat::list::start("<query js>", "<key js>", <template id>) -->`
   … rendered rows (each wrapped in `<!-- ::topcoat::item(<key>) -->`) …
   `<!-- ::topcoat::list::end -->`, plus one `<template>` holding the body
   rendered **once, with placeholder row data** so that all `$()` markers and
   `data-topcoat-*` attrs exist in it. The browser clones it per new row and
   hydrates the clone in a child `Scope` whose `cx.row()` points at that row's
   signal.
4. **Browser runtime** (`dom/list.ts`, new): subscribes to the query (TanStack
   live query via the hearth bridge), keeps `key → {nodes, scope, rowSignal}`,
   and on change: updates the row signal (fine-grained `$()` updates), or
   inserts, moves or removes item ranges. SSR items are adopted by key.

## Why not compile the whole body to DOM-building JS?
That's #275's approach (a rustc backend). It's more powerful, but a much bigger
project. The template-clone approach reuses Topcoat's existing `$()` →
JS lowering, markers and hydration, so the fork stays small and SSR stays
identical.

## Client `match` (routing)
`match $(route.get()) { Route::List => {...}, Route::Issue(id) => {...} }` uses
the same mechanism: one `<template>` per arm, a region swaps arms when the
discriminant changes, and arm bindings are row-style captures. The spike
does routing with a string signal + `if`-chain regions (`$if`), which is the
same machinery with boolean arms.

## Strict CSP expression modules (DEV-121)

The forked runtime separates trusted expression source from surrogate capture data in `Js::to_client()`. Expression macros collect function shapes in link-time inventory, and HTML carries a digest plus JSON captures; `runtime()` serves these startup-known function bodies from a same-origin ES module route. The browser imports functions before hydration, including nested templates and subsequent shard/navigation frames. Per-list `@N` tables contain these references without a protocol change. Captured expressions are references evaluated in context rather than source flattened into their callers. This avoids eval, keeps captures out of public module caches, works across processes and restarts, and requires no nonce or asset-bundler changes. See [strict CSP](strict-csp.md) for deployment constraints, the style audit, tests, and local measurements.
