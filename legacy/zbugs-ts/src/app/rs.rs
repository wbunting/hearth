//! The zbugs issue list written in **Rust only** on the forked runtime.
//! No app JavaScript/TypeScript: queries, row templates, filters, writes
//! and routing below all compile to JS via the framework.

use hearth::{json_script, live_query, route, table_handle};
use hearth::{
    Result,
    context::Cx,
    router::{error::RouterErrorExt, page},
    runtime::{Event, signal},
    view::{View, view},
};

use crate::{
    features::auth::{current_user, read_scope},
    tables::{self, Issues, Users},
};

/// What a list row exposes to the template (a Hearth `#[record]`).
#[hearth::row]
pub struct IssueItem {
    pub id: String,
    pub short_id: i64,
    pub href: String,
    pub title: String,
    pub open: bool,
    pub modified: i64,
    pub creator: Option<String>,
    pub assignee: Option<String>,
}

#[page("/rs/issue/{short}")]
async fn issue_page(cx: &Cx) -> Result<impl View> {
    Ok(view! { app() })
}

#[page("/rs/issues")]
async fn issues(cx: &Cx) -> Result<impl View> {
    Ok(view! { app() })
}

#[hearth::view::component]
async fn app(cx: &Cx) -> Result<impl View> {
    let user = current_user(cx).await.map_err(Clone::clone)?.as_ref().ok_or_redirect("/login")?.clone();
    let scope = read_scope(cx).await?;

    // Browser state. Changing any of these re-runs the query locally.
    let show_open = signal(cx, || true);
    let creator = signal(cx, String::new);
    let text = signal(cx, String::new);

    let rows = live_query! {
        IssueItem from i in Issues
        left join c in Users on i.creator_id == c.id
        left join a in Users on i.assignee_id == a.id
        where i.open == $(show_open.get())
            && if $(creator.get()) { i.creator_id == $(creator.get()) }
            && if $(text.get()) { i.title contains $(text.get()) }
        order by i.modified desc
        limit 200
        select {
            id: i.id, short_id: i.short_id, href: i.href, title: i.title, open: i.open,
            modified: i.modified, creator: c.login, assignee: a.login
        }
    };
    // Detail: the issue whose short id is the 3rd path segment (/rs/issue/N).
    let short = route::segment(cx, 2);
    let detail = live_query! {
        IssueItem from i in Issues
        left join c in Users on i.creator_id == c.id
        left join a in Users on i.assignee_id == a.id
        where i.short_key == $(short.clone())
        order by i.id
        limit 1
        select {
            id: i.id, short_id: i.short_id, href: i.href, title: i.title, open: i.open,
            modified: i.modified, creator: c.login, assignee: a.login
        }
    };
    let path = route::path(cx);
    let issues_table = table_handle::<Issues>();
    let schema = tables::schema(scope.fingerprint());
    let boot = serde_json::json!({ "schema": schema, "snapshot": {}, "backfill": false });

    Ok(view! {
        <header class="bar">
            <a class="brand" href="/rs/issues">"zbugs · pure Rust"</a>
            <span class="muted">(&user.login)</span>
        </header>
        <section class="filters">
            <select @change=$(|e: Event| show_open.set(e.target.value == "open"))>
                <option value="open" selected="">"Open"</option>
                <option value="closed">"Closed"</option>
            </select>
            <select @change=$(|e: Event| creator.set(e.target.value))>
                <option value="">"Any creator"</option>
                <option value="nqYkxAGMnzk7Y5STjZryV">"arv"</option>
                <option value="tDY6IbKdVqbBlRBc3XMwF">"tantaman"</option>
                <option value="ieK09sy2C_AIWE8KRkrQR">"darkgnotic"</option>
            </select>
            <input type="search" placeholder="Filter title…" @input=$(|e: Event| text.set(e.target.value))>
        </section>
        if $(path.starts_with("/rs/issues")) {
        <ul class="issues">
            for issue in $(rows) {
                <li>
                    <button class="toggle"
                        @click=$(|_e| issues_table.set(issue.id.clone(), "open", !issue.open))>
                        $(if issue.open { "○" } else { "●" })
                    </button>
                    <span class="sid mono">$(issue.short_id)</span>
                    <a class="title" data-hearth-link="" :href=$(issue.href.clone())>$(issue.title.clone())</a>
                    <span class="labels"></span>
                    <span class="who muted">
                        $(if issue.creator.is_some() { issue.creator.clone().unwrap() } else { "?".to_owned() })
                    </span>
                </li>
            }
        </ul>
        }
        if $(path.starts_with("/rs/issue/")) {
        <article class="detail">
            for issue in $(detail) {
                <nav class="crumbs"><a data-hearth-link="" href="/rs/issues">"← Issues"</a></nav>
                <h1 class="d-title">$(issue.title.clone())</h1>
                <div class="d-meta">
                    <button @click=$(|_e| issues_table.set(issue.id.clone(), "open", !issue.open))>
                        $(if issue.open { "Close issue" } else { "Reopen issue" })
                    </button>
                    <span class="muted">
                        $(if issue.open { "Open" } else { "Closed" }) " · #" $(issue.short_id)
                    </span>
                </div>
            }
        </article>
        }
        (json_script("hearth-boot", &boot))
    })
}

// ---- generated-style endpoints (P1: a `hearth::routes!(Issues, Users, Labels)` macro)
mod endpoints {
    use hearth::{Table, table::Mutation};
    use hearth::{Result, context::Cx, router::{content::Json, route}};

    use crate::tables::{IssueWire, Issues, LabelWire, Labels, UserWire, Users};

    #[route(GET "/_hearth/issues/load")]
    async fn issues_load(cx: &Cx) -> Result<Json<Vec<IssueWire>>> {
        Ok(Json(Issues::load(cx).await?))
    }
    #[route(POST "/_hearth/issues/mutate")]
    async fn issues_mutate(cx: &Cx, Json(m): Json<Mutation>) -> Result<Json<IssueWire>> {
        Ok(Json(hearth::mutation_route::<Issues>(cx, m).await?))
    }
    #[route(GET "/_hearth/users/load")]
    async fn users_load(cx: &Cx) -> Result<Json<Vec<UserWire>>> {
        Ok(Json(Users::load(cx).await?))
    }
    #[route(GET "/_hearth/labels/load")]
    async fn labels_load(cx: &Cx) -> Result<Json<Vec<LabelWire>>> {
        Ok(Json(Labels::load(cx).await?))
    }
}
