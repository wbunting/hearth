use hearth::{
    Result,
    asset::{Asset, asset},
    context::Cx,
    router::{href, page},
    runtime::{Event, signal},
    view::{View, component, view},
};

use crate::demo::{self, IssueRow};

const CSS: Asset = asset!("../assets/site.css");
const LOGO: Asset = asset!("../assets/logo.svg");
const MARK: Asset = asset!("../assets/mark.svg");
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
            title: "hearth - Local-first web apps. Written in Rust.",
            <main id="main">
                <section class="hero wrap">
                    <h1>
                        "Close to your data."
                        <br>
                        <span>"Entirely in Rust."</span>
                    </h1>
                    <div class="hero-bottom">
                        <p>
                            "A local-first web framework. Render on the server. Query in the browser. Write your app in one language."
                        </p>
                        <div class="actions">
                            <a class="button primary" href="#start">
                                "Start building"
                                <span aria-hidden="true">"↗"</span>
                            </a>
                            <a class="text-link" href="#workbench">
                                "Try it below"
                                <span aria-hidden="true">"↓"</span>
                            </a>
                        </div>
                    </div>
                </section>
                <section
                    id="workbench"
                    class="workbench wrap"
                    aria-label="Interactive Hearth example"
                >
                    <div class="bench-heading">
                        <h2>"Rust in. A living interface out."</h2>
                        <p>"Real queries. Real writes. No app JavaScript."</p>
                    </div>
                    workbench(owner: owner)
                    <p class="bench-caption">
                        "Illustrative data, isolated to this browser. Filter locally; toggle a row to make an optimistic write, validated by the Rust server."
                    </p>
                </section>
                <section id="how" class="architecture wrap">
                    <h2>
                        "The first view comes from the server."
                        <br>
                        <span>"The next move is yours."</span>
                    </h2>
                    <div class="flow">
                        <article>
                            <h3>"One source of truth."</h3>
                            <p>
                                "Declare a table, authorize its rows, and write a query. Hearth uses that query for the initial render and the browser's live results."
                            </p>
                            <code>
                                "#[derive(Table)]"
                                <br>
                                "live_query! { ... }"
                            </code>
                        </article>
                        <article>
                            <h3>"HTML, already useful."</h3>
                            <p>
                                "The server sends rendered content. Client expressions compile to small JavaScript modules. No client-side Rust or WebAssembly download."
                            </p>
                            <code>"Rust → HTML + JavaScript"</code>
                        </article>
                        <article>
                            <h3>"Keep the data close."</h3>
                            <p>
                                "Indexed queries run against local tables. Writes update the interface immediately, then the server validates them. Rejected writes roll back."
                            </p>
                            <code>"local query → update → sync"</code>
                        </article>
                    </div>
                </section>
                <section class="principles wrap" id="framework">
                    <div>
                        <img src=(MARK) alt="" width="72" height="72">
                        <h2>
                            "Less between"
                            <br>
                            "you and the app."
                        </h2>
                        <p>
                            "Not another data layer to wire into your stack. A framework for the page, the data, and the space between."
                        </p>
                    </div>
                    <dl>
                        <div>
                            <dt>"Rust all the way down"</dt>
                            <dd>
                                "Views, handlers, read scopes and write validation live together. The framework generates the browser code."
                            </dd>
                        </div>
                        <div>
                            <dt>"Local queries, live results"</dt>
                            <dd>
                                "Filter, join and sort without a request for every interaction. Keyed lists update when their data changes."
                            </dd>
                        </div>
                        <div>
                            <dt>"The server stays in charge"</dt>
                            <dd>
                                "Read scopes are mandatory. Writes are explicitly allowed and checked on the server. Browser state is never authorization."
                            </dd>
                        </div>
                        <div>
                            <dt>"A small, familiar stack"</dt>
                            <dd>
                                "Toasty models. SQLite for development. Tailwind when you want it. Same-origin script modules that work under a strict CSP."
                            </dd>
                        </div>
                    </dl>
                </section>
                <section id="start" class="start-section">
                    <div class="wrap start-inner">
                        <div>
                            <h2>
                                "Make yourself"
                                <br>
                                "at home."
                            </h2>
                            <p>
                                "Hearth is early, opinionated, and ready to be explored. Start with a small app. Tell us where it gets in your way."
                            </p>
                            <a class="button light" href=(href!(guide))>
                                "Build your first page"
                                <span aria-hidden="true">"↗"</span>
                            </a>
                        </div>
                        <div class="install">
                            <p>"Start with crates.io"</p>
                            <pre>
                                <code>
                                    "rustup toolchain install 1.99.1\ncargo new my-hearth-app\ncd my-hearth-app\nrustup override set 1.99.1\ncargo add hearth@=0.1.0\ncargo add tokio --features rt-multi-thread,macros\ncargo install hearth-cli --version 0.1.0 --locked"
                                </code>
                            </pre>
                            <p class="install-note">
                                "Hearth 0.1.0 is published. Use Rust 1.99.1, then follow the guide for a complete first page. No Node.js or pnpm required for your app."
                            </p>
                            <a href=(href!(guide))>
                                "See setup and running instructions →"
                            </a>
                        </div>
                    </div>
                </section>
                <section class="early wrap">
                    <h2>"An honest starting point."</h2>
                    <p>
                        "Hearth is experimental. APIs will change. Browser persistence caches server rows; it is not a durable offline write queue. The current sync path scans scoped tables, so test it with your own data and permissions."
                    </p>
                    <a class="text-link" href=(href!(guide))>
                        "Read the current boundaries →"
                    </a>
                </section>
            </main>
        )
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
                    "Simplified source excerpts. Full demo: site/src/pages.rs."
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
                    <a href=(href!(home)) aria-label="Hearth home">
                        <img src=(LOGO) alt="hearth" width="142" height="48">
                    </a>
                    <nav aria-label="Main navigation">
                        <a href=(href!(home).fragment("how"))>"How it works"</a>
                        <a href=(href!(guide))>"Guide"</a>
                        <a href=(href!(guide).fragment("source"))>
                            "Source"
                            <span aria-hidden="true">"↗"</span>
                        </a>
                    </nav>
                </header>
                (child)
                <footer class="wrap">
                    <a href=(href!(home))>
                        <img src=(LOGO) alt="hearth" width="118" height="40">
                    </a>
                    <p>
                        "Built with Hearth. Derived from "
                        <a href="https://github.com/tokio-rs/topcoat">"Topcoat"</a>
                        ". MIT licensed."
                    </p>
                    <span>"A work in progress, on purpose."</span>
                </footer>
            </body>
        </html>
    })
}

#[page("/guide")]
async fn guide() -> Result<impl View> {
    Ok(view! {
        ((
            hearth::router::header::CONTENT_SECURITY_POLICY,
            hearth::router::HeaderValue::from_static(POLICY),
        ))
        shell(
            title: "Get started - hearth",
            <main id="main" class="guide wrap">
                <a class="text-link" href=(href!(home))>"← Back to Hearth"</a>
                <h1>"A small beginning."</h1>
                <p class="lead">
                    "Build a server-rendered Rust page, then add local-first behavior where it matters."
                </p>
                <h2>"Install from crates.io"</h2>
                <p>
                    "Hearth 0.1.0 is available now. Create an app with the tested Rust 1.99.1 toolchain; no Node.js or pnpm is needed."
                </p>
                <pre>
                    <code>
                        "rustup toolchain install 1.99.1\ncargo new my-hearth-app\ncd my-hearth-app\nrustup override set 1.99.1\ncargo add hearth@=0.1.0\ncargo add tokio --features rt-multi-thread,macros\ncargo install hearth-cli --version 0.1.0 --locked"
                    </code>
                </pre>
                <p>
                    "Replace src/main.rs with the first page below, then run cargo run --release. Open http://127.0.0.1:3000. For interactive pages, bundle assets from the same build as the binary."
                </p>
                <h2>"Your first page"</h2>
                <p>
                    "The hearth crate includes the router, views, reactive expressions, local-first tables and the application server."
                </p>
                <pre>
                    <code>
                        "use hearth::{Result, router::{module_router, page}, view::{View, view}};\n\n#[tokio::main]\nasync fn main() {\n    hearth::start(module_router!().build()).await.unwrap();\n}\n\n#[page]\nasync fn home() -> Result<impl View> {\n    Ok(view! { <h1>\"Hello from Hearth\"</h1> })\n}"
                    </code>
                </pre>
                <h2 id="source">"Explore the source"</h2>
                <p>
                    "The public repository contains this website and the full issue tracker. These commands build the website from source; framework development uses pnpm 10.20.0."
                </p>
                <pre>
                    <code>
                        "git clone https://github.com/wbunting/hearth.git\ncd hearth\npnpm install --frozen-lockfile\npnpm build:runtime\ncargo build --release -p hearth-cli -p hearth-site\n./target/release/hearth asset bundle --release -p hearth-site\nPORT=3620 ./target/release/hearth-site"
                    </code>
                </pre>
                <p>
                    "Open http://localhost:3620. The site uses an in-memory SQLite database by default. Each browser gets its own demo rows; a server restart resets them."
                </p>
                <h2>"From page to app"</h2>
                <ol>
                    <li>
                        "Define a Toasty model and derive Table for its browser-facing row."
                    </li>
                    <li>
                        "Provide a read scope and explicitly allow writable fields."
                    </li>
                    <li>
                        "Use live_query! in a component, then render it with for row in $(query)."
                    </li>
                    <li>
                        "Add runtime().assets(...) to the router and include runtime::script() in your page."
                    </li>
                    <li>
                        "Embed the client schema using json_script(\"hearth-boot\", ...)."
                    </li>
                </ol>
                <p>
                    "The complete, runnable examples are site/src and examples/hearth-tracker in the checkout. Authorize every table load and mutation; hiding a control is not access control."
                </p>
                <h2>"Current boundaries"</h2>
                <ul>
                    <li>
                        "Experimental API. Pin your dependency and expect breaking changes."
                    </li>
                    <li>
                        "Runtime expressions use a supported Rust vocabulary, not arbitrary Rust."
                    </li>
                    <li>
                        "The browser database is an indexed JavaScript store. It is not SQLite or a Rust WebAssembly runtime."
                    </li>
                    <li>
                        "IndexedDB caches server rows. Pending writes do not survive closing the tab."
                    </li>
                    <li>
                        "Delta sync scans scoped server tables. Measure with your own data volume."
                    </li>
                    <li>
                        "Strict CSP covers compiled expression paths. App-authored inline styles and arbitrary raw HTML streams need separate consideration."
                    </li>
                </ul>
                <h2>"Credits"</h2>
                <p>
                    "Hearth is a fork of Topcoat v0.10.0 by Julien Scholz. The original MIT license is retained. The site uses Manrope, licensed under the SIL Open Font License."
                </p>
                <a class="text-link" href="https://github.com/tokio-rs/topcoat">
                    "Visit upstream Topcoat →"
                </a>
            </main>
        )
    })
}
