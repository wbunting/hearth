// [fastcoat] Client regions: keyed lists over live queries, and `when`
// (conditional/route) regions. Both clone a server-rendered <template> and
// hydrate the clone with Topcoat's normal hydrator in a child Scope, so every
// `$()` inside works exactly as elsewhere. List items get a per-row ref
// (`cx.row(0)`) instead of a frozen capture.

import { hydrate } from "../dom/hydrate";
import { compile } from "../expression/compile";
import { signal, type WriteSignal } from "../reactivity";
import { Scope } from "../scope";
import { localDb, plain, type Query } from "./db";

type Item = {
	key: string;
	start: Comment;
	end: Comment;
	scope: Scope;
	row: WriteSignal<unknown>;
	raw: unknown;
};

export type ListMarker = { query: Query; params: string[]; template: string; seed?: { [table: string]: any[] } };

/**
 * Mounts a keyed list between `start` and `end`. Items rendered by the server
 * are delimited by `<!--::fastcoat::item("key")-->` comments and adopted.
 */
export function mountList(start: Comment, end: Comment, marker: ListMarker, scope: Scope) {
	const db = localDb();
	for (const [table, rows] of Object.entries(marker.seed ?? {})) db.seed(table, rows);
	const tpl = document.getElementById(marker.template) as HTMLTemplateElement | null;
	if (!tpl) throw new Error(`[fastcoat] missing template ${marker.template}`);
	const params = marker.params.map((js) => compile(js, "list param"));
	const items = new Map<string, Item>();
	const parent = start.parentNode!;

	// Adopt server-rendered items (already hydrated by the parent pass into
	// the parent scope, so their effects read a frozen capture). Re-hydrate
	// them under item scopes, with the server nodes in place (no flicker).
	let node: ChildNode | null = start.nextSibling;
	const ssr: { key: string; start: Comment; end: Comment }[] = [];
	while (node && node !== end) {
		if (node.nodeType === Node.COMMENT_NODE) {
			const m = /^::fastcoat::item\((.*)\)$/.exec((node as Comment).data.trim());
			if (m) {
				let e: ChildNode | null = node.nextSibling;
				while (e && !(e.nodeType === Node.COMMENT_NODE && (e as Comment).data.trim() === "::fastcoat::item-end")) e = e.nextSibling;
				if (!e) break;
				const rawKey = decode(m[1]!);
				ssr.push({ key: rawKey.startsWith('"') ? (JSON.parse(rawKey) as string) : rawKey, start: node as Comment, end: e as Comment });
				node = e.nextSibling;
				continue;
			}
		}
		node = node.nextSibling;
	}

	let live: ReturnType<typeof db.live> | null = null;
	let unsub: (() => void) | null = null;
	let adopted = false;

	const makeItem = (key: string, raw: unknown, at: { start: Comment; end: Comment } | null): Item => {
		const row = signal<unknown>(db.surrogate(raw as any, marker.query.types));
		const itemScope = new Scope(scope, scope.runtime, scope.unit);
		itemScope.context = scope.context.withRow({ read: () => row() });
		let s: Comment;
		let e: Comment;
		if (at) {
			s = at.start;
			e = at.end;
		} else {
			s = document.createComment(`::fastcoat::item(${JSON.stringify(key)})`);
			e = document.createComment("::fastcoat::item-end");
			const frag = document.createDocumentFragment();
			frag.append(s, tpl.content.cloneNode(true), e);
			// Insert detached first so hydration can find markers; position later.
			parent.insertBefore(frag, end);
		}
		// SSR items: text already rendered; cloned items: render on first run.
		hydrate(parent, s, e, itemScope, new Set(), at === null);
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

	const reconcile = () => {
		if (!live || !live.isReady()) return;
		const t0 = performance.now();
		const rows = live.toArray as Array<{ [k: string]: unknown }>;
		const keyField = marker.query.key;
		if (!adopted) {
			adopted = true;
			const byKey = new Map(rows.map((r) => [String(r[keyField]), r]));
			for (const s of ssr) {
				const raw = byKey.get(s.key);
				if (raw) items.set(s.key, makeItem(s.key, raw, s));
			}
		}
		const seen = new Set<string>();
		let cursor: ChildNode | null = start.nextSibling;
		for (const raw of rows) {
			const key = String(raw[keyField]);
			seen.add(key);
			let it = items.get(key);
			if (!it) {
				it = makeItem(key, raw, null);
				items.set(key, it);
			} else if (it.raw !== raw) {
				it.raw = raw;
				it.row.set(db.surrogate(raw as any, marker.query.types));
			}
			if (it.start !== cursor) {
				const frag = document.createDocumentFragment();
				frag.append(...nodesOf(it));
				parent.insertBefore(frag, cursor);
			}
			cursor = it.end.nextSibling;
		}
		for (const [key, it] of items) {
			if (seen.has(key)) continue;
			it.scope.dispose();
			for (const n of nodesOf(it)) n.remove();
			items.delete(key);
		}
		// Anything else between start/end (unadopted SSR leftovers) goes.
		while (cursor && cursor !== end) {
			const next: ChildNode | null = cursor.nextSibling;
			cursor.remove();
			cursor = next;
		}
		(window as any).__fastcoatListMs = performance.now() - t0;
	};

	// Re-run the query whenever a param's signals change.
	scope.effect(() => {
		const values = params.map((p) => plain(p(scope.context)));
		const tq = performance.now();
		unsub?.();
		live?.cleanup();
		live = db.live(marker.query, values);
		const sub = live.subscribeChanges(() => queueMicrotask(reconcile));
		live.onFirstReady(() => {
			reconcile();
			(window as any).__fastcoatQueryMs = performance.now() - tq;
		});
		unsub = () => sub.unsubscribe();
		reconcile();
	});
	scope.abortSignal.addEventListener("abort", () => {
		unsub?.();
		live?.cleanup();
	});
}

/**
 * Mounts a `when` region: renders `template` iff `cond` is truthy. Used for
 * client `if` and route arms. Content is mounted once and then kept alive
 * (hidden with `display: contents`/`none` wrappers) so switching back is
 * instant and live queries inside aren't recompiled; queries inside a hidden
 * arm keep running but their params only change when their signals do.
 */
export function mountWhen(start: Comment, end: Comment, cond: string, template: string, scope: Scope) {
	const tpl = document.getElementById(template) as HTMLTemplateElement | null;
	if (!tpl) throw new Error(`[fastcoat] missing template ${template}`);
	const compute = compile(cond, "when condition");
	const parent = start.parentNode!;
	let shown: Scope | null = null;
	let wrapper: HTMLElement | null = null;
	scope.effect(() => {
		const on = Boolean(plain(compute(scope.context)));
		if (!wrapper) {
			// First run: adopt server content (if any) into a wrapper.
			wrapper = document.createElement("fastcoat-when");
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
		if (on && !shown) {
			wrapper.append(tpl.content.cloneNode(true));
			shown = new Scope(scope, scope.runtime, scope.unit);
			hydrate(wrapper, null, null, shown, new Set(), true);
		}
		wrapper.style.display = on ? "contents" : "none";
	});
}

function decode(s: string): string {
	return s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
