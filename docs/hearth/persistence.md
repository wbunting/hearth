# Browser persistence and delta loads

Hearth keeps server rows in IndexedDB and restores them behind the SSR first view. The in-memory store remains the query engine. Optimistic writes are overlays and never enter the durable checkpoint. Storage is a cache, not an offline mutation queue. A blocked worker, unavailable storage, quota failure, or missing cache falls back to network loads.

## Load protocol

`routes!` exposes `GET /_hearth/<table>/load`. A request without query parameters returns the legacy row array. `?sync=1` returns `{ rows, deleted, cursor, full }`. Save the opaque cursor and pass it as `?since=<cursor>` on subsequent requests. When `full` is true, replace all server rows. Otherwise upsert `rows` and remove `deleted` keys. An empty delta keeps the same cursor.

Every delta request re-runs the table's read scope, including dependent-table scopes. A previously visible row that disappears from the scoped result becomes a tombstone, whether it was deleted or access was revoked. Cursor snapshots are bound to table schema and session token hash. Malformed, evicted, cross-session, cross-schema, and unknown cursors reset to a full scoped response without disclosing the previous principal's keys.

The server retains sorted keys and 128-bit row hashes, not complete rows. It keeps at most two snapshots per table/session stream within a process-wide 64 MiB accounted budget. Oversized snapshots are not retained. Restarting the process or reaching a different replica can require a full response. Server reads, serialization, and hashing remain O(table size); a durable database changelog would be needed to reduce that work. Applications with request-dependent anonymous scopes must require a session for synced tables.

## Cache lifetime and correctness

The browser namespace is the server-emitted schema fingerprint plus viewer scope. Include the user and any role or authorization generation in that scope. Changing either clears durable rows and cursors. Pages without an authenticated Hearth boot clear the cache, including the tracker login/logout page. Browser storage is not an authorization boundary and does not encrypt rows.

Rows are partitioned into 128 key-hash buckets. A lazy module worker owns IndexedDB. The main thread sends at most 1,000 rows per message; restores arrive one bucket at a time. Server rows and the cursor commit in one transaction. Failed transactions leave the previous checkpoint intact. Competing tab checkpoints with different bases invalidate the durable cursor rather than combine incompatible histories. An old tab cannot read or overwrite a different viewer's namespace.

The store applies server deltas underneath pending optimistic writes. A fetch captured before a mutation is discarded and retried after writes settle. Persistence receives only load-response rows, never the store's visible optimistic rows. A rejected mutation still rolls back through the normal store handler.

## Storage choice

A Chromium comparison used the tracker wire format (50,516 issues, 12,374,165 JSON bytes) on the development Mac. These are storage-only timings, not navigation times.

| Backend | Extra gzip payload | Full write | Warm read/open | One-row delta |
| --- | ---: | ---: | ---: | ---: |
| IndexedDB row buckets | 1.7 KB lazy worker/module | 63.9 ms | 28.5 ms | 0.6 ms |
| wa-sqlite 1.0.0, synchronous OPFS pool in worker | at least 288 KB | 230.2 ms | 98.8 + 21.4 ms | not measured |

The wa-sqlite size includes the 558,343-byte WASM (273,752 gzip) and 42,355-byte loader (14,642 gzip), before the SQLite API/VFS glue. Its asynchronous build is larger (1,139,398-byte WASM, 417,756 gzip). The experiment stores JSON rows in a SQLite table with prepared inserts inside one transaction and parses selected JSON on read. The OPFS pool also needs external synchronization for concurrent tabs. SQLite adds no query benefit while Hearth already maintains in-memory query indexes, so IndexedDB is the smaller and faster fit for this cache.

A main-thread IndexedDB prototype produced one 52 ms checkpoint task. The shipped implementation moves grouping and transaction work into the lazy worker. It does not add worker/WASM download to the SSR first-view path. Runtime entry gzip grows from 24,441 to approximately 25,010 bytes; the persistence asset loads only after tables start syncing.

## Reproduce

Use a separate hostname such as `dev15.localhost:3204` for concurrent worktrees: cookies and origin storage are not isolated by port. Build the runtime and release tracker, bundle assets, seed 50,000 synthetic issues, then run with `PORT=3204 SIMULATED_RTT_MS=50`. Log in as the crew user. Evaluate `benchmarks/localfirst/persistence.js` after each navigation. Delete the `hearth-sync-v1` IndexedDB database before a cold run; retain it before a warm run. `hearth:restored:<table>` marks complete local availability and `hearth:synced:<table>` marks validated server state. `__hearthBackfilled` additionally includes durable checkpoint completion.

For the storage comparison, download and unpack the `wa-sqlite@1.0.0` npm tarball into a temporary directory as `package/`. Copy `benchmarks/localfirst/storage-worker.js` there and serve the directory on an unused loopback port. From a page on that origin, start it as a module worker and post `{ rows }` containing the issue endpoint's JSON array. It reports write/read/open timings; a subsequent worker receiving `{}` measures a warm open/read. Compare with `LocalPersistence` from the built persistence module, using `save` and `restore` over the same rows. Keep experiment files outside Git.

## Measurements

Chromium, 50 ms simulated request delay, 50,516 issues, three navigations per mode. First rows remain SSR-rendered; FCP is used as the visible-row proxy. Concurrent builds made server validation variable, so these are indicative local timings rather than a controlled performance claim.

| Metric | Before (no persistence) | Cold checkpoint | Warm reload |
| --- | ---: | ---: | ---: |
| Rows visible / FCP | 120 ms median | 116-120 ms | 120 ms median |
| All issue rows available | 613 ms median (559-1,363) | 639-714 ms | 234 ms median (203-288) |
| Server validation complete | same as full availability | 639-714 ms | 707 ms median (467-1,928) |
| Durable checkpoint complete | n/a | 747-893 ms | 708 ms median |
| Load endpoint transfer | 1,543,883 B | about 1,565,600 B | 771 B |
| Main-thread tasks >=50 ms | 0 | 0 with worker | 0 |
| Filter, six toggles | 33 ms median | n/a | 32 ms median |

Cold response bytes increase about 1.4% because adding the cursor envelope changes Brotli compression. Warm transfers decrease more than 99.9%; rows are usable before server validation finishes. Cold full-data time has a modest scan/hash overhead; durability runs afterward. The O(table) server scan is the main remaining performance limitation.

Verified in the running tracker: list/search/filter, detail navigation, labels, reactions, comments, a successful issue toggle, rejected-title rollback, and state after reload. A non-crew issues load returns only public rows; changing one issue's visibility directly in SQLite produces a tombstone and removes it locally. Non-crew child-table loads have the pre-existing SQLite parameter-limit issue DEV-38 and are not claimed fixed here.
