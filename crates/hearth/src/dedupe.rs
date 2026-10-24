//! SSR size: rows of a client list share their `$()` JavaScript. Rewrites
//! `<!--::topcoat::expr::start("JS")-->` and `data-topcoat-on:x="JS"` /
//! `data-topcoat-bind:x="JS"` in row markup to `@N` references into a table
//! emitted once per list (`<!--::hearth::js(...)-->`). The browser runtime
//! resolves `@N` before compiling. Measured: 2,530 markers / 18 unique.
//!
//! Single pass over the bytes using `memchr`-style scanning for `<` and ` d`.

use std::collections::HashMap;

const EXPR: &str = "<!--::topcoat::expr::start(\"";
const EXPR_END: &str = "\")-->";
const ON: &str = " data-topcoat-on:";
const BIND: &str = " data-topcoat-bind:";
const NESTED_START: &str = "<!--::hearth::list::start(";
const NESTED_END: &str = "<!--::hearth::list::end";

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
    #[allow(clippy::collapsible_if, reason = "scanner branches read clearer nested")]
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
            } else if b == b' ' && (bytes[i..].starts_with(ON.as_bytes()) || bytes[i..].starts_with(BIND.as_bytes())) {
                if let Some(eq) = html[i..].find("=\"") {
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
        let row = r#"<li><button data-topcoat-on:click="(e) => x()"><!--::topcoat::expr::start("(cx.row(&quot;a&quot;)).title")-->T<!--::topcoat::expr::end--></button></li>"#;
        let mut out = String::new();
        d.rewrite_into(row, &mut out);
        d.rewrite_into(row, &mut out);
        assert_eq!(d.table.len(), 2);
        assert!(out.contains(r#"data-topcoat-on:click="@0""#));
        assert!(out.contains(r#"<!--::topcoat::expr::start("@1")-->T"#));
        assert_eq!(out.matches("@1").count(), 2);
    }

    #[test]
    fn leaves_nested_lists_alone() {
        let mut d = Dedupe::default();
        let row = r#"<li>🎉<!--::topcoat::expr::start("outer")-->x<!--::topcoat::expr::end--><!--::hearth::list::start({})--><b data-topcoat-on:click="inner"></b><!--::hearth::list::start({})--><i data-topcoat-on:click="deep"></i><!--::hearth::list::end--><!--::hearth::list::end--><!--::topcoat::expr::start("outer2")-->y<!--::topcoat::expr::end--></li>"#;
        let mut out = String::new();
        d.rewrite_into(row, &mut out);
        assert_eq!(d.table, vec!["outer", "outer2"]);
        assert!(out.contains(r#"data-topcoat-on:click="inner""#));
        assert!(out.contains(r#"data-topcoat-on:click="deep""#));
    }
}
