mod demo;
mod pages;

use hearth::{
    Result,
    asset::{AssetBundle, RouterBuilderAssetExt},
    cookie::RouterBuilderCookieExt,
    router::{Router, RouterBuilderDiscoverExt, module_router},
    runtime::RouterBuilderRuntimeExt,
};

fn router(db: toasty::Db, assets: AssetBundle) -> Router {
    module_router!()
        .discover()
        .cookies()
        .assets(assets)
        .runtime()
        .app_context(db)
        .app_context(demo::Visitors::default())
        .build()
}

#[tokio::main]
async fn main() -> Result<()> {
    let db = toasty::Db::builder()
        .models(toasty::models!(demo::Issue))
        .connect("sqlite::memory:")
        .await?;
    db.push_schema().await?;
    hearth::start(router(db, AssetBundle::load()?)).await?;
    Ok(())
}
