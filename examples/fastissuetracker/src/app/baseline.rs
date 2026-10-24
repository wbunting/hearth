//! Benchmark baselines: the same issue tracker as `/issues`, built two
//! other ways, doing the same work (same data, UI, classes and writes).
//!
//! - `/bench/topcoat`: *plain Topcoat*, server-authoritative. Filters are
//!   signals read by a shard, so each change round-trips to the server,
//!   which runs SQL and re-renders. Navigation uses `runtime::link`
//!   (server-rendered page, prefetch on intent). Writes are procedures; the
//!   affected shard re-renders after they return (no optimistic updates).
//! - `/bench/react`: React 19 + TanStack DB SPA (benchmarks/localfirst/react).

use std::collections::HashMap;

use topcoat::{
    Result,
    context::Cx,
    router::{error::RouterErrorExt, href, page, path_param},
    runtime::{Event, Signal, link_attrs, prefetch_mode, procedure, shard, signal},
    view::{View, component, view},
};

use crate::{
    auth::viewer,
    model::{Comment, Emoji, Issue, IssueLabel, Label, User},
};

// ---------------------------------------------------------------- shell

#[component]
async fn header(cx: &Cx) -> Result<impl View> {
    let me = viewer(cx).await?;
    Ok(view! {
        <header class="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
            <a class="mr-auto font-semibold tracking-tight" (nav(cx, href!(list_page)))>"fastissuetracker"</a>
            <span class="text-zinc-500">(me.login) " · plain topcoat"</span>
        </header>
    })
}

/// `runtime::link` behaviour on our own `<a>` (server-rendered navigation).
fn nav(cx: &Cx, href: impl topcoat::view::AttributeValueViewParts) -> topcoat::view::Attributes {
    link_attrs(cx, href, prefetch_mode(cx))
}

async fn people(cx: &Cx) -> Result<Vec<User>> {
    let mut users = User::all().exec(&mut fastcoat::db(cx)).await?;
    users.sort_by(|a, b| a.login.cmp(&b.login));
    Ok(users)
}

// ---------------------------------------------------------------- list

#[page("/bench/topcoat")]
async fn list_page(cx: &Cx) -> Result<impl View> {
    let show = signal(cx, || "open".to_owned());
    let creator = signal(cx, String::new);
    let assignee = signal(cx, String::new);
    let text = signal(cx, String::new);
    let users = people(cx).await?;
    Ok(view! {
        <div class="min-h-screen">
            header()
            <section class="flex flex-wrap items-center gap-2 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
                <select class="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700" @change=$(|e: Event| show.set(e.target.value))>
                    <option value="open" selected="">"Open"</option>
                    <option value="closed">"Closed"</option>
                    <option value="all">"All"</option>
                </select>
                <select class="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700" @change=$(|e: Event| creator.set(e.target.value))>
                    <option value="">"Any creator"</option>
                    for u in &users { <option value=(&u.id)>(&u.login)</option> }
                </select>
                <select class="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700" @change=$(|e: Event| assignee.set(e.target.value))>
                    <option value="">"Any assignee"</option>
                    for u in &users { <option value=(&u.id)>(&u.login)</option> }
                </select>
                <input type="search" placeholder="Filter title…" class="w-56 rounded-md border border-zinc-300 bg-transparent px-2 py-1 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700"
                    @input=$(|e: Event| text.set(e.target.value))>
            </section>
            issue_rows(show: show.clone(), creator: creator.clone(), assignee: assignee.clone(), text: text.clone())
        </div>
    })
}

#[shard]
async fn issue_rows(cx: &Cx, show: Signal<String>, creator: Signal<String>, assignee: Signal<String>, text: Signal<String>) -> Result<impl View> {
    let v = viewer(cx).await?;
    let mut db = fastcoat::db(cx);
    let mut filter: Option<toasty::stmt::Expr<bool>> = None;
    let mut and = |e: toasty::stmt::Expr<bool>| filter = Some(match filter.take() { Some(f) => f.and(e), None => e });
    match show.get().as_str() {
        "open" => and(Issue::fields().open().eq(true)),
        "closed" => and(Issue::fields().open().eq(false)),
        _ => {}
    }
    if !creator.get().is_empty() {
        and(Issue::fields().creator_id().eq(creator.get()));
    }
    if !assignee.get().is_empty() {
        and(Issue::fields().assignee_id().eq(assignee.get()));
    }
    if !v.crew {
        and(Issue::fields().visibility().eq("public"));
    }
    let t = text.get();
    if !t.is_empty() {
        and(Issue::fields().title().like_with_escape(fastcoat::sql::contains_pattern(&t), '\\'));
    }
    let q = match filter {
        Some(f) => Issue::filter(f),
        None => Issue::all(),
    };
    let issues = q.order_by(Issue::fields().modified().desc()).limit(200).exec(&mut db).await?;
    let users: HashMap<String, String> = User::all().exec(&mut db).await?.into_iter().map(|u| (u.id, u.login)).collect();
    Ok(view! {
        <ul class="divide-y divide-zinc-100 dark:divide-zinc-900" id="bench-rows">
            #[key(i.id.clone())]
            for i in issues {
                let id = i.id.clone();
                let open = i.open;
                <li id=(&i.id) class="grid grid-cols-[1.5rem_4rem_1fr_auto] items-center gap-2 px-4 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
                    <button title="Close / reopen"
                        class=(if i.open { "cursor-pointer text-indigo-600 hover:scale-110" } else { "cursor-pointer text-zinc-400 hover:scale-110" })
                        @click=$(async |_e| { set_open(id.clone(), !open).await; show.set(show.get()); })>
                        (if i.open { "○" } else { "●" })
                    </button>
                    <a class="font-mono text-xs text-zinc-500" (nav(cx, href!(detail_page, ShortId(i.short_id))))>(i.short_id)</a>
                    <a class="truncate hover:underline" (nav(cx, href!(detail_page, ShortId(i.short_id))))>(&i.title)</a>
                    <span class="truncate text-right text-zinc-500">
                        (users.get(&i.creator_id).map(String::as_str).unwrap_or("?"))
                        if let Some(a) = i.assignee_id.as_ref().and_then(|a| users.get(a)) { " → " (a) }
                    </span>
                </li>
            }
        </ul>
    })
}

// ---------------------------------------------------------------- detail

path_param!(short_id: i64);

#[page("/bench/topcoat/issue/{short_id}")]
async fn detail_page(cx: &Cx) -> Result<impl View> {
    let short = *path_param::<ShortId>(cx).ok_or_not_found()?;
    Ok(view! {
        <div class="min-h-screen">
            header()
            issue_detail(short_id: short)
        </div>
    })
}

#[shard]
async fn issue_detail(cx: &Cx, short_id: i64) -> Result<impl View> {
    let me = viewer(cx).await?;
    let mut db = fastcoat::db(cx);
    let issue = Issue::filter_by_short_id(short_id).first().exec(&mut db).await?.ok_or_not_found()?;
    if !me.can_see(&issue.visibility) {
        return Err(topcoat::router::error::forbidden().into());
    }
    // Re-render trigger after writes (procedures don't re-render by themselves).
    let rev = signal(cx, || 0i64);
    let _ = rev.get();
    let users = people(cx).await?;
    let login: HashMap<String, String> = users.iter().map(|u| (u.id.clone(), u.login.clone())).collect();
    let mut all_labels = Label::all().exec(&mut db).await?;
    all_labels.sort_by(|a, b| a.name.cmp(&b.name));
    let on: Vec<String> = IssueLabel::filter_by_issue_id(issue.id.clone()).exec(&mut db).await?.into_iter().map(|l| l.label_id).collect();
    let mut on_labels: Vec<Label> = all_labels.iter().filter(|l| on.contains(&l.id)).cloned().collect();
    on_labels.sort_by(|a, b| a.name.cmp(&b.name));
    let mut comments = Comment::filter_by_issue_id(issue.id.clone()).exec(&mut db).await?;
    comments.sort_by_key(|c| c.created);
    let mut subjects = vec![issue.id.clone()];
    subjects.extend(comments.iter().map(|c| c.id.clone()));
    let mut reactions: HashMap<String, Vec<Emoji>> = HashMap::new();
    for s in &subjects {
        let mut es = Emoji::filter_by_subject_id(s.clone()).exec(&mut db).await?;
        es.sort_by_key(|e| e.created);
        reactions.insert(s.clone(), es);
    }
    let issue_id = issue.id.clone();
    let is_open = issue.open;
    let me_id = me.id.clone();
    let draft = signal(cx, String::new);
    Ok(view! {
        <article class="mx-auto max-w-3xl px-6 pt-4 pb-20">
            <nav class="flex items-center gap-2 text-xs">
                <a class="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" (nav(cx, href!(list_page)))>"← Issues"</a>
                <span class="font-mono text-zinc-400">" #" (issue.short_id)</span>
            </nav>
            <h1 class="mt-3 mb-2 text-2xl font-semibold tracking-tight">(&issue.title)</h1>
            <div class="mb-4 flex flex-wrap items-center gap-2">
                <button class="rounded-md bg-indigo-600 px-3 py-1 font-medium text-white hover:bg-indigo-500"
                    @click=$(async |_e| { set_open(issue_id.clone(), !is_open).await; rev.set(rev.get() + 1i64); })>
                    (if issue.open { "Close issue" } else { "Reopen issue" })
                </button>
                <span class="text-zinc-500">
                    (if issue.open { "Open" } else { "Closed" }) " · by " (login.get(&issue.creator_id).map(String::as_str).unwrap_or("?"))
                </span>
                if issue.visibility == "internal" { <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">"internal"</span> }
                <label class="ml-auto text-zinc-500">"Assignee "
                    <select class="ml-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
                        @change=$(async |e: Event| { set_assignee(issue_id.clone(), e.target.value).await; rev.set(rev.get() + 1i64); })>
                        <option value="">"Unassigned"</option>
                        for u in &users {
                            <option value=(&u.id) selected=(issue.assignee_id.as_deref() == Some(u.id.as_str()))>(&u.login)</option>
                        }
                    </select>
                </label>
            </div>
            <div class="flex flex-wrap items-center gap-1">
                for l in &on_labels {
                    let lid = l.id.clone();
                    <button class="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white hover:bg-indigo-500" title="Remove label"
                        @click=$(async |_e| { set_label(issue_id.clone(), lid.clone(), false).await; rev.set(rev.get() + 1i64); })>
                        (&l.name)
                    </button>
                }
                <details class="relative">
                    <summary class="cursor-pointer list-none rounded-full border border-dashed border-zinc-300 px-2 py-0.5 text-xs text-zinc-500 hover:border-indigo-400 dark:border-zinc-700">"+ label"</summary>
                    <div class="absolute z-20 mt-1 flex w-72 flex-wrap gap-1 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                        for l in &all_labels {
                            let lid = l.id.clone();
                            <button class="rounded-full border border-zinc-200 px-2 py-0.5 text-xs hover:border-indigo-400 dark:border-zinc-700"
                                @click=$(async |_e| { set_label(issue_id.clone(), lid.clone(), true).await; rev.set(rev.get() + 1i64); })>
                                (&l.name)
                            </button>
                        }
                    </div>
                </details>
            </div>
            reaction_bar(subject: issue.id.clone(), es: reactions.get(&issue.id).cloned().unwrap_or_default(), me: me_id.clone(), rev: rev.clone())
            <h2 class="mt-8 mb-3 text-lg font-semibold">"Comments"</h2>
            <ul class="grid gap-3">
                for c in &comments {
                    <li id=(&c.id) class="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                        <div class="mb-1 text-xs"><strong>(login.get(&c.creator_id).map(String::as_str).unwrap_or("?"))</strong></div>
                        <div class="whitespace-pre-wrap break-words">(&c.body)</div>
                        reaction_bar(subject: c.id.clone(), es: reactions.get(&c.id).cloned().unwrap_or_default(), me: me_id.clone(), rev: rev.clone())
                    </li>
                }
            </ul>
            <form class="mt-4 grid gap-2" @submit=$(async |e: Event| {
                e.prevent_default();
                if !draft.get().trim().is_empty() {
                    add_comment(issue_id.clone(), draft.get()).await;
                    draft.set("".to_owned());
                    rev.set(rev.get() + 1i64);
                }
            })>
                <textarea class="min-h-20 w-full rounded-lg border border-zinc-300 bg-transparent p-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700" placeholder="Leave a comment…"
                    :value=$(draft.get()) @input=$(|e: Event| draft.set(e.target.value))></textarea>
                <button class="justify-self-start rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500">"Comment"</button>
            </form>
        </article>
    })
}

#[component]
async fn reaction_bar(subject: String, es: Vec<Emoji>, me: String, rev: Signal<i64>) -> Result<impl View> {
    let mut mine: Vec<String> = es.iter().filter(|e| e.creator_id == me).map(|e| e.value.clone()).collect();
    mine.sort();
    Ok(view! {
        <div class="mt-2 flex flex-wrap items-center gap-1">
            for e in &es { <span class="text-base">(&e.value)</span> }
            for v in ["👍", "🎉", "❤️", "👀", "🚀"] {
                <button class="rounded-full border border-zinc-200 px-1.5 text-sm opacity-60 hover:opacity-100 hover:border-indigo-400 dark:border-zinc-700" title="React"
                    @click=$(async |_e| { toggle_reaction(subject.clone(), v.to_owned()).await; rev.set(rev.get() + 1i64); })>
                    (v)
                </button>
            }
            <span class="ml-1 text-xs text-zinc-400">(mine.concat())</span>
        </div>
    })
}

// ---------------------------------------------------------------- writes
// Same authorization as the synced tables (they share the helpers).

#[procedure]
async fn set_open(cx: &Cx, id: String, open: bool) -> Result<()> {
    crate::tables::write_issue(cx, id, Some(open), None).await
}

#[procedure]
async fn set_assignee(cx: &Cx, id: String, assignee: String) -> Result<()> {
    crate::tables::write_issue(cx, id, None, Some(assignee)).await
}

#[procedure]
async fn set_label(cx: &Cx, issue_id: String, label_id: String, on: bool) -> Result<()> {
    crate::tables::write_label(cx, issue_id, label_id, on).await
}

#[procedure]
async fn toggle_reaction(cx: &Cx, subject: String, value: String) -> Result<()> {
    crate::tables::toggle_reaction(cx, subject, value).await
}

#[procedure]
async fn add_comment(cx: &Cx, issue_id: String, body: String) -> Result<()> {
    crate::tables::write_comment(cx, issue_id, body).await
}

// ---------------------------------------------------------------- react

/// The React SPA shell (any `/bench/react…` path; client-routed). Same
/// Tailwind stylesheet as the fastcoat app; the signed-in user id is the
/// only data inlined (React fetches everything else after boot).
#[topcoat::router::route(GET "/bench/react")]
async fn react_shell(cx: &Cx) -> Result<topcoat::router::content::Html<String>> {
    Ok(topcoat::router::content::Html(react_html(cx).await?))
}

#[topcoat::router::route(GET "/bench/react/issue/{n}")]
async fn react_shell_issue(cx: &Cx) -> Result<topcoat::router::content::Html<String>> {
    Ok(topcoat::router::content::Html(react_html(cx).await?))
}

async fn react_html(cx: &Cx) -> Result<String> {
    let me = viewer(cx).await?;
    let index = concat!(env!("CARGO_MANIFEST_DIR"), "/../../benchmarks/localfirst/react/dist/index.html");
    let html = std::fs::read_to_string(index).unwrap_or_else(|_| "<p>run pnpm build in benchmarks/localfirst/react</p>".into());
    let head = format!(
        r#"<link rel="stylesheet" href="{}"><script>window.__me={}</script>"#,
        crate::app::tailwind_url(cx),
        serde_json::json!({ "id": me.id }),
    );
    Ok(html.replace("<!--head-->", &head))
}
