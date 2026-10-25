import { importExpressions } from "./module";
import { parseComment } from "../dom/markers";
import type { Context } from "./context";

export type Expression<T = unknown> = (cx: Context) => T;
type Factory = (cx: Context, captures: unknown) => unknown;

let jsTable: string[] = [];
export function getJsTable(): string[] {
	return jsTable;
}
export function setJsTable(table: string[]): string[] {
	const prev = jsTable;
	jsTable = table;
	return prev;
}

const factories = new Map<string, Factory>();
const cache = new Map<string, Expression>();
const pending = new Map<string, Promise<void>>();

/** Finds references only in runtime metadata, never in user text or captures. */
function references(root: ParentNode): Set<string> {
	const ids = new Set<string>();
	const add = (ref: string) => {
		const id = /^#([a-f0-9]{64}):/.exec(ref)?.[1];
		if (id) {
			ids.add(id);
			const data = JSON.parse(ref.slice(66));
			if (data && !Array.isArray(data) && Array.isArray(data.expressions)) {
				data.expressions.forEach(add);
			}
		}
	};
	const decode = (text: string) =>
		text
			.replace(/&quot;/g, '"')
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&amp;/g, "&");
	const scan = (node: ParentNode) => {
		const walker = document.createTreeWalker(
			node,
			NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT,
		);
		for (let n = walker.nextNode(); n; n = walker.nextNode()) {
			if (n.nodeType === Node.ELEMENT_NODE) {
				const el = n as Element;
				for (const attr of el.attributes) {
					if (
						attr.name.startsWith("data-topcoat-on:") ||
						attr.name.startsWith("data-topcoat-bind:")
					)
						add(attr.value);
				}
				if (el instanceof HTMLTemplateElement) scan(el.content);
			} else {
				const comment = n as Comment;
				const text = comment.data.trim();
				if (
					text.startsWith("::topcoat::expr::start(") ||
					text.startsWith("::topcoat::shard::start(")
				) {
					const marker = parseComment(comment);
					if (marker?.kind === "expr-start") add(marker.js);
					if (marker?.kind === "shard-start") marker.exprs.forEach(add);
				} else if (text.startsWith("::hearth::js(")) {
					decode(text.slice("::hearth::js(".length, -1))
						.split("\u0001")
						.forEach(add);
				} else {
					const match = /^::hearth::(list|when)::start\(([\s\S]*)\)$/.exec(
						text,
					);
					if (match) {
						const payload = JSON.parse(decode(match[2]!));
						if (match[1] === "list") payload.params.forEach(add);
						else add(payload.cond);
					}
				}
			}
		}
	};
	scan(root);
	return ids;
}

/** Loads trusted same-origin code before synchronous DOM hydration, including templates. */
export async function loadExpressions(
	html: string | ParentNode,
): Promise<void> {
	let root: ParentNode;
	if (typeof html === "string") {
		// Fragment parsing discards document-wrapper attributes.
		if (/<(?:html|body)(?:\s|>)/i.test(html)) {
			root = new DOMParser().parseFromString(html, "text/html");
		} else {
			const template = document.createElement("template");
			template.innerHTML = html;
			root = template.content;
		}
	} else root = html;
	const ids = [...references(root)].filter((id) => !factories.has(id)).sort();
	const waits: Promise<void>[] = [];
	const fresh = ids.filter((id) => {
		const existing = pending.get(id);
		if (existing) {
			waits.push(existing);
			return false;
		}
		return true;
	});
	for (let i = 0; i < fresh.length; i += 32) {
		const batch = fresh.slice(i, i + 32);
		const url = `/_topcoat/expressions.js?ids=${batch.join(",")}`;
		const promise = importExpressions(url)
			.then((module) => {
				for (const id of batch) {
					const factory = module.default[id];
					if (typeof factory !== "function")
						throw new Error(`Missing expression ${id}`);
					factories.set(id, factory);
				}
			})
			.finally(() => {
				for (const id of batch) pending.delete(id);
			});
		for (const id of batch) pending.set(id, promise);
		waits.push(promise);
	}
	await Promise.all(waits);
}

/** Resolves a precompiled function. No source from HTML is executed. */
export function compile<T = unknown>(
	source: string,
	label: string,
): Expression<T> {
	let ref = source;
	if (ref.startsWith("@")) {
		const resolved = jsTable[Number(ref.slice(1))];
		if (resolved === undefined)
			throw new Error(`Unknown JS reference ${ref} in ${label}`);
		ref = resolved;
	}
	const match = /^#([a-f0-9]{64}):([\s\S]*)$/.exec(ref);
	if (!match) throw new Error(`Invalid expression reference in ${label}`);
	const factory = factories.get(match[1]!);
	if (!factory)
		throw new Error(`Expression not loaded in ${label}: ${match[1]}`);
	const hit = cache.get(ref);
	if (hit) return hit as Expression<T>;
	const captures = JSON.parse(match[2]!) as unknown;
	const expression = (cx: Context) => factory(cx, captures);
	cache.set(ref, expression);
	return expression as Expression<T>;
}
