import { Runtime } from "./runtime";

import { localDb } from "./fastcoat/db";
import "./fastcoat/router";

// [fastcoat] Local DB first, so list regions can query during hydration.
const boot = document.getElementById("fastcoat-boot");
if (boot) {
	const b = JSON.parse(boot.textContent ?? "{}");
	localDb().init(b.schema, b.snapshot ?? {});
	(window as any).__fastcoat = { db: localDb(), boot: b };
}

const runtime = new Runtime();
runtime.start(document);
runtime.page.listenForDevRefresh();
