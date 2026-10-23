//! Issue list. P0: the list region is owned by handwritten TS
//! (client/src/apps/issues.ts). Topcoat renders the shell, the filter bar and,
//! in `ssr` mode, the first page of rows plus collection snapshots.

use std::collections::HashMap;

use serde::Serialize;
use topcoat::{
    Result,
    context::Cx,
    router::{error::RouterErrorExt, page, query_params},
    view::{View, view},
};

use crate::{
    app::FASTCOAT_JS,
    features::{
        auth::{current_user, read_scope},
        data,
    },
    snapshot::json_script,
};

#[query_params(error = bad_request)]
struct IssuesQuery {
    mode: Option<String>,
}

const FIRST_PAGE: usize = 100;

#[derive(Serialize)]
struct Boot<'a> {
    mode: &'a str,
    scope: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    snapshot: Option<Snapshot>,
}

#[derive(Serialize)]
struct Snapshot {
    issues: Vec<data::IssueRow>,
    users: Vec<data::UserRow>,
    labels: Vec<data::LabelRow>,
    issue_labels: Vec<data::IssueLabelRow>,
}

#[page]
async fn page(cx: &Cx) -> Result<impl View> {
    let user = current_user(cx).await.map_err(Clone::clone)?.as_ref().ok_or_redirect("/login")?;
    let scope = read_scope(cx).await?;
    let q = query_params::<IssuesQuery>(cx)?;
    let mode = match q.mode.as_deref() {
        Some("local") => "local",
        _ => "ssr",
    };

    let (snapshot, first_rows) = if mode == "ssr" {
        let (issues, users, labels, issue_labels) = tokio::try_join!(
            data::issues(cx),
            data::users(cx),
            data::labels(cx),
            data::issue_labels(cx),
        )?;
        let logins: HashMap<&str, &str> = users.iter().map(|u| (u.id.as_str(), u.login.as_str())).collect();
        let rows: Vec<(String, i64, String, bool, String)> = issues
            .iter()
            .filter(|i| i.open)
            .take(FIRST_PAGE)
            .map(|i| {
                let creator = logins.get(i.creator_id.as_str()).copied().unwrap_or("?").to_owned();
                (i.id.clone(), i.short_id, i.title.clone(), i.open, creator)
            })
            .collect();
        (Some(Snapshot { issues, users, labels, issue_labels }), rows)
    } else {
        (None, Vec::new())
    };

    let boot = Boot { mode, scope: scope.fingerprint(), snapshot };

    Ok(view! {
        <header class="bar">
            <strong>"zbugs"</strong>
            <nav class="modes">
                <a href="/issues?mode=ssr" class=(if mode == "ssr" { "on" } else { "" })>"ssr"</a>
                <a href="/issues?mode=local" class=(if mode == "local" { "on" } else { "" })>"local"</a>
            </nav>
            <span class="muted">(&user.login) if user.is_crew() { " · crew" }</span>
            <form method="post" action="/logout"><button>"Sign out"</button></form>
        </header>
        <section class="filters" data-fastcoat-owned="filters">
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
        // Topcoat must never morph inside this element (issue #540); it has no
        // runtime expressions, so page reruns leave it alone.
        <ul id="issues" class="issues" data-fastcoat-owned="issues">
            for row in first_rows {
                <li data-key=(&row.0)>
                    <button class="toggle" data-action="toggle">(if row.3 { "○" } else { "●" })</button>
                    <span class="sid mono">(row.1)</span>
                    <span class="title">(&row.2)</span>
                    <span class="labels"></span>
                    <span class="who muted">(&row.4)</span>
                </li>
            }
        </ul>
        (json_script("fastcoat-boot", &boot))
        <script type="module" src=(FASTCOAT_JS)></script>
    })
}
