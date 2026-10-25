use std::{fmt, ops::AddAssign};

use proc_macro2::{Ident, TokenStream};
use quote::{ToTokens, quote};
use topcoat_core_grammar::paths::topcoat_runtime;

/// JavaScript source interleaved with expressions captured by the server.
#[derive(Default)]
pub(super) struct Js {
    source: String,
    parts: TokenStream,
    compiled: String,
    captures: usize,
}

impl Js {
    pub(super) fn push_str(&mut self, source: &str) {
        self.source.push_str(source);
    }

    pub(super) fn push(&mut self, character: char) {
        self.source.push(character);
    }

    pub(super) fn expression(&mut self, ident: &Ident) {
        use std::fmt::Write;
        let source = std::mem::take(&mut self.source);
        self.compiled.push_str(&source);
        let _ = write!(
            self.compiled,
            "cx.expression(__topcoatCaptures.expressions[{}])",
            self.captures
        );
        self.captures += 1;
        quote! { .source(#source).expression(&#ident) }.to_tokens(&mut self.parts);
    }
}

impl ToTokens for Js {
    fn to_tokens(&self, tokens: &mut TokenStream) {
        let parts = &self.parts;
        let source = &self.source;
        let compiled = format!("{}{source}", self.compiled);
        quote! {{
            #topcoat_runtime::internal::inventory::submit! {
                #topcoat_runtime::expression_module::ExpressionSource(#compiled)
            }
            #topcoat_runtime::Js::builder().compiled(#compiled) #parts .source(#source).build()
        }}
        .to_tokens(tokens);
    }
}

impl fmt::Write for Js {
    fn write_str(&mut self, source: &str) -> fmt::Result {
        self.push_str(source);
        Ok(())
    }
}

impl AddAssign<&str> for Js {
    fn add_assign(&mut self, source: &str) {
        self.push_str(source);
    }
}
