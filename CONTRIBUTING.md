# Contributing to Hearth

This guide explains how to prepare and submit a change to Hearth.

## Fixes are welcome, features need a conversation first

Open a pull request for a bug fix or documentation improvement. You do not need to discuss it first.

If you want to build a feature, open an [issue in this repository](https://github.com/wbunting/hearth/issues) before you write the code.

New features need to fit the framework's design and be maintainable over time. Discussing a proposal first helps you avoid writing code we cannot accept.

AI-assisted contributions are welcome. You are responsible for the result. Read the affected code and the full diff, verify the change, and be ready to explain it. Review the agent's work before asking a maintainer to review it.

Keep pull requests focused. If a fix grows into a new feature or a broader redesign, discuss the scope before continuing.

## Local setup

Hearth is a plain Cargo workspace. The framework crates live in `crates/`, small single-feature examples in `examples/`, and complete demo applications in `demos/`.

Use the toolchain selected by `rust-toolchain.toml` to build and test. Formatting and documentation checks also need nightly:

```sh
git clone https://github.com/wbunting/hearth
cd hearth
pnpm install --frozen-lockfile
cargo test --locked --release -p hearth -p hearth-macro -p hearth-cli
```

If you use Nix, `nix develop` gives you a shell with the toolchain already set up.

Install the CLI from the workspace so `hearth fmt` and the dev server match the code you are working on:

```sh
cargo install --path crates/hearth-cli --locked
```

Try framework changes in an example or demo. Run `hearth dev` in an example directory to build and serve it. Examples focus on individual features, while demos show how features work together in an app.

## Fork and branch

1. Fork the repository and clone your fork.
2. Branch off `main`.
3. Make your change, with tests where it makes sense.
4. Run the checks below.
5. Push to your fork and open a pull request against `main`.

Pull requests are squash-merged, so you do not need to tidy up your commit history before pushing. Keep your branch mergeable with `main` by rebasing rather than merging `main` into it.

## Formatting, linting, and testing

Run these checks before opening a pull request:

```sh
cargo +nightly fmt --all -- --check
cargo test --locked --release -p hearth -p hearth-macro -p hearth-cli
cargo clippy --locked --release -p hearth -p hearth-macro -p hearth-cli -- -D warnings
```

Run the affected crate's tests and exercise the changed application flow as well. The full fork CI commands, feature checks and package-consumer verification are maintained in the [check skill](.agents/skills/check/SKILL.md) and [.github/workflows/ci.yml](.github/workflows/ci.yml). Avoid substituting the upstream all-workspace/all-features matrix for this fork's checks. Rebuild the CLI after changing a grammar before using `hearth fmt` on your source.

For browser changes, run the following commands from `crates/hearth-runtime/browser` or `crates/hearth-cli/browser`, depending on the project you changed. Changes to the shared code in `crates/hearth-foundation/browser` need both projects checked and rebuilt. CI checks formatting, linting, tests, and that the committed bundles match their source:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm build
pnpm test
```

Commit the regenerated `dist/index.js` with the source changes. The runtime also builds `dist/coherence.js` and `dist/persist.js`, which must be committed when they change.

The full check list, including when each command is needed, is in the [`check`](.agents/skills/check/SKILL.md) skill.

## Code and documentation style

Follow these rules throughout the project:

- Plain ASCII everywhere, in code, docs, and commit messages. Write `->` instead of an arrow character and `...` instead of an ellipsis, and avoid em dashes.
- Do not add unsafe code.

Match the surrounding code and follow the [`style`](.agents/skills/style/SKILL.md) skill. For guides, also read the [`prose`](.agents/skills/prose/SKILL.md) skill. For procedural macros, read the [`macro`](.agents/skills/macro/SKILL.md) skill.

## Commits and pull requests

Commit messages and pull request titles follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

Choose a type that describes the change. Use an optional scope for the affected area, usually the crate name without `hearth-`. Write the subject in lowercase imperative form, with no trailing period:

```
fix(router): isolate request panics
```

CI checks pull request titles. The title becomes the squash commit message and determines how release tooling classifies the change. Mark a breaking change with `!` after the type or scope and add a `BREAKING CHANGE:` footer that explains how to migrate.

Describe the complete change, explain how you verified it, and reference any issue it closes (`Closes #123`). If you used an AI agent, name the model and describe its work. Keep the description concise and include what reviewers need to assess the change.

More detail is in the [`commit`](.agents/skills/commit/SKILL.md) and [`pr`](.agents/skills/pr/SKILL.md) skills.

## Where to find things

- [README](README.md): an introduction to Hearth and an index of guides.
- [`docs/getting_started.md`](docs/getting_started.md): building an app with Hearth, which is worth doing before changing the framework.
- [Tokio Discord](https://discord.gg/tokio): questions, feature discussions, and everything else.

By contributing, you agree that your contributions are licensed under the [MIT license](LICENSE).
