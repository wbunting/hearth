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

use crate::features::data::{CommentRow, EmojiRow, IdInput, IssueLabelInput};

#[route(GET "/api/comments")]
async fn comments(cx: &Cx) -> Result<Json<Vec<CommentRow>>> {
    Ok(Json(data::comments(cx).await?))
}

#[route(GET "/api/emojis")]
async fn emojis(cx: &Cx) -> Result<Json<Vec<EmojiRow>>> {
    Ok(Json(data::emojis(cx).await?))
}

#[route(POST "/api/comments/insert")]
async fn insert_comment(cx: &Cx, Json(row): Json<CommentRow>) -> Result<Json<CommentRow>> {
    Ok(Json(data::insert_comment(cx, row).await?))
}

#[route(POST "/api/issue-labels/insert")]
async fn insert_issue_label(cx: &Cx, Json(input): Json<IssueLabelInput>) -> Result<Json<IssueLabelRow>> {
    Ok(Json(data::insert_issue_label(cx, input).await?))
}

#[route(POST "/api/issue-labels/delete")]
async fn delete_issue_label(cx: &Cx, Json(input): Json<IssueLabelInput>) -> Result<Json<()>> {
    Ok(Json(data::delete_issue_label(cx, input).await?))
}

#[route(POST "/api/emojis/insert")]
async fn insert_emoji(cx: &Cx, Json(row): Json<EmojiRow>) -> Result<Json<EmojiRow>> {
    Ok(Json(data::insert_emoji(cx, row).await?))
}

#[route(POST "/api/emojis/delete")]
async fn delete_emoji(cx: &Cx, Json(input): Json<IdInput>) -> Result<Json<()>> {
    Ok(Json(data::delete_emoji(cx, input).await?))
}

topcoat::router::path_param!(issue_id);

/// Detail-only text, fetched on demand (kept out of the list payload).
#[route(GET "/api/issues/{issue_id}/description")]
async fn description(cx: &Cx) -> Result<String> {
    use topcoat::router::{error::RouterErrorExt, path_param};
    let id = path_param::<IssueId>(cx);
    Ok(data::issue_detail(cx, id).await?.ok_or_not_found()?.1)
}
