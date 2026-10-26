use hearth_foundation_grammar::{
    ParseOption,
    paths::{hearth_context, hearth_inventory, hearth_router, hearth_view, hearth_view_macro},
};
use proc_macro2::TokenStream;
use quote::{ToTokens, quote};
use syn::{
    FnArg, ItemFn, Pat, ReturnType,
    parse::{Parse, ParseStream},
    spanned::Spanned,
};

use super::common::HandlerPath;

pub struct LayoutAttr {
    path: Option<HandlerPath>,
}

impl Parse for LayoutAttr {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        Ok(Self {
            path: input.call(HandlerPath::parse_option)?,
        })
    }
}

/// The annotated `async fn` that becomes a layout: a component taking the
/// child content as its `slot` parameter and, optionally, the request
/// context as `cx`.
pub struct LayoutItem {
    item: ItemFn,
}

impl Parse for LayoutItem {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let item: ItemFn = input.parse()?;
        if item.sig.asyncness.is_none() {
            return Err(syn::Error::new(
                item.sig.fn_token.span(),
                "layout functions must be async",
            ));
        }
        if let ReturnType::Default = &item.sig.output {
            return Err(syn::Error::new(
                item.sig.fn_token.span(),
                "layout functions must declare a return type",
            ));
        }

        let (mut slot, mut cx) = (false, false);
        for arg in &item.sig.inputs {
            let FnArg::Typed(pat_type) = arg else {
                return Err(syn::Error::new_spanned(
                    arg,
                    "layout functions cannot take a `self` receiver",
                ));
            };
            let seen = match &*pat_type.pat {
                Pat::Ident(pat) if pat.ident == "slot" => &mut slot,
                Pat::Ident(pat) if pat.ident == "cx" => &mut cx,
                _ => &mut true,
            };
            if *seen {
                return Err(syn::Error::new_spanned(
                    pat_type,
                    "layout functions only accept a `slot: Slot<'_>` and an optional `cx: &Cx` parameter",
                ));
            }
            *seen = true;
        }
        if !slot {
            return Err(syn::Error::new_spanned(
                &item.sig,
                "layout functions must take a `slot: Slot<'_>` parameter",
            ));
        }

        Ok(Self { item })
    }
}

pub struct Layout(LayoutAttr, LayoutItem);

impl Layout {
    #[must_use]
    pub fn new(attr: LayoutAttr, item: LayoutItem) -> Self {
        Self(attr, item)
    }

    /// Parses a layout attribute and item from token streams.
    ///
    /// # Errors
    ///
    /// Returns an error if either token stream fails to parse as a
    /// [`LayoutAttr`] or [`LayoutItem`], or if the item is not a valid layout
    /// function.
    pub fn parse(attr: TokenStream, item: TokenStream) -> syn::Result<Self> {
        Ok(Self::new(syn::parse2(attr)?, syn::parse2(item)?))
    }
}

impl ToTokens for Layout {
    fn to_tokens(&self, tokens: &mut TokenStream) {
        let attr = &self.0;
        let item = &self.1.item;
        let ident = &item.sig.ident;

        let component = quote! {
            #[#hearth_view_macro::component]
            #item
        };

        let render = quote! {
            fn render<'a>(
                &'a self,
                cx: &'a #hearth_context::Cx,
                slot: #hearth_router::Slot<'a>,
            ) -> #hearth_view::BoxView<'a> {
                let props = <#ident as #hearth_view::Component>::props_builder()
                    .slot(slot)
                    .build();
                ::std::boxed::Box::pin(#hearth_view::HoistView::new(
                    #hearth_view::internal::ThenView::new(
                        <#ident as #hearth_view::Component>::render(#ident, cx, props)
                    )
                ))
            }
        };
        let (layout, submit_as) =
            if let Some(path) = attr.path.as_ref().and_then(HandlerPath::absolute) {
                let layout = quote! {
                    impl #hearth_router::Layout for #ident {
                        fn path(&self) -> &#hearth_router::Path {
                            const PATH: &#hearth_router::Path = #hearth_router::Path::new(#path);
                            PATH
                        }

                        #render
                    }
                };
                (layout, quote! { #hearth_router::Layout })
            } else {
                let relative_path = attr
                    .path
                    .as_ref()
                    .and_then(HandlerPath::relative_path_method);
                let layout = quote! {
                    impl #hearth_router::ModuleLayout for #ident {
                        fn module_path(&self) -> &'static str {
                            ::core::module_path!()
                        }

                        #relative_path

                        #render
                    }
                };
                (layout, quote! { #hearth_router::ModuleLayout })
            };

        // Discovery collects the marker erased behind its trait.
        let submit = cfg!(feature = "discover").then(|| {
            quote! { #hearth_inventory::submit! { &#ident as &'static dyn #submit_as } }
        });

        quote! {
            #component

            const _: () = {
                #layout

                #submit
            };
        }
        .to_tokens(tokens);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse_err(source: &str) -> String {
        match syn::parse_str::<LayoutItem>(source) {
            Ok(_) => panic!("expected parse error for `{source}`"),
            Err(err) => err.to_string(),
        }
    }

    #[test]
    fn accepts_a_slot_parameter() {
        syn::parse_str::<LayoutItem>(
            "async fn shell(slot: Slot<'_>) -> Result<impl View> { todo!() }",
        )
        .unwrap();
    }

    #[test]
    fn accepts_cx_and_slot_in_any_order() {
        syn::parse_str::<LayoutItem>(
            "async fn shell(cx: &Cx, slot: Slot<'_>) -> Result<impl View> { todo!() }",
        )
        .unwrap();
        syn::parse_str::<LayoutItem>(
            "async fn shell(slot: Slot<'_>, cx: &Cx) -> Result<impl View> { todo!() }",
        )
        .unwrap();
    }

    #[test]
    fn rejects_non_async_fn() {
        assert!(
            parse_err("fn shell(slot: Slot<'_>) -> Result<impl View> { todo!() }")
                .contains("must be async")
        );
    }

    #[test]
    fn rejects_missing_return_type() {
        assert!(
            parse_err("async fn shell(slot: Slot<'_>) {}").contains("must declare a return type")
        );
    }

    #[test]
    fn rejects_missing_slot() {
        assert!(
            parse_err("async fn shell(cx: &Cx) -> Result<impl View> { todo!() }")
                .contains("must take a `slot: Slot<'_>` parameter")
        );
    }

    #[test]
    fn rejects_self_receiver() {
        let err =
            parse_err("async fn shell(&self, slot: Slot<'_>) -> Result<impl View> { todo!() }");
        assert!(err.contains("cannot take a `self` receiver"));
    }

    #[test]
    fn rejects_unknown_parameter_names() {
        let err = parse_err(
            "async fn shell(slot: Slot<'_>, body: Form<A>) -> Result<impl View> { todo!() }",
        );
        assert!(err.contains("only accept"));
    }

    #[test]
    fn rejects_duplicate_slot_parameters() {
        let err = parse_err(
            "async fn shell(slot: Slot<'_>, slot: Slot<'_>) -> Result<impl View> { todo!() }",
        );
        assert!(err.contains("only accept"));
    }
}
