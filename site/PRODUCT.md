# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Hearth, built in Rust. The live demo exercises the same public API described by the separate static documentation site in web/. The user authorized building the framework package and website together.

## Users

Rust developers evaluating a local-first web framework and looking for a small, runnable starting point.

## Product Purpose

Show how one Rust application can render an initial page on the server and run reactive queries and optimistic writes in the browser.

## Capabilities and Constraints

Hearth is experimental. Client expressions compile to JavaScript, not WebAssembly. The browser query engine stores tables in memory and persists authoritative server rows through an IndexedDB worker. Pending writes are not a durable offline queue. The server authorizes reads and validates writes. Registry publication is not confirmed until checked against crates.io. There are no customer claims or current comparative benchmark claims to publish.

## Brand Commitments

The existing keyed-arch logo, lowercase hearth wordmark, ivory ground, charcoal ink and terracotta accent are retained. Zero and LiveStore are references for clear technical explanation and interactive demonstrations, not identities to copy.

## Evidence on Hand

The tracker in examples/hearth-tracker is a full Rust application. The site will include a small live-query example with illustrative data, clearly identified as a demo. Topcoat's MIT license and attribution must be preserved in the repository NOTICE, LICENSE and README.
