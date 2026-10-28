#!/usr/bin/env python3
"""Build and run the site using release archives through a local sparse registry.

No workspace paths or Cargo patches are used. Other packages are proxied from
crates.io unchanged. Nothing is uploaded. Use the resulting directory to run
its target/release/hearth-packaged-site after the check. --build also builds the CLI.
"""
import argparse
import hashlib
import http.server
import json
import pathlib
import shutil
import subprocess
import tempfile
import threading
import urllib.error
import urllib.request
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def index_path(name):
    if len(name) == 1:
        return "1/" + name
    if len(name) == 2:
        return "2/" + name
    if len(name) == 3:
        return "3/" + name[0] + "/" + name
    return name[:2] + "/" + name[2:4] + "/" + name


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build", action="store_true")
    parser.add_argument("--out", type=pathlib.Path)
    parser.add_argument("-p", "--package", action="append", default=[],
                        help="Stage only selected archives; resolve other crates from crates.io")
    args = parser.parse_args()
    metadata = json.loads(subprocess.check_output(["cargo", "metadata", "--no-deps", "--format-version", "1"], cwd=ROOT))
    packages = {p["name"]: p for p in metadata["packages"] if p["name"].startswith("hearth") and p["publish"] != []}
    unknown = set(args.package) - packages.keys()
    if unknown:
        parser.error("Unknown publishable package: " + ", ".join(sorted(unknown)))
    out = args.out or pathlib.Path(tempfile.mkdtemp(prefix="hearth-package-smoke-"))
    if out.exists() and any(out.iterdir()):
        sys.exit("Output directory must be empty: " + str(out))
    out.mkdir(parents=True, exist_ok=True)
    staged = ROOT / "target/package/tmp-registry"
    archives = {}
    entries = {}
    for name, package in packages.items():
        if args.package and name not in args.package:
            continue
        archive = staged / f"{name}-{package['version']}.crate"
        if not archive.exists():
            archive = ROOT / "target/package" / archive.name
        if not archive.exists():
            sys.exit("Missing archive; run scripts/release.py package first: " + name)
        archives[name] = archive
        deps = []
        for dep in package["dependencies"]:
            if dep["kind"] == "dev":
                continue
            deps.append({"name": dep["rename"] or dep["name"], "package": dep["name"] if dep["rename"] else None,
                         "req": dep["req"], "features": dep["features"], "optional": dep["optional"],
                         "default_features": dep["uses_default_features"], "target": dep["target"],
                         "kind": dep["kind"] or "normal", "registry": None})
        entry = {"name": name, "vers": package["version"], "deps": deps,
                 "cksum": hashlib.sha256(archive.read_bytes()).hexdigest(), "features": {},
                 "features2": package["features"], "yanked": False, "links": package["links"],
                 "rust_version": package["rust_version"], "v": 2}
        entries[index_path(name)] = json.dumps(entry).encode() + b"\n"
    class Registry(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            path = self.path.lstrip("/").split("?", 1)[0]
            try:
                if path == "config.json":
                    data = json.dumps({"dl": f"http://127.0.0.1:{self.server.server_port}/download/{{crate}}/{{version}}", "api": None}).encode()
                elif path in entries:
                    data = entries[path]
                elif path.startswith("download/"):
                    _, name, version = path.split("/")
                    if name in archives:
                        data = archives[name].read_bytes()
                    else:
                        data = urllib.request.urlopen(f"https://static.crates.io/crates/{name}/{name}-{version}.crate", timeout=60).read()
                else:
                    data = urllib.request.urlopen("https://index.crates.io/" + path, timeout=60).read()
                self.send_response(200)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            except urllib.error.HTTPError as error:
                self.send_error(error.code)
            except (BrokenPipeError, ConnectionResetError):
                pass
            except Exception as error:
                print("Registry request failed:", path, repr(error), flush=True)
                self.send_error(502)
        def log_message(self, *_):
            pass
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Registry)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    shutil.copyfile(ROOT / "rust-toolchain.toml", out / "rust-toolchain.toml")
    shutil.copytree(ROOT / "site/src", out / "src")
    shutil.copytree(ROOT / "site/assets", out / "assets")
    (out / "Cargo.toml").write_text('''[package]
name = "hearth-packaged-site"
version = "0.0.0"
edition = "2024"
[dependencies]
hearth = { version = "=HEARTH_VERSION", features = ["fs"] }
toasty = { version = "0.11", features = ["sqlite"] }
tokio = { version = "1.51.1", features = ["rt-multi-thread", "macros"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1.23", features = ["v4"] }
'''.replace('HEARTH_VERSION', packages['hearth']['version']))
    (out / ".cargo").mkdir()
    (out / ".cargo/config.toml").write_text(f'''[source.crates-io]
replace-with = "staged-release"
[source.staged-release]
registry = "sparse+http://127.0.0.1:{server.server_port}/"
''')
    print("Staged sparse registry:", server.server_port, "archives:", len(archives), "consumer:", out, flush=True)
    try:
        subprocess.run(["cargo", "build" if args.build else "check", "--release"], cwd=out, check=True)
        if args.build:
            subprocess.run(["cargo", "--config", str(out / ".cargo/config.toml"), "install", "hearth-cli", "--version", "=" + packages["hearth-cli"]["version"], "--root", str(out / "cli"), "--target-dir", str(out / "target"), "--locked"], cwd=out, check=True)
            subprocess.run([str(out / "cli/bin/hearth"), "asset", "bundle", "--release"], cwd=out, check=True)
        print("PACKAGED CONSUMER PASS", out, flush=True)
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
