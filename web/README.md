# Static Hearth website and documentation

The landing page and guides are built with Zola 0.23.6 and served from Cloudflare Pages. The live Rust/Hearth demo stays in site/ and runs separately on Fly.io. No Rust server or browser JavaScript is needed to read the static site.

## Build and test

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter @hearth/site build
cd web
pnpm exec playwright install chromium
pnpm test
```

Install Zola 0.23.6 on PATH. The build reads the authoritative Markdown guides under ../docs, rewrites local guide links, strips Rustdoc-only links and hidden doctest lines, then invokes Zola. Generated content is under .generated/ and output under public/; neither is committed. It checks root-relative, document-relative and same-origin absolute generated links and assets. Python regression tests protect Rustdoc conversion and code examples.

HEARTH_SITE_URL and HEARTH_DEMO_URL override absolute production URLs. Internal links and assets stay root-relative on preview deployments; canonical and social metadata use the configured production origin. A custom domain is deliberately not configured.

## Deploy

```sh
pnpm --filter @hearth/site build
cd web
pnpm exec wrangler pages deploy public --project-name hearth-site --branch main
```

Initial production URL: https://hearth-site-tvw.pages.dev. Demo: https://wbunting-hearth-demo.fly.dev. The Pages project name is hearth-site; its provider-assigned domain has a suffix because the unsuffixed domain was unavailable.

The site-deploy workflow builds/tests pull requests without deployment credentials. On main it deploys the exact checkout after verification. GitHub Actions needs CLOUDFLARE_API_TOKEN with account-scoped Pages edit permission and CLOUDFLARE_ACCOUNT_ID as a variable. Local OAuth login is not a CI credential. Do not copy broad OAuth tokens into Actions.

The static CSP prohibits scripts, frames and connections; the demo opens as a normal link on its own origin. This avoids cross-origin iframe cookies and does not make docs depend on the demo's uptime. Fonts and icon/license assets are local.

The first deployment may be performed locally using the existing Cloudflare OAuth login. Production Actions deployment requires the separate restricted Pages token; without it, PR checks still pass but automatic deployment must be treated as blocked, not configured.
