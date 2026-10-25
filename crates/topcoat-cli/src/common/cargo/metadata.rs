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
            .kill_on_drop(true)
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

    /// The default run of the selected package, if a single package is selected.
    pub fn default_run_for_build(&self, package: Option<&str>) -> Option<String> {
        self.default_run(package.or_else(|| self.default_package())?)
    }

    /// Cargo reports the packages selected from the current directory as default members.
    fn default_package(&self) -> Option<&str> {
        let members = self.0["workspace_default_members"].as_array()?;
        if members.len() != 1 {
            return None;
        }
        self.0["packages"]
            .as_array()?
            .iter()
            .find(|package| package["id"] == members[0])?["id"]
            .as_str()
    }

    fn package(&self, name: &str) -> Option<&serde_json::Value> {
        self.0["packages"].as_array()?.iter().find(|package| {
            package["id"].as_str() == Some(name) || package["name"].as_str() == Some(name)
        })
    }

    /// Resolve Cargo package ID specifications without duplicating Cargo's grammar.
    pub async fn package_key_for_spec(&self, spec: &str) -> Option<String> {
        if let Some(package) = self.package(spec) {
            return package["id"].as_str().map(str::to_owned);
        }
        // pkgid requires a lockfile, but generating it need not download sources
        // for dependencies on platforms the selected build does not use.
        if !self.workspace_root()?.join("Cargo.lock").is_file() {
            let output = Command::new("cargo")
                .arg("generate-lockfile")
                .kill_on_drop(true)
                .output()
                .await
                .ok()?;
            if !output.status.success() {
                return None;
            }
        }
        let output = Command::new("cargo")
            .args(["pkgid", "--package", spec])
            .kill_on_drop(true)
            .output()
            .await
            .ok()?;
        if !output.status.success() {
            return None;
        }
        let id = String::from_utf8(output.stdout).ok()?;
        self.0["packages"]
            .as_array()?
            .iter()
            .find(|package| package["id"].as_str() == Some(id.trim()))?["id"]
            .as_str()
            .map(str::to_owned)
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
    fn default_member_identity_selects_the_right_package() {
        let mut metadata = two_bin_app(Some("cli"));
        metadata.0["packages"][0]["id"] = json!("app-id");
        metadata.0["workspace_default_members"] = json!(["app-id"]);
        assert_eq!(metadata.default_run_for_build(None).as_deref(), Some("cli"));
        metadata.0["workspace_default_members"] = json!(["app-id", "other-id"]);
        assert_eq!(metadata.default_run_for_build(None), None);
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
}
