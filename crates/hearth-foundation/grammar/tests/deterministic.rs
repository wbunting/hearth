use hearth_foundation_grammar::{memoize::Memoize, testing::assert_deterministic};
use quote::quote;

#[test]
fn memoize() {
    assert_deterministic(|| {
        Memoize::parse(
            quote! {},
            quote! {
                fn add(cx: &Cx, x: i32, y: i32) -> i32 {
                    x + y
                }
            },
        )
    });
    assert_deterministic(|| {
        Memoize::parse(
            quote! { as_ref },
            quote! {
                async fn load(cx: &Cx, id: u64) -> Result<String> {
                    Ok(id.to_string())
                }
            },
        )
    });
}
