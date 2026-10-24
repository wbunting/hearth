//! SSR size: rows of a client list share their `$()` JavaScript. Rewrites
//! `<!--::topcoat::expr::start("JS")-->` and `data-topcoat-on:x="JS"` /
//! `data-topcoat-bind:x="JS"` in row markup to `@N` references into a table
//! emitted once per list (`<!--::fastcoat::js(...)-->`). The browser runtime
//! resolves `@N` before compiling. Measured: 2,530 markers / 18 unique.
//!
//! Single pass over the bytes using `memchr`-style scanning for `<` and ` d`.

use std::collections::HashMap;

const EXPR: &str = "<!--::topcoat::expr::start(\"";
const EXPR_END: &str = "\")-->";
const ON: &str = " data-topcoat-on:";
const BIND: &str = " data-topcoat-bind:";

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

    /// Rewrites one row's HTML into `out`.
    pub fn rewrite_into(&mut self, html: &str, out: &mut String) {
        let bytes = html.as_bytes();
        let mut copied = 0;
        let mut i = 0;
        while i < bytes.len() {
            let b = bytes[i];
            if b == b'<' && html[i..].starts_with(EXPR) {
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
            } else if b == b' ' && (html[i..].starts_with(ON) || html[i..].starts_with(BIND)) {
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
        let mut s = String::from("<!--::fastcoat::js(");
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
}
