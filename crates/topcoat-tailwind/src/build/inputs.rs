use std::{
    collections::BTreeSet,
    fs,
    path::{Path, PathBuf},
};

use cssparser::{Delimiter, Parser, ParserInput, Token};

use crate::build::{BuildError, Command, Result};

/// Cargo cannot apply ignore rules or globs to recursive directory watches.
/// Keep broad watches away from build output, including custom output paths.
#[derive(Default)]
pub(super) struct Inputs {
    files: BTreeSet<PathBuf>,
    roots: BTreeSet<PathBuf>,
    excluded: Vec<PathBuf>,
    automatic: bool,
}

impl Inputs {
    pub(super) fn discover(command: &Command, out_dir: Option<&Path>) -> Result<Self> {
        let cwd = fs::canonicalize(&command.cwd).map_err(|source| BuildError::Io {
            path: command.cwd.clone(),
            source,
        })?;
        let mut inputs = Self {
            automatic: true,
            ..Self::default()
        };
        inputs
            .excluded
            .push(Self::normalize(&cwd.join(&command.output)));
        if let Some(out_dir) = out_dir {
            let out_dir = Self::normalize(out_dir);
            inputs.excluded.push(out_dir.clone());
            // OUT_DIR is <target>[/<triple>]/<profile>/build/<package>/out.
            if let Some(build) = out_dir.parent().and_then(Path::parent)
                && build.file_name().is_some_and(|name| name == "build")
                && let Some(target) = build.parent().and_then(Path::parent)
            {
                inputs.excluded.push(target.to_path_buf());
            }
        }
        inputs.stylesheet(&cwd.join(&command.input))?;
        if inputs.automatic {
            inputs.roots.insert(cwd);
        }
        Ok(inputs)
    }

    pub(super) fn paths(&self) -> Result<BTreeSet<PathBuf>> {
        let mut paths = self.files.clone();
        for root in &self.roots {
            self.watch(root, &mut paths, &mut BTreeSet::new())?;
        }
        paths.retain(|path| {
            !self
                .excluded
                .iter()
                .any(|excluded| path.starts_with(excluded))
        });
        Ok(paths)
    }

    pub(super) fn emit(&self) -> Result {
        for path in self.paths()? {
            println!("cargo::rerun-if-changed={}", path.display());
        }
        Ok(())
    }

    fn stylesheet(&mut self, path: &Path) -> Result {
        let path = fs::canonicalize(path).map_err(|source| BuildError::Io {
            path: path.to_path_buf(),
            source,
        })?;
        if !self.files.insert(path.clone()) {
            return Ok(());
        }
        let css = fs::read_to_string(&path).map_err(|source| BuildError::Io {
            path: path.clone(),
            source,
        })?;
        let base = path.parent().unwrap();
        let mut input = ParserInput::new(&css);
        let mut parser = Parser::new(&mut input);
        self.rules(base, &mut parser)
    }

    fn rules(&mut self, base: &Path, parser: &mut Parser<'_, '_>) -> Result {
        let mut import_error = None;
        while let Ok(token) = parser.next().cloned() {
            if token == Token::CurlyBracketBlock {
                let _: std::result::Result<_, cssparser::ParseError<'_, ()>> = parser
                    .parse_nested_block(|block| {
                        if let Err(error) = self.rules(base, block) {
                            import_error = Some(error);
                        }
                        Ok(())
                    });
                continue;
            }
            let Token::AtKeyword(name) = token else {
                continue;
            };
            let _: std::result::Result<(), cssparser::ParseError<'_, ()>> = parser
                .parse_until_before(
                    Delimiter::Semicolon | Delimiter::CurlyBracketBlock,
                    |rule| {
                        match name.as_ref() {
                            "source" => {
                                // Negated sources and inline(...) do not add filesystem inputs.
                                if let Ok(Token::QuotedString(path)) = rule.next() {
                                    self.source(base, path);
                                }
                            }
                            "import" | "reference" => {
                                // Tailwind preserves url(...) imports for the browser.
                                if let Ok(path) = rule.expect_string_cloned() {
                                    let automatic = self.automatic;
                                    if let Err(error) = self.import(base, &path) {
                                        import_error = Some(error);
                                    }
                                    if name == "reference" {
                                        self.automatic = automatic;
                                    }
                                    // A source modifier only controls scanning if the
                                    // imported stylesheet supplies utilities. For other
                                    // imports retain a conservative automatic watch.
                                    let controls_scan = name == "import"
                                        && (path == "tailwindcss"
                                            || path == "tailwindcss/utilities"
                                            || path == "tailwindcss/utilities.css");
                                    self.scan_root(base, rule, controls_scan);
                                }
                            }
                            "tailwind" if rule.expect_ident_matching("utilities").is_ok() => {
                                self.scan_root(base, rule, true);
                            }
                            _ => {}
                        }
                        // Consume the rest so unknown at-rules are skipped, not parsed as CSS
                        // paths.
                        while rule.next().is_ok() {}
                        Ok(())
                    },
                );
        }
        import_error.map_or(Ok(()), Err)
    }

    fn scan_root(&mut self, base: &Path, rule: &mut Parser<'_, '_>, controls_scan: bool) {
        while let Ok(token) = rule.next().cloned() {
            if let Token::Function(name) = token
                && name == "source"
            {
                if controls_scan {
                    self.automatic = false;
                }
                let _: std::result::Result<_, cssparser::ParseError<'_, ()>> = rule
                    .parse_nested_block(|value| {
                        if let Ok(Token::QuotedString(path)) = value.next() {
                            self.source(base, path);
                        }
                        Ok(())
                    });
            }
        }
    }

    fn import(&mut self, base: &Path, id: &str) -> Result {
        if id.contains("://")
            || id.starts_with("data:")
            || id == "tailwindcss"
            || id.starts_with("tailwindcss/")
        {
            return Ok(());
        }
        let mut bases = vec![base.to_path_buf()];
        if !id.starts_with('.') && !Path::new(id).is_absolute() {
            bases.extend(base.ancestors().map(|dir| dir.join("node_modules")));
        }
        for base in bases {
            let path = base.join(id);
            for candidate in [
                path.clone(),
                path.with_extension("css"),
                path.join("index.css"),
            ] {
                if candidate.is_file() {
                    return self.stylesheet(&candidate);
                }
            }
        }
        // Package exports and style entry points are resolved by Tailwind's
        // JavaScript resolver. Watch the package and inspect all of its CSS
        // conservatively rather than duplicating that resolver in Rust.
        if !id.starts_with('.') && !Path::new(id).is_absolute() {
            let mut parts = id.split('/');
            let first = parts.next().unwrap_or(id);
            let package = if first.starts_with('@') {
                format!("{first}/{}", parts.next().unwrap_or_default())
            } else {
                first.to_owned()
            };
            for ancestor in base.ancestors() {
                let root = ancestor.join("node_modules").join(&package);
                if root.is_dir() {
                    self.roots.insert(root.clone());
                    let automatic = self.automatic;
                    self.package_stylesheets(&root)?;
                    // Unused package stylesheets must not disable an automatic scan.
                    self.automatic |= automatic;
                    break;
                }
            }
        }
        Ok(())
    }

    fn package_stylesheets(&mut self, root: &Path) -> Result {
        let entries = fs::read_dir(root).map_err(|source| BuildError::Io {
            path: root.to_path_buf(),
            source,
        })?;
        for entry in entries {
            let entry = entry.map_err(|source| BuildError::Io {
                path: root.to_path_buf(),
                source,
            })?;
            let path = entry.path();
            if Self::ignored(&path) || entry.file_type().is_ok_and(|kind| kind.is_symlink()) {
                continue;
            }
            if path.is_dir() {
                self.package_stylesheets(&path)?;
            } else if path.extension().is_some_and(|ext| ext == "css") {
                self.stylesheet(&path)?;
            }
        }
        Ok(())
    }

    fn normalize(path: &Path) -> PathBuf {
        if let Ok(path) = fs::canonicalize(path) {
            return path;
        }
        match (path.parent(), path.file_name()) {
            (Some(parent), Some(name)) => Self::normalize(parent).join(name),
            _ => path.to_path_buf(),
        }
    }

    fn source(&mut self, base: &Path, pattern: &str) {
        // Cargo accepts paths, not globs. Watch the fixed directory prefix so
        // new matches also invalidate the build, not just today's matching files.
        let prefix = pattern.find(['*', '?', '[', '{']).map_or(pattern, |at| {
            pattern[..at].rfind('/').map_or(
                ".",
                |slash| if slash == 0 { "/" } else { &pattern[..slash] },
            )
        });
        self.roots.insert(base.join(prefix));
    }

    fn watch(
        &self,
        path: &Path,
        paths: &mut BTreeSet<PathBuf>,
        visited: &mut BTreeSet<PathBuf>,
    ) -> Result {
        let path = Self::normalize(path);
        if self
            .excluded
            .iter()
            .any(|excluded| path.starts_with(excluded))
        {
            return Ok(());
        }
        if path
            .file_name()
            .is_some_and(|name| name == "target" || name == ".git")
        {
            return Ok(());
        }
        if !path.is_dir() {
            paths.insert(path);
            return Ok(());
        }
        if !visited.insert(path.clone()) {
            return Ok(());
        }
        // Never recursively watch a root that might contain Cargo output or
        // ignored dependency/VCS trees. Split that root into its current entries.
        let entries = fs::read_dir(&path)
            .map_err(|source| BuildError::Io {
                path: path.clone(),
                source,
            })?
            .collect::<std::io::Result<Vec<_>>>()
            .map_err(|source| BuildError::Io {
                path: path.clone(),
                source,
            })?;
        let mut children = BTreeSet::new();
        let mut split = self
            .excluded
            .iter()
            .any(|excluded| excluded.starts_with(&path));
        for entry in entries {
            let child = entry.path();
            if Self::ignored(&child) {
                split = true;
                continue;
            }
            self.watch(&child, &mut children, visited)?;
            if !children.contains(&child) {
                split = true;
            }
        }
        if split {
            paths.extend(children);
        } else {
            paths.insert(path);
        }
        Ok(())
    }

    fn ignored(path: &Path) -> bool {
        path.file_name()
            .is_some_and(|name| name == "target" || name == ".git" || name == "node_modules")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tracks_imports_and_sources_relative_to_their_stylesheet() {
        let dir = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(dir.path()).unwrap();
        fs::create_dir_all(root.join("styles/nested")).unwrap();
        fs::create_dir_all(root.join("views")).unwrap();
        fs::write(root.join("styles/app.css"), "/* @source \"wrong\"; */ @import './nested/theme.css'; @import 'tailwindcss' source(none); @source not '../excluded'; @source inline('p-4');").unwrap();
        fs::write(
            root.join("styles/nested/theme.css"),
            "@import '../app.css'; @source '../../views/**/*.rs';",
        )
        .unwrap();
        let command = Command {
            input: "styles/app.css".into(),
            output: "target/out.css".into(),
            cwd: root.clone(),
            optimize: false,
            minify: false,
        };
        let inputs = Inputs::discover(&command, None).unwrap();
        let paths = inputs.paths().unwrap();
        assert_eq!(
            paths,
            BTreeSet::from([
                root.join("styles/app.css"),
                root.join("styles/nested/theme.css"),
                root.join("views")
            ])
        );
        // Fresh discovery on every run must retain the same dependencies.
        assert_eq!(
            Inputs::discover(&command, None).unwrap().paths().unwrap(),
            paths
        );
    }

    #[test]
    fn automatic_scanning_excludes_build_output_and_watches_source_directories() {
        let dir = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(dir.path()).unwrap();
        let out = root.join("custom-build/release/build/app/out");
        fs::create_dir_all(&out).unwrap();
        fs::create_dir_all(root.join("src")).unwrap();
        fs::create_dir_all(root.join("target")).unwrap();
        fs::write(root.join("app.css"), "@import 'tailwindcss';").unwrap();
        let command = Command {
            input: "app.css".into(),
            output: out.join("tailwind.css"),
            cwd: root.clone(),
            optimize: false,
            minify: false,
        };
        let paths = Inputs::discover(&command, Some(&out))
            .unwrap()
            .paths()
            .unwrap();
        assert!(paths.contains(&root.join("src")));
        assert!(paths.contains(&root.join("app.css")));
        assert!(
            !paths
                .iter()
                .any(|path| root.join("target").starts_with(path) || out.starts_with(path))
        );
    }

    #[test]
    fn watches_package_css_and_external_sources() {
        let dir = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(dir.path()).unwrap();
        fs::create_dir_all(root.join("node_modules/theme/styles")).unwrap();
        fs::create_dir_all(root.join("views")).unwrap();
        fs::write(
            root.join("app.css"),
            "@import 'tailwindcss' source(none); @import 'theme';",
        )
        .unwrap();
        fs::write(
            root.join("node_modules/theme/package.json"),
            r#"{"style":"styles/theme.css"}"#,
        )
        .unwrap();
        fs::write(
            root.join("node_modules/theme/styles/theme.css"),
            "@source '../../../views/**/*.rs';",
        )
        .unwrap();
        let command = Command {
            input: "app.css".into(),
            output: "target/out.css".into(),
            cwd: root.clone(),
            optimize: false,
            minify: false,
        };
        let paths = Inputs::discover(&command, None).unwrap().paths().unwrap();
        assert!(paths.contains(&root.join("views")));
        assert!(paths.iter().any(|path| {
            root.join("node_modules/theme/styles/theme.css")
                .starts_with(path)
        }));
        assert!(!paths.contains(&root.join("node_modules")));
    }

    #[test]
    fn url_imports_do_not_disable_automatic_scanning() {
        let dir = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(dir.path()).unwrap();
        fs::create_dir(root.join("src")).unwrap();
        fs::write(
            root.join("app.css"),
            "@import 'tailwindcss'; @import url('./external.css') source(none);",
        )
        .unwrap();
        let command = Command {
            input: "app.css".into(),
            output: "target/out.css".into(),
            cwd: root.clone(),
            optimize: false,
            minify: false,
        };
        let paths = Inputs::discover(&command, None).unwrap().paths().unwrap();
        assert!(paths.contains(&root.join("src")));
    }

    #[test]
    fn direct_utilities_sources_track_external_and_missing_roots() {
        let dir = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(dir.path()).unwrap();
        fs::create_dir_all(root.join("app/target")).unwrap();
        fs::create_dir(root.join("shared")).unwrap();
        fs::write(
            root.join("app/app.css"),
            "@tailwind utilities source('../shared'); @source './views/**/*.rs';",
        )
        .unwrap();
        let command = Command {
            input: "app.css".into(),
            output: "target/out.css".into(),
            cwd: root.join("app"),
            optimize: false,
            minify: false,
        };
        let paths = Inputs::discover(&command, None).unwrap().paths().unwrap();
        assert!(paths.contains(&root.join("shared")));
        assert!(paths.contains(&root.join("app/views")));
        assert!(
            !paths
                .iter()
                .any(|path| root.join("app/target").starts_with(path))
        );
    }

    #[test]
    fn reference_imports_do_not_disable_automatic_scanning() {
        let dir = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(dir.path()).unwrap();
        fs::create_dir(root.join("src")).unwrap();
        fs::write(root.join("app.css"), "@import 'tailwindcss'; @reference './reference.css'; @import './theme.css' source(none);").unwrap();
        fs::write(
            root.join("reference.css"),
            "@import 'tailwindcss' source(none);",
        )
        .unwrap();
        fs::write(root.join("theme.css"), ":root { --color: red; }").unwrap();
        let command = Command {
            input: "app.css".into(),
            output: "target/out.css".into(),
            cwd: root.clone(),
            optimize: false,
            minify: false,
        };
        assert!(
            Inputs::discover(&command, None)
                .unwrap()
                .paths()
                .unwrap()
                .contains(&root.join("src"))
        );
    }

    #[test]
    fn nested_utilities_track_external_sources() {
        let dir = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(dir.path()).unwrap();
        fs::create_dir(root.join("app")).unwrap();
        fs::create_dir(root.join("shared")).unwrap();
        fs::write(
            root.join("app/app.css"),
            "@layer utilities { @tailwind utilities source('../shared'); }",
        )
        .unwrap();
        let command = Command {
            input: "app.css".into(),
            output: "target/out.css".into(),
            cwd: root.join("app"),
            optimize: false,
            minify: false,
        };
        assert!(
            Inputs::discover(&command, None)
                .unwrap()
                .paths()
                .unwrap()
                .contains(&root.join("shared"))
        );
    }

    #[test]
    fn import_source_base_is_relative_to_css_not_cwd() {
        let dir = tempfile::tempdir().unwrap();
        let root = fs::canonicalize(dir.path()).unwrap();
        fs::create_dir_all(root.join("styles")).unwrap();
        fs::create_dir_all(root.join("ui")).unwrap();
        fs::write(
            root.join("styles/app.css"),
            "@import 'tailwindcss' source('../ui');",
        )
        .unwrap();
        let command = Command {
            input: "styles/app.css".into(),
            output: "target/out.css".into(),
            cwd: root.clone(),
            optimize: false,
            minify: false,
        };
        let paths = Inputs::discover(&command, None).unwrap().paths().unwrap();
        assert_eq!(
            paths,
            BTreeSet::from([root.join("styles/app.css"), root.join("ui")])
        );
    }
}
