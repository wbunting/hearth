//! Client routing and conditional regions, authored in Rust.
//!
//! `route::path(cx)` is an `Expr<String>` whose server value is the request
//! path and whose JS is the browser router's reactive path. `when(cond, body)`
//! renders `body` iff `cond`, on the server (SSR) and in the browser
//! (template clone + hydrate), switching locally when `cond` changes.
//!
//! ```ignore
//! let path = route::path(cx);
//! view! {
//!   (when(cx, expr!(path.starts_with("/rs/issue/")), view! { issue_detail() }))
//!   (when(cx, expr!(path == "/rs/issues"), view! { issue_list() }))
//! }
//! ```

use std::sync::atomic::{AtomicU64, Ordering};

use topcoat::{
    Result,
    context::Cx,
    runtime::{Expr, Js},
    view::{BoxView, Unescaped, View, ViewExt},
};

/// The current path as a reactive `Expr<String>` (server: request path).
#[must_use]
pub fn path(cx: &Cx) -> Expr<String> {
    let uri = topcoat::router::request::uri(cx);
    let p = uri.path_and_query().map_or_else(|| uri.path().to_owned(), |pq| pq.as_str().to_owned());
    Expr::evaluate_dynamic(p, Js::source("cx.route.path()"))
}

/// The `n`th path segment as a reactive `Expr<String>`.
#[must_use]
pub fn segment(cx: &Cx, n: usize) -> Expr<String> {
    let uri = topcoat::router::request::uri(cx);
    let seg = uri.path().split('/').filter(|s| !s.is_empty()).nth(n).unwrap_or("").to_owned();
    Expr::evaluate_dynamic(seg, Js::source(format!("cx.route.segment({n})")))
}

static NEXT: AtomicU64 = AtomicU64::new(0);

/// A client-switchable region. `body` must not depend on server-only state
/// that differs per route (it's rendered once into a `<template>` too).
pub fn when<'a>(cx: &'a Cx, cond: Expr<bool>, body: impl Fn(Cx) -> BoxView<'static> + Send + Sync + 'a) -> BoxView<'a> {
    let cx = cx.clone();
    Box::pin(topcoat::view::internal::ScopeView::new(topcoat::view::internal::MoveView::new(async move {
        let (on, js) = cond.into_evaluated_and_js();
        let src = js.to_source();
        let _ = NEXT.fetch_add(0, Ordering::Relaxed);
        let id = format!(
            "fc-when-{:012x}",
            crate::table::fnv64(src.as_bytes()) & 0xffff_ffff_ffff
        );
        let marker = serde_json::json!({ "cond": src, "template": id }).to_string();
        let marker = marker.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;");
        // Nested lists put seeds and templates behind the visible content.
        let trailers = crate::row::Trailers::default();
        let content_cx = cx.with(trailers.clone());
        let in_tpl = crate::row::in_template(&cx);
        let content = if on && !in_tpl { body(content_cx.clone()).single().await?.render(&content_cx) } else { String::new() };
        // Template = structure only (no SSR rows/seeds inside nested lists).
        // Its nested templates must stay inside its own content fragment.
        let tcx = cx.with(crate::row::TemplateRender).with(crate::row::Trailers::default());
        let tpl = body(tcx.clone()).single().await?.render(&tcx);
        let nested = topcoat::context::request_context::<crate::row::Trailers>(&tcx).take();
        let mut html = format!("<!--::hearth::when::start({marker})-->{content}<!--::hearth::when::end-->");
        let trailer = format!("{}<template id=\"{id}\">{tpl}{nested}</template>", trailers.take());
        crate::row::trailer(&cx, &mut html, &trailer);
        let html = Unescaped::new_unchecked(html);
        let __cx = &cx;
        topcoat::view::internal::MoveView::drive(topcoat::view::view! { (html) }).await
    })))
}

/// Navigation link handled by the client router (falls back to a normal link).
pub fn link_attr() -> &'static str {
    "data-hearth-link"
}

#[doc(hidden)]
pub fn _assert_view<V: View>(_: &V) {}

#[doc(hidden)]
pub fn _unused() -> Result<()> {
    Ok(())
}
