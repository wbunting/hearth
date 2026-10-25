// @vitest-environment happy-dom
import { expect, it } from "vitest";
import { expressionModuleUrl } from "./module";

it("resolves expression modules on the document origin rather than the CDN asset origin", () => {
	const asset = "https://cdn.example/assets/runtime.js";
	const path = "/_hearth/expressions.js?ids=abcd";
	const url = new URL(expressionModuleUrl(path));
	expect(url.origin).toBe(window.location.origin);
	expect(url.origin).not.toBe(new URL(asset).origin);
	expect(url.pathname).toBe("/_hearth/expressions.js");
});
