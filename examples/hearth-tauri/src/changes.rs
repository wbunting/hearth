//! A durable local changelog: the seam a future remote replicator reads.
//!
//! Every accepted table write appends one [`Change`] in the same SQLite
//! transaction as the row change and bumps the row's [`Revision`]. A
//! replicator pages through the log by `seq`, pushes operations to a remote
//! with their base revisions, and advances its cursor once the remote
//! acknowledges them. Nothing here talks to a network. See
//! `docs/hearth/tauri.md` for the full design.

use hearth::{
    Result,
    context::Cx,
    router::{content::Json, route},
};
use serde::Serialize;

use crate::{
    auth::owner,
    model::{Change, Revision},
    now_ms,
};

/// Appends a change for `key` and returns its sequence number.
///
/// Pass `None` for a delete. Call this inside the transaction that applies
/// the change.
///
/// # Errors
///
/// Returns an error when the row cannot be serialized or a query fails.
pub async fn record<R: Serialize>(
    tx: &mut toasty::Transaction<'_>,
    table: &str,
    key: &str,
    row: Option<&R>,
) -> Result<i64> {
    let base = Revision::filter_by_table_name_and_row_key(table.to_owned(), key.to_owned())
        .first()
        .exec(tx)
        .await?;
    let base_revision = base.as_ref().map_or(0, |r| r.revision);
    match base {
        Some(mut rev) => {
            rev.update().revision(base_revision + 1).exec(tx).await?;
        }
        None => {
            toasty::create!(Revision {
                table_name: table.to_owned(),
                row_key: key.to_owned(),
                revision: 1
            })
            .exec(tx)
            .await?;
        }
    }
    let row = match row {
        Some(row) => {
            serde_json::to_string(row).map_err(hearth::router::error::internal_server_error)?
        }
        None => String::new(),
    };
    let change = toasty::create!(Change {
        op_id: uuid::Uuid::new_v4().to_string(),
        table_name: table.to_owned(),
        row_key: key.to_owned(),
        kind: if row.is_empty() { "delete" } else { "upsert" },
        row,
        base_revision,
        at: now_ms()
    })
    .exec(tx)
    .await?;
    Ok(change.seq)
}

/// One page of the changelog, as a replicator would receive it.
#[derive(Debug, Serialize)]
pub struct ChangePage {
    pub changes: Vec<ChangeEntry>,
    /// Pass back as `?after=` for the next page.
    pub cursor: i64,
    pub has_more: bool,
}

#[derive(Debug, Serialize)]
pub struct ChangeEntry {
    pub seq: i64,
    pub op_id: String,
    pub table: String,
    pub key: String,
    pub kind: String,
    pub row: Option<serde_json::Value>,
    pub base_revision: i64,
    pub at: i64,
}

#[hearth::router::query_params(error = bad_request)]
struct PageQuery {
    after: Option<i64>,
}

const PAGE: usize = 100;

/// `GET /_local/changes?after=<seq>`: pages through the outbound log.
///
/// This is a stub of the replicator's read side, exposed over HTTP so the
/// headless test and a developer can inspect it. A real replicator runs in
/// process and reads the table directly.
#[route(GET "/_local/changes")]
async fn changes_page(cx: &Cx) -> Result<Json<ChangePage>> {
    owner(cx)?;
    let after = hearth::router::query_params::<PageQuery>(cx)?
        .after
        .unwrap_or(0);
    let mut rows: Vec<Change> = Change::filter(Change::fields().seq().gt(after))
        .order_by(Change::fields().seq().asc())
        .limit(PAGE + 1)
        .exec(&mut hearth::db(cx))
        .await?;
    let has_more = rows.len() > PAGE;
    rows.truncate(PAGE);
    let cursor = rows.last().map_or(after, |c| c.seq);
    let changes = rows
        .into_iter()
        .map(|c| ChangeEntry {
            row: (!c.row.is_empty())
                .then(|| serde_json::from_str(&c.row).ok())
                .flatten(),
            seq: c.seq,
            op_id: c.op_id,
            table: c.table_name,
            key: c.row_key,
            kind: c.kind,
            base_revision: c.base_revision,
            at: c.at,
        })
        .collect();
    Ok(Json(ChangePage {
        changes,
        cursor,
        has_more,
    }))
}
