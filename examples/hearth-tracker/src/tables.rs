//! Synced tables. Each `#[derive(Table)]` declares what the browser gets
//! (columns, key, indexes), who can read which rows (`scope`), and which
//! writes are allowed (`writable(...)` + `update`/`insert`/`delete`).
//! Everything else (collections, indexes, endpoints, SQL for SSR) is derived.

use hearth::{
    Result, Table,
    context::Cx,
    router::error::{bad_request, forbidden},
};
use serde::{Deserialize, Serialize};
use toasty::stmt::{Expr, List, Query};

use crate::{
    auth::viewer,
    db::now_ms,
    model::{Comment, Emoji, Issue, IssueLabel, Label, User},
};

// ---------------------------------------------------------------- issues

#[derive(Table, Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[table(name = "issues", model = Issue, scope = issue_scope, writable(open, title, assignee_id), update = update_issue)]
pub struct IssueRow {
    #[key]
    pub id: String,
    #[index]
    pub short_id: i64,
    pub title: String,
    #[index]
    pub open: bool,
    #[index]
    pub modified: i64,
    #[index]
    pub created: i64,
    #[index]
    pub creator_id: String,
    #[index]
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

/// Crew see everything; everyone else sees public issues.
async fn issue_scope(cx: &Cx) -> Result<Option<Expr<bool>>> {
    let v = viewer(cx).await?;
    Ok((!v.crew).then(|| Issue::fields().visibility().eq("public")))
}

async fn update_issue(cx: &Cx, id: String, patch: IssueRowPatch) -> Result<IssueRow> {
    let v = viewer(cx).await?;
    let mut db = hearth::db(cx);
    let mut issue = Issue::get_by_id(&mut db, &id).await?;
    if !v.can_see(&issue.visibility) || !v.can_edit(&issue.creator_id) {
        return Err(forbidden().into());
    }
    let mut u = issue.update().modified(now_ms());
    if let Some(open) = patch.open {
        u = u.open(open);
    }
    if let Some(title) = patch.title {
        let t = title.trim();
        if t.is_empty() || t.chars().count() > 128 {
            return Err(bad_request("title must be 1-128 characters").into());
        }
        u = u.title(t.to_owned());
    }
    if let Some(assignee) = patch.assignee_id {
        u = u.assignee_id(assignee);
    }
    u.exec(&mut db).await?;
    Ok(issue.into())
}

/// Issues the viewer can see, by id (for authorizing child rows).
async fn visible_issue(cx: &Cx, id: &str) -> Result<Issue> {
    let v = viewer(cx).await?;
    Issue::filter_by_id(id.to_owned())
        .first()
        .exec(&mut hearth::db(cx))
        .await?
        .filter(|i| v.can_see(&i.visibility))
        .ok_or_else(|| forbidden().into())
}

/// Keep child authorization in SQL so the number of public issues does
/// not become a list of bound parameters.
fn public_issue_ids() -> Query<List<String>> {
    Issue::filter(Issue::fields().visibility().eq("public")).select(Issue::fields().id())
}

// ---------------------------------------------------------------- users, labels

#[derive(Table, Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[table(name = "users", model = User, scope = signed_in)]
pub struct UserRow {
    #[key]
    pub id: String,
    #[index]
    pub login: String,
    pub name: Option<String>,
}

impl From<User> for UserRow {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            login: u.login,
            name: u.name,
        }
    }
}

#[derive(Table, Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[table(name = "labels", model = Label, scope = signed_in)]
pub struct LabelRow {
    #[key]
    pub id: String,
    pub name: String,
}

impl From<Label> for LabelRow {
    fn from(l: Label) -> Self {
        Self {
            id: l.id,
            name: l.name,
        }
    }
}

async fn signed_in(cx: &Cx) -> Result<Option<Expr<bool>>> {
    viewer(cx).await?;
    Ok(None)
}

// ---------------------------------------------------------------- issue labels

#[derive(Table, Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[table(name = "issue_labels", model = IssueLabel, scope = issue_label_scope, insert = add_label, delete = remove_label)]
pub struct IssueLabelRow {
    /// `labelId:issueId` (TanStack DB needs a single scalar key).
    #[key]
    #[computed]
    pub id: String,
    #[index]
    pub label_id: String,
    #[index]
    pub issue_id: String,
}

impl From<IssueLabel> for IssueLabelRow {
    fn from(il: IssueLabel) -> Self {
        Self {
            id: format!("{}:{}", il.label_id, il.issue_id),
            label_id: il.label_id,
            issue_id: il.issue_id,
        }
    }
}

async fn issue_label_scope(cx: &Cx) -> Result<Option<Expr<bool>>> {
    let v = viewer(cx).await?;
    Ok((!v.crew).then(|| IssueLabel::fields().issue_id().in_query(public_issue_ids())))
}

async fn add_label(cx: &Cx, row: IssueLabelRow) -> Result<IssueLabelRow> {
    let v = viewer(cx).await?;
    let issue = visible_issue(cx, &row.issue_id).await?;
    if !v.can_edit(&issue.creator_id) {
        return Err(forbidden().into());
    }
    let mut db = hearth::db(cx);
    Label::filter_by_id(row.label_id.clone())
        .first()
        .exec(&mut db)
        .await?
        .ok_or_else(|| bad_request("no such label"))?;
    let exists =
        IssueLabel::filter_by_label_id_and_issue_id(row.label_id.clone(), row.issue_id.clone())
            .first()
            .exec(&mut db)
            .await?;
    if exists.is_none() {
        toasty::create!(IssueLabel {
            label_id: row.label_id.clone(),
            issue_id: row.issue_id.clone()
        })
        .exec(&mut db)
        .await?;
    }
    Ok(IssueLabelRow {
        id: format!("{}:{}", row.label_id, row.issue_id),
        ..row
    })
}

async fn remove_label(cx: &Cx, key: String) -> Result<()> {
    let v = viewer(cx).await?;
    let (label_id, issue_id) = key.split_once(':').ok_or_else(|| bad_request("bad key"))?;
    let issue = visible_issue(cx, issue_id).await?;
    if !v.can_edit(&issue.creator_id) {
        return Err(forbidden().into());
    }
    IssueLabel::filter_by_label_id_and_issue_id(label_id.to_owned(), issue_id.to_owned())
        .delete()
        .exec(&mut hearth::db(cx))
        .await?;
    Ok(())
}

// ---------------------------------------------------------------- comments

#[derive(Table, Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[table(name = "comments", model = Comment, scope = comment_scope, insert = add_comment)]
pub struct CommentRow {
    #[key]
    pub id: String,
    #[index]
    pub issue_id: String,
    #[index]
    pub created: i64,
    pub body: String,
    pub creator_id: String,
}

impl From<Comment> for CommentRow {
    fn from(c: Comment) -> Self {
        Self {
            id: c.id,
            issue_id: c.issue_id,
            created: c.created,
            body: c.body,
            creator_id: c.creator_id,
        }
    }
}

async fn comment_scope(cx: &Cx) -> Result<Option<Expr<bool>>> {
    let v = viewer(cx).await?;
    Ok((!v.crew).then(|| Comment::fields().issue_id().in_query(public_issue_ids())))
}

async fn add_comment(cx: &Cx, row: CommentRow) -> Result<CommentRow> {
    let v = viewer(cx).await?;
    valid_id(&row.id)?;
    visible_issue(cx, &row.issue_id).await?;
    let body = row.body.trim();
    if body.is_empty() || body.len() > 10_000 {
        return Err(bad_request("comment must be 1-10000 bytes").into());
    }
    // Server-owned fields: creator and time come from the session/clock.
    let created = now_ms();
    toasty::create!(Comment {
        id: row.id.clone(),
        issue_id: row.issue_id.clone(),
        created,
        body: body.to_owned(),
        creator_id: v.id.clone()
    })
    .exec(&mut hearth::db(cx))
    .await?;
    Ok(CommentRow {
        created,
        body: body.to_owned(),
        creator_id: v.id,
        ..row
    })
}

// ---------------------------------------------------------------- reactions

#[derive(Table, Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[table(name = "emojis", model = Emoji, scope = signed_in, insert = add_reaction, delete = remove_reaction)]
pub struct EmojiRow {
    /// `subjectId:creatorId:value`: one reaction per user per emoji per subject.
    #[key]
    pub id: String,
    pub value: String,
    #[index]
    pub subject_id: String,
    pub creator_id: String,
    pub created: i64,
}

impl From<Emoji> for EmojiRow {
    fn from(e: Emoji) -> Self {
        Self {
            id: e.id,
            value: e.value,
            subject_id: e.subject_id,
            creator_id: e.creator_id,
            created: e.created,
        }
    }
}

/// A reaction's subject is an issue or a comment; authorize via the issue.
async fn subject_issue(cx: &Cx, subject_id: &str) -> Result<Issue> {
    let issue_id = match Comment::filter_by_id(subject_id.to_owned())
        .first()
        .exec(&mut hearth::db(cx))
        .await?
    {
        Some(c) => c.issue_id,
        None => subject_id.to_owned(),
    };
    visible_issue(cx, &issue_id).await
}

const EMOJIS: &[&str] = &["👍", "🎉", "❤️", "👀", "🚀"];

async fn add_reaction(cx: &Cx, row: EmojiRow) -> Result<EmojiRow> {
    let v = viewer(cx).await?;
    if !EMOJIS.contains(&row.value.as_str()) {
        return Err(bad_request("unsupported emoji").into());
    }
    subject_issue(cx, &row.subject_id).await?;
    // Deterministic id: the client computes the same key for toggling.
    let id = format!("{}:{}:{}", row.subject_id, v.id, row.value);
    let created = now_ms();
    let mut db = hearth::db(cx);
    if Emoji::filter_by_id(id.clone())
        .first()
        .exec(&mut db)
        .await?
        .is_none()
    {
        toasty::create!(Emoji {
            id: id.clone(),
            value: row.value.clone(),
            subject_id: row.subject_id.clone(),
            creator_id: v.id.clone(),
            created
        })
        .exec(&mut db)
        .await?;
    }
    Ok(EmojiRow {
        id,
        creator_id: v.id,
        created,
        ..row
    })
}

async fn remove_reaction(cx: &Cx, id: String) -> Result<()> {
    let v = viewer(cx).await?;
    let mut db = hearth::db(cx);
    let e = Emoji::filter_by_id(id.clone())
        .first()
        .exec(&mut db)
        .await?
        .ok_or_else(forbidden)?;
    if e.creator_id != v.id {
        return Err(forbidden().into());
    }
    Emoji::filter_by_id(id).delete().exec(&mut db).await?;
    Ok(())
}

fn valid_id(id: &str) -> Result<()> {
    if id.is_empty()
        || id.len() > 64
        || !id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
    {
        return Err(bad_request("invalid id").into());
    }
    Ok(())
}

hearth::routes!(
    issues: IssueRow,
    users: UserRow,
    labels: LabelRow,
    issue_labels: IssueLabelRow,
    comments: CommentRow,
    emojis: EmojiRow,
);

// ---------------------------------------------------------------- plain-hearth baseline
// The `/bench/hearth` procedures write through the same authorization as
// the synced tables above.

pub async fn write_issue(
    cx: &Cx,
    id: String,
    open: Option<bool>,
    assignee: Option<String>,
) -> Result<()> {
    let assignee_id = assignee.map(|a| if a.is_empty() { None } else { Some(a) });
    update_issue(
        cx,
        id,
        IssueRowPatch {
            open,
            title: None,
            assignee_id,
        },
    )
    .await
    .map(|_| ())
}

pub async fn write_label(cx: &Cx, issue_id: String, label_id: String, on: bool) -> Result<()> {
    if on {
        add_label(
            cx,
            IssueLabelRow {
                id: String::new(),
                label_id,
                issue_id,
            },
        )
        .await
        .map(|_| ())
    } else {
        remove_label(cx, format!("{label_id}:{issue_id}")).await
    }
}

pub async fn toggle_reaction(cx: &Cx, subject: String, value: String) -> Result<()> {
    let v = viewer(cx).await?;
    let id = format!("{subject}:{}:{value}", v.id);
    if Emoji::filter_by_id(id.clone())
        .first()
        .exec(&mut hearth::db(cx))
        .await?
        .is_some()
    {
        remove_reaction(cx, id).await
    } else {
        add_reaction(
            cx,
            EmojiRow {
                id,
                value,
                subject_id: subject,
                creator_id: v.id,
                created: 0,
            },
        )
        .await
        .map(|_| ())
    }
}

pub async fn write_comment(cx: &Cx, issue_id: String, body: String) -> Result<()> {
    let id = nanoid_like();
    add_comment(
        cx,
        CommentRow {
            id,
            issue_id,
            created: 0,
            body,
            creator_id: String::new(),
        },
    )
    .await
    .map(|_| ())
}

fn nanoid_like() -> String {
    use std::sync::atomic::{AtomicU64, Ordering};
    static N: AtomicU64 = AtomicU64::new(0);
    let t = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("tc-{t:x}-{}", N.fetch_add(1, Ordering::Relaxed))
}

#[cfg(test)]
mod tests;
