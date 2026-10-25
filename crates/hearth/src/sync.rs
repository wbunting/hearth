//! Delta loads for synced tables.
//!
//! `GET /_hearth/<table>/load` returns the table's scoped rows as a bare JSON
//! array. With `?sync=1` or `?since=<cursor>` it returns a [`Delta`]
//! envelope instead:
//!
//! ```json
//! { "rows": [...], "deleted": ["key", ...], "cursor": "h1....", "full": false }
//! ```
//!
//! - `full: true`: `rows` is every row the request may read. The client replaces its copy of the
//!   table. Sent when there is no `since`, or when the cursor is malformed, unknown, expired, or
//!   was issued for another table, schema, or session.
//! - `full: false`: `rows` holds rows that are new or changed since the cursor, and `deleted` holds
//!   keys the client had that the request can no longer read (deleted, edited out of scope, or
//!   revoked).
//! - `cursor`: pass it as `since` on the next load. It is opaque.
//!
//! Every load runs the table's scoped read in full and compares it with a
//! snapshot of what the cursor's response contained. Snapshots hold one key
//! and one 128-bit row hash per row, in memory, under a byte budget. This
//! catches writes made outside the app and scope changes without a change
//! log, at the cost of a full scoped scan per load. Snapshots do not survive
//! a restart; clients then receive a full load.
//!
//! A cursor is bound to the session token hash when the session layer is
//! installed. Requests without a session share one anonymous principal, so
//! apps whose anonymous scope differs between requests should require a
//! session for synced tables.

use std::{
    collections::HashMap,
    hash::{BuildHasher, RandomState},
    sync::{Arc, Mutex, MutexGuard, OnceLock},
};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use topcoat::{Result, context::Cx, router::error::internal_server_error};

use crate::Table;

/// Default total size of all stored snapshots.
pub const DEFAULT_BUDGET: usize = 64 << 20;

/// Default number of snapshots kept per table and principal.
pub const DEFAULT_PER_STREAM: usize = 2;

const CURSOR_VERSION: &str = "h1";

/// Query parameters of the load endpoint.
#[derive(Debug, Default, Deserialize)]
pub struct LoadParams {
    /// Cursor from a previous delta response.
    pub since: Option<String>,
    /// Any value requests the delta envelope without a cursor.
    pub sync: Option<String>,
}

impl LoadParams {
    /// Reads the parameters from the request URI.
    pub fn from_request(cx: &Cx) -> Result<Self> {
        topcoat::router::parse_query_params(cx).map_err(|e| topcoat::router::error::bad_request(e.to_string()).into())
    }

    /// Whether the response uses the delta envelope.
    #[must_use]
    pub fn envelope(&self) -> bool {
        self.since.is_some() || self.sync.is_some()
    }
}

/// Body of the load endpoint: a bare row array, or a delta envelope.
#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum LoadBody<R> {
    Rows(Vec<R>),
    Delta(Delta),
}

/// A delta response. See the module docs.
#[derive(Debug, Clone, Serialize)]
pub struct Delta {
    pub rows: Vec<Value>,
    pub deleted: Vec<String>,
    pub cursor: String,
    pub full: bool,
}

/// Identity a cursor is bound to.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Principal(pub [u8; 32]);

impl Principal {
    /// Requests without a session.
    pub const ANONYMOUS: Self = Self([0; 32]);

    /// The current session's token hash, or [`Principal::ANONYMOUS`].
    pub async fn current(cx: &Cx) -> Result<Self> {
        if topcoat::context::try_request_context::<topcoat::session::SessionState>(cx).is_none() {
            return Ok(Self::ANONYMOUS);
        }
        Ok(topcoat::session::token_hash(cx)
            .await?
            .map_or(Self::ANONYMOUS, |hash| Self(*hash)))
    }
}

/// Handles `GET /_hearth/<table>/load` for `T`.
pub async fn load_route<T: Table>(cx: &Cx) -> Result<LoadBody<Value>> {
    let params = LoadParams::from_request(cx)?;
    let rows = T::load(cx).await?;
    let rows = rows
        .into_iter()
        .map(T::to_wire)
        .collect::<Result<Vec<_>, _>>()
        .map_err(internal_server_error)?;
    if !params.envelope() {
        return Ok(LoadBody::Rows(rows));
    }
    let principal = Principal::current(cx).await?;
    let stream = Stream {
        table: T::NAME,
        fingerprint: fingerprint::<T>(),
        principal,
    };
    Ok(LoadBody::Delta(Snapshots::global().delta(
        stream,
        T::KEY,
        params.since.as_deref(),
        rows,
    )))
}

/// Hash of the table's client description (name, key, columns, indexes,
/// writes). A cursor issued under another fingerprint is rejected.
#[must_use]
pub fn fingerprint<T: Table>() -> u64 {
    let json = serde_json::to_vec(&crate::describe::<T>()).unwrap_or_default();
    crate::table::fnv64(&json)
}

/// What a snapshot belongs to. A cursor is only valid for the same stream.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Stream {
    pub table: &'static str,
    pub fingerprint: u64,
    pub principal: Principal,
}

type Entry = (Box<str>, u128);

struct Snapshot {
    stream: Stream,
    entries: Arc<[Entry]>,
    bytes: usize,
    used: u64,
}

struct Inner {
    snapshots: HashMap<u128, Snapshot>,
    bytes: usize,
    tick: u64,
}

/// Bounded in-memory store of load snapshots.
pub struct Snapshots {
    inner: Mutex<Inner>,
    hash: (RandomState, RandomState),
    budget: usize,
    per_stream: usize,
}

impl Snapshots {
    /// A store that keeps at most `budget` bytes of snapshots and at most
    /// `per_stream` snapshots per stream. A snapshot larger than `budget` is
    /// not stored, so its cursor always yields a full load.
    #[must_use]
    pub fn new(budget: usize, per_stream: usize) -> Self {
        Self {
            inner: Mutex::new(Inner {
                snapshots: HashMap::new(),
                bytes: 0,
                tick: 0,
            }),
            hash: (RandomState::new(), RandomState::new()),
            budget,
            per_stream: per_stream.max(1),
        }
    }

    /// The process-wide store used by the load endpoint.
    pub fn global() -> &'static Self {
        static STORE: OnceLock<Snapshots> = OnceLock::new();
        STORE.get_or_init(|| Self::new(DEFAULT_BUDGET, DEFAULT_PER_STREAM))
    }

    fn lock(&self) -> MutexGuard<'_, Inner> {
        self.inner
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    /// Computes the response for `rows` (the full current scoped read, as
    /// JSON objects keyed by `key`) against the snapshot named by `since`.
    pub fn delta(&self, stream: Stream, key: &str, since: Option<&str>, rows: Vec<Value>) -> Delta {
        let base = since.and_then(|c| self.base(stream, c));

        // Current entries, sorted by key, with the row index they came from.
        let mut buf = Vec::new();
        let mut current: Vec<(Box<str>, u128, usize)> = rows
            .iter()
            .enumerate()
            .map(|(i, row)| {
                buf.clear();
                let _ = serde_json::to_writer(&mut buf, row);
                let h = (u128::from(self.hash.0.hash_one(buf.as_slice())) << 64)
                    | u128::from(self.hash.1.hash_one(buf.as_slice()));
                (crate::table::key_string(row.get(key).cloned().unwrap_or(Value::Null)).into_boxed_str(), h, i)
            })
            .collect();
        current.sort_by(|a, b| a.0.cmp(&b.0));
        current.dedup_by(|a, b| a.0 == b.0);

        let Some((base_id, base)) = base else {
            let entries: Arc<[Entry]> = current.into_iter().map(|(k, h, _)| (k, h)).collect();
            let id = self.insert(stream, entries);
            return Delta {
                rows,
                deleted: Vec::new(),
                cursor: cursor(stream, id),
                full: true,
            };
        };

        let mut send = vec![false; rows.len()];
        let mut deleted = Vec::new();
        let (mut i, mut j) = (0, 0);
        while i < current.len() || j < base.len() {
            match (current.get(i), base.get(j)) {
                (Some(c), Some(b)) if c.0 == b.0 => {
                    send[c.2] = c.1 != b.1;
                    i += 1;
                    j += 1;
                }
                (Some(c), Some(b)) if c.0 < b.0 => {
                    send[c.2] = true;
                    i += 1;
                }
                (Some(c), None) => {
                    send[c.2] = true;
                    i += 1;
                }
                (_, Some(b)) => {
                    deleted.push(b.0.to_string());
                    j += 1;
                }
                (None, None) => break,
            }
        }

        if deleted.is_empty() && !send.contains(&true) {
            return Delta {
                rows: Vec::new(),
                deleted,
                cursor: cursor(stream, base_id),
                full: false,
            };
        }
        let rows = rows
            .into_iter()
            .zip(send)
            .filter_map(|(r, s)| s.then_some(r))
            .collect();
        let entries: Arc<[Entry]> = current.into_iter().map(|(k, h, _)| (k, h)).collect();
        let id = self.insert(stream, entries);
        Delta {
            rows,
            deleted,
            cursor: cursor(stream, id),
            full: false,
        }
    }

    /// The snapshot named by `cursor`, if it exists for `stream`.
    fn base(&self, stream: Stream, cursor: &str) -> Option<(u128, Arc<[Entry]>)> {
        let mut parts = cursor.split('.');
        let (Some(CURSOR_VERSION), Some(fp), Some(id), None) =
            (parts.next(), parts.next(), parts.next(), parts.next())
        else {
            return None;
        };
        if u64::from_str_radix(fp, 16).ok()? != stream.fingerprint {
            return None;
        }
        let id = u128::from_str_radix(id, 16).ok()?;
        let mut inner = self.lock();
        inner.tick += 1;
        let tick = inner.tick;
        let snapshot = inner
            .snapshots
            .get_mut(&id)
            .filter(|s| s.stream == stream)?;
        snapshot.used = tick;
        Some((id, snapshot.entries.clone()))
    }

    fn insert(&self, stream: Stream, entries: Arc<[Entry]>) -> u128 {
        let bytes = entries
            .iter()
            .map(|(k, _)| k.len() + size_of::<Entry>())
            .sum::<usize>()
            + 64;
        let mut inner = self.lock();
        inner.tick += 1;
        let used = inner.tick;
        let id = loop {
            let id = (u128::from(self.hash.0.hash_one(used)) << 64)
                | u128::from(RandomState::new().hash_one(used));
            if !inner.snapshots.contains_key(&id) {
                break id;
            }
        };
        if bytes > self.budget {
            return id;
        }
        inner.snapshots.insert(
            id,
            Snapshot {
                stream,
                entries,
                bytes,
                used,
            },
        );
        inner.bytes += bytes;

        while inner
            .snapshots
            .values()
            .filter(|s| s.stream == stream)
            .count()
            > self.per_stream
        {
            inner.evict(|s| s.stream == stream, id);
        }
        while inner.bytes > self.budget {
            inner.evict(|_| true, id);
        }
        id
    }

    /// Number of stored snapshots.
    #[must_use]
    pub fn len(&self) -> usize {
        self.lock().snapshots.len()
    }

    /// Whether no snapshots are stored.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }
}

impl Inner {
    /// Removes the least recently used snapshot matching `pick`, never `keep`.
    fn evict(&mut self, pick: impl Fn(&Snapshot) -> bool, keep: u128) {
        let oldest = self
            .snapshots
            .iter()
            .filter(|(id, s)| **id != keep && pick(s))
            .min_by_key(|(_, s)| s.used)
            .map(|(id, _)| *id);
        if let Some(s) = oldest.and_then(|id| self.snapshots.remove(&id)) {
            self.bytes -= s.bytes;
        }
    }
}

fn cursor(stream: Stream, id: u128) -> String {
    format!("{CURSOR_VERSION}.{:016x}.{id:032x}", stream.fingerprint)
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    const ALICE: Principal = Principal([1; 32]);
    const BOB: Principal = Principal([2; 32]);

    fn stream(principal: Principal) -> Stream {
        Stream {
            table: "issues",
            fingerprint: 7,
            principal,
        }
    }

    fn row(id: &str, title: &str) -> Value {
        json!({ "id": id, "title": title })
    }

    fn keys(rows: &[Value]) -> Vec<&str> {
        let mut k: Vec<_> = rows.iter().map(|r| r["id"].as_str().unwrap()).collect();
        k.sort_unstable();
        k
    }

    #[test]
    fn first_load_is_full() {
        let s = Snapshots::new(DEFAULT_BUDGET, 4);
        let d = s.delta(
            stream(ALICE),
            "id",
            None,
            vec![row("a", "A"), row("b", "B")],
        );
        assert!(d.full);
        assert_eq!(keys(&d.rows), ["a", "b"]);
        assert!(d.deleted.is_empty());
    }

    #[test]
    fn unchanged_load_is_empty_and_keeps_cursor() {
        let s = Snapshots::new(DEFAULT_BUDGET, 4);
        let first = s.delta(
            stream(ALICE),
            "id",
            None,
            vec![row("a", "A"), row("b", "B")],
        );
        let next = s.delta(
            stream(ALICE),
            "id",
            Some(&first.cursor),
            vec![row("b", "B"), row("a", "A")],
        );
        assert!(!next.full);
        assert!(next.rows.is_empty() && next.deleted.is_empty());
        assert_eq!(next.cursor, first.cursor);
    }

    #[test]
    fn sends_inserts_updates_and_deletes() {
        let s = Snapshots::new(DEFAULT_BUDGET, 4);
        let first = s.delta(
            stream(ALICE),
            "id",
            None,
            vec![row("a", "A"), row("b", "B"), row("c", "C")],
        );
        let next = s.delta(
            stream(ALICE),
            "id",
            Some(&first.cursor),
            vec![row("a", "A"), row("b", "B2"), row("d", "D")],
        );
        assert!(!next.full);
        assert_eq!(keys(&next.rows), ["b", "d"]);
        assert_eq!(
            next.rows.iter().find(|r| r["id"] == "b").unwrap()["title"],
            "B2"
        );
        assert_eq!(next.deleted, ["c"]);
        assert_ne!(next.cursor, first.cursor);

        // The new cursor names the new state.
        let again = s.delta(
            stream(ALICE),
            "id",
            Some(&next.cursor),
            vec![row("a", "A"), row("b", "B2"), row("d", "D")],
        );
        assert!(!again.full && again.rows.is_empty() && again.deleted.is_empty());
    }

    #[test]
    fn rows_leaving_scope_are_deleted() {
        let s = Snapshots::new(DEFAULT_BUDGET, 4);
        let first = s.delta(
            stream(ALICE),
            "id",
            None,
            vec![row("pub", "P"), row("secret", "S")],
        );
        // The scope now excludes `secret` (e.g. role revoked).
        let next = s.delta(
            stream(ALICE),
            "id",
            Some(&first.cursor),
            vec![row("pub", "P")],
        );
        assert!(!next.full);
        assert!(next.rows.is_empty());
        assert_eq!(next.deleted, ["secret"]);
    }

    #[test]
    fn old_cursor_still_diffs_from_its_own_state() {
        // A client whose previous response was lost retries with the old cursor.
        let s = Snapshots::new(DEFAULT_BUDGET, 4);
        let first = s.delta(stream(ALICE), "id", None, vec![row("a", "A")]);
        let _lost = s.delta(
            stream(ALICE),
            "id",
            Some(&first.cursor),
            vec![row("a", "A"), row("b", "B")],
        );
        let retry = s.delta(
            stream(ALICE),
            "id",
            Some(&first.cursor),
            vec![row("a", "A"), row("b", "B")],
        );
        assert!(!retry.full);
        assert_eq!(keys(&retry.rows), ["b"]);
    }

    #[test]
    fn cursor_from_another_principal_resets() {
        let s = Snapshots::new(DEFAULT_BUDGET, 4);
        let alice = s.delta(
            stream(ALICE),
            "id",
            None,
            vec![row("a", "A"), row("private", "X")],
        );
        let bob = s.delta(stream(BOB), "id", Some(&alice.cursor), vec![row("a", "A")]);
        assert!(bob.full);
        assert!(
            bob.deleted.is_empty(),
            "must not reveal keys from another principal's snapshot"
        );
        assert_eq!(keys(&bob.rows), ["a"]);
    }

    #[test]
    fn cursor_from_another_schema_or_table_resets() {
        let s = Snapshots::new(DEFAULT_BUDGET, 4);
        let first = s.delta(stream(ALICE), "id", None, vec![row("a", "A")]);
        let changed = Stream {
            fingerprint: 8,
            ..stream(ALICE)
        };
        assert!(
            s.delta(changed, "id", Some(&first.cursor), vec![row("a", "A")])
                .full
        );
        let other = Stream {
            table: "users",
            ..stream(ALICE)
        };
        assert!(
            s.delta(other, "id", Some(&first.cursor), vec![row("a", "A")])
                .full
        );
    }

    #[test]
    fn malformed_or_unknown_cursor_resets() {
        let s = Snapshots::new(DEFAULT_BUDGET, 4);
        let first = s.delta(stream(ALICE), "id", None, vec![row("a", "A")]);
        let last = if first.cursor.ends_with('0') {
            '1'
        } else {
            '0'
        };
        let unknown = format!("{}{last}", &first.cursor[..first.cursor.len() - 1]);
        for since in [
            "",
            "garbage",
            "h1.zz.zz",
            &unknown,
            &format!("{}.x", first.cursor),
        ] {
            let d = s.delta(stream(ALICE), "id", Some(since), vec![row("a", "A")]);
            assert!(d.full, "{since:?} should reset");
            assert_eq!(keys(&d.rows), ["a"]);
        }
    }

    #[test]
    fn evicted_cursor_resets() {
        let s = Snapshots::new(DEFAULT_BUDGET, 2);
        let first = s.delta(stream(ALICE), "id", None, vec![row("a", "1")]);
        let mut last = first.clone();
        for n in 2..5 {
            last = s.delta(
                stream(ALICE),
                "id",
                Some(&last.cursor),
                vec![row("a", &n.to_string())],
            );
        }
        assert!(s.len() <= 2);
        assert!(
            s.delta(
                stream(ALICE),
                "id",
                Some(&first.cursor),
                vec![row("a", "4")]
            )
            .full
        );
        assert!(
            !s.delta(stream(ALICE), "id", Some(&last.cursor), vec![row("a", "4")])
                .full
        );
    }

    #[test]
    fn budget_evicts_least_recently_used() {
        // Room for about one single-row snapshot.
        let s = Snapshots::new(150, 4);
        let a = s.delta(stream(ALICE), "id", None, vec![row("a", "A")]);
        let b = s.delta(stream(BOB), "id", None, vec![row("b", "B")]);
        assert!(
            !s.delta(stream(BOB), "id", Some(&b.cursor), vec![row("b", "B")])
                .full
        );
        assert!(
            s.delta(stream(ALICE), "id", Some(&a.cursor), vec![row("a", "A")])
                .full
        );
    }

    #[test]
    fn snapshot_over_budget_is_not_stored() {
        let s = Snapshots::new(1, 4);
        let a = s.delta(stream(ALICE), "id", None, vec![row("a", "A")]);
        assert!(a.full);
        assert!(s.is_empty());
        let again = s.delta(stream(ALICE), "id", Some(&a.cursor), vec![row("a", "A")]);
        assert!(again.full);
        assert_eq!(keys(&again.rows), ["a"]);
    }

    #[test]
    fn numeric_keys_match_client_strings() {
        let s = Snapshots::new(DEFAULT_BUDGET, 4);
        let first = s.delta(
            stream(ALICE),
            "id",
            None,
            vec![json!({ "id": 1 }), json!({ "id": 2 })],
        );
        let next = s.delta(
            stream(ALICE),
            "id",
            Some(&first.cursor),
            vec![json!({ "id": 1 })],
        );
        assert_eq!(next.deleted, ["2"]);
    }
}
