use hearth::{RowTypes, Table, live_query};
use serde::{Deserialize, Serialize};
use topcoat::{Result, context::Cx};

#[derive(toasty::Model)]
struct Model {
    #[key]
    custom_key: String,
}

#[derive(Table, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[table(name = "custom", model = Model, scope = scope)]
struct CustomRow {
    #[key]
    custom_key: String,
}

impl From<Model> for CustomRow {
    fn from(model: Model) -> Self {
        Self {
            custom_key: model.custom_key,
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
