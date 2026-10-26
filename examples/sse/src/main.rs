use hearth::asset::RouterBuilderAssetExt;

mod job;
mod ticks;

use hearth::{
    Result,
    asset::{AssetBundle, asset},
    router::{module_router, page},
    view::{View, view},
};
use serde::Serialize;

#[tokio::main]
async fn main() {
    let router = module_router!()
        .assets(AssetBundle::load().unwrap())
        .build();

    hearth::start(router).await.unwrap();
}

#[page]
async fn home() -> Result<impl View> {
    Ok(view! {
        <!DOCTYPE html>
        <html>
            <head>
                <title>"Server-sent events"</title>
                hearth::dev::script()
            </head>
            <body>
                <h1>"Server-sent events"</h1>

                <button id="start">"Run a job"</button>

                <ul id="log"></ul>

                // Connects to both endpoints and logs the events it receives.
                <script src=(asset!("./feed.js"))></script>
            </body>
        </html>
    })
}

#[derive(Serialize)]
struct Progress {
    percent: u8,
}
