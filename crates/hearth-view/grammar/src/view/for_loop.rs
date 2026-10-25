use hearth_foundation_grammar::ParseOption;
use syn::{
    Expr,
    parse::{Parse, ParseStream},
};

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
    /// [hearth] Tokens of `$(...)` when the iterable is a client query.
    pub client: Option<proc_macro2::TokenStream>,
    /// [hearth] Raw body tokens (for capture analysis).
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
        // [hearth] `for pat in $(query) { ... }`: parse the `$(...)` iterable
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
    /// [hearth] `for row in $(query) { ... }` is a *client* loop over a live
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
            let hearth = quote::quote! { ::hearth };
            // The body runs once per SSR row + once for the template, so it
            // must be `Fn`: every capture is cloned into each invocation
            // (captures are cheap: signals/handles/Exprs are Arc-like).
            // Exactly the identifiers the body uses from the enclosing scope
            // (see `captures.rs`); each invocation clones its own copy.
            let bound = captures_bound(pat);
            let clones2 = super::captures::free_idents(&self.client_body, &bound)
                .into_iter()
                .map(|i| {
                    let id = syn::Ident::new(&i, proc_macro2::Span::call_site());
                    quote::quote! { let #id = ::core::clone::Clone::clone(&#id); }
                });
            let clones2: Vec<_> = clones2.collect();
            let tokens = quote::quote! {
                #hearth::client_for(__cx, ::core::clone::Clone::clone(&(#query)), {
                    #(#clones2)*
                    move |__cx_owned: ::hearth::context::Cx, #pat| {
                        #(#clones2)*
                        let __cx = __cx_owned;
                        ::hearth::view::ViewExt::boxed(#body_owned)
                    }
                })
            };

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
impl hearth_foundation_grammar::pretty::PrettyPrint for ForLoop {
    fn pretty_print(&self, printer: &mut hearth_foundation_grammar::pretty::Printer<'_>) {
        if let Some(client) = &self.client {
            self.template.attributes.pretty_print(printer);
            self.template.for_token.pretty_print(printer);
            " ".pretty_print(printer);
            self.template.pat.pretty_print(printer);
            " ".pretty_print(printer);
            self.template.in_token.pretty_print(printer);
            " $(".pretty_print(printer);
            syn::parse2::<syn::Expr>(client.clone())
                .unwrap_or_else(|_| syn::Expr::Verbatim(client.clone()))
                .pretty_print(printer);
            ") ".pretty_print(printer);
            self.template.body.pretty_print(printer);
        } else {
            self.template.pretty_print(printer);
        }
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

/// [hearth] `if $(cond) { body }` in view position: rendered on the server
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
        Ok(Self {
            cond,
            body: input.parse()?,
            raw_body,
        })
    }
}

impl LowerView for ClientIf {
    fn lower(&self, builder: &mut ViewBuilder) {
        let mut body_builder = ViewBuilder::new();
        self.body.lower(&mut body_builder);
        let body_owned = body_builder.finish().emit_view(true);
        let clones =
            super::captures::free_idents(&self.raw_body, &std::collections::BTreeSet::new())
                .into_iter()
                .map(|i| {
                    let id = syn::Ident::new(&i, proc_macro2::Span::call_site());
                    quote::quote! { let #id = ::core::clone::Clone::clone(&#id); }
                });
        let clones: Vec<_> = clones.collect();
        let cond = &self.cond;
        // Clone captures once for this region (outer), then per invocation (inner).
        let tokens = quote::quote! {
            ::hearth::route::when(__cx, ::hearth::runtime::expr!(#cond), {
                #(#clones)*
                move |__cx_owned: ::hearth::context::Cx| {
                    #(#clones)*
                    let __cx = __cx_owned;
                    ::hearth::view::ViewExt::boxed(#body_owned)
                }
            })
        };
        builder.expr(crate::view::hir::ExprKind::Node, tokens);
    }
}

#[cfg(feature = "pretty")]
impl hearth_foundation_grammar::pretty::PrettyPrint for ClientIf {
    fn pretty_print(&self, printer: &mut hearth_foundation_grammar::pretty::Printer<'_>) {
        "if $(".pretty_print(printer);
        syn::parse2::<syn::Expr>(self.cond.clone())
            .unwrap_or_else(|_| syn::Expr::Verbatim(self.cond.clone()))
            .pretty_print(printer);
        ") ".pretty_print(printer);
        self.body.pretty_print(printer);
    }
}

fn captures_bound(pat: &syn::Pat) -> std::collections::BTreeSet<String> {
    struct P(std::collections::BTreeSet<String>);
    impl<'ast> syn::visit::Visit<'ast> for P {
        fn visit_pat_ident(&mut self, i: &'ast syn::PatIdent) {
            self.0.insert(i.ident.to_string());
        }
    }
    let mut p = P(std::collections::BTreeSet::new());
    syn::visit::Visit::visit_pat(&mut p, pat);
    p.0
}
