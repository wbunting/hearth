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

#[derive(Debug, Clone, Serialize, Deserialize)]
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

/// First page of the list, as the SQL engine would do it: index-ordered,
/// filtered and limited in the database (not a full-table scan in Rust).
/// P2 generates this from the same `live_query!` IR the client runs.
pub async fn issues_first_page(cx: &Cx, limit: usize) -> Result<Vec<IssueRow>> {
    let scope = read_scope(cx).await?;
    let rows = Issue::filter(issue_filter(&scope).and(Issue::fields().open().eq(true)))
        .order_by(Issue::fields().modified().desc())
        .limit(limit)
        .exec(&mut db(cx))
        .await?;
    Ok(rows.into_iter().map(IssueRow::from).collect())
}

/// Label links for specific issues (first-view snapshot).
pub async fn issue_labels_for(cx: &Cx, issue_ids: Vec<String>) -> Result<Vec<IssueLabelRow>> {
    read_scope(cx).await?;
    if issue_ids.is_empty() {
        return Ok(vec![]);
    }
    let rows = IssueLabel::filter(IssueLabel::fields().issue_id().in_list(issue_ids)).exec(&mut db(cx)).await?;
    Ok(rows
        .into_iter()
        .map(|il| IssueLabelRow { id: format!("{}:{}", il.label_id, il.issue_id), label_id: il.label_id, issue_id: il.issue_id })
        .collect())
}

/// Comments and their emojis for one (already authorized) issue.
pub async fn comments_for(cx: &Cx, issue_id: &str) -> Result<(Vec<CommentRow>, Vec<EmojiRow>)> {
    let comments: Vec<CommentRow> = Comment::filter_by_issue_id(issue_id.to_owned())
        .exec(&mut db(cx))
        .await?
        .into_iter()
        .map(|c| CommentRow { id: c.id, issue_id: c.issue_id, created: c.created, body: c.body, creator_id: c.creator_id })
        .collect();
    let subjects: Vec<String> = comments.iter().map(|c| c.id.clone()).chain(std::iter::once(issue_id.to_owned())).collect();
    let emojis = Emoji::filter(Emoji::fields().subject_id().in_list(subjects))
        .exec(&mut db(cx))
        .await?
        .into_iter()
        .map(|e| EmojiRow { id: e.id, value: e.value, subject_id: e.subject_id, creator_id: e.creator_id, created: e.created })
        .collect();
    Ok((comments, emojis))
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
    let visible = visible_issue_ids(cx, &scope).await?;
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommentRow {
    pub id: String,
    pub issue_id: String,
    pub created: i64,
    pub body: String,
    pub creator_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmojiRow {
    pub id: String,
    pub value: String,
    pub subject_id: String,
    pub creator_id: String,
    pub created: i64,
}

/// Ids of the issues the scope may read. P0/P1 filter in Rust; P2 pushes
/// this into the query (semi-join on issue visibility).
async fn visible_issue_ids(cx: &Cx, scope: &ReadScope) -> Result<std::collections::HashSet<String>> {
    Ok(Issue::filter(issue_filter(scope)).exec(&mut db(cx)).await?.into_iter().map(|i| i.id).collect())
}

pub async fn comments(cx: &Cx) -> Result<Vec<CommentRow>> {
    let scope = read_scope(cx).await?;
    let visible = visible_issue_ids(cx, &scope).await?;
    let rows = Comment::all().exec(&mut db(cx)).await?;
    Ok(rows
        .into_iter()
        .filter(|c| visible.contains(&c.issue_id))
        .map(|c| CommentRow { id: c.id, issue_id: c.issue_id, created: c.created, body: c.body, creator_id: c.creator_id })
        .collect())
}

pub async fn emojis(cx: &Cx) -> Result<Vec<EmojiRow>> {
    let scope = read_scope(cx).await?;
    let visible = visible_issue_ids(cx, &scope).await?;
    let rows = Emoji::all().exec(&mut db(cx)).await?;
    Ok(rows
        .into_iter()
        .filter(|e| visible.contains(&e.subject_id))
        .map(|e| EmojiRow { id: e.id, value: e.value, subject_id: e.subject_id, creator_id: e.creator_id, created: e.created })
        .collect())
}

pub async fn issue_detail(cx: &Cx, id: &str) -> Result<Option<(IssueRow, String)>> {
    let scope = read_scope(cx).await?;
    let Some(issue) = Issue::filter_by_id(id.to_owned()).first().exec(&mut db(cx)).await? else {
        return Ok(None);
    };
    if !scope.can_see_issue(&issue.visibility) {
        return Ok(None);
    }
    let description = issue.description.clone();
    Ok(Some((IssueRow::from(issue), description)))
}

pub async fn issue_by_short_id(cx: &Cx, short_id: i64) -> Result<Option<String>> {
    let scope = read_scope(cx).await?;
    let issue = Issue::filter_by_short_id(short_id).first().exec(&mut db(cx)).await?;
    Ok(issue.filter(|i| scope.can_see_issue(&i.visibility)).map(|i| i.id))
}

async fn require_visible(cx: &Cx, scope: &ReadScope, issue_id: &str) -> Result<Issue> {
    let issue = Issue::filter_by_id(issue_id.to_owned())
        .first()
        .exec(&mut db(cx))
        .await?
        .filter(|i| scope.can_see_issue(&i.visibility))
        .ok_or_else(forbidden)?;
    Ok(issue)
}

/// Client-generated ids (crypto.randomUUID) let the optimistic row and the
/// server row share a key, so no remap step is needed.
fn valid_client_id(id: &str) -> Result<()> {
    if id.is_empty() || id.len() > 64 || !id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_') {
        return Err(bad_request("invalid id").into());
    }
    Ok(())
}

pub async fn insert_comment(cx: &Cx, row: CommentRow) -> Result<CommentRow> {
    let scope = read_scope(cx).await?;
    valid_client_id(&row.id)?;
    require_visible(cx, &scope, &row.issue_id).await?;
    let body = row.body.trim();
    if body.is_empty() || body.len() > 10_000 {
        return Err(bad_request("comment must be 1-10000 bytes").into());
    }
    // Server-owned fields: creator and time come from the session, not the client.
    let created = now_ms();
    toasty::create!(Comment {
        id: row.id.clone(),
        issue_id: row.issue_id.clone(),
        created,
        body: body.to_owned(),
        creator_id: scope.user_id.clone(),
    })
    .exec(&mut db(cx))
    .await?;
    Ok(CommentRow { id: row.id, issue_id: row.issue_id, created, body: body.to_owned(), creator_id: scope.user_id })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IssueLabelInput {
    pub label_id: String,
    pub issue_id: String,
}

pub async fn insert_issue_label(cx: &Cx, input: IssueLabelInput) -> Result<IssueLabelRow> {
    let scope = read_scope(cx).await?;
    let issue = require_visible(cx, &scope, &input.issue_id).await?;
    if !scope.crew && issue.creator_id != scope.user_id {
        return Err(forbidden().into());
    }
    Label::filter_by_id(input.label_id.clone()).first().exec(&mut db(cx)).await?.ok_or_else(|| bad_request("no such label"))?;
    let existing = IssueLabel::filter_by_label_id_and_issue_id(input.label_id.clone(), input.issue_id.clone())
        .first()
        .exec(&mut db(cx))
        .await?;
    if existing.is_none() {
        toasty::create!(IssueLabel { label_id: input.label_id.clone(), issue_id: input.issue_id.clone() })
            .exec(&mut db(cx))
            .await?;
    }
    Ok(IssueLabelRow { id: format!("{}:{}", input.label_id, input.issue_id), label_id: input.label_id, issue_id: input.issue_id })
}

pub async fn delete_issue_label(cx: &Cx, input: IssueLabelInput) -> Result<()> {
    let scope = read_scope(cx).await?;
    let issue = require_visible(cx, &scope, &input.issue_id).await?;
    if !scope.crew && issue.creator_id != scope.user_id {
        return Err(forbidden().into());
    }
    IssueLabel::filter_by_label_id_and_issue_id(input.label_id, input.issue_id).delete().exec(&mut db(cx)).await?;
    Ok(())
}

pub async fn insert_emoji(cx: &Cx, row: EmojiRow) -> Result<EmojiRow> {
    let scope = read_scope(cx).await?;
    valid_client_id(&row.id)?;
    require_visible(cx, &scope, &row.subject_id).await?;
    if row.value.chars().count() > 8 || row.value.is_empty() {
        return Err(bad_request("bad emoji").into());
    }
    let created = now_ms();
    toasty::create!(Emoji {
        id: row.id.clone(),
        value: row.value.clone(),
        subject_id: row.subject_id.clone(),
        creator_id: scope.user_id.clone(),
        created,
    })
    .exec(&mut db(cx))
    .await?;
    Ok(EmojiRow { creator_id: scope.user_id, created, ..row })
}

#[derive(Debug, Deserialize)]
pub struct IdInput {
    pub id: String,
}

pub async fn delete_emoji(cx: &Cx, input: IdInput) -> Result<()> {
    let scope = read_scope(cx).await?;
    let emoji = Emoji::filter_by_id(input.id.clone()).first().exec(&mut db(cx)).await?.ok_or_else(forbidden)?;
    if emoji.creator_id != scope.user_id {
        return Err(forbidden().into());
    }
    Emoji::filter_by_id(input.id).delete().exec(&mut db(cx)).await?;
    Ok(())
}
