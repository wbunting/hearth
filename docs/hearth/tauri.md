# Hearth in a Tauri desktop app (experiment)

This experiment runs a Hearth server inside a [Tauri 2](https://v2.tauri.app) desktop process, over an on-device SQLite database, and points the app's webview at it. No remote server is involved. The local process plays the role Hearth's server plays on the web: it authorizes reads, validates writes, and holds the durable copy. Writes are durable and work offline because "the server" is always reachable. A separate Rust sync layer could later replicate the local database to a remote.

The example lives in [`examples/hearth-tauri`](../../examples/hearth-tauri/README.md). It is a small planner with lists and tasks. It uses `#[derive(Table)]`, `live_query!`, client keyed lists, optimistic inserts, updates and deletes, and IndexedDB persistence. It needed **no framework changes**.

Measured on macOS 26.5 (Apple silicon), Tauri 2.12.5 (WKWebView), Rust 1.99.1, release builds, 2026-10-28.

## Result

| Question | Answer |
| --- | --- |
| Does a Hearth app run unmodified inside Tauri? | Yes. The same router serves a browser over loopback and a webview over a custom scheme. |
| How does the webview reach the server? | Recommended: a `hearth://` custom URI scheme handler that calls `Router::handle` in process. Loopback TCP with a per-launch token also works. |
| Strict CSP? | Yes. `default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'`, zero violations in WKWebView with both transports. |
| Are writes durable across restart? | Yes. Verified in the GUI: insert and toggle, quit, relaunch, rows present; the same rows appear in `sqlite3`. |
| Startup | About 75-110 ms to router ready (Tauri setup dominates), about 210-310 ms to window created, 430-660 ms to page load finished. Database open: 1-10 ms. |
| Size | 22 MB `.app` (23 MB binary, unstripped). The standalone loopback server is 14 MB. Assets: 91 KB. |
| Recommendation | Viable for single-user, local-first desktop apps. Use the custom scheme. Treat the local SQLite database as the source of truth and replicate it with a Rust changelog/outbox, not with browser-side queues. |

## Architecture

```text
+------------------------- one macOS process -------------------------+
|                                                                     |
|  WKWebView  --hearth://localhost/...-->  scheme handler (Tauri)     |
|   Hearth runtime JS                         |                       |
|   in-memory store + IndexedDB cache         v                       |
|                                     Router::handle_with(req, Trusted)|
|                                     Hearth pages, /_hearth/* tables |
|                                             |                       |
|                                     Toasty -> SQLite file in        |
|                                     ~/Library/Application Support/  |
|                                         |                           |
|                                 changes table (outbox, seq cursor)  |
|                                         :                           |
|                              future: Rust replicator --> remote     |
+---------------------------------------------------------------------+
```

The page, its runtime script, expression modules, persistence worker and every table load and mutation go through the scheme handler. The browser runtime does not know it is in a desktop app. Its "server" is the in-process router.

## How the webview reaches the server

### Option A: custom URI scheme (recommended)

Tauri's `register_asynchronous_uri_scheme_protocol("hearth", ...)` receives an `http::Request<Vec<u8>>` and a responder. Hearth's `Router` already accepts an `http::Request` and returns an `http::Response`, so the adapter is about 20 lines (`handle_in_process` in the example):

1. Convert the body to `hearth::router::Body`.
2. Remove `Accept-Encoding`. Hearth compresses responses when asked, and the adapter does not pass a `Content-Encoding` through a decoding HTTP stack, so the webview would receive compressed bytes if it ever sent the header. This is defensive; whether WKWebView sends the header to custom schemes was not checked.
3. Call `router.handle_with(request, (Trusted,))`. `Trusted` is a request-context value that cannot be produced over HTTP, so it proves the request came from the host.
4. Buffer the response body with `to_bytes` and respond.

The webview loads `hearth://localhost/`. On macOS and Linux the origin is `hearth://localhost`; on Windows and Android Tauri maps it to `http://hearth.localhost`. Everything Hearth emits is relative or same-origin, so relative `fetch`, module imports, the persistence worker and IndexedDB all worked unchanged in WKWebView. Hearth's default `OriginPolicy` accepted the webview's mutations without configuration. The exact headers WebKit sent were not logged.

Measured per-request cost for `GET /_hearth/tasks/load` (7 rows): **51 us in process** against **156 us over loopback** with a new TCP connection per request. Both are negligible next to rendering. The real advantages are that no port is open and there is no token to handle.

Limitations:

- Responses are buffered, not streamed. Hearth's streaming SSR (`live!`, suspense) still produces a correct final document, but the webview sees it only when it completes. Tauri's asynchronous protocol responds with one body.
- WebSockets do not go over a custom scheme. Hearth's connected renders (`runtime::connected`) and the WebSocket feature would need loopback. This example uses only HTTP (table loads and mutations), which is Hearth's local-first data path anyway.
- The scheme handler can run before the router exists. The example builds the router in Tauri's `setup` (it needs the app data dir) and the handler awaits a `OnceCell`.

### Option B: loopback port with a per-launch token

Bind `127.0.0.1:0`, generate a 256-bit token, and open `http://127.0.0.1:<port>/_local/enter?token=...`. That route sets an `HttpOnly; SameSite=Strict` cookie and redirects to `/`. A layer rejects every other request without the cookie with 401. This also works, and it is what `cargo run --bin hearth-tauri-server` uses so the app can be debugged in a normal browser.

Costs of loopback:

- Any local process can connect to the port. The token makes the database unreadable without it, but the port is still discoverable, and the token is visible in the initial URL (and in any process listing that shows it).
- The origin changes on every launch (`http://127.0.0.1:<random port>`). Browser storage is per-origin, so **the IndexedDB cache is orphaned on every launch**. In the GUI run with loopback, `hearth:restored:*` marks never appeared and every launch did a full load. With the custom scheme the origin is stable and restore worked (`hearth:restored:tasks` at 156-188 ms, before `hearth:synced:*`).
- A fixed port fixes the origin but collides with other apps and instances.

Use the custom scheme. Keep loopback as a development and debugging transport.

## Assets inside a Tauri bundle

Hearth embeds `asset!` declarations in the binary and `hearth asset bundle` scans the built binary to produce `assets/` plus a manifest. `AssetBundle::load()` looks beside the executable, which is `Contents/MacOS/` in a `.app` and is not where Tauri puts resources.

What worked:

- The Tauri shell calls `AssetBundle::load_dir(resource_dir/assets)` and falls back to `AssetBundle::load()` for development runs.
- `tauri.conf.json` maps `gen/hearth-assets/` into `Resources/assets/`, and `beforeBuildCommand` runs `cargo build --release && hearth asset bundle --release --out gen/hearth-assets` inside the Tauri crate.

What broke first: bundling from the *library* package (`hearth asset bundle -p hearth-tauri`) produced a manifest whose IDs did not match the binary `cargo tauri build` produced, and the app panicked on the first page (`failed to resolve asset ... in the asset catalog`). The bundle must be produced by scanning the exact binary that ships. `cargo tauri build` rebuilds with the `custom-protocol` feature, so scan the Tauri binary in `beforeBuildCommand`, not a separately built server. A friendlier failure than a render-time panic would help (see framework notes).

`frontendDist` is required by Tauri even though nothing uses it; the example ships a placeholder `dist/index.html`.

## Strict CSP

Tauri's own CSP injection is disabled (`"csp": null`) because Tauri injects CSP only into assets it serves itself. Hearth sends the policy as a response header from a layer, and WKWebView honors headers on custom-scheme responses. A diagnostics script recorded `securitypolicyviolation` events: none in either transport. Hearth's link-time expression modules (`/_hearth/expressions.js`) and the module persistence worker both load under `script-src 'self'`.

The example's scheme page also calls no Tauri IPC, and its capability file grants no permissions. The webview is an ordinary page whose only privileged channel is HTTP to the in-process router.

## Auth and sessions for a single local user

There is no login. Hearth's session machinery (cookie, token hash, session table) adds nothing when the only user is the OS user who launched the app. The example instead:

- installs an `Owner` marker and a constant `hearth::sync::Principal` in request context from a layer, so table scopes (`owner(cx)?`) and delta-sync cursors behave as they do with sessions;
- authorizes scheme requests by the `Trusted` context value, and loopback requests by the launch token cookie;
- uses a constant viewer scope for the browser cache namespace and `OnUnauthorized::Error` (there is no sign-in page to redirect to).

Write validation still matters with one user. The browser runtime is not trusted to produce valid rows: the server trims titles, rejects empty or oversized ones, owns timestamps and checks that a task's list exists. A rejected write (a 250-character title) rolled back in the UI with the normal toast and left no row or changelog entry.

Layer ordering papercut: a layer registered with `path() == None` runs **outside** every layer with a path, including the cookie layer at `/`. The first version used `None` and panicked on `cookies(cx)` with "CookieJarCell was not registered". App layers that read cookies must use `Some(Path::new("/"))` (as `#[layer("/")]` does) and be registered before `.cookies()`.

## Tokio runtime sharing

The shell builds one multi-threaded Tokio runtime and passes it to Tauri with `tauri::async_runtime::set(handle)` before `tauri::Builder::default()`. Hearth's router, Toasty's SQLite driver and Tauri's async tasks all share it. Tauri's main thread runs the native event loop; the scheme handler spawns a task per request. `setup` runs on the main thread and uses `block_on` for the database open, which takes 1-10 ms. A slow migration should move to a task, with the scheme handler waiting on the `OnceCell`.

## App data dir and SQLite

The database is `app_data_dir()/planner.db` (`~/Library/Application Support/dev.usehearth.planner/planner.db`). `open_db` creates the directory and, on a new file, pushes the schema and seeds synthetic data.

Toasty's `push_schema` issues plain `CREATE TABLE` and fails if tables exist, so the example only calls it for a new file. A real desktop app ships schema changes to existing user databases and needs Toasty migrations (`toasty-cli`, `__toasty_migrations`) applied at startup. This is the biggest gap between the example and a shippable app.

## Startup time

Timeline printed by the shell (warm disk cache, existing database):

| Phase | Scheme | Loopback |
| --- | ---: | ---: |
| Tauri setup callback | 81-108 ms | 74 ms |
| Database open | +1-10 ms | +1 ms |
| Router ready | 82-120 ms | 75 ms |
| Window created | 210-312 ms | 220 ms |
| Page load finished | 437-656 ms | 427 ms |
| In page: `hearth:ready` (from navigation start) | 144-216 ms | 255 ms |
| In page: tables synced | 157-241 ms | 268 ms |
| In page: IndexedDB restored | 156-188 ms | never (new origin) |

The Hearth part, from process start to a router serving requests, is under 15 ms in the standalone server (`database open 0.7 ms, router built 1.2 ms, listening 1.4 ms` on an existing file; about 10 ms when creating and seeding it). The rest is Tauri and WebKit. Idle RSS of the app process was about 106 MB, excluding WebKit's helper processes.

## Changelog stub for replication

The example includes the first piece of a sync layer: a durable outbound changelog.

- `changes(seq autoincrement, op_id, table_name, row_key, kind, row JSON, base_revision, at)` gets one row per accepted write.
- `revisions(table_name, row_key, revision)` tracks a per-row local revision. It is kept apart from the synced rows so the browser schema does not change.
- Each table write runs in **one Toasty transaction** with its changelog append. A crash cannot leave a row change without its log entry, or the reverse.
- `GET /_local/changes?after=<seq>` pages through the log (100 per page, `cursor`, `has_more`). A real replicator would read the table in process; the route exists for the test and for inspection.

The headless test verifies that a rejected write logs nothing, that two writes to one row chain base revisions 0 then 1, and that both survive reopening the file.

## Sync design sketch: local Hearth server -> remote

This is a design, not an implementation. It borrows from Daypace (`~/.local/src/simpleplan/packages/planner-core`), whose coordinator implements protocol v2 push/pull/snapshot against a Node SQLite mirror, with generations and per-record revisions. Daypace solved the same problem in TypeScript for a desktop Tauri app; here the coordinator moves into the Rust process that already owns the database.

### Roles

- **Local Hearth server** (in the desktop app): authoritative for the UI. Accepts writes immediately, validated by the same `Table` functions as today. Never waits on the network.
- **Replicator** (a Tokio task in the same process): owns the remote cursor, the outbox and conflict handling. It has its own lock and never holds a database transaction across a network request (Daypace: "local-write mutex is never held over network requests").
- **Remote server**: authoritative for the shared history. It assigns a global sequence number to accepted operations and validates them with its own server-side rules. It can be a Hearth app sharing the same `Table` validation crate.

### Data on the device

| Table | Purpose | Daypace counterpart |
| --- | --- | --- |
| app tables (`lists`, `tasks`) | What the UI reads; local view = remote state + unacknowledged local ops | `pc_records` mirror + optimistic replay |
| `changes` (outbox) | Accepted local ops not yet acknowledged, with `op_id` and `base_revision` | `pc_outbox`, `pc_refs` |
| `revisions` | Per-row revision the next op is based on | record `revision` |
| `sync_meta` (new) | `remote_generation`, `pull_cursor`, `last_sync_at`, device id | `pc_meta` |
| `conflicts` (new) | Quarantined ops with the remote's version, for UI resolution | proposals / quarantine |

### Protocol

1. **Push.** Take the oldest pending ops in `seq` order, at most one in-flight op per row group, and send `push(ops, generation)`. Each op carries `op_id`, table, key, the change (whole row or patch), and `base_revision`. The remote replies per op with `accepted` (and the resulting row and revision), `conflict` (with its current row), or `rejected` (validation). Retries reuse the same `op_id`, so a lost response cannot double-apply.
2. **Pull.** `pull(cursor, limit)` returns remote changes after the cursor, paged. Apply them with "never move a revision backwards" upserts, in one transaction per page together with the new cursor.
3. **Snapshot.** When the cursor is unknown or the remote generation changed (restore, reset, or migration on the server), fetch a paginated snapshot with a stable `snapshot_id`. Stage it, then promote rows, cursor and generation in one transaction.
4. **Generation fence.** Every push names the generation it is based on. A mismatch means the remote history was replaced. Quarantine all pending ops from the old generation rather than replaying them onto unrelated history (Daypace: "known-generation replacement quarantines all pending old-history work").

### Conflicts

Start with Daypace's model: optimistic concurrency per row via `base_revision`. A conflicting op, and every later pending op touching the same rows, moves to `conflicts`, and unrelated rows keep syncing. The UI shows "your change vs. theirs" and resubmits a new op on resolution. Field-level merge (for example, `done` from one device and `title` from another) is an optimization: send patches instead of whole rows and let the remote accept non-overlapping fields. Commands with domain semantics (Daypace's `PlannerCommand`s, such as "complete task") avoid more conflicts than row patches do, at the cost of a reducer on both sides.

### How the browser fits

The browser does not change. It talks to the local router exactly as now. When the replicator applies pulled rows, the next `/_hearth/<table>/load?since=` delta returns them. Hearth's runtime refreshes on focus/online today. For a desktop app, the host should also nudge the page after a pull, either with a Tauri event or by exposing an invalidation stream over the scheme. The browser cache remains a cache: the durable outbox is the device's SQLite database, which is why IndexedDB does not need to become an offline write queue.

### What Hearth would need

- A supported hook for "write accepted" so apps do not hand-write `changes::record` in every table function. Something like `#[table(..., on_write = record_change)]` called inside the write transaction, or a transaction-scoped `cx` handle so the app's write functions and the hook share one transaction.
- A changelog-backed delta source for `routes!`. The current delta sync scans and hashes the scoped table. With a `changes` table it could answer `since=<seq>` directly, which is also what a remote replica would serve.
- A server-to-page invalidation primitive that works over the custom scheme (for example a long-poll route), since WebSockets do not.

## Framework changes needed

None were required for the example. Small changes that would help, in order of value:

1. **Document the embedding pattern** (`Router::handle_with` from a host, strip `Accept-Encoding`, buffer the body). It already works; it is just not written down.
2. **Asset-mismatch error at startup, not at render.** `AssetBundle::load*` could compare the manifest against the binary's embedded asset IDs and fail with "bundle was produced from a different binary". Today the first page panics in the renderer.
3. **`AssetBundle::load()` fallback for macOS app bundles** (`../Resources/assets`), or document `load_dir` with Tauri's `resource_dir`.
4. **Layer path semantics.** Make the "pathless layers run outside path layers" rule prominent in the `Layer` docs, or give a clear error when a layer touches cookies before `CookieLayer` runs.
5. **Write hook / transaction access for `Table` writes** (see the sync section).
6. **Live query aggregates in expressions.** A `live_query!` handle cannot be read as a value in `$()` (no `.len()`), so "3 tasks left" needs a second keyed list or a workaround. The example dropped the count.
7. **`&&` in runtime expressions.** `if a && b { ... }` in an event handler is a compile error ("unsupported operator"); nested `if`s work.

## What was verified and what was not

Verified:

- GUI, WKWebView, custom scheme: page renders (screenshots captured during the run; not committed), runtime hydrates, tables sync, zero CSP violations, IndexedDB restores on relaunch.
- GUI writes: an in-page smoke script (`HEARTH_TAURI_SMOKE=1`) typed a task and submitted it through the real form, saw it optimistically in the next frame (8 ms), and toggled another task. Both rows were in SQLite with changelog entries, and both were present after quitting and relaunching.
- GUI, loopback transport: page renders and syncs, zero CSP violations.
- `cargo tauri build --bundles app` produces `Hearth Planner.app`, which runs from its bundle with assets from `Resources/assets`.
- Browser (Chromium) over loopback: insert, toggle, list switch, delete, rejected-write rollback with toast, zero CSP violations.
- Headless tests (`cargo test --release -p hearth-tauri`): in-process writes, validation, durability across reopen, changelog chaining and paging, launch-token enforcement over real TCP. The token test fails if the cookie check is removed.

Not verified:

- Real mouse and keyboard input in the Tauri window. Synthetic OS events did not reach the window from this environment (likely missing Accessibility permission), so GUI writes went through DOM events in the page instead.
- Windows (WebView2, `http://hearth.localhost` origin) and Linux (WebKitGTK).
- Code signing, notarization, auto-update, and a stripped or size-optimized build.
- Schema migrations on an existing user database.
- Any part of the remote sync beyond the local changelog.

## Papercuts

- `cargo tauri` on this machine was `tauri-cli 2.0.0-beta.1`. Use a current 2.x CLI (`cargo install tauri-cli --version ^2 --locked`, about 15 minutes to compile).
- The first Tauri build of the shell took about 17 minutes (cold dependency tree); incremental builds take 13-40 s. Keeping the shell in its own Cargo workspace keeps that tree out of the main lock file and CI.
- `tauri::generate_context!` rejects a non-RGBA icon with a proc-macro panic. Run `cargo tauri icon` on the source PNG.
- Asset bundles are tied to one exact binary (see above); `cargo tauri build` rebuilds with different features.
- Layers with `path() == None` cannot read cookies (see above).
- Pages declared with `#[page]` in a submodule of `module_router!()` mount at the module's path (`/app`), not `/`. Use `#[page("/")]` for a root page defined in a submodule.
