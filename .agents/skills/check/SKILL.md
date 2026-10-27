---
name: check
description: Always use this skill to verify a change locally before committing or opening a pull request in the Hearth repository
---

# Verifying a change

Keep this file synchronized with `.github/workflows/ci.yml`. Use release builds.

## Rust

```sh
cargo test --locked --release -p hearth -p hearth-macro -p hearth-view-grammar -p hearth-runtime -p hearth-router -p hearth-tailwind -p hearth-cli
cargo test --locked --release -p hearth-runtime-grammar
cargo test --locked --release -p hearth-runtime-macro --test csp --test expr
cargo test --locked --release -p hearth-tracker -p hearth-site
cargo test --locked --release -p hearth-font -p hearth-font-grammar -p hearth-font-macro
cargo clippy --locked --release -p hearth-font -p hearth-font-grammar -p hearth-font-macro --all-targets -- -D warnings
cargo build --locked --release -p hearth-tracker -p hearth-site
cargo clippy --locked --release -p hearth -p hearth-macro -p hearth-tracker -p hearth-site -p hearth-router -p hearth-tailwind -p hearth-cli -- -D warnings
python3 scripts/release.py check
```

Use nightly rustfmt for changed Rust files. Macro-body formatting is provided by `cargo run --release -p hearth-cli -- fmt`. Rebuild the CLI after changing its grammars. Do not run unrelated all-workspace rewrites as part of a narrow change.

## Browser runtime

```sh
pnpm install --frozen-lockfile
cd crates/hearth-runtime/browser
pnpm exec tsc --noEmit
pnpm test
pnpm build
git diff --exit-code -- dist/index.js dist/coherence.js dist/persist.js
```

Include rebuilt committed bundles when runtime source changes. Compare the no-drift check after committing the intended regenerated output, not against stale bundles from before the change. The repository uses pnpm, not yarn.

## Release verification

```sh
python3 scripts/release.py package
python3 scripts/package-smoke.py --build
```

The package smoke test uses actual `.crate` archives in a temporary sparse registry. It builds an independent app with versioned dependencies, installs the CLI, and bundles the app's assets. No workspace patches or source path dependencies are used. Run and exercise that app in a browser before publishing. Passing this check does not establish actual crates.io authentication or publication.

For user-visible work, exercise the real application on desktop and mobile. Verify browser errors, CSP, query results, persisted writes and rollback where affected. Unit tests alone do not establish the user flow works.

## Static site and hosting

Use Zola 0.23.6, then run `pnpm --filter @hearth/site build`, followed by `pnpm --filter @hearth/site test` after installing the Playwright Chromium browser. The static build checks every generated internal link and asset. Python regressions cover Rustdoc symbol links, hidden doctest lines and code preservation. Browser checks exercise no-JavaScript mobile/desktop navigation.

For live-demo deployment changes, run `cargo test --locked --release -p hearth-site`, release clippy, `flyctl config validate --config site/fly.toml`, and the Linux container smoke test. Do not treat a deployment upload as end-to-end proof: check HTTPS, cookies, scoped loads, a mutation with server readback and CSP on the deployed host.
