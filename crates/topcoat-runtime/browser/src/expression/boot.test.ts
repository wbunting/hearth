// @vitest-environment happy-dom
import { expect, it } from "vitest";
import { bootExpressions } from "./boot";

it("gates SSR interaction until delayed modules and hydration are ready", async () => {
	let release!: () => void;
	const loading = new Promise<void>((resolve) => {
		release = resolve;
	});
	let started = false;
	const ready = bootExpressions(
		() => loading,
		() => {
			expect(document.body.inert).toBe(true);
			started = true;
		},
	);
	expect(document.body.inert).toBe(true);
	expect(document.body.getAttribute("aria-busy")).toBe("true");
	expect(started).toBe(false);
	release();
	await ready;
	expect(started).toBe(true);
	expect(document.body.inert).toBe(false);
	expect(document.body.hasAttribute("aria-busy")).toBe(false);
});
