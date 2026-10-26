// @vitest-environment happy-dom

import { afterEach, expect, it, vi } from "vitest";
import { flushEffects } from "../reactivity";
import { Runtime } from "../runtime";
import { startAfterPaint } from "./start";

let runtime: Runtime | undefined;
afterEach(() => {
	runtime?.page.dispose();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	document.body.innerHTML = "";
});

it("preserves input, change and clicks before scheduled hydration and starts only once", () => {
	let scheduled: (() => void) | undefined;
	vi.stubGlobal("scheduler", {
		postTask: (fn: () => void) => {
			scheduled = fn;
		},
	});
	vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
	document.body.innerHTML = `
		<!--::hearth::signal({"t":"signal","id":"draft","v":""})-->
		<textarea data-hearth-bind:value="cx.signal('draft').get()" data-hearth-on:input="e => cx.signal('draft').set(e.target.value)"></textarea>
		<input data-hearth-on:input="e => cx.signal('draft').set(e.target.value)">
		<button data-hearth-on:click="() => cx.signal('draft').set(cx.hydrate('clicked'))">change</button>`;
	const start = vi.fn(() => {
		runtime = new Runtime();
		runtime.start(document);
	});
	startAfterPaint(start);
	expect(start).not.toHaveBeenCalled();
	const textarea = document.querySelector("textarea")!;
	textarea.value = "user draft";
	textarea.setSelectionRange(2, 4, "backward");
	textarea.dispatchEvent(new Event("input", { bubbles: true }));
	flushEffects();
	expect(start).toHaveBeenCalledTimes(1);
	expect(textarea.value).toBe("user draft");
	expect([
		textarea.selectionStart,
		textarea.selectionEnd,
		textarea.selectionDirection,
	]).toEqual([2, 4, "backward"]);
	expect(
		(
			runtime?.context.signal("draft").get() as { dehydrate(): unknown }
		).dehydrate(),
	).toBe("user draft");
	scheduled?.();
	expect(start).toHaveBeenCalledTimes(1);
	document.querySelector("button")!.click();
	flushEffects();
	expect(textarea.value).toBe("clicked");
	vi.restoreAllMocks();
});

it("captures an event-only search input before hydration", () => {
	vi.stubGlobal("scheduler", { postTask: () => {} });
	vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
	document.body.innerHTML = `
		<!--::hearth::signal({"t":"signal","id":"query","v":""})-->
		<input data-hearth-on:input="e => cx.signal('query').set(e.target.value)">`;
	startAfterPaint(() => {
		runtime = new Runtime();
		runtime.start(document);
	});
	const input = document.querySelector("input")!;
	input.value = "search";
	input.dispatchEvent(new Event("input", { bubbles: true }));
	expect(
		(
			runtime?.context.signal("query").get() as { dehydrate(): unknown }
		).dehydrate(),
	).toBe("search");
	vi.restoreAllMocks();
});

it.each(["checkbox", "radio"])(
	"preserves first click activation of a %s",
	(type) => {
		vi.stubGlobal("scheduler", { postTask: () => {} });
		vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
		document.body.innerHTML = `
 <!--::hearth::signal({"t":"signal","id":"checked","v":false})-->
 <input type="${type}" name="choice" data-hearth-bind:indeterminate="true" data-hearth-bind:checked="cx.signal('checked').get()" data-hearth-on:change="e => cx.signal('checked').set(e.target.checked)">
 <input type="radio" name="choice" checked data-hearth-bind:checked="cx.signal('checked').get().not()">`;
		startAfterPaint(() => {
			runtime = new Runtime();
			runtime.start(document);
		});
		const [input, peer] = [...document.querySelectorAll("input")];
		input!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		flushEffects();
		expect(input!.checked).toBe(true);
		expect(input!.indeterminate).toBe(false);
		expect(
			(
				runtime?.context.signal("checked").get() as { dehydrate(): unknown }
			).dehydrate(),
		).toBe(true);
		expect(peer!.checked).toBe(false);
	},
);
