//! fastcoat: local-first data for Topcoat apps, authored in Rust.
//!
//! - [`Table`]: a Toasty model synced to the browser (TanStack DB collection).
//! - [`live_query!`]: a query over tables, evaluated on the server for SSR and
//!   in the browser by TanStack DB, from one IR.
//! - `for row in $(query) { ... }` in `view!` (forked grammar): a client list
//!   whose body is a row template. `$()` inside reads the live row.
//! - [`mutate`]: optimistic writes from `$()` event handlers.

pub mod ir;
pub mod sql;
mod list;
mod row;
pub mod table;
pub mod mutate;
pub mod route;
pub use mutate::table as table_handle;

pub use list::{LiveQuery, LoaderFn as __LoaderFn, client_for, loader as __loader};
pub use row::{Row, RowField, row_surrogate_js};
pub use table::{ClientSchema, Table, TableDesc, client_schema, describe, mutation_route};

/// Re-exported for macro output.
#[doc(hidden)]
pub mod __private {
    pub use serde_json;
    pub use crate::sql::contains_pattern;

    /// `contains` lowering: `LIKE %x%` for string columns, unsupported
    /// (falls back to the in-memory pass) for everything else.
    pub trait Contains {
        fn contains(self, text: &str) -> Option<toasty::stmt::Expr<bool>>;
    }
    impl<M> Contains for toasty::stmt::Path<M, String> {
        fn contains(self, text: &str) -> Option<toasty::stmt::Expr<bool>> {
            Some(self.like_with_escape(crate::sql::contains_pattern(text), '\\'))
        }
    }
    macro_rules! no_contains {
        ($($t:ty),*) => {$(
            impl<M> Contains for toasty::stmt::Path<M, $t> {
                fn contains(self, _: &str) -> Option<toasty::stmt::Expr<bool>> { None }
            }
        )*};
    }
    no_contains!(i64, bool, f64, Option<String>, Option<i64>);
}

/// The app's database handle (`toasty::Db` in the router's app context).
pub fn db(cx: &topcoat::context::Cx) -> toasty::Db {
    topcoat::context::app_context::<toasty::Db>(cx).clone()
}

/// Build a live query. See crate docs.
///
/// ```ignore
/// live_query! {
///     from i in Issue
///     left join c in User on i.creator_id == c.id
///     where i.open == $(open) && if $(creator) { i.creator_id == $(creator) }
///     order by i.modified desc
///     limit 200
///     select { id: i.id, title: i.title, open: i.open, creator: c.login }
/// }
/// ```
pub use fastcoat_macro::{Table, live_query, routes, row};

/// Client column types for a `#[fastcoat::row]` struct.
pub trait RowTypes {
    const TYPES: &'static [(&'static str, &'static str)];
}
