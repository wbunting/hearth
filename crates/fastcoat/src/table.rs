//! Synced tables: a Toasty model exposed to the browser as a TanStack DB
//! collection. The app implements [`Table`] (scope + writes, in Rust); the
//! descriptor, indexes, load and mutation endpoints are derived.

use std::{future::Future, pin::Pin};

use serde::{Serialize, de::DeserializeOwned};
use serde_json::Value;
use topcoat::{Result, context::Cx};

use crate::ir::JsonRow;

pub type BoxFut<'a, T> = Pin<Box<dyn Future<Output = Result<T>> + Send + 'a>>;

/// A table synced to the browser.
pub trait Table: Send + Sync + 'static {
    /// Wire row (camelCase JSON fields, matches the `#[record]` used in views).
    type Row: Serialize + DeserializeOwned + Send;
    /// Collection name (e.g. `issues`) and Toasty model used for indexes.
    const NAME: &'static str;
    const KEY: &'static str;
    /// `(field, client type)` for every column, used to build surrogates.
    const COLUMNS: &'static [(&'static str, &'static str)];
    /// Client indexes (from Toasty `#[index]`s; see `client_schema`).
    fn indexes() -> Vec<&'static str>;

    /// All rows the current request may read. **Authorization lives here.**
    fn load(cx: &Cx) -> BoxFut<'_, Vec<Self::Row>>;

    /// First-view rows for SSR: the base-table filter/order/limit pushed
    /// into SQL. Default: load everything (fine for small tables).
    fn load_first<'a>(cx: &'a Cx, _q: &'a crate::ir::Query, _params: &'a [Value]) -> BoxFut<'a, Vec<Self::Row>> {
        Self::load(cx)
    }

    /// Validate + apply a client mutation; return the server's row.
    fn update<'a>(_cx: &'a Cx, _key: String, _changes: JsonRow) -> BoxFut<'a, Self::Row> {
        Box::pin(async { Err(topcoat::router::error::forbidden().into()) })
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct TableDesc {
    pub name: &'static str,
    pub key: &'static str,
    pub columns: serde_json::Map<String, Value>,
    pub indexes: Vec<&'static str>,
    pub load: String,
    pub mutate: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ClientSchema {
    pub version: String,
    pub scope: String,
    pub tables: Vec<TableDesc>,
}

#[must_use]
pub fn describe<T: Table>() -> TableDesc {
    TableDesc {
        name: T::NAME,
        key: T::KEY,
        columns: T::COLUMNS.iter().map(|(k, v)| ((*k).to_owned(), Value::from(*v))).collect(),
        indexes: T::indexes(),
        load: format!("/_fastcoat/{}/load", T::NAME),
        mutate: format!("/_fastcoat/{}/mutate", T::NAME),
    }
}

#[must_use]
pub fn client_schema(scope: String, tables: Vec<TableDesc>) -> ClientSchema {
    let json = serde_json::to_string(&tables).unwrap_or_default();
    let version = format!("{:016x}", json.bytes().fold(0xcbf29ce484222325u64, |h, b| (h ^ u64::from(b)).wrapping_mul(0x100000001b3)));
    ClientSchema { version, scope, tables }
}

/// Body of `POST /_fastcoat/{table}/mutate`.
#[derive(Debug, serde::Deserialize)]
#[serde(tag = "op", rename_all = "lowercase")]
pub enum Mutation {
    Update { key: Value, changes: JsonRow },
}

/// Dispatches a mutation request to the table's `update`.
pub async fn mutation_route<T: Table>(cx: &Cx, m: Mutation) -> Result<T::Row> {
    match m {
        Mutation::Update { key, changes } => {
            let key = match key {
                Value::String(s) => s,
                other => other.to_string(),
            };
            T::update(cx, key, changes).await
        }
    }
}
