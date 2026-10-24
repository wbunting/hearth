//! Optimistic writes from `$()` event handlers, typechecked in Rust.
//!
//! ```ignore
//! let issues = hearth::table::<Issues>();
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
    panic!("hearth table writes run in the browser only")
}

use topcoat::runtime::StrSurrogate as S;

/// Writes are typed on the Rust side (field names are `&str`, values any
/// `$()` value); the server's `Table::update/insert` validates them.
/// `insert`/`toggle` take up to 4 `field, value` pairs (no variadics in Rust).
impl<T: Table> TableSurrogate<T> {
    /// Optimistically set a field.
    pub fn set<K: Surrogate, V: Surrogate>(&self, _key: K, _field: &S, _value: V) {
        browser_only()
    }
    /// Optimistically delete a row.
    pub fn remove<K: Surrogate>(&self, _key: K) {
        browser_only()
    }
    pub fn insert1<A: Surrogate>(&self, _f1: &S, _v1: A) {
        browser_only()
    }
    pub fn insert2<A: Surrogate, B: Surrogate>(&self, _f1: &S, _v1: A, _f2: &S, _v2: B) {
        browser_only()
    }
    pub fn insert3<A: Surrogate, B: Surrogate, C: Surrogate>(&self, _f1: &S, _v1: A, _f2: &S, _v2: B, _f3: &S, _v3: C) {
        browser_only()
    }
    #[allow(clippy::too_many_arguments, reason = "field/value pairs mirror the JS varargs call")]
    pub fn insert4<A: Surrogate, B: Surrogate, C: Surrogate, D: Surrogate>(
        &self, _f1: &S, _v1: A, _f2: &S, _v2: B, _f3: &S, _v3: C, _f4: &S, _v4: D,
    ) {
        browser_only()
    }
    /// Delete `key` if present, else insert the given fields (membership rows
    /// like issue labels or reactions).
    pub fn toggle2<K: Surrogate, A: Surrogate, B: Surrogate>(&self, _key: K, _f1: &S, _v1: A, _f2: &S, _v2: B) {
        browser_only()
    }
    #[allow(clippy::too_many_arguments, reason = "field/value pairs mirror the JS varargs call")]
    pub fn toggle3<K: Surrogate, A: Surrogate, B: Surrogate, C: Surrogate>(
        &self, _key: K, _f1: &S, _v1: A, _f2: &S, _v2: B, _f3: &S, _v3: C,
    ) {
        browser_only()
    }
}
