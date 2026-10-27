# Hearth website

The real Rust application and live demo, deployed separately from the static website in web/. It includes a real local-query and optimistic-write demo. No hand-written application JavaScript is required. Demo data is scoped to a random HttpOnly browser cookie. The in-memory database resets when the process restarts; opening the page reseeds the browser's rows.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build:runtime
cargo build --locked --release -p hearth-cli -p hearth-site
./target/release/hearth asset bundle --release -p hearth-site
PORT=3620 HOST=127.0.0.1 ./target/release/hearth-site
```

Open `http://127.0.0.1:3620`. Build and deploy the binary with its matching `target/release/assets` directory. Fly deployment is configured in fly.toml and Dockerfile; see ../docs/deployment.md. Use a reverse proxy with HTTPS and preserve same-origin expression module and mutation routes.

The page's strict CSP permits only same-origin scripts, styles, fonts, connections and images. Fonts are self-hosted. The Manrope license is in `assets/Manrope-LICENSE.txt`; logo assets come from `docs/hearth/brand`.

The public guide includes crates.io installation for Hearth 0.1.0. The source commands above build this website; they are not required to create a registry-installed Hearth application. Release verification used a standalone registry-only copy of the site, the installed 0.1.0 CLI and the real browser filter/write flow.

## Limits

This is an illustrative demo, not an account system. Browser session identifiers are unguessable bearer cookies, not signed identities. The public demo creates a small set of database rows per new browser and retains at most 256 browser datasets and evicts the oldest. Process-local rate limits bound landing requests, total requests and IP-map storage; deploy an external abuse-prevention layer if stronger distributed protection is needed. Do not store sensitive data in this example. The demo is intentionally ephemeral and always uses an in-memory database. It does not connect to an application database.

Set `HEARTH_SITE_SECURE=1` behind HTTPS to require secure transport for the demo cookie. Per-browser delta cursors use the same request-scoped identity as the read policy.

Fly automatically suspends the single demo machine when idle and resumes it on demand. Deployments and cold restarts reset the in-memory rows; reload an old tab to reseed its illustrative dataset. No volume or durable write promise is implied.
