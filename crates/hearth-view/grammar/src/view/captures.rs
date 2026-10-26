//! [hearth] Free-variable analysis for client regions.
//!
//! A client `for` / `if` body is rendered several times (once per SSR row,
//! once into the `<template>`), so it is an `Fn` closure and each
//! invocation needs its own copy of everything it captures. This computes
//! exactly the identifiers the body uses from the enclosing scope:
//!
//! - collects every Rust expression in the body: `$(...)`, `(...)` template exprs, attribute
//!   values, component args, `if`/`match` conditions, loop iterables;
//! - parses each with `syn` and visits it, recording single-segment path expressions (`foo`,
//!   `foo.bar()`, `foo(x)`), and *not* field names, method names, macro paths or type paths;
//! - subtracts names bound inside: closure params, `let` patterns, `for` patterns (including nested
//!   client loops), `match` arm patterns.
//!
//! Anything that isn't valid Rust (HTML structure) is walked as tokens only
//! to find the embedded expressions.

use std::collections::BTreeSet;

use proc_macro2::{Delimiter, TokenStream, TokenTree};
use syn::visit::{self, Visit};

/// Free identifiers used by a client-region body, minus `bound`.
pub(crate) fn free_idents(body: &TokenStream, bound: &BTreeSet<String>) -> BTreeSet<String> {
    let mut v = Free::default();
    v.scopes.push(bound.clone());
    walk(body.clone(), &mut v);
    v.free
}

#[derive(Default)]
struct Free {
    scopes: Vec<BTreeSet<String>>,
    free: BTreeSet<String>,
}

impl Free {
    fn is_bound(&self, name: &str) -> bool {
        self.scopes.iter().any(|s| s.contains(name))
    }
    fn bind_pat(&mut self, pat: &syn::Pat) {
        let mut names = BTreeSet::new();
        collect_pat(pat, &mut names);
        if let Some(top) = self.scopes.last_mut() {
            top.extend(names);
        }
    }
}

fn collect_pat(pat: &syn::Pat, out: &mut BTreeSet<String>) {
    struct P<'a>(&'a mut BTreeSet<String>);
    impl<'ast> Visit<'ast> for P<'_> {
        fn visit_pat_ident(&mut self, i: &'ast syn::PatIdent) {
            self.0.insert(i.ident.to_string());
            visit::visit_pat_ident(self, i);
        }
    }
    P(out).visit_pat(pat);
}

impl<'ast> Visit<'ast> for Free {
    fn visit_expr_path(&mut self, e: &'ast syn::ExprPath) {
        if e.qself.is_none() && e.path.leading_colon.is_none() && e.path.segments.len() == 1 {
            let name = e.path.segments[0].ident.to_string();
            // Lowercase only: `None`, `Some`, unit structs/consts aren't captures.
            if name.starts_with(|c: char| c.is_ascii_lowercase() || c == '_')
                && !self.is_bound(&name)
                && name != "self"
            {
                self.free.insert(name);
            }
        }
        // Don't descend into generic args (types).
    }
    fn visit_expr_closure(&mut self, c: &'ast syn::ExprClosure) {
        self.scopes.push(BTreeSet::new());
        for p in &c.inputs {
            self.bind_pat(p);
        }
        self.visit_expr(&c.body);
        self.scopes.pop();
    }
    fn visit_block(&mut self, b: &'ast syn::Block) {
        self.scopes.push(BTreeSet::new());
        visit::visit_block(self, b);
        self.scopes.pop();
    }
    fn visit_local(&mut self, l: &'ast syn::Local) {
        if let Some(init) = &l.init {
            self.visit_expr(&init.expr);
            if let Some((_, d)) = &init.diverge {
                self.visit_expr(d);
            }
        }
        self.bind_pat(&l.pat);
    }
    fn visit_expr_for_loop(&mut self, f: &'ast syn::ExprForLoop) {
        self.visit_expr(&f.expr);
        self.scopes.push(BTreeSet::new());
        self.bind_pat(&f.pat);
        self.visit_block(&f.body);
        self.scopes.pop();
    }
    fn visit_arm(&mut self, a: &'ast syn::Arm) {
        self.scopes.push(BTreeSet::new());
        // syn 3: guards live inside the pattern (`Pat::Guard`); visit the
        // pattern for guard expressions, then bind its names.
        visit::visit_pat(self, &a.pat);
        self.bind_pat(&a.pat);
        self.visit_expr(&a.body);
        self.scopes.pop();
    }
    fn visit_expr_macro(&mut self, m: &'ast syn::ExprMacro) {
        // Builtins like `raw!`/`format!`: scan their comma-separated args as exprs.
        scan_macro_args(m.mac.tokens.clone(), self);
    }
    fn visit_stmt_macro(&mut self, m: &'ast syn::StmtMacro) {
        scan_macro_args(m.mac.tokens.clone(), self);
    }
    fn visit_type(&mut self, _: &'ast syn::Type) {}
    fn visit_path_arguments(&mut self, _: &'ast syn::PathArguments) {}
}

fn scan_macro_args(ts: TokenStream, v: &mut Free) {
    use syn::{Token, parse::Parser, punctuated::Punctuated};
    if let Ok(args) = Punctuated::<syn::Expr, Token![,]>::parse_terminated.parse2(ts) {
        for a in &args {
            v.visit_expr(a);
        }
    }
}

/// Walk view-body tokens. Expression positions in `view!` are:
/// `$( expr )`, `( expr )` not preceded by an identifier (template expr or
/// attribute value; a preceding ident means a component call `name(...)`),
/// component named args `name: expr`, and Rust control flow headers
/// (`if cond {`, `for pat in expr {`, `match expr {`, `let pat = expr;`).
fn walk(ts: TokenStream, v: &mut Free) {
    let toks: Vec<TokenTree> = ts.into_iter().collect();
    let mut i = 0;
    while i < toks.len() {
        match &toks[i] {
            TokenTree::Punct(p) if p.as_char() == '$' => {
                if let Some(TokenTree::Group(g)) = toks.get(i + 1) {
                    expr(g.stream(), v);
                    i += 2;
                    continue;
                }
            }
            TokenTree::Ident(id) if id == "for" => {
                // for <pat> in <iterable> { body }
                let (pat_end, body_idx) = header(&toks, i + 1);
                let pat_ts: TokenStream = toks[i + 1..pat_end].iter().cloned().collect();
                let iter_ts: TokenStream = toks[pat_end + 1..body_idx].iter().cloned().collect();
                if let Some(TokenTree::Punct(p)) = iter_ts.clone().into_iter().next()
                    && p.as_char() == '$'
                {
                    walk(iter_ts, v);
                } else {
                    expr(iter_ts, v);
                }
                v.scopes.push(BTreeSet::new());
                if let Ok(pat) = syn::Pat::parse_single.parse2(pat_ts) {
                    v.bind_pat(&pat);
                }
                if let Some(TokenTree::Group(g)) = toks.get(body_idx) {
                    walk(g.stream(), v);
                }
                v.scopes.pop();
                i = body_idx + 1;
                continue;
            }
            TokenTree::Ident(id) if id == "if" || id == "match" => {
                let mut j = i + 1;
                while j < toks.len()
                    && !matches!(&toks[j], TokenTree::Group(g) if g.delimiter() == Delimiter::Brace)
                {
                    j += 1;
                }
                let cond: TokenStream = toks[i + 1..j].iter().cloned().collect();
                if matches!(cond.clone().into_iter().next(), Some(TokenTree::Punct(p)) if p.as_char() == '$')
                {
                    walk(cond, v);
                } else {
                    expr(cond, v);
                }
                i = j;
                continue;
            }
            TokenTree::Ident(id) if id == "let" => {
                let mut j = i + 1;
                while j < toks.len()
                    && !matches!(&toks[j], TokenTree::Punct(p) if p.as_char() == ';')
                {
                    j += 1;
                }
                let stmt: TokenStream = toks[i..=j.min(toks.len() - 1)].iter().cloned().collect();
                if let Ok(s) = syn::parse2::<syn::Stmt>(stmt) {
                    v.visit_stmt(&s);
                }
                i = j + 1;
                continue;
            }
            TokenTree::Group(g) if g.delimiter() == Delimiter::Parenthesis => {
                let after_ident = i > 0 && matches!(&toks[i - 1], TokenTree::Ident(_));
                if after_ident {
                    component_args(g.stream(), v);
                } else {
                    expr(g.stream(), v);
                }
            }
            TokenTree::Group(g) => walk(g.stream(), v),
            _ => {}
        }
        i += 1;
    }
}

use syn::parse::Parser;

/// Splits `for <pat> in <iter> {` → (index of `in`, index of the body group).
fn header(toks: &[TokenTree], start: usize) -> (usize, usize) {
    let mut in_idx = start;
    while in_idx < toks.len() && !matches!(&toks[in_idx], TokenTree::Ident(id) if id == "in") {
        in_idx += 1;
    }
    let mut body = in_idx + 1;
    while body < toks.len()
        && !matches!(&toks[body], TokenTree::Group(g) if g.delimiter() == Delimiter::Brace)
    {
        body += 1;
    }
    (in_idx, body)
}

/// `name: expr, name: $(expr), <children>`
fn component_args(ts: TokenStream, v: &mut Free) {
    let toks: Vec<TokenTree> = ts.into_iter().collect();
    let mut i = 0;
    let mut cur = TokenStream::new();
    let mut in_arg = false;
    while i < toks.len() {
        let is_named = matches!(&toks[i], TokenTree::Ident(_))
            && matches!(toks.get(i + 1), Some(TokenTree::Punct(p)) if p.as_char() == ':')
            && !matches!(toks.get(i + 2), Some(TokenTree::Punct(p)) if p.as_char() == ':');
        if is_named && !in_arg {
            in_arg = true;
            i += 2;
            continue;
        }
        if in_arg {
            if matches!(&toks[i], TokenTree::Punct(p) if p.as_char() == ',') {
                flush_arg(&mut cur, v);
                in_arg = false;
                i += 1;
                continue;
            }
            cur.extend([toks[i].clone()]);
            i += 1;
            continue;
        }
        // Children.
        walk(toks[i..].iter().cloned().collect(), v);
        break;
    }
    flush_arg(&mut cur, v);
}

fn flush_arg(cur: &mut TokenStream, v: &mut Free) {
    let ts = std::mem::take(cur);
    if ts.is_empty() {
        return;
    }
    if matches!(ts.clone().into_iter().next(), Some(TokenTree::Punct(p)) if p.as_char() == '$') {
        walk(ts, v);
    } else {
        expr(ts, v);
    }
}

fn expr(ts: TokenStream, v: &mut Free) {
    if let Ok(e) = syn::parse2::<syn::Expr>(ts.clone()) {
        v.visit_expr(&e);
    } else {
        // Partial/HTML-ish content: look for nested expressions.
        walk(ts, v);
    }
}

#[cfg(test)]
mod tests {
    use quote::quote;

    use super::*;

    fn free(ts: TokenStream, bound: &[&str]) -> Vec<String> {
        free_idents(&ts, &bound.iter().map(|s| (*s).to_owned()).collect())
            .into_iter()
            .collect()
    }

    #[test]
    fn row_template() {
        let body = quote! {
            <li class="x" data-id=(row.id)>
                <button @click=$(|_e| table.set(row.id.clone(), "open", !row.open))>
                    $(if row.open { "o" } else { "c" })
                </button>
                <a :href=$(row.href.clone())>$(row.title.clone())</a>
                (label(text: name.clone()))
            </li>
        };
        assert_eq!(free(body, &["row"]), ["name", "table"]);
    }

    #[test]
    fn nested_client_loop_and_if() {
        let body = quote! {
            if $(path.starts_with("/x")) {
                for c in $(comments) {
                    <p>$(c.body.clone()) $(user.get())</p>
                }
            }
        };
        assert_eq!(free(body, &[]), ["comments", "path", "user"]);
    }

    #[test]
    fn closure_params_and_lets_are_bound() {
        let body = quote! {
            let n = count.get();
            <input @input=$(|e: Event| text.set(e.target.value))>
            $({ let v = n; v + offset })
        };
        assert_eq!(free(body, &[]), ["count", "offset", "text"]);
    }
}
