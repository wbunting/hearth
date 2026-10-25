use std::borrow::Cow;

use serde::Serialize;
use topcoat_core::context::Cx;
use topcoat_view::{AttributeValueViewParts, PartsWriter};

/// JavaScript source and captured values for a runtime expression.
///
/// Captured Rust values are serialized as data. Embedding this in a view
/// registers the trusted code for the runtime module route and writes its
/// reference with captures escaped for the surrounding HTML context.
#[derive(Debug, Clone)]
pub struct Js {
    parts: Vec<JsPart>,
}

#[derive(Debug, Clone)]
enum JsPart {
    /// Source text, escaped for the position it renders in.
    Source(Cow<'static, str>),
    /// Trusted scaffolding written verbatim, like the `const [..] = [..]`
    /// wrapper around captured values.
    Raw(&'static str),
    /// A captured value as JSON, hydrated on the client.
    Surrogate(String),
}

impl Js {
    /// Trusted JavaScript source without captured values.
    ///
    /// Never interpolate user input here. Use [`JsBuilder::surrogate`] for
    /// values so they remain data and do not enter shared code modules.
    #[must_use]
    pub fn source(js: impl Into<Cow<'static, str>>) -> Self {
        Self {
            parts: vec![JsPart::Source(js.into())],
        }
    }

    /// Starts source that interleaves captured values.
    #[must_use]
    pub fn builder() -> JsBuilder {
        JsBuilder { parts: Vec::new() }
    }

    /// Returns executable JavaScript, including serialized captured values.
    ///
    /// The source expects the runtime context to be available as `cx`. It is
    /// not escaped for embedding in HTML.
    #[must_use]
    pub fn to_source(&self) -> String {
        let mut source = String::new();
        for part in &self.parts {
            match part {
                JsPart::Source(js) => source.push_str(js),
                JsPart::Raw(js) => source.push_str(js),
                JsPart::Surrogate(json) => {
                    source.push_str("cx.hydrate(");
                    source.push_str(json);
                    source.push(')');
                }
            }
        }
        source
    }

    /// Returns a CSP-safe function reference with captured values kept as data.
    ///
    /// The router's runtime serves the trusted function body as a same-origin
    /// module. Captured values never enter that module or its cache key.
    #[must_use]
    pub fn to_client(&self) -> String {
        let mut source = String::new();
        let mut captures = Vec::new();
        for part in &self.parts {
            match part {
                JsPart::Source(js) => source.push_str(js),
                JsPart::Raw(js) => source.push_str(js),
                JsPart::Surrogate(json) => {
                    use std::fmt::Write;
                    let _ = write!(source, "cx.hydrate(__topcoatCaptures[{}])", captures.len());
                    captures.push(json.as_str());
                }
            }
        }
        let id = crate::expression_module::register(&source);
        format!("#{id}:[{}]", captures.join(","))
    }

    /// Writes a function reference and captures, escaped for the HTML context.
    pub(crate) fn write(&self, parts: &mut PartsWriter<'_>) {
        parts.push_string(self.to_client());
    }
}

/// The source as the value of a `data-topcoat-*` attribute, like an event
/// handler or a bind expression.
impl AttributeValueViewParts for Js {
    #[inline]
    fn attribute_present(&self) -> bool {
        true
    }

    #[inline]
    fn into_view_parts(self, _cx: &Cx, parts: &mut PartsWriter<'_>) {
        self.write(parts);
    }
}

/// Builds a [`Js`] from source and captured values, in order.
#[derive(Debug)]
pub struct JsBuilder {
    parts: Vec<JsPart>,
}

impl JsBuilder {
    /// Appends an expression in parentheses, preserving its captured values.
    #[must_use]
    pub fn expression<T>(mut self, expression: &crate::Expr<T>) -> Self {
        self.parts.push(JsPart::Raw("("));
        self.parts.extend(expression.js.parts.iter().cloned());
        self.parts.push(JsPart::Raw(")"));
        self
    }

    /// Appends trusted source text. Use [`Self::surrogate`] for user data.
    #[must_use]
    pub fn source(mut self, js: impl Into<Cow<'static, str>>) -> Self {
        self.parts.push(JsPart::Source(js.into()));
        self
    }

    /// Appends trusted scaffolding, written verbatim.
    #[must_use]
    pub fn raw(mut self, js: &'static str) -> Self {
        self.parts.push(JsPart::Raw(js));
        self
    }

    /// Appends a captured value, serialized now so the Rust expression can
    /// consume it afterwards.
    ///
    /// # Panics
    ///
    /// Panics if the value fails to serialize.
    #[must_use]
    pub fn surrogate(mut self, value: &(impl Serialize + ?Sized)) -> Self {
        let json = serde_json::to_string(value).expect("failed to serialize surrogate value");
        self.parts.push(JsPart::Surrogate(json));
        self
    }

    /// Finishes the builder into a [`Js`].
    #[must_use]
    pub fn build(self) -> Js {
        Js { parts: self.parts }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn client_reference_shares_code_without_sharing_captured_values() {
        let make = |value: &str| {
            Js::builder()
                .source("[cx.some(")
                .surrogate(value)
                .source("), ")
                .surrogate(&42)
                .source("]")
                .build()
                .to_client()
        };
        let first = make("</script>\"&");
        let second = make("different");
        let (id, data) = first.split_once(':').unwrap();
        assert_eq!(id, second.split_once(':').unwrap().0);
        assert_eq!(
            serde_json::from_str::<serde_json::Value>(data).unwrap(),
            serde_json::json!(["</script>\"&", 42])
        );
        assert_ne!(first, second);
    }

    #[test]
    fn executable_source_preserves_javascript_and_capture_escaping() {
        let js = Js::builder()
            .raw("(() => { const value = ")
            .surrogate(&"\"<>&\n")
            .source("; return value; })()")
            .build();

        assert_eq!(
            js.to_source(),
            r#"(() => { const value = cx.hydrate("\"<>&\n"); return value; })()"#,
        );
    }
}
