use topcoat::{
    Result,
    view::{Attributes, StaticClass, View, class, component, view},
};

/// Classes for the input's dimensions, border, and interaction states.
const INPUT: StaticClass = class!(
    "h-9 w-full min-w-0 rounded-lg border border-border bg-transparent px-3 \
     text-sm transition-colors \
     placeholder:text-muted-foreground \
     disabled:pointer-events-none disabled:opacity-50",
);

/// A styled input.
///
/// Pass input attributes and event handlers through `attrs`. Extra classes are added to
/// the input's classes. It fills its container by default. The focus outline comes from the app
/// theme.
#[component]
pub async fn input(#[default] mut attrs: Attributes) -> Result<impl View> {
    Ok(view! { <input class=(class!(INPUT, attrs.remove("class"))) (attrs)> })
}
