//! P0 collection endpoints. In P1 these become generated procedures; the
//! shape (full scoped table, scope fingerprint header) stays.

use topcoat::{
    Result,
    context::Cx,
    router::{content::Json, route},
};

use crate::features::{
    auth::read_scope,
    data::{self, IssueLabelRow, IssuePatch, IssueRow, LabelRow, UserRow},
};

#[route(GET "/api/issues")]
async fn issues(cx: &Cx) -> Result<Json<Vec<IssueRow>>> {
    Ok(Json(data::issues(cx).await?))
}

#[route(GET "/api/users")]
async fn users(cx: &Cx) -> Result<Json<Vec<UserRow>>> {
    Ok(Json(data::users(cx).await?))
}

#[route(GET "/api/labels")]
async fn labels(cx: &Cx) -> Result<Json<Vec<LabelRow>>> {
    Ok(Json(data::labels(cx).await?))
}

#[route(GET "/api/issue-labels")]
async fn issue_labels(cx: &Cx) -> Result<Json<Vec<IssueLabelRow>>> {
    Ok(Json(data::issue_labels(cx).await?))
}

#[route(POST "/api/issues/update")]
async fn update_issue(cx: &Cx, Json(patch): Json<IssuePatch>) -> Result<Json<IssueRow>> {
    Ok(Json(data::update_issue(cx, patch).await?))
}

#[route(GET "/api/scope")]
async fn scope(cx: &Cx) -> Result<String> {
    Ok(read_scope(cx).await?.fingerprint())
}
