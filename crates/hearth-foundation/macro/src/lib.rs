#![cfg_attr(docsrs, feature(doc_cfg))]

use proc_macro::TokenStream;
use quote::quote;

#[doc = include_str!("../docs/memoize.md")]
#[proc_macro_attribute]
pub fn memoize(attr: TokenStream, item: TokenStream) -> TokenStream {
    match hearth_foundation_grammar::memoize::Memoize::parse(attr.into(), item.into()) {
        Ok(value) => quote! { #value }.into(),
        Err(error) => error.to_compile_error().into(),
    }
}
