# Fork spike: app logic in pure Rust, framework transpiles to JS + TanStack DB

## The conflict, concretely

Topcoat today:
```rust
let open = signal(cx, || true);
let issues = Issue::list(cx).await?;                  // server
view! {
  <button @click=$(|_| open.toggle())>"toggle"</button>
  if open.get() {                                       // server-side `if`: the page reruns on the server
    for issue in issues { <li>(issue.title)</li> }      // server-only loop
  }
}
```
Clicking `toggle` posts the signal values to the server, which re-renders and
morphs the DOM. That's "server is authority": correct, but every interaction
costs a round trip. Maintainers want to keep that model (#275: "have the
server be the authority at all times, with only minimal JS"). `$()` is
intentionally a tiny expression language: no lists, no `match`, no client
routing.

Local-first needs the reverse: lists, filters, routing and writes run against
a local DB in the browser; the server is a sync peer and the SSR source.

## Design: keep Topcoat's mechanism, widen what it can express

Topcoat already compiles `$()` to JS in the proc macro: the Rust side typechecks
against surrogate types, and the JS side calls their TS twins. The HTML carries
markers (`<!-- ::topcoat::expr::start("<js>") -->`) that the browser runtime
hydrates into effects. The fork reuses all of that and adds:

| Rust (app author writes) | Lowers to | Fork surface |
|---|---|---|
| `#[derive(toasty::Model)] #[client_table(scope = ..)]` | collection descriptor + indexes + endpoints | new crate (`fastcoat`) |
| `live_query!(Issue where open == $(open) order_by modified desc limit 200)` | query **IR** → SSR via Toasty, JS via TanStack DB builder | new crate |
| `for row in $(query) { <li>$(row.title)</li> }` | `::topcoat::list::start(<query js>, <template id>)` + `<template>` with row-scoped `$()` | **view grammar + runtime** |
| `$(row.title)` inside a client loop | `row` resolves to a **per-row signal** (`cx.row(n)`), not a frozen capture | **runtime grammar** |
| `$(|_| ISSUES.update(row.id, |i| i.open = !i.open))` | TanStack optimistic `collection.update` with a draft | runtime grammar (assignment) + surrogate |
| `route` / `$match route.get() { … }` | client `match` region: one template per arm, swapped on change | view grammar + runtime |

Server-side, every `$()` still evaluates in Rust for SSR (the surrogates), so
the same template renders on the server for the first view and in the browser
afterwards.

## Spike scope
A pure-Rust zbugs page:
- issue list = `live_query!` + client `for` with per-row `$()` text and attributes,
- filter `<select>`s bound to signals feed the query (re-run in the browser),
- toggle open/closed = a Rust closure → optimistic TanStack mutation → `#[mutation]` server fn,
- list ↔ detail = client `match` on a route signal, declared in Rust,
- first view SSR'd through the same IR.

No app-specific JS/TS. Measure against the P0.5 TypeScript version.
