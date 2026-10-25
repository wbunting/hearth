use hearth::{
    Result,
    view::{Attributes, Child, StaticClass, View, class, component, view},
};

/// Classes for a native select and its interaction states.
const SELECT: StaticClass = class!(
    "h-9 items-center rounded-lg border border-border \
     bg-transparent px-3 text-left text-sm transition-colors \
     disabled:pointer-events-none",
);

/// A styled native select control.
///
/// Pass options as children. Attributes and event handlers are forwarded to
/// the native select, including runtime bindings. The browser supplies the picker.
#[component]
pub async fn select(
    #[default] mut attrs: Attributes,
    #[default] child: Child<'_>,
) -> Result<impl View> {
    // Keep the platform picker and arrow. Runtime options remain native options.
    Ok(view! {
        <select class=(class!(SELECT, attrs.remove("class"))) (attrs)>(child)</select>
    })
}
