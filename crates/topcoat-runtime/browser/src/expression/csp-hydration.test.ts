// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
import { loadExpressions } from "./compile";
import { PageRefresh } from "../../../../topcoat-cli/browser/src/refresh";
import { Runtime } from "../runtime";
import { flushEffects } from "../reactivity";

vi.unmock("./compile");
vi.mock("./module", () => ({
	importExpressions: async () => ({
		default: Object.fromEntries(
			["b", "c", "d", "e"].map((letter) => [
				letter.repeat(64),
				(cx: any, captures: unknown[]) => () => (cx.clicked = captures[0]),
			]),
		),
	}),
}));
const ref = "#" + "b".repeat(64) + ":[&quot;new shard&quot;]";
let runtime: Runtime;
afterEach(() => {
	runtime?.page.dispose();
	runtime?.navigation.dispose();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	document.body.innerHTML = "";
	document.body.removeAttribute("data-topcoat-on:click");
	document.documentElement.removeAttribute("data-topcoat-on:click");
});

it("loads new functions before hydrating a shard response and live swap without eval", async () => {
	vi.stubGlobal("Function", () => {
		throw new Error("eval blocked");
	});
	vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
	runtime = new Runtime();
	runtime.start(document);
	const html = `<html><head></head><body><button data-topcoat-on:click="${ref}">run</button><!--::topcoat::region::start(a)--><b>old</b><!--::topcoat::region::end(a)--></body></html>`;
	vi.stubGlobal(
		"fetch",
		async () => new Response(JSON.stringify({ t: "snapshot", html }) + "\n"),
	);
	await runtime.page.refresh();
	(document.querySelector("button") as HTMLButtonElement).click();
	expect((runtime.context as any).clicked).toBe("new shard");
	const swap = `<button data-topcoat-on:click="${ref}">swap</button>`;
	await loadExpressions(swap);
	const region = runtime.page.contentScope.findRegion("a")!;
	expect(region).toBeDefined();
	runtime.page.applySwap("a", swap, region.scope.render);
	(document.querySelectorAll("button")[1] as HTMLButtonElement).click();
	flushEffects();
	expect(document.querySelectorAll("button")).toHaveLength(2);
	expect((runtime.context as any).clicked).toBe("new shard");
});

it("preloads handlers on html and body in a navigation document", async () => {
	const ref = "#" + "c".repeat(64) + ":[&quot;new shard&quot;]";
	const doc =
		'<html data-topcoat-on:click="' +
		ref +
		'"><head></head><body data-topcoat-on:click="' +
		ref +
		'"><b>root</b></body></html>';
	await loadExpressions(doc);
	runtime = new Runtime();
	runtime.page.replaceDocument(
		new DOMParser().parseFromString(doc, "text/html"),
		Symbol("navigation"),
	);
	document.body.click();
	expect((runtime.context as any).clicked).toBe("new shard");
});

it("preloads new snapshot and swap functions through the dev refresh hooks", async () => {
	const ref = "#" + "d".repeat(64) + ":[&quot;new shard&quot;]";
	vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
	runtime = new Runtime();
	runtime.start(document);
	runtime.page.listenForDevRefresh();
	const html =
		'<html><head></head><body><button data-topcoat-on:click="' +
		ref +
		'">refresh</button><!--::topcoat::region::start(a)--><b>old</b><!--::topcoat::region::end(a)--></body></html>';
	const swap =
		'<button data-topcoat-on:click="#' +
		"e".repeat(64) +
		':[&quot;new shard&quot;]">swap</button>';
	const frames = [
		{ t: "snapshot", html },
		{ t: "swap", region: "a", html: swap },
	];
	vi.stubGlobal(
		"fetch",
		async () =>
			new Response(frames.map((x) => JSON.stringify(x)).join("\n"), {
				headers: { "Content-Type": "application/x-ndjson" },
			}),
	);
	const reportError = vi.fn();
	const refresh = new PageRefresh(
		() => false,
		() => {},
		reportError,
	);
	await refresh.refresh();
	expect(reportError).not.toHaveBeenCalled();
	const buttons = document.querySelectorAll("button");
	expect(buttons).toHaveLength(2);
	(buttons[1] as HTMLButtonElement).click();
	expect((runtime.context as any).clicked).toBe("new shard");
});
