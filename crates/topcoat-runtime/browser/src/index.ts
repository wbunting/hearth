import { Runtime } from "./runtime";

import { localDb } from "./fastcoat/db";
import { route } from "./fastcoat/router";

// [fastcoat] Local DB first, so list regions can query during hydration.
const boot = document.getElementById("fastcoat-boot");
if (boot) {
	const b = JSON.parse(boot.textContent ?? "{}");
	localDb().init(b.schema, b.snapshot ?? {});
	route.init();
	(window as any).__fastcoat = { db: localDb(), boot: b, route };
}

const runtime = new Runtime();
runtime.start(document);
runtime.page.listenForDevRefresh();
