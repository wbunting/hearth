[Tailwind CSS](https://tailwindcss.com) generates CSS from the utility classes in your markup, such as `flex` and `text-center`.

Hearth runs the standalone Tailwind CLI from a Cargo build script. The generated stylesheet is bundled as a Hearth [asset](crate::asset).

# Setup

Enable the `tailwind` feature for both your runtime dependency and your build dependency:

```toml
[dependencies]
hearth = { version = "0.1.0", features = ["tailwind"] }

[build-dependencies]
hearth = { version = "0.1.0", default-features = false, features = ["tailwind"] }
```

Add a `build.rs` next to `Cargo.toml`:

```rust,no_run
# #[allow(clippy::needless_doctest_main)]
fn main() {
    hearth::tailwind::BuildConfig::new().render().unwrap();
}
```

Then link the generated stylesheet from your layout:

```rust,ignore
use hearth::{
    Result,
    router::{Slot, layout},
    tailwind,
    view::{View, view},
};

#[layout]
async fn layout(slot: Slot<'_>) -> Result<impl View> {
    Ok(view! {
        <!DOCTYPE html>
        <html>
            <head>
                <link rel="stylesheet" href=(tailwind::stylesheet!())>
            </head>
            <body>
                (slot)
            </body>
        </html>
    })
}
```

[`stylesheet!`](stylesheet) returns the generated CSS as an asset. `hearth dev` bundles it after each successful build. For a manual build, run:

```sh
hearth asset bundle
```

At runtime, load the asset bundle on the router:

```rust,no_run
use hearth::{
    asset::{AssetBundle, RouterBuilderAssetExt},
    router::{RouterBuilderDiscoverExt, module_router},
};

let router = module_router!()
    .discover()
    .assets(AssetBundle::load().unwrap())
    .build();
```

# Build flow

Call [`BuildConfig::render`] from `build.rs`. By default, it downloads a pinned Tailwind CLI release, scans the package for classes, and writes minified CSS to `$OUT_DIR/tailwind.css`. Downloads are cached across workspace builds.

The default input is:

```css
@import "tailwindcss";
```

Cargo provides the environment variables used by the defaults. To run outside a build script, configure the executable, input, output, and working directory explicitly.

# CLI executable

By default, Hearth downloads the Tailwind CLI from GitHub. `BuildConfig` offers alternatives:

- `version("4.3.2")`: pin the release to download.
- `version_checksum("4.3.2", "sha256:b800b065...")`: additionally verify the downloaded binary's hash. The prefix selects the algorithm; only `sha256` is supported.
- `executable("tailwindcss")`: use a preinstalled CLI instead of downloading. A bare name is resolved through `PATH`; relative paths resolve against the package root.
- `executable_env("TAILWIND_CLI")`: like `executable`, with the value read from an environment variable at build time.

A configured executable is used without downloading a copy.

# Class scanning

Tailwind scans files from the package root by default. It finds literal class names in Rust source, including `view!` markup. It cannot detect class names assembled at runtime.

Exclude build output with `.gitignore` so Tailwind does not scan generated files or stale class names. If you cannot rely on an ignore file, narrow the scan with `.cwd("src")`.

For precise control, use a custom input CSS file with Tailwind source directives. For example, an input file at the package root can scan only Rust files:

```css
@import "tailwindcss" source(none);

@source "./src/**/*.rs";
```

# Custom input CSS

The generated input is enough for default Tailwind output. Use `input(...)` when you need custom CSS, theme values, plugins supported by the standalone CLI, or Tailwind source directives:

```rust,no_run
# #[allow(clippy::needless_doctest_main)]
fn main() {
    hearth::tailwind::BuildConfig::new()
        .input("src/styles/app.css")
        .render()
        .unwrap();
}
```

Example input:

```css
@import "tailwindcss";

@theme {
  --font-sans: Inter, sans-serif;
}
```

# Rebuild behavior

[`BuildConfig::render`] emits `cargo::rerun-if-changed` on every run for the input CSS, local CSS imports (including transitive imports), and the directories Tailwind scans. You do not need to list source directories in `build.rs`, even when another build step emits its own Cargo directives. `executable_env(name)` also emits `cargo::rerun-if-env-changed` for that variable.

Paths in `@source` and `source("...")` are relative to the stylesheet that declares them, including imported stylesheets. `source(none)` disables the default package scan. `@source inline(...)` supplies literal classes, not filesystem paths, so changes to it are covered by the stylesheet watch. Negated sources do not add watches.

Cargo cannot watch globs or apply Tailwind's ignore rules to directory watches. A source glob therefore watches its fixed directory prefix recursively. For example, `@source "../views/**/*.rs"` watches `../views`, including new files and directories. This can rebuild CSS when a nonmatching file in that directory changes.

Directory watches exclude `target/`, Cargo's build output directory, the configured CSS output, and dependency and Git metadata directories. When a scan root contains these directories, Hearth watches its existing files and safe subdirectories instead of the root. New files inside watched subdirectories are detected. If you add a new top-level source directory to a split root, rerun the build script once (for example, by touching the input CSS), or declare that directory with `@source`. An explicitly declared source prefix that does not exist yet is watched directly so its creation is detected. Cargo reruns build scripts while watched paths are missing, so create source directories before building to avoid repeated runs.

Package imports with custom CSS entry points are tracked conservatively at the package directory level. Dependencies loaded dynamically by JavaScript plugins may need additional `cargo::rerun-if-changed` directives in your build script. Do not watch a directory containing `target/` or another build output directory. Cargo scans explicitly watched directories recursively without applying `.gitignore`, which can cause repeated rebuilds.
