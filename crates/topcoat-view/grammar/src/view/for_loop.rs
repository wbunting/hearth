use syn::{
    Expr,
    parse::{Parse, ParseStream},
};
use topcoat_core_grammar::ParseOption;

use crate::{
    template::TemplateForLoop,
    view::{
        Nodes,
        hir::{LowerView, ViewBuilder},
    },
};

/// A view loop with an optional `#[key(expr)]` iteration key.
pub struct ForLoop {
    pub template: TemplateForLoop<Nodes>,
    /// [fastcoat] Tokens of `$(...)` when the iterable is a client query.
    pub client: Option<proc_macro2::TokenStream>,
    /// [fastcoat] Raw body tokens (for capture analysis).
    pub client_body: proc_macro2::TokenStream,
}

impl ForLoop {
    /// Returns the expression identifying each iteration.
    ///
    /// # Panics
    ///
    /// Panics if the attributes were modified to contain an invalid key
    /// after parsing.
    #[must_use]
    pub fn key(&self) -> Option<Expr> {
        self.template
            .attributes
            .first()
            .map(|attribute| attribute.parse_args().expect("validated loop key"))
    }
}

impl Parse for ForLoop {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        // [fastcoat] `for pat in $(query) { ... }`: parse the `$(...)` iterable
        // ourselves (it isn't Rust syntax) and keep a placeholder expr.
        let fork = input.fork();
        if fork.call(syn::Attribute::parse_outer).is_ok()
            && fork.parse::<syn::Token![for]>().is_ok()
            && fork.call(syn::Pat::parse_single).is_ok()
            && fork.parse::<syn::Token![in]>().is_ok()
            && fork.peek(syn::Token![$])
        {
            let attributes = input.call(syn::Attribute::parse_outer)?;
            let for_token = input.parse()?;
            let pat = Box::new(input.call(syn::Pat::parse_single)?);
            let in_token = input.parse()?;
            input.parse::<syn::Token![$]>()?;
            let content;
            syn::parenthesized!(content in input);
            let client: proc_macro2::TokenStream = content.parse()?;
            let client_body: proc_macro2::TokenStream = {
                let f = input.fork();
                let g: proc_macro2::Group = f.parse()?;
                g.stream()
            };
            let body = input.parse()?;
            return Ok(Self {
                template: TemplateForLoop {
                    attributes,
                    for_token,
                    pat,
                    in_token,
                    expr: Box::new(syn::parse_quote!(())),
                    body,
                },
                client: Some(client),
                client_body,
            });
        }
        let loop_ = Self {
            template: input.parse()?,
            client: None,
            client_body: proc_macro2::TokenStream::new(),
        };
        for (index, attribute) in loop_.template.attributes.iter().enumerate() {
            if !attribute.path().is_ident("key") {
                return Err(syn::Error::new_spanned(
                    attribute,
                    "expected `#[key(expr)]` on a view loop",
                ));
            }
            if index > 0 {
                return Err(syn::Error::new_spanned(attribute, "duplicate loop key"));
            }
            attribute.parse_args::<Expr>()?;
        }
        Ok(loop_)
    }
}

impl ParseOption for ForLoop {
    fn peek(input: ParseStream) -> bool {
        TemplateForLoop::<Nodes>::peek(input)
    }
}

impl ForLoop {
    /// [fastcoat] `for row in $(query) { ... }` is a *client* loop over a live
    /// query: the body becomes a row template rendered on the server for the
    /// first view and cloned per row in the browser.
    fn client_iterable(&self) -> Option<proc_macro2::TokenStream> {
        self.client.clone()
    }
}

impl LowerView for ForLoop {
    fn lower(&self, builder: &mut ViewBuilder) {
        if let Some(query) = self.client_iterable() {
            let pat = &self.template.pat;
            let mut body_builder = ViewBuilder::new();
            self.template.body.lower(&mut body_builder);
            let body_owned = body_builder.finish().emit_view(true);
            let fastcoat = quote::quote! { ::fastcoat };
            // The body runs once per SSR row + once for the template, so it
            // must be `Fn`: every capture is cloned into each invocation
            // (captures are cheap: signals/handles/Exprs are Arc-like).
            // Free identifiers the body may capture from the enclosing scope:
            // the body runs once per SSR row + once for the template (an `Fn`),
            // so each invocation clones what it uses. Unknown idents (fields,
            // methods, locals) are filtered by `__fastcoat_clone_if_local!`,
            // which only clones names bound in the enclosing scope.
            let mut idents = std::collections::BTreeSet::new();
            collect_expr_idents(self.client_body.clone(), &mut idents);
            let pat_idents: std::collections::BTreeSet<String> =
                collect_pat_idents(pat);
            let clones = idents
                .iter()
                .filter(|i| !pat_idents.contains(*i) && is_capture_candidate(i))
                .map(|i| {
                    let id = syn::Ident::new(i, proc_macro2::Span::call_site());
                    quote::quote! { let #id = ::core::clone::Clone::clone(&#id); }
                });
            let clones2 = clones.clone();
            let clones2: Vec<_> = clones2.collect();
            let tokens = quote::quote! {
                #fastcoat::client_for(__cx, #query, {
                    #(#clones2)*
                    move |__cx_owned: ::topcoat::context::Cx, #pat| {
                        #(#clones2)*
                        let __cx = __cx_owned;
                        ::topcoat::view::ViewExt::boxed(#body_owned)
                    }
                })
            };
            let _ = clones;
            builder.expr(crate::view::hir::ExprKind::Node, tokens);
            return;
        }
        builder.for_loop(
            &self.template.pat,
            &self.template.expr,
            self.key(),
            |body| {
                self.template.body.lower(body);
            },
        );
    }
}

#[cfg(feature = "pretty")]
impl topcoat_core_grammar::pretty::PrettyPrint for ForLoop {
    fn pretty_print(&self, printer: &mut topcoat_core_grammar::pretty::Printer<'_>) {
        self.template.pretty_print(printer);
    }
}

#[cfg(test)]
mod tests {
    use quote::ToTokens;

    use super::*;

    #[test]
    fn extracts_key_expression() {
        let loop_: ForLoop =
            syn::parse_str("#[key(item.id)] for item in items { card() }").unwrap();
        assert_eq!(
            loop_.key().unwrap().to_token_stream().to_string(),
            "item . id"
        );
    }

    #[test]
    fn key_is_optional() {
        let loop_: ForLoop = syn::parse_str("for item in items {}").unwrap();
        assert!(loop_.key().is_none());
    }

    #[test]
    fn rejects_invalid_attributes() {
        for attribute in [
            "#[other(item)]",
            "#[key]",
            "#[key()]",
            "#[key(a, b)]",
            "#[key($(item))]",
            "#[key(item)] #[key(item)]",
        ] {
            let source = format!("{attribute} for item in items {{}}");
            assert!(syn::parse_str::<ForLoop>(&source).is_err(), "{source}");
        }
    }
}

/// [fastcoat] Identifiers in a token stream (for capture cloning).
fn collect_idents(ts: proc_macro2::TokenStream, out: &mut std::collections::BTreeSet<String>) {
    let mut prev_dot = false;
    for tt in ts {
        match tt {
            proc_macro2::TokenTree::Ident(i) => {
                if !prev_dot {
                    out.insert(i.to_string());
                }
                prev_dot = false;
            }
            proc_macro2::TokenTree::Group(g) => {
                collect_idents(g.stream(), out);
                prev_dot = false;
            }
            proc_macro2::TokenTree::Punct(p) => prev_dot = p.as_char() == '.' || p.as_char() == ':',
            proc_macro2::TokenTree::Literal(_) => prev_dot = false,
        }
    }
}

fn collect_pat_idents(pat: &syn::Pat) -> std::collections::BTreeSet<String> {
    let mut out = std::collections::BTreeSet::new();
    collect_idents(quote::ToTokens::to_token_stream(pat), &mut out);
    out
}

/// Lowercase snake identifiers that aren't keywords/HTML tag names are
/// candidate captures. (Spike heuristic; the real version resolves names
/// with the same `NameResolver` the `$()` lowering uses.)
fn is_capture_candidate(i: &str) -> bool {
    const SKIP: &[&str] = &[
        "if", "else", "for", "in", "let", "match", "move", "async", "await", "true", "false", "mut", "ref",
        "self", "Self", "return", "as", "fn", "e", "_e", "class", "type", "value", "selected", "placeholder",
        "href", "id", "li", "ul", "span", "button", "a", "div", "input", "select", "option", "strong", "p",
        "clone", "unwrap", "is_some", "is_none", "to_owned", "get", "set", "target", "len", "Some", "None",
    ];
    i.chars().next().is_some_and(|c| c.is_ascii_lowercase()) && !SKIP.contains(&i) && !i.starts_with("__")
}

/// Idents inside `$(...)` runtime exprs and `(...)` template exprs only (not
/// tag names, attribute names or text).
fn collect_expr_idents(ts: proc_macro2::TokenStream, out: &mut std::collections::BTreeSet<String>) {
    let mut prev: Option<proc_macro2::TokenTree> = None;
    for tt in ts {
        if let proc_macro2::TokenTree::Group(g) = &tt {
            let is_expr = g.delimiter() == proc_macro2::Delimiter::Parenthesis
                && !matches!(&prev, Some(proc_macro2::TokenTree::Ident(_)));
            if is_expr {
                collect_idents(g.stream(), out);
            } else {
                collect_expr_idents(g.stream(), out);
            }
        }
        prev = Some(tt);
    }
}

/// [fastcoat] `if $(cond) { body }` in view position: rendered on the server
/// when `cond` is true, and switched in the browser when it changes.
pub struct ClientIf {
    pub cond: proc_macro2::TokenStream,
    pub body: crate::template::TemplateBlock<Nodes>,
    pub raw_body: proc_macro2::TokenStream,
}

impl ClientIf {
    pub fn peek(input: ParseStream) -> bool {
        input.peek(syn::Token![if]) && input.peek2(syn::Token![$])
    }
}

impl Parse for ClientIf {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        input.parse::<syn::Token![if]>()?;
        input.parse::<syn::Token![$]>()?;
        let c;
        syn::parenthesized!(c in input);
        let cond = c.parse()?;
        let raw_body = {
            let f = input.fork();
            let g: proc_macro2::Group = f.parse()?;
            g.stream()
        };
        Ok(Self { cond, body: input.parse()?, raw_body })
    }
}

impl LowerView for ClientIf {
    fn lower(&self, builder: &mut ViewBuilder) {
        let mut body_builder = ViewBuilder::new();
        self.body.lower(&mut body_builder);
        let body_owned = body_builder.finish().emit_view(true);
        let mut idents = std::collections::BTreeSet::new();
        collect_expr_idents(self.raw_body.clone(), &mut idents);
        // Names bound by `for <pat> in` inside the body aren't captures.
        let mut bound = std::collections::BTreeSet::new();
        collect_for_bindings(self.raw_body.clone(), &mut bound);
        let clones = idents.iter().filter(|i| is_capture_candidate(i) && !bound.contains(*i)).map(|i| {
            let id = syn::Ident::new(i, proc_macro2::Span::call_site());
            quote::quote! { let #id = ::core::clone::Clone::clone(&#id); }
        });
        let clones: Vec<_> = clones.collect();
        let cond = &self.cond;
        // Clone captures once for this region (outer), then per invocation (inner).
        let tokens = quote::quote! {
            ::fastcoat::route::when(__cx, ::topcoat::runtime::expr!(#cond), {
                #(#clones)*
                move |__cx_owned: ::topcoat::context::Cx| {
                    #(#clones)*
                    let __cx = __cx_owned;
                    ::topcoat::view::ViewExt::boxed(#body_owned)
                }
            })
        };
        builder.expr(crate::view::hir::ExprKind::Node, tokens);
    }
}

fn collect_for_bindings(ts: proc_macro2::TokenStream, out: &mut std::collections::BTreeSet<String>) {
    let toks: Vec<_> = ts.into_iter().collect();
    for (i, tt) in toks.iter().enumerate() {
        match tt {
            proc_macro2::TokenTree::Ident(id) if id == "for" => {
                if let Some(proc_macro2::TokenTree::Ident(b)) = toks.get(i + 1) {
                    out.insert(b.to_string());
                }
            }
            proc_macro2::TokenTree::Group(g) => collect_for_bindings(g.stream(), out),
            _ => {}
        }
    }
}
