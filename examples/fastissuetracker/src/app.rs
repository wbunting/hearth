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
    router::{RouterBuilder, RouterBuilderDiscoverExt, Slot, error::redirect, layout, module_router, page},
    runtime::RouterBuilderRuntimeExt,
    session::{RouterBuilderSessionExt, SessionConfig},
    tailwind,
    view::{BoxView, View, view},
};

pub fn router() -> RouterBuilder {
    use topcoat::router::RouterBuilderDirectoryExt;
    module_router!()
        .discover()
        // Benchmark comparison: the React + TanStack DB SPA build, served by the
        // same server against the same `/_fastcoat` endpoints.
        .serve_dir("/bench/react-assets/assets/{*file}", concat!(env!("CARGO_MANIFEST_DIR"), "/../../benchmarks/localfirst/react/dist/assets"))
        .assets(AssetBundle::load().unwrap())
        .cookies()
        .sessions(SessionConfig::default())
        .runtime()
}

#[layout]
async fn root(slot: Slot<'_>) -> Result<impl View> {
    Ok(view! {
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>"fastissuetracker"</title>
                <link rel="stylesheet" href=(tailwind::stylesheet!())>
                topcoat::runtime::script()
                topcoat::dev::script()
            </head>
            <body class="bg-white text-sm text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">(slot)</body>
        </html>
    })
}

#[page]
async fn home(cx: &Cx) -> Result<impl View> {
    let signed_in = crate::auth::current_user(cx).await.map_err(Clone::clone)?.is_some();
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
    if let Some(ms) = std::env::var("SIMULATED_RTT_MS").ok().and_then(|v| v.parse::<u64>().ok()) {
        tokio::time::sleep(std::time::Duration::from_millis(ms)).await;
    }
    let mut res = next.run(cx, body).await?;
    // Pages embed hashed asset URLs and per-user data: never reuse a cached
    // page (otherwise a rebuilt runtime is silently ignored).
    let html = res
        .headers()
        .get(topcoat::router::header::CONTENT_TYPE)
        .is_some_and(|v| v.as_bytes().starts_with(b"text/html"));
    if html {
        res.headers_mut()
            .insert(topcoat::router::header::CACHE_CONTROL, topcoat::router::HeaderValue::from_static("no-store"));
    }
    Ok(res)
}
