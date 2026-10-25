# Hearth

Local-first web applications written in Rust. Hearth renders the first view on the server, then runs compiled client expressions, indexed live queries and optimistic writes in the browser. It is experimental.

```rust,no_run
use hearth::{
    Result,
    router::{module_router, page},
    view::{View, view},
};

#[tokio::main]
async fn main() {
    hearth::start(module_router!().build()).await.unwrap();
}

#[page]
async fn home() -> Result<impl View> {
    Ok(view! { <h1>"Hello from Hearth"</h1> })
}
```

The default features include server routing, views, runtime expressions and local-first tables. Use `hearth::Table`, `hearth::live_query!`, and `hearth::table_handle` for browser-synced data. Every table requires a server read scope; writable fields and validation are explicit. Client expressions compile to JavaScript, not WebAssembly.

Use `hearth-cli` for development, asset bundling, component installation and macro formatting. Applications and their asset bundle must come from the same build.

See the guides in the source repository and the runnable `site` and `examples/hearth-tracker` applications. `IndexedDB` persists authoritative server rows; pending writes are not a durable offline queue.

Hearth is derived from [Topcoat v0.10.0](https://github.com/tokio-rs/topcoat), copyright (c) 2026 Julien Scholz. The MIT license and attribution are retained in LICENSE and NOTICE.

## Website and release

The website in `site/` is a Rust application using the same Hearth crate as other apps. See [running the site](site/README.md) and [release verification](docs/releasing.md). Registry publication is pending; do not assume `cargo add hearth` is available until the release has been confirmed.
