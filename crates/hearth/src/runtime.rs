#![doc = include_str!("../docs/runtime.md")]

pub use hearth_runtime::*;
pub use hearth_runtime_macro::*;

/// The `<script>` tag loading the browser runtime.
///
/// # Panics
///
/// Panics if the router was built without
/// [`runtime()`](RouterBuilderRuntimeExt::runtime).
#[cfg(feature = "view")]
#[crate::view::component]
pub async fn script(cx: &crate::context::Cx) -> crate::Result<impl crate::view::View> {
    assert!(
        crate::context::try_app_context::<RuntimeSetup>(cx).is_some(),
        "the browser runtime is not set up on this router; call `.runtime()` on the router builder",
    );
    Ok(crate::view::view! {
        <script
            type="module"
            src=(crate::runtime::SCRIPT)
            data-hearth-usize-bits=(usize::BITS)
            data-hearth-persistence=(crate::runtime::PERSISTENCE)
        ></script>
    })
}
