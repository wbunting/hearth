//! Optimistic writes from `$()` event handlers, typechecked in Rust.
//!
//! ```ignore
//! let issues = fastcoat::table::<Issues>();
//! view! {
//!   <button @click=$(|_e| issues.set_bool(row.id.clone(), "open", !row.open))>"toggle"</button>
//! }
//! ```
//! In JS this is `cx.db.update("issues", key, { open: value })`: an
//! optimistic TanStack mutation whose persist step POSTs to the table's
//! mutation endpoint, where `Table::update` validates it. A rejection rolls
//! back automatically.
//!
//! The handle is a captured value whose JS is `cx.db.table("issues")`, so
//! method calls pass straight through Topcoat's `$()` lowering.

use std::marker::PhantomData;

use serde::{Serialize, Serializer};
use topcoat::runtime::{Expr, Js, Surrogate, Surrogated};

use crate::Table;

/// Browser-side handle to a synced table, usable inside `$()`.
pub struct TableHandle<T: Table>(PhantomData<fn() -> T>);

impl<T: Table> Clone for TableHandle<T> {
    fn clone(&self) -> Self {
        Self(PhantomData)
    }
}

/// Handle for `T`, to capture in `$()` handlers.
#[must_use]
pub fn table<T: Table>() -> Expr<TableHandle<T>> {
    Expr::evaluate_dynamic(TableHandle(PhantomData), Js::source(format!("cx.db.table({:?})", T::NAME)))
}

/// The surrogate (Rust-side type inside `$()`) for a table handle.
pub struct TableSurrogate<T: Table>(PhantomData<fn() -> T>);

impl<T: Table> Surrogated for TableHandle<T> {
    type Surrogate = TableSurrogate<T>;
    fn into_surrogate(self) -> Self::Surrogate {
        TableSurrogate(PhantomData)
    }
}

impl<T: Table> Surrogate for TableSurrogate<T> {
    type Real = TableHandle<T>;
    fn into_real(self) -> Self::Real {
        TableHandle(PhantomData)
    }
}

impl<T: Table> Serialize for TableSurrogate<T> {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(T::NAME)
    }
}

/// Writes are browser-only (like `Signal::set`); calling them during SSR panics.
#[track_caller]
fn browser_only() -> ! {
    panic!("fastcoat table writes run in the browser only")
}

impl<T: Table> TableSurrogate<T> {
    /// Optimistically set a field. `key` and `value` are `$()` values.
    pub fn set<K, V>(&self, _key: K, _field: &topcoat::runtime::StrSurrogate, _value: V)
    where
        K: Surrogate,
        V: Surrogate,
    {
        browser_only()
    }
}
