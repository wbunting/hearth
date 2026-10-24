// [hearth] Client regions: keyed lists over live queries, and `when`
// (conditional/route) regions. Both clone a server-rendered <template> and
// hydrate the clone with Topcoat's normal hydrator in a child Scope, so every
// `$()` inside works exactly as elsewhere. List items get a per-row ref
// (`cx.row(0)`) instead of a frozen capture.

import { hydrate } from "../dom/hydrate";
import { compile, setJsTable } from "../expression/compile";

/** Per-list `$()` JS tables keyed by the list's start marker. */
const listTables = new WeakMap<Comment, string[]>();
import { signal, untrack, type WriteSignal } from "../reactivity";
import { Scope } from "../scope";
import { localDb, plain, type Query } from "./db";
import { IdleWork, idleWork, synchronously } from "./idle";

type Item = {
	key: string;
	start: Comment;
	end: Comment;
	scope: Scope;
	row: WriteSignal<unknown>;
	raw: unknown;
};

export type ListMarker = { query: Query; params: string[]; template: string; seed: string | null };

/**
 * Mounts a keyed list between `start` and `end`. Items rendered by the server
 * are delimited by `<!--::hearth::item("key")-->` comments and adopted.
 */
export function mountList(start: Comment, end: Comment, marker: ListMarker, scope: Scope) {
	const db = localDb();
	if (marker.seed) {
		const source = document.getElementById(marker.seed);
		if (!source) throw new Error(`[hearth] missing seed ${marker.seed}`);
		const seed = JSON.parse(source.textContent ?? "{}") as Record<string, { [field: string]: unknown }[]>;
		for (const [table, rows] of Object.entries(seed)) db.seed(table, rows);
	}
	const tpl = findTemplate(marker.template);
	if (!tpl) throw new Error(`[hearth] missing template ${marker.template}`);
	const params = marker.params.map((js) => compile(js, "list param"));
	const items = new Map<string, Item>();
	const startToItem = new Map<Comment, Item>();
	// Detached, still-hydrated items from previous reconciles. A filter swap
	// replaces most keys; retargeting a pooled item's row signal (its `$()`
	// effects patch text/attrs in place) is ~10x cheaper than clone+hydrate.
	const pool: { it: Item; frag: DocumentFragment }[] = [];
	const POOL_MAX = 256;
	// Read the parent live: the region can be moved (e.g. a `when` arm is
	// wrapped after mount), so a captured parent goes stale.
	const parentOf = () => start.parentNode!;

	// Adopt server-rendered items (already hydrated by the parent pass into
	// the parent scope, so their effects read a frozen capture). Re-hydrate
	// them under item scopes, with the server nodes in place (no flicker).
	// Per-list JS table (`<!--::hearth::js(a\u0001b…)-->`), referenced by
	// SSR rows as `@N`. Merge into the global table with an offset.
	for (let n: ChildNode | null = end.previousSibling; n && n !== start; n = n.previousSibling) {
		if (n.nodeType === Node.COMMENT_NODE && (n as Comment).data.startsWith("::hearth::js(")) {
			const raw = (n as Comment).data.slice("::hearth::js(".length, -1);
			const table = raw.split("\u0001").map(decode);
			listTables.set(start, table);
			// Read once; it must not sit between items during reconcile.
			n.remove();
			break;
		}
		if (n.nodeType === Node.COMMENT_NODE && (n as Comment).data.trim() === "::hearth::item-end") break;
	}
	let node: ChildNode | null = start.nextSibling;
	const ssr: { key: string; start: Comment; end: Comment }[] = [];
	while (node && node !== end) {
		if (node.nodeType === Node.COMMENT_NODE) {
			const m = /^::hearth::item\((.*)\)$/.exec((node as Comment).data.trim());
			if (m) {
				let e: ChildNode | null = node.nextSibling;
				while (e && !(e.nodeType === Node.COMMENT_NODE && (e as Comment).data.trim() === "::hearth::item-end")) e = e.nextSibling;
				if (!e) break;
				const rawKey = decode(m[1]!);
				ssr.push({ key: rawKey.startsWith('"') ? (JSON.parse(rawKey) as string) : rawKey, start: node as Comment, end: e as Comment });
				node = e.nextSibling;
				continue;
			}
		}
		node = node.nextSibling;
	}

	type LiveCollection = ReturnType<typeof db.live>;
	let live: LiveCollection | null = null;
	let liveKey: string | null = null;
	let unsub: (() => void) | null = null;
	let adopted = false;

	const makeItem = (key: string, raw: unknown, at: { start: Comment; end: Comment } | null, detached?: DocumentFragment): Item => {
		const row = signal<unknown>(db.surrogate(raw as any, marker.query.types));
		const itemScope = new Scope(scope, scope.runtime, scope.unit);
		itemScope.context = scope.context.withRow(marker.template, { read: () => row() });
		let s: Comment;
		let e: Comment;
		if (at) {
			s = at.start;
			e = at.end;
		} else {
			s = document.createComment(`::hearth::item(${JSON.stringify(key)})`);
			e = document.createComment("::hearth::item-end");
			const frag = document.createDocumentFragment();
			frag.append(s, tpl.content.cloneNode(true), e);
			// Insert detached first so hydration can find markers; position later.
			if (detached) detached.append(frag);
			else parentOf().insertBefore(frag, end);
		}
		// SSR items: text already rendered; cloned items: render on first run.
		// SSR rows reference this list's JS table; nested lists set their
		// own while they hydrate and restore ours after.
		const table = listTables.get(start);
		const prevTable = at && table ? setJsTable(table) : null;
		try {
			hydrate(detached ?? parentOf(), s, e, itemScope, new Set(), at === null);
		} finally {
			if (prevTable) setJsTable(prevTable);
		}
		return { key, start: s, end: e, scope: itemScope, row, raw };
	};

	const nodesOf = (it: Item) => {
		const out: ChildNode[] = [];
		for (let n: ChildNode | null = it.start; n; n = n.nextSibling) {
			out.push(n);
			if (n === it.end) break;
		}
		return out;
	};

	let revision = 0;
	const reconcile = () => {
		const version = ++revision;
		const work = idleWork(scope);
		const scan = reconcileInner();
		const step = () => {
			if (scope.isDisposed || version !== revision) return;
			try {
				if (work) {
					if (!untrack(() => scan.next()).done) work.add(step);
				} else while (!untrack(() => scan.next()).done) { /* Visible work is synchronous. */ }
			} catch (e) { if (work) work.reportError(e); else reportError(e, marker.template); }
		};
		if (work) work.add(step);
		else step();
	};
	function* reconcileInner(): Generator<void> {
		if (!live || !live.isReady()) return;
		const t0 = performance.now();
		let rows = live.toArray as Array<{ [k: string]: unknown }>;
		// Hydration pass: the server rendered only the first rows; adopt them
		// now and render the rest after first paint, so boot stays short.
		if (!adopted && rows.length > ssr.length && ssr.length > 0) {
			rows = rows.slice(0, ssr.length);
			scheduleAfterPaint(reconcile);
		}
		const keyField = marker.query.key;
		if (!adopted) {
			adopted = true;
			const byKey = new Map(rows.map((r) => [String(r[keyField]), r]));
			for (const s of ssr) {
				yield;
				const raw = byKey.get(s.key);
				if (raw) {
					const it = makeItem(s.key, raw, s);
					items.set(s.key, it);
					startToItem.set(it.start, it);
				}
			}
		}
		// Keyed reconcile with minimal DOM moves (like Inferno/ivi/Vue 3):
		// 1. resolve every target row to an item (existing, recycled, or new),
		// 2. pool items that left (detached, still hydrated, reusable),
		// 3. keep the longest run of surviving items already in DOM order in
		//    place and move only the rest. One row entering at the top costs
		//    one insert, not a move of every row below it.
		const seen = new Set<string>();
		const target: Item[] = [];
		const fresh = new Set<Item>();
		for (const raw of rows) {
			yield;
			const key = String(raw[keyField]);
			// A key can appear twice transiently (e.g. a join emitting the
			// same label for an optimistic row and its server copy): render
			// the first occurrence only, like React would after warning.
			if (seen.has(key)) continue;
			seen.add(key);
			let it = items.get(key);
			if (it && it.raw !== raw) {
				// A re-run returns new objects for unchanged rows: compare
				// field values so unchanged rows do no work.
				if (!sameRow(it.raw as Row, raw as Row, marker.query.types)) {
					it.row.set(db.surrogate(raw as any, marker.query.types));
				}
				it.raw = raw;
			}
			if (!it) {
				it = { key, raw, start: null as any, end: null as any, scope: null as any, row: null as any };
				fresh.add(it);
			}
			target.push(it);
		}
		const leaving: Item[] = [];
		for (const [key, it] of items) if (!seen.has(key)) leaving.push(it);
		for (const it of leaving) {
			yield;
			items.delete(it.key);
			const nodes = nodesOf(it);
			if (pool.length < POOL_MAX) {
				const frag = document.createDocumentFragment();
				frag.append(...nodes);
				pool.push({ it, frag });
			} else {
				startToItem.delete(it.start);
				it.scope.dispose();
				for (const n of nodes) n.remove();
			}
		}
		// DOM order of surviving items (by walking item markers once).
		const order = new Map<Item, number>();
		{
			let i = 0;
			for (let n: ChildNode | null = start.nextSibling; n && n !== end; n = n.nextSibling) {
				if (n.nodeType !== 8) continue;
				const it = startToItem.get(n as Comment);
				if (it && items.get(it.key) === it) order.set(it, i++);
			}
		}
		const positions = target.map((it) => (fresh.has(it) ? -1 : (order.get(it) ?? -1)));
		const stay = lisMask(positions);
		// Walk backwards, inserting before the next placed item's start.
		let anchor: ChildNode = end;
		for (let i = target.length - 1; i >= 0; i--) {
			yield;
			let it = target[i]!;
			if (fresh.has(it)) {
				const raw = it.raw;
				const key = it.key;
				const recycled = pool.pop();
				if (recycled) {
					it = recycled.it;
					startToItem.delete(it.start);
					it.key = key;
					it.start.data = `::hearth::item(${JSON.stringify(key)})`;
					it.raw = raw;
					parentOf().insertBefore(recycled.frag, anchor);
					it.row.set(db.surrogate(raw as any, marker.query.types));
				} else {
					it = makeItem(key, raw, null);
					const frag = document.createDocumentFragment();
					frag.append(...nodesOf(it));
					parentOf().insertBefore(frag, anchor);
				}
				startToItem.set(it.start, it);
				items.set(key, it);
				target[i] = it;
			} else if (!stay[i]) {
				const frag = document.createDocumentFragment();
				frag.append(...nodesOf(it));
				parentOf().insertBefore(frag, anchor);
			}
			anchor = it.start;
		}
		// Remove anything that isn't a placed item (unadopted SSR rows, the
		// SSR rows past the first screenful on the first run, stray nodes).
		{
			let n: ChildNode | null = start.nextSibling;
			let ti = 0;
			while (n && n !== end) {
				yield;
				const it = target[ti];
				if (it && n === it.start) {
					n = it.end.nextSibling;
					ti++;
					continue;
				}
				const next: ChildNode | null = n.nextSibling;
				n.remove();
				n = next;
			}
		}
		(window as any).__hearthListMs = performance.now() - t0;
	}

	// An empty detail query still needs a hydrated row shell. Keep exactly
	// one detached placeholder in the existing bounded item pool. Its nested
	// queries use empty/zero params and retarget through the row signal.
	const work = idleWork(scope);
	if (work && marker.query.limit === 1) work.add(() => {
		if (scope.isDisposed || items.size || pool.length) return;
		// Missing fields surrogate to empty, zero, false, or None.
		const frag = document.createDocumentFragment();
		const it = makeItem("", {}, null, frag);
		pool.push({ it, frag });
	});

	// Re-run the query whenever a param's signals change. Queries are cheap
	// (engine.ts: index walk, ~1-5 ms at 50k rows), so a change runs in a
	// microtask and its rows land in the same frame as the input. Changes
	// within one task coalesce into a single run with the latest values.
	// If a run is ever slow (measured), later bursts move after paint so
	// keys still never wait on a query.
	// The first run is synchronous so SSR adoption happens during hydration.
	// Warm queries: the last few param sets stay live, so flipping back to a
	// recent filter reuses its result.
	const WARM = 4;
	const warm = new Map<string, LiveCollection>();
	let pending: unknown[] | null = null;
	let scheduled = false;
	let slow = false;
	let firstRun = true;
	const flush = () => {
		scheduled = false;
		if (scope.isDisposed || !pending) return;
		const values = pending;
		pending = null;
		const t = performance.now();
		untrack(() => runQuery(values));
		slow = performance.now() - t > 12;
	};
	scope.effect(() => {
		const values = params.map((p) => plain(p(scope.context)));
		if (firstRun) {
			firstRun = false;
			untrack(() => runQuery(values));
			return;
		}
		pending = values;
		if (!scheduled) {
			scheduled = true;
			// Text input: paint the keystroke first, then the results (one
			// frame later), like React's useDeferredValue. Discrete changes
			// (select, click, route) render in the same frame.
			if (slow || performance.now() - lastTextInput < 50) scheduleAfterPaint(flush);
			else queueMicrotask(flush);
		}
	});
	function runQuery(values: unknown[]) {
		const k = JSON.stringify(values);
		let next = warm.get(k);
		if (next) {
			warm.delete(k);
		} else {
			next = db.live(marker.query, values);
		}
		unsub?.();
		if (live && liveKey !== null) remember(liveKey, live);
		live = next;
		liveKey = k;
		const sub = live.subscribeChanges(() => queueMicrotask(reconcile));
		const tq = performance.now();
		live.onFirstReady(() => {
			reconcile();
			(window as any).__hearthQueryMs = performance.now() - tq;
		});
		unsub = () => sub.unsubscribe();
		reconcile();
	}
	function remember(k: string, c: LiveCollection) {
		warm.set(k, c);
		while (warm.size > WARM) {
			const [oldK, old] = warm.entries().next().value!;
			warm.delete(oldK);
			old.cleanup();
		}
	}
	scope.abortSignal.addEventListener("abort", () => {
		unsub?.();
		live?.cleanup();
		for (const c of warm.values()) c.cleanup();
		for (const { it } of pool) it.scope.dispose();
		pool.length = 0;
		warm.clear();
	});
}

/**
 * Mounts a `when` region: renders `template` iff `cond` is truthy. Used for
 * client `if` and route arms. Content is mounted once and then kept alive
 * (hidden with `display: contents`/`none` wrappers) so switching back is
 * instant and live queries inside aren't recompiled. Inactive arms are
 * pre-mounted after load in yielding background slices. A one-row list gets
 * one pooled placeholder, so empty route params can still warm nested lists.
 * Queries in hidden arms remain live and use their normal indexed lookups.
 */
export function mountWhen(start: Comment, end: Comment, cond: string, template: string, scope: Scope) {
	const found = findTemplate(template);
	if (!found) throw new Error(`[hearth] missing template ${template}`);
	const tpl: HTMLTemplateElement = found;
	const compute = compile(cond, "when condition");
	const parent = start.parentNode!;
	let shown: Scope | null = null;
	let wrapper: HTMLElement | null = null;
	let warming: IdleWork | null = null;
	scope.effect(() => {
		const on = Boolean(plain(compute(scope.context)));
		// Only `cond` is a dependency: mounting content (hydration, nested
		// lists, their params) must not subscribe this effect.
		untrack(() => apply(on));
	});
	// Route/page arms can warm, but per-row conditionals stay lazy. Their
	// hidden effects would otherwise add work to every pooled row retarget.
	if (!shown && scope.context.rows.size === 0) {
		const work = new IdleWork(scope, false);
		work.add(() => {
			if (scope.isDisposed || shown) return;
			try {
				mount();
			} catch (e) {
				reportError(e, template);
			}
		});
	}
	function mount() {
		shown = new Scope(scope, scope.runtime, scope.unit);
		warming = new IdleWork(shown);
		wrapper!.append(tpl.content.cloneNode(true));
		hydrate(wrapper!, null, null, shown, new Set(), true);
	}
	function apply(on: boolean) {
		if (!wrapper) {
			// First run: adopt server content (if any) into a wrapper.
			wrapper = document.createElement("hearth-when");
			wrapper.style.display = "contents";
			const hasContent = start.nextSibling !== end;
			if (hasContent) {
				while (start.nextSibling && start.nextSibling !== end) wrapper.append(start.nextSibling);
				parent.insertBefore(wrapper, end);
				shown = new Scope(scope, scope.runtime, scope.unit);
				hydrate(wrapper, null, null, shown);
			} else {
				parent.insertBefore(wrapper, end);
			}
		}
		if (on) {
			if (!shown) {
				wrapper.append(tpl.content.cloneNode(true));
				shown = new Scope(scope, scope.runtime, scope.unit);
				hydrate(wrapper, null, null, shown, new Set(), true);
			}
			warming?.finish();
			if (warming?.failed) {
				// A false guard or placeholder row may make body expressions
				// invalid. Never reuse their disposed effects/listeners.
				shown?.dispose();
				wrapper.replaceChildren(tpl.content.cloneNode(true));
				shown = new Scope(scope, scope.runtime, scope.unit);
				synchronously(() => hydrate(wrapper!, null, null, shown!, new Set(), true));
			}
			warming = null;
		}
		wrapper.style.display = on ? "contents" : "none";
	}
}

function decode(s: string): string {
	return s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

/** Surfaces region errors (they'd otherwise vanish inside microtasks). */
export function reportError(e: unknown, where: string) {
	const errs = ((window as any).__hearthErrors ??= []) as string[];
	errs.push(`${where}: ${(e as Error)?.stack ?? e}`);
	console.error("[hearth]", where, e);
}

/** Runs `fn` after the next paint, at background-ish priority. */
let lastTextInput = -Infinity;
if (typeof document !== "undefined") {
	document.addEventListener(
		"input",
		(e) => {
			const t = e.target as HTMLElement | null;
			if (t && (t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && !/^(checkbox|radio|range|color|file)$/.test((t as HTMLInputElement).type)))) {
				lastTextInput = performance.now();
			}
		},
		true,
	);
}

export function scheduleAfterPaint(fn: () => void) {
	const sched = (globalThis as any).scheduler;
	const post = () =>
		sched?.postTask ? sched.postTask(fn, { priority: "user-visible" }) : setTimeout(fn, 0);
	if (document.visibilityState === "visible") requestAnimationFrame(post);
	else post();
}

type Row = { [k: string]: unknown };
function sameRow(a: Row, b: Row, types: { [k: string]: unknown }): boolean {
	for (const k in types) if (a[k] !== b[k]) return false;
	return true;
}


/**
 * Template registry. Region templates nest (a list inside an `if $()` arm,
 * inside a list row…), and a nested `<template>` lives in its parent's
 * content fragment where `getElementById` can't see it. On first lookup,
 * walk every template (depth-first, including nested content) and index by
 * id. The first definition wins; definitions of the same id are identical
 * (ids are hashes of the query/condition).
 */
let registry: Map<string, HTMLTemplateElement> | null = null;
function index(root: ParentNode, into: Map<string, HTMLTemplateElement>) {
	for (const t of root.querySelectorAll("template")) {
		if (t.id && !into.has(t.id)) into.set(t.id, t);
		index(t.content, into);
	}
}
export function findTemplate(id: string): HTMLTemplateElement | null {
	if (!registry || !registry.has(id)) {
		registry = new Map();
		index(document, registry);
	}
	return registry.get(id) ?? null;
}

/**
 * Marks the longest strictly increasing subsequence of `a` (entries < 0 are
 * never in it). Those items are already in relative DOM order and stay put.
 * O(n log n).
 */
export function lisMask(a: number[]): boolean[] {
	const n = a.length;
	const prev = new Int32Array(n).fill(-1);
	const tails: number[] = []; // indices into a
	for (let i = 0; i < n; i++) {
		const v = a[i]!;
		if (v < 0) continue;
		let lo = 0;
		let hi = tails.length;
		while (lo < hi) {
			const mid = (lo + hi) >>> 1;
			if (a[tails[mid]!]! < v) lo = mid + 1;
			else hi = mid;
		}
		if (lo > 0) prev[i] = tails[lo - 1]!;
		tails[lo] = i;
	}
	const mask = new Array<boolean>(n).fill(false);
	let k = tails.length ? tails[tails.length - 1]! : -1;
	while (k >= 0) {
		mask[k] = true;
		k = prev[k]!;
	}
	return mask;
}
