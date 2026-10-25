# Releasing Hearth

Hearth's first own release is 0.1.0. All first-party runtime and build dependencies use Hearth package names. `hearth-foundation` is the internal core because `hearth-core` belongs to an unrelated project. Applications use the single `hearth` facade. The local-first APIs are enabled by default and can be omitted with `default-features = false` for lightweight build dependencies.

Topcoat v0.10.0 is the upstream source. Preserve its MIT license and copyright in every package. Historical changelogs remain upstream history, not Hearth releases.

## Verify the release

```sh
python3 scripts/release.py check
pnpm install --frozen-lockfile
pnpm build:runtime
python3 scripts/release.py package
python3 scripts/package-smoke.py --build
```

The release script checks version, license and internal dependency metadata, then packages only the publishable Hearth family in dependency order. All archives include LICENSE and NOTICE. Browser source and prebuilt runtime JavaScript are included; node_modules, development caches and source maps are not shipped.

The smoke test serves the actual release archives through an ephemeral local sparse Cargo registry. It copies the website into a temporary standalone application, uses only versioned dependencies without workspace patches, builds the application, installs the packaged CLI and bundles the application's assets. Third-party dependencies are proxied unchanged from crates.io. This verifies package contents and registry-style dependency resolution without uploading packages. Run the resulting app and exercise its browser behavior before publishing.

The local-first facade's development dependencies are path-only so Cargo drops them from published subcrate manifests. Giving those dev-dependencies registry versions introduces a release cycle back to the unpublished facade. Runtime and build dependencies always have explicit version requirements.

## Publish

Publishing discloses the package source regardless of whether the GitHub repository is private. Review the archives before uploading. Check ownership and availability of every package name. Authenticate Cargo with a crates.io account allowed to publish the package family; never commit or print credentials.

Commit the verified release, then run:

```sh
python3 scripts/release.py publish
```

Cargo verifies each archive and waits for its dependency to appear in the index before the next package is published. The script stops at the first failure. Publication is not transactional; inspect crates.io before resuming after a partial release. Never change package contents while reusing a published version.

After publication, verify package ownership, download the released facade and CLI into a clean application from the real crates.io registry, run the example, then update the website's installation instructions. Do not claim that `cargo add hearth` works based only on local archive testing. GitHub repository visibility and website deployment are separate decisions.

## Breaking rename

Replace `topcoat` dependencies and imports with `hearth`, remove the separate local-first dependency when consolidating manifests, and replace `topcoat` or `cargo topcoat` commands with `hearth` or `cargo hearth`. Rename Topcoat.toml to Hearth.toml. Runtime HTTP routes and metadata use `/_hearth` and `hearth` names. Deploy matching application and asset builds; old open tabs are not guaranteed to survive this protocol rename.
