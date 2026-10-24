// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
import { flushEffects, signal } from "../reactivity";
import { Runtime } from "../runtime";
import { Scope } from "../scope";
import { localDb, type Query } from "./db";
import { mountWhen } from "./list";

const tasks: (() => void)[] = [];
let scope: Scope;
let nextId = 0;
function setup(content: string) {
	vi.useFakeTimers();
	vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
	vi.stubGlobal("scheduler", { postTask: (fn: () => void) => tasks.push(fn) });
	const id = `warm-test-${nextId++}`;
	document.body.innerHTML = `<template id="${id}">${content}</template><!--start--><!--end-->`;
	const runtime = new Runtime();
	scope = new Scope(null, runtime);
	const active = signal(false);
	(scope.context as any).active = active;
	const start = document.body.childNodes[1] as Comment;
	const end = document.body.childNodes[2] as Comment;
	mountWhen(start, end, "cx.active()", id, scope);
	return { active, runtime };
}
function drain() {
	while (tasks.length) tasks.shift()!();
}
afterEach(() => {
	scope?.dispose();
	tasks.length = 0;
	document.body.innerHTML = "";
	vi.clearAllTimers();
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});
it("pre-mounts hidden content once and reuses its nodes and listeners", () => {
	const { active } = setup(
		`<button data-topcoat-on:click="() => cx.clicked = (cx.clicked || 0) + 1">ready</button>`,
	);
	expect(document.querySelector("hearth-when button")).toBeNull();
	drain();
	const button = document.querySelector(
		"hearth-when button",
	) as HTMLButtonElement;
	expect(button).not.toBeNull();
	expect(button.parentElement!.style.display).toBe("none");
	active.set(true);
	flushEffects();
	expect(button.parentElement!.style.display).toBe("contents");
	active.set(false);
	flushEffects();
	active.set(true);
	flushEffects();
	expect(document.querySelector("hearth-when button")).toBe(button);
	button.click();
	expect((scope.context as any).clicked).toBe(1);
});
it("finishes partial hydration when navigation arrives before idle work", () => {
	const { active } = setup(
		`<button data-topcoat-on:click="() => cx.clicked = true">ready</button>`,
	);
	tasks.shift()!(); // clone, leaving hydration queued
	active.set(true);
	flushEffects();
	(document.querySelector("hearth-when button") as HTMLButtonElement).click();
	expect((scope.context as any).clicked).toBe(true);
	drain();
	expect(document.querySelectorAll("hearth-when button")).toHaveLength(1);
});
it("continues hydrating siblings after a bad speculative binding", () => {
	setup(
		`<b data-topcoat-bind:title="cx.missing()"></b><button data-topcoat-on:click="() => cx.clicked = true">ready</button>`,
	);
	const report = vi
		.spyOn(scope.runtime, "reportError")
		.mockImplementation(() => {});
	drain();
	(document.querySelector("hearth-when button") as HTMLButtonElement).click();
	expect((scope.context as any).clicked).toBe(true);
	expect(report).toHaveBeenCalledOnce();
});

it("continues hydrating siblings after a failed nested region mount", () => {
	const marker = JSON.stringify({
		cond: "cx.missing()",
		template: "failed-inner",
	});
	setup(
		`<!--::hearth::when::start(${marker})--><!--::hearth::when::end--><template id="failed-inner"><b>unused</b></template><button data-topcoat-on:click="() => cx.clicked = true">ready</button>`,
	);
	const report = vi
		.spyOn(scope.runtime, "reportError")
		.mockImplementation(() => {});
	drain();
	(document.querySelector("hearth-when button") as HTMLButtonElement).click();
	expect((scope.context as any).clicked).toBe(true);
	expect(report).toHaveBeenCalledOnce();
});

it("rebuilds guarded bindings that failed before their condition was true", () => {
	const { active } = setup(
		`<b data-topcoat-bind:title="cx.value().x"></b><button data-topcoat-on:click="cx.value().handler">ready</button>`,
	);
	const value = signal<{ x: string; handler: () => void } | null>(null);
	(scope.context as any).value = value;
	vi.spyOn(scope.runtime, "reportError").mockImplementation(() => {});
	drain();
	const clicked = vi.fn();
	value.set({ x: "ready", handler: clicked });
	active.set(true);
	flushEffects();
	expect(document.querySelector("hearth-when b")?.getAttribute("title")).toBe(
		"ready",
	);
	(document.querySelector("hearth-when button") as HTMLButtonElement).click();
	expect(clicked).toHaveBeenCalledOnce();
});

it("keeps the outer route warm when a nested inactive guard fails", () => {
	const marker = JSON.stringify({
		cond: "cx.innerActive()",
		template: "nested-guard-test",
	});
	const { active } = setup(
		`<h1>outer</h1><!--::hearth::when::start(${marker})--><!--::hearth::when::end--><template id="nested-guard-test"><b data-topcoat-bind:title="cx.value().x"></b></template>`,
	);
	const value = signal<{ x: string } | null>(null);
	const innerActive = signal(false);
	(scope.context as any).value = value;
	(scope.context as any).innerActive = innerActive;
	vi.spyOn(scope.runtime, "reportError").mockImplementation(() => {});
	drain();
	const heading = document.querySelector("hearth-when h1");
	active.set(true);
	flushEffects();
	expect(document.querySelector("hearth-when h1")).toBe(heading);
	value.set({ x: "valid" });
	innerActive.set(true);
	flushEffects();
	expect(document.querySelector("hearth-when b")?.getAttribute("title")).toBe(
		"valid",
	);
	expect(document.querySelector("hearth-when h1")).toBe(heading);
});

it.each([false, true])(
	"warms an empty list shell (placeholder failure: %s)",
	(failPlaceholder) => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				Promise.resolve(
					new Response(
						JSON.stringify([
							{ id: "one", title: "first" },
							{ id: "two", title: "second" },
						]),
					),
				),
			),
		);
		const db = localDb();
		const name = `warm-items-${failPlaceholder}`;
		const rowTemplate = `warm-row-test-${failPlaceholder}`;
		db.init(
			{
				version: "1",
				scope: "test",
				tables: [
					{
						name,
						key: "id",
						columns: { id: "string", title: "string" },
						indexes: [],
						load: "/unused",
						mutate: "/unused",
					},
				],
			},
			{
				[name]: [
					{ id: "one", title: "first" },
					{ id: "two", title: "second" },
				],
			},
		);
		const query: Query = {
			from: { table: name, alias: "i", key: "id" },
			joins: [],
			where: { op: "eq", l: { col: ["i", "id"] }, r: { param: 0 } },
			order: [],
			limit: 1,
			select: { id: { col: ["i", "id"] }, title: { col: ["i", "title"] } },
			key: "id",
			types: { id: "string", title: "string" },
		};
		const marker = JSON.stringify({
			query,
			params: ["cx.key()"],
			template: rowTemplate,
		});
		const nested = JSON.stringify({
			cond: "false",
			template: `lazy-inner-${failPlaceholder}`,
		});
		const title = failPlaceholder
			? `cx.row('${rowTemplate}').id.dehydrate().length ? cx.row('${rowTemplate}').title : cx.invalidPlaceholder()`
			: `cx.row('${rowTemplate}').title`;
		const clone = vi.spyOn(DocumentFragment.prototype, "cloneNode");
		const { active } = setup(
			`<!--::hearth::list::start(${marker})--><!--::hearth::list::end--><template id="${rowTemplate}"><h1 data-topcoat-bind:title="${title}"></h1><!--::hearth::when::start(${nested})--><!--::hearth::when::end--><template id="lazy-inner-${failPlaceholder}"><em>not warmed per row</em></template></template>`,
		);
		const key = signal("");
		(scope.context as any).key = key;
		vi.spyOn(scope.runtime, "reportError").mockImplementation(() => {});
		drain();
		const warmedClones = clone.mock.calls.length;
		expect(warmedClones).toBeGreaterThan(0);
		key.set("one");
		active.set(true);
		flushEffects();
		// Param queries run in a microtask; return a promise to observe reconciliation.
		return Promise.resolve()
			.then(() => {
				flushEffects();
			})
			.then(() => {
				const heading = document.querySelector("hearth-when h1")!;
				expect(heading.getAttribute("title")).toBe("first");
				drain();
				expect(document.querySelector("hearth-when em")).toBeNull();
				if (!failPlaceholder)
					expect(clone.mock.calls.length).toBe(warmedClones);
				else expect(clone.mock.calls.length).toBeGreaterThan(warmedClones);
				key.set("two");
				flushEffects();
				return Promise.resolve()
					.then(() => {
						flushEffects();
					})
					.then(() => {
						expect(document.querySelector("hearth-when h1")).toBe(heading);
						expect(heading.getAttribute("title")).toBe("second");
					});
			});
	},
);

it("yields again when an already-warmed hidden list changes its result", async () => {
	const name = "warm-many";
	const rows = Array.from({ length: 160 }, (_, n) => ({
		id: String(n),
		group: n < 80 ? "a" : "b",
	}));
	const db = localDb();
	vi.stubGlobal(
		"fetch",
		vi.fn(() => Promise.resolve(new Response(JSON.stringify(rows)))),
	);
	db.init(
		{
			version: "1",
			scope: "test",
			tables: [
				{
					name,
					key: "id",
					columns: { id: "string", group: "string" },
					indexes: [],
					load: "/unused",
					mutate: "/unused",
				},
			],
		},
		{ [name]: rows },
	);
	const query: Query = {
		from: { table: name, alias: "i", key: "id" },
		joins: [],
		where: { op: "eq", l: { col: ["i", "group"] }, r: { param: 0 } },
		order: [],
		limit: null,
		select: { id: { col: ["i", "id"] }, group: { col: ["i", "group"] } },
		key: "id",
		types: { id: "string", group: "string" },
	};
	const marker = JSON.stringify({
		query,
		params: ["cx.group()"],
		template: "warm-many-row",
	});
	setup(
		`<!--::hearth::list::start(${marker})--><!--::hearth::list::end--><template id="warm-many-row"><b data-topcoat-bind:title="cx.row('warm-many-row').group"></b></template>`,
	);
	const group = signal("a");
	(scope.context as any).group = group;
	let clock = 0;
	vi.spyOn(performance, "now").mockImplementation(() => clock);
	const original = db.surrogate.bind(db);
	const surrogate = vi
		.spyOn(db, "surrogate")
		.mockImplementation((row, types) => {
			clock += 3;
			return original(row, types);
		});
	drain();
	expect(document.querySelectorAll('hearth-when b[title="a"]')).toHaveLength(
		80,
	);
	surrogate.mockClear();
	group.set("b");
	flushEffects();
	await Promise.resolve();
	tasks.shift()!();
	expect(surrogate.mock.calls.length).toBeLessThan(80);
	drain();
	flushEffects();
	expect(document.querySelectorAll('hearth-when b[title="b"]')).toHaveLength(
		80,
	);
	expect(document.querySelectorAll('hearth-when b[title="a"]')).toHaveLength(0);
});
