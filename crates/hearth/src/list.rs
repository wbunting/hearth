//! `for row in $(query) { body }` (forked `view!` grammar) lowers to
//! [`client_for`]. On the server it:
//! 1. evaluates the query's params (`$()` exprs → server value + JS),
//! 2. runs the base-table part in SQL (via `Table::load_first`) and the rest of the IR in memory →
//!    first-view rows,
//! 3. renders `body` per row between `::hearth::item` markers,
//! 4. renders `body` once more with a placeholder row into a `<template>` (so the browser can clone
//!    it with all `$()` markers intact),
//! 5. emits `::hearth::list::start(<IR + param JS + template id>)`.
//!
//! The browser side is `hearth-runtime/browser/src/hearth/list.ts`.

use std::{
    collections::HashMap,
    fmt::Write as _,
    sync::atomic::{AtomicU64, Ordering},
};

use serde::{Serialize, de::DeserializeOwned};
use serde_json::Value;

use crate::{
    context::Cx,
    ir::{self, JsonRow, Query},
    row::Row,
    runtime::Expr,
    view::{BoxView, Unescaped, ViewExt},
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

pub type LoaderFn =
    for<'a> fn(&'a Cx, &'a Query, &'a [Value]) -> crate::table::BoxFut<'a, Vec<JsonRow>>;

impl<R> Clone for LiveQuery<R> {
    fn clone(&self) -> Self {
        Self {
            ir: self.ir.clone(),
            params: self.params.clone(),
            loaders: self.loaders.clone(),
            _row: std::marker::PhantomData,
        }
    }
}

impl<R> LiveQuery<R> {
    #[doc(hidden)]
    pub fn param<T: Serialize>(e: Expr<T>) -> (Value, String) {
        let (value, js) = e.into_evaluated_and_js();
        (
            serde_json::to_value(&value).unwrap_or(Value::Null),
            js.to_client(),
        )
    }
}

/// Loader adaptor for a [`hearth::Table`].
///
/// Per-request memoized: lists that load the same table with the same
/// pushed-down query (e.g. `users` joined by three lists on one page) share
/// one SQL round trip.
#[doc(hidden)]
pub fn loader<T: crate::Table>(
    cx: &Cx,
    q: &Query,
    p: &[Value],
) -> crate::table::BoxFut<'static, Vec<JsonRow>>
where
    T::Row: 'static,
{
    let cx = cx.clone();
    let q = q.clone();
    let p = p.to_vec();
    Box::pin(async move {
        // What reaches SQL: the base table's where/order/limit + params. A
        // joined table (T isn't the base) loads whole, so every such load of
        // T shares one key, as does a base query with no where/limit.
        let joined = q.from.table != T::NAME;
        let whole = joined || (q.where_.is_none() && q.limit.is_none());
        let shape = if whole {
            format!("{}#all", std::any::type_name::<T>())
        } else {
            serde_json::to_string(&(
                std::any::type_name::<T>(),
                &q.from,
                &q.where_,
                &q.order,
                q.limit,
                &p,
            ))
            .unwrap_or_default()
        };
        let cell = request_loads(&cx);
        let slot = {
            let mut m = cell.lock().expect("load cache poisoned");
            m.entry(shape)
                .or_insert_with(|| std::sync::Arc::new(tokio_once::OnceAsync::default()))
                .clone()
        };
        slot.get_or_try_init(|| async {
            // A joined table must not get the base query's where/order/limit
            // (they're about another table): load all of its scoped rows.
            let rows = if joined {
                T::load(&cx).await?
            } else {
                T::load_first(&cx, &q, &p).await?
            };
            Ok(std::sync::Arc::new(
                rows.into_iter()
                    .filter_map(|r| match T::to_wire(r) {
                        Ok(Value::Object(m)) => Some(m),
                        _ => None,
                    })
                    .collect::<Vec<_>>(),
            ))
        })
        .await
        .map(|rows| (*rows).clone())
    })
}

type LoadCache = std::sync::Mutex<
    HashMap<String, std::sync::Arc<tokio_once::OnceAsync<std::sync::Arc<Vec<JsonRow>>>>>,
>;

/// One load cache per request (the memoize cache is per request).
fn request_loads(cx: &Cx) -> &LoadCache {
    crate::context::memoize_cache(cx).memoize(cx, "hearth::loads", (), |_, ()| LoadCache::default())
}

/// A minimal async once-cell (no extra dependency): the first caller runs the
/// init; concurrent callers wait for it.
mod tokio_once {
    use std::sync::Mutex;

    pub struct OnceAsync<T> {
        state: Mutex<State<T>>,
    }
    enum State<T> {
        Empty,
        Running(Vec<std::task::Waker>),
        Done(T),
    }
    impl<T> Default for OnceAsync<T> {
        fn default() -> Self {
            Self {
                state: Mutex::new(State::Empty),
            }
        }
    }
    impl<T: Clone> OnceAsync<T> {
        pub async fn get_or_try_init<F, Fut, E>(&self, init: F) -> Result<T, E>
        where
            F: FnOnce() -> Fut,
            Fut: std::future::Future<Output = Result<T, E>>,
        {
            let run = std::future::poll_fn(|cx| {
                let mut s = self.state.lock().expect("once poisoned");
                match &mut *s {
                    State::Done(v) => std::task::Poll::Ready(Some(v.clone())),
                    State::Running(w) => {
                        w.push(cx.waker().clone());
                        std::task::Poll::Pending
                    }
                    State::Empty => {
                        *s = State::Running(Vec::new());
                        std::task::Poll::Ready(None)
                    }
                }
            })
            .await;
            if let Some(v) = run {
                return Ok(v);
            }
            let out = init().await;
            let mut s = self.state.lock().expect("once poisoned");
            let waiters = match std::mem::replace(&mut *s, State::Empty) {
                State::Running(w) => w,
                _ => Vec::new(),
            };
            if let Ok(v) = &out {
                *s = State::Done(v.clone());
            }
            drop(s);
            for w in waiters {
                w.wake();
            }
            out
        }
    }
}

/// Rows rendered on the server per list (see `client_for`).
pub const SSR_ROWS: usize = 50;

static NEXT_SEED: AtomicU64 = AtomicU64::new(0);

/// Server half of a client list. `body` renders one row.
///
/// # Panics
///
/// Panics if a row key cannot be serialized as JSON.
pub fn client_for<'a, R, F>(cx: &'a Cx, query: LiveQuery<R>, body: F) -> BoxView<'a>
where
    R: DeserializeOwned + Default + Send + 'static,
    F: Fn(Cx, Expr<R>) -> BoxView<'static> + Send + Sync + 'a,
{
    let cx = cx.clone();
    let cx2 = cx.clone();
    let fut = async move {
        let LiveQuery {
            ir,
            params,
            loaders,
            ..
        } = query;
        let param_values: Vec<Value> = params.iter().map(|(v, _)| plain_json(v)).collect();
        // Inside a `<template>`: structure only. No SQL, no rows, no seed.
        let in_template = crate::row::in_template(&cx);

        // --- SSR rows: load scoped tables, then evaluate the IR in memory.
        // Load base + joined tables concurrently; a table joined under several
        // aliases (users as creator *and* assignee) is loaded once.
        let mut tables: HashMap<&str, Vec<JsonRow>> = HashMap::new();
        if !in_template {
            let table_of = |alias: &'static str| -> &'static str {
                if alias == ir.from.alias {
                    ir.from.table
                } else {
                    ir.joins
                        .iter()
                        .find(|j| j.alias == alias)
                        .map_or(alias, |j| j.table)
                }
            };
            let mut first_alias: HashMap<&str, &str> = HashMap::new();
            let mut futs = Vec::new();
            for (alias, load) in &loaders {
                let t = table_of(alias);
                if first_alias.contains_key(t) {
                    continue;
                }
                first_alias.insert(t, alias);
                futs.push(async { (*alias, load(&cx, &ir, &param_values).await) });
            }
            for (alias, rows) in futures_join_all(futs).await {
                tables.insert(alias, rows?);
            }
            for (alias, _) in &loaders {
                let t = table_of(alias);
                let first = first_alias[t];
                if first != *alias {
                    let rows = tables[first].clone();
                    tables.insert(alias, rows);
                }
            }
        }
        let rows = evaluate(&ir, &tables, &param_values);
        // First-view seed: base rows that made the cut + the joined rows they
        // reference, keyed by table name, so the browser's collections are
        // ready immediately and the full tables backfill afterwards.
        let seed = seed_rows(&ir, &tables, &rows);

        // --- Markup.
        // Stable per query shape: the same `live_query!` renders the same id in
        // SSR markup, in `<template>`s of enclosing regions, and on every
        // request (row refs are keyed by it).
        let ir_json = serde_json::to_string(&ir).unwrap_or_default();
        let id = format!(
            "fc-list-{:012x}",
            crate::table::fnv64(ir_json.as_bytes()) & 0xffff_ffff_ffff
        );
        let seed_id = (!in_template)
            .then(|| format!("fc-seed-{}", NEXT_SEED.fetch_add(1, Ordering::Relaxed)));
        let marker = serde_json::json!({
            "query": ir,
            "params": params.iter().map(|(_, js)| js).collect::<Vec<_>>(),
            "template": id,
            "seed": seed_id,
        });
        let marker = comment_escape(&marker.to_string());

        let trailers = crate::row::Trailers::default();
        let inner_cx = cx.with(trailers.clone());
        let mut html = String::new();
        let _ = write!(html, "<!--::hearth::list::start({marker})-->");
        // Every SSR row repeats the same `$()` JS (only the row data differs,
        // and that comes from `cx.row(..)`). Dedupe: each distinct JS string
        // is emitted once in a per-list table, rows reference it by index.
        let mut dedupe = crate::dedupe::Dedupe::default();
        // Build every row's view first, then drive them concurrently (row
        // bodies may contain components that await).
        // Only the first screenful is server-rendered; the seed carries every
        // row, and the browser renders the rest right after first paint.
        // Rows are ~10 µs + ~1 KB each on the server (reactive markup), so
        // 200 SSR rows cost more TTFB and parse time than they're worth.
        let views: Vec<_> = rows
            .iter()
            .take(SSR_ROWS)
            .map(|row| {
                let r: R = serde_json::from_value(Value::Object(row.clone())).unwrap_or_default();
                body(inner_cx.clone(), Row::bind(r, &id)).single()
            })
            .collect();
        let handles = futures_join_all(views).await;
        for (row, handle) in rows.iter().zip(handles) {
            let key = row.get(ir.key).map(json_key).unwrap_or_default();
            let _ = write!(
                html,
                "<!--::hearth::item({})-->",
                comment_escape(&serde_json::to_string(&key).unwrap())
            );
            dedupe.rewrite_into(&handle?.render(&cx), &mut html);
            html.push_str("<!--::hearth::item-end-->");
        }
        html.push_str(&dedupe.table_comment());
        html.push_str("<!--::hearth::list::end-->");
        let nested = crate::row::Trailers::default();
        let tcx = inner_cx
            .with(crate::row::TemplateRender)
            .with(nested.clone());
        let tpl = body(tcx.clone(), Row::bind(R::default(), &id))
            .single()
            .await?
            .render(&tcx);
        let mut trailer = format!(
            r#"{}<template id="{id}">{tpl}{}</template>"#,
            trailers.take(),
            nested.take()
        );
        if let Some(seed_id) = seed_id {
            trailer.push_str(&crate::json_script(&seed_id, &seed));
        }
        crate::row::trailer(&cx, &mut html, &trailer);
        Ok::<_, crate::Error>(Unescaped::new_unchecked(html))
    };
    Box::pin(crate::view::internal::ScopeView::new(
        crate::view::internal::MoveView::new(async move {
            let html = fut.await?;
            let __cx = &cx2;
            crate::view::internal::MoveView::drive(crate::view::view! { (html) }).await
        }),
    ))
}

/// Evaluate the IR over loaded rows: base filter/order/limit, then joins.
fn evaluate<'t>(
    q: &Query,
    tables: &'t HashMap<&str, Vec<JsonRow>>,
    params: &[Value],
) -> Vec<JsonRow> {
    static EMPTY: Vec<JsonRow> = Vec::new();
    let empty: &'t [JsonRow] = &EMPTY;
    let base: &'t [JsonRow] = tables.get(q.from.alias).map_or(empty, Vec::as_slice);
    // Same plan as the browser (db.ts): filter/order/limit before joins when
    // they only touch the base alias, otherwise after.
    let early = q.joins.is_empty()
        || (q
            .where_
            .as_ref()
            .is_none_or(|w| aliases(w).iter().all(|a| *a == q.from.alias))
            && q.order
                .iter()
                .all(|o| aliases(&o.expr).iter().all(|a| *a == q.from.alias)));

    // Hash indexes on each joined table's join column.
    let mut join_idx: Vec<HashMap<String, Vec<&'t JsonRow>>> = Vec::new();
    for j in &q.joins {
        let mut m: HashMap<String, Vec<&'t JsonRow>> = HashMap::new();
        for rr in tables.get(j.alias).map_or(empty, Vec::as_slice) {
            let e = HashMap::from([(j.alias, rr)]);
            m.entry(ir::eval(&j.on.1, &e, params).to_string())
                .or_default()
                .push(rr);
        }
        join_idx.push(m);
    }
    let join = |r: &'t JsonRow| -> Vec<HashMap<&'static str, &'t JsonRow>> {
        let mut envs: Vec<HashMap<&'static str, &'t JsonRow>> =
            vec![HashMap::from([(q.from.alias, r)])];
        for (j, idx) in q.joins.iter().zip(&join_idx) {
            let mut next = Vec::new();
            for env in envs {
                let lv = ir::eval(&j.on.0, &env, params).to_string();
                match idx.get(&lv) {
                    Some(matches) => {
                        for rr in matches {
                            let mut e = env.clone();
                            e.insert(j.alias, rr);
                            next.push(e);
                        }
                    }
                    None if j.kind == "inner" => {}
                    None => next.push(env),
                }
            }
            envs = next;
        }
        envs
    };
    let keep = |env: &HashMap<&str, &JsonRow>| {
        q.where_
            .as_ref()
            .is_none_or(|w| ir::truthy(&ir::eval(w, env, params)))
    };
    let order = |a: &HashMap<&str, &JsonRow>, b: &HashMap<&str, &JsonRow>| {
        for o in &q.order {
            let ord = ir::cmp(&ir::eval(&o.expr, a, params), &ir::eval(&o.expr, b, params));
            let ord = if o.desc { ord.reverse() } else { ord };
            if ord.is_ne() {
                return ord;
            }
        }
        // Tie-break by the base row's key, like SQL (`sql::order`) and the
        // browser engine, so all three agree on the first page.
        let k = |e: &HashMap<&str, &JsonRow>| {
            e.get(q.from.alias)
                .and_then(|r| r.get(q.from.key))
                .map(json_key)
                .unwrap_or_default()
        };
        k(a).cmp(&k(b))
    };

    let envs: Vec<HashMap<&'static str, &'t JsonRow>> = if early {
        let mut rows: Vec<HashMap<&'static str, &'t JsonRow>> = base
            .iter()
            .map(|r| HashMap::from([(q.from.alias, r)]))
            .filter(|e| keep(e))
            .collect();
        rows.sort_by(|a, b| order(a, b));
        if let Some(n) = q.limit {
            rows.truncate(n);
        }
        rows.into_iter()
            .flat_map(|e| join(e[q.from.alias]))
            .collect()
    } else {
        let mut rows: Vec<_> = base.iter().flat_map(join).filter(|e| keep(e)).collect();
        rows.sort_by(|a, b| order(a, b));
        if let Some(n) = q.limit {
            rows.truncate(n);
        }
        rows
    };
    envs.into_iter()
        .map(|env| {
            let mut obj = JsonRow::new();
            for (field, e) in &q.select.0 {
                obj.insert((*field).to_owned(), ir::eval(e, &env, params));
            }
            obj
        })
        .collect()
}

fn aliases(e: &ir::Expr) -> Vec<&'static str> {
    fn walk(e: &ir::Expr, out: &mut Vec<&'static str>) {
        match e {
            ir::Expr::Col { col: (a, _) } => out.push(a),
            ir::Expr::Lit { .. } | ir::Expr::Param { .. } => {}
            ir::Expr::Bin { l, r, .. } => {
                walk(l, out);
                walk(r, out);
            }
            ir::Expr::Many { args, .. } => args.iter().for_each(|a| walk(a, out)),
            ir::Expr::Not { arg, .. } => walk(arg, out),
            ir::Expr::If { cond, then, .. } => {
                walk(cond, out);
                walk(then, out);
            }
        }
    }
    let mut out = Vec::new();
    walk(e, &mut out);
    out
}

fn seed_rows(
    q: &Query,
    tables: &HashMap<&str, Vec<JsonRow>>,
    out_rows: &[JsonRow],
) -> serde_json::Map<String, Value> {
    let mut seed = serde_json::Map::new();
    let empty = Vec::new();
    let keys: std::collections::HashSet<String> = out_rows
        .iter()
        .filter_map(|r| r.get(q.key))
        .map(json_key)
        .collect();
    let base: Vec<Value> = tables
        .get(q.from.alias)
        .unwrap_or(&empty)
        .iter()
        .filter(|r| {
            r.get(q.from.key)
                .map(json_key)
                .is_some_and(|k| keys.contains(&k))
        })
        .map(|r| Value::Object(r.clone()))
        .collect();
    seed.insert(q.from.table.to_owned(), Value::Array(base));
    for j in &q.joins {
        // Small join tables (users/labels) ship whole; that's what P0.5 did too.
        let rows: Vec<Value> = tables
            .get(j.alias)
            .unwrap_or(&empty)
            .iter()
            .map(|r| Value::Object(r.clone()))
            .collect();
        seed.entry(j.table.to_owned()).or_insert(Value::Array(rows));
    }
    seed
}

/// Hearth surrogates serialize as `{t, v}` tagged values; the IR wants plain JSON.
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
    let mut out = String::with_capacity(s.len() + s.len() / 8);
    let mut last = 0;
    for (i, b) in s.bytes().enumerate() {
        let rep = match b {
            b'&' => "&amp;",
            b'<' => "&lt;",
            b'>' => "&gt;",
            b'"' => "&quot;",
            _ => continue,
        };
        out.push_str(&s[last..i]);
        out.push_str(rep);
        last = i + 1;
    }
    out.push_str(&s[last..]);
    out
}

/// Minimal `join_all` (no extra dependency): polls all futures concurrently.
async fn futures_join_all<F: std::future::Future>(futs: Vec<F>) -> Vec<F::Output> {
    use std::{pin::Pin, task::Poll};
    let mut futs: Vec<Pin<Box<F>>> = futs.into_iter().map(Box::pin).collect();
    let mut out: Vec<Option<F::Output>> = futs.iter().map(|_| None).collect();
    std::future::poll_fn(|cx| {
        let mut done = true;
        for (i, f) in futs.iter_mut().enumerate() {
            if out[i].is_none() {
                match f.as_mut().poll(cx) {
                    Poll::Ready(v) => out[i] = Some(v),
                    Poll::Pending => done = false,
                }
            }
        }
        if done { Poll::Ready(()) } else { Poll::Pending }
    })
    .await;
    out.into_iter()
        .map(|o| o.expect("all futures completed"))
        .collect()
}

#[cfg(test)]
mod tests {
    use std::{
        pin::pin,
        task::{Context, Poll, Waker},
    };

    use super::*;
    use crate::{
        ir::{
            Expr as E, From, Join, Order,
            indexmap_lite::{Map, Types},
        },
        view::View,
    };

    fn load<'a>(_: &'a Cx, _: &'a Query, _: &'a [Value]) -> crate::table::BoxFut<'a, Vec<JsonRow>> {
        Box::pin(async {
            Ok(vec![
                serde_json::from_value(serde_json::json!({
                    "id": "</script><script>bad</script>&"
                }))
                .unwrap(),
            ])
        })
    }

    #[test]
    fn seed_and_template_follow_rows_and_cannot_end_the_json_script() {
        let cx = Cx::default();
        let view = client_for(&cx, query("things"), |cx, _| {
            Box::pin(crate::view::view! { cx => <li>"row"</li> })
        });
        let html = render(&cx, view);
        let row = html.find("<li>").unwrap();
        let template = html.find("<template").unwrap();
        let script = html.find("<script").unwrap();
        assert!(row < template && template < script);
        let json =
            &html[html[script..].find('>').unwrap() + script + 1..html.rfind("</script>").unwrap()];
        assert!(!json.contains('<'));
        let seed: Value = serde_json::from_str(json).unwrap();
        assert_eq!(seed["things"][0]["id"], "</script><script>bad</script>&");
        let marker_end = html.find("-->").unwrap();
        assert!(!html[..marker_end].contains("bad"));
    }

    fn render(cx: &Cx, view: BoxView<'_>) -> String {
        let mut view = pin!(view);
        let mut task = Context::from_waker(Waker::noop());
        loop {
            if let Poll::Ready(first) = view.as_mut().poll_first(&mut task) {
                return first.unwrap().content.render(cx);
            }
        }
    }

    fn query(table: &'static str) -> LiveQuery<String> {
        LiveQuery {
            ir: Query {
                from: ir::From {
                    table,
                    alias: "t",
                    key: "id",
                },
                joins: vec![],
                where_: None,
                order: vec![],
                limit: None,
                key: "id",
                select: ir::indexmap_lite::Map(vec![("id", ir::Expr::Col { col: ("t", "id") })]),
                types: ir::indexmap_lite::Types(vec![]),
            },
            params: vec![],
            loaders: vec![("t", load)],
            _row: std::marker::PhantomData,
        }
    }

    fn nested_rows(cx: Cx) -> BoxView<'static> {
        Box::pin(crate::view::view! {
            cx =>
            <li>
                "outer"
                (crate::route::when(
                    &cx,
                    Expr::evaluate_dynamic(true, crate::runtime::Js::source("true")),
                    |cx| {
                        Box::pin(
                            crate::view::view! {
                                cx =>
                                <ul>
                                    (client_for(
                                        &cx,
                                        query("inner"),
                                        |cx, _| {
                                            Box::pin(crate::view::view! { cx => <li>"inner"</li> })
                                        },
                                    ))
                                </ul>
                            },
                        )
                    },
                ))
            </li>
        })
    }

    fn marker_json(comment: &str, prefix: &str) -> Value {
        let json = comment
            .strip_prefix(prefix)
            .unwrap()
            .strip_suffix(")")
            .unwrap()
            .replace("&quot;", "\"")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&amp;", "&");
        serde_json::from_str(&json).unwrap()
    }

    #[test]
    fn nested_region_trailers_follow_visible_rows_and_keep_seeds_outside_templates() {
        let cx = Cx::default();
        let view = crate::route::when(
            &cx,
            Expr::evaluate_dynamic(true, crate::runtime::Js::source("Boolean(1)")),
            |cx| {
                Box::pin(crate::view::view! {
                    cx =>
                    <ul>(client_for(&cx, query("outer"), |cx, _| nested_rows(cx)))</ul>
                })
            },
        );
        let html = render(&cx, view);
        let first_trailer = html
            .find("<template")
            .unwrap()
            .min(html.find("<script").unwrap());
        let visible_end = html[..first_trailer]
            .rfind("<!--::hearth::when::end-->")
            .unwrap();
        assert!(visible_end < first_trailer);
        assert_eq!(html[..first_trailer].matches("<li>").count(), 2);

        // Inspect the actual server output, tracking inert template content.
        // A seed referenced by a live marker must be in the live document.
        let mut templates = Vec::new();
        let mut when_template = None;
        let mut seeds = Vec::new();
        let mut scripts = Vec::new();
        let mut item_depth = 0;
        let mut at = 0;
        while at < html.len() {
            let Some(next) = html[at..].find('<') else {
                break;
            };
            at += next;
            let rest = &html[at..];
            if let Some(comment) = rest.strip_prefix("<!--") {
                let end = comment.find("-->").unwrap();
                let comment = &comment[..end];
                if templates.is_empty() {
                    if comment.starts_with("::hearth::item(") {
                        item_depth += 1;
                    }
                    if comment == "::hearth::item-end" {
                        item_depth -= 1;
                    }
                    if comment.starts_with("::hearth::list::start(") {
                        let marker = marker_json(comment, "::hearth::list::start(");
                        seeds.push(marker["seed"].as_str().unwrap().to_owned());
                    }
                    if when_template.is_none() && comment.starts_with("::hearth::when::start(") {
                        let marker = marker_json(comment, "::hearth::when::start(");
                        when_template = Some(marker["template"].as_str().unwrap().to_owned());
                    }
                } else if comment.starts_with("::hearth::list::start(") {
                    assert!(marker_json(comment, "::hearth::list::start(")["seed"].is_null());
                }
                at += 4 + end + 3;
                continue;
            }
            if rest.starts_with("<template") {
                assert_eq!(
                    item_depth, 0,
                    "templates must not enter deduped SSR row HTML"
                );
                let end = rest.find('>').unwrap();
                templates.push((at, at + end + 1));
            } else if rest.starts_with("</template>") {
                let (start, content) = templates.pop().unwrap();
                let id = when_template.as_ref().unwrap();
                if html[start..content].contains(&format!("id=\"{id}\"")) {
                    let body = &html[content..at];
                    assert!(body.matches("<template id=\"fc-list-").count() >= 2);
                    assert!(!body.contains("<script"));
                    when_template = Some(String::new());
                }
            } else if rest.starts_with("<li>") && templates.is_empty() {
                assert!(at < first_trailer, "visible rows must precede trailers");
            } else if rest.starts_with("<script") {
                assert!(
                    templates.is_empty(),
                    "seed scripts must be outside templates"
                );
                let end = rest.find('>').unwrap();
                let tag = &rest[..end];
                assert!(tag.contains("type=\"application/json\""));
                let id = tag
                    .split("id=\"")
                    .nth(1)
                    .unwrap()
                    .split('"')
                    .next()
                    .unwrap();
                scripts.push(id.to_owned());
            }
            at += rest.find('>').unwrap() + 1;
        }
        assert!(templates.is_empty());
        assert_eq!(item_depth, 0);
        assert_eq!(seeds.len(), 2);
        assert_eq!(when_template.as_deref(), Some(""));
        seeds.sort();
        scripts.sort();
        assert_eq!(seeds, scripts);
    }

    #[test]
    fn custom_keys_order_and_seed_match_browser_fixture() {
        // The browser runs this same fixture, including the SSR seed.
        let fixture: Value =
            serde_json::from_str(include_str!("../tests/fixtures/custom-keys.json")).unwrap();
        let mut q = Query {
            from: From {
                table: "tasks",
                alias: "t",
                key: "taskCode",
            },
            joins: vec![Join {
                table: "owners",
                alias: "o",
                key: "ownerCode",
                kind: "left",
                on: (
                    E::Col {
                        col: ("t", "owner"),
                    },
                    E::Col {
                        col: ("o", "ownerCode"),
                    },
                ),
            }],
            where_: None,
            order: vec![Order {
                expr: E::Col { col: ("t", "rank") },
                desc: true,
            }],
            limit: Some(2),
            select: Map(vec![
                (
                    "key",
                    E::Col {
                        col: ("t", "taskCode"),
                    },
                ),
                ("owner", E::Col { col: ("o", "name") }),
            ]),
            key: "key",
            types: Types::default(),
        };
        assert_eq!(serde_json::to_value(&q).unwrap(), fixture["query"]);
        let tables = HashMap::from([
            (
                "t",
                serde_json::from_value(fixture["tables"]["t"].clone()).unwrap(),
            ),
            (
                "o",
                serde_json::from_value(fixture["tables"]["o"].clone()).unwrap(),
            ),
        ]);
        let rows = evaluate(&q, &tables, &[]);
        assert_eq!(serde_json::to_value(&rows).unwrap(), fixture["expected"]);
        assert_eq!(
            Value::Object(seed_rows(&q, &tables, &rows)),
            fixture["seed"]
        );

        // A joined order column uses the post-join plan and the same base key.
        q.order[0].expr = E::Col { col: ("o", "name") };
        q.order[0].desc = true;
        let rows = evaluate(&q, &tables, &[]);
        assert_eq!(
            rows.iter()
                .map(|r| r["key"].as_str().unwrap())
                .collect::<Vec<_>>(),
            ["a", "c"]
        );
        assert_eq!(
            seed_rows(&q, &tables, &rows)["tasks"]
                .as_array()
                .unwrap()
                .len(),
            2
        );
    }
}
