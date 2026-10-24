#!/usr/bin/env bash
# Rebuild runtime + fastissuetracker and restart on :3100.
# The browser runtime is embedded via `asset!` in topcoat-runtime, which cargo
# does not track as a dependency: touch it so a rebuilt dist/index.js is used.
set -euo pipefail
cd "$(dirname "$0")/.."
(cd crates/topcoat-runtime/browser && pnpm build >/dev/null)
touch crates/topcoat-runtime/src/lib.rs
cargo build -p fastissuetracker --release 2>&1 | grep -E "^error" -A8 || true
topcoat asset bundle --release -p fastissuetracker >/dev/null
pkill -f target/release/fastissuetracker || true
sleep 1
(SIMULATED_RTT_MS="${SIMULATED_RTT_MS:-0}" PORT=3100 nohup ./target/release/fastissuetracker >/tmp/fit.log 2>&1 &)
sleep 2
curl -s -H "Cookie: $(cat /tmp/fit-crew)" http://127.0.0.1:3100/issues | grep -o "topcoat-[0-9a-f]*\.js" | head -1
