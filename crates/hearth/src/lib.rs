#![cfg_attr(docsrs, feature(doc_cfg))]
#![doc = include_str!("../README.md")]

extern crate self as hearth;

#[cfg(feature = "router")]
pub mod dev;

#[cfg(feature = "serve")]
mod serve;

pub use hearth_foundation::error::Error;

pub type Result<T, E = hearth_foundation::error::Error> = hearth_foundation::error::Result<T, E>;

#[cfg(feature = "alpine-ajax")]
pub mod alpine_ajax;

#[cfg(feature = "asset")]
pub mod asset;

#[cfg(feature = "cookie")]
pub mod cookie;

pub mod context;

pub mod core;

#[cfg(feature = "datastar")]
pub mod datastar;

#[cfg(feature = "font")]
pub mod font;

#[cfg(feature = "htmx")]
pub mod htmx;

#[cfg(feature = "icon")]
pub mod icon;

#[cfg(feature = "mail")]
pub mod mail;

#[cfg(feature = "router")]
pub mod router;

#[cfg(feature = "view")]
pub mod view;

#[cfg(feature = "serve")]
pub use serve::{serve, serve_until, start};

#[cfg(feature = "runtime")]
pub mod runtime;

#[cfg(feature = "session")]
pub mod session;

#[cfg(feature = "tailwind")]
pub mod tailwind;

#[doc(hidden)]
pub mod internal;

#[cfg(feature = "local-first")]
mod dedupe;
#[cfg(feature = "local-first")]
pub mod ir;
#[cfg(feature = "local-first")]
mod json_script;
#[cfg(feature = "local-first")]
mod list;
#[cfg(feature = "local-first")]
pub mod mutate;
#[cfg(feature = "local-first")]
pub mod route;
#[cfg(feature = "local-first")]
mod row;
#[cfg(feature = "local-first")]
pub mod sql;
#[cfg(feature = "local-first")]
pub mod sync;
#[cfg(feature = "local-first")]
pub mod table;

#[cfg(feature = "local-first")]
mod local_first {
    pub use crate::{
        json_script::*,
        list::{LiveQuery, LoaderFn as __LoaderFn, client_for, loader as __loader},
        mutate::table as table_handle,
        row::{Row, RowField, row_surrogate_js},
        table::{
            ClientSchema, OnUnauthorized, Table, TableDesc, client_schema, describe, mutation_route,
        },
    };

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
    #[must_use]
    pub fn db(cx: &crate::context::Cx) -> toasty::Db {
        crate::context::app_context::<toasty::Db>(cx).clone()
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
    pub use hearth_macro::{Table, live_query, routes, row};

    /// Client column types for a `#[hearth::row]` struct.
    pub trait RowTypes {
        const TYPES: &'static [(&'static str, &'static str)];
    }
}
#[cfg(feature = "local-first")]
pub use local_first::*;
