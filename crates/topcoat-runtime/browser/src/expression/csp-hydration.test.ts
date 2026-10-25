// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
import { loadExpressions } from "./compile";
import { Runtime } from "../runtime";
import { flushEffects } from "../reactivity";

vi.unmock("./compile");
vi.mock(
	"/_topcoat/expressions.js?ids=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
	() => ({
		default: {
			bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb:
				(cx: any, captures: unknown[]) => () =>
					(cx.clicked = captures[0]),
		},
	}),
);
const ref = "#" + "b".repeat(64) + ":[&quot;new shard&quot;]";
let runtime: Runtime;
afterEach(() => {
	runtime?.page.dispose();
	runtime?.navigation.dispose();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	document.body.innerHTML = "";
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
