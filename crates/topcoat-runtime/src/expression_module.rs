//! [hearth fork] Trusted expression modules, separate from captured request data.

use std::{
    collections::HashMap,
    sync::{OnceLock, RwLock},
};

use sha2::{Digest, Sha256};

fn sources() -> &'static RwLock<HashMap<String, String>> {
    static SOURCES: OnceLock<RwLock<HashMap<String, String>>> = OnceLock::new();
    SOURCES.get_or_init(RwLock::default)
}

pub(crate) fn register(source: &str) -> String {
    use std::fmt::Write;
    let mut id = String::with_capacity(64);
    for byte in Sha256::digest(source.as_bytes()) {
        let _ = write!(id, "{byte:02x}");
    }
    let mut sources = sources().write().expect("expression registry poisoned");
    sources
        .entry(id.clone())
        .or_insert_with(|| source.to_owned());
    id
}

#[cfg(feature = "router")]
pub(crate) fn route() -> topcoat_router::RouteFn {
    use topcoat_router::{Method, RouteFn};
    RouteFn::new(Method::GET, "/_topcoat/expressions.js", |cx, _body| {
        Box::pin(async move {
            use topcoat_router::{StatusCode, header, request::uri, response::IntoResponse};
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
    let sources = sources().read().expect("expression registry poisoned");
    let mut module = String::from("export default {\n");
    for id in ids {
        let source = sources.get(id)?;
        let _ = writeln!(module, "\"{id}\":(cx,__topcoatCaptures)=>({source}\n),");
    }
    module.push_str("};\n");
    Some(module)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serves_only_registered_source_under_its_digest() {
        let id = register("cx.some(__topcoatCaptures[0])");
        let module = module(&id).unwrap();
        assert!(module.contains("(cx,__topcoatCaptures)=>(cx.some(__topcoatCaptures[0])\n)"));
        assert!(module.contains(&id));
        assert!(super::module(&"0".repeat(64)).is_none());
        assert!(super::module("alert(1)").is_none());
        assert!(super::module(&vec![id; 33].join(",")).is_none());
    }
}
