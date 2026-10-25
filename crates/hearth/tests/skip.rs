//! Wire-level regression tests for server-only table fields.

use hearth::{Table, live_query};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use toasty::Db;
use topcoat::{
    Result,
    context::Cx,
    router::{Body, Router, to_bytes},
    view::view,
};

#[derive(toasty::Model)]
struct Account {
    #[key]
    id: String,
    name: String,
    secret: String,
}

#[derive(Table, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[table(name = "accounts", model = Account, scope = scope, writable(name), update = update, insert = insert)]
struct AccountRow {
    #[key]
    id: String,
    name: String,
    #[skip]
    secret: String,
    // A skipped field need not implement RowField or be a model column.
    #[skip]
    #[serde(skip)]
    server_state: Vec<String>,
}

impl Default for AccountRow {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            secret: "default-server-secret".to_owned(),
            server_state: vec!["default-server-state".to_owned()],
        }
    }
}

impl From<Account> for AccountRow {
    fn from(account: Account) -> Self {
        Self {
            id: account.id,
            name: account.name,
            secret: account.secret,
            server_state: vec!["server-only-state".to_owned()],
        }
    }
}

async fn scope(_: &Cx) -> Result<Option<toasty::stmt::Expr<bool>>> {
    Ok(None)
}

async fn update(cx: &Cx, key: String, patch: AccountRowPatch) -> Result<AccountRow> {
    let mut db = hearth::db(cx);
    if let Some(name) = patch.name {
        Account::filter_by_id(key.clone())
            .update()
            .name(name)
            .exec(&mut db)
            .await?;
    }
    Ok(Account::get_by_id(&mut db, key).await?.into())
}

async fn insert(cx: &Cx, row: AccountRow) -> Result<AccountRow> {
    // Skipped fields arrive as server defaults, never client input.
    assert_eq!(row.secret, "default-server-secret");
    assert_eq!(row.server_state, ["default-server-state"]);
    let mut db = hearth::db(cx);
    Ok(toasty::create!(Account {
        id: row.id,
        name: row.name,
        secret: "inserted-server-secret".to_owned(),
    })
    .exec(&mut db)
    .await?
    .into())
}

hearth::routes!(accounts: AccountRow);

#[hearth::row]
struct DisplayRow {
    id: String,
    name: String,
}

#[topcoat::router::page("/first")]
async fn first(cx: &Cx) -> Result<impl topcoat::view::View> {
    let query = live_query! {
        DisplayRow from a in AccountRow
        select { id: a.id, name: a.name }
    };
    Ok(hearth::client_for(cx, query, |cx, _| {
        Box::pin(view! { cx => <span>"account"</span> })
    }))
}

async fn request(router: &Router, method: &str, uri: &str, body: Value) -> (u16, String) {
    let response = router
        .handle(
            http::Request::builder()
                .method(method)
                .uri(uri)
                .header("content-type", "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await;
    let status = response.status().as_u16();
    let bytes = to_bytes(response.into_body(), usize::MAX).await.unwrap();
    (status, String::from_utf8(bytes.to_vec()).unwrap())
}

async fn get(router: &Router, uri: &str) -> Value {
    let (status, body) = request(router, "GET", uri, Value::Null).await;
    assert_eq!(status, 200, "{body}");
    serde_json::from_str(&body).unwrap()
}

#[tokio::test]
async fn skipped_fields_stay_on_server_across_loads_seeds_and_mutations() {
    let mut db = Db::builder()
        .models(toasty::models!(Account))
        .connect("sqlite::memory:")
        .await
        .unwrap();
    db.push_schema().await.unwrap();
    let model = toasty::create!(Account {
        id: "a".to_owned(),
        name: "Alice".to_owned(),
        secret: "original-server-secret".to_owned(),
    })
    .exec(&mut db)
    .await
    .unwrap();
    let row = AccountRow::from(model);
    assert_eq!(row.secret, "original-server-secret");
    assert_eq!(row.server_state.len(), 1);
    // Ordinary serde remains the application's choice, not the security boundary.
    assert!(serde_json::to_value(row).unwrap().get("secret").is_some());
    let router = Router::builder()
        .discover_routes()
        .page(first)
        .app_context(db.clone())
        .build();
    let expected = json!({"id": "a", "name": "Alice"});
    assert_eq!(
        get(&router, "/_hearth/accounts/load").await,
        json!([expected])
    );
    let full = get(&router, "/_hearth/accounts/load?sync=1").await;
    assert_eq!(full["rows"], json!([expected]));

    // Secret-only edits neither leak data nor trigger a delta.
    Account::filter_by_id("a".to_owned())
        .update()
        .secret("rotated-server-secret")
        .exec(&mut db)
        .await
        .unwrap();
    let delta = get(
        &router,
        &format!(
            "/_hearth/accounts/load?since={}",
            full["cursor"].as_str().unwrap()
        ),
    )
    .await;
    assert_eq!(delta["rows"], json!([]));
    assert_eq!(delta["cursor"], full["cursor"]);
    assert_eq!(delta["full"], false);

    let schema = serde_json::to_value(client_schema("viewer".to_owned())).unwrap();
    assert_eq!(
        schema["tables"][0]["columns"],
        json!({"id": "string", "name": "string"})
    );
    assert_eq!(schema["tables"][0]["indexes"], json!(["id"]));
    assert!(<AccountRow as hearth::sql::SqlColumns>::cmp("secret", "eq", &json!("x")).is_none());
    assert!(<AccountRow as hearth::sql::SqlColumns>::order("secret", false).is_none());

    let (status, html) = request(&router, "GET", "/first", Value::Null).await;
    assert_eq!(status, 200, "{html}");
    let seed = html
        .split("<script type=\"application/json\"")
        .nth(1)
        .unwrap()
        .split_once('>')
        .unwrap()
        .1
        .split("</script>")
        .next()
        .unwrap();
    let seed: Value = serde_json::from_str(seed).unwrap();
    assert_eq!(seed["accounts"], json!([expected]));
    assert!(!html.contains("server-secret") && !html.contains("serverState"));

    for op in [
        json!({"op": "update", "key": "a", "changes": {"secret": "forged"}}),
        json!({"op": "update", "key": "a", "changes": {"serverState": ["forged"]}}),
        json!({"op": "insert", "row": {"id": "b", "secret": "forged"}}),
        json!({"op": "insert", "row": {"id": "b", "serverState": ["forged"]}}),
    ] {
        let (status, _) = request(&router, "POST", "/_hearth/accounts/mutate", op).await;
        assert_eq!(status, 400);
    }
    let (status, body) = request(
        &router,
        "POST",
        "/_hearth/accounts/mutate",
        json!({"op": "update", "key": "a", "changes": {"name": "Alicia"}}),
    )
    .await;
    assert_eq!(status, 200, "{body}");
    assert_eq!(
        serde_json::from_str::<Value>(&body).unwrap(),
        json!({"id": "a", "name": "Alicia"})
    );
    assert_eq!(
        Account::get_by_id(&mut db, "a".to_owned())
            .await
            .unwrap()
            .secret,
        "rotated-server-secret"
    );
    let (status, body) = request(
        &router,
        "POST",
        "/_hearth/accounts/mutate",
        json!({"op": "insert", "row": {"id": "b", "name": "Bob"}}),
    )
    .await;
    assert_eq!(status, 200, "{body}");
    assert_eq!(
        serde_json::from_str::<Value>(&body).unwrap(),
        json!({"id": "b", "name": "Bob"})
    );
    assert_eq!(
        Account::get_by_id(&mut db, "b".to_owned())
            .await
            .unwrap()
            .secret,
        "inserted-server-secret"
    );
    let changed = get(
        &router,
        &format!(
            "/_hearth/accounts/load?since={}",
            delta["cursor"].as_str().unwrap()
        ),
    )
    .await;
    assert_eq!(changed["rows"].as_array().unwrap().len(), 2);
    assert!(
        changed["rows"]
            .as_array()
            .unwrap()
            .iter()
            .all(|r| r.as_object().unwrap().len() == 2)
    );
}

// Row-specific Serde conversions must not be copied to a generated helper type.
#[derive(Table, Clone, Serialize, Deserialize)]
#[serde(into = "serde_json::Value")]
#[table(name = "converted_accounts", model = Account, scope = scope)]
struct ConvertedRow {
    #[key]
    id: String,
    name: String,
    #[skip]
    secret: String,
}

impl From<Account> for ConvertedRow {
    fn from(account: Account) -> Self {
        Self {
            id: account.id,
            name: account.name,
            secret: account.secret,
        }
    }
}

impl From<ConvertedRow> for Value {
    fn from(row: ConvertedRow) -> Self {
        json!({ "id": row.id, "name": row.name.to_uppercase(), "secret": row.secret })
    }
}

#[test]
fn wire_projection_preserves_custom_serde_without_exposing_skipped_fields() {
    let wire = ConvertedRow::to_wire(ConvertedRow {
        id: "a".to_owned(),
        name: "Alice".to_owned(),
        secret: "private".to_owned(),
    })
    .unwrap();
    assert_eq!(wire, json!({ "id": "a", "name": "ALICE" }));
}
