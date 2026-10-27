<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/wbunting/hearth/f1c8ab7ee0e68ee42cfd285be4847b7717b2b71c/docs/hearth/brand/hearth-banner-dark.png">
    <img src="https://raw.githubusercontent.com/wbunting/hearth/f1c8ab7ee0e68ee42cfd285be4847b7717b2b71c/docs/hearth/brand/hearth-banner.png" alt="Hearth. Local-first web apps. Authored in Rust." width="100%">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/wbunting/hearth/actions/workflows/ci.yml"><img src="https://github.com/wbunting/hearth/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://github.com/wbunting/hearth/blob/main/rust-toolchain.toml"><img src="https://img.shields.io/badge/Rust-1.99.1-2D2B26?style=flat-square&amp;labelColor=44443C" alt="Rust toolchain 1.99.1"></a>
  <a href="#status"><img src="https://img.shields.io/badge/status-experimental-BF512D?style=flat-square&amp;labelColor=44443C" alt="Status: experimental"></a>
  <a href="https://github.com/wbunting/hearth/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-56734C?style=flat-square&amp;labelColor=44443C" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://github.com/wbunting/hearth/blob/main/docs/getting_started.md">Getting started</a> &nbsp; / &nbsp;
  <a href="https://github.com/wbunting/hearth/tree/main/examples/hearth-tracker">Issue tracker</a> &nbsp; / &nbsp;
  <a href="https://github.com/wbunting/hearth/tree/main/docs">Guides</a> &nbsp; / &nbsp;
  <a href="https://github.com/wbunting/hearth/blob/main/CONTRIBUTING.md">Contributing</a>
</p>

# Your app is Rust. The browser still speaks JavaScript.

Hearth is an experimental full-stack web framework for local-first applications. Write the views, interactions, data declarations and server logic in Rust. Hearth renders the first view as HTML, compiles client expressions to JavaScript functions, and runs live queries against a small database in the browser. No separate JavaScript application. No client WebAssembly runtime.

## What we are building toward

1. **Author the application in pure Rust.** One language for components, routes, interactive handlers, table declarations and write validation. JavaScript belongs inside the framework, not in a second app you maintain.
2. **Compile the interactive UI to JavaScript.** Following [Topcoat's](https://github.com/tokio-rs/topcoat) approach, Rust-authored client expressions become JavaScript functions. The server renders useful HTML first; the browser takes over reactive updates without downloading a Rust WebAssembly application.
3. **Make local-first a built-in capability.** Declare tables and queries in Rust. Filter, sort and join browser-local data, render keyed lists, and apply optimistic writes. The server authorizes reads and validates writes; the browser rolls back rejected changes.
4. **Make performance hard to match.** Native Rust request handling, server-rendered startup, indexed local queries and a small JavaScript runtime are the foundation. Avoid a client WASM download and Rust-to-JavaScript interop on the UI path, and avoid a server round trip for each filter or toggle. The goal is excellent end-to-end performance, not just a fast hello-world benchmark.

The architecture is built for a high performance ceiling: a native Rust server rather than a JavaScript server runtime, and direct JavaScript execution in the browser. That is a design choice, not a claim that every Rust app beats every JavaScript app. Comparative results need equivalent workloads and reproducible measurements; see the [benchmark methodology](https://github.com/wbunting/hearth/blob/main/benchmarks/localfirst/run.md).

## One app, two places to run

```text
                       Your Rust application
                   views + expressions + tables
                              |
               +--------------+--------------+
               |                             |
          Native server                  Browser
          first-view HTML                generated JS functions
          scoped database reads          indexed local queries
          write validation               optimistic UI updates
               |                             |
               +----- authoritative sync ----+
```

Hearth uses an indexed JavaScript store in the browser, not browser-side SQLite or WebAssembly. A worker persists authoritative server rows in `IndexedDB`. A shared query representation drives both server evaluation and browser live results. Client code is delivered as content-addressed JavaScript modules, with captured values kept separate from executable code.

## A reactive page, written in Rust

The counter below renders on the server. Its button then updates the browser locally. The application contains no JavaScript.

```rust,no_run
use hearth::{
    Result,
    asset::{AssetBundle, RouterBuilderAssetExt},
    context::Cx,
    router::{module_router, page},
    runtime::{RouterBuilderRuntimeExt, signal},
    view::{View, view},
};

#[tokio::main]
async fn main() -> Result<()> {
    let router = module_router!()
        .assets(AssetBundle::load()?)
        .runtime()
        .build();
    hearth::start(router).await?;
    Ok(())
}

#[page]
async fn home(cx: &Cx) -> Result<impl View> {
    let count = signal(cx, || 0usize);
    Ok(view! {
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <title>"A little Hearth app"</title>
                hearth::runtime::script()
            </head>
            <body>
                <button @click=$(|_event| count.increment())>
                    "Count: "$(count.get())
                </button>
            </body>
        </html>
    })
}
```

### Take the same idea to your data

- **`#[derive(Table)]`** describes the browser-facing row, its key and indexes, its required read scope, and its permitted writes. Mark server-only fields with `#[skip]`.
- **`live_query!`** declares filters, joins, ordering and projections once. The first render uses the server; later interactions query local tables.
- **`for row in $(query)`** renders a live keyed list. **`if $(condition)`** switches regions in the browser.
- **`table_handle::<T>()`** makes optimistic writes from Rust-authored event handlers. The Rust server remains authoritative.

The [issue tracker](https://github.com/wbunting/hearth/tree/main/examples/hearth-tracker) puts this together: search, filters, detail navigation, comments and edits. Its application code is Rust. The [live demo](https://demo.usehearth.dev) is a Hearth application, with a smaller interactive query/write example. The [static website and guides](https://usehearth.dev) are served from Cloudflare Pages.

## Try it today

**Hearth 0.1.0 is available on crates.io.** Use **Rust 1.99.1** (the tested toolchain). A new application does not need Node.js or pnpm.

```sh
rustup toolchain install 1.99.1
cargo new my-hearth-app
cd my-hearth-app
rustup override set 1.99.1
cargo add hearth@=0.1.0
cargo add tokio --features rt-multi-thread,macros
cargo install hearth-cli --version 0.1.0 --locked
```

Replace `src/main.rs` with the reactive counter above, then build, bundle and run:

```sh
cargo build --release
hearth asset bundle --release
cargo run --release
```

Open <http://127.0.0.1:3000>. Make sure Cargo's binary directory is on your `PATH` so `hearth` and `cargo hearth` are available. See the [setup guide](https://github.com/wbunting/hearth/blob/main/docs/getting_started.md) for a static first page and development-server workflow.

### Run the live demo from source

Use **pnpm 10.20.0** when rebuilding the framework's own browser packages:

```sh
git clone https://github.com/wbunting/hearth.git
cd hearth
pnpm install --frozen-lockfile
pnpm build:runtime
cargo build --locked --release -p hearth-cli -p hearth-site
./target/release/hearth asset bundle --release -p hearth-site
PORT=3620 ./target/release/hearth-site
```

Open <http://127.0.0.1:3620>. This builds the real Rust demo from source. The static landing page and guides live in `web/`; see [hosting](https://github.com/wbunting/hearth/blob/main/docs/deployment.md). Deploy applications with the assets from the same build as their binary.

## Status

**Experimental.** APIs can change. Hearth is intended for builders willing to test the model, report rough edges and help shape it.

- Browser expressions support a defined Rust vocabulary, not arbitrary Rust code. See [expressions](https://github.com/wbunting/hearth/blob/main/docs/runtime/expr.md).
- Table scopes and write validation are security boundaries. Browser state is not authorization. See [tables](https://github.com/wbunting/hearth/blob/main/docs/hearth/tables.md).
- Persistence caches server rows. Pending writes are **not a durable offline queue**, and delta sync currently scans scoped server tables. See [persistence](https://github.com/wbunting/hearth/blob/main/docs/hearth/persistence.md).
- Compiled expression paths support strict CSP without `unsafe-eval`. App-authored inline styles and arbitrary raw HTML streaming have separate constraints. See [strict CSP](https://github.com/wbunting/hearth/blob/main/docs/hearth/strict-csp.md).

The docs.rs build for `0.1.0` is blocked by a stale intra-doc link; a patch release is needed to restore hosted API documentation. The source guides linked below remain available.

## Explore

| Start here | What you will find |
| --- | --- |
| [Getting started](https://github.com/wbunting/hearth/blob/main/docs/getting_started.md) | Pages, components and the development CLI |
| [Runtime expressions](https://github.com/wbunting/hearth/blob/main/docs/runtime/expr.md) | How Rust-authored interactions execute in the browser |
| [Tables and permissions](https://github.com/wbunting/hearth/blob/main/docs/hearth/tables.md) | Browser data declarations and server authorization |
| [Issue tracker](https://github.com/wbunting/hearth/tree/main/examples/hearth-tracker) | A complete local-first application |
| [Contributing](https://github.com/wbunting/hearth/blob/main/CONTRIBUTING.md) | Development setup and contribution guidance |

## Credits and license

Hearth is derived from [Topcoat v0.10.0](https://github.com/tokio-rs/topcoat), created by Julien Scholz. Its Rust-to-JavaScript expression model is an important foundation of this framework. The original MIT copyright and license are preserved in [LICENSE](https://github.com/wbunting/hearth/blob/main/LICENSE) and [NOTICE](https://github.com/wbunting/hearth/blob/main/NOTICE). Third-party assets retain their respective license notices.
