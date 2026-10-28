//! hearth-tauri: a Hearth app whose server runs inside the desktop process.
//!
//! The library builds the router over an on-device SQLite database and
//! offers two ways for a webview to reach it:
//!
//! - [`handle_in_process`]: hand an `http::Request` straight to [`Router::handle`]. A Tauri custom
//!   URI scheme uses this; no socket is opened.
//! - [`serve_loopback`]: bind `127.0.0.1:0` and require a per-launch token cookie.
//!
//! The Tauri shell lives in `src-tauri/`. `src/main.rs` runs the same app in
//! an ordinary browser over loopback.

pub mod app;
pub mod auth;
pub mod changes;
pub mod model;
pub mod tables;

use std::{
    net::SocketAddr,
    path::Path,
    time::{Duration, Instant},
};

pub use auth::{LaunchToken, Trusted};
use hearth::{
    Result,
    asset::{AssetBundle, RouterBuilderAssetExt},
    context::Cx,
    cookie::RouterBuilderCookieExt,
    router::{
        Body, HeaderValue, Layer, LayerFuture, Next, Path as RoutePath, Router,
        RouterBuilderDiscoverExt, header, module_router, to_bytes,
    },
    runtime::RouterBuilderRuntimeExt,
};

/// Strict policy: no inline scripts or styles, no eval.
pub const CSP: &str = "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:";

/// Milliseconds since the Unix epoch.
#[must_use]
pub fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| i64::try_from(d.as_millis()).unwrap_or(i64::MAX))
}

/// Opens (and on first launch creates and seeds) the SQLite file at `path`.
///
/// # Errors
///
/// Returns an error when the file cannot be opened or the schema cannot be
/// created.
pub async fn open_db(path: &Path) -> toasty::Result<toasty::Db> {
    let fresh = !path.exists();
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).map_err(toasty::Error::driver_operation_failed)?;
    }
    let mut db = toasty::Db::builder()
        .models(toasty::models!(crate::*))
        .connect(&format!("sqlite:{}", path.display()))
        .await?;
    // `push_schema` issues plain `CREATE TABLE`, so it only runs on a new
    // file. A real app needs migrations here.
    if fresh {
        db.push_schema().await?;
        seed(&mut db).await?;
    }
    Ok(db)
}

async fn seed(db: &mut toasty::Db) -> toasty::Result<()> {
    let base = now_ms();
    let lists = [
        (
            "Today",
            &[
                "Water the plants",
                "Review the sync design",
                "Book train tickets",
            ][..],
        ),
        ("Groceries", &["Oat milk", "Coffee beans", "Lemons"][..]),
        ("Someday", &["Learn the cello"][..]),
    ];
    for (i, (name, tasks)) in (0i64..).zip(lists) {
        let list_id = uuid::Uuid::new_v4().to_string();
        toasty::create!(model::List {
            id: list_id.clone(),
            name: name.to_owned(),
            created: base + i
        })
        .exec(db)
        .await?;
        for (j, title) in (0i64..).zip(tasks) {
            toasty::create!(model::Task {
                id: uuid::Uuid::new_v4().to_string(),
                list_id: list_id.clone(),
                title: (*title).to_owned(),
                done: j == 0 && i == 0,
                created: base + i * 100 + j,
                modified: base
            })
            .exec(db)
            .await?;
        }
    }
    Ok(())
}

/// Builds the router. Pass a token to accept loopback TCP requests.
#[must_use]
pub fn router(db: toasty::Db, assets: AssetBundle, token: Option<LaunchToken>) -> Router {
    let mut builder = module_router!()
        .discover()
        .assets(assets)
        // Layers at the same path nest last-registered outermost. Register
        // app layers before `.cookies()` so the cookie jar exists for them.
        .layer(auth::LocalAuth)
        .layer(Headers)
        .cookies()
        .runtime()
        .app_context(db);
    if let Some(token) = token {
        builder = builder.app_context(token);
    }
    builder.build()
}

/// Sends a request through the router in process and buffers the response.
///
/// The request is marked [`Trusted`]: only the host process can construct
/// it. `Accept-Encoding` is removed because a webview's custom scheme
/// handler does not decode compressed bodies.
pub async fn handle_in_process(
    router: &Router,
    request: http::Request<Vec<u8>>,
) -> http::Response<Vec<u8>> {
    let (mut parts, body) = request.into_parts();
    parts.headers.remove(header::ACCEPT_ENCODING);
    let request = http::Request::from_parts(parts, Body::from(body));
    let response = router.handle_with(request, (Trusted,)).await;
    let (parts, body) = response.into_parts();
    match to_bytes(body, usize::MAX).await {
        Ok(bytes) => http::Response::from_parts(parts, bytes.to_vec()),
        Err(_) => http::Response::builder()
            .status(500)
            .body(Vec::new())
            .unwrap_or_default(),
    }
}

/// Binds a random loopback port and serves the router on it.
///
/// Returns the bound address. The server runs until the process exits.
///
/// # Errors
///
/// Returns an error when the port cannot be bound.
pub async fn serve_loopback(router: Router) -> std::io::Result<SocketAddr> {
    let listener = tokio::net::TcpListener::bind(("127.0.0.1", 0)).await?;
    let addr = listener.local_addr()?;
    tokio::spawn(async move {
        let _ = hearth::serve_until(listener, router, std::future::pending()).await;
    });
    Ok(addr)
}

/// Startup timer that prints each phase to stderr.
pub struct Timeline(Instant);

impl Timeline {
    #[must_use]
    pub fn start() -> Self {
        Self(Instant::now())
    }

    #[allow(
        clippy::must_use_candidate,
        reason = "callers usually only want the log line"
    )]
    pub fn mark(&self, what: &str) -> Duration {
        let at = self.0.elapsed();
        eprintln!("[hearth-tauri] {:>8.2}ms {what}", at.as_secs_f64() * 1000.0);
        at
    }
}

/// Adds the CSP and disables caching of pages, which embed per-build asset
/// URLs.
struct Headers;

impl Layer for Headers {
    fn path(&self) -> Option<&RoutePath> {
        Some(RoutePath::new("/"))
    }

    fn handle<'a>(&'a self, cx: &'a Cx, body: Body, next: Next<'a>) -> LayerFuture<'a> {
        Box::pin(async move {
            let mut res = next.run(cx, body).await?;
            res.headers_mut().insert(
                header::CONTENT_SECURITY_POLICY,
                HeaderValue::from_static(CSP),
            );
            let html = res
                .headers()
                .get(header::CONTENT_TYPE)
                .is_some_and(|v| v.as_bytes().starts_with(b"text/html"));
            if html {
                res.headers_mut()
                    .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
            }
            Ok(res)
        })
    }
}

/// Logs diagnostics posted by `diag.js` (CSP violations, runtime marks,
/// storage availability) to stderr, so a GUI run leaves evidence.
#[hearth::router::route(POST "/_local/diag")]
async fn diag(cx: &Cx, body: Body) -> Result<&'static str> {
    auth::owner(cx)?;
    let bytes = to_bytes(body, 64 * 1024).await?;
    eprintln!("[hearth-tauri] diag {}", String::from_utf8_lossy(&bytes));
    Ok("ok")
}
