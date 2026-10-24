//! Query IR shared by the server (SSR evaluation) and the browser (TanStack
//! DB lowering in `topcoat-runtime/browser/src/hearth/db.ts`). Built by
//! `live_query!`; serialized as JSON into the list marker.

use serde::Serialize;
use serde_json::Value;

#[derive(Debug, Clone, Serialize)]
#[serde(untagged)]
pub enum Expr {
    Col { col: (&'static str, &'static str) },
    Lit { lit: Value },
    Param { param: usize },
    Bin { op: &'static str, l: Box<Expr>, r: Box<Expr> },
    Many { op: &'static str, args: Vec<Expr> },
    Not { op: &'static str, arg: Box<Expr> },
    If { op: &'static str, cond: Box<Expr>, then: Box<Expr> },
}

#[derive(Debug, Clone, Serialize)]
pub struct From {
    pub table: &'static str,
    pub alias: &'static str,
    pub key: &'static str,
}

#[derive(Debug, Clone, Serialize)]
pub struct Join {
    pub table: &'static str,
    pub alias: &'static str,
    pub key: &'static str,
    pub on: (Expr, Expr),
    pub kind: &'static str,
}

#[derive(Debug, Clone, Serialize)]
pub struct Order {
    pub expr: Expr,
    pub desc: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct Query {
    pub from: From,
    pub joins: Vec<Join>,
    #[serde(rename = "where")]
    pub where_: Option<Expr>,
    pub order: Vec<Order>,
    pub limit: Option<usize>,
    pub select: indexmap_lite::Map,
    pub key: &'static str,
    pub types: indexmap_lite::Types,
}

/// Tiny ordered maps so JSON field order is stable (no extra dependency).
pub mod indexmap_lite {
    use serde::{Serialize, Serializer, ser::SerializeMap};

    #[derive(Debug, Clone, Default)]
    pub struct Map(pub Vec<(&'static str, super::Expr)>);
    impl Serialize for Map {
        fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
            let mut m = s.serialize_map(Some(self.0.len()))?;
            for (k, v) in &self.0 {
                m.serialize_entry(k, v)?;
            }
            m.end()
        }
    }

    #[derive(Debug, Clone, Default)]
    pub struct Types(pub Vec<(&'static str, &'static str)>);
    impl Serialize for Types {
        fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
            let mut m = s.serialize_map(Some(self.0.len()))?;
            for (k, v) in &self.0 {
                m.serialize_entry(k, v)?;
            }
            m.end()
        }
    }
}

// ------------------------------------------------------------ SSR evaluation
//
// The server evaluates the same IR over rows it loaded through the table's
// scoped loader. P0.5 showed the important part is pushing *base-table*
// filter/order/limit into SQL; the spike does that for the base table via
// `Table::ssr_rows` and evaluates joins in memory over the limited rows.

pub type JsonRow = serde_json::Map<String, Value>;

pub fn eval(e: &Expr, row: &std::collections::HashMap<&str, &JsonRow>, params: &[Value]) -> Value {
    match e {
        Expr::Col { col: (a, c) } => row.get(a).and_then(|r| r.get(*c)).cloned().unwrap_or(Value::Null),
        Expr::Lit { lit } => lit.clone(),
        Expr::Param { param } => params.get(*param).cloned().unwrap_or(Value::Null),
        Expr::Bin { op, l, r } => {
            let (l, r) = (eval(l, row, params), eval(r, row, params));
            Value::Bool(match *op {
                "eq" => l == r,
                "ne" => l != r,
                "lt" => cmp(&l, &r).is_lt(),
                "lte" => cmp(&l, &r).is_le(),
                "gt" => cmp(&l, &r).is_gt(),
                "gte" => cmp(&l, &r).is_ge(),
                "contains" => match (l.as_str(), r.as_str()) {
                    (Some(l), Some(r)) => l.to_lowercase().contains(&r.to_lowercase()),
                    _ => false,
                },
                "in" => r.as_array().is_some_and(|a| a.contains(&l)),
                _ => false,
            })
        }
        Expr::Many { op, args } => Value::Bool(match *op {
            "and" => args.iter().all(|a| truthy(&eval(a, row, params))),
            _ => args.iter().any(|a| truthy(&eval(a, row, params))),
        }),
        Expr::Not { arg, .. } => Value::Bool(!truthy(&eval(arg, row, params))),
        Expr::If { cond, then, .. } => {
            if truthy(&eval(cond, row, params)) {
                eval(then, row, params)
            } else {
                Value::Bool(true)
            }
        }
    }
}

pub fn truthy(v: &Value) -> bool {
    match v {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::String(s) => !s.is_empty(),
        Value::Number(n) => n.as_f64() != Some(0.0),
        _ => true,
    }
}

pub fn cmp(a: &Value, b: &Value) -> std::cmp::Ordering {
    match (a, b) {
        (Value::Number(a), Value::Number(b)) => a.as_f64().partial_cmp(&b.as_f64()).unwrap_or(std::cmp::Ordering::Equal),
        (Value::String(a), Value::String(b)) => a.cmp(b),
        (Value::Bool(a), Value::Bool(b)) => a.cmp(b),
        (Value::Null, Value::Null) => std::cmp::Ordering::Equal,
        (Value::Null, _) => std::cmp::Ordering::Less,
        (_, Value::Null) => std::cmp::Ordering::Greater,
        _ => std::cmp::Ordering::Equal,
    }
}
