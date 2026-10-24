// @vitest-environment happy-dom

import { afterEach, expect, it, vi } from "vitest";
import { Runtime } from "../runtime";
import { localDb } from "./db";

let runtime: Runtime | undefined;
afterEach(() => {
	runtime?.page.dispose();
	vi.useRealTimers();
	vi.unstubAllGlobals();
	document.body.innerHTML = "";
});

it("adopts SSR nodes from a trailing seed and finds nested templates", async () => {
	vi.useFakeTimers();
	vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([
		{ id: "one", title: "updated" }, { id: "two", title: "added" },
	]), { status: 200 })));
	const db = localDb();
	db.init({ version: "test", scope: "test", tables: [{
		name: "trailing", key: "id", columns: { id: "string", title: "string" },
		indexes: [], load: "/trailing/load", mutate: "/trailing/mutate",
	}] }, {});
	const marker = {
		query: {
			from: { table: "trailing", alias: "t" }, joins: [], where: null,
			order: [], limit: null, key: "id",
			select: { id: { col: ["t", "id"] }, title: { col: ["t", "title"] } },
			types: { id: "string", title: "string" },
		},
		params: [], template: "trailing-row", seed: "trailing-seed",
	};
	const expression = 'cx.row("trailing-row").title';
	document.body.innerHTML = `
		<ul><!--::hearth::list::start(${JSON.stringify(marker)})-->
		<!--::hearth::item("one")--><li><!--::topcoat::expr::start("${expression.replaceAll('"', '&quot;')}")-->first<!--::topcoat::expr::end--></li><!--::hearth::item-end-->
		<!--::hearth::list::end--></ul>
		<template><template id="trailing-row"><li><!--::topcoat::expr::start("${expression.replaceAll('"', '&quot;')}")--><!--::topcoat::expr::end--></li></template></template>
		<script type="application/json" id="trailing-seed">{"trailing":[{"id":"one","title":"first"}]}</script>`;
	const original = document.querySelector("li");
	runtime = new Runtime();
	runtime.start(document);
	expect(document.querySelector("li")).toBe(original);
	expect(original?.textContent).toBe("first");
	db.apply("trailing", [{ id: "one", title: "updated" }, { id: "two", title: "added" }], false);
	await vi.advanceTimersByTimeAsync(0);
	expect(document.querySelector("li")).toBe(original);
	expect([...document.querySelectorAll("li")].map(li => li.textContent)).toEqual(["updated", "added"]);
});
