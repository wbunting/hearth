use std::sync::{
    Arc,
    atomic::{AtomicUsize, Ordering},
};

use topcoat::{
    Result,
    router::{
        Body, BodyLimit, Method, Router, RouterBuilder, StatusCode,
        content::{Form, Json},
        error::{
            ContentTooLargeError, MethodNotAllowedError, NotFoundError, forbidden, redirect,
            rewrite, too_many_requests,
        },
        request::{self, Bytes, Request},
        response::{IntoResponse, Response, response_headers},
        route, to_bytes,
    },
};

#[route(POST "/v1/json")]
async fn json(_input: Json<serde_json::Value>) -> Result<()> {
    Ok(())
}

#[route(POST "/v1/form")]
async fn form(_input: Form<std::collections::HashMap<String, String>>) -> Result<()> {
    Ok(())
}

#[route(POST "/v1/bytes")]
async fn bytes(_input: Bytes) -> Result<()> {
    Ok(())
}

#[route(GET "/v1/limited")]
async fn limited(cx: &topcoat::context::Cx) -> Result<()> {
    response_headers(cx).append(
        topcoat::router::HeaderName::from_static("x-error-test"),
        topcoat::router::HeaderValue::from_static("present"),
    );
    Err(too_many_requests(30).into())
}

#[route(GET "/redirect")]
async fn redirected() -> Result<()> {
    Err(redirect("/v1/limited").into())
}

#[route(GET "/rewrite")]
async fn rewritten() -> Result<()> {
    Err(rewrite("/v1/missing", Body::empty()).into())
}

#[route(GET "/response")]
async fn explicit_response() -> Result<StatusCode> {
    Ok(StatusCode::NOT_FOUND)
}

fn builder() -> RouterBuilder {
    Router::builder()
        .route(json)
        .route(form)
        .route(bytes)
        .route(limited)
        .route(redirected)
        .route(rewritten)
        .route(explicit_response)
        .layer(BodyLimit::max(8))
}

fn custom_json() -> Router {
    builder()
        .error_handler(|cx, cause, default| {
            if !request::uri(cx).path().starts_with("/v1/") {
                return Ok(default);
            }
            let code = if cause.is::<NotFoundError>() {
                "not_found"
            } else if cause.is::<ContentTooLargeError>() {
                "too_large"
            } else if cause.is::<MethodNotAllowedError>() {
                "wrong_method"
            } else {
                "other"
            };
            let (mut parts, _) = default.into_parts();
            parts.headers.remove("content-type");
            (parts, Json(serde_json::json!({"error": code}))).into_response(cx)
        })
        .build()
}

async fn send(router: &Router, method: Method, path: &str, kind: &str, body: Body) -> Response {
    router
        .handle(
            Request::builder()
                .method(method)
                .uri(path)
                .header("content-type", kind)
                .body(body)
                .unwrap(),
        )
        .await
}

async fn read_json(response: Response, status: StatusCode) -> serde_json::Value {
    assert_eq!(response.status(), status);
    assert_eq!(response.headers()["content-type"], "application/json");
    serde_json::from_slice(&to_bytes(response.into_body(), usize::MAX).await.unwrap()).unwrap()
}

#[tokio::test]
async fn framework_body_limits_use_custom_json_for_buffering_extractors() {
    let router = custom_json();
    for (path, kind) in [
        ("/v1/json", "application/json"),
        ("/v1/form", "application/x-www-form-urlencoded"),
        ("/v1/bytes", "application/octet-stream"),
    ] {
        let response = send(&router, Method::POST, path, kind, Body::from("0123456789")).await;
        let body = read_json(response, StatusCode::PAYLOAD_TOO_LARGE).await;
        assert_eq!(body["error"], "too_large");
    }
}

#[tokio::test]
async fn routing_misses_use_custom_json_and_keep_allow_header() {
    let router = custom_json();
    let response = send(&router, Method::GET, "/v1/missing", "", Body::empty()).await;
    assert_eq!(
        read_json(response, StatusCode::NOT_FOUND).await["error"],
        "not_found"
    );
    let response = send(&router, Method::GET, "/v1/json", "", Body::empty()).await;
    assert_eq!(response.headers()["allow"], "POST");
    assert_eq!(
        read_json(response, StatusCode::METHOD_NOT_ALLOWED).await["error"],
        "wrong_method"
    );
}

#[tokio::test]
async fn custom_errors_keep_retry_after_and_pending_headers() {
    let response = send(
        &custom_json(),
        Method::GET,
        "/v1/limited",
        "",
        Body::empty(),
    )
    .await;
    assert_eq!(response.headers()["retry-after"], "30");
    assert_eq!(response.headers()["x-error-test"], "present");
    read_json(response, StatusCode::TOO_MANY_REQUESTS).await;
}

#[tokio::test]
async fn defaults_and_paths_outside_the_json_prefix_are_unchanged() {
    let router = builder().build();
    let response = send(&router, Method::GET, "/v1/missing", "", Body::empty()).await;
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    let not_found_body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
    assert!(!not_found_body.is_empty());
    assert!(serde_json::from_slice::<serde_json::Value>(&not_found_body).is_err());
    let response = send(&router, Method::GET, "/v1/json", "", Body::empty()).await;
    assert_eq!(response.status(), StatusCode::METHOD_NOT_ALLOWED);
    assert_eq!(response.headers()["allow"], "POST");
    assert!(
        to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap()
            .is_empty()
    );
    let response = send(
        &router,
        Method::POST,
        "/v1/bytes",
        "",
        Body::from("0123456789"),
    )
    .await;
    assert_eq!(response.status(), StatusCode::PAYLOAD_TOO_LARGE);
    assert!(
        response.headers()["content-type"]
            .to_str()
            .unwrap()
            .starts_with("text/plain")
    );
    let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
    assert!(!body.is_empty());
    assert!(serde_json::from_slice::<serde_json::Value>(&body).is_err());
    let response = send(
        &custom_json(),
        Method::GET,
        "/html/missing",
        "",
        Body::empty(),
    )
    .await;
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    assert_eq!(
        to_bytes(response.into_body(), usize::MAX).await.unwrap(),
        not_found_body
    );
}

#[tokio::test]
async fn rewrites_render_only_the_final_error_and_redirects_are_not_errors() {
    let router = custom_json();
    let response = send(&router, Method::GET, "/rewrite", "", Body::empty()).await;
    assert_eq!(
        read_json(response, StatusCode::NOT_FOUND).await["error"],
        "not_found"
    );
    let calls = Arc::new(AtomicUsize::new(0));
    let count = calls.clone();
    let router = builder()
        .error_handler(move |_, _, _| {
            count.fetch_add(1, Ordering::SeqCst);
            Err(forbidden().into())
        })
        .build();
    let response = send(&router, Method::GET, "/redirect", "", Body::empty()).await;
    assert_eq!(response.status(), StatusCode::TEMPORARY_REDIRECT);
    assert_eq!(response.headers()["location"], "/v1/limited");
    let response = send(&router, Method::GET, "/response", "", Body::empty()).await;
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    assert_eq!(calls.load(Ordering::SeqCst), 0);
    let response = send(&router, Method::GET, "/missing", "", Body::empty()).await;
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
    assert_eq!(calls.load(Ordering::SeqCst), 1);
}

#[tokio::test]
async fn unexpected_errors_expose_the_cause_only_to_the_callback() {
    use topcoat::router::{RouteFn, RouteFuture};

    fn fails(_cx: &topcoat::context::Cx, _body: Body) -> RouteFuture<'_> {
        Box::pin(async { Err(std::io::Error::other("private failure").into()) })
    }

    let router = Router::builder()
        .route(RouteFn::new(Method::GET, "/v1/fail", fails))
        .error_handler(|cx, cause, default| {
            assert!(cause.is::<std::io::Error>());
            assert_eq!(default.status(), StatusCode::INTERNAL_SERVER_ERROR);
            (default.status(), Json("unavailable")).into_response(cx)
        })
        .build();
    let response = send(&router, Method::GET, "/v1/fail", "", Body::empty()).await;
    assert_eq!(
        read_json(response, StatusCode::INTERNAL_SERVER_ERROR).await,
        "unavailable"
    );
}
