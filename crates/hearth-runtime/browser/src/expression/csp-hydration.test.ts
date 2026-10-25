// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
import { loadExpressions } from "./compile";
import { PageRefresh } from "../../../../hearth-cli/browser/src/refresh";
import { Runtime } from "../runtime";
import { flushEffects } from "../reactivity";

vi.unmock("./compile");
vi.mock("./module", () => ({
	importExpressions: async () => ({
		default: Object.fromEntries(
			["b", "c", "d", "e", "f"].map((letter) => [
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
	document.body.removeAttribute("data-hearth-on:click");
	document.documentElement.removeAttribute("data-hearth-on:click");
});

it("loads new functions before hydrating a shard response and live swap without eval", async () => {
	vi.stubGlobal("Function", () => {
		throw new Error("eval blocked");
	});
	vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
	runtime = new Runtime();
	runtime.start(document);
	const html = `<html><head></head><body><button data-hearth-on:click="${ref}">run</button><!--::hearth::region::start(a)--><b>old</b><!--::hearth::region::end(a)--></body></html>`;
	vi.stubGlobal(
		"fetch",
		async () => new Response(JSON.stringify({ t: "snapshot", html }) + "\n"),
	);
	await runtime.page.refresh();
	(document.querySelector("button") as HTMLButtonElement).click();
	expect((runtime.context as any).clicked).toBe("new shard");
	const swap = `<button data-hearth-on:click="${ref}">swap</button>`;
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
		'<html data-hearth-on:click="' +
		ref +
		'"><head></head><body data-hearth-on:click="' +
		ref +
		'"><b>root</b></body></html>';
	await loadExpressions(doc, true);
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
		'<html><head></head><body><button data-hearth-on:click="' +
		ref +
		'">refresh</button><!--::hearth::region::start(a)--><b>old</b><!--::hearth::region::end(a)--></body></html>';
	const swap =
		'<button data-hearth-on:click="#' +
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

it("loads a cold table-row swap when capture data contains document tag text", async () => {
	runtime = new Runtime();
	document.body.innerHTML =
		"<table><tbody><!--::hearth::region::start(a)--><tr><td>old</td></tr><!--::hearth::region::end(a)--></tbody></table>";
	runtime.start(document);
	const captured = "<body><html>literal capture";
	const ref =
		"#" +
		"f".repeat(64) +
		":" +
		JSON.stringify([captured]).replaceAll('"', "&quot;");
	const swap = '<tr data-hearth-on:click="' + ref + '"><td>new</td></tr>';
	const frames = [{ t: "swap", region: "a", html: swap }];
	vi.stubGlobal(
		"fetch",
		async () =>
			new Response(frames.map((x) => JSON.stringify(x)).join("\n"), {
				headers: { "Content-Type": "application/x-ndjson" },
			}),
	);
	runtime.page.listenForDevRefresh();
	// A live swap's parser context stays a fragment even inside a page request.
	const { expressionResponse } = await import("./response");
	const { readFrames } = await import("../render/frames");
	const response = expressionResponse(
		await fetch("/test"),
		new AbortController().signal,
	);
	for await (const frame of readFrames(response)) {
		if (frame.t === "swap")
			runtime.page.applySwap(frame.region, frame.html, null);
	}
	(document.querySelector("tr") as HTMLElement).click();
	expect((runtime.context as any).clicked).toBe(captured);
	expect(document.querySelector("td")?.textContent).toBe("new");
});
