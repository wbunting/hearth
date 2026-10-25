//! Synced tables: a Toasty model exposed to the browser as a TanStack DB
//! collection. Usually derived with `#[derive(hearth::Table)]`; the app
//! supplies the read scope and write functions in Rust.

use std::{future::Future, pin::Pin};

use serde::{Serialize, de::DeserializeOwned};
use serde_json::Value;
use topcoat::{Result, context::Cx};

use crate::{ir::JsonRow, sql::SqlColumns};

pub type BoxFut<'a, T> = Pin<Box<dyn Future<Output = Result<T>> + Send + 'a>>;

/// A table synced to the browser.
///
/// Derived tables can mark server-only fields with `#[skip]`. Hearth excludes
/// them from wire rows and schema. The app's `From<Model>` still fills them.
/// They cannot appear in `writable(...)` or in a `live_query!` expression.
///
/// ```compile_fail,E0080
/// use hearth::{Table, live_query};
/// use serde::{Serialize, Deserialize};
/// use topcoat::{Result, context::Cx};
/// #[derive(toasty::Model)]
/// struct Model {
///     #[key]
///     id: String,
///     secret: String,
/// }
/// #[derive(Table, Serialize, Deserialize)]
/// #[table(name = "rows", model = Model, scope = scope)]
/// struct Row {
///     #[key]
///     id: String,
///     #[skip]
///     secret: String,
/// }
/// impl From<Model> for Row {
///     fn from(m: Model) -> Self { Self { id: m.id, secret: m.secret } }
/// }
/// async fn scope(_: &Cx) -> Result<Option<toasty::stmt::Expr<bool>>> { Ok(None) }
/// #[hearth::row]
/// struct Output { id: String }
/// let _ = live_query! {
///     Output from r in Row
///     where r.secret == "not client data"
///     select { id: r.id }
/// };
/// ```
pub trait Table: Send + Sync + Sized + 'static {
    /// Server row. Hearth sends only fields listed in `COLUMNS`.
    type Row: Serialize + DeserializeOwned + Send;
    const NAME: &'static str;
    const KEY: &'static str;
    /// `(field, client type)` for every column, used to build surrogates.
    const COLUMNS: &'static [(&'static str, &'static str)];
    /// Which writes the table accepts: (update, insert, delete).
    const WRITES: (bool, bool, bool) = (false, false, false);
    /// Client indexes (from `#[key]`/`#[index]` fields).
    fn indexes() -> Vec<&'static str>;

    /// Serializes a row for the browser, excluding server-only fields.
    fn to_wire(row: Self::Row) -> serde_json::Result<Value> {
        let mut value = serde_json::to_value(row)?;
        if let Value::Object(fields) = &mut value {
            fields.retain(|name, _| Self::COLUMNS.iter().any(|(column, _)| *column == name));
        }
        Ok(value)
    }

    /// All rows the current request may read. **Authorization lives here.**
    fn load(cx: &Cx) -> BoxFut<'_, Vec<Self::Row>>;

    /// First-view rows for SSR: base-table filter/order/limit pushed to SQL.
    fn load_first<'a>(cx: &'a Cx, _q: &'a crate::ir::Query, _params: &'a [Value]) -> BoxFut<'a, Vec<Self::Row>> {
        Self::load(cx)
    }

    fn update<'a>(_cx: &'a Cx, _key: String, _changes: JsonRow) -> BoxFut<'a, Self::Row> {
        Box::pin(async { Err(topcoat::router::error::forbidden().into()) })
    }
    fn insert<'a>(_cx: &'a Cx, _row: JsonRow) -> BoxFut<'a, Self::Row> {
        Box::pin(async { Err(topcoat::router::error::forbidden().into()) })
    }
    fn delete<'a>(_cx: &'a Cx, _key: String) -> BoxFut<'a, ()> {
        Box::pin(async { Err(topcoat::router::error::forbidden().into()) })
    }
}

/// Runs `scope AND filter ORDER BY order LIMIT limit` on the table's model
/// and converts rows with `From<Model>`.
pub async fn run_query<T>(
    cx: &Cx,
    scope: Option<toasty::stmt::Expr<bool>>,
    filter: Option<toasty::stmt::Expr<bool>>,
    order: &[toasty::stmt::OrderByExpr],
    limit: Option<usize>,
) -> Result<Vec<T>>
where
    T: SqlColumns + From<T::Model>,
{
    use toasty::stmt::{List, Query};
    let pred = match (scope, filter) {
        (Some(a), Some(b)) => Some(a.and(b)),
        (a, b) => a.or(b),
    };
    let mut q = Query::<List<T::Model>>::all();
    if let Some(p) = pred {
        q = q.filter(p);
    }
    for o in order {
        q = q.order_by(o.clone());
    }
    if let Some(n) = limit {
        q = q.limit(n);
    }
    let mut db = crate::db(cx);
    let rows: Vec<T::Model> = q.exec(&mut db).await?;
    Ok(rows.into_iter().map(T::from).collect())
}

#[derive(Debug, Clone, Serialize)]
pub struct TableDesc {
    pub name: &'static str,
    pub key: &'static str,
    pub columns: serde_json::Map<String, Value>,
    pub indexes: Vec<&'static str>,
    pub load: String,
    pub mutate: String,
    pub writes: (bool, bool, bool),
}

#[derive(Debug, Clone, Serialize)]
pub struct ClientSchema {
    pub version: String,
    pub scope: String,
    pub tables: Vec<TableDesc>,
    pub on_unauthorized: OnUnauthorized,
}

impl ClientSchema {
    /// Sets how the browser handles an unauthorized load or mutation.
    #[must_use]
    pub fn on_unauthorized(mut self, behavior: OnUnauthorized) -> Self {
        self.on_unauthorized = behavior;
        self
    }
}

/// Browser behavior for HTTP 401 or a redirect to the configured sign-in URL.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum OnUnauthorized {
    /// Navigate to this URL, also used to recognize followed sign-in redirects.
    Redirect(String),
    /// Report load errors and roll back rejected mutations without navigating.
    /// Servers should return HTTP 401 rather than sign-in HTML in this mode.
    Error,
}

impl Default for OnUnauthorized {
    fn default() -> Self {
        Self::Redirect("/login".to_owned())
    }
}

#[must_use]
pub fn describe<T: Table>() -> TableDesc {
    TableDesc {
        name: T::NAME,
        key: T::KEY,
        columns: T::COLUMNS.iter().map(|(k, v)| ((*k).to_owned(), Value::from(*v))).collect(),
        indexes: T::indexes(),
        load: format!("/_hearth/{}/load", T::NAME),
        mutate: format!("/_hearth/{}/mutate", T::NAME),
        writes: T::WRITES,
    }
}

#[must_use]
pub fn client_schema(scope: String, tables: Vec<TableDesc>) -> ClientSchema {
    let json = serde_json::to_string(&tables).unwrap_or_default();
    let version = format!(
        "{:016x}",
        fnv64(json.as_bytes())
    );
    ClientSchema { version, scope, tables, on_unauthorized: OnUnauthorized::default() }
}

pub(crate) fn fnv64(bytes: &[u8]) -> u64 {
    bytes.iter().fold(0xcbf2_9ce4_8422_2325_u64, |h, b| (h ^ u64::from(*b)).wrapping_mul(0x0100_0000_01b3))
}

/// Body of `POST /_hearth/{table}/mutate`.
#[derive(Debug, serde::Deserialize)]
#[serde(tag = "op", rename_all = "lowercase")]
pub enum Mutation {
    Update { key: Value, changes: JsonRow },
    Insert { row: JsonRow },
    Delete { key: Value },
}

pub(crate) fn key_string(key: Value) -> String {
    match key {
        Value::String(s) => s,
        other => other.to_string(),
    }
}

/// Dispatches a mutation request; returns the server's row (or null on delete).
pub async fn mutation_route<T: Table>(cx: &Cx, m: Mutation) -> Result<Value> {
    let row = match m {
        Mutation::Update { key, changes } => T::to_wire(T::update(cx, key_string(key), changes).await?),
        Mutation::Insert { row } => T::to_wire(T::insert(cx, row).await?),
        Mutation::Delete { key } => {
            T::delete(cx, key_string(key)).await?;
            return Ok(Value::Null);
        }
    };
    row.map_err(|e| topcoat::router::error::internal_server_error(e).into())
}

/// Guards `routes!` against a name that doesn't match `Table::NAME`.
pub fn check_table<T: Table>(route_name: &str) -> Result<()> {
    if route_name == T::NAME {
        Ok(())
    } else {
        Err(topcoat::router::error::internal_server_error(std::io::Error::other(format!(
            "hearth::routes!: `{route_name}` does not match table name `{}`",
            T::NAME
        )))
        .into())
    }
}

/// Whether a column is part of the client schema. Used by `live_query!` at compile time.
#[doc(hidden)]
#[must_use]
pub const fn has_column<T: Table>(name: &str) -> bool {
    let columns = T::COLUMNS;
    let mut i = 0;
    while i < columns.len() {
        let a = columns[i].0.as_bytes();
        let b = name.as_bytes();
        if a.len() == b.len() {
            let mut j = 0;
            while j < a.len() && a[j] == b[j] {
                j += 1;
            }
            if j == a.len() {
                return true;
            }
        }
        i += 1;
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unauthorized_behavior_is_carried_in_boot_schema() {
        let schema = client_schema("viewer".to_owned(), vec![]);
        let boot = serde_json::json!({ "schema": &schema });
        assert_eq!(boot["schema"]["on_unauthorized"]["redirect"], "/login");
        let version = schema.version.clone();
        let custom =
            schema.on_unauthorized(OnUnauthorized::Redirect("/account/sign-in".to_owned()));
        let boot = serde_json::json!({ "schema": &custom });
        assert_eq!(
            boot["schema"]["on_unauthorized"]["redirect"],
            "/account/sign-in"
        );
        assert_eq!(
            custom.version, version,
            "auth policy does not change the row schema"
        );
        let errors = custom.on_unauthorized(OnUnauthorized::Error);
        let boot = serde_json::json!({ "schema": &errors });
        assert_eq!(boot["schema"]["on_unauthorized"], "error");
    }
}

