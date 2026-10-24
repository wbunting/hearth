import { Runtime } from "./runtime";

import { localDb } from "./hearth/db";
import { route } from "./hearth/router";

// [hearth] Local DB first, so list regions can query during hydration.
const boot = document.getElementById("hearth-boot");
if (boot) {
	const b = JSON.parse(boot.textContent ?? "{}");
	localDb().init(b.schema, b.snapshot ?? {});
	route.init();
	(window as any).__hearth = { db: localDb(), boot: b, route };
}

const runtime = new Runtime();
runtime.start(document);
runtime.page.listenForDevRefresh();
