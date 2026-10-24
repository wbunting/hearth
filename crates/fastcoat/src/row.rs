//! Row values inside a client loop.
//!
//! In `for issue in $(q) { ... }`, `issue` is an `Expr<R>` where `R` is the
//! query's `#[record]` row type. On the server it holds the SSR row; its JS
//! is `cx.row(0)`, the browser list item's live row (a reactive `Record`
//! surrogate built from the TanStack row). So `$(issue.title)` typechecks
//! against the record in Rust and reads the live row in JS, with no
//! app-written JS.

use topcoat::runtime::{Expr, Js};

/// The JS for the current row of the client list with id `list` (each list
/// item's context maps list ids to that item's row, so nested lists and
/// captured outer rows resolve correctly at any depth).
#[must_use]
pub fn row_surrogate_js(list: &str) -> Js {
    Js::source(format!("cx.row({list:?})"))
}

/// Wraps an SSR row as the loop variable of a client list body.
pub struct Row;

impl Row {
    #[must_use]
    pub fn bind<R>(value: R, list: &str) -> Expr<R> {
        Expr::evaluate_dynamic(value, row_surrogate_js(list))
    }
}

/// Column types the browser needs to build surrogates for a row.
pub trait RowField {
    const TYPE: &'static str;
}
impl RowField for String {
    const TYPE: &'static str = "string";
}
impl RowField for bool {
    const TYPE: &'static str = "bool";
}
impl RowField for i64 {
    const TYPE: &'static str = "i64";
}
impl RowField for f64 {
    const TYPE: &'static str = "f64";
}
impl RowField for Option<String> {
    const TYPE: &'static str = "opt_string";
}
impl RowField for Option<i64> {
    const TYPE: &'static str = "opt_i64";
}



/// Request-context marker: we're rendering a `<template>` (structure only).
/// Client lists inside it emit no SSR rows, seeds or nested templates beyond
/// their own row template; the browser fills them from the local DB.
#[derive(Debug, Clone, Copy)]
pub struct TemplateRender;

#[must_use]
pub fn in_template(cx: &topcoat::context::Cx) -> bool {
    topcoat::context::try_request_context::<TemplateRender>(cx).is_some()
}
