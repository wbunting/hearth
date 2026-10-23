// [fastcoat] Client routing. The URL path is a reactive value; Rust reads
// it through `route::path()` / `route::param(n)` in `$()` (server value =
// the request path) and `client_when!` regions switch on it. Same-origin
// `<a data-fastcoat-link>` clicks push history instead of navigating.

import { signal } from "../reactivity";
import { String as RString } from "../surrogate/string";

const path = signal(location.pathname + location.search);

export const route = {
	/** Current path+query as a Topcoat String surrogate (reactive). */
	path(): RString {
		return new RString(path());
	},
	/** `n`th path segment (0-based) or "". */
	segment(n: number): RString {
		const segs = path().split("?")[0]!.split("/").filter(Boolean);
		return new RString(segs[n] ?? "");
	},
	navigate(to: string, push = true) {
		const url = new URL(to, location.href);
		if (url.origin !== location.origin) {
			location.href = to;
			return;
		}
		if (push) history.pushState({ fastcoat: true }, "", url);
		const t0 = performance.now();
		path.set(url.pathname + url.search);
		requestAnimationFrame(() => ((window as any).__fastcoatNavMs = performance.now() - t0));
		scrollTo(0, 0);
	},
};

document.addEventListener("click", (e) => {
	if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
	const a = (e.target as Element | null)?.closest?.("a[data-fastcoat-link]") as HTMLAnchorElement | null;
	if (!a) return;
	e.preventDefault();
	route.navigate(a.href);
});
addEventListener("popstate", () => route.navigate(location.href, false));
history.replaceState({ fastcoat: true }, "");
(globalThis as any).__fastcoatRoute = route;
