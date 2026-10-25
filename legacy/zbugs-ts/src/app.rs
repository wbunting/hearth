mod api;
mod rs;
mod issues;
mod login;

use hearth::{
    Result,
    asset::{Asset, AssetBundle, RouterBuilderAssetExt, asset},
    context::Cx,
    cookie::RouterBuilderCookieExt,
    router::{RouterBuilder, RouterBuilderDiscoverExt, Slot, layout, module_router, page, error::redirect},
    runtime::RouterBuilderRuntimeExt,
    session::{RouterBuilderSessionExt, SessionConfig},
    view::{View, view},
};

use crate::features::auth::current_user;

/// The hearth browser bundle (TanStack DB + glue), built by `pnpm build:client`.
pub const HEARTH_JS: Asset = asset!("../../../client/dist/hearth.js");

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
                <title>"zbugs · hearth"</title>
                <link rel="stylesheet" href=(asset!("./styles.css"))>
                hearth::runtime::script()
                hearth::dev::script()
            </head>
            <body>(slot)</body>
        </html>
    })
}

#[page]
async fn home(cx: &Cx) -> Result<impl View> {
    let to = if current_user(cx).await.map_err(Clone::clone)?.is_some() { "/issues" } else { "/login" };
    Err::<hearth::view::BoxView<'static>, _>(redirect(to).into())
}
