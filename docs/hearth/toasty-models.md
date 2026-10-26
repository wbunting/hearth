# Toasty model registration and recursion limits

Hearth uses crates.io Toasty 0.11 without a fork. Register all models in the current crate with `toasty::models!(crate::*)`, or name the models explicitly with `toasty::models!(crate::model::User, crate::model::Session)`. An explicit list must include every model needed by the database, except models registered transitively through model fields.

## Workarounds

If rustc reports a macro recursion limit, put this inner attribute at the root of the affected crate (`src/lib.rs` or `src/main.rs`), not in the module containing the call:

```rust
#![recursion_limit = "256"]
```

This raises the expansion limit for that crate. It is not a model-count setting and may need to be higher for a deeply nested invocation.

Listing models explicitly is another option when diagnosing a wildcard-discovery problem. For example, replace `toasty::models!(crate::*)` with `toasty::models!(crate::model::User, crate::model::Session)`. Keep the list current when adding models. Explicit lists themselves recurse once per entry in Toasty 0.11, so a large list can also require the crate-root attribute.

## Measured behavior

With crates.io `toasty = "=0.11.0"`, rustc 1.99.1, edition 2024, independent models containing only `#[key] id: String`, and a direct call in `main`:

| Registration | Default limit (128) | Limit 256 |
| --- | --- | --- |
| `crate::*` | Compiles at 1, 7, 64, 125-128, 256, and 512 models | Not needed for these cases |
| Explicit list | Compiles at 127 models; fails at 128 | Compiles at 128 models |

The model-count fixture does not reproduce a wildcard-discovery failure. Both explicit registration and `crate::*` compile for the small application schema used in the reproduction. There is no measured wildcard model-count threshold to report.

The reproduced failure is upstream in `toasty/src/schema/register.rs`, in the exported `macro_rules! models`, not in `toasty-macros` or a Hearth/Hearth macro. Each explicit entry expands `models!(@internal ...)` for the remaining entries. The outer call plus 128 entries exceeds the default limit. The wildcard arm instead calls `DiscoverItem::add_all_from_crate_to`, which scans inventory at runtime. Model derives submit inventory items independently; wildcard expansion depth does not grow with the number of models.

## Minimal standalone reproduction

Create a crate outside this workspace with only the Toasty dependency:

```sh
cargo new --bin toasty-recursion
cd toasty-recursion
cargo add toasty@=0.11.0
```

Generate `src/main.rs` with N distinct models. This uses no Hearth dependencies or macros:

```sh
python3 - 128 <<'PY'
import sys
from pathlib import Path
n = int(sys.argv[1])
models = "\n".join(
    f"#[derive(toasty::Model)] pub struct M{i} {{ #[key] pub id: String }}"
    for i in range(n)
)
registration = ", ".join(f"M{i}" for i in range(n))
Path("src/main.rs").write_text(
    models + f"\nfn main() {{ let _ = toasty::models!({registration}); }}\n"
)
PY
cargo check --release
```

At N=128 this reports `recursion limit reached while expanding $crate::models!`. Regenerate with N=127 to compile. Prepending `#![recursion_limit = "256"]` makes N=128 compile. Replacing the generated registration list with `crate::*` also compiles at N=128 and N=512 with the default limit. Additional enclosing macros can change the available expansion depth.

The regression fixtures run with `cargo test --locked -p hearth --test toasty_models --test toasty_models_recursion_limit`. They verify wildcard discovery at the default limit, a selected explicit subset, and the crate-root limit workaround for all 128 explicit models. They compare registered model IDs, not just successful compilation. Removing the attribute from the raised-limit fixture reproduces the compile failure.
