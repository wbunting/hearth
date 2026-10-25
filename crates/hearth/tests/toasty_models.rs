//! Wildcard discovery does not recurse once per model in Toasty 0.11.

include!("fixtures/toasty_models.rs");

#[test]
fn wildcard_discovers_all_models_at_default_recursion_limit() {
    let models = toasty::models!(crate::*);
    let ids: std::collections::HashSet<_> = models.into_iter().map(|model| model.id()).collect();
    assert_eq!(ids, expected_ids());
}

#[test]
fn explicit_list_registers_only_selected_models() {
    use toasty::schema::Model;

    let models = toasty::models!(M000, M127);
    let ids: std::collections::HashSet<_> = models.into_iter().map(|model| model.id()).collect();
    assert_eq!(ids, [M000::id(), M127::id()].into_iter().collect());
}
