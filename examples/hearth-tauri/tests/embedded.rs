//! Headless checks of the embedded server: the in-process transport a Tauri
//! custom scheme uses, the token-gated loopback transport, durable writes
//! across a reopen, and the outbound changelog.

use std::path::{Path, PathBuf};

use hearth::{asset::AssetBundle, router::Router};
use hearth_tauri::{LaunchToken, handle_in_process, open_db, router};
use serde_json::{Value, json};

fn temp_db() -> PathBuf {
    let dir = std::env::temp_dir().join(format!("hearth-tauri-test-{}", uuid::Uuid::new_v4()));
    dir.join("planner.db")
}

/// An empty bundle. Pages that reference assets need a real bundle; these
/// tests exercise the table endpoints.
fn assets(dir: &Path) -> AssetBundle {
    let assets = dir.join("assets");
    std::fs::create_dir_all(&assets).unwrap();
    let manifest = format!(
        "version = {}\nassets = []\n",
        hearth::asset::MANIFEST_VERSION
    );
    std::fs::write(assets.join("manifest.toml"), manifest).unwrap();
    AssetBundle::load_dir(assets).unwrap()
}

async fn app(path: &Path, token: Option<LaunchToken>) -> Router {
    let db = open_db(path).await.unwrap();
    router(db, assets(path.parent().unwrap()), token)
}

async fn call(router: &Router, method: &str, uri: &str, body: Option<Value>) -> (u16, Value) {
    let mut req = http::Request::builder().method(method).uri(uri);
    let bytes = match body {
        Some(v) => {
            req = req.header("content-type", "application/json");
            serde_json::to_vec(&v).unwrap()
        }
        None => Vec::new(),
    };
    let res = handle_in_process(router, req.body(bytes).unwrap()).await;
    let status = res.status().as_u16();
    (
        status,
        serde_json::from_slice(res.body()).unwrap_or(Value::Null),
    )
}

#[tokio::test]
async fn in_process_writes_are_durable_and_logged() {
    let path = temp_db();
    let router = app(&path, None).await;
    let (status, lists) = call(&router, "GET", "/_hearth/lists/load", None).await;
    assert_eq!(status, 200);
    let list_id = lists[0]["id"].as_str().unwrap().to_owned();

    let insert =
        json!({"op": "insert", "row": {"id": "t-1", "listId": list_id, "title": "  durable  "}});
    let (status, saved) = call(&router, "POST", "/_hearth/tasks/mutate", Some(insert)).await;
    assert_eq!(status, 200);
    assert_eq!(
        saved["title"], "durable",
        "the server trims and owns the row"
    );

    let toggle = json!({"op": "update", "key": "t-1", "changes": {"done": true}});
    assert_eq!(
        call(&router, "POST", "/_hearth/tasks/mutate", Some(toggle))
            .await
            .0,
        200
    );
    let invalid = json!({"op": "update", "key": "t-1", "changes": {"title": ""}});
    assert_eq!(
        call(&router, "POST", "/_hearth/tasks/mutate", Some(invalid))
            .await
            .0,
        400
    );

    // Reopen the file, as an app restart does.
    drop(router);
    let router = app(&path, None).await;
    let (_, tasks) = call(&router, "GET", "/_hearth/tasks/load", None).await;
    let task = tasks
        .as_array()
        .unwrap()
        .iter()
        .find(|t| t["id"] == "t-1")
        .unwrap();
    assert_eq!(task["done"], true);
    assert_eq!(task["title"], "durable");

    // The rejected write left no log entry; the two accepted ones chain.
    let (_, page) = call(&router, "GET", "/_local/changes", None).await;
    let changes = page["changes"].as_array().unwrap();
    assert_eq!(changes.len(), 2);
    assert_eq!(changes[0]["base_revision"], 0);
    assert_eq!(changes[1]["base_revision"], 1);
    assert_eq!(changes[1]["row"]["done"], true);
    let (_, rest) = call(
        &router,
        "GET",
        &format!("/_local/changes?after={}", page["cursor"]),
        None,
    )
    .await;
    assert_eq!(rest["changes"], json!([]));
}

#[tokio::test]
async fn loopback_requires_the_launch_token() {
    let path = temp_db();
    let token = LaunchToken::generate();
    let enter = token.enter_path();
    let router = app(&path, Some(token)).await;
    let addr = hearth_tauri::serve_loopback(router).await.unwrap();
    let get = |uri: String, cookie: Option<String>| async move {
        let mut req = format!("GET {uri} HTTP/1.1\r\nHost: {addr}\r\nConnection: close\r\n");
        if let Some(c) = cookie {
            req.push_str("Cookie: ");
            req.push_str(&c);
            req.push_str("\r\n");
        }
        req.push_str("\r\n");
        let mut stream = tokio::net::TcpStream::connect(addr).await.unwrap();
        tokio::io::AsyncWriteExt::write_all(&mut stream, req.as_bytes())
            .await
            .unwrap();
        let mut out = String::new();
        tokio::io::AsyncReadExt::read_to_string(&mut stream, &mut out)
            .await
            .unwrap();
        out
    };
    let status = |res: &str| res.split(' ').nth(1).unwrap().to_owned();

    assert_eq!(
        status(&get("/_hearth/tasks/load".into(), None).await),
        "401"
    );
    assert_eq!(
        status(&get("/_local/enter?token=wrong".into(), None).await),
        "401"
    );
    let entered = get(enter, None).await;
    assert_eq!(status(&entered), "303");
    let cookie = entered
        .lines()
        .find_map(|l| l.strip_prefix("set-cookie: "))
        .unwrap()
        .split(';')
        .next()
        .unwrap()
        .to_owned();
    assert_eq!(
        status(&get("/_hearth/tasks/load".into(), Some(cookie)).await),
        "200"
    );
    // A forged cookie from another launch does not work.
    let forged = format!("hearth-local={}", "0".repeat(64));
    assert_eq!(
        status(&get("/_hearth/tasks/load".into(), Some(forged)).await),
        "401"
    );
}
