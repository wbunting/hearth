# Hosting Hearth's website and live demo

Hearth follows the same separation as Stenly: Cloudflare Pages serves static marketing and guide content; Fly.io runs the illustrative Rust application. The provider URLs work before a custom domain is chosen.

## Static site

Use web/README.md for local build and deployment. Its Zola build derives pages from top-level docs/ so guides are not maintained twice. Cloudflare project hearth-site serves https://hearth-site-tvw.pages.dev. A no-script CSP, self-hosted assets and same-origin navigation keep documentation independent of the application server.

## Fly demo

The Fly app wbunting-hearth-demo uses fly.toml and the root-context site/Dockerfile. Keep fly.toml at the repository root: Fly resolves its Dockerfile and default source context relative to the configuration directory. A config under site/ would resolve site/Dockerfile as site/site/Dockerfile and omit the root workspace. The multi-stage image builds the application and matching assets together and runs as a non-root user. It uses one 512 MB shared CPU machine in nrt, with automatic suspend/start and zero minimum running machines to limit idle cost. Suspension preserves the process where supported; cold starts, deployments and restarts reset in-memory data and are not a durability promise. No persistent volume is needed for illustrative rows.

The server binds 0.0.0.0:8080, responds to /healthz, and enables Secure demo cookies in production. Trusted proxy addresses are configured only in Fly's environment, and the rate limiter uses the framework's resolved client IP instead of accepting arbitrary forwarded headers. It caps new landing requests per IP, total requests per IP, global visitor allocations and limiter storage. Table authorization, cursor isolation and a 256-visitor FIFO remain separate protections. Limits are per process, not a distributed abuse-prevention system.

```sh
flyctl deploy --config fly.toml --remote-only --ha=false
```

Do not deploy a second machine without accounting for the process-local database. Each instance has independent demo data; a browser might need a reload to reseed after migration or restart. Deploy binary and assets from the same image. Health checks bypass allocation and rate limiting.

## Continuous deployment

.github/workflows/site-deploy.yml tests static pages and the demo image on pull requests. Production deployment is restricted to main and uses the exact triggering checkout. Set a Fly app-scoped deploy token as FLY_API_TOKEN; do not use a broad account token. Cloudflare Pages uses its own dedicated Actions token. No secret belongs in a committed file or Docker build context.

After a deployment, verify HTTPS, the health endpoint, secure cookie behavior, scoped row loads, a real mutation/readback, expression module loads and CSP errors. A successful image upload is not application verification.

## Custom domain

Choose the public Hearth domain before adding DNS records or certificates. Set the Pages custom domain and Fly demo hostname separately, then update HEARTH_SITE_URL, HEARTH_DEMO_URL and configuration defaults. Do not change Stenly's domain or DNS records as part of Hearth deployment.
