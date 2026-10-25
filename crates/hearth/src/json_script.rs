use serde::Serialize;

use crate::view::Unescaped;

/// An inert JSON script whose payload cannot terminate the element.
///
/// The id may contain only ASCII letters, digits and hyphens.
///
/// # Panics
///
/// Panics if the id is invalid or the value cannot be serialized as JSON.
pub fn json_script(id: &str, value: &impl Serialize) -> Unescaped<String> {
    assert!(
        id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-'),
        "bad JSON script id"
    );
    let json = serde_json::to_string(value).expect("JSON script value serializes");
    let json = json
        .replace('<', r"\u003c")
        .replace('>', r"\u003e")
        .replace('&', r"\u0026");
    Unescaped::new_unchecked(format!(
        r#"<script type="application/json" id="{id}">{json}</script>"#
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn delimiters_round_trip_without_ending_the_script() {
        let value = "</script><!--&>";
        let html = json_script("seed-1", &value);
        let json = html
            .split_once('>')
            .unwrap()
            .1
            .strip_suffix("</script>")
            .unwrap();
        assert!(!json.contains(['<', '>', '&']));
        assert_eq!(serde_json::from_str::<String>(json).unwrap(), value);
    }

    #[test]
    #[should_panic]
    fn rejects_ids_that_can_escape_the_attribute() {
        json_script("\" onload=\"", &());
    }

    #[test]
    #[should_panic]
    fn rejects_unserializable_values() {
        struct Invalid;
        impl Serialize for Invalid {
            fn serialize<S: serde::Serializer>(&self, _: S) -> Result<S::Ok, S::Error> {
                Err(serde::ser::Error::custom("cannot serialize"))
            }
        }
        json_script("seed-1", &Invalid);
    }
}
