#!/usr/bin/env python3
"""Check and publish Hearth's dependency graph in Cargo order.

Publication is deliberate: run `publish` only after `check` and packaged-smoke.
No credentials are read or printed by this script; Cargo handles authentication.
"""
import argparse
import json
import pathlib
import subprocess
import tarfile
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def packages():
    metadata = json.loads(subprocess.check_output(
        ["cargo", "metadata", "--no-deps", "--format-version", "1"], cwd=ROOT
    ))
    return {p["name"]: p for p in metadata["packages"]
            if p["name"].startswith("hearth") and p["publish"] != []}


def ordered(packages):
    done = []
    while len(done) < len(packages):
        ready = sorted(name for name, package in packages.items()
                       if name not in done and all(
                           dep["name"] not in packages or dep["name"] in done
                           for dep in package["dependencies"] if dep["kind"] != "dev"))
        if not ready:
            raise RuntimeError("Cycle in release dependencies: " + str(set(packages) - set(done)))
        done.extend(ready)
    return done


def check(packages):
    for name, package in packages.items():
        assert package["license"] == "MIT", (name, "missing MIT license metadata")
        path = pathlib.Path(package["manifest_path"]).parent
        assert (path / "LICENSE").is_file(), (name, "missing license file")
        assert (path / "NOTICE").is_file(), (name, "missing upstream attribution")
        for dep in package["dependencies"]:
            assert not dep["name"].startswith("topcoat"), (name, "upstream package dependency")
            if dep.get("path") and dep["kind"] != "dev":
                assert dep["name"] in packages, (name, "unpublished internal dependency", dep["name"])
                expected = "^" + packages[dep["name"]]["version"]
                assert dep["req"] == expected, (name, "internal dependency version mismatch", dep["name"], dep["req"], expected)
        print(f"checked {name} {package['version']}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["check", "order", "package", "publish"])
    parser.add_argument("-p", "--package", action="append", default=[],
                        help="Select a package (repeatable); omit for the full family")
    args = parser.parse_args()
    crates = packages()
    unknown = set(args.package) - crates.keys()
    if unknown:
        parser.error("Unknown publishable package: " + ", ".join(sorted(unknown)))
    order = [name for name in ordered(crates) if not args.package or name in args.package]
    if args.command == "order":
        print("\n".join(order))
        return
    check(crates)
    if args.command == "check":
        return
    if args.command == "package":
        subprocess.run(["cargo", "package", "--allow-dirty", "--no-verify"] +
                       [flag for name in order for flag in ["-p", name]], cwd=ROOT, check=True)
        for name in order:
            archive = ROOT / "target/package/tmp-registry" / f"{name}-{crates[name]['version']}.crate"
            if not archive.exists():
                archive = ROOT / "target/package" / archive.name
            with tarfile.open(archive) as package:
                names = package.getnames()
                assert not any("node_modules/" in n or n.endswith(".map") for n in names), name
                assert any(n.endswith("/LICENSE") for n in names), name
                assert any(n.endswith("/NOTICE") for n in names), name
                if name == "hearth-runtime":
                    for bundle in ["index.js", "persist.js", "coherence.js"]:
                        assert any(n.endswith("/browser/dist/" + bundle) for n in names), bundle
                if name == "hearth-font":
                    assert any(n.endswith("/fonts.json") for n in names), name
                if name == "hearth-ui-registry":
                    assert any(n.endswith("/registry.toml") for n in names), name
        return
    if subprocess.check_output(["git", "status", "--porcelain"], cwd=ROOT).strip():
        sys.exit("Refusing publication from a dirty checkout. Commit the verified release first.")
    # Cargo waits for index availability by default. Do not use --no-verify.
    for name in order:
        subprocess.run(["cargo", "publish", "--locked", "-p", name], cwd=ROOT, check=True)


if __name__ == "__main__":
    main()
