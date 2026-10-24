// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
import { hydrate } from "../dom/hydrate";
import { setJsTable } from "../expression/compile";
import { Runtime } from "../runtime";
import { Scope } from "../scope";
import { IdleWork, idleWork } from "./idle";

const tasks: (() => void)[] = [];
function setup() {
	vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
	vi.stubGlobal("scheduler", { postTask: (fn: () => void) => tasks.push(fn) });
	return new Scope(null, new Runtime());
}
afterEach(() => {
	tasks.length = 0;
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});
it("yields speculative work between bounded slices", () => {
	const scope = setup();
	let clock = 0;
	vi.spyOn(performance, "now").mockImplementation(() => clock);
	const work = new IdleWork(scope);
	const seen: number[] = [];
	for (let i = 0; i < 10; i++)
		work.add(() => {
			seen.push(i);
			clock += 3;
		});
	expect(seen).toEqual([]);
	tasks.shift()!();
	expect(seen).toEqual([0, 1]);
	expect(tasks).toHaveLength(1);
	while (tasks.length) tasks.shift()!();
	expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
	expect(idleWork(scope)).toBe(work);
	work.finish();
	expect(idleWork(scope)).toBeUndefined();
	scope.dispose();
});
it("drains descendant work when navigation overtakes idle hydration", () => {
	const scope = setup();
	const work = new IdleWork(scope);
	const child = new Scope(scope, scope.runtime);
	const seen: number[] = [];
	work.add(() => {
		seen.push(1);
		idleWork(child)!.add(() => seen.push(2));
	});
	work.finish();
	expect(seen).toEqual([1, 2]);
	while (tasks.length) tasks.shift()!();
	expect(seen).toEqual([1, 2]);
	scope.dispose();
});
it("cancels queued work when its owner is disposed", () => {
	const scope = setup();
	const job = vi.fn();
	new IdleWork(scope).add(job);
	scope.dispose();
	while (tasks.length) tasks.shift()!();
	expect(job).not.toHaveBeenCalled();
});
it("preserves SSR expression tables across hydration yields", () => {
	const scope = setup();
	const work = new IdleWork(scope);
	const root = document.createElement("div");
	root.innerHTML = `<b data-topcoat-bind:title="@0"></b>`;
	const previous = setJsTable(['"from the owning list"']);
	hydrate(root, null, null, scope);
	setJsTable(['"unrelated list"']);
	while (tasks.length) tasks.shift()!();
	expect(root.querySelector("b")?.getAttribute("title")).toBe(
		"from the owning list",
	);
	setJsTable(previous);
	work.finish();
	scope.dispose();
});

it("keeps replacement hydration synchronous under a hidden region", () => {
	const scope = setup();
	new IdleWork(scope);
	const child = new Scope(scope, scope.runtime);
	const root = document.createElement("div");
	root.innerHTML = `<!--::topcoat::signal({"t":"signal","id":"ab","v":1})--><!--::topcoat::dep("ab")-->`;
	scope.runtime.registry.insert("ab", 7);
	const adoptable = new Set(["ab"]);
	scope.runtime.hydrate(root, null, null, child, adoptable);
	expect(adoptable.size).toBe(0);
	expect(child.dependencies.has("ab")).toBe(true);
	expect(scope.runtime.registry.read("ab")).toBe(7);
	scope.dispose();
});

it("continues queued work after a failed job in both idle and activation", () => {
	const scope = setup();
	const report = vi
		.spyOn(scope.runtime, "reportError")
		.mockImplementation(() => {});
	const work = new IdleWork(scope);
	const seen: number[] = [];
	work.add(() => {
		throw new Error("failed job");
	});
	work.add(() => seen.push(1));
	while (tasks.length) tasks.shift()!();
	work.add(() => {
		throw new Error("failed activation job");
	});
	work.add(() => seen.push(2));
	work.finish();
	expect(seen).toEqual([1, 2]);
	expect(report).toHaveBeenCalledTimes(2);
	scope.dispose();
});

it("waits until load before scheduling speculative work", () => {
	const scope = setup();
	vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
	const job = vi.fn();
	new IdleWork(scope).add(job);
	expect(tasks).toHaveLength(0);
	window.dispatchEvent(new Event("load"));
	expect(tasks).toHaveLength(1);
	tasks.shift()!();
	expect(job).toHaveBeenCalledOnce();
	scope.dispose();
});
