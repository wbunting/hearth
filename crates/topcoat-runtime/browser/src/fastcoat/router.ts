// [fastcoat] Client routing. The URL path is a reactive value; Rust reads
// it through `route::path(cx)` / `route::segment(cx, n)` in `$()` (server
// value = the request path), and `if $(...)` regions switch on it.
// Same-origin `<a data-fastcoat-link>` clicks push history instead of
// navigating. Lazily initialized (no DOM access at import time).

import { signal, type WriteSignal } from "../reactivity";
import { String as RString } from "../surrogate/string";

let path: WriteSignal<string> | null = null;

function current(): WriteSignal<string> {
	if (path) return path;
	path = signal(location.pathname + location.search);
	document.addEventListener("click", (e) => {
		if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		const a = (e.target as Element | null)?.closest?.("a[data-fastcoat-link]") as HTMLAnchorElement | null;
		if (!a) return;
		e.preventDefault();
		route.navigate(a.href);
	});
	addEventListener("popstate", () => route.navigate(location.href, false));
	history.replaceState({ fastcoat: true }, "");
	return path;
}

export const route = {
	init: current,
	/** Current path+query as a Topcoat String surrogate (reactive). */
	path(): RString {
		return new RString(current()());
	},
	/** `n`th path segment (0-based) or "". */
	segment(n: number): RString {
		const segs = current()().split("?")[0]!.split("/").filter(Boolean);
		return new RString(segs[n] ?? "");
	},
	/** Query parameter value or "". */
	query(name: string): RString {
		const q = current()().split("?")[1] ?? "";
		return new RString(new URLSearchParams(q).get(name) ?? "");
	},
	navigate(to: string, push = true) {
		const url = new URL(to, location.href);
		if (url.origin !== location.origin) {
			location.href = to;
			return;
		}
		if (push) history.pushState({ fastcoat: true }, "", url);
		const t0 = performance.now();
		current().set(url.pathname + url.search);
		requestAnimationFrame(() => ((window as any).__fastcoatNavMs = performance.now() - t0));
		if (push) scrollTo(0, 0);
	},
};
