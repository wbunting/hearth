//! Embeds server data as an inert `<script type="application/json">` the
//! client reads before first paint.

use serde::Serialize;
use topcoat::view::Unescaped;

/// `<script type="application/json" id=...>` with `<`, `>` and `&` escaped, so
/// the payload cannot terminate the element or open a comment.
pub fn json_script(id: &str, value: &impl Serialize) -> Unescaped<String> {
    let json = serde_json::to_string(value).expect("snapshot serializes");
    let json = json.replace('<', "\\u003c").replace('>', "\\u003e").replace('&', "\\u0026");
    assert!(id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-'), "bad snapshot id");
    Unescaped::new_unchecked(format!(r#"<script type="application/json" id="{id}">{json}</script>"#))
}
