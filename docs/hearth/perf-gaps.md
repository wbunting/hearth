# Why hearth lost some benchmarks (and the fixes)

Measured 2026-10-24 on `/issues` (hearth) vs `/bench/topcoat` and `/bench/react`.

## 1. First rows: 82–139ms vs plain Topcoat 15–69ms
| | hearth | plain Topcoat |
|---|---|---|
| HTML bytes (raw) | **1,435 KB** | 67 KB |
| TTFB (server) | 10–12ms | 2–3ms |
| DOM interactive | 48ms | 19ms |
| main-thread script at boot | 60ms (hydration) | 0 |

The page is 21× larger, and the cause isn't the data. It's **the list row template
being rendered 3+ times**:
- 681 KB: the `/issues` `if $()` region's `<template>` contains the *whole list
  again, including SSR rows* (the region template is rendered with real data).
- the visible list itself (200 SSR rows), each row repeating its `$()` JS in
  comment markers (2,530 markers, only **18 unique**), 391 KB of marker JS.
- the detail region template (69 KB).

Then hydration walks all of it: 60ms of main-thread script before the page responds.

**Fixes:**
- (a) Region templates render *structure only*: client lists inside a `<template>`
  emit no SSR rows and no seed.
- (b) Rows reference their markers by id instead of inlining the JS: one copy of
  each unique `$()` per list, and rows carry `<!--e:3-->`.
- (c) Hydrate SSR rows lazily, binding handlers on first interaction/idle, not at boot.

## 2. Filter changes: 37–59ms vs React 19–29ms
hearth **rebuilds the whole TanStack live query** on every param change
(`cleanup()` + `createLiveQueryCollection`: compile the IR, rebuild the IVM
graph, re-scan, then reconcile 200 rows of DOM). React's `useLiveQuery` does the
same rebuild but then diffs only the rows that changed. The difference is
hearth's reconcile, which re-sets every row signal and re-runs every row's
`$()` effects, plus the extra rAF + postTask hop added for input responsiveness.

**Fixes:** compare rows by value before touching their signal (skip unchanged
rows); parameterize queries so a filter change doesn't rebuild the graph
(TanStack has no public API for this yet, so cache one graph per distinct
param set, LRU); drop the extra hop for non-typing changes (selects, clicks).

## 3. Search after typing: ~50ms vs React ~1ms
The typing guard waits for a 40ms quiet gap before running the query. React uses
`useDeferredValue`, which renders at lower priority but interruptibly. React can
abandon a render when a key arrives, while a TanStack query build can't be
interrupted. **Fix:** run the query engine in a Web Worker. Then queries never
block input and the quiet-gap delay can go to ~0. This is the structural fix
for both typing stalls and filter latency.

## 4. Backfill: one 535ms main-thread task
Applying 50k rows (+ 50k issue labels) into TanStack collections happens in a
single `Response.json().then` task. It doesn't block first paint, but it blocks
input for half a second right after load. **Fix:** chunk it (5k rows per task,
yielding between), or move it to the worker with (3).
