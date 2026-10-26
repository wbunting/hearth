//! [hearth fork] Trusted expression modules, separate from captured request data.

#[cfg(any(feature = "router", test))]
use std::{collections::HashMap, sync::OnceLock};

use sha2::{Digest, Sha256};

/// Trusted function source collected by expression macros at link time.
pub struct ExpressionSource(pub &'static str);
inventory::collect!(ExpressionSource);

pub(crate) fn digest(source: &str) -> String {
    use std::fmt::Write;
    let mut id = String::with_capacity(64);
    for byte in Sha256::digest(source.as_bytes()) {
        let _ = write!(id, "{byte:02x}");
    }
    id
}

#[cfg(any(feature = "router", test))]
fn sources() -> &'static HashMap<String, String> {
    static SOURCES: OnceLock<HashMap<String, String>> = OnceLock::new();
    SOURCES.get_or_init(|| {
        inventory::iter::<ExpressionSource>
            .into_iter()
            .map(|entry| (digest(entry.0), entry.0.to_owned()))
            .collect()
    })
}

#[cfg(feature = "router")]
pub(crate) fn route() -> hearth_router::RouteFn {
    use hearth_router::{Method, RouteFn};
    let _ = sources();
    RouteFn::new(Method::GET, "/_hearth/expressions.js", |cx, _body| {
        Box::pin(async move {
            use hearth_router::{StatusCode, header, request::uri, response::IntoResponse};
            let ids = uri(cx)
                .query()
                .unwrap_or("")
                .strip_prefix("ids=")
                .unwrap_or("");
            let Some(module) = module(ids) else {
                return StatusCode::NOT_FOUND.into_response(cx);
            };
            (
                [
                    (header::CONTENT_TYPE, "text/javascript; charset=utf-8"),
                    (header::CACHE_CONTROL, "public, max-age=31536000, immutable"),
                    (header::X_CONTENT_TYPE_OPTIONS, "nosniff"),
                ],
                module,
            )
                .into_response(cx)
        })
    })
}

#[cfg(any(feature = "router", test))]
fn module(ids: &str) -> Option<String> {
    use std::fmt::Write;
    let ids: Vec<_> = ids.split(',').collect();
    if ids.is_empty()
        || ids.len() > 32
        || ids.iter().any(|id| {
            id.len() != 64
                || !id
                    .bytes()
                    .all(|c| c.is_ascii_hexdigit() && !c.is_ascii_uppercase())
        })
    {
        return None;
    }
    let sources = sources();
    let mut module = String::from("export default {\n");
    for id in ids {
        let source = sources.get(id)?;
        let _ = writeln!(module, "\"{id}\":(cx,__hearthCaptures)=>({source}\n),");
    }
    module.push_str("};\n");
    Some(module)
}

#[cfg(test)]
mod tests {
    use super::*;

    inventory::submit! { ExpressionSource("cx.some(__hearthCaptures[0])") }

    #[test]
    fn serves_only_registered_source_under_its_digest() {
        let id = digest("cx.some(__hearthCaptures[0])");
        let module = module(&id).unwrap();
        assert!(module.contains("(cx,__hearthCaptures)=>(cx.some(__hearthCaptures[0])\n)"));
        assert!(module.contains(&id));
        assert!(super::module(&"0".repeat(64)).is_none());
        assert!(super::module("alert(1)").is_none());
        assert!(super::module(&vec![id; 33].join(",")).is_none());
    }
}
