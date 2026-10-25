//! Paths to the framework crates, for naming their items in generated code.
//!
//! Generated code must use paths available to the calling crate. Each [`Crate`]
//! constant resolves to a direct dependency when present, or through the
//! `hearth` facade otherwise. Dependency renames are respected.
//!
//! Interpolate a constant into `quote!` like any other path:
//!
//! ```ignore
//! use hearth_foundation_grammar::paths::{hearth_context, hearth_view};
//!
//! quote! {
//!     impl #hearth_view::Component for #ident {
//!         async fn render(self, cx: &#hearth_context::Cx) -> #ret { ... }
//!     }
//! }
//! ```

use proc_macro_crate::{FoundCrate, crate_name};
use proc_macro2::TokenStream;
use quote::ToTokens;

/// A framework crate, or a module within one, that generated code can refer to.
///
/// Interpolate it into `quote!` to emit a path available at the call site.
/// Direct dependencies take precedence over the facade.
pub struct Crate {
    /// Path within the `hearth` facade, e.g. `"view"` for `::hearth::view`.
    /// Empty for the facade root, `::hearth` itself.
    facade: &'static str,
    /// Cargo package name of the standalone crate, e.g. `"hearth-view"`.
    package: &'static str,
    /// Module path within the standalone crate, used when the facade flattens a
    /// submodule that lives deeper in its own crate (e.g. `::hearth::context`
    /// is `hearth_foundation::context`). Empty for the crate root.
    module: &'static str,
}

impl Crate {
    const fn new(facade: &'static str, package: &'static str, module: &'static str) -> Self {
        Self {
            facade,
            package,
            module,
        }
    }

    /// The resolved crate path as a string, for contexts that need a string
    /// literal rather than tokens -- such as `#[serde(crate = "...")]`.
    #[must_use]
    pub fn path_string(&self) -> String {
        resolve(self)
    }
}

impl ToTokens for Crate {
    fn to_tokens(&self, tokens: &mut TokenStream) {
        let path = resolve(self);
        let path: syn::Path = syn::parse_str(&path).expect("resolved crate path is valid");
        path.to_tokens(tokens);
    }
}

/// Resolves `krate` to a path for the crate currently being compiled.
///
/// The standalone crate is preferred whenever it is a direct dependency: a
/// component library depends on the individual crates (`hearth-view`, and so
/// on) and names them directly. This holds even when the library *also* pulls
/// the facade in as a dev-dependency for its tests -- keying off the standalone
/// crate keeps the library's own code resolving to the crates its `lib` target
/// actually links, which a facade-first check would get wrong (`crate_name`
/// cannot tell a dev-dependency from a real one). Only a caller that depends on
/// the facade alone -- an application crate -- falls through to the facade path.
fn resolve(krate: &Crate) -> String {
    if let Some(base) = crate_base(krate.package) {
        return join(&base, krate.module);
    }

    if let Some(base) = crate_base("hearth") {
        return join(&base, krate.facade);
    }

    // Neither the crate nor the facade is a declared dependency (as in a grammar
    // crate's own unit tests). Fall back to the bare underscored crate name.
    join(
        &format!("::{}", krate.package.replace('-', "_")),
        krate.module,
    )
}

/// Joins a resolved crate base with a submodule path, e.g. `("::hearth",
/// "view")` becomes `"::hearth::view"`. An empty submodule leaves the base
/// untouched, as for the facade root or a crate referred to at its top level.
fn join(base: &str, submodule: &str) -> String {
    if submodule.is_empty() {
        base.to_owned()
    } else {
        format!("{base}::{submodule}")
    }
}

/// The base path to `package` when it is a direct dependency of the crate being
/// compiled: `::renamed` under whatever name the dependent gives it, or the
/// crate's own extern name when it *is* that crate. `None` when it is not a
/// dependency.
///
/// The self-referential case names the crate `::hearth_view` rather than
/// `crate`, because `crate_name` reports `Itself` even inside a doctest -- which
/// is compiled as a *separate* crate that links the real one as an extern, where
/// `crate` would point at the doctest binary. Each framework crate carries an
/// `extern crate self as hearth_...;` alias so that this same extern name also
/// resolves within its own non-doctest builds. See the [module docs](self).
///
/// The lookup runs on every call rather than being cached per package: under
/// rust-analyzer, a single long-lived proc-macro server process expands macros
/// for every crate in the workspace, so the answer depends on which crate's
/// call site is currently being expanded (`CARGO_MANIFEST_DIR`). `crate_name`
/// caches the parsed manifest per `CARGO_MANIFEST_DIR` itself, keeping repeated
/// lookups cheap.
fn crate_base(package: &str) -> Option<String> {
    match crate_name(package) {
        Ok(FoundCrate::Itself) => Some(format!("::{}", package.replace('-', "_"))),
        Ok(FoundCrate::Name(name)) => Some(format!("::{name}")),
        Err(_) => None,
    }
}

/// `::hearth::asset`, or `hearth_asset` standalone.
#[allow(non_upper_case_globals)]
pub const hearth_asset: Crate = Crate::new("asset", "hearth-asset", "");

/// `::hearth::context`, or `hearth_foundation::context` standalone.
#[allow(non_upper_case_globals)]
pub const hearth_context: Crate = Crate::new("context", "hearth-foundation", "context");

/// Shared core types.
#[allow(non_upper_case_globals)]
pub const hearth_foundation: Crate = Crate::new("core", "hearth-foundation", "");

/// The `memoize` macro: `::hearth::context`, or `hearth_foundation_macro` standalone.
#[allow(non_upper_case_globals)]
pub const hearth_context_macro: Crate = Crate::new("context", "hearth-foundation-macro", "");

/// `::hearth` (the facade root), or `hearth_foundation::error` standalone: the
/// `Error` and `Result` types, which the facade re-exports at its root.
#[allow(non_upper_case_globals)]
pub const hearth_error: Crate = Crate::new("", "hearth-foundation", "error");

/// `::hearth::internal`, or `hearth_foundation::internal` standalone.
#[allow(non_upper_case_globals)]
pub const hearth_internal: Crate = Crate::new("internal", "hearth-foundation", "internal");

/// `::hearth::internal::inventory`, or the standalone `inventory` crate that
/// the facade re-exports there.
#[allow(non_upper_case_globals)]
pub const hearth_inventory: Crate = Crate::new("internal::inventory", "inventory", "");

/// `::hearth::internal::serde`, or the standalone `serde` crate that the facade
/// re-exports there.
#[allow(non_upper_case_globals)]
pub const hearth_serde: Crate = Crate::new("internal::serde", "serde", "");

/// `::hearth::font`, or `hearth_font` standalone.
#[allow(non_upper_case_globals)]
pub const hearth_font: Crate = Crate::new("font", "hearth-font", "");

/// The `font!` (and sibling) macros: `::hearth::font`, or `hearth_font_macro`
/// standalone.
#[allow(non_upper_case_globals)]
pub const hearth_font_macro: Crate = Crate::new("font", "hearth-font-macro", "");

/// `::hearth::font::fontsource`, or `hearth_font::fontsource` standalone: the
/// Fontsource catalog types, behind the `fontsource` feature.
#[allow(non_upper_case_globals)]
pub const hearth_font_fontsource: Crate =
    Crate::new("font::fontsource", "hearth-font", "fontsource");

/// The `fontsource_font_face!` (and sibling) macros:
/// `::hearth::font::fontsource`, or `hearth_font_macro` standalone.
#[allow(non_upper_case_globals)]
pub const hearth_font_fontsource_macro: Crate =
    Crate::new("font::fontsource", "hearth-font-macro", "");

/// `::hearth::icon`, or `hearth_icon` standalone.
#[allow(non_upper_case_globals)]
pub const hearth_icon: Crate = Crate::new("icon", "hearth-icon", "");

/// `::hearth::mail`, or `hearth_mail` standalone.
#[allow(non_upper_case_globals)]
pub const hearth_mail: Crate = Crate::new("mail", "hearth-mail", "");

/// `::hearth::router`, or `hearth_router` standalone.
#[allow(non_upper_case_globals)]
pub const hearth_router: Crate = Crate::new("router", "hearth-router", "");

/// The `segment!` (and sibling) macros: `::hearth::router`, or
/// `hearth_router_macro` standalone.
#[allow(non_upper_case_globals)]
pub const hearth_router_macro: Crate = Crate::new("router", "hearth-router-macro", "");

/// `::hearth::runtime`, or `hearth_runtime` standalone.
#[allow(non_upper_case_globals)]
pub const hearth_runtime: Crate = Crate::new("runtime", "hearth-runtime", "");

/// The `expr!` (and sibling) macros: `::hearth::runtime`, or
/// `hearth_runtime_macro` standalone.
#[allow(non_upper_case_globals)]
pub const hearth_runtime_macro: Crate = Crate::new("runtime", "hearth-runtime-macro", "");

/// `::hearth::view`, or `hearth_view` standalone.
#[allow(non_upper_case_globals)]
pub const hearth_view: Crate = Crate::new("view", "hearth-view", "");

/// The `view!`, `component`, and `Props` (and sibling) macros:
/// `::hearth::view`, or `hearth_view_macro` standalone.
#[allow(non_upper_case_globals)]
pub const hearth_view_macro: Crate = Crate::new("view", "hearth-view-macro", "");
