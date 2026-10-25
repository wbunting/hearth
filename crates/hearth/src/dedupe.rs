//! SSR size: rows of a client list share their `$()` JavaScript. Rewrites
//! `<!--::hearth::expr::start("JS")-->` and `data-hearth-on:x="JS"` /
//! `data-hearth-bind:x="JS"` in row markup to `@N` references into a table
//! emitted once per list (`<!--::hearth::js(...)-->`). The browser runtime
//! resolves `@N` before compiling. Measured: 2,530 markers / 18 unique.
//!
//! Single pass over the bytes using `memchr`-style scanning for `<` and ` d`.

use std::collections::HashMap;

const EXPR: &str = "<!--::crate::expr::start(\"";
const EXPR_END: &str = "\")-->";
const ON: &str = " data-hearth-on:";
const BIND: &str = " data-hearth-bind:";
const NESTED_START: &str = "<!--::hearth::list::start(";
const NESTED_END: &str = "<!--::hearth::list::end";
const TEMPLATE_START: &str = "<template";
const TEMPLATE_END: &str = "</template>";

#[derive(Default)]
pub struct Dedupe {
    index: HashMap<String, usize>,
    table: Vec<String>,
}

impl Dedupe {
    fn id(&mut self, js: &str) -> usize {
        if let Some(&i) = self.index.get(js) {
            return i;
        }
        let i = self.table.len();
        self.table.push(js.to_owned());
        self.index.insert(js.to_owned(), i);
        i
    }

    /// Rewrites one row's HTML into `out`. Nested list regions are copied
    /// verbatim: they carry their own JS table, and the browser resolves
    /// `@N` inside them against that one.
    #[allow(
        clippy::collapsible_if,
        reason = "scanner branches read clearer nested"
    )]
    pub fn rewrite_into(&mut self, html: &str, out: &mut String) {
        let bytes = html.as_bytes();
        let mut copied = 0;
        let mut i = 0;
        while i < bytes.len() {
            let b = bytes[i];
            if b == b'<' && bytes[i..].starts_with(NESTED_START.as_bytes()) {
                // Skip to the matching end marker (regions nest).
                let mut depth = 0usize;
                let mut j = i;
                while j < bytes.len() {
                    if bytes[j..].starts_with(NESTED_START.as_bytes()) {
                        depth += 1;
                        j += NESTED_START.len();
                    } else if bytes[j..].starts_with(NESTED_END.as_bytes()) {
                        depth -= 1;
                        j += NESTED_END.len();
                        if depth == 0 {
                            break;
                        }
                    } else {
                        j += 1;
                    }
                }
                i = j;
                continue;
            }
            // Nested regions put their clone template after their end marker.
            // It is not part of this list's JS table. Rewriting it would leave
            // cloned children with references to the enclosing list's table.
            if b == b'<' && bytes[i..].starts_with(TEMPLATE_START.as_bytes()) {
                let mut depth = 0usize;
                let mut j = i;
                while j < bytes.len() {
                    if bytes[j..].starts_with(TEMPLATE_START.as_bytes()) {
                        depth += 1;
                        j += TEMPLATE_START.len();
                    } else if bytes[j..].starts_with(TEMPLATE_END.as_bytes()) {
                        depth -= 1;
                        j += TEMPLATE_END.len();
                        if depth == 0 {
                            break;
                        }
                    } else {
                        j += 1;
                    }
                }
                i = j;
                continue;
            }
            if b == b'<' && bytes[i..].starts_with(EXPR.as_bytes()) {
                let start = i + EXPR.len();
                if let Some(end) = html[start..].find(EXPR_END) {
                    let id = self.id(&html[start..start + end]);
                    out.push_str(&html[copied..i]);
                    out.push_str(EXPR);
                    out.push('@');
                    push_usize(out, id);
                    out.push_str(EXPR_END);
                    i = start + end + EXPR_END.len();
                    copied = i;
                    continue;
                }
            } else if b == b' '
                && (bytes[i..].starts_with(ON.as_bytes())
                    || bytes[i..].starts_with(BIND.as_bytes()))
                && let Some(eq) = html[i..].find("=\"")
            {
                let vstart = i + eq + 2;
                if let Some(close) = html[vstart..].find('"') {
                    let id = self.id(&html[vstart..vstart + close]);
                    out.push_str(&html[copied..vstart]);
                    out.push('@');
                    push_usize(out, id);
                    out.push('"');
                    i = vstart + close + 1;
                    copied = i;
                    continue;
                }
            }
            i += 1;
        }
        out.push_str(&html[copied..]);
    }

    /// The per-list table, placed right after the list's items.
    pub fn table_comment(&self) -> String {
        if self.table.is_empty() {
            return String::new();
        }
        // Entries are already HTML-escaped for their original context
        // (comment/attribute), which is also safe inside this comment.
        let mut s = String::from("<!--::hearth::js(");
        for (i, js) in self.table.iter().enumerate() {
            if i > 0 {
                s.push('\u{1}');
            }
            s.push_str(js);
        }
        s.push_str(")-->");
        s
    }
}

fn push_usize(out: &mut String, n: usize) {
    use std::fmt::Write;
    let _ = write!(out, "{n}");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rewrites_and_shares() {
        let mut d = Dedupe::default();
        let row = r#"<li><button data-hearth-on:click="(e) => x()"><!--::crate::expr::start("(cx.row(&quot;a&quot;)).title")-->T<!--::crate::expr::end--></button></li>"#;
        let mut out = String::new();
        d.rewrite_into(row, &mut out);
        d.rewrite_into(row, &mut out);
        assert_eq!(d.table.len(), 2);
        assert!(out.contains(r#"data-hearth-on:click="@0""#));
        assert!(out.contains(r#"<!--::crate::expr::start("@1")-->T"#));
        assert_eq!(out.matches("@1").count(), 2);
    }

    #[test]
    fn leaves_nested_templates_alone() {
        let template = concat!(
            r#"<template id="inner"><button data-hearth-on:click="inner()">"#,
            r#"<!--::crate::expr::start("inner.text")-->x<!--::crate::expr::end-->"#,
            r#"<template id="deep"><i data-hearth-bind:title="deep.title"></i></template>"#,
            "</button></template>",
        );
        let row = format!(
            r#"<li><!--::hearth::list::start({{}})--><!--::hearth::list::end-->{template}<b data-hearth-on:click="outer()"></b></li>"#,
        );
        let mut d = Dedupe::default();
        let mut out = String::new();
        d.rewrite_into(&row, &mut out);
        assert!(out.contains(template));
        assert_eq!(d.table, vec!["outer()"]);
        assert!(out.contains(r#"data-hearth-on:click="@0""#));
    }

    #[test]
    fn leaves_nested_lists_alone() {
        let mut d = Dedupe::default();
        let row = r#"<li>🎉<!--::crate::expr::start("outer")-->x<!--::crate::expr::end--><!--::hearth::list::start({})--><b data-hearth-on:click="inner"></b><!--::hearth::list::start({})--><i data-hearth-on:click="deep"></i><!--::hearth::list::end--><!--::hearth::list::end--><!--::crate::expr::start("outer2")-->y<!--::crate::expr::end--></li>"#;
        let mut out = String::new();
        d.rewrite_into(row, &mut out);
        assert_eq!(d.table, vec!["outer", "outer2"]);
        assert!(out.contains(r#"data-hearth-on:click="inner""#));
        assert!(out.contains(r#"data-hearth-on:click="deep""#));
    }
}
