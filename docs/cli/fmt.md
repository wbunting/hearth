`hearth fmt` formats Hearth macro bodies in Rust source files. Add `--rustfmt` to format the surrounding Rust code too.

# Running the formatter

Run the formatter with:

```sh
hearth fmt
```

You can also run `cargo hearth fmt`. Use `hearth fmt` in editors to avoid starting Cargo for each format request.

With no file arguments, the command scans Rust files under the current directory and writes changes in place.

```sh
hearth fmt src/main.rs src/app
```

Pass file or directory paths to limit the files to format. The command searches directories recursively for Rust files.

Use `--check` to check formatting without writing files. The command reports each file that needs formatting on stderr and exits with status 1 if any input needs formatting or cannot be formatted. It exits with status 0 when all inputs are already formatted.

```sh
hearth fmt --check
hearth fmt --check --rustfmt src
```

For editor integrations and other tools, use stdin/stdout mode:

```sh
hearth fmt --stdin < src/main.rs > /tmp/main.rs
```

In stdin mode, the formatted source is written to stdout instead of updating files on disk.

With `--stdin --check`, the command checks the input without emitting formatted source. Diagnostics go to stderr, with the same exit statuses as file checks.

Pass `--rustfmt` to run `rustfmt` first, then format Hearth macro bodies:

```sh
hearth fmt --rustfmt
hearth fmt --stdin --rustfmt < src/main.rs > /tmp/main.rs
```

This requires `rustfmt` on `PATH`. Install it with `rustup component add rustfmt`. Both formatters must succeed before a file is written or the formatted stdin is emitted. Errors go to stderr and cause a nonzero exit status.

Note that you must specify the Rust edition manually in **`rustfmt.toml`** (project root):
```toml
edition = "2024"
```

By default, the formatter handles all supported macros. Pass a comma-separated list with `--macros` to format only those macros:

```sh
hearth fmt --macros view,class
```

# Supported syntax

Without `--rustfmt`, the formatter changes only supported macro bodies. For example, it formats the HTML inside `view!`:

```rust
// src/app.rs
use hearth::{router::page, view::{View, view}};

#[page]
async fn page() -> hearth::Result<impl View> {
    Ok(view! {
        <main>
            <h1>"Hello"</h1>
        </main>
    })
}
```

Macros are identified by their names at the call site. A macro imported or re-exported under a different name will not be formatted.

# Editor integration

## rust-analyzer (VS Code, Helix, Zed, etc.)

Add the two files to your project root.

1. `rustfmt.toml`
   ```toml
   edition = "2024"
   ```

2. `rust-analyzer.toml`
   ```toml
   [rustfmt]
   overrideCommand = ["hearth", "fmt", "--stdin", "--rustfmt"]
   ```

## Neovim

This Neovim config uses `conform.nvim` and enables `hearth fmt` for Rust buffers only when a `Hearth.toml` marker exists in the project root.

```lua
require("conform").setup({
	formatters = {
		hearth = {
			command = "hearth",
			args = { "fmt", "--stdin" },
			require_cwd = true,
			cwd = function(self, ctx)
				return require("conform.util").root_file({ "Hearth.toml" })(self, ctx)
			end,
		},
	},
	formatters_by_ft = {
		rust = { "hearth", lsp_format = "first" },
	},
})
```

Create a `Hearth.toml` marker at the root of a Hearth project to opt in:

```sh
touch Hearth.toml
```
