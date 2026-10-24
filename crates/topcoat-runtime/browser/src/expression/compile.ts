import type { Context } from "./context";

export type Expression<T = unknown> = (cx: Context) => T;

/**
 * [hearth] Shared JS table for `@N` references. SSR list rows reference
 * their `$()` source by index instead of repeating it per row.
 */
let jsTable: string[] = [];
/** Captures the active table for hydration that continues after a yield. */
export function getJsTable(): string[] {
	return jsTable;
}
/** Sets the active table; returns the previous one (restore it after). */
export function setJsTable(table: string[]): string[] {
	const prev = jsTable;
	jsTable = table;
	return prev;
}

/** [hearth] Compiled functions are pure in `cx`, so identical sources share one. */
const cache = new Map<string, Expression<unknown>>();

/** Compiles server-generated source without evaluating it. */
export function compile<T = unknown>(
	source: string,
	label: string,
): Expression<T> {
	let src = source;
	if (src.charCodeAt(0) === 64 /* @ */) {
		const resolved = jsTable[Number(src.slice(1))];
		if (resolved === undefined) throw new Error(`Unknown JS reference ${src} in ${label}`);
		src = resolved;
	}
	const hit = cache.get(src);
	if (hit) return hit as Expression<T>;
	try {
		const fn = new Function("cx", `return ${src};`) as Expression<T>;
		cache.set(src, fn as Expression<unknown>);
		return fn;
	} catch (cause) {
		throw new Error(`Failed to compile ${label}`, { cause });
	}
}
