#!/usr/bin/env python3
"""Build a static Zola site from the authoritative repository guides."""
import argparse
import os
from pathlib import Path
import re
import shutil
import subprocess
import tomllib
from urllib.parse import urlparse, urljoin, unquote

WEB = Path(__file__).resolve().parent.parent
ROOT = WEB.parent
GROUPS = [
    ("Start", [("getting_started.md", "Getting started"), ("context.md", "Request context"), ("asset.md", "Assets"), ("tailwind.md", "Tailwind")]),
    ("Local-first", [("hearth/tables.md", "Server-only table fields"), ("hearth/authentication.md", "Authentication"), ("hearth/persistence.md", "Persistence and sync"), ("hearth/idle-warming.md", "Idle warming"), ("hearth/strict-csp.md", "Strict CSP")]),
    ("Views and runtime", [("view/view.md", "Views"), ("view/component.md", "Components"), ("runtime/expr.md", "Runtime expressions"), ("runtime/record.md", "Records"), ("runtime/link.md", "Navigation"), ("runtime/procedure.md", "Procedures"), ("runtime/shard.md", "Shards")]),
    ("Server", [("router.md", "Routing"), ("router/module.md", "Module routing"), ("router/error.md", "Errors"), ("cookie.md", "Cookies"), ("session.md", "Sessions"), ("font.md", "Fonts"), ("ui.md", "UI components")]),
]


def slug(source):
    return source.removesuffix(".md").replace("getting_started", "getting-started").replace("hearth/", "local-first/").replace("_", "-")


def doc_sources():
    excluded = {"PLAN.md", "RESULTS.md", "fork-design.md", "fork-spike.md", "perf-gaps.md", "restructure-plan.md", "README.md", "releasing.md"}
    return sorted(p for p in (ROOT / "docs").rglob("*.md") if p.name not in excluded and "brand" not in p.parts and "upstream" not in p.parts and not p.name.endswith(".upstream.md"))


def title_for(source, body):
    for _, pages in GROUPS:
        for name, title in pages:
            if name == source:
                return title
    # Topic names come from the source path, never doctest or subsection H1s.
    names = {"alpine_ajax": "Alpine AJAX", "fmt": "Macro formatting", "functions_not_middlewares": "Functions, not middleware", "memoize": "Request memoization", "font": "Font declarations", "fontsource_font": "Fontsource families", "fontsource_font_face": "Fontsource faces", "iconify_icon": "Iconify icons", "include": "Including icon sets", "href": "Typed links", "not_found": "Not-found pages", "props": "Component properties", "app_context": "Application context", "class": "Classes", "coherence": "Rust and JavaScript parity", "fn": "Functions", "font_face": "Font faces", "htmx": "HTMX", "iconify": "Iconify", "module_param": "Module parameters", "path_param": "Path parameters", "query_params": "Query parameters", "sse": "Server-sent events", "ui": "UI components", "websocket": "WebSockets"}
    stem = Path(source).stem
    topic = names.get(stem, stem.replace("_", " ").capitalize())
    parent = Path(source).parent.name
    if parent not in {"", ".", "hearth"} and stem not in names:
        topic = parent.capitalize() + ": " + topic
    return topic


SYMBOL_GUIDES = {
    "asset": "asset.md", "module_router": "router/module.md", "app_context": "context/app_context.md",
    "request_context": "context.md", "query_params": "router/query_params.md", "content": "router/content.md",
    "page": "router/page.md", "route": "router/route.md", "layer": "router/layer.md", "href": "router/href.md",
    "memoize": "context/memoize.md", "record": "runtime/record.md", "module_param": "router/module_param.md", "path_param": "router/path_param.md", "layout": "router/layout.md",
}


def convert_markdown(body, source, known):
    def link(label, target):
        if target.startswith(("http://", "https://", "mailto:", "#", "/")):
            return f"[{label}]({target})"
        path, _, anchor = target.partition("#")
        candidate = (ROOT / "docs" / Path(source).parent / path).resolve()
        if candidate in known:
            return f"[{label}](/docs/{slug(known[candidate])}/{('#' + anchor) if anchor else ''})"
        symbol = path.split("@")[-1].split("::")[-1].removesuffix("!").removesuffix("()")
        if symbol.startswith(("attr.", "macro.", "fn.")): symbol = symbol.split(".")[1]
        guide = SYMBOL_GUIDES.get(symbol)
        if guide and (ROOT / "docs" / guide).resolve() in known:
            return f"[{label}](/docs/{slug(guide)}/)"
        if path.endswith(".md"):
            return f"[{label}](https://github.com/wbunting/hearth/blob/main/docs/{path})"
        # Bare symbols, disambiguators and rustdoc HTML paths have no static
        # page. Preserve the text instead of manufacturing a broken URL.
        return label

    # Protect code fences from link and heading rewrites. Rustdoc directives
    # are normalized only inside Rust fences; escaped ## becomes visible #.
    definitions = {}
    in_fence = False
    filtered = []
    for line in body.splitlines():
        if line.lstrip().startswith("```"): in_fence = not in_fence
        match = re.match(r"^\[([^\]]+)\]:[ \t]*(\S+).*$", line) if not in_fence else None
        if match: definitions[match[1]] = match[2]
        else: filtered.append(line)
    body = "\n".join(filtered)
    chunks = []; prose = []; code = False; rust = False; fence = []
    def flush_prose():
        if not prose: return
        text = "\n".join(prose)
        text = re.sub(r"\[(`[^`]+`[^\]]*|[^\]`]+)\]\(([^)]+)\)", lambda m: link(m[1], m[2]), text)
        text = re.sub(r"\[([^\]]+)\]\[([^\]]*)\]", lambda m: link(m[1], definitions.get(m[2] or m[1], "")) if (m[2] or m[1]) in definitions else m[1], text)
        for label, target in definitions.items():
            text = text.replace("[" + label + "]", link(label, target))
        text = re.sub(r"\[(`[^`]+`)\](?![(:\[])", r"\1", text)
        text = re.sub(r"(?m)^# ", "## ", text)
        chunks.append(text); prose.clear()
    for line in body.splitlines():
        if line.lstrip().startswith("```"):
            if not code:
                flush_prose(); language = line.strip()[3:].split(",", 1)[0]
                rust = language in {"rust", "no_run", "ignore", "compile_fail", "should_panic"}
                fence = ["```rust" if rust else "```" + language]; code = True
            else:
                fence.append("```"); chunks.append("\n".join(fence)); code = False
            continue
        if code:
            if rust:
                if re.match(r"^\s*#(?:\s|$)", line): continue
                line = re.sub(r"^(\s*)##", r"\1#", line)
            fence.append(line)
        else: prose.append(line)
    if code: chunks.append("\n".join(fence))
    flush_prose()
    return "{% raw %}\n" + "\n".join(chunks) + "\n{% endraw %}"


def check_links(root, base):
    from html.parser import HTMLParser
    class Links(HTMLParser):
        def __init__(self): super().__init__(); self.links = []
        def handle_starttag(self, tag, attrs):
            for key, value in attrs:
                if key in {"href", "src"} and value: self.links.append(value)
    failures = []; origin = urlparse(base)
    for file in root.rglob("*.html"):
        links = Links(); links.feed(file.read_text())
        relative = file.relative_to(root).as_posix()
        page_url = base.rstrip("/") + "/" + relative.removesuffix("index.html")
        for value in links.links:
            parsed = urlparse(urljoin(page_url, value))
            if parsed.scheme not in {"http", "https"} or parsed.netloc != origin.netloc: continue
            destination = root / unquote(parsed.path).lstrip("/")
            if not (destination.is_file() or (destination / "index.html").is_file()): failures.append((relative, value))
    return failures


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    config = tomllib.loads((WEB / "config.toml").read_text())
    base = os.environ.get("HEARTH_SITE_URL", config["base_url"]).rstrip("/")
    demo = os.environ.get("HEARTH_DEMO_URL", config["extra"]["demo_url"]).rstrip("/")
    for url in (base, demo):
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise SystemExit("Site and demo URLs must be absolute HTTP(S) URLs")
    stage = WEB / ".generated"
    if stage.exists(): shutil.rmtree(stage)
    stage.mkdir()
    for directory in ["templates", "static"]: shutil.copytree(WEB / directory, stage / directory)
    assets = stage / "static/assets"
    for name in ["site.css", "manrope.ttf", "Manrope-LICENSE.txt", "logo.svg", "mark.svg", "favicon.svg"]:
        shutil.copyfile(ROOT / "site/assets" / name, assets / name)
    shutil.copyfile(ROOT / "docs/hearth/brand/hearth-social-1280.png", assets / "social.png")
    shutil.copyfile(ROOT / "site/assets/Manrope-LICENSE.txt", assets / "Manrope-LICENSE.txt")
    text = (WEB / "config.toml").read_text().replace(config["base_url"], base).replace(config["extra"]["demo_url"], demo)
    for group, pages in GROUPS:
        text += f'\n[[extra.doc_groups]]\ntitle = "{group}"\n'
        for source, title in pages:
            text += f'[[extra.doc_groups.pages]]\ntitle = "{title}"\nurl = "/docs/{slug(source)}/"\n'
    (stage / "config.toml").write_text(text)
    content = stage / "content"; content.mkdir()
    (content / "_index.md").write_text('+++\ntitle = "Hearth"\ntemplate = "index.html"\n+++\n')
    sources = doc_sources(); known = {p.resolve(): p.relative_to(ROOT / "docs").as_posix() for p in sources}
    for path in sources:
        source = path.relative_to(ROOT / "docs").as_posix(); body = path.read_text(); title = title_for(source, body)
        front = f'+++\ntitle = "{title}"\npath = "docs/{slug(source)}"\ntemplate = "docs.html"\n[extra]\nsource = "docs/{source}"\n+++\n\n'
        (content / (source.replace("/", "--") + ".md")).write_text(front + convert_markdown(body, source, known))
    index = ['## Build a Rust app that keeps data close\n', 'Hearth renders the initial view on the server and compiles browser interactions to JavaScript. Start with a page, then add scoped tables and local queries.\n']
    for group, pages in GROUPS:
        index.append('## ' + group + '\n')
        index.extend(f'- [{title}](/docs/{slug(source)}/)' for source, title in pages)
        index.append('')
    index += ['## More guides\n'] + [f'- [{title_for(p.relative_to(ROOT / "docs").as_posix(), p.read_text())}](/docs/{slug(p.relative_to(ROOT / "docs").as_posix())}/)' for p in sources if p.relative_to(ROOT / "docs").as_posix() not in {s for _, pages in GROUPS for s, _ in pages}]
    (content / 'docs-index.md').write_text('+++\ntitle = "Documentation"\npath = "docs"\ntemplate = "docs.html"\n+++\n\n' + '\n'.join(index))
    headers = '''/*
  Content-Security-Policy: default-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; script-src 'none'; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/assets/*
  Cache-Control: public, max-age=3600
'''
    (stage / 'static/_headers').write_text(headers)
    subprocess.run(['zola', '--root', str(stage), 'build', '--force', '--output-dir', str(WEB / 'public')], check=True)
    failures = check_links(WEB / "public", base)
    if failures: raise SystemExit('Broken generated links: ' + repr(failures[:20]))
    print(f'STATIC SITE VERIFIED: {len(sources)} guide pages; base={base}; demo={demo}')


if __name__ == '__main__': main()
