//! Synced tables (fastcoat::Table impls). Authorization lives in `load`
//! (read scope) and `update` (write rules); everything browser-side is derived.

use fastcoat::{Table, ir::{JsonRow, Query}, table::BoxFut};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use topcoat::{
    context::Cx,
    router::error::{bad_request, forbidden},
};

use crate::{
    db::{db, now_ms},
    features::{auth::read_scope, data, model::Issue},
};

pub struct Issues;
pub struct Users;
pub struct Labels;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IssueWire {
    pub id: String,
    pub short_id: i64,
    /// Derived on the server: `short_id` as a string (route param match) and
    /// the client route. Computed columns are plain wire fields.
    pub short_key: String,
    pub href: String,
    pub title: String,
    pub open: bool,
    pub modified: i64,
    pub created: i64,
    pub creator_id: String,
    pub assignee_id: Option<String>,
    pub visibility: String,
}

impl From<data::IssueRow> for IssueWire {
    fn from(i: data::IssueRow) -> Self {
        Self {
            short_key: i.short_id.to_string(),
            href: format!("/rs/issue/{}", i.short_id),
            id: i.id,
            short_id: i.short_id,
            title: i.title,
            open: i.open,
            modified: i.modified,
            created: i.created,
            creator_id: i.creator_id,
            assignee_id: i.assignee_id,
            visibility: i.visibility,
        }
    }
}

impl Table for Issues {
    type Row = IssueWire;
    const NAME: &'static str = "issues";
    const KEY: &'static str = "id";
    const COLUMNS: &'static [(&'static str, &'static str)] = &[
        ("id", "string"), ("shortId", "i64"), ("shortKey", "string"), ("href", "string"), ("title", "string"), ("open", "bool"), ("modified", "i64"),
        ("created", "i64"), ("creatorId", "string"), ("assigneeId", "opt_string"), ("visibility", "string"),
    ];
    fn indexes() -> Vec<&'static str> {
        // From Issue's Toasty #[index]es + sort columns.
        vec!["id", "shortId", "shortKey", "modified", "created", "open", "creatorId", "assigneeId"]
    }
    fn load(cx: &Cx) -> BoxFut<'_, Vec<IssueWire>> {
        Box::pin(async move { Ok(data::issues(cx).await?.into_iter().map(Into::into).collect()) })
    }
    fn load_first<'a>(cx: &'a Cx, q: &'a Query, _params: &'a [Value]) -> BoxFut<'a, Vec<IssueWire>> {
        // SSR: push the base-table order+limit into SQL (indexed), over-fetching
        // to leave room for in-memory filters. Full IR→SQL lowering is P2.
        let limit = q.limit.unwrap_or(100) * 4;
        Box::pin(async move {
            let scope = read_scope(cx).await?;
            let vis = Issue::fields().visibility();
            let filter = if scope.crew { vis.clone().eq("public").or(vis.eq("internal")) } else { vis.eq("public") };
            let rows = Issue::filter(filter.and(Issue::fields().open().eq(true)))
                .order_by(Issue::fields().modified().desc())
                .limit(limit)
                .exec(&mut db(cx))
                .await?;
            Ok(rows.into_iter().map(|i| IssueWire::from(data::IssueRow::from(i))).collect())
        })
    }
    fn update<'a>(cx: &'a Cx, key: String, changes: JsonRow) -> BoxFut<'a, IssueWire> {
        Box::pin(async move {
            // Only whitelisted fields; the server owns `modified`.
            let patch = data::IssuePatch {
                id: key,
                open: changes.get("open").and_then(Value::as_bool),
                title: changes.get("title").and_then(Value::as_str).map(str::to_owned),
                assignee_id: changes.get("assigneeId").map(|v| v.as_str().map(str::to_owned)),
            };
            if changes.keys().any(|k| !matches!(k.as_str(), "open" | "title" | "assigneeId" | "modified")) {
                return Err(bad_request("unsupported field").into());
            }
            let _ = now_ms;
            let _ = forbidden;
            Ok(data::update_issue(cx, patch).await?.into())
        })
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserWire {
    pub id: String,
    pub login: String,
}

impl Table for Users {
    type Row = UserWire;
    const NAME: &'static str = "users";
    const KEY: &'static str = "id";
    const COLUMNS: &'static [(&'static str, &'static str)] = &[("id", "string"), ("login", "string")];
    fn indexes() -> Vec<&'static str> {
        vec!["id", "login"]
    }
    fn load(cx: &Cx) -> BoxFut<'_, Vec<UserWire>> {
        Box::pin(async move { Ok(data::users(cx).await?.into_iter().map(|u| UserWire { id: u.id, login: u.login }).collect()) })
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LabelWire {
    pub id: String,
    pub name: String,
}

impl Table for Labels {
    type Row = LabelWire;
    const NAME: &'static str = "labels";
    const KEY: &'static str = "id";
    const COLUMNS: &'static [(&'static str, &'static str)] = &[("id", "string"), ("name", "string")];
    fn indexes() -> Vec<&'static str> {
        vec!["id"]
    }
    fn load(cx: &Cx) -> BoxFut<'_, Vec<LabelWire>> {
        Box::pin(async move { Ok(data::labels(cx).await?.into_iter().map(|l| LabelWire { id: l.id, name: l.name }).collect()) })
    }
}

/// Descriptors for the browser, in dependency order.
pub fn schema(scope: String) -> fastcoat::ClientSchema {
    fastcoat::client_schema(
        scope,
        vec![fastcoat::table::describe::<Issues>(), fastcoat::table::describe::<Users>(), fastcoat::table::describe::<Labels>()],
    )
}
