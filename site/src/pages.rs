use hearth::{
    Result,
    asset::{Asset, asset},
    context::Cx,
    router::page,
    runtime::{Event, signal},
    view::{View, component, view},
};

use crate::demo::{self, IssueRow};

const CSS: Asset = asset!("../assets/site.css");
const LOGO: Asset = asset!("../assets/logo.svg");
const ICON: Asset = asset!("../assets/favicon.svg");
const FONT: hearth::font::Font = hearth::font::font! {
    "Manrope",
    @font-face {
        src: url(asset!("../assets/manrope.ttf")) format("truetype");
        font-weight: 200 800;
        font-display: swap;
    }
};
const POLICY: &str = "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'";

#[hearth::row]
pub struct DemoItem {
    pub id: String,
    pub title: String,
    pub open: bool,
}

#[page("/")]
async fn home(cx: &Cx) -> Result<impl View> {
    let owner = demo::seed(cx).await?;
    let scoped = cx.with(demo::Viewer(owner.clone()));
    let cx = &scoped;
    Ok(view! {
        cx =>
        ((
            hearth::router::header::CONTENT_SECURITY_POLICY,
            hearth::router::HeaderValue::from_static(POLICY),
        ))
        ((
            hearth::router::header::CACHE_CONTROL,
            hearth::router::HeaderValue::from_static("no-store"),
        ))
        shell(
            title: "Live demo - Hearth",
            <main id="main" class="demo-page wrap">
                <div class="demo-intro">
                    <h1>"A live Hearth app."</h1>
                    <p>
                        "This issue tracker is written in Rust. Filtering runs on rows already in your browser. Ticking an issue updates the list right away; then the server checks the write and rolls it back if it is rejected."
                    </p>
                </div>
                workbench(owner: owner)
                <p class="bench-caption">
                    "Sample data that only you see. It resets when the server restarts."
                </p>
            </main>
        )
    })
}

/// Hosts allowed to frame `/embed`. The static site at usehearth.dev embeds
/// the workbench; override with `HEARTH_EMBED_ANCESTORS` for previews.
fn embed_policy() -> hearth::router::HeaderValue {
    static VALUE: std::sync::LazyLock<String> = std::sync::LazyLock::new(|| {
        let ancestors = std::env::var("HEARTH_EMBED_ANCESTORS")
            .unwrap_or_else(|_| "https://usehearth.dev".to_owned());
        POLICY.replace(
            "frame-ancestors 'none'",
            &format!("frame-ancestors {ancestors}"),
        )
    });
    hearth::router::HeaderValue::from_str(&VALUE)
        .unwrap_or_else(|_| hearth::router::HeaderValue::from_static(POLICY))
}

#[page("/embed")]
async fn embed(cx: &Cx) -> Result<impl View> {
    let owner = demo::seed(cx).await?;
    let scoped = cx.with(demo::Viewer(owner.clone()));
    let cx = &scoped;
    Ok(view! {
        cx =>
        ((hearth::router::header::CONTENT_SECURITY_POLICY, embed_policy()))
        ((
            hearth::router::header::CACHE_CONTROL,
            hearth::router::HeaderValue::from_static("no-store"),
        ))
        <!DOCTYPE html>
        <html lang="en" class="embedded">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta name="robots" content="noindex">
                <title>"Live demo - Hearth"</title>
                hearth::font::link(font: FONT)
                <link rel="stylesheet" href=(CSS)>
                hearth::runtime::script()
            </head>
            <body>
                <main id="main">workbench(owner: owner)</main>
            </body>
        </html>
    })
}

#[component]
async fn workbench(cx: &Cx, owner: String) -> Result<impl View> {
    let search = signal(cx, String::new);
    let status = signal(cx, || "all".to_owned());
    let tab = signal(cx, || "query".to_owned());
    let issues = hearth::live_query! {
        DemoItem from i in IssueRow
        where (if $(!search.get().is_empty()) { i.title contains $(search.get()) })
            && if $(status.get() != "all") { i.open == $(status.get() == "open") }
        order by i.position
        select { id: i.id, title: i.title, open: i.open }
    };
    let table = hearth::table_handle::<IssueRow>();
    let boot = serde_json::json!({ "schema": demo::client_schema(format!("site:{owner}")), "snapshot": {} });
    Ok(view! {
        <div class="bench">
            <div class="code-side">
                <div class="code-toolbar">
                    <div role="group" aria-label="Example source">
                        <button
                            :aria-pressed=$(tab.get() == "query")
                            @click=$(|_e| tab.set("query".to_owned()))
                        >
                            "query.rs"
                        </button>
                        <button
                            :aria-pressed=$(tab.get() == "view")
                            @click=$(|_e| tab.set("view".to_owned()))
                        >
                            "view.rs"
                        </button>
                    </div>
                    <span>"Rust"</span>
                </div>
                if $(tab.get() == "query") {
                    <pre class="source" aria-label="Rust query source">
                        <code>
                            <span class="syntax-muted">
                                "// Query excerpt. Server and browser.\n"
                            </span>
                            <span class="syntax-accent">"let "</span>
                            "issues = "
                            <span class="syntax-gold">"live_query! "</span>
                            "{\n    DemoItem from i in IssueRow\n    where if "
                            <span class="syntax-gold">
                                "$(!search.get().is_empty())"
                            </span>
                            " {\n        i.title contains "
                            <span class="syntax-gold">"$(search.get())"</span>
                            "\n    }\n    order by i.position\n    select {\n        id: i.id,\n        title: i.title,\n        open: i.open\n    }\n};"
                        </code>
                    </pre>
                }
                if $(tab.get() == "view") {
                    <pre class="source" aria-label="Rust view source">
                        <code>
                            <span class="syntax-gold">"view! "</span>
                            "{\n    <ul>\n        for issue in "
                            <span class="syntax-gold">"$(issues)"</span>
                            " {\n            <li>\n                <button @click=$(|_e| {\n                    table.set(\n                        issue.id.clone(),\n                        \"open\", !issue.open\n                    )\n                })>\n                    $(issue.title.clone())\n                </button>\n            </li>\n        }\n    </ul>\n}"
                        </code>
                    </pre>
                }
                <div class="code-foot">
                    "Simplified excerpts. "
                    <a
                        href="https://github.com/wbunting/hearth/blob/main/site/src/pages.rs"
                        target="_blank"
                        rel="noopener"
                    >
                        "Full source on GitHub"
                    </a>
                </div>
            </div>
            <div class="demo-side">
                <div class="demo-toolbar">
                    <span class="demo-title">"A little issue tracker"</span>
                    <span class="local-indicator">"Local query"</span>
                </div>
                <div class="demo-filters">
                    <label class="search">
                        <svg
                            viewBox="0 0 24 24"
                            width="17"
                            height="17"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.6"
                            aria-hidden="true"
                        >
                            <circle cx="10.5" cy="10.5" r="6.5"></circle>
                            <path d="m16 16 4 4"></path>
                        </svg>
                        <input
                            type="search"
                            placeholder="Filter these issues..."
                            aria-label="Filter issues"
                            :value=$(search.get())
                            @input=$(|e: Event| search.set(e.target.value))
                        >
                    </label>
                    <label class="sr-only" for="status">"Issue status"</label>
                    <select
                        id="status"
                        aria-label="Issue status"
                        @change=$(|e: Event| status.set(e.target.value))
                    >
                        <option value="all">"All issues"</option>
                        <option value="open">"Open"</option>
                        <option value="closed">"Completed"</option>
                    </select>
                </div>
                <ul class="demo-list" aria-label="Demo issues">
                    for issue in $(issues) {
                        <li
                            :class=$(
                                if issue.open { "issue" } else { "issue completed" }
                            )
                        >
                            <button
                                class="issue-check"
                                :aria-label=$(issue.title.clone())
                                :aria-pressed=$(!issue.open)
                                @click=$(
                                    |_e| table.set(issue.id.clone(), "open", !issue.open)
                                )
                            >
                                <svg
                                    viewBox="0 0 20 20"
                                    width="18"
                                    height="18"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    aria-hidden="true"
                                >
                                    <path d="m4 10 4 4 8-8"></path>
                                </svg>
                            </button>
                            <span>$(issue.title.clone())</span>
                        </li>
                    }
                </ul>
                <p class="empty-state">"No matches. Try a different filter."</p>
                <div class="demo-foot">
                    <span>"Try a filter. Tick a row."</span>
                    <span>"Built with hearth"</span>
                </div>
            </div>
        </div>
        (hearth::json_script("hearth-boot", &boot))
    })
}

#[component]
async fn shell(title: &str, #[default] child: hearth::view::Child<'_>) -> Result<impl View> {
    Ok(view! {
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta
                    name="description"
                    content="Hearth is an experimental local-first web framework for Rust. Server-rendered pages, reactive browser queries and optimistic writes, from one Rust application."
                >
                <title>(title)</title>
                <link rel="icon" href=(ICON)>
                hearth::font::link(font: FONT)
                <link rel="stylesheet" href=(CSS)>
                hearth::runtime::script()
            </head>
            <body>
                <a class="skip" href="#main">"Skip to content"</a>
                <header class="site-header wrap">
                    <a href="https://usehearth.dev/" aria-label="Hearth home">
                        <img src=(LOGO) alt="hearth" width="142" height="48">
                    </a>
                    <nav aria-label="Main navigation">
                        <a href="https://usehearth.dev/docs/getting-started/">"Get started"</a>
                        <a href="https://usehearth.dev/docs/">"Docs"</a>
                        <a href="https://github.com/wbunting/hearth">"GitHub"</a>
                    </nav>
                </header>
                (child)
            </body>
        </html>
    })
}

#[cfg(test)]
mod tests {
    #[test]
    fn only_the_embed_policy_allows_framing() {
        assert!(super::POLICY.contains("frame-ancestors 'none'"));
        let embed = super::embed_policy();
        let embed = embed.to_str().unwrap();
        assert!(!embed.contains("frame-ancestors 'none'"));
        assert!(embed.contains("frame-ancestors http"));
        assert!(embed.contains("script-src 'self'"));
    }
}
