# Server-only table fields

A `#[derive(hearth::Table)]` row can keep fields on the server with `#[skip]`.

```rust
#[derive(hearth::Table, Default, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
#[table(name = "accounts", model = Account, scope = account_scope)]
pub struct AccountRow {
    #[key]
    pub id: String,
    pub name: String,
    #[skip]
    pub secret: String,
}
```

The app's `From<Account>` implementation still fills `secret`. It remains available to server Rust code. Hearth excludes it from load JSON, SSR list seeds, full and delta sync responses, mutation responses, client column types, and the browser store schema. A change only to skipped fields does not produce a delta. Changing which fields are synced changes the schema fingerprint and invalidates old cursors and browser cache namespaces.

`live_query!` rejects skipped or unknown columns at compile time in projections, filters, ordering, and join predicates. Skipped fields have no SQL lowering. They cannot also be marked `#[key]`, `#[index]`, `#[computed]`, or listed in `writable(...)`. Their types do not need to implement `RowField`.

Updates use the generated patch, which only contains `writable(...)` fields. A client patch containing a skipped field is rejected. The app's update callback should apply that patch to the existing model, preserving server-only values. Inserts reject fields outside the client schema. The generated insert adapter retains skipped fields from `Row::default()` before calling the app's insert callback, which can supply a server-owned value instead. Neither path accepts client-supplied values for skipped fields.

`#[skip]` controls Hearth's wire boundary, not Serde itself. Direct `serde_json::to_value(row)`, custom endpoints, and captures in runtime expressions still follow the app's Serde implementation and can expose these fields. Add `#[serde(skip)]` too if direct Serde serialization must omit a field. Such fields must support the defaults needed for deserialization. Do not capture server secrets in browser expressions or render them in HTML.
