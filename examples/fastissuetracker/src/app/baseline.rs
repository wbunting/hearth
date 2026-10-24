//! Benchmark baseline: the same issue list in *plain Topcoat* (server-
//! authoritative). Filters are signals read by a shard, so each change
//! round-trips to the server, which runs the query in SQL and re-renders the
//! rows. No local database.

use topcoat::{
    Result,
    context::Cx,
    router::page,
    runtime::{Event, Signal, shard, signal},
    view::{View, view},
};

use crate::{auth::viewer, model::Issue, model::User};

#[page("/bench/topcoat")]
async fn baseline_page(cx: &Cx) -> Result<impl View> {
    let me = viewer(cx).await?;
    let text = signal(cx, String::new);
    let open = signal(cx, || true);
    Ok(view! {
        <header class="flex items-center gap-3 border-b border-zinc-200 px-4 py-2">
            <span class="mr-auto font-semibold">"baseline: plain Topcoat (server round trips)"</span>
            <span class="text-zinc-500">(&me.login)</span>
        </header>
        <section class="flex gap-2 border-b border-zinc-200 px-4 py-2">
            <select class="rounded-md border border-zinc-300 px-2 py-1" @change=$(|e: Event| open.set(e.target.value == "open"))>
                <option value="open" selected="">"Open"</option>
                <option value="closed">"Closed"</option>
            </select>
            <input type="search" placeholder="Filter title…" class="w-56 rounded-md border border-zinc-300 px-2 py-1"
                @input=$(|e: Event| text.set(e.target.value))>
        </section>
        issue_rows(text: text.clone(), open: open.clone())
    })
}

#[shard]
async fn issue_rows(cx: &Cx, text: Signal<String>, open: Signal<bool>) -> Result<impl View> {
    let v = viewer(cx).await?;
    let mut db = fastcoat::db(cx);
    let t = text.get();
    let mut filter = Issue::fields().open().eq(open.get());
    if !v.crew {
        filter = filter.and(Issue::fields().visibility().eq("public"));
    }
    if !t.is_empty() {
        filter = filter.and(Issue::fields().title().like_with_escape(fastcoat::sql::contains_pattern(&t), '\\'));
    }
    let issues = Issue::filter(filter).order_by(Issue::fields().modified().desc()).limit(200).exec(&mut db).await?;
    let users: std::collections::HashMap<String, String> =
        User::all().exec(&mut db).await?.into_iter().map(|u| (u.id, u.login)).collect();
    Ok(view! {
        <ul class="divide-y divide-zinc-100" id="bench-rows">
            #[key(i.id.clone())]
            for i in issues {
                <li id=(&i.id) class="grid grid-cols-[1.5rem_4rem_1fr_auto] items-center gap-2 px-4 py-1.5">
                    <span>(if i.open { "○" } else { "●" })</span>
                    <span class="font-mono text-xs text-zinc-500">(i.short_id)</span>
                    <span class="truncate title">(&i.title)</span>
                    <span class="truncate text-right text-zinc-500">(users.get(&i.creator_id).map(String::as_str).unwrap_or("?"))</span>
                </li>
            }
        </ul>
    })
}

/// The React SPA shell (any `/bench/react…` path; client-routed).
#[topcoat::router::route(GET "/bench/react")]
async fn react_shell() -> Result<topcoat::router::content::Html<String>> {
    Ok(topcoat::router::content::Html(react_html()))
}

#[topcoat::router::route(GET "/bench/react/issue/{n}")]
async fn react_shell_issue() -> Result<topcoat::router::content::Html<String>> {
    Ok(topcoat::router::content::Html(react_html()))
}

fn react_html() -> String {
    let index = concat!(env!("CARGO_MANIFEST_DIR"), "/../../benchmarks/localfirst/react/dist/index.html");
    std::fs::read_to_string(index).unwrap_or_else(|_| "<p>run pnpm build in benchmarks/localfirst/react</p>".into())
}
