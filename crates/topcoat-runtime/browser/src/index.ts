import { Runtime } from "./runtime";
import { loadExpressions } from "./expression/compile";

import { localDb } from "./hearth/db";
import { route } from "./hearth/router";
import { bootExpressions } from "./expression/boot";

// [hearth] Local DB first, so list regions can query during hydration.
const boot = document.getElementById("hearth-boot");
if (boot) {
	const b = JSON.parse(boot.textContent ?? "{}");
	localDb().init(b.schema, b.snapshot ?? {});
	route.init();
	(window as any).__hearth = { db: localDb(), boot: b, route };
} else if (document.querySelector("[data-hearth-clear]")) {
	// Explicit application logout/login marker, never a generic error page.
	setTimeout(() => {
		try { globalThis.indexedDB?.deleteDatabase("hearth-sync-v1"); }
		catch { /* Storage may be blocked. */ }
	}, 0);
}

const runtime = new Runtime();
const start = () => {
	runtime.start(document);
	runtime.page.listenForDevRefresh();
	performance.mark("topcoat:ready");
};
await bootExpressions(() => loadExpressions(document), start);
