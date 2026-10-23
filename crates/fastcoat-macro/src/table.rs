//! `#[derive(Table)]`: a synced table from a wire struct.
//!
//! ```ignore
//! #[derive(Table, Clone, Debug, Default, Serialize, Deserialize)]
//! #[table(name = "issues", model = Issue, scope = issue_scope, writable(open, title, assignee_id), update = update_issue)]
//! pub struct IssueRow {
//!     #[key] pub id: String,
//!     #[index] pub short_id: i64,
//!     #[index] pub modified: i64,
//!     #[computed] pub href: String,   // not a model column (no SQL lowering)
//!     ...
//! }
//! ```
//! Generates:
//! - `impl fastcoat::Table` (name, key, columns, indexes, load/first/update)
//! - `impl fastcoat::sql::SqlColumns` (typed IR → Toasty lowering per column)
//! - `From<Model> for Row` is the app's job (it chooses computed fields)
//!
//! - `scope`: `async fn(&Cx) -> Result<Option<toasty::stmt::Expr<bool>>>`,
//!   a filter applied to *every* read (load + SSR first view). Required.
//! - `update`: `async fn(&Cx, key: String, patch: <Row>Patch) -> Result<Row>`;
//!   the generated `<Row>Patch` has `Option<T>` for each `writable` field,
//!   so the client can only send whitelisted fields.

use proc_macro2::TokenStream as Ts;
use quote::{format_ident, quote};
use syn::{Data, DeriveInput, Fields, Ident, Meta, Token, punctuated::Punctuated};

struct Opts {
    name: syn::LitStr,
    model: syn::Path,
    scope: syn::Path,
    update: Option<syn::Path>,
    insert: Option<syn::Path>,
    delete: Option<syn::Path>,
    writable: Vec<Ident>,
}

pub fn derive(input: DeriveInput) -> syn::Result<Ts> {
    let row = &input.ident;
    let mut name = None;
    let mut model = None;
    let mut scope = None;
    let mut update = None;
    let mut insert = None;
    let mut delete = None;
    let mut writable = Vec::new();
    for attr in input.attrs.iter().filter(|a| a.path().is_ident("table")) {
        let metas = attr.parse_args_with(Punctuated::<Meta, Token![,]>::parse_terminated)?;
        for m in metas {
            match &m {
                Meta::NameValue(nv) if nv.path.is_ident("name") => name = Some(syn::parse2(quote_expr(&nv.value))?),
                Meta::NameValue(nv) if nv.path.is_ident("model") => model = Some(syn::parse2(quote_expr(&nv.value))?),
                Meta::NameValue(nv) if nv.path.is_ident("scope") => scope = Some(syn::parse2(quote_expr(&nv.value))?),
                Meta::NameValue(nv) if nv.path.is_ident("update") => update = Some(syn::parse2(quote_expr(&nv.value))?),
                Meta::NameValue(nv) if nv.path.is_ident("insert") => insert = Some(syn::parse2(quote_expr(&nv.value))?),
                Meta::NameValue(nv) if nv.path.is_ident("delete") => delete = Some(syn::parse2(quote_expr(&nv.value))?),
                Meta::List(l) if l.path.is_ident("writable") => {
                    writable = l.parse_args_with(Punctuated::<Ident, Token![,]>::parse_terminated)?.into_iter().collect();
                }
                other => return Err(syn::Error::new_spanned(other, "unknown #[table] option")),
            }
        }
    }
    let o = Opts {
        name: name.ok_or_else(|| syn::Error::new_spanned(row, "#[table(name = \"...\")] is required"))?,
        model: model.ok_or_else(|| syn::Error::new_spanned(row, "#[table(model = ...)] is required"))?,
        scope: scope.ok_or_else(|| {
            syn::Error::new_spanned(row, "#[table(scope = fn)] is required: every synced table must declare who can read which rows")
        })?,
        update,
        insert,
        delete,
        writable,
    };

    let Data::Struct(s) = &input.data else { return Err(syn::Error::new_spanned(row, "Table needs a struct")) };
    let Fields::Named(fields) = &s.fields else { return Err(syn::Error::new_spanned(row, "Table needs named fields")) };

    let mut key = None;
    let mut columns = Vec::new();
    let mut indexes = Vec::new();
    let mut sql_cmp = Vec::new();
    let mut sql_order = Vec::new();
    let mut patch_fields = Vec::new();
    for f in &fields.named {
        let ident = f.ident.clone().unwrap();
        let wire = camel(&ident.to_string());
        let ty = &f.ty;
        let is = |n: &str| f.attrs.iter().any(|a| a.path().is_ident(n));
        if is("key") {
            key = Some(wire.clone());
            indexes.push(wire.clone());
        }
        if is("index") {
            indexes.push(wire.clone());
        }
        columns.push(quote!((#wire, <#ty as ::fastcoat::RowField>::TYPE)));
        if !is("computed") {
            // Typed lowering: deserialize the JSON value as the column type,
            // then build the Toasty predicate on `Model::fields().<ident>()`.
            let model = &o.model;
            sql_cmp.push(quote! {
                #wire => {
                    let path = <#model>::fields().#ident();
                    match op {
                        "contains" => ::fastcoat::__private::Contains::contains(path, value.as_str()?),
                        "in" => {
                            let v: ::std::vec::Vec<#ty> = ::fastcoat::__private::serde_json::from_value(value.clone()).ok()?;
                            ::core::option::Option::Some(path.in_list(v))
                        }
                        _ => {
                            let v: #ty = ::fastcoat::__private::serde_json::from_value(value.clone()).ok()?;
                            ::core::option::Option::Some(match op {
                                "eq" => path.eq(v),
                                "ne" => path.ne(v),
                                "lt" => path.lt(v),
                                "lte" => path.le(v),
                                "gt" => path.gt(v),
                                "gte" => path.ge(v),
                                _ => return ::core::option::Option::None,
                            })
                        }
                    }
                }
            });
            sql_order.push(quote! {
                #wire => { let p = <#model>::fields().#ident(); ::core::option::Option::Some(if desc { p.desc() } else { p.asc() }) }
            });
        }
        if o.writable.iter().any(|w| *w == ident) {
            patch_fields.push(quote!(pub #ident: ::core::option::Option<#ty>));
        }
    }
    let key = key.ok_or_else(|| syn::Error::new_spanned(row, "mark one field #[key]"))?;
    let name = &o.name;
    let model = &o.model;
    let scope = &o.scope;
    let patch = format_ident!("{}Patch", row);
    let new_row = format_ident!("New{}", row);

    let update_impl = o.update.as_ref().map(|u| {
        quote! {
            fn update<'a>(cx: &'a ::topcoat::context::Cx, key: ::std::string::String, changes: ::fastcoat::ir::JsonRow)
                -> ::fastcoat::table::BoxFut<'a, Self>
            {
                ::std::boxed::Box::pin(async move {
                    // Only whitelisted (`writable(...)`) fields deserialize.
                    let patch: #patch = ::fastcoat::__private::serde_json::from_value(
                        ::fastcoat::__private::serde_json::Value::Object(changes),
                    ).map_err(|e| ::topcoat::router::error::bad_request(e.to_string()))?;
                    #u(cx, key, patch).await
                })
            }
        }
    });
    let insert_impl = o.insert.as_ref().map(|i| {
        quote! {
            fn insert<'a>(cx: &'a ::topcoat::context::Cx, row: ::fastcoat::ir::JsonRow) -> ::fastcoat::table::BoxFut<'a, Self> {
                ::std::boxed::Box::pin(async move {
                    // Missing fields take their defaults: server-owned fields
                    // (creator, timestamps, derived keys) are set by `insert`.
                    let mut full = ::fastcoat::__private::serde_json::to_value(<Self as ::core::default::Default>::default())
                        .map_err(|e| ::topcoat::router::error::internal_server_error(e))?;
                    if let ::fastcoat::__private::serde_json::Value::Object(m) = &mut full {
                        for (k, v) in row { m.insert(k, v); }
                    }
                    let row: Self = ::fastcoat::__private::serde_json::from_value(full)
                        .map_err(|e| ::topcoat::router::error::bad_request(e.to_string()))?;
                    #i(cx, row).await
                })
            }
        }
    });
    let delete_impl = o.delete.as_ref().map(|d| {
        quote! {
            fn delete<'a>(cx: &'a ::topcoat::context::Cx, key: ::std::string::String) -> ::fastcoat::table::BoxFut<'a, ()> {
                ::std::boxed::Box::pin(async move { #d(cx, key).await })
            }
        }
    });
    let writes = [o.update.is_some(), o.insert.is_some(), o.delete.is_some()];
    let [can_update, can_insert, can_delete] = writes;
    let _ = new_row;

    Ok(quote! {
        #[derive(::core::fmt::Debug, ::core::default::Default, ::serde::Deserialize)]
        #[serde(rename_all = "camelCase", deny_unknown_fields)]
        #[allow(dead_code)]
        pub struct #patch { #(#patch_fields,)* }

        impl ::fastcoat::sql::SqlColumns for #row {
            type Model = #model;
            fn cmp(col: &str, op: &str, value: &::fastcoat::__private::serde_json::Value) -> ::core::option::Option<::toasty::stmt::Expr<bool>> {
                match col { #(#sql_cmp)* _ => ::core::option::Option::None }
            }
            fn order(col: &str, desc: bool) -> ::core::option::Option<::toasty::stmt::OrderByExpr> {
                match col { #(#sql_order)* _ => ::core::option::Option::None }
            }
        }

        impl ::fastcoat::Table for #row {
            type Row = Self;
            const NAME: &'static str = #name;
            const KEY: &'static str = #key;
            const COLUMNS: &'static [(&'static str, &'static str)] = &[#(#columns),*];
            const WRITES: (bool, bool, bool) = (#can_update, #can_insert, #can_delete);
            fn indexes() -> ::std::vec::Vec<&'static str> { ::std::vec![#(#indexes),*] }

            fn load(cx: &::topcoat::context::Cx) -> ::fastcoat::table::BoxFut<'_, ::std::vec::Vec<Self>> {
                ::std::boxed::Box::pin(async move {
                    let scope = #scope(cx).await?;
                    ::fastcoat::table::run_query::<Self>(cx, scope, ::core::option::Option::None, &[], ::core::option::Option::None).await
                })
            }

            fn load_first<'a>(cx: &'a ::topcoat::context::Cx, q: &'a ::fastcoat::ir::Query, params: &'a [::fastcoat::__private::serde_json::Value])
                -> ::fastcoat::table::BoxFut<'a, ::std::vec::Vec<Self>>
            {
                ::std::boxed::Box::pin(async move {
                    let scope = #scope(cx).await?;
                    let lowered = ::fastcoat::sql::lower_where::<Self>(q, params);
                    let order = ::fastcoat::sql::order::<Self>(q, params);
                    // Push `limit` only when every predicate ran in SQL;
                    // otherwise over-fetch for the in-memory pass.
                    let limit = q.limit.map(|n| if lowered.complete { n } else { n * 8 });
                    ::fastcoat::table::run_query::<Self>(cx, scope, lowered.filter, &order, limit).await
                })
            }

            #update_impl
            #insert_impl
            #delete_impl
        }
    })
}

fn quote_expr(e: &syn::Expr) -> Ts {
    quote!(#e)
}

pub fn camel(s: &str) -> String {
    let mut out = String::new();
    let mut up = false;
    for ch in s.chars() {
        if ch == '_' {
            up = true;
        } else if up {
            out.extend(ch.to_uppercase());
            up = false;
        } else {
            out.push(ch);
        }
    }
    out
}
