//! Scoped reads and authorized writes. This is the only data path to the
//! browser, used for both the SSR snapshot and the collection endpoints.

use serde::{Deserialize, Serialize};
use toasty::stmt::Expr;
use topcoat::{
    Result,
    context::Cx,
    router::error::{bad_request, forbidden},
};

use super::{
    auth::{ReadScope, read_scope},
    model::*,
};
use crate::db::{db, now_ms};

/// Issue list row. Descriptions stay on the server until the detail view.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IssueRow {
    pub id: String,
    pub short_id: i64,
    pub title: String,
    pub open: bool,
    pub modified: i64,
    pub created: i64,
    pub creator_id: String,
    pub assignee_id: Option<String>,
    pub visibility: String,
}

impl From<Issue> for IssueRow {
    fn from(i: Issue) -> Self {
        Self {
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

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserRow {
    pub id: String,
    pub login: String,
    pub name: Option<String>,
    pub avatar: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LabelRow {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IssueLabelRow {
    /// Synthetic key `labelID:issueID`; TanStack DB needs one scalar key.
    pub id: String,
    pub label_id: String,
    pub issue_id: String,
}

fn issue_filter(scope: &ReadScope) -> Expr<bool> {
    let vis = Issue::fields().visibility();
    if scope.crew { vis.clone().eq("public").or(vis.eq("internal")) } else { vis.eq("public") }
}

pub async fn issues(cx: &Cx) -> Result<Vec<IssueRow>> {
    let scope = read_scope(cx).await?;
    let rows = Issue::filter(issue_filter(&scope))
        .order_by(Issue::fields().modified().desc())
        .exec(&mut db(cx))
        .await?;
    Ok(rows.into_iter().map(IssueRow::from).collect())
}

pub async fn users(cx: &Cx) -> Result<Vec<UserRow>> {
    read_scope(cx).await?;
    let rows = User::all().exec(&mut db(cx)).await?;
    Ok(rows
        .into_iter()
        .map(|u| UserRow { id: u.id, login: u.login, name: u.name, avatar: u.avatar })
        .collect())
}

pub async fn labels(cx: &Cx) -> Result<Vec<LabelRow>> {
    read_scope(cx).await?;
    let rows = Label::all().exec(&mut db(cx)).await?;
    Ok(rows.into_iter().map(|l| LabelRow { id: l.id, name: l.name }).collect())
}

pub async fn issue_labels(cx: &Cx) -> Result<Vec<IssueLabelRow>> {
    let scope = read_scope(cx).await?;
    // Only label links for visible issues. P0 filters in Rust; a join query comes later.
    let visible: std::collections::HashSet<String> = Issue::filter(issue_filter(&scope))
        .exec(&mut db(cx))
        .await?
        .into_iter()
        .map(|i| i.id)
        .collect();
    let rows = IssueLabel::all().exec(&mut db(cx)).await?;
    Ok(rows
        .into_iter()
        .filter(|il| visible.contains(&il.issue_id))
        .map(|il| IssueLabelRow {
            id: format!("{}:{}", il.label_id, il.issue_id),
            label_id: il.label_id,
            issue_id: il.issue_id,
        })
        .collect())
}

/// Partial issue update from the client. Only whitelisted fields.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IssuePatch {
    pub id: String,
    pub open: Option<bool>,
    pub title: Option<String>,
    /// `Some(None)` unassigns.
    #[serde(default, with = "double_option")]
    pub assignee_id: Option<Option<String>>,
}

mod double_option {
    use serde::{Deserialize, Deserializer};
    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Option<Option<String>>, D::Error> {
        Ok(Some(Option::deserialize(d)?))
    }
}

pub async fn update_issue(cx: &Cx, patch: IssuePatch) -> Result<IssueRow> {
    let scope = read_scope(cx).await?;
    let mut db = db(cx);
    let mut issue = Issue::get_by_id(&mut db, &patch.id).await?;
    if !scope.can_see_issue(&issue.visibility) {
        return Err(forbidden().into());
    }
    // zbugs rule: only crew or the creator may edit an issue.
    if !scope.crew && issue.creator_id != scope.user_id {
        return Err(forbidden().into());
    }
    let mut update = issue.update().modified(now_ms());
    if let Some(open) = patch.open {
        update = update.open(open);
    }
    if let Some(title) = patch.title {
        let title = title.trim();
        if title.is_empty() || title.chars().count() > 128 {
            return Err(bad_request("title must be 1-128 characters").into());
        }
        update = update.title(title.to_owned());
    }
    if let Some(assignee) = patch.assignee_id {
        update = update.assignee_id(assignee);
    }
    update.exec(&mut db).await?;
    Ok(IssueRow::from(issue))
}
