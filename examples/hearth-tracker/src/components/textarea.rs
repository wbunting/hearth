use topcoat::{
    Result,
    view::{Attributes, Child, StaticClass, View, class, component, view},
};

/// Classes for a textarea that grows with its content. Browsers without content sizing
/// support keep the minimum height and scroll.
const TEXTAREA: StaticClass = class!(
    "field-sizing-content min-h-16 w-full rounded-lg border border-border \
     bg-transparent px-3 py-2 text-sm transition-colors \
     placeholder:text-muted-foreground \
     disabled:pointer-events-none disabled:opacity-50",
);

/// A text input for multiple lines.
///
/// Pass the initial value as children. `attrs` are forwarded to the `<textarea>`, with
/// extra classes added to its classes. It fills its container and grows with its
/// content where the browser supports this. Focus styling comes from the app theme.
#[component]
pub async fn textarea(
    #[default] mut attrs: Attributes,
    #[default] child: Child<'_>,
) -> Result<impl View> {
    Ok(view! {
        <textarea class=(class!(TEXTAREA, attrs.remove("class"))) (attrs)>
            (child)
        </textarea>
    })
}
