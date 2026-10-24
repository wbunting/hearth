//! The tracker UI. Pure Rust: every interaction below runs in the browser
//! against the local database (TanStack DB), with optimistic writes
//! validated by the `Table` write functions on the server.
//!
//! - list: `live_query!` + `for issue in $(issues)` (client keyed list)
//! - filters: signals feeding the query (re-runs locally)
//! - routing: `if $(path...)` regions switch list ↔ detail without a request
//! - detail: per-issue queries (comments, labels, reactions) keyed off the route

use hearth::{json_script, live_query, route, table_handle};
use topcoat::{
    Result,
    context::Cx,
    router::page,
    runtime::{Event, signal},
    view::{View, component, view},
};

use crate::{
    auth::viewer,
    tables::{CommentRow, EmojiRow, IssueLabelRow, IssueRow, LabelRow, UserRow, client_schema},
};

/// A list row.
#[hearth::row]
pub struct ListItem {
    pub id: String,
    pub short_id: i64,
    pub title: String,
    pub open: bool,
    pub creator: Option<String>,
    pub assignee: Option<String>,
}

/// The open issue on the detail page.
#[hearth::row]
pub struct DetailItem {
    pub id: String,
    pub short_id: i64,
    pub title: String,
    pub open: bool,
    pub created: i64,
    pub creator_id: String,
    pub creator: Option<String>,
    pub assignee_id: Option<String>,
    pub visibility: String,
}

#[hearth::row]
pub struct CommentItem {
    pub id: String,
    pub body: String,
    pub created: i64,
    pub author: Option<String>,
}

#[hearth::row]
pub struct LabelItem {
    pub id: String,
    pub name: String,
}

#[hearth::row]
pub struct UserItem {
    pub id: String,
    pub login: String,
}

#[hearth::row]
pub struct ReactionItem {
    pub id: String,
    pub value: String,
    pub creator_id: String,
}

#[page("/issues")]
async fn list_page() -> Result<impl View> {
    Ok(view! { tracker() })
}

#[page("/issue/{short_id}")]
async fn detail_page() -> Result<impl View> {
    Ok(view! { tracker() })
}

#[component]
async fn tracker(cx: &Cx) -> Result<impl View> {
    let me = viewer(cx).await?;
    let me_id = me.id.clone();
    let crew = me.crew;

    // ---- browser state
    let show = signal(cx, || "open".to_owned()); // open | closed | all
    let creator = signal(cx, String::new);
    let assignee = signal(cx, String::new);
    let text = signal(cx, String::new);
    let draft = signal(cx, String::new); // new comment

    // ---- route
    let path = route::path(cx);
    let short = route::segment(cx, 1); // /issue/{short}

    // ---- queries (run on the server for the first view, then in the browser)
    let issues = live_query! {
        ListItem from i in IssueRow
        left join c in UserRow on i.creator_id == c.id
        left join a in UserRow on i.assignee_id == a.id
        where (if $(show.get() != "all") { i.open == $(show.get() == "open") })
            && if $(!creator.get().is_empty()) { i.creator_id == $(creator.get()) }
            && if $(!assignee.get().is_empty()) { i.assignee_id == $(assignee.get()) }
            && if $(!text.get().is_empty()) { i.title contains $(text.get()) }
        order by i.modified desc
        limit 200
        select { id: i.id, short_id: i.short_id, title: i.title, open: i.open, creator: c.login, assignee: a.login }
    };
    let people = live_query! {
        UserItem from u in UserRow
        order by u.login
        select { id: u.id, login: u.login }
    };
    let detail = live_query! {
        DetailItem from i in IssueRow
        left join c in UserRow on i.creator_id == c.id
        where i.short_id == $(short.parse_i64().unwrap_or(0i64))
        order by i.id
        limit 1
        select {
            id: i.id, short_id: i.short_id, title: i.title, open: i.open, created: i.created,
            creator_id: i.creator_id, creator: c.login, assignee_id: i.assignee_id, visibility: i.visibility
        }
    };

    let issue_t = table_handle::<IssueRow>();
    let labels_t = table_handle::<IssueLabelRow>();
    let comments_t = table_handle::<CommentRow>();
    let emojis_t = table_handle::<EmojiRow>();

    let boot = serde_json::json!({ "schema": client_schema(me.fingerprint()), "snapshot": {} });

    Ok(view! {
        <div class="min-h-screen">
            <header class="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
                <a class="mr-auto font-semibold tracking-tight" data-hearth-link="" href="/issues">"hearth tracker"</a>
                <span class="text-zinc-500">(&me.login) if crew { " · crew" }</span>
                <form method="post" action="/logout"><button class="rounded-md border border-zinc-300 px-2 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900">"Sign out"</button></form>
            </header>

            // ================================================= list
            if $(path.starts_with("/issues")) {
                <section class="flex flex-wrap items-center gap-2 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
                    <select class="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700" @change=$(|e: Event| show.set(e.target.value))>
                        <option value="open" selected="">"Open"</option>
                        <option value="closed">"Closed"</option>
                        <option value="all">"All"</option>
                    </select>
                    <select class="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700" @change=$(|e: Event| creator.set(e.target.value))>
                        <option value="">"Any creator"</option>
                        for u in $(people) { <option :value=$(u.id.clone())>$(u.login.clone())</option> }
                    </select>
                    <select class="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700" @change=$(|e: Event| assignee.set(e.target.value))>
                        <option value="">"Any assignee"</option>
                        for u in $(people) { <option :value=$(u.id.clone())>$(u.login.clone())</option> }
                    </select>
                    <input type="search" placeholder="Filter title…" class="w-56 rounded-md border border-zinc-300 bg-transparent px-2 py-1 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700" @input=$(|e: Event| text.set(e.target.value))>
                </section>
                <ul class="divide-y divide-zinc-100 dark:divide-zinc-900">
                    for issue in $(issues) {
                        <li class="grid grid-cols-[1.5rem_4rem_1fr_auto] items-center gap-2 px-4 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
                            // A class computed in the browser: both literals are in the source,
                            // so Tailwind generates them; the binding swaps them locally.
                            <button title="Close / reopen"
                                :class=$(if issue.open { "cursor-pointer text-indigo-600 hover:scale-110" } else { "cursor-pointer text-zinc-400 hover:scale-110" })
                                @click=$(|_e| issue_t.set(issue.id.clone(), "open", !issue.open))>
                                $(if issue.open { "○" } else { "●" })
                            </button>
                            <a class="font-mono text-xs text-zinc-500" data-hearth-link="" :href=$("/issue/".to_owned() + issue.short_id.to_text())>$(issue.short_id)</a>
                            <a class="truncate hover:underline" data-hearth-link="" :href=$("/issue/".to_owned() + issue.short_id.to_text())>$(issue.title.clone())</a>
                            <span class="truncate text-right text-zinc-500">
                                $(issue.creator.clone().unwrap_or("?".to_owned()))
                                $(if issue.assignee.is_some() { " → ".to_owned() } else { "".to_owned() })
                                $(issue.assignee.clone().unwrap_or("".to_owned()))
                            </span>
                        </li>
                    }
                </ul>
            }

            // ================================================= detail
            if $(path.starts_with("/issue/")) {
                <article class="mx-auto max-w-3xl px-6 pt-4 pb-20">
                    for issue in $(detail) {
                        <nav class="flex items-center gap-2 text-xs">
                            <a class="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" data-hearth-link="" href="/issues">"← Issues"</a>
                            <span class="font-mono text-zinc-400">" #" $(issue.short_id)</span>
                        </nav>
                        <h1 class="mt-3 mb-2 text-2xl font-semibold tracking-tight">$(issue.title.clone())</h1>
                        <div class="mb-4 flex flex-wrap items-center gap-2">
                            <button class="rounded-md bg-indigo-600 px-3 py-1 font-medium text-white hover:bg-indigo-500"
                                @click=$(|_e| issue_t.set(issue.id.clone(), "open", !issue.open))>
                                $(if issue.open { "Close issue" } else { "Reopen issue" })
                            </button>
                            <span class="text-zinc-500">
                                $(if issue.open { "Open" } else { "Closed" }) " · by "
                                $(issue.creator.clone().unwrap_or("?".to_owned()))
                            </span>
                            if $(issue.visibility == "internal") { <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">"internal"</span> }
                            <label class="ml-auto text-zinc-500">"Assignee "
                                <select class="ml-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100" @change=$(|e: Event| issue_t.set(issue.id.clone(), "assigneeId", e.target.value))>
                                    <option value="">"Unassigned"</option>
                                    for u in $(people) {
                                        <option :value=$(u.id.clone())
                                            :selected=$(issue.assignee_id.clone().unwrap_or("".to_owned()) == u.id)>
                                            $(u.login.clone())
                                        </option>
                                    }
                                </select>
                            </label>
                        </div>
                        issue_labels(issue_id: $(issue.id.clone()), labels_t: labels_t.clone())
                        reactions(subject: $(issue.id.clone()), me: me_id.clone(), emojis_t: emojis_t.clone())
                        comments(issue_id: $(issue.id.clone()), me: me_id.clone(), comments_t: comments_t.clone(), emojis_t: emojis_t.clone(), draft: draft.clone())
                    }
                </article>
            }
        </div>
        (json_script("hearth-boot", &boot))
    })
}


// ------------------------------------------------------------- detail parts

/// Labels on an issue: chips you can toggle (membership rows).
#[component]
async fn issue_labels( issue_id: topcoat::runtime::Expr<String>, labels_t: topcoat::runtime::Expr<hearth::mutate::TableHandle<IssueLabelRow>>) -> Result<impl View> {
    let all = live_query! {
        LabelItem from l in LabelRow
        order by l.name
        select { id: l.id, name: l.name }
    };
    let on = live_query! {
        LabelItem from il in IssueLabelRow
        inner join l in LabelRow on il.label_id == l.id
        where il.issue_id == $(issue_id.clone())
        order by l.name
        select { id: l.id, name: l.name }
    };
    Ok(view! {
        <div class="flex flex-wrap items-center gap-1">
            for l in $(on) {
                <button class="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white hover:bg-indigo-500" title="Remove label"
                    @click=$(|_e| labels_t.remove(l.id.clone() + ":" + issue_id.clone()))>
                    $(l.name.clone())
                </button>
            }
            <details class="relative">
                <summary class="cursor-pointer list-none rounded-full border border-dashed border-zinc-300 px-2 py-0.5 text-xs text-zinc-500 hover:border-indigo-400 dark:border-zinc-700">"+ label"</summary>
                <div class="absolute z-20 mt-1 flex w-72 flex-wrap gap-1 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                    for l in $(all) {
                        <button class="rounded-full border border-zinc-200 px-2 py-0.5 text-xs hover:border-indigo-400 dark:border-zinc-700"
                            @click=$(|_e| labels_t.insert2("labelId", l.id.clone(), "issueId", issue_id.clone()))>
                            $(l.name.clone())
                        </button>
                    }
                </div>
            </details>
        </div>
    })
}

/// Reaction bar for an issue or comment.
#[component]
async fn reactions( subject: topcoat::runtime::Expr<String>, me: String, emojis_t: topcoat::runtime::Expr<hearth::mutate::TableHandle<EmojiRow>>) -> Result<impl View> {
    let mine = live_query! {
        ReactionItem from e in EmojiRow
        where e.subject_id == $(subject.clone()) && e.creator_id == $(me.clone())
        order by e.value
        select { id: e.id, value: e.value, creator_id: e.creator_id }
    };
    let all = live_query! {
        ReactionItem from e in EmojiRow
        where e.subject_id == $(subject.clone())
        order by e.created
        select { id: e.id, value: e.value, creator_id: e.creator_id }
    };
    Ok(view! {
        <div class="mt-2 flex flex-wrap items-center gap-1">
            for e in $(all) { <span class="text-base">$(e.value.clone())</span> }
            for v in ["👍", "🎉", "❤️", "👀", "🚀"] {
                <button class="rounded-full border border-zinc-200 px-1.5 text-sm opacity-60 hover:opacity-100 hover:border-indigo-400 dark:border-zinc-700" title="React"
                    @click=$(|_e| emojis_t.toggle3(subject.clone() + ":" + me.clone() + ":" + v,
                        "value", v, "subjectId", subject.clone(), "creatorId", me.clone()))>
                    (v)
                </button>
            }
            <span class="ml-1 text-xs text-zinc-400">for e in $(mine) { $(e.value.clone()) }</span>
        </div>
    })
}

/// Comments with their own reactions, and an optimistic composer.
#[component]
async fn comments(

    issue_id: topcoat::runtime::Expr<String>,
    me: String,
    comments_t: topcoat::runtime::Expr<hearth::mutate::TableHandle<CommentRow>>,
    emojis_t: topcoat::runtime::Expr<hearth::mutate::TableHandle<EmojiRow>>,
    draft: topcoat::runtime::Signal<String>,
) -> Result<impl View> {
    let list = live_query! {
        CommentItem from c in CommentRow
        left join u in UserRow on c.creator_id == u.id
        where c.issue_id == $(issue_id.clone())
        order by c.created
        select { id: c.id, body: c.body, created: c.created, author: u.login }
    };
    Ok(view! {
        <h2 class="mt-8 mb-3 text-lg font-semibold">"Comments"</h2>
        <ul class="grid gap-3">
            for c in $(list) {
                <li class="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <div class="mb-1 text-xs"><strong>$(c.author.clone().unwrap_or("?".to_owned()))</strong></div>
                    <div class="whitespace-pre-wrap break-words">$(c.body.clone())</div>
                    reactions(subject: $(c.id.clone()), me: me.clone(), emojis_t: emojis_t.clone())
                </li>
            }
        </ul>
        <form class="mt-4 grid gap-2" @submit=$(|e: Event| {
            e.prevent_default();
            if !draft.get().trim().is_empty() {
                comments_t.insert4("issueId", issue_id.clone(), "body", draft.get(), "creatorId", me.clone(), "created", 0i64);
                draft.set("".to_owned());
            }
        })>
            <textarea class="min-h-20 w-full rounded-lg border border-zinc-300 bg-transparent p-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700" placeholder="Leave a comment…" :value=$(draft.get()) @input=$(|e: Event| draft.set(e.target.value))></textarea>
            <button class="justify-self-start rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500">"Comment"</button>
        </form>
    })
}
