use hearth::{
    cookie::RouterBuilderCookieExt,
    router::{Body, Router, request::Request, to_bytes},
    session::{RouterBuilderSessionExt, SessionConfig},
};
use serde_json::Value;

use super::*;

async fn load(router: &Router, cookie: &str, table: &str, query: &str) -> Value {
    let response = router
        .handle(
            Request::builder()
                .uri(format!("/_hearth/{table}/load{query}"))
                .header("cookie", cookie)
                .body(Body::empty())
                .unwrap(),
        )
        .await;
    assert_eq!(response.status(), 200, "{table}{query}");
    let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
    serde_json::from_slice(&body).unwrap()
}

async fn login(router: &Router, user: &str) -> String {
    let response = router
        .handle(
            Request::builder()
                .method("POST")
                .uri("/login/submit")
                .header("content-type", "application/x-www-form-urlencoded")
                .body(Body::from(format!("user_id={user}")))
                .unwrap(),
        )
        .await;
    assert_eq!(response.status(), 303);
    response.headers()["set-cookie"]
        .to_str()
        .unwrap()
        .split(';')
        .next()
        .unwrap()
        .to_owned()
}

#[tokio::test]
async fn large_child_scopes_and_visibility_tombstones() {
    let mut db = toasty::Db::builder()
        .models(toasty::models!(crate::*))
        .connect("sqlite::memory:")
        .await
        .unwrap();
    db.push_schema().await.unwrap();
    for (id, role) in [("reader", "user"), ("crew", "crew")] {
        toasty::create!(User {
            id,
            login: id,
            role
        })
        .exec(&mut db)
        .await
        .unwrap();
    }
    // More public parents than SQLite's 32,766 bind-parameter limit, even
    // though the child query and its result are small.
    for start in (0..32_767).step_by(500) {
        let mut batch = Issue::create_many();
        for n in start..(start + 500).min(32_767) {
            batch = batch.with_item(|i| {
                i.id(format!("public-{n}"))
                    .short_id(n)
                    .title("public")
                    .open(true)
                    .modified(0)
                    .created(0)
                    .project_id("project")
                    .creator_id("reader")
                    .description("")
                    .visibility("public")
            });
        }
        batch.exec(&mut db).await.unwrap();
    }
    toasty::create!(Issue {
        id: "internal",
        short_id: -1,
        title: "internal",
        open: true,
        modified: 0,
        created: 0,
        project_id: "project",
        creator_id: "crew",
        description: "",
        visibility: "internal"
    })
    .exec(&mut db)
    .await
    .unwrap();
    for issue_id in ["public-0", "internal", "missing"] {
        toasty::create!(Comment {
            id: issue_id,
            issue_id,
            created: 0,
            body: "comment",
            creator_id: "reader"
        })
        .exec(&mut db)
        .await
        .unwrap();
        toasty::create!(IssueLabel {
            label_id: "label",
            issue_id
        })
        .exec(&mut db)
        .await
        .unwrap();
    }
    let router = Router::builder()
        .discover_routes()
        .app_context(db.clone())
        .cookies()
        .sessions(SessionConfig::default())
        .build();
    let reader = login(&router, "reader").await;
    let crew = login(&router, "crew").await;

    for table in ["comments", "issue_labels"] {
        let legacy = load(&router, &reader, table, "").await;
        assert_eq!(legacy.as_array().unwrap().len(), 1);
        assert_eq!(legacy[0]["issueId"], "public-0");
    }
    let comments = load(&router, &reader, "comments", "?sync=1").await;
    let labels = load(&router, &reader, "issue_labels", "?sync=1").await;
    for first in [&comments, &labels] {
        assert_eq!(first["full"], true);
        assert_eq!(first["rows"].as_array().unwrap().len(), 1);
        assert_eq!(first["rows"][0]["issueId"], "public-0");
    }

    // Dependent scopes must be re-evaluated on every delta, not cached as
    // the set of parent IDs that was visible when the cursor was issued.
    Issue::filter_by_id("public-0".to_owned())
        .update()
        .visibility("internal")
        .exec(&mut db)
        .await
        .unwrap();
    for (table, first) in [("comments", comments), ("issue_labels", labels)] {
        let query = format!("?since={}", first["cursor"].as_str().unwrap());
        let revoked = load(&router, &reader, table, &query).await;
        assert_eq!(revoked["full"], false);
        assert!(revoked["rows"].as_array().unwrap().is_empty());
        assert_eq!(
            revoked["deleted"],
            serde_json::json!([first["rows"][0]["id"]])
        );
        assert!(
            load(&router, &reader, table, "")
                .await
                .as_array()
                .unwrap()
                .is_empty()
        );
        // Crew retain all rows, including children without a parent.
        assert_eq!(
            load(&router, &crew, table, "")
                .await
                .as_array()
                .unwrap()
                .len(),
            3
        );
    }
}
