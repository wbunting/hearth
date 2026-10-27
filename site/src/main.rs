mod demo;
mod pages;
mod security;

use hearth::{
    Result,
    asset::{AssetBundle, RouterBuilderAssetExt},
    cookie::RouterBuilderCookieExt,
    router::{Router, RouterBuilderDiscoverExt, TrustedProxies, module_router, route},
    runtime::RouterBuilderRuntimeExt,
};

fn router(db: toasty::Db, assets: AssetBundle) -> Router {
    let mut builder = module_router!()
        .discover()
        .cookies()
        .assets(assets)
        .runtime()
        .app_context(db)
        .app_context(demo::Visitors::default())
        .layer(security::RateLimit::default());
    if std::env::var("FLY_APP_NAME").is_ok() {
        builder =
            builder.trusted_proxies(TrustedProxies::new().networks(["172.16.0.0/12", "fdaa::/16"]));
    }
    builder.build()
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

#[route(GET "/healthz")]
async fn health() -> Result<&'static str> {
    Ok("ok")
}
