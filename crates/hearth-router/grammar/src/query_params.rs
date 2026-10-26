use hearth_foundation_grammar::paths::{
    hearth_context, hearth_context_macro, hearth_router, hearth_serde,
};
use proc_macro2::TokenStream;
use quote::{ToTokens, quote};
use syn::{
    DeriveInput,
    parse::{Parse, ParseStream},
};

use super::common::ErrorAttr;

pub struct QueryParamsAttr {
    error: Option<ErrorAttr>,
}

impl Parse for QueryParamsAttr {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        Ok(Self {
            error: if input.is_empty() {
                None
            } else {
                Some(input.parse()?)
            },
        })
    }
}

pub struct QueryParamsItem {
    item: DeriveInput,
}

impl Parse for QueryParamsItem {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        Ok(Self {
            item: input.parse()?,
        })
    }
}

pub struct QueryParams(QueryParamsAttr, QueryParamsItem);

impl QueryParams {
    #[must_use]
    pub fn new(attr: QueryParamsAttr, item: QueryParamsItem) -> Self {
        Self(attr, item)
    }

    /// Parses a `query_params` attribute and item from token streams.
    ///
    /// # Errors
    ///
    /// Returns an error if either token stream fails to parse as a
    /// [`QueryParamsAttr`] or [`QueryParamsItem`].
    pub fn parse(attr: TokenStream, item: TokenStream) -> syn::Result<Self> {
        Ok(Self::new(syn::parse2(attr)?, syn::parse2(item)?))
    }
}

impl ToTokens for QueryParams {
    fn to_tokens(&self, tokens: &mut TokenStream) {
        let item = &self.1.item;
        let ident = &item.ident;

        let (error_ty, map_err) = match &self.0.error {
            Some(error) => (
                error.ty(),
                error.map_err(quote! {
                    |error| #hearth_router::error::bad_request_at(
                        error.path(),
                        format!("invalid query value: {}", error.inner()),
                    )
                }),
            ),
            None => (
                quote! { &'__cx #hearth_router::QueryParamsError },
                quote! {},
            ),
        };

        // `#[serde(crate = ...)]` takes the path to the re-exported `serde` crate
        // as a string literal, so it needs the resolved path as a `String`
        // rather than interpolated tokens.
        let serde_crate = hearth_serde.path_string();

        quote! {
            #[derive(#hearth_serde::Deserialize)]
            #[serde(crate = #serde_crate)]
            #item

            impl #hearth_router::QueryParams for #ident {
                type Output<'__cx> = ::core::result::Result<&'__cx Self, #error_ty>;

                fn query_params(
                    cx: &#hearth_context::Cx,
                    _: #hearth_router::QueryParamsSealed,
                ) -> Self::Output<'_> {
                    #[#hearth_context_macro::memoize(as_ref)]
                    fn parse(cx: &#hearth_context::Cx) -> ::core::result::Result<#ident, #hearth_router::QueryParamsError> {
                        #hearth_router::parse_query_params(cx)
                    }
                    parse(cx)#map_err
                }
            }
        }
        .to_tokens(tokens);
    }
}
