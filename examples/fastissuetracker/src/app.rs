//! Pages, all in Rust. `/issues` and `/issue/{short_id}` are one client-routed
//! app shell: navigating between them never hits the server.

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
    module_router!()
        .discover()
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
