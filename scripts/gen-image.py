#!/usr/bin/env python3
"""Generate one image through OpenRouter and save it as PNG.

    scripts/gen-image.py OUT.png "prompt" [--model google/gemini-3-pro-image] [--ref IN.png ...]

The key is read from OPENROUTER_API_KEY, else ~/.env, else ~/.env.backup;
it is never printed. Prints the saved path and the request cost (USD).
Use --ref to pass existing images for edits or variations.
"""
import argparse, base64, json, os, sys, urllib.request


def key() -> str:
    k = os.environ.get("OPENROUTER_API_KEY", "")
    for path in ("~/.env", "~/.env.backup"):
        if k:
            break
        p = os.path.expanduser(path)
        if os.path.exists(p):
            for line in open(p):
                if line.startswith("OPENROUTER_API_KEY="):
                    k = line.split("=", 1)[1].strip().strip('"').strip("'")
    if not k:
        sys.exit("OPENROUTER_API_KEY not found")
    return k


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("prompt")
    ap.add_argument("--model", default="google/gemini-3-pro-image")
    ap.add_argument("--ref", action="append", default=[])
    a = ap.parse_args()
    content = [{"type": "text", "text": a.prompt}]
    for r in a.ref:
        b64 = base64.b64encode(open(r, "rb").read()).decode()
        content.append({"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}})
    body = {"model": a.model, "modalities": ["image", "text"], "messages": [{"role": "user", "content": content}]}
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        json.dumps(body).encode(),
        {"Authorization": f"Bearer {key()}", "Content-Type": "application/json"},
    )
    d = json.load(urllib.request.urlopen(req, timeout=300))
    if "error" in d:
        sys.exit(f"error: {d['error']}")
    imgs = d["choices"][0]["message"].get("images") or []
    if not imgs:
        sys.exit(f"no image returned: {(d['choices'][0]['message'].get('content') or '')[:200]}")
    url = imgs[0]["image_url"]["url"]
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    open(a.out, "wb").write(base64.b64decode(url.split(",", 1)[1]))
    print(a.out, "cost", d.get("usage", {}).get("cost"))


if __name__ == "__main__":
    main()
