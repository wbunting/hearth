use hearth::{
    Result,
    view::{Attributes, Child, StaticClass, View, class, component, view},
};

/// A floating action menu controlled by a trigger.
///
/// Uses a native `<details>` element, so the trigger opens and closes it without
/// JavaScript. Closing it on an outside click requires application scripting. `attrs`
/// are forwarded to the `<details>`, with extra classes added to its classes.
/// Items use normal Tab navigation. The component does not implement the ARIA menu
/// pattern's arrow-key navigation.
#[component]
pub async fn dropdown_menu(
    #[default] mut attrs: Attributes,
    #[default] child: Child<'_>,
) -> Result<impl View> {
    Ok(view! {
        <details
            class=(class!("group relative inline-block", attrs.remove("class")))
            (attrs)
        >
            (child)
        </details>
    })
}

/// Classes that hide the native disclosure marker and show a pointer cursor.
const TRIGGER: StaticClass = class!("cursor-pointer list-none [&::-webkit-details-marker]:hidden",);

/// A trigger that opens or closes the dropdown menu.
///
/// Pass its label as children. To style it as a button, pass classes from
/// [`button_variants`](super::button::button_variants) through `attrs`. The attributes
/// go on the `<summary>`. Use `group-open:` classes to style children while the menu is
/// open.
#[component]
pub async fn dropdown_menu_trigger(
    #[default] mut attrs: Attributes,
    #[default] child: Child<'_>,
) -> Result<impl View> {
    Ok(view! {
        <summary class=(class!(TRIGGER, attrs.remove("class"))) (attrs)>
            (child)
        </summary>
    })
}

/// Classes for floating menu panels with their own background, border, and text color.
const PANEL: StaticClass = class!(
    "absolute z-50 min-w-40 rounded-lg border border-border bg-popover p-1 \
     text-popover-foreground",
);

/// The floating panel of a [`dropdown_menu`], holding the menu's items.
///
/// The panel drops directly below the trigger, aligned to its left edge.
#[component]
pub async fn dropdown_menu_content(
    #[default] mut attrs: Attributes,
    #[default] child: Child<'_>,
) -> Result<impl View> {
    Ok(view! {
        <div
            class=(class!(PANEL, "top-full left-0 mt-1", attrs.remove("class")))
            (attrs)
        >
            (child)
        </div>
    })
}

/// Classes for a menu item and its interaction states.
const ITEM: StaticClass = class!(
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm \
     whitespace-nowrap hover:bg-foreground/5 focus-visible:bg-foreground/5 \
     active:bg-foreground/10 disabled:pointer-events-none disabled:opacity-50",
);

/// One action in a [`dropdown_menu_content`], rendered as a `<button>`.
#[component]
pub async fn dropdown_menu_item(
    #[default] mut attrs: Attributes,
    #[default] child: Child<'_>,
) -> Result<impl View> {
    Ok(view! {
        <button class=(class!(ITEM, attrs.remove("class"))) (attrs)>(child)</button>
    })
}
