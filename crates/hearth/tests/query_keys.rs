use hearth::{RowTypes, Table, live_query};
use serde::{Deserialize, Serialize};
use topcoat::{Result, context::Cx};

#[derive(toasty::Model)]
struct Model {
    #[key]
    custom_key: String,
    rank: i64,
}

#[derive(Table, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[table(name = "custom", model = Model, scope = scope)]
struct CustomRow {
    #[key]
    custom_key: String,
    rank: i64,
}

impl From<Model> for CustomRow {
    fn from(model: Model) -> Self {
        Self {
            custom_key: model.custom_key,
            rank: model.rank,
        }
    }
}

async fn scope(_: &Cx) -> Result<Option<toasty::stmt::Expr<bool>>> {
    Ok(None)
}

struct Output;
impl RowTypes for Output {
    const TYPES: &'static [(&'static str, &'static str)] = &[("key", "string")];
}

#[test]
fn query_sources_use_derived_wire_key_and_agree_with_schema() {
    let q = live_query! {
        Output from a in CustomRow
        left join b in CustomRow on a.custom_key == b.custom_key
        select { key: a.custom_key }
    };
    let schema = hearth::describe::<CustomRow>();
    assert_eq!(schema.key, "customKey");
    assert_eq!(q.ir.from.key, schema.key);
    assert_eq!(q.ir.joins[0].key, schema.key);
    // The projected list key need not have the table key's name.
    assert_eq!(q.ir.key, "key");
    let wire = serde_json::to_value(q.ir).unwrap();
    assert_eq!(wire["from"]["key"], schema.key);
    assert_eq!(wire["joins"][0]["key"], schema.key);
}

#[test]
fn sql_order_uses_ir_key_for_ties_without_duplicating_explicit_key_order() {
    let mut q = live_query! {
        Output from a in CustomRow
        order by a.rank desc
        limit 2
        select { key: a.custom_key }
    }
    .ir;
    assert_eq!(
        hearth::sql::order::<CustomRow>(&q, &[]),
        vec![
            Model::fields().rank().desc(),
            Model::fields().custom_key().asc()
        ],
    );
    q.order.push(hearth::ir::Order {
        expr: hearth::ir::Expr::Col {
            col: ("a", "customKey"),
        },
        desc: true,
    });
    assert_eq!(
        hearth::sql::order::<CustomRow>(&q, &[]),
        vec![
            Model::fields().rank().desc(),
            Model::fields().custom_key().desc()
        ],
    );
}
