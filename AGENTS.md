# Agent instructions

Read [`llms.txt`](llms.txt) for Hearth's APIs and application conventions. Consult the relevant linked guide before changing a feature, and update `llms.txt` when its guidance is affected.

- Unsafe code is not allowed.
- Macro-body formatters live behind each grammar crate's `pretty` feature and are used by `hearth fmt`.
- Runtime expressions must behave consistently in Rust and JavaScript. Use `crates/hearth-runtime/coherence` to check parity; see [`docs/runtime/coherence.md`](docs/runtime/coherence.md).
