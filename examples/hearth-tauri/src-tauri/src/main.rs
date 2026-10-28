//! Tauri shell: runs the Hearth server in this process and points a webview
//! at it. No remote server and no separate frontend build.
//!
//! `HEARTH_TAURI_TRANSPORT` picks how the webview reaches the router:
//! - `scheme` (default): a `hearth://` custom URI scheme handler calls `Router::handle` directly.
//!   No TCP socket.
//! - `loopback`: serve on `127.0.0.1:<random>` and open a one-time URL with a per-launch token.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;

use hearth::asset::AssetBundle;
use hearth_tauri::{LaunchToken, Timeline, handle_in_process, open_db, router, serve_loopback};
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

const SCHEME: &str = "hearth";
const SMOKE: &str = include_str!("smoke.js");

fn main() {
    let timeline = Arc::new(Timeline::start());
    // One multi-threaded runtime for Hearth, the database and Tauri's async
    // tasks. Tauri adopts it instead of creating its own.
    let runtime = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("tokio runtime");
    tauri::async_runtime::set(runtime.handle().clone());

    let loopback = std::env::var("HEARTH_TAURI_TRANSPORT").is_ok_and(|v| v == "loopback");
    // The router is built inside `setup`, after the app data dir is known.
    // The scheme handler can be called before that, so it waits on this cell.
    let cell: Arc<tokio::sync::OnceCell<hearth::router::Router>> = Arc::default();

    let handler_cell = Arc::clone(&cell);
    let setup_timeline = Arc::clone(&timeline);
    tauri::Builder::default()
        .register_asynchronous_uri_scheme_protocol(SCHEME, move |_ctx, request, responder| {
            let cell = Arc::clone(&handler_cell);
            tauri::async_runtime::spawn(async move {
                let router = cell.get_or_init(std::future::pending).await;
                responder.respond(handle_in_process(router, request).await);
            });
        })
        .setup(move |app| {
            let timeline = setup_timeline;
            timeline.mark("tauri setup");
            let data = app.path().app_data_dir()?;
            let db_path = data.join("planner.db");
            let assets = load_assets(app)?;
            let token = loopback.then(LaunchToken::generate);
            let enter = token.as_ref().map(LaunchToken::enter_path);
            let db = tauri::async_runtime::block_on(open_db(&db_path))?;
            timeline.mark(&format!("database open {}", db_path.display()));
            let app_router = router(db, assets, token);
            let url = if let Some(enter) = enter {
                let addr = tauri::async_runtime::block_on(serve_loopback(app_router.clone()))?;
                timeline.mark(&format!("loopback listening on {addr}"));
                WebviewUrl::External(format!("http://{addr}{enter}").parse()?)
            } else {
                WebviewUrl::CustomProtocol(format!("{SCHEME}://localhost/").parse()?)
            };
            let _ = cell.set(app_router);
            timeline.mark("router ready");
            let page_timeline = Arc::clone(&timeline);
            let mut builder = WebviewWindowBuilder::new(app, "main", url);
            // Experiment hook: `HEARTH_TAURI_SMOKE=1` drives the real UI from
            // inside the page (DOM events into the Hearth runtime), so a GUI
            // run can be verified without OS accessibility permissions.
            if std::env::var("HEARTH_TAURI_SMOKE").is_ok_and(|v| v == "1") {
                builder = builder.initialization_script(SMOKE);
            }
            builder
                .title("Hearth Planner")
                .inner_size(980.0, 640.0)
                .on_page_load(move |window, payload| {
                    if matches!(payload.event(), tauri::webview::PageLoadEvent::Finished) {
                        page_timeline.mark(&format!(
                            "page loaded {}",
                            window.url().map(|u| u.to_string()).unwrap_or_default()
                        ));
                    }
                })
                .build()?;
            timeline.mark("window created");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Loads the asset bundle from the app bundle's resources, or from beside
/// the executable during development.
fn load_assets(app: &tauri::App) -> std::io::Result<AssetBundle> {
    if let Ok(dir) = app.path().resource_dir() {
        let bundled = dir.join("assets");
        if bundled.join("manifest.toml").is_file() {
            return AssetBundle::load_dir(bundled);
        }
    }
    AssetBundle::load()
}
