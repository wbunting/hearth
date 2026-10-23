//! `for row in $(query) { body }` (forked `view!` grammar) lowers to
//! [`client_for`]. On the server it:
//! 1. evaluates the query's params (`$()` exprs → server value + JS),
//! 2. runs the base-table part in SQL (via `Table::load_first`) and the rest
//!    of the IR in memory → first-view rows,
//! 3. renders `body` per row between `::fastcoat::item` markers,
//! 4. renders `body` once more with a placeholder row into a `<template>`
//!    (so the browser can clone it with all `$()` markers intact),
//! 5. emits `::fastcoat::list::start(<IR + param JS + template id>)`.
//!
//! The browser side is `topcoat-runtime/browser/src/fastcoat/list.ts`.

use std::{collections::HashMap, sync::atomic::{AtomicU64, Ordering}};

use serde::{Serialize, de::DeserializeOwned};
use serde_json::Value;
use topcoat::{
    Result,
    context::Cx,
    runtime::Expr,
    view::{BoxView, Unescaped, ViewExt},
};

use crate::{
    ir::{self, JsonRow, Query},
    row::Row,
};

/// A compiled `live_query!`: the IR, its `$()` params, and how to load the
/// SSR rows. `R` is the `#[record]` row type the loop body sees.
pub struct LiveQuery<R> {
    // (fields below; Clone is manual so `R` needn't be Clone)
    pub ir: Query,
    /// `(server value as JSON, JS source)` per `$(param)`.
    pub params: Vec<(Value, String)>,
    /// Loads scoped base-table rows per alias for SSR.
    pub loaders: Vec<(&'static str, LoaderFn)>,
    pub _row: std::marker::PhantomData<fn() -> R>,
}

pub type LoaderFn = for<'a> fn(&'a Cx, &'a Query, &'a [Value]) -> crate::table::BoxFut<'a, Vec<JsonRow>>;

impl<R> Clone for LiveQuery<R> {
    fn clone(&self) -> Self {
        Self { ir: self.ir.clone(), params: self.params.clone(), loaders: self.loaders.clone(), _row: std::marker::PhantomData }
    }
}

impl<R> LiveQuery<R> {
    #[doc(hidden)]
    pub fn param<T: Serialize>(e: Expr<T>) -> (Value, String) {
        let (value, js) = e.into_evaluated_and_js();
        (serde_json::to_value(&value).unwrap_or(Value::Null), js.to_source())
    }
}

/// Loader adaptor for a [`crate::Table`].
#[doc(hidden)]
pub fn loader<T: crate::Table>(cx: &Cx, q: &Query, p: &[Value]) -> crate::table::BoxFut<'static, Vec<JsonRow>>
where
    T::Row: 'static,
{
    // SAFETY-free lifetime juggling: we own clones.
    let cx = cx.clone();
    let q = q.clone();
    let p = p.to_vec();
    Box::pin(async move {
        let rows = T::load_first(&cx, &q, &p).await?;
        Ok(rows
            .into_iter()
            .filter_map(|r| match serde_json::to_value(r) {
                Ok(Value::Object(m)) => Some(m),
                _ => None,
            })
            .collect())
    })
}

static NEXT_TEMPLATE: AtomicU64 = AtomicU64::new(0);

/// Server half of a client list. `body` renders one row.
pub fn client_for<'a, R, F>(cx: &'a Cx, query: LiveQuery<R>, body: F) -> BoxView<'a>
where
    R: DeserializeOwned + Default + Send + 'static,
    F: Fn(Cx, Expr<R>) -> BoxView<'static> + Send + Sync + 'a,
{
    let cx = cx.clone();
    let cx2 = cx.clone();
    let fut = async move {
        let LiveQuery { ir, params, loaders, .. } = query;
        let param_values: Vec<Value> = params.iter().map(|(v, _)| plain_json(v)).collect();

        // --- SSR rows: load scoped tables, then evaluate the IR in memory.
        let mut tables: HashMap<&str, Vec<JsonRow>> = HashMap::new();
        for (alias, load) in &loaders {
            tables.insert(alias, load(&cx, &ir, &param_values).await?);
        }
        let rows = evaluate(&ir, &tables, &param_values);
        // First-view seed: base rows that made the cut + the joined rows they
        // reference, keyed by table name, so the browser's collections are
        // ready immediately and the full tables backfill afterwards.
        let seed = seed_rows(&ir, &tables, &rows);

        // --- Markup.
        let id = format!("fc-tpl-{}", NEXT_TEMPLATE.fetch_add(1, Ordering::Relaxed));
        let marker = serde_json::json!({
            "query": ir,
            "params": params.iter().map(|(_, js)| js).collect::<Vec<_>>(),
            "template": id,
            "seed": seed,
        });
        let marker = comment_escape(&marker.to_string());

        let mut html = String::new();
        html.push_str(&format!("<!--::fastcoat::list::start({marker})-->"));
        for row in &rows {
            let key = row.get(ir.key).map(json_key).unwrap_or_default();
            let r: R = serde_json::from_value(Value::Object(row.clone())).unwrap_or_default();
            let handle = body(cx.clone(), Row::bind(r, 0)).single().await?;
            html.push_str(&format!("<!--::fastcoat::item({})-->", comment_escape(&serde_json::to_string(&key).unwrap())));
            html.push_str(&handle.render(&cx));
            html.push_str("<!--::fastcoat::item-end-->");
        }
        html.push_str("<!--::fastcoat::list::end-->");
        let tpl = body(cx.clone(), Row::bind(R::default(), 0)).single().await?.render(&cx);
        html.push_str(&format!(r#"<template id="{id}">{tpl}</template>"#));
        Ok::<_, topcoat::Error>(Unescaped::new_unchecked(html))
    };
    Box::pin(topcoat::view::internal::ScopeView::new(topcoat::view::internal::MoveView::new(async move {
        let html = fut.await?;
        let __cx = &cx2;
        topcoat::view::internal::MoveView::drive(topcoat::view::view! { (html) }).await
    })))
}

/// Evaluate the IR over loaded rows: base filter/order/limit, then joins.
fn evaluate(q: &Query, tables: &HashMap<&str, Vec<JsonRow>>, params: &[Value]) -> Vec<JsonRow> {
    let empty = Vec::new();
    let base = tables.get(q.from.alias).unwrap_or(&empty);
    let mut rows: Vec<&JsonRow> = base
        .iter()
        .filter(|r| {
            q.where_.as_ref().is_none_or(|w| {
                let env = HashMap::from([(q.from.alias, *r)]);
                ir::truthy(&ir::eval(w, &env, params))
            })
        })
        .collect();
    rows.sort_by(|a, b| {
        for o in &q.order {
            let (ea, eb) = (HashMap::from([(q.from.alias, *a)]), HashMap::from([(q.from.alias, *b)]));
            let ord = ir::cmp(&ir::eval(&o.expr, &ea, params), &ir::eval(&o.expr, &eb, params));
            let ord = if o.desc { ord.reverse() } else { ord };
            if ord.is_ne() {
                return ord;
            }
        }
        std::cmp::Ordering::Equal
    });
    if let Some(n) = q.limit {
        rows.truncate(n);
    }
    // Joins (left/inner) by index on the right side.
    let mut out = Vec::with_capacity(rows.len());
    'row: for r in rows {
        let mut env: HashMap<&str, &JsonRow> = HashMap::from([(q.from.alias, r)]);
        for j in &q.joins {
            let right = tables.get(j.alias).unwrap_or(&empty);
            let lv = ir::eval(&j.on.0, &env, params);
            let found = right.iter().find(|rr| {
                let e = HashMap::from([(j.alias, *rr)]);
                ir::eval(&j.on.1, &e, params) == lv
            });
            match found {
                Some(rr) => {
                    env.insert(j.alias, rr);
                }
                None if j.kind == "inner" => continue 'row,
                None => {}
            }
        }
        let mut obj = JsonRow::new();
        for (field, e) in &q.select.0 {
            obj.insert((*field).to_owned(), ir::eval(e, &env, params));
        }
        out.push(obj);
    }
    out
}

fn seed_rows(q: &Query, tables: &HashMap<&str, Vec<JsonRow>>, out_rows: &[JsonRow]) -> serde_json::Map<String, Value> {
    let mut seed = serde_json::Map::new();
    let empty = Vec::new();
    let keys: std::collections::HashSet<String> =
        out_rows.iter().filter_map(|r| r.get(q.key)).map(json_key).collect();
    let base_key = "id";
    let base: Vec<Value> = tables
        .get(q.from.alias)
        .unwrap_or(&empty)
        .iter()
        .filter(|r| r.get(base_key).map(json_key).is_some_and(|k| keys.contains(&k)))
        .map(|r| Value::Object(r.clone()))
        .collect();
    seed.insert(q.from.table.to_owned(), Value::Array(base));
    for j in &q.joins {
        // Small join tables (users/labels) ship whole; that's what P0.5 did too.
        let rows: Vec<Value> = tables.get(j.alias).unwrap_or(&empty).iter().map(|r| Value::Object(r.clone())).collect();
        seed.entry(j.table.to_owned()).or_insert(Value::Array(rows));
    }
    seed
}

/// Topcoat surrogates serialize as `{t, v}` tagged values; the IR wants plain JSON.
fn plain_json(v: &Value) -> Value {
    match v {
        Value::Object(m) if m.contains_key("t") && m.contains_key("v") => {
            let inner = &m["v"];
            match m["t"].as_str() {
                Some("Option") => plain_json(inner),
                Some(t) if t.starts_with('i') || t.starts_with('u') => inner
                    .as_str()
                    .and_then(|s| s.parse::<i64>().ok())
                    .map_or(Value::Null, Value::from),
                _ => plain_json(inner),
            }
        }
        other => other.clone(),
    }
}

fn json_key(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        other => other.to_string(),
    }
}

/// HTML comments can't contain `--`/`>` sequences safely; the browser side
/// decodes these entities.
fn comment_escape(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;")
}

