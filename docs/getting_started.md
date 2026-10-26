# Getting started

Create a Hearth app and run it locally with automatic updates as you edit.

Registry publication is in progress. Until the complete crate family is indexed on crates.io, use the source-checkout instructions in the [project README](https://github.com/wbunting/hearth#try-it-today). The registry commands below describe the installation flow after publication.

## Create a new project

Create a Cargo binary project:

```sh
cargo new hello-world
cd hello-world
```

Add `hearth` and `tokio`:

```sh
cargo add hearth
cargo add tokio --features rt-multi-thread,macros
```

Replace `src/main.rs` with:

```rust,standalone_crate
use hearth::{
    Result,
    router::{module_router, page},
    view::{View, component, view},
};

#[tokio::main]
async fn main() {
    hearth::start(module_router!().build()).await.unwrap();
}

#[page]
async fn home() -> Result<impl View> {
    Ok(view! {
        <!DOCTYPE html>
        <html>
            <head>
                <title>"Hello world"</title>
                hearth::dev::script()
            </head>
            <body>
                hello(name: "World")
            </body>
        </html>
    })
}

#[component]
async fn hello(name: &str) -> Result<impl View> {
    Ok(view! {
        <h1>"Hello, " (name) "!"</h1>
    })
}
```

`module_router!()` uses its enclosing module as `/`, so the `home` page above serves `/`. To add `/about`, declare `mod about;` in `main.rs` and put a `#[page]` handler in `src/about.rs`. See the [module routing guide](crate::router::module_router) for nested modules, layouts, and path parameters.

Run `cargo run` to serve the app at <http://127.0.0.1:3000>. For automatic rebuilds while you work, install the Hearth CLI.

## Install the CLI

Install the CLI from crates.io:

```sh
cargo install hearth-cli
```

Make sure Cargo's binary directory is on your `PATH` so you can run `hearth`. You can also invoke it as `cargo hearth`.

## Start the dev server

From the project root:

```sh
hearth dev
```

The dev server builds and starts the app, then rebuilds it when source files change. Pages that include `hearth::dev::script()` update when the new build is ready. Press `r` in the terminal to rebuild manually.

Open <http://127.0.0.1:3000> and you should see **Hello, World!**.

To override the bind address, set `HOST` and `PORT` before running:

```sh
HOST=0.0.0.0 PORT=8080 hearth dev
```

## Improving build times

For ways to reduce rebuild times, see the Cargo book's [build performance chapter](https://doc.rust-lang.org/cargo/guide/build-performance.html).

## Where to next

Choose your next topic from the [guide index](https://github.com/wbunting/hearth/tree/main/docs).
