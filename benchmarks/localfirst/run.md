# Local-first comparison (fastissuetracker)

Same server binary, same 50,516-issue SQLite DB, same `/_fastcoat` endpoints:

- `/issues`: **fastcoat** (pure Rust, SSR first view + TanStack DB in the fork's runtime)
- `/bench/topcoat`: **plain Topcoat** (server-authoritative: signals → shard re-render over HTTP)
- `/bench/react`: **React 19 + TanStack DB** (client-rendered SPA, `useLiveQuery`, `useDeferredValue`)

Latency: `SIMULATED_RTT_MS=50 ./target/release/fastissuetracker` adds 50ms to every request.
Probes: `probe.js` (LOAD / FILTER / NAV / typing), visible Chromium tab, localhost.
