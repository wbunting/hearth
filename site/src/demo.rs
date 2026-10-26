//! A browser-isolated, real database demo. The site never shares a visitor's writes.

use std::collections::VecDeque;

use hearth::{
    Result, Table,
    context::Cx,
    cookie::{Cookies, cookie, cookies},
    router::error::{forbidden, internal_server_error},
};
use serde::{Deserialize, Serialize};
use toasty::stmt::Expr;

pub const MAX_VISITORS: usize = 256;
#[derive(Default)]
pub struct Visitors(pub tokio::sync::Mutex<VecDeque<String>>);

#[hearth::router::layer("/")]
async fn identity(
    cx: &Cx,
    body: hearth::router::Body,
    next: hearth::router::Next<'_>,
) -> Result<hearth::router::response::Response> {
    if let Ok(owner) = viewer(cx)
        && let Ok(id) = uuid::Uuid::parse_str(&owner)
    {
        let mut bytes = [0; 32];
        bytes[..16].copy_from_slice(id.as_bytes());
        let scoped = cx.with(hearth::sync::Principal(bytes));
        return next.run(&scoped, body).await;
    }
    next.run(cx, body).await
}

#[derive(Clone, toasty::Model)]
pub struct Issue {
    #[key]
    pub id: String,
    #[index]
    pub owner: String,
    pub title: String,
    pub open: bool,
    pub position: i64,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize, Table)]
#[serde(rename_all = "camelCase")]
#[table(name = "demo_issues", model = Issue, scope = scope, writable(open), update = update)]
pub struct IssueRow {
    #[key]
    pub id: String,
    pub title: String,
    #[index]
    pub open: bool,
    pub position: i64,
}

impl From<Issue> for IssueRow {
    fn from(issue: Issue) -> Self {
        Self {
            id: issue.id,
            title: issue.title,
            open: issue.open,
            position: issue.position,
        }
    }
}

pub struct Viewer(pub String);

pub fn viewer(cx: &Cx) -> Result<String> {
    if let Some(owner) = hearth::context::try_request_context::<Viewer>(cx) {
        return Ok(owner.0.clone());
    }
    cookies(cx)
        .get("hearth-demo")
        .map(|c| c.value().to_owned())
        .ok_or_else(|| forbidden().into())
}

#[allow(
    clippy::unused_async,
    reason = "Table scope callbacks share an async interface"
)]
async fn scope(cx: &Cx) -> Result<Option<Expr<bool>>> {
    Ok(Some(Issue::fields().owner().eq(viewer(cx)?)))
}

async fn update(cx: &Cx, id: String, patch: IssueRowPatch) -> Result<IssueRow> {
    let owner = viewer(cx)?;
    let mut db = hearth::db(cx);
    let mut issue = Issue::get_by_id(&mut db, id).await?;
    if issue.owner != owner {
        return Err(forbidden().into());
    }
    if let Some(open) = patch.open {
        issue.update().open(open).exec(&mut db).await?;
    }
    Ok(issue.into())
}

pub async fn seed(cx: &Cx) -> Result<String> {
    let visitors = hearth::context::app_context::<Visitors>(cx);
    let mut active = visitors.0.lock().await;
    let owner = viewer(cx)
        .ok()
        .filter(|s| uuid::Uuid::parse_str(s).is_ok())
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    if Issue::filter(Issue::fields().owner().eq(owner.clone()))
        .first()
        .exec(&mut hearth::db(cx))
        .await?
        .is_some()
    {
        return Ok(owner);
    }
    while active.len() >= MAX_VISITORS {
        if let Some(expired) = active.pop_front() {
            Issue::filter(Issue::fields().owner().eq(expired))
                .delete()
                .exec(&mut hearth::db(cx))
                .await?;
        }
    }
    active.push_back(owner.clone());
    let secure = std::env::var("HEARTH_SITE_SECURE").is_ok_and(|v| v == "1");
    cookies(cx).add(cookie!("hearth-demo" = owner.clone(); Path = "/"; HttpOnly; SameSite = Lax; Secure = secure));
    let mut db = hearth::db(cx);
    for (position, title) in [
        "Make the first render count",
        "Keep filters close to the data",
        "Let the server check the writes",
        "Ship something worth opening",
    ]
    .into_iter()
    .enumerate()
    {
        let id = uuid::Uuid::new_v4().to_string();
        let position = i64::try_from(position).map_err(internal_server_error)?;
        toasty::create!(Issue {
            id,
            owner: owner.clone(),
            title: title.to_owned(),
            open: position != 3,
            position
        })
        .exec(&mut db)
        .await?;
    }
    // Pending response cookies are not request cookies. Scope the first render explicitly.
    Ok(owner)
}

hearth::routes!(demo_issues: IssueRow);

#[cfg(test)]
mod tests {
    use hearth::router::{Body, Router, RouterBuilderDiscoverExt, content::Json, route, to_bytes};
    use serde_json::{Value, json};

    use super::*;

    #[route(GET "/test-seed")]
    async fn test_seed(cx: &Cx) -> Result<Json<String>> {
        Ok(Json(seed(cx).await?))
    }

    async fn router() -> Router {
        use hearth::cookie::RouterBuilderCookieExt;
        let db = toasty::Db::builder()
            .models(toasty::models!(Issue))
            .connect("sqlite::memory:")
            .await
            .unwrap();
        db.push_schema().await.unwrap();
        Router::builder()
            .discover()
            .cookies()
            .app_context(db)
            .app_context(Visitors::default())
            .build()
    }

    async fn call(
        router: &Router,
        path: &str,
        cookie: Option<&str>,
        mutation: Option<Value>,
    ) -> (u16, Value, Option<String>) {
        let mut request = http::Request::builder().uri(path);
        if let Some(cookie) = cookie {
            request = request.header("cookie", cookie);
        }
        let body = if let Some(value) = mutation {
            request = request
                .method("POST")
                .header("content-type", "application/json");
            Body::from(serde_json::to_string(&value).unwrap())
        } else {
            Body::empty()
        };
        let response = router.handle(request.body(body).unwrap()).await;
        let status = response.status().as_u16();
        let cookie = response
            .headers()
            .get("set-cookie")
            .map(|v| v.to_str().unwrap().split(';').next().unwrap().to_owned());
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let value = serde_json::from_slice(&body).unwrap_or(Value::Null);
        (status, value, cookie)
    }

    #[tokio::test]
    async fn scopes_loads_and_writes_to_the_browser() {
        let router = router().await;
        let (_, _, a) = call(&router, "/test-seed", None, None).await;
        let (_, _, b) = call(&router, "/test-seed", None, None).await;
        let a = a.unwrap();
        let b = b.unwrap();
        let (status, rows, _) = call(&router, "/_hearth/demo_issues/load", Some(&a), None).await;
        assert_eq!(status, 200);
        assert_eq!(rows.as_array().unwrap().len(), 4);
        let id = rows[0]["id"].as_str().unwrap();
        let patch = json!({"op":"update", "key":id, "changes":{"open":false}});
        let (status, _, _) = call(
            &router,
            "/_hearth/demo_issues/mutate",
            Some(&b),
            Some(patch.clone()),
        )
        .await;
        assert_eq!(status, 403);
        let (status, _, _) = call(
            &router,
            "/_hearth/demo_issues/mutate",
            Some(&a),
            Some(patch),
        )
        .await;
        assert_eq!(status, 200);
        let (_, persisted, _) = call(&router, "/_hearth/demo_issues/load", Some(&a), None).await;
        assert!(
            !persisted
                .as_array()
                .unwrap()
                .iter()
                .find(|r| r["id"] == id)
                .unwrap()["open"]
                .as_bool()
                .unwrap()
        );
        let (status, _, _) = call(&router, "/_hearth/demo_issues/load", None, None).await;
        assert_eq!(status, 403);
    }

    #[tokio::test]
    async fn cursor_from_another_browser_resets_without_disclosing_keys() {
        let router = router().await;
        let (_, _, a) = call(&router, "/test-seed", None, None).await;
        let (_, _, b) = call(&router, "/test-seed", None, None).await;
        let (_, first, _) = call(
            &router,
            "/_hearth/demo_issues/load?sync=1",
            a.as_deref(),
            None,
        )
        .await;
        let cursor = first["cursor"].as_str().unwrap();
        let (_, second, _) = call(
            &router,
            &format!("/_hearth/demo_issues/load?since={cursor}"),
            b.as_deref(),
            None,
        )
        .await;
        assert_eq!(second["full"], true);
        assert_eq!(second["deleted"], json!([]));
        let a_ids: Vec<_> = first["rows"]
            .as_array()
            .unwrap()
            .iter()
            .map(|r| r["id"].clone())
            .collect();
        assert!(
            second["rows"]
                .as_array()
                .unwrap()
                .iter()
                .all(|r| !a_ids.contains(&r["id"]))
        );
    }

    #[tokio::test]
    async fn anonymous_visits_have_bounded_row_retention() {
        let router = router().await;
        for _ in 0..MAX_VISITORS + 3 {
            assert_eq!(call(&router, "/test-seed", None, None).await.0, 200);
        }
        // Read the tracked owners through the same app context in the handler.
        // A new request cannot access an evicted owner's rows.
        let (_, _, oldest) = call(&router, "/test-seed", None, None).await;
        for _ in 0..MAX_VISITORS {
            call(&router, "/test-seed", None, None).await;
        }
        let (_, rows, _) = call(
            &router,
            "/_hearth/demo_issues/load",
            oldest.as_deref(),
            None,
        )
        .await;
        assert_eq!(rows, json!([]));
    }

    #[tokio::test]
    async fn reseeds_existing_cookie_after_an_in_memory_restart() {
        let router = router().await;
        let cookie = "hearth-demo=00000000-0000-4000-8000-000000000001";
        let (status, _, _) = call(&router, "/test-seed", Some(cookie), None).await;
        assert_eq!(status, 200);
        let (_, rows, _) = call(&router, "/_hearth/demo_issues/load", Some(cookie), None).await;
        assert_eq!(rows.as_array().unwrap().len(), 4);
        call(&router, "/test-seed", Some(cookie), None).await;
        let (_, rows, _) = call(&router, "/_hearth/demo_issues/load", Some(cookie), None).await;
        assert_eq!(
            rows.as_array().unwrap().len(),
            4,
            "reloading must not duplicate seeds"
        );
    }
}
