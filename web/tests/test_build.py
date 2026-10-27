import importlib.util
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("site_build", Path(__file__).resolve().parents[1] / "scripts/build.py")
build = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(build)


class GuideConversion(unittest.TestCase):
    def test_rustdoc_symbols_map_to_guides_or_plain_labels(self):
        known = {p.resolve(): p.relative_to(build.ROOT / 'docs').as_posix() for p in build.doc_sources()}
        source = '[`asset!`](asset) [routing](macro@module_router) [store](CookieStore) [context](app_context) [`#[record]`](attr.record.html) [`#[query_params]`](macro@crate::router::query_params)'
        result = build.convert_markdown(source, 'asset.md', known)
        self.assertIn('(/docs/asset/)', result)
        self.assertIn('(/docs/router/module/)', result)
        self.assertIn('(/docs/context/app-context/)', result)
        self.assertNotIn('(CookieStore)', result)
        self.assertIn('(/docs/runtime/record/)', result)
        self.assertIn('(/docs/router/query-params/)', result)

    def test_reference_definitions_resolve_across_code_fences(self):
        known = {p.resolve(): p.relative_to(build.ROOT / 'docs').as_posix() for p in build.doc_sources()}
        source = 'Use [Fontsource] and the [asset guide].\n\n```rust\nlet value = 1;\n```\n\n[Fontsource]: https://fontsource.org/\n[asset guide]: crate::asset'
        result = build.convert_markdown(source, 'font.md', known)
        self.assertIn('[Fontsource](https://fontsource.org/)', result)
        self.assertIn('[asset guide](/docs/asset/)', result)

    def test_rustdoc_hidden_lines_and_escaped_hash(self):
        result = build.convert_markdown('```rust\n#\n    # unreachable!();\n# let hidden = 1;\n## visible\nlet value = 2;\n```', 'context.md', {})
        self.assertNotIn('unreachable', result)
        self.assertNotIn('let hidden', result)
        self.assertIn('# visible', result)
        self.assertNotIn('\n#\n', result)
        self.assertIn('let value = 2;', result)

    def test_fenced_code_is_not_rewritten_as_markdown(self):
        source = '```rust\nlet literal = "[example](CookieStore)";\n```'
        self.assertIn('[example](CookieStore)', build.convert_markdown(source, 'context.md', {}))

    def test_link_checker_detects_relative_and_same_origin_absolute(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); (root / 'docs').mkdir(); page = root / 'docs/index.html'
            page.write_text('<a href="missing">relative</a><a href="https://example.com/docs/absent">absolute</a>')
            failures = build.check_links(root, 'https://example.com')
            self.assertEqual(len(failures), 2)


if __name__ == '__main__': unittest.main()
