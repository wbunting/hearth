//! Rough per-request cost of each transport. Ignored by default:
//! `cargo test --release -p hearth-tauri --test transport_latency -- --ignored --nocapture`

use std::time::Instant;

use hearth_tauri::{LaunchToken, handle_in_process, open_db, router, serve_loopback};

#[tokio::test(flavor = "multi_thread")]
#[ignore = "measurement, not a check"]
async fn compare_transports() {
    let dir = std::env::temp_dir().join(format!("hearth-tauri-bench-{}", uuid::Uuid::new_v4()));
    let path = dir.join("planner.db");
    let assets = dir.join("assets");
    std::fs::create_dir_all(&assets).unwrap();
    let manifest = format!(
        "version = {}\nassets = []\n",
        hearth::asset::MANIFEST_VERSION
    );
    std::fs::write(assets.join("manifest.toml"), manifest).unwrap();
    let bundle = || hearth::asset::AssetBundle::load_dir(&assets).unwrap();
    let token = LaunchToken::generate();
    let enter = token.enter_path();
    let app = router(open_db(&path).await.unwrap(), bundle(), Some(token));
    let n = 2000;

    let start = Instant::now();
    for _ in 0..n {
        let req = http::Request::get("/_hearth/tasks/load")
            .body(Vec::new())
            .unwrap();
        assert_eq!(handle_in_process(&app, req).await.status(), 200);
    }
    let in_process = start.elapsed() / n;

    let addr = serve_loopback(app).await.unwrap();
    let mut req = format!("GET {enter} HTTP/1.1\r\nHost: {addr}\r\nConnection: close\r\n\r\n");
    let mut out = String::new();
    {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let mut s = tokio::net::TcpStream::connect(addr).await.unwrap();
        s.write_all(req.as_bytes()).await.unwrap();
        s.read_to_string(&mut out).await.unwrap();
    }
    let cookie = out
        .lines()
        .find_map(|l| l.strip_prefix("set-cookie: "))
        .unwrap();
    let cookie = cookie.split(';').next().unwrap().to_owned();
    req = format!(
        "GET /_hearth/tasks/load HTTP/1.1\r\nHost: {addr}\r\nCookie: {cookie}\r\nConnection: close\r\n\r\n"
    );
    let start = Instant::now();
    for _ in 0..n {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let mut s = tokio::net::TcpStream::connect(addr).await.unwrap();
        s.write_all(req.as_bytes()).await.unwrap();
        let mut buf = Vec::new();
        s.read_to_end(&mut buf).await.unwrap();
        assert!(buf.starts_with(b"HTTP/1.1 200"));
    }
    let loopback = start.elapsed() / n;
    println!(
        "tasks load: in-process {in_process:?}/req, loopback (new connection) {loopback:?}/req"
    );
}
