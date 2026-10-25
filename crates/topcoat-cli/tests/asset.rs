use std::{
    fmt::Write as _,
    path::PathBuf,
    process::{Command, Output, Stdio},
    sync::atomic::{AtomicUsize, Ordering},
    time::Duration,
};

use tokio::io::{AsyncBufReadExt, BufReader};

struct Project {
    path: PathBuf,
}

impl Project {
    fn new() -> Self {
        static NEXT_ID: AtomicUsize = AtomicUsize::new(0);
        let path = std::env::temp_dir().join(format!(
            "topcoat-asset-{}-{}",
            std::process::id(),
            NEXT_ID.fetch_add(1, Ordering::Relaxed),
        ));
        std::fs::create_dir_all(path.join("src/bin")).unwrap();
        std::fs::write(path.join("server.txt"), "server asset").unwrap();
        std::fs::write(path.join("helper.txt"), "helper asset").unwrap();
        for bin in ["server", "helper"] {
            std::fs::write(
                path.join(format!("src/bin/{bin}.rs")),
                format!(
                    "fn main() {{ std::hint::black_box(topcoat_asset::asset!(\"{bin}.txt\")); println!(\"started {bin}\"); }}"
                ),
            )
            .unwrap();
        }
        Self { path }
    }

    fn manifest(&self, bins: &[&str], default_run: Option<&str>) {
        let asset_crate = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .join("topcoat-asset");
        let mut manifest = format!(
            "[package]\nname = \"app\"\nversion = \"0.1.0\"\nedition = \"2024\"\nautobins = false\n{}\n[workspace]\n[dependencies]\ntopcoat-asset = {{ path = {:?} }}\n",
            default_run
                .map(|bin| format!("default-run = {bin:?}\n"))
                .unwrap_or_default(),
            asset_crate.to_str().unwrap(),
        );
        for bin in bins {
            write!(
                manifest,
                "\n[[bin]]\nname = {bin:?}\npath = \"src/bin/{bin}.rs\"\n"
            )
            .unwrap();
        }
        std::fs::write(self.path.join("Cargo.toml"), manifest).unwrap();
    }

    fn command(&self, args: &[&str]) -> Command {
        let mut command = Command::new(env!("CARGO_BIN_EXE_topcoat"));
        command
            .args(args)
            .current_dir(&self.path)
            .env("CARGO_TARGET_DIR", self.path.join("target"))
            .env("CARGO_NET_OFFLINE", "true")
            .stdin(Stdio::null());
        command
    }

    async fn dev(&self, flags: &[&str], expected_bin: &str) {
        let mut command = self.command(&["dev", "--release", "-p", "app"]);
        command
            .args(flags)
            .env("PORT", "3405")
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit());
        let mut child = tokio::process::Command::from(command)
            .kill_on_drop(true)
            .spawn()
            .unwrap();
        let mut stdout = BufReader::new(child.stdout.take().unwrap()).lines();
        let line = tokio::time::timeout(Duration::from_secs(60), stdout.next_line()).await;
        child.kill().await.unwrap();
        assert_eq!(
            line.unwrap().unwrap().unwrap(),
            format!("started {expected_bin}")
        );
    }

    fn bundle(&self, flags: &[&str], expected_asset: &str) {
        let output = self
            .command(&["asset", "bundle", "--release", "-p", "app"])
            .args(flags)
            .output()
            .unwrap();
        assert_success(&output);
        let out = self.path.join("target/release/assets");
        let manifest = topcoat_asset::Manifest::load(out.join("manifest.toml")).unwrap();
        assert_eq!(manifest.assets.len(), 1);
        assert_eq!(
            std::fs::read_to_string(out.join(&manifest.assets[0].file)).unwrap(),
            expected_asset,
        );
    }
}

impl Drop for Project {
    fn drop(&mut self) {
        std::fs::remove_dir_all(&self.path).unwrap();
    }
}

fn assert_success(output: &Output) {
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr),
    );
}

#[tokio::test]
async fn bundle_selects_one_binary_and_keeps_its_assets() {
    let project = Project::new();
    project.manifest(&["server"], None);
    project.bundle(&[], "server asset");

    project.manifest(&["server", "helper"], Some("server"));
    project.bundle(&[], "server asset");
    project.bundle(&["--bin", "helper"], "helper asset");

    project.manifest(&["server", "helper"], None);
    project.bundle(&["--bin", "server"], "server asset");
    let output = project
        .command(&["asset", "bundle", "--release", "-p", "app"])
        .output()
        .unwrap();
    assert!(!output.status.success());
    let error = String::from_utf8_lossy(&output.stderr);
    for choice in ["--bin", "server", "helper"] {
        assert!(error.contains(choice), "{error}");
    }

    // Without --package, select the package containing the current directory too.
    project.manifest(&["server", "helper"], Some("helper"));
    let output = project
        .command(&["asset", "list", "--release"])
        .output()
        .unwrap();
    assert_success(&output);
    let listed = String::from_utf8(output.stdout).unwrap();
    assert!(listed.contains("helper.txt"), "{listed}");
    assert!(!listed.contains("server.txt"), "{listed}");
    let qualified = project
        .command(&["asset", "list", "--release", "-p", "app@0.1.0"])
        .output()
        .unwrap();
    assert_success(&qualified);
    assert!(String::from_utf8_lossy(&qualified.stdout).contains("helper.txt"));
    project.dev(&[], "helper").await;
    project.dev(&["--bin", "server"], "server").await;
}

#[test]
fn workspace_defaults_override_the_root_package() {
    let project = Project::new();
    project.manifest(&["server"], None);
    std::fs::create_dir_all(project.path.join("web/src")).unwrap();
    std::fs::write(
        project.path.join("web/Cargo.toml"),
        "[package]\nname = \"web\"\nversion = \"0.1.0\"\nedition = \"2024\"\n",
    )
    .unwrap();
    std::fs::write(project.path.join("web/src/main.rs"), "fn main() {}\n").unwrap();
    let manifest = std::fs::read_to_string(project.path.join("Cargo.toml")).unwrap();
    std::fs::write(
        project.path.join("Cargo.toml"),
        manifest.replace(
            "[workspace]",
            "[workspace]\nmembers = [\"web\"]\ndefault-members = [\"web\"]",
        ),
    )
    .unwrap();
    let output = project
        .command(&["asset", "list", "--release"])
        .output()
        .unwrap();
    assert_success(&output);
    assert!(project.path.join("target/release/web").is_file());
    assert!(!project.path.join("target/release/server").is_file());
    let output = project
        .command(&["asset", "list", "--release", "-p", "app"])
        .current_dir(project.path.join("web/src"))
        .output()
        .unwrap();
    assert_success(&output);
    assert!(String::from_utf8_lossy(&output.stdout).contains("server.txt"));
}

#[test]
fn disabled_optional_binary_does_not_block_library_bundling() {
    let project = Project::new();
    project.manifest(&["helper"], None);
    std::fs::write(
        project.path.join("src/lib.rs"),
        "pub fn value() -> u8 { 1 }",
    )
    .unwrap();
    let manifest = std::fs::read_to_string(project.path.join("Cargo.toml")).unwrap();
    std::fs::write(project.path.join("Cargo.toml"), format!("{manifest}required-features = [\"cli\"]\n[features]\ncli = []\n[lib]\ncrate-type = [\"cdylib\"]\n")).unwrap();
    let output = project
        .command(&["asset", "bundle", "--release", "-p", "app"])
        .output()
        .unwrap();
    assert_success(&output);
    assert!(
        project
            .path
            .join("target/release/assets/manifest.toml")
            .is_file()
    );
    assert!(!project.path.join("target/release/helper").is_file());

    let manifest = std::fs::read_to_string(project.path.join("Cargo.toml")).unwrap();
    std::fs::write(
        project.path.join("Cargo.toml"),
        manifest.replace("[features]", "[features]\ndefault = [\"cli\"]"),
    )
    .unwrap();
    project.bundle(&[], "helper asset");
}
