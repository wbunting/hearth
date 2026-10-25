//! End-to-end delta loads through the generated `routes!` endpoints.

use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};

use hearth::{
    Result, Table,
    context::{Cx, app_context},
    router::{Body, Router, to_bytes},
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use toasty::Db;

#[derive(Debug, Clone, toasty::Model)]
struct Note {
    #[key]
    id: String,
    public: bool,
    body: String,
}

/// Whether the viewer is restricted to public notes. Flipping it simulates
/// a role change between loads.
#[derive(Default, Clone)]
struct Restricted(Arc<AtomicBool>);

#[derive(Table, Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[table(name = "notes", model = Note, scope = note_scope)]
struct NoteRow {
    #[key]
    id: String,
    public: bool,
    body: String,
}

impl From<Note> for NoteRow {
    fn from(n: Note) -> Self {
        Self {
            id: n.id,
            public: n.public,
            body: n.body,
        }
    }
}

async fn note_scope(cx: &Cx) -> Result<Option<toasty::stmt::Expr<bool>>> {
    let restricted = app_context::<Restricted>(cx).0.load(Ordering::SeqCst);
    Ok(restricted.then(|| Note::fields().public().eq(true)))
}

hearth::routes!(notes: NoteRow);

async fn get(router: &Router, uri: &str) -> Value {
    let request = http::Request::builder()
        .method("GET")
        .uri(uri)
        .body(Body::empty())
        .unwrap();
    let response = router.handle(request).await;
    assert_eq!(response.status(), 200, "GET {uri}");
    let bytes = to_bytes(response.into_body(), usize::MAX).await.unwrap();
    serde_json::from_slice(&bytes).unwrap()
}

async fn load(router: &Router, since: Option<&str>) -> Value {
    match since {
        Some(c) => get(router, &format!("/_hearth/notes/load?since={c}")).await,
        None => get(router, "/_hearth/notes/load?sync=1").await,
    }
}

fn ids(v: &Value, field: &str) -> Vec<String> {
    let mut out: Vec<String> = v[field]
        .as_array()
        .unwrap()
        .iter()
        .map(|r| r.get("id").unwrap_or(r).as_str().unwrap().to_owned())
        .collect();
    out.sort();
    out
}

fn cursor(v: &Value) -> String {
    v["cursor"].as_str().unwrap().to_owned()
}

async fn note(db: &mut Db, id: &str, public: bool, body: &str) {
    toasty::create!(Note {
        id: id.to_owned(),
        public,
        body: body.to_owned()
    })
    .exec(db)
    .await
    .unwrap();
}

#[tokio::test]
async fn delta_loads_track_writes_and_scope() {
    let mut db = Db::builder()
        .models(toasty::models!(Note))
        .connect("sqlite::memory:")
        .await
        .unwrap();
    db.push_schema().await.unwrap();
    note(&mut db, "a", true, "A").await;
    note(&mut db, "b", true, "B").await;
    note(&mut db, "s", false, "secret").await;
    let restricted = Restricted::default();
    let router = Router::builder()
        .discover_routes()
        .app_context(db.clone())
        .app_context(restricted.clone())
        .build();

    // Legacy array response without `sync`/`since`.
    let legacy = get(&router, "/_hearth/notes/load").await;
    assert_eq!(legacy.as_array().unwrap().len(), 3);

    let first = load(&router, None).await;
    assert_eq!(first["full"], true);
    assert_eq!(ids(&first, "rows"), ["a", "b", "s"]);

    // Nothing changed.
    let same = load(&router, Some(&cursor(&first))).await;
    assert_eq!(same["full"], false);
    assert!(ids(&same, "rows").is_empty() && ids(&same, "deleted").is_empty());

    // Insert, update and delete made directly in the database.
    note(&mut db, "c", true, "C").await;
    Note::filter_by_id("a".to_owned())
        .update()
        .body("A2")
        .exec(&mut db)
        .await
        .unwrap();
    Note::filter_by_id("b".to_owned())
        .delete()
        .exec(&mut db)
        .await
        .unwrap();
    let delta = load(&router, Some(&cursor(&same))).await;
    assert_eq!(delta["full"], false);
    assert_eq!(ids(&delta, "rows"), ["a", "c"]);
    assert_eq!(ids(&delta, "deleted"), ["b"]);
    let a = delta["rows"]
        .as_array()
        .unwrap()
        .iter()
        .find(|r| r["id"] == "a")
        .unwrap();
    assert_eq!(a["body"], "A2");

    // A scope change removes rows the viewer can no longer read.
    restricted.0.store(true, Ordering::SeqCst);
    let revoked = load(&router, Some(&cursor(&delta))).await;
    assert_eq!(revoked["full"], false);
    assert!(ids(&revoked, "rows").is_empty());
    assert_eq!(ids(&revoked, "deleted"), ["s"]);

    // An unknown cursor resets to a full load of the current scope.
    let reset = load(&router, Some("h1.0.0")).await;
    assert_eq!(reset["full"], true);
    assert_eq!(ids(&reset, "rows"), ["a", "c"]);
    assert!(ids(&reset, "deleted").is_empty());
}
