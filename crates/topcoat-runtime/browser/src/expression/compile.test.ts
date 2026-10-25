// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
import { compile, loadExpressions, setJsTable } from "./compile";
import type { Context } from "./context";

vi.unmock("./compile");
vi.mock(
	"/_topcoat/expressions.js?ids=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	() => ({
		default: {
			aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa: (
				cx: { value: number },
				captures: number[],
			) => cx.value + captures[0]!,
		},
	}),
);
const id = "a".repeat(64);
afterEach(() => {
	setJsTable([]);
	vi.unstubAllGlobals();
});

it("loads functions once and keeps captures and contexts independent without eval", async () => {
	vi.stubGlobal("Function", () => {
		throw new Error("eval disabled");
	});
	await Promise.all([
		loadExpressions(
			`<template><b data-topcoat-bind:title="#${id}:[2]"></b></template>`,
		),
		loadExpressions(`<b data-topcoat-bind:title="#${id}:[4]"></b>`),
	]);
	const cx = { value: 3 } as unknown as Context;
	expect(compile<number>(`#${id}:[2]`, "first")(cx)).toBe(5);
	expect(compile<number>(`#${id}:[4]`, "second")(cx)).toBe(7);
	setJsTable([`#${id}:[6]`]);
	expect(compile<number>("@0", "row")(cx)).toBe(9);
});

it("rejects source, unknown functions and unknown list references", () => {
	expect(() => compile("globalThis.pwned = true", "injected")).toThrow();
	expect(() => compile(`#${"0".repeat(64)}:[]`, "missing")).toThrow();
	expect(() => compile("@42", "missing row")).toThrow();
});

it("does not import reference-shaped text or captured strings", async () => {
	const fake = "#" + "f".repeat(64) + ":[]";
	await loadExpressions(
		`<p>` +
			fake +
			`</p><script type="application/json">["` +
			fake +
			`"]</script><button data-topcoat-on:click="#` +
			id +
			`:[&quot;` +
			fake +
			`&quot;]"></button>`,
	);
});
