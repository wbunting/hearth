use hearth::{
    Result,
    view::{Attributes, Child, StaticClass, View, class, component, view},
};

/// Classes for a card with vertically stacked sections. Each section supplies its own
/// horizontal padding so other content can span the full width.
const CARD: StaticClass = class!(
    "flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-card py-3 \
     text-card-foreground",
);

/// A bordered panel. Attributes go on the outer div.
#[component]
pub async fn card(
    #[default] mut attrs: Attributes,
    #[default] child: Child<'_>,
) -> Result<impl View> {
    Ok(view! { <div class=(class!(CARD, attrs.remove("class"))) (attrs)>(child)</div> })
}

/// The opening section of a card.
#[component]
pub async fn card_header(
    #[default] mut attrs: Attributes,
    #[default] child: Child<'_>,
) -> Result<impl View> {
    Ok(view! {
        <div
            class=(class!("flex flex-col gap-1.5 px-3", attrs.remove("class")))
            (attrs)
        >
            (child)
        </div>
    })
}

/// The main body of a [`card`].
#[component]
pub async fn card_content(
    #[default] mut attrs: Attributes,
    #[default] child: Child<'_>,
) -> Result<impl View> {
    Ok(view! { <div class=(class!("px-3", attrs.remove("class"))) (attrs)>(child)</div> })
}
