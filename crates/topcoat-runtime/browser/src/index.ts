import { Runtime } from "./runtime";

import { localDb } from "./hearth/db";
import { route } from "./hearth/router";
import { startAfterPaint } from "./hearth/start";

// [hearth] Local DB first, so list regions can query during hydration.
const boot = document.getElementById("hearth-boot");
if (boot) {
	const b = JSON.parse(boot.textContent ?? "{}");
	localDb().init(b.schema, b.snapshot ?? {});
	route.init();
	(window as any).__hearth = { db: localDb(), boot: b, route };
} else {
	// Pages outside the authenticated shell (including logout/login) must not
	// retain the previous viewer's durable rows. Keep cleanup off first paint.
	setTimeout(() => {
		try { globalThis.indexedDB?.deleteDatabase("hearth-sync-v1"); }
		catch { /* Storage may be blocked. */ }
	}, 0);
}

const runtime = new Runtime();
const start = () => {
	runtime.start(document);
	runtime.page.listenForDevRefresh();
};
// SSR already provides the first screen. Adopt it after the browser has a
// chance to paint, rather than making that paint wait for live query setup.
if (boot) startAfterPaint(start);
else start();
