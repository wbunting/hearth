# hearth-tauri

A small planner (lists and tasks) whose Hearth server runs inside a Tauri 2 desktop app, over a SQLite file in the app data directory. There is no remote server. Findings, numbers and the sync design are in [docs/hearth/tauri.md](../../docs/hearth/tauri.md).

The app is ordinary Hearth: `#[derive(Table)]` rows, `live_query!`, client keyed lists, optimistic writes validated in Rust, and IndexedDB persistence. Every accepted write also appends to a durable `changes` table, the seam a future replicator would read.

## Layout

| Path | What it is |
| --- | --- |
| `src/lib.rs` | Router, database open and seed, the two transports (`handle_in_process`, `serve_loopback`) |
| `src/app.rs` | The page |
| `src/tables.rs` | Synced tables and write validation |
| `src/auth.rs` | Single-user local auth: trusted in-process requests or a per-launch token cookie |
| `src/changes.rs` | Outbound changelog and `GET /_local/changes` |
| `src/main.rs` | The same app in a normal browser over loopback |
| `src-tauri/` | Tauri shell. A separate Cargo workspace so Tauri stays out of the main lock file |
| `tests/` | Headless checks of both transports, durability and the changelog |

## Run in a browser (no Tauri)

From the repository root, with the pinned toolchain:

```sh
cargo build --release -p hearth-cli -p hearth-tauri
./target/release/hearth asset bundle --release -p hearth-tauri
./target/release/hearth-tauri-server /tmp/hearth-tauri/planner.db
```

Open the printed `http://127.0.0.1:<port>/_local/enter?token=...` URL. Without the token every request returns 401.

## Run the desktop app

Install a current Tauri 2 CLI (`cargo install tauri-cli --version "^2" --locked`). The first build compiles Tauri's dependency tree and takes several minutes.

```sh
cd examples/hearth-tauri/src-tauri
cargo build --release
../../../target/release/hearth asset bundle --release
./target/release/hearth-tauri-app
```

The asset bundle must be produced from the binary you run, so bundle inside `src-tauri`. The database is `~/Library/Application Support/dev.usehearth.planner/planner.db` on macOS. Delete it to reseed.

Environment:

- `HEARTH_TAURI_TRANSPORT=loopback` serves on a random loopback port with a launch token instead of the `hearth://` custom scheme.
- `HEARTH_TAURI_SMOKE=1` injects a script that adds a task and toggles one through the real UI, then logs the result.

The shell prints a startup timeline. `src/diag.js` reports runtime marks, CSP violations and IndexedDB status from the page to stderr.

## Build the .app

```sh
cd examples/hearth-tauri/src-tauri
PATH="$PWD/../../../target/release:$PATH" cargo tauri build --bundles app
```

`beforeBuildCommand` builds the shell and bundles its assets into `gen/hearth-assets`. Tauri copies them to `Contents/Resources/assets`, where the shell loads them.

## Test

```sh
cargo test --release -p hearth-tauri
cargo test --release -p hearth-tauri --test transport_latency -- --ignored --nocapture
```
