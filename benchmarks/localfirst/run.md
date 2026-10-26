# Local-first comparison (hearth-tracker)

Same server binary, same 50,516-issue SQLite DB, same `/_hearth` endpoints:

- `/issues`: **hearth** (pure Rust, SSR first view + TanStack DB in the fork's runtime)
- `/bench/hearth`: **plain Hearth** (server-authoritative: signals → shard re-render over HTTP)
- `/bench/react`: **React 19 + TanStack DB** (client-rendered SPA, `useLiveQuery`, `useDeferredValue`)

Latency: `SIMULATED_RTT_MS=50 ./target/release/hearth-tracker` adds 50ms to every request.
Probes: `probe.js` (LOAD / FILTER / NAV / typing), visible Chromium tab, localhost.
