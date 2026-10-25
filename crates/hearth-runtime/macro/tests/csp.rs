use hearth::{
    context::Cx,
    runtime::{Expr, RouterBuilderRuntimeExt, expr},
    view::{ViewExt, attributes, view},
};

// This function is intentionally never called by the registry test. Its code
// must be available even in a process that has not rendered its shard/page.
fn unrendered(value: String) -> Expr<String> {
    expr!(value.trim().to_owned())
}

#[tokio::test]
async fn macro_code_is_available_before_the_expression_is_evaluated() {
    use hearth::router::{Body, Router, to_bytes};
    let _ = unrendered as fn(String) -> Expr<String>;
    let source = hearth::runtime::internal::inventory::iter::<
        hearth::runtime::expression_module::ExpressionSource,
    >
        .into_iter()
        .find(|entry| entry.0.contains(".trim().to_owned()"))
        .unwrap()
        .0;
    // Obtain a ref without calling the expression-producing function.
    let reference = hearth::runtime::Js::builder()
        .compiled(source)
        .build()
        .to_client();
    let id = reference[1..].split(':').next().unwrap();
    let router = Router::builder().runtime().build();
    let request = http::Request::builder()
        .uri(format!("/_hearth/expressions.js?ids={id}"))
        .body(Body::empty())
        .unwrap();
    let response = router.handle(request).await;
    assert_eq!(response.status(), http::StatusCode::OK);
    let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
    assert!(String::from_utf8(body.to_vec()).unwrap().contains(source));
}

#[tokio::test]
async fn literal_handlers_in_views_and_attributes_emit_registered_references() {
    let cx = &Cx::default();
    let __cx = cx;
    let attrs = attributes! { @click="() => window.literal = 2" };
    let html = view! { cx =>
        <button @click="() => window.literal = 1">"direct"</button>
        <button (attrs)>"spread"</button>
    }
    .single()
    .await
    .unwrap()
    .render(cx);
    assert_eq!(html.matches("data-hearth-on:click=\"#").count(), 2);
    assert!(!html.contains("window.literal"));
    let sources = hearth::runtime::internal::inventory::iter::<
        hearth::runtime::expression_module::ExpressionSource,
    >
        .into_iter()
        .map(|entry| entry.0)
        .collect::<Vec<_>>();
    assert!(sources.contains(&"() => window.literal = 1"));
    assert!(sources.contains(&"() => window.literal = 2"));
}
