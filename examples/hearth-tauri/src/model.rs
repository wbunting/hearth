//! Toasty models stored in the on-device SQLite database.

use serde::{Deserialize, Serialize};

/// A named task list, such as "Today" or "Groceries".
#[derive(Debug, Clone, Serialize, Deserialize, toasty::Model)]
pub struct List {
    #[key]
    pub id: String,
    pub name: String,
    #[index]
    pub created: i64,
}

/// A task in a list.
#[derive(Debug, Clone, Serialize, Deserialize, toasty::Model)]
#[index(list_id, created)]
pub struct Task {
    #[key]
    pub id: String,
    #[index]
    pub list_id: String,
    pub title: String,
    pub done: bool,
    #[index]
    pub created: i64,
    pub modified: i64,
}

/// One accepted local write, waiting to be replicated to a remote server.
///
/// Written in the same SQLite transaction as the change it describes, so the
/// log and the tables cannot disagree after a crash. `seq` orders the log and
/// doubles as the replication cursor.
#[derive(Debug, Clone, toasty::Model)]
pub struct Change {
    #[key]
    #[auto]
    pub seq: i64,
    /// Client-generated operation id. A retry with the same id is a no-op
    /// on the remote.
    pub op_id: String,
    pub table_name: String,
    pub row_key: String,
    /// `upsert` or `delete`.
    pub kind: String,
    /// The full row after the change, as JSON. Empty for deletes.
    pub row: String,
    /// The row's local revision before this change (0 for an insert). The
    /// remote rejects or quarantines the change if its revision differs.
    pub base_revision: i64,
    pub at: i64,
}

/// The local revision of each row, bumped by every accepted write.
///
/// Kept apart from the synced row so the browser schema stays unchanged.
#[derive(Debug, Clone, toasty::Model)]
#[key(table_name, row_key)]
pub struct Revision {
    pub table_name: String,
    pub row_key: String,
    pub revision: i64,
}
