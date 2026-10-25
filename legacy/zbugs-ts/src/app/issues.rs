//! Issue list `/issues` and detail `/issue/{short_id}`: one app shell.
//!
//! The server renders the first view (list rows or an issue with its
//! comments) and embeds a *first-view snapshot*: only the rows that view
//! needs, so HTML stays ~tens of KB at any table size. The client seeds
//! TanStack DB from it, marks collections ready, and backfills the full
//! scoped tables in the background. Navigation between list and detail
//! is client-side from the local DB (no server round trip).
//!
//! `?mode=local` renders the shell only and lets the client fill it from a
//! cold DB load, for comparison.

use hearth::json_script;
use std::collections::HashMap;

use serde::Serialize;
use serde_json::{Value, json};
use hearth::{
    Result,
    context::{Cx, app_context},
    router::{error::RouterErrorExt, page, path_param, query_params},
    view::{View, component, view},
};

use crate::{
    app::HEARTH_JS,
    client_schema::ClientSchema,
    features::{
        auth::{current_user, read_scope},
        data,
        model::User,
    },
};

#[query_params(error = bad_request)]
struct ModeQuery {
    mode: Option<String>,
}

path_param!(short_id: i64);

const FIRST_PAGE: usize = 100;

#[derive(Serialize)]
struct Boot<'a> {
    mode: &'a str,
    scope: String,
    user: BootUser,
    schema: &'a ClientSchema,
    /// Collection name → rows for the first view only.
    snapshot: HashMap<&'static str, Value>,
    /// Detail-only text, keyed by issue id.
    descriptions: HashMap<String, String>,
}

#[derive(Serialize)]
struct BootUser {
    id: String,
    login: String,
    crew: bool,
}

/// Rows for the first view, plus everything those rows reference.
struct FirstView {
    issues: Vec<data::IssueRow>,
    comments: Vec<data::CommentRow>,
    emojis: Vec<data::EmojiRow>,
    issue_labels: Vec<data::IssueLabelRow>,
    users: Vec<data::UserRow>,
    labels: Vec<data::LabelRow>,
}

impl FirstView {
    fn into_snapshot(self) -> HashMap<&'static str, Value> {
        HashMap::from([
            ("issues", json!(self.issues)),
            ("comments", json!(self.comments)),
            ("emojis", json!(self.emojis)),
            ("issueLabels", json!(self.issue_labels)),
            ("users", json!(self.users)),
            ("labels", json!(self.labels)),
        ])
    }
}

async fn list_first_view(cx: &Cx) -> Result<FirstView> {
    // P2: this becomes the SSR evaluation of the page's live_query! IR.
    let (issues, users, labels) = tokio::try_join!(data::issues_first_page(cx, FIRST_PAGE), data::users(cx), data::labels(cx))?;
    let issue_labels = data::issue_labels_for(cx, issues.iter().map(|i| i.id.clone()).collect()).await?;
    Ok(FirstView { issues, comments: vec![], emojis: vec![], issue_labels, users, labels })
}

async fn detail_first_view(cx: &Cx, issue_id: &str) -> Result<(FirstView, String)> {
    let (issue, description) = data::issue_detail(cx, issue_id).await?.ok_or_not_found()?;
    let (users, labels, issue_labels, (comments, emojis)) = tokio::try_join!(
        data::users(cx),
        data::labels(cx),
        data::issue_labels_for(cx, vec![issue.id.clone()]),
        data::comments_for(cx, &issue.id),
    )?;
    Ok((FirstView { issues: vec![issue], comments, emojis, issue_labels, users, labels }, description))
}

#[page]
async fn page() -> Result<impl View> {
    Ok(view! { shell(open_issue: None) })
}

#[page("/issue/{short_id}")]
async fn detail(cx: &Cx) -> Result<impl View> {
    let short_id = *path_param::<ShortId>(cx).ok_or_not_found()?;
    let id = data::issue_by_short_id(cx, short_id).await?.ok_or_not_found()?;
    Ok(view! { shell(open_issue: Some(id)) })
}

#[component]
async fn shell(cx: &Cx, open_issue: Option<String>) -> Result<impl View> {
    let user: User = current_user(cx).await.map_err(Clone::clone)?.as_ref().ok_or_redirect("/login")?.clone();
    let scope = read_scope(cx).await?;
    let mode = match query_params::<ModeQuery>(cx)?.mode.as_deref() {
        Some("local") => "local",
        _ => "ssr",
    };
    let schema = app_context::<ClientSchema>(cx);

    let mut descriptions = HashMap::new();
    let first_view = match (mode, &open_issue) {
        ("local", _) => None,
        (_, Some(id)) => {
            let (fv, description) = detail_first_view(cx, id).await?;
            descriptions.insert(id.clone(), description);
            Some(fv)
        }
        (_, None) => Some(list_first_view(cx).await?),
    };

    // Server-rendered markup for the first view (the client re-renders the
    // same structure; list rows are adopted by key).
    let logins: HashMap<String, String> =
        first_view.as_ref().map(|fv| fv.users.iter().map(|u| (u.id.clone(), u.login.clone())).collect()).unwrap_or_default();
    let login = |id: &str| logins.get(id).cloned().unwrap_or_else(|| "?".into());
    let list_rows: Vec<(String, i64, String, bool, String)> = match (&first_view, &open_issue) {
        (Some(fv), None) => fv.issues.iter().map(|i| (i.id.clone(), i.short_id, i.title.clone(), i.open, login(&i.creator_id))).collect(),
        _ => vec![],
    };
    let detail_ssr = match (&first_view, &open_issue) {
        (Some(fv), Some(id)) => fv.issues.first().map(|i| {
            let comments: Vec<(String, String, String)> =
                fv.comments.iter().map(|c| (c.id.clone(), login(&c.creator_id), c.body.clone())).collect();
            (i.short_id, i.title.clone(), i.open, login(&i.creator_id), descriptions.get(id).cloned().unwrap_or_default(), comments)
        }),
        _ => None,
    };

    let boot = Boot {
        mode,
        scope: scope.fingerprint(),
        user: BootUser { id: user.id.clone(), login: user.login.clone(), crew: user.is_crew() },
        schema,
        snapshot: first_view.map(FirstView::into_snapshot).unwrap_or_default(),
        descriptions,
    };
    let view_name = if open_issue.is_some() { "detail" } else { "list" };
    let mode_q = if mode == "local" { "?mode=local" } else { "" };

    Ok(view! {
        <div id="app" data-view=(view_name)>
            <header class="bar">
                <a class="brand" href=(format!("/issues{mode_q}")) data-nav="list">"zbugs"</a>
                <nav class="modes">
                    <a href="/issues?mode=ssr" class=(if mode == "ssr" { "on" } else { "" })>"ssr"</a>
                    <a href="/issues?mode=local" class=(if mode == "local" { "on" } else { "" })>"local"</a>
                </nav>
                <span class="muted">(&user.login) if user.is_crew() { " · crew" }</span>
                <form method="post" action="/logout"><button>"Sign out"</button></form>
            </header>
            <section id="list-view">
                <section class="filters">
                    <select id="f-open">
                        <option value="open" selected="">"Open"</option>
                        <option value="closed">"Closed"</option>
                        <option value="all">"All"</option>
                    </select>
                    <select id="f-creator"><option value="">"Any creator"</option></select>
                    <select id="f-assignee"><option value="">"Any assignee"</option></select>
                    <select id="f-label"><option value="">"Any label"</option></select>
                    <input id="f-text" type="search" placeholder="Filter title…">
                    <select id="f-sort">
                        <option value="modified">"Modified"</option>
                        <option value="created">"Created"</option>
                    </select>
                    <span id="count" class="muted"></span>
                    <span id="timing" class="muted mono"></span>
                </section>
                // Owned by the client list renderer; no runtime expressions inside,
                // so Hearth reruns never morph it (issue #540).
                <ul id="issues" class="issues">
                    for row in list_rows {
                        <li data-key=(&row.0)>
                            <button class="toggle" data-action="toggle">(if row.3 { "○" } else { "●" })</button>
                            <a class="sid mono" href=(format!("/issue/{}", row.1)) data-nav="issue">(row.1)</a>
                            <a class="title" href=(format!("/issue/{}", row.1)) data-nav="issue">(&row.2)</a>
                            <span class="labels"></span>
                            <span class="who muted">(&row.4)</span>
                        </li>
                    }
                </ul>
            </section>
            <article id="detail-view" class="detail">
                if let Some((sid, title, open, creator, description, comments)) = detail_ssr {
                    <nav class="crumbs">
                        <a href=(format!("/issues{mode_q}")) data-nav="list">"← Issues"</a>
                        <span class="mono muted">" #" (sid)</span>
                    </nav>
                    <h1 class="d-title">(&title)</h1>
                    <div class="d-meta muted">
                        (if open { "Open" } else { "Closed" }) " · by " (&creator)
                    </div>
                    <div class="d-desc">(&description)</div>
                    <h2>"Comments"</h2>
                    <ul class="comments">
                        for c in comments {
                            <li data-key=(&c.0)><strong>(&c.1)</strong><div class="c-body">(&c.2)</div></li>
                        }
                    </ul>
                }
            </article>
        </div>
        (json_script("hearth-boot", &boot))
        <script type="module" src=(HEARTH_JS)></script>
    })
}
