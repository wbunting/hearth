use std::{
    path::{Path, PathBuf},
    process::Stdio,
};

use tokio::process::Command;

/// The output of `cargo metadata` for the current workspace.
pub struct Metadata(serde_json::Value);

impl Metadata {
    /// Query the workspace's own metadata (`cargo metadata --no-deps`).
    /// Returns `None` when cargo cannot be spawned or reports an error.
    pub async fn workspace() -> Option<Self> {
        Self::run(&["--no-deps"]).await
    }

    /// Query metadata with the dependency graph resolved, so the output also
    /// lists path dependencies living outside the workspace. Returns `None`
    /// when cargo cannot be spawned or reports an error.
    pub async fn full() -> Option<Self> {
        Self::run(&[]).await
    }

    async fn run(extra_args: &[&str]) -> Option<Self> {
        let output = Command::new("cargo")
            .args(["metadata", "--format-version=1"])
            .args(extra_args)
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .spawn()
            .ok()?
            .wait_with_output()
            .await
            .ok()?;

        if !output.status.success() {
            return None;
        }

        serde_json::from_slice(&output.stdout).ok().map(Self)
    }

    /// The workspace's cargo target directory.
    pub fn target_dir(&self) -> Option<PathBuf> {
        self.0["target_directory"].as_str().map(PathBuf::from)
    }

    /// The directory containing the workspace manifest.
    pub fn workspace_root(&self) -> Option<PathBuf> {
        self.0["workspace_root"].as_str().map(PathBuf::from)
    }

    /// The manifest directories of local packages, including workspace members and path
    /// dependencies.
    pub fn local_package_dirs(&self) -> Vec<PathBuf> {
        self.0["packages"]
            .as_array()
            .into_iter()
            .flatten()
            .filter(|package| package["source"].is_null())
            .filter_map(|package| {
                let manifest = Path::new(package["manifest_path"].as_str()?);
                Some(manifest.parent()?.to_path_buf())
            })
            .collect()
    }

    /// The name of the bin target `[package] default-run` selects, or `None` when the
    /// package declares no default run.
    ///
    /// Cargo's manifest reference defines the value as the name of one of the
    /// package's bin targets.
    pub fn default_run(&self, package: &str) -> Option<String> {
        let package = self.package(package)?;
        let default_run = package["default_run"].as_str()?;

        package["targets"]
            .as_array()?
            .iter()
            .find(|target| is_bin(target) && target["name"].as_str() == Some(default_run))?["name"]
            .as_str()
            .map(str::to_owned)
    }

    /// Select the package's default run or its only binary. Ambiguous packages return
    /// the binary names so callers can ask for `--bin`. Packages without binaries
    /// leave output selection to Cargo, allowing dynamic libraries to be bundled.
    pub fn binary_for_build(&self, package: Option<&str>) -> Result<Option<String>, Vec<String>> {
        let current_dir = std::env::current_dir().ok();
        let package = package.or_else(|| {
            current_dir
                .as_deref()
                .and_then(|dir| self.package_containing_dir(dir))
                .or_else(|| self.default_package())
        });
        let Some(package) = package else {
            return Ok(None);
        };
        if let Some(bin) = self.default_run(package) {
            return Ok(Some(bin));
        }
        let mut bins: Vec<_> = self
            .package(package)
            .and_then(|package| package["targets"].as_array())
            .into_iter()
            .flatten()
            .filter(|target| is_bin(target))
            .filter_map(|target| target["name"].as_str().map(str::to_owned))
            .collect();
        bins.sort();
        match bins.len() {
            0 => Ok(None),
            1 => Ok(bins.pop()),
            _ => Err(bins),
        }
    }

    /// A virtual workspace with one default member also identifies a single package.
    fn default_package(&self) -> Option<&str> {
        let members = self.0["workspace_default_members"].as_array()?;
        if members.len() != 1 {
            return None;
        }
        self.0["packages"]
            .as_array()?
            .iter()
            .find(|package| package["id"] == members[0])?["name"]
            .as_str()
    }

    fn package(&self, name: &str) -> Option<&serde_json::Value> {
        self.0["packages"]
            .as_array()?
            .iter()
            .find(|package| package["name"].as_str() == Some(name))
    }

    /// The name of the local package whose manifest directory contains `dir`.
    ///
    /// The deepest match wins, so a package nested in another still wins over the one
    /// that merely contains it.
    fn package_containing_dir(&self, dir: &Path) -> Option<&str> {
        self.0["packages"]
            .as_array()?
            .iter()
            .filter(|package| package["source"].is_null())
            .filter_map(|package| {
                let manifest = Path::new(package["manifest_path"].as_str()?);
                let root = manifest.parent()?;
                dir.starts_with(root)
                    .then_some((root.components().count(), package))
            })
            .max_by_key(|(depth, _)| *depth)
            .and_then(|(_, package)| package["name"].as_str())
    }
}

/// Whether the target builds an executable.
fn is_bin(target: &serde_json::Value) -> bool {
    target["kind"]
        .as_array()
        .is_some_and(|kinds| kinds.iter().any(|kind| kind == "bin"))
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    fn metadata(packages: &serde_json::Value) -> Metadata {
        Metadata(json!({ "packages": packages }))
    }

    fn package(
        name: &str,
        default_run: Option<&str>,
        targets: &serde_json::Value,
    ) -> serde_json::Value {
        json!({
            "name": name,
            "default_run": default_run,
            "targets": targets,
        })
    }

    fn target(name: &str, kind: &[&str], src_path: &str) -> serde_json::Value {
        json!({
            "name": name,
            "kind": kind,
            "src_path": src_path,
        })
    }

    fn bin(name: &str, src_path: &str) -> serde_json::Value {
        target(name, &["bin"], src_path)
    }

    /// An application with the usual `src/main.rs` plus an extra `src/bin/cli.rs`,
    /// which is what following the Toasty migration guide produces.
    fn two_bin_app(default_run: Option<&str>) -> Metadata {
        metadata(&json!([package(
            "app",
            default_run,
            &json!([
                bin("app", "/w/app/src/main.rs"),
                bin("cli", "/w/app/src/bin/cli.rs"),
            ]),
        )]))
    }

    #[test]
    fn build_selects_default_run_or_requires_an_explicit_binary() {
        assert_eq!(
            two_bin_app(Some("cli")).binary_for_build(Some("app")),
            Ok(Some("cli".to_owned()))
        );
        let bins = two_bin_app(None).binary_for_build(Some("app")).unwrap_err();
        assert_eq!(bins, ["app", "cli"]);
    }

    #[test]
    fn build_selects_the_only_binary_even_beside_a_dynamic_library() {
        let metadata = metadata(&json!([package(
            "app",
            None,
            &json!([
                target("app", &["cdylib"], "/w/app/src/lib.rs"),
                bin("server", "/w/app/src/main.rs"),
            ]),
        )]));
        assert_eq!(
            metadata.binary_for_build(Some("app")),
            Ok(Some("server".to_owned()))
        );
    }

    #[test]
    fn library_only_builds_leave_output_selection_to_cargo() {
        let metadata = metadata(&json!([package(
            "app",
            None,
            &json!([target("app", &["cdylib"], "/w/app/src/lib.rs")]),
        )]));
        assert_eq!(metadata.binary_for_build(Some("app")), Ok(None));
    }

    #[test]
    fn virtual_workspace_selects_its_only_default_member() {
        let mut metadata = two_bin_app(Some("cli"));
        metadata.0["workspace_default_members"] = json!(["app-id"]);
        metadata.0["packages"][0]["id"] = json!("app-id");
        assert_eq!(metadata.binary_for_build(None), Ok(Some("cli".to_owned())));
        metadata.0["workspace_default_members"] = json!(["app-id", "other-id"]);
        assert_eq!(metadata.binary_for_build(None), Ok(None));
    }

    #[test]
    fn default_run_naming_the_default_target_is_resolved() {
        let metadata = two_bin_app(Some("app"));
        assert_eq!(metadata.default_run("app").as_deref(), Some("app"));
    }

    #[test]
    fn default_run_naming_a_secondary_target_is_resolved() {
        let metadata = two_bin_app(Some("cli"));
        assert_eq!(metadata.default_run("app").as_deref(), Some("cli"));
    }

    #[test]
    fn a_package_without_default_run_has_none() {
        let metadata = two_bin_app(None);
        assert_eq!(metadata.default_run("app"), None);
    }

    #[test]
    fn an_unknown_package_has_none() {
        let metadata = two_bin_app(Some("app"));
        assert_eq!(metadata.default_run("other"), None);
    }

    #[test]
    fn a_default_run_matching_no_bin_target_has_none() {
        // Cargo rejects a `default-run` that resolves to no bin target, so this only
        // guards against picking one anyway if that ever stops being an error.
        let metadata = two_bin_app(Some("nope"));
        assert_eq!(metadata.default_run("app"), None);
    }

    #[test]
    fn lib_targets_are_never_default_run_candidates() {
        let metadata = metadata(&json!([package(
            "app",
            Some("app"),
            &json!([target("app", &["lib"], "/w/app/src/lib.rs")]),
        )]));
        assert_eq!(metadata.default_run("app"), None);
    }

    #[test]
    fn a_lib_target_sharing_a_name_does_not_shadow_the_bin() {
        let metadata = metadata(&json!([package(
            "app",
            Some("app"),
            &json!([
                target("app", &["lib"], "/w/app/src/lib.rs"),
                bin("app", "/w/app/src/main.rs"),
            ]),
        )]));
        assert_eq!(metadata.default_run("app").as_deref(), Some("app"));
    }

    /// The package containing `dir` is the one a build without `--package` compiles,
    /// so a `default-run` in a sibling package must not be picked up.
    #[test]
    fn the_package_containing_the_current_directory_wins() {
        let metadata = Metadata(json!({
            "packages": [
                { "name": "workspace-root", "source": null, "manifest_path": "/w/Cargo.toml" },
                {
                    "name": "app",
                    "source": null,
                    "manifest_path": "/w/examples/app/Cargo.toml",
                    "default_run": "cli",
                    "targets": [bin("cli", "/w/examples/app/src/bin/cli.rs")],
                },
            ],
        }));
        assert_eq!(
            metadata.package_containing_dir(Path::new("/w/examples/app/src")),
            Some("app")
        );
        assert_eq!(metadata.default_run("app").as_deref(), Some("cli"));
    }

    #[test]
    fn a_directory_outside_every_package_matches_none() {
        let metadata = Metadata(json!({
            "packages": [
                { "name": "app", "source": null, "manifest_path": "/w/app/Cargo.toml" },
            ],
        }));
        assert_eq!(
            metadata.package_containing_dir(Path::new("/elsewhere")),
            None
        );
    }

    /// A package prefix that is not a path-component prefix is not a match:
    /// `/w/app` is not inside `/w/app-two`.
    #[test]
    fn package_matching_respects_path_components() {
        let metadata = Metadata(json!({
            "packages": [
                { "name": "app-two", "source": null, "manifest_path": "/w/app-two/Cargo.toml" },
            ],
        }));
        assert_eq!(
            metadata.package_containing_dir(Path::new("/w/app/src")),
            None
        );
    }

    #[test]
    fn registry_dependencies_are_never_the_build_package() {
        let metadata = Metadata(json!({
            "packages": [
                { "name": "dep", "source": "registry+https://github.com/rust-lang/crates.io-index", "manifest_path": "/reg/dep/Cargo.toml" },
            ],
        }));
        assert_eq!(
            metadata.package_containing_dir(Path::new("/reg/dep/src")),
            None
        );
    }
}
