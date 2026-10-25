//! Pages, all in Rust. `/issues` and `/issue/{short_id}` are one client-routed
//! app shell: navigating between them never hits the server.

mod baseline;
mod issues;
mod login;

use topcoat::{
    Result,
    asset::{AssetBundle, RouterBuilderAssetExt},
    context::Cx,
    cookie::RouterBuilderCookieExt,
    router::{
        RouterBuilder, RouterBuilderDiscoverExt, Slot, error::redirect, layout, module_router, page,
    },
    runtime::RouterBuilderRuntimeExt,
    session::{RouterBuilderSessionExt, SessionConfig},
    tailwind,
    view::{BoxView, View, attributes, component, view},
};

pub fn router() -> RouterBuilder {
    use topcoat::router::RouterBuilderDirectoryExt;
    module_router!()
        .discover()
        // Benchmark comparison: the React + TanStack DB SPA build, served by the
        // same server against the same `/_hearth` endpoints.
        .serve_dir(
            "/bench/react-assets/assets/{*file}",
            concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/../../benchmarks/localfirst/react/dist/assets"
            ),
        )
        .assets(AssetBundle::load().unwrap())
        .cookies()
        .sessions(SessionConfig::default())
        .runtime()
}

/// The benchmark stylesheet, shared with the React benchmark shell.
pub const TAILWIND: topcoat::asset::Asset =
    topcoat::asset::asset!(concat!(env!("OUT_DIR"), "/benchmark.css"));
const APP_TAILWIND: topcoat::asset::Asset = tailwind::stylesheet!();
const CSP_PROBE: topcoat::asset::Asset = topcoat::asset::asset!("./strict-csp.js");
/// hearth's keyed-arch mark (source: `docs/hearth/brand/`).
const FAVICON_SVG: topcoat::asset::Asset = topcoat::asset::asset!("./favicon.svg");
const FAVICON_PNG: topcoat::asset::Asset = topcoat::asset::asset!("./favicon-32.png");
const APPLE_TOUCH_ICON: topcoat::asset::Asset = topcoat::asset::asset!("./apple-touch-icon.png");

/// Hashed URL of the app stylesheet.
pub fn tailwind_url(cx: &Cx) -> String {
    let mut out = String::new();
    if let Some(cfg) = topcoat::context::try_app_context::<topcoat::asset::AssetConfig>(cx) {
        let _ = cfg.fmt_url(TAILWIND, &mut out);
    }
    out
}

#[layout]
async fn root(cx: &Cx, slot: Slot<'_>) -> Result<impl View> {
    let benchmark = topcoat::router::request::uri(cx)
        .path()
        .starts_with("/bench/");
    Ok(view! {
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>"hearth tracker"</title>
                <link rel="icon" type="image/svg+xml" href=(FAVICON_SVG)>
                <link rel="icon" type="image/png" sizes="32x32" href=(FAVICON_PNG)>
                <link rel="apple-touch-icon" href=(APPLE_TOUCH_ICON)>
                <link
                    rel="stylesheet"
                    href=(if benchmark { TAILWIND } else { APP_TAILWIND })
                >
                if std::env::var("HEARTH_STRICT_CSP").is_ok_and(|value| value == "1") {
                    <script src=(CSP_PROBE)></script>
                }
                topcoat::runtime::script()
                topcoat::dev::script()
            </head>
            <body
                class=(if benchmark {
                    "bg-white text-sm text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100"
                } else {
                    "bg-background text-sm text-foreground antialiased"
                })
            >
                (slot)
            </body>
        </html>
    })
}

/// Shared tracker header. The registry has no header primitive.
#[component]
async fn tracker_header(login: &str, crew: bool) -> Result<impl View> {
    use crate::components::{
        badge::{BadgeVariant, badge},
        button::{ButtonSize, ButtonVariant, button, button_variants},
    };
    Ok(view! {
        <header
            class="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-2 tracker-header"
        >
            <a
                class=(topcoat::view::class!(
                    button_variants(ButtonVariant::Ghost, ButtonSize::Sm),
                    "mr-auto",
                ))
                data-hearth-link=""
                href="/issues"
            >
                "hearth tracker"
            </a>
            <span class="text-muted-foreground">(login)</span>
            if crew {
                badge(variant: BadgeVariant::Secondary, "crew")
            }
            <form method="post" action="/logout">
                button(
                    variant: ButtonVariant::Outline,
                    size: ButtonSize::Sm,
                    attrs: attributes! { type="submit" },
                    "Sign out"
                )
            </form>
        </header>
    })
}

#[page]
async fn home(cx: &Cx) -> Result<impl View> {
    let signed_in = crate::auth::current_user(cx)
        .await
        .map_err(Clone::clone)?
        .is_some();
    Err::<BoxView<'static>, _>(redirect(if signed_in { "/issues" } else { "/login" }).into())
}

/// Benchmarking: `SIMULATED_RTT_MS=50` delays every request by that much,
/// emulating network latency for all apps alike (local-first apps hide it,
/// server-round-trip apps can't). Off by default.
#[topcoat::router::layer("/")]
async fn simulated_latency(
    cx: &Cx,
    body: topcoat::router::Body,
    next: topcoat::router::Next<'_>,
) -> Result<topcoat::router::response::Response> {
    if let Some(ms) = std::env::var("SIMULATED_RTT_MS")
        .ok()
        .and_then(|v| v.parse::<u64>().ok())
    {
        tokio::time::sleep(std::time::Duration::from_millis(ms)).await;
    }
    let mut res = next.run(cx, body).await?;
    // Pages embed hashed asset URLs and per-user data: never reuse a cached
    // page (otherwise a rebuilt runtime is silently ignored).
    let html = res
        .headers()
        .get(topcoat::router::header::CONTENT_TYPE)
        .is_some_and(|v| v.as_bytes().starts_with(b"text/html"));
    if std::env::var("HEARTH_STRICT_CSP").is_ok_and(|value| value == "1") {
        res.headers_mut().insert(
            topcoat::router::header::CONTENT_SECURITY_POLICY,
            topcoat::router::HeaderValue::from_static(
                "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'",
            ),
        );
    }
    if html {
        res.headers_mut().insert(
            topcoat::router::header::CACHE_CONTROL,
            topcoat::router::HeaderValue::from_static("no-store"),
        );
    }
    Ok(res)
}
