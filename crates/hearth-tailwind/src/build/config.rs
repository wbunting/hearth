use std::{env, fs, path::PathBuf};

use super::inputs::Inputs;
use crate::build::{BuildError, Command, ExecutableSource, Result};

/// File name of the default [`output`](BuildConfig::output) inside `OUT_DIR`.
pub const DEFAULT_OUTPUT_NAME: &str = "tailwind.css";
const DEFAULT_INPUT_CSS: &str = "@import \"tailwindcss\";\n";

/// Builder for a Tailwind CLI run from a Cargo build script.
///
/// The default configuration downloads the standalone Tailwind CLI, scans the
/// package for class names, and writes the generated stylesheet to
/// `$OUT_DIR/tailwind.css`:
///
/// ```rust,no_run
/// hearth::tailwind::BuildConfig::new().render().unwrap();
/// ```
pub struct BuildConfig {
    executable_source: ExecutableSource,
    input: Option<PathBuf>,
    output: Option<PathBuf>,
    cwd: Option<PathBuf>,
    optimize: bool,
    minify: bool,
}

impl Default for BuildConfig {
    fn default() -> Self {
        Self {
            executable_source: ExecutableSource::default(),
            input: None,
            output: None,
            cwd: None,
            optimize: false,
            minify: true,
        }
    }
}

impl BuildConfig {
    /// Creates the default configuration. Call [`render`](Self::render) to run it.
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Where the Tailwind CLI executable comes from. Defaults to downloading
    /// [`DEFAULT_VERSION`](crate::build::DEFAULT_VERSION) from GitHub.
    ///
    /// Replaces any previously configured executable source.
    #[must_use]
    pub fn executable_source(mut self, executable_source: ExecutableSource) -> Self {
        self.executable_source = executable_source;
        self
    }

    /// Pin the Tailwind CLI release to download (without the leading `v`).
    ///
    /// Shorthand for [`ExecutableSource::Github`] without a checksum.
    #[must_use]
    pub fn version(self, version: impl Into<String>) -> Self {
        self.executable_source(ExecutableSource::Github {
            version: version.into(),
            checksum: None,
        })
    }

    /// Pin the Tailwind CLI release to download (without the leading `v`)
    /// along with the expected hash of the downloaded binary as an
    /// `algorithm:hex` string. Only `sha256` is currently supported, e.g.
    /// `"sha256:b800b065..."`.
    ///
    /// Shorthand for [`ExecutableSource::Github`] with a checksum.
    #[must_use]
    pub fn version_checksum(self, version: impl Into<String>, checksum: impl Into<String>) -> Self {
        self.executable_source(ExecutableSource::Github {
            version: version.into(),
            checksum: Some(checksum.into()),
        })
    }

    /// Use an existing Tailwind CLI executable instead of downloading one.
    ///
    /// A bare command name like `"tailwindcss"` is resolved through `PATH`;
    /// anything containing a path separator is used as a file path, with
    /// relative paths resolved against the package root (the directory the
    /// build script runs in).
    ///
    /// Shorthand for [`ExecutableSource::Path`].
    #[must_use]
    pub fn executable(self, path: impl Into<PathBuf>) -> Self {
        self.executable_source(ExecutableSource::Path(path.into()))
    }

    /// Read the Tailwind CLI executable from an environment variable at build
    /// time. The variable's value is interpreted like
    /// [`executable`](Self::executable). Changes to the variable rerun the build
    /// script.
    ///
    /// Shorthand for [`ExecutableSource::Env`].
    #[must_use]
    pub fn executable_env(self, name: impl Into<String>) -> Self {
        self.executable_source(ExecutableSource::Env(name.into()))
    }

    /// Sets the input CSS file. By default, generates a file in `OUT_DIR`
    /// containing `@import "tailwindcss";`.
    ///
    /// The Tailwind CLI resolves a relative path against [`cwd`](Self::cwd),
    /// which defaults to the package root.
    #[must_use]
    pub fn input(mut self, path: impl Into<PathBuf>) -> Self {
        self.input = Some(path.into());
        self
    }

    /// Sets the output CSS file. Defaults to `$OUT_DIR/tailwind.css`.
    ///
    /// The Tailwind CLI resolves a relative path against [`cwd`](Self::cwd),
    /// which defaults to the package root.
    #[must_use]
    pub fn output(mut self, path: impl Into<PathBuf>) -> Self {
        self.output = Some(path.into());
        self
    }

    /// Sets the directory Tailwind scans for class names. Relative
    /// [`input`](Self::input) and [`output`](Self::output) paths also start here.
    /// Defaults to `$CARGO_MANIFEST_DIR`, the package root.
    ///
    /// Exclude build output with `.gitignore` to avoid scanning generated
    /// files and stale classes. You can also narrow the scan with `.cwd("src")`
    /// or a custom [`input`](Self::input) using `source(none)` and explicit
    /// `@source` directives.
    #[must_use]
    pub fn cwd(mut self, cwd: impl Into<PathBuf>) -> Self {
        self.cwd = Some(cwd.into());
        self
    }

    /// Pass `--optimize` to the Tailwind CLI. Defaults to `false`.
    #[must_use]
    pub fn optimize(mut self, optimize: bool) -> Self {
        self.optimize = optimize;
        self
    }

    /// Pass `--minify` to the Tailwind CLI. Defaults to `true`.
    #[must_use]
    pub fn minify(mut self, minify: bool) -> Self {
        self.minify = minify;
        self
    }

    /// Runs Tailwind and returns the generated CSS path.
    ///
    /// Emits Cargo rebuild directives for input CSS, local imports, and source
    /// directories. Source globs watch their fixed directory prefix. Inline
    /// sources add no paths. Build output is excluded from directory watches.
    ///
    /// Cargo's `OUT_DIR` is required for downloads and default input or output
    /// paths. The default working directory requires `CARGO_MANIFEST_DIR`.
    ///
    /// # Errors
    ///
    /// Returns `Err` if the CLI cannot be downloaded, fails checksum
    /// verification, or cannot be executed, if an [`ExecutableSource::Env`]
    /// variable is unset, if the Tailwind CLI exits with a non-zero status, or
    /// if `OUT_DIR` or `CARGO_MANIFEST_DIR` is unset while a default depends
    /// on it.
    pub fn render(self) -> Result<PathBuf> {
        if let ExecutableSource::Env(name) = &self.executable_source {
            println!("cargo::rerun-if-env-changed={name}");
        }
        let executable = self.executable_source.resolve()?;

        let out_dir = env::var_os("OUT_DIR").map(PathBuf::from);

        let input = if let Some(path) = self.input {
            path
        } else {
            let out_dir = out_dir.as_deref().ok_or(BuildError::NoOutDir)?;
            let path = out_dir.join("tailwind-input.css");
            // Only write if contents would change: the file's mtime then
            // stays stable, so a user-supplied `rerun-if-changed` directive
            // for it doesn't rerun the build script every build.
            let needs_write = match fs::read(&path) {
                Ok(existing) => existing != DEFAULT_INPUT_CSS.as_bytes(),
                Err(_) => true,
            };
            if needs_write {
                fs::write(&path, DEFAULT_INPUT_CSS).map_err(|source| BuildError::Io {
                    path: path.clone(),
                    source,
                })?;
            }
            path
        };

        let output = if let Some(path) = self.output {
            path
        } else {
            out_dir
                .as_deref()
                .ok_or(BuildError::NoOutDir)?
                .join(DEFAULT_OUTPUT_NAME)
        };

        let cwd = if let Some(path) = self.cwd {
            path
        } else {
            let manifest_dir =
                env::var_os("CARGO_MANIFEST_DIR").ok_or(BuildError::NoManifestDir)?;
            PathBuf::from(manifest_dir)
        };

        let command = Command {
            input,
            output: output.clone(),
            cwd,
            optimize: self.optimize,
            minify: self.minify,
        };
        Inputs::discover(&command, out_dir.as_deref())?.emit()?;
        executable.run(&command)?;

        Ok(output)
    }
}

#[cfg(all(test, unix))]
mod tests {
    use std::{os::unix::fs::PermissionsExt, process::Command};

    use super::*;

    // Run render in a subprocess so Cargo environment variables are isolated
    // without mutating the test process's environment.
    #[test]
    fn render_fixture() {
        if let Some(root) = env::var_os("HEARTH_TAILWIND_TEST_ROOT") {
            BuildConfig::new()
                .executable_env("HEARTH_TAILWIND_TEST_CLI")
                .cwd(root)
                .input("styles.css")
                .render()
                .unwrap();
        }
    }

    #[test]
    fn render_emits_inputs_on_every_run() {
        let dir = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(dir.path()).unwrap();
        let out = root.join("target/release/build/fixture/out");
        fs::create_dir_all(&out).unwrap();
        fs::create_dir(root.join("src")).unwrap();
        fs::write(root.join("styles.css"), "@import 'tailwindcss' source(none); @source './src'; @import './theme.css'; @source inline('p-4');").unwrap();
        fs::write(root.join("theme.css"), ":root { --color: red; }").unwrap();
        let cli = root.join("tailwind");
        fs::write(&cli, "#!/bin/sh\nexit 0\n").unwrap();
        fs::set_permissions(&cli, fs::Permissions::from_mode(0o755)).unwrap();
        for _ in 0..2 {
            let output = Command::new(env::current_exe().unwrap())
                .args([
                    "--exact",
                    "build::config::tests::render_fixture",
                    "--nocapture",
                ])
                .env("HEARTH_TAILWIND_TEST_ROOT", &root)
                .env("HEARTH_TAILWIND_TEST_CLI", &cli)
                .env("OUT_DIR", &out)
                .output()
                .unwrap();
            assert!(output.status.success(), "{output:?}");
            let stdout = String::from_utf8(output.stdout).unwrap();
            for input in ["styles.css", "theme.css", "src"] {
                assert!(
                    stdout.lines().any(|line| line
                        == format!("cargo::rerun-if-changed={}", root.join(input).display())),
                    "{stdout}"
                );
            }
            assert!(stdout.contains("cargo::rerun-if-env-changed=HEARTH_TAILWIND_TEST_CLI"));
            assert!(
                !stdout
                    .lines()
                    .any(|line| line.starts_with("cargo::rerun-if-changed=")
                        && line.contains("target")),
                "{stdout}"
            );
        }
    }
}
