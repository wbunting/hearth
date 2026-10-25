Title: models! with 128 explicit entries exceeds the default macro recursion limit

Using crates.io `toasty = "=0.11.0"`, rustc 1.99.1, edition 2024, a direct `toasty::models!(M0, ..., M127)` invocation fails with `recursion limit reached while expanding $crate::models!`. The same fixture with 127 entries compiles. No Hearth or Topcoat dependency is required.

Repro:

```sh
cargo new --bin toasty-recursion
cd toasty-recursion
cargo add toasty@=0.11.0
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

Expected: model registration compiles without requiring a higher crate recursion limit.

Actual: compilation fails while expanding `$crate::models!`, and rustc suggests `#![recursion_limit = "256"]`.

The `macro_rules! models` implementation in `toasty/src/schema/register.rs` consumes one explicit entry per recursive `@internal` invocation. Raising the crate-root recursion limit to 256 makes the 128-entry fixture compile. `toasty::models!(crate::*)` also compiles at the default limit, including with 512 models; it uses runtime inventory discovery. Could the explicit-list expansion avoid linear macro recursion or document this limitation?

This was investigated following a downstream report involving `crate::*`, but that specific wildcard symptom was not reproduced, including with the downstream seven-model schema copied unchanged into the standalone crate. This issue is only about the reproducible explicit-list case.
