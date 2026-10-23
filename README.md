# fastcoat

Experiment: write the whole app in Rust with [Topcoat](https://github.com/tokio-rs/topcoat),
and use [TanStack DB](https://tanstack.com/db) (no React) as the client-side reactive store.
Test app: a zbugs (Zero's Linear/Jira clone) schema in Toasty/SQLite.

See [PLAN.md](PLAN.md) for the design and phases, and [RESULTS.md](RESULTS.md) for measurements.

## Run

```sh
cargo install topcoat-cli --version 0.10.0 --locked   # needs rustc 1.99 (pinned in rust-toolchain.toml)
pnpm install && pnpm build:client                      # client/dist/fastcoat.js
cargo run -p zbugs --release -- seed                   # 516 real zbugs issues
cargo run -p zbugs --release -- seed --synthetic 50000 # or add 50k synthetic
PORT=3100 topcoat dev -r -p zbugs                      # http://127.0.0.1:3100
```

After `pnpm build:client`, touch a `.rs` file so `topcoat dev` re-bundles assets.
`/issues?mode=ssr` renders rows on the server; `/issues?mode=local` renders a shell and lets the client fill it.

## Layout

- `apps/zbugs`: Topcoat app (models, auth/read scope, JSON routes, pages, seed)
- `client`: Vite library build; TanStack DB collections, keyed list renderer, P0 issue list
- `bench`: in-page probes
