# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Zola static site and guides on Cloudflare Pages, following the user's approved Stenly hosting pattern. A separate native Rust/Hearth application on Fly.io provides real local-query and server-validated write demonstrations. Authoritative guide sources remain under top-level docs/.

## Users and purpose

Rust developers evaluating Hearth, learning its APIs and trying a working example. Reading the landing page and documentation must not require a backend, browser JavaScript or account.

## Capabilities and constraints

Hearth 0.1.0 is published and verified. It is experimental. Client expressions generate JavaScript, not WASM. Persistence caches authoritative rows and is not a durable offline write queue. Performance comparisons require equivalent measured workloads. The Fly demo is illustrative, in-memory and visitor-scoped, with bounded retention and process-local rate limits.

## Brand commitments

Preserve the existing keyed-arch logo, ivory/charcoal/terracotta palette, Manrope and the website's structure. This is a hosting split and documentation extension, not a rebrand. No sponsor or invented adoption claims. Preserve upstream Topcoat MIT attribution in the repository NOTICE, LICENSE and README; the site footer need not repeat it.

## Hosting

Production URLs are https://usehearth.dev and https://demo.usehearth.dev. Stenly's services, credentials and deployments are outside this change.
