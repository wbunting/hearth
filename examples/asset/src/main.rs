use hearth::{
    Result,
    asset::{AssetBundle, RouterBuilderAssetExt, asset},
    router::{module_router, page},
    view::{View, view},
};

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
            <head>hearth::dev::script()</head>
            <body>
                // The path is relative to this source file; the asset renders
                // as the bundled image's URL.
                <img src=(asset!("./ferris.png"))>
            </body>
        </html>
    })
}
