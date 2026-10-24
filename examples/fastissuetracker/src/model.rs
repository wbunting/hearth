//! The zbugs schema (after rocicorp/mono apps/zbugs), as Toasty models.
//!
//! Relations are plain indexed id columns, not `#[belongs_to]`. The server
//! serves whole rows per table, and TanStack DB performs the joins in the
//! browser. Timestamps are epoch milliseconds, as in zbugs.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, toasty::Model)]
pub struct User {
    #[key]
    pub id: String,
    #[unique]
    pub login: String,
    pub name: Option<String>,
    pub avatar: Option<String>,
    /// `crew` or `user`. Crew can see `internal` issues.
    pub role: String,
}

impl User {
    pub fn is_crew(&self) -> bool {
        self.role == "crew"
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, toasty::Model)]
pub struct Project {
    #[key]
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, toasty::Model)]
// The list's hot query: `open = ? ORDER BY modified DESC LIMIT n`.
#[index(open, modified)]
pub struct Issue {
    #[key]
    pub id: String,
    #[index]
    pub short_id: i64,
    pub title: String,
    pub open: bool,
    #[index]
    pub modified: i64,
    pub created: i64,
    #[index]
    pub project_id: String,
    #[index]
    pub creator_id: String,
    #[index]
    pub assignee_id: Option<String>,
    pub description: String,
    /// `public` or `internal`.
    pub visibility: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, toasty::Model)]
pub struct Comment {
    #[key]
    pub id: String,
    #[index]
    pub issue_id: String,
    pub created: i64,
    pub body: String,
    pub creator_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, toasty::Model)]
pub struct Label {
    #[key]
    pub id: String,
    pub name: String,
    pub project_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, toasty::Model)]
#[key(label_id, issue_id)]
pub struct IssueLabel {
    #[index]
    pub label_id: String,
    #[index]
    pub issue_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, toasty::Model)]
pub struct Emoji {
    #[key]
    pub id: String,
    pub value: String,
    #[index]
    pub subject_id: String,
    pub creator_id: String,
    pub created: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, toasty::Model)]
#[key(user_id, issue_id)]
pub struct ViewState {
    pub user_id: String,
    pub issue_id: String,
    pub viewed: i64,
}

/// Login session; stores only the token hash.
#[derive(Debug, toasty::Model)]
pub struct Session {
    #[key]
    pub token_hash: Vec<u8>,
    #[index]
    pub user_id: String,
    pub expires_at: i64,
}
