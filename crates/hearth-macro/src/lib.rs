//! `live_query!`: a small query DSL compiled to the shared IR.
//!
//! ```ignore
//! live_query! {
//!     IssueRow from i in Issues
//!     left join c in Users on i.creator_id == c.id
//!     where i.open == $(open.get()) && if $(creator.get()) { i.creator_id == $(creator.get()) }
//!     order by i.modified desc
//!     limit 200
//!     select { id: i.id, title: i.title, open: i.open, creator: c.login }
//! }
//! ```
//! - `IssueRow`: the `#[record]` row type the loop body sees.
//! - `Issues`, `Users`: types implementing `hearth::Table`.
//! - `$(...)`: a Topcoat runtime expression (server value + JS); re-runs the
//!   query in the browser when the signals it reads change.
//! - Columns are written in snake_case and map to camelCase wire fields.

use proc_macro::TokenStream;
use proc_macro2::{Span, TokenStream as Ts};
use quote::quote;
use syn::{
    Ident, LitInt, Token, braced,
    parse::{Parse, ParseStream},
    parse_macro_input,
    token::Brace,
};

mod table;

/// See `hearth::Table`.
#[proc_macro_derive(Table, attributes(table, key, index, computed, skip))]
pub fn derive_table(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as syn::DeriveInput);
    table::derive(input).unwrap_or_else(syn::Error::into_compile_error).into()
}

/// `hearth::routes!(issues: IssueRow, users: UserRow, ...)`: load + mutate
/// endpoints for each table and a `client_schema(scope)` fn listing them.
/// The names must match each table's `#[table(name = ...)]` (checked at runtime
/// on first request; route paths must be literals at macro time).
#[proc_macro]
pub fn routes(input: TokenStream) -> TokenStream {
    use syn::{Token, punctuated::Punctuated};
    struct Entry {
        name: Ident,
        ty: syn::Path,
    }
    impl Parse for Entry {
        fn parse(input: ParseStream) -> syn::Result<Self> {
            let name = input.parse()?;
            input.parse::<Token![:]>()?;
            Ok(Entry { name, ty: input.parse()? })
        }
    }
    let entries = parse_macro_input!(input with Punctuated::<Entry, Token![,]>::parse_terminated);
    let mut items = Vec::new();
    let mut describes = Vec::new();
    for Entry { name, ty: t } in &entries {
        let snake = name.to_string();
        let load_path = format!("/_hearth/{snake}/load");
        let mutate_path = format!("/_hearth/{snake}/mutate");
        let load = quote::format_ident!("__hearth_load_{}", snake);
        let mutate = quote::format_ident!("__hearth_mutate_{}", snake);
        items.push(quote! {
            #[::topcoat::router::route(GET #load_path)]
            async fn #load(cx: &::topcoat::context::Cx) -> ::topcoat::Result<::topcoat::router::content::Json<::hearth::sync::LoadBody<::hearth::__private::serde_json::Value>>> {
                ::hearth::table::check_table::<#t>(#snake)?;
                ::core::result::Result::Ok(::topcoat::router::content::Json(::hearth::sync::load_route::<#t>(cx).await?))
            }
            #[::topcoat::router::route(POST #mutate_path)]
            async fn #mutate(cx: &::topcoat::context::Cx, ::topcoat::router::content::Json(m): ::topcoat::router::content::Json<::hearth::table::Mutation>)
                -> ::topcoat::Result<::topcoat::router::content::Json<::hearth::__private::serde_json::Value>>
            {
                ::hearth::table::check_table::<#t>(#snake)?;
                ::core::result::Result::Ok(::topcoat::router::content::Json(::hearth::table::mutation_route::<#t>(cx, m).await?))
            }
        });
        describes.push(quote!(::hearth::table::describe::<#t>()));
    }
    quote! {
        #(#items)*
        /// Client schema for the synced tables (embedded in pages).
        pub fn client_schema(scope: ::std::string::String) -> ::hearth::ClientSchema {
            ::hearth::client_schema(scope, ::std::vec![#(#describes),*])
        }
    }
    .into()
}


#[proc_macro]
pub fn live_query(input: TokenStream) -> TokenStream {
    let q = parse_macro_input!(input as Q);
    q.expand().into()
}

mod kw {
    syn::custom_keyword!(from);
    syn::custom_keyword!(join);
    syn::custom_keyword!(left);
    syn::custom_keyword!(inner);
    syn::custom_keyword!(on);
    syn::custom_keyword!(order);
    syn::custom_keyword!(by);
    syn::custom_keyword!(desc);
    syn::custom_keyword!(asc);
    syn::custom_keyword!(limit);
    syn::custom_keyword!(select);
    syn::custom_keyword!(contains);
}

struct Source {
    alias: Ident,
    table: syn::Path,
}

struct JoinQ {
    kind: &'static str,
    src: Source,
    l: E,
    r: E,
}

enum E {
    Col(Ident, Ident),
    Lit(syn::Lit),
    Param(Ts),
    Bin(&'static str, Box<E>, Box<E>),
    And(Vec<E>),
    Or(Vec<E>),
    Not(Box<E>),
    If(Ts, Box<E>),
}

struct Q {
    row: syn::Path,
    from: Source,
    joins: Vec<JoinQ>,
    where_: Option<E>,
    order: Vec<(E, bool)>,
    limit: Option<LitInt>,
    select: Vec<(Ident, E)>,
}

impl Parse for Q {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let row: syn::Path = input.parse()?;
        input.parse::<kw::from>()?;
        let from = source(input)?;
        let mut joins = Vec::new();
        loop {
            let kind = if input.peek(kw::left) {
                input.parse::<kw::left>()?;
                "left"
            } else if input.peek(kw::inner) {
                input.parse::<kw::inner>()?;
                "inner"
            } else if input.peek(kw::join) {
                "left"
            } else {
                break;
            };
            input.parse::<kw::join>()?;
            let src = source(input)?;
            input.parse::<kw::on>()?;
            let l = atom(input)?;
            input.parse::<Token![==]>()?;
            let r = atom(input)?;
            joins.push(JoinQ { kind, src, l, r });
        }
        let where_ = if input.peek(Token![where]) {
            input.parse::<Token![where]>()?;
            Some(or_expr(input)?)
        } else {
            None
        };
        let mut order = Vec::new();
        if input.peek(kw::order) {
            input.parse::<kw::order>()?;
            input.parse::<kw::by>()?;
            loop {
                let e = atom(input)?;
                let desc = if input.peek(kw::desc) {
                    input.parse::<kw::desc>()?;
                    true
                } else {
                    if input.peek(kw::asc) {
                        input.parse::<kw::asc>()?;
                    }
                    false
                };
                order.push((e, desc));
                if !input.peek(Token![,]) {
                    break;
                }
                input.parse::<Token![,]>()?;
            }
        }
        let limit = if input.peek(kw::limit) {
            input.parse::<kw::limit>()?;
            Some(input.parse()?)
        } else {
            None
        };
        if limit.is_some() && order.is_empty() {
            return Err(syn::Error::new(
                input.span(),
                "`limit` requires `order by` (TanStack DB needs a deterministic order for limited queries)",
            ));
        }
        input.parse::<kw::select>()?;
        let content;
        braced!(content in input);
        let mut select = Vec::new();
        while !content.is_empty() {
            let name: Ident = content.parse()?;
            content.parse::<Token![:]>()?;
            let e = atom(&content)?;
            select.push((name, e));
            if content.peek(Token![,]) {
                content.parse::<Token![,]>()?;
            }
        }
        Ok(Q { row, from, joins, where_, order, limit, select })
    }
}

fn source(input: ParseStream) -> syn::Result<Source> {
    let alias: Ident = input.parse()?;
    input.parse::<Token![in]>()?;
    let table: syn::Path = input.parse()?;
    Ok(Source { alias, table })
}

fn or_expr(input: ParseStream) -> syn::Result<E> {
    let mut args = vec![and_expr(input)?];
    while input.peek(Token![||]) {
        input.parse::<Token![||]>()?;
        args.push(and_expr(input)?);
    }
    Ok(if args.len() == 1 { args.pop().unwrap() } else { E::Or(args) })
}

fn and_expr(input: ParseStream) -> syn::Result<E> {
    let mut args = vec![cmp_expr(input)?];
    while input.peek(Token![&&]) {
        input.parse::<Token![&&]>()?;
        args.push(cmp_expr(input)?);
    }
    Ok(if args.len() == 1 { args.pop().unwrap() } else { E::And(args) })
}

fn cmp_expr(input: ParseStream) -> syn::Result<E> {
    if input.peek(Token![!]) {
        input.parse::<Token![!]>()?;
        return Ok(E::Not(Box::new(cmp_expr(input)?)));
    }
    if input.peek(Token![if]) {
        // `if $(cond) { pred }`: optional filter, dropped when cond is falsy.
        input.parse::<Token![if]>()?;
        input.parse::<Token![$]>()?;
        let c;
        syn::parenthesized!(c in input);
        let cond: Ts = c.parse()?;
        let body;
        braced!(body in input);
        return Ok(E::If(cond, Box::new(or_expr(&body)?)));
    }
    if input.peek(syn::token::Paren) {
        let c;
        syn::parenthesized!(c in input);
        return or_expr(&c);
    }
    let l = atom(input)?;
    let op = if input.peek(Token![==]) {
        input.parse::<Token![==]>()?;
        "eq"
    } else if input.peek(Token![!=]) {
        input.parse::<Token![!=]>()?;
        "ne"
    } else if input.peek(Token![<=]) {
        input.parse::<Token![<=]>()?;
        "lte"
    } else if input.peek(Token![>=]) {
        input.parse::<Token![>=]>()?;
        "gte"
    } else if input.peek(Token![<]) {
        input.parse::<Token![<]>()?;
        "lt"
    } else if input.peek(Token![>]) {
        input.parse::<Token![>]>()?;
        "gt"
    } else if input.peek(Token![in]) {
        input.parse::<Token![in]>()?;
        "in"
    } else if input.peek(kw::contains) {
        input.parse::<kw::contains>()?;
        "contains"
    } else {
        return Ok(l); // boolean column / param
    };
    let r = atom(input)?;
    Ok(E::Bin(op, Box::new(l), Box::new(r)))
}

fn atom(input: ParseStream) -> syn::Result<E> {
    if input.peek(Token![$]) {
        input.parse::<Token![$]>()?;
        let c;
        syn::parenthesized!(c in input);
        return Ok(E::Param(c.parse()?));
    }
    if input.peek(syn::Lit) {
        return Ok(E::Lit(input.parse()?));
    }
    let a: Ident = input.parse()?;
    input.parse::<Token![.]>()?;
    let c: Ident = input.parse()?;
    Ok(E::Col(a, c))
}

fn camel(s: &str) -> String {
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

struct Ctx {
    params: Vec<Ts>,
    sources: Vec<(String, syn::Path)>,
}

impl E {
    fn lower(&self, cx: &mut Ctx) -> Ts {
        let ir = quote!(::hearth::ir);
        match self {
            E::Col(a, c) => {
                let alias = a;
                let a = a.to_string();
                let c = camel(&c.to_string());
                let Some((_, table)) = cx.sources.iter().find(|(alias, _)| *alias == a) else {
                    return syn::Error::new_spanned(alias, "unknown query alias").to_compile_error();
                };
                let message = format!("column {a}.{c} is not synced (unknown or #[skip])");
                quote!({
                    const { assert!(::hearth::table::has_column::<#table>(#c), #message); }
                    #ir::Expr::Col { col: (#a, #c) }
                })
            }
            E::Lit(l) => quote!(#ir::Expr::Lit { lit: ::hearth::__private::serde_json::json!(#l) }),
            E::Param(ts) => {
                let i = cx.params.len();
                cx.params.push(ts.clone());
                quote!(#ir::Expr::Param { param: #i })
            }
            E::Bin(op, l, r) => {
                let (l, r) = (l.lower(cx), r.lower(cx));
                quote!(#ir::Expr::Bin { op: #op, l: Box::new(#l), r: Box::new(#r) })
            }
            E::And(args) | E::Or(args) => {
                let op = if matches!(self, E::And(_)) { "and" } else { "or" };
                let args: Vec<_> = args.iter().map(|a| a.lower(cx)).collect();
                quote!(#ir::Expr::Many { op: #op, args: vec![#(#args),*] })
            }
            E::Not(a) => {
                let a = a.lower(cx);
                quote!(#ir::Expr::Not { op: "not", arg: Box::new(#a) })
            }
            E::If(cond, then) => {
                let i = cx.params.len();
                cx.params.push(cond.clone());
                let then = then.lower(cx);
                quote!(#ir::Expr::If { op: "if", cond: Box::new(#ir::Expr::Param { param: #i }), then: Box::new(#then) })
            }
        }
    }
}

impl Q {
    fn expand(&self) -> Ts {
        let ir = quote!(::hearth::ir);
        let mut cx = Ctx {
            params: Vec::new(),
            sources: std::iter::once(&self.from)
                .chain(self.joins.iter().map(|j| &j.src))
                .map(|s| (s.alias.to_string(), s.table.clone()))
                .collect(),
        };
        let row = &self.row;
        let from_alias = self.from.alias.to_string();
        let from_table = &self.from.table;

        let joins: Vec<_> = self
            .joins
            .iter()
            .map(|j| {
                let alias = j.src.alias.to_string();
                let table = &j.src.table;
                let kind = j.kind;
                let (l, r) = (j.l.lower(&mut cx), j.r.lower(&mut cx));
                quote!(#ir::Join { table: <#table as ::hearth::Table>::NAME, alias: #alias, key: <#table as ::hearth::Table>::KEY, on: (#l, #r), kind: #kind })
            })
            .collect();
        let where_ = match &self.where_ {
            Some(w) => {
                let w = w.lower(&mut cx);
                quote!(Some(#w))
            }
            None => quote!(None),
        };
        let order: Vec<_> = self
            .order
            .iter()
            .map(|(e, desc)| {
                let e = e.lower(&mut cx);
                quote!(#ir::Order { expr: #e, desc: #desc })
            })
            .collect();
        let limit = match &self.limit {
            Some(l) => quote!(Some(#l)),
            None => quote!(None),
        };
        let select: Vec<_> = self
            .select
            .iter()
            .map(|(name, e)| {
                let n = camel(&name.to_string());
                let e = e.lower(&mut cx);
                quote!((#n, #e))
            })
            .collect();
        // Row field types for client surrogates come from `#[hearth::row]`.
        let types = quote!(<#row as ::hearth::RowTypes>::TYPES.to_vec());
        let key = camel(&self.select.first().map(|(n, _)| n.to_string()).unwrap_or_else(|| "id".into()));

        let loaders = std::iter::once((&self.from.alias, &self.from.table))
            .chain(self.joins.iter().map(|j| (&j.src.alias, &j.src.table)))
            .map(|(a, t)| {
                let a = a.to_string();
                quote!((#a, ::hearth::__loader::<#t> as ::hearth::__LoaderFn))
            });

        // Each `$(...)` becomes a Topcoat runtime expression: Rust value for SSR,
        // JS for the browser (re-evaluated reactively by the list region).
        let params = cx.params.iter().map(|p| {
            quote!(::hearth::LiveQuery::<#row>::param(::topcoat::runtime::expr!(#p)))
        });

        let _ = Span::call_site();
        let _ = Brace::default;
        quote! {{
            ::hearth::LiveQuery::<#row> {
                ir: #ir::Query {
                    from: #ir::From { table: <#from_table as ::hearth::Table>::NAME, alias: #from_alias, key: <#from_table as ::hearth::Table>::KEY },
                    joins: vec![#(#joins),*],
                    where_: #where_,
                    order: vec![#(#order),*],
                    limit: #limit,
                    select: #ir::indexmap_lite::Map(vec![#(#select),*]),
                    key: #key,
                    types: #ir::indexmap_lite::Types(#types),
                },
                params: vec![#(#params),*],
                loaders: vec![#(#loaders),*],
                _row: ::core::marker::PhantomData,
            }
        }}
    }
}

/// `#[hearth::row]` on a struct: a query row. Adds Topcoat's `#[record]`,
/// serde (camelCase wire names), `Default`, and the client column types.
#[proc_macro_attribute]
pub fn row(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let item = parse_macro_input!(item as syn::ItemStruct);
    let name = &item.ident;
    let syn::Fields::Named(fields) = &item.fields else {
        return syn::Error::new_spanned(&item, "rows need named fields").to_compile_error().into();
    };
    let types = fields.named.iter().map(|f| {
        let n = camel(&f.ident.as_ref().unwrap().to_string());
        let ty = &f.ty;
        quote!((#n, <#ty as ::hearth::RowField>::TYPE))
    });
    quote! {
        #[::topcoat::runtime::record]
        #[derive(Clone, Debug, Default, ::serde::Serialize, ::serde::Deserialize)]
        #[serde(rename_all = "camelCase")]
        #item

        impl ::hearth::RowTypes for #name {
            const TYPES: &'static [(&'static str, &'static str)] = &[#(#types),*];
        }
    }
    .into()
}
