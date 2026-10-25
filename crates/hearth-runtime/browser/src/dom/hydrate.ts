import { LINK_ATTRIBUTE } from "../render/navigation";
import { ShardUnit } from "../render/shard";
import { type Region, Scope } from "../scope";
import type { SignalId } from "../signal-registry";
import { setupBinding } from "./binding";
import { setupEventHandler } from "./event";
import { type CommentMarker, parseComment } from "./markers";
import { setupTextExpression } from "./text";
import { mountList, mountWhen, type ListMarker } from "../hearth/list";
import { idleWork } from "../hearth/idle";
import { getJsTable, setJsTable } from "../expression/compile";

/** [hearth] Region markers: content between start/end is owned by the region. */
const FC_LIST_RE = /^\s*::hearth::list::start\(([\s\S]*)\)\s*$/;
const FC_WHEN_RE = /^\s*::hearth::when::start\(([\s\S]*)\)\s*$/;
const FC_END_RE = /^\s*::hearth::(list|when)::end\s*$/;

function decodeComment(s: string): string {
	return s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

type PendingTextExpression = {
	start: Comment;
	js: string;
	scope: Scope;
};

/**
 * The scope being hydrated and the shard or region whose end marker
 * tells us to return to the parent scope.
 */
type Frame = {
	scope: Scope;
	shard: ShardUnit | null;
	region: Region | null;
};

/**
 * Attaches runtime behavior to the DOM range `(from, to)` under `root`.
 *
 * - `from`: starts after this node, or at the beginning of `root` if `null`.
 * - `to`: stops before this node, or at the end of `root` if `null`.
 * - `initialScope`: owns resources until a nested shard starts its own scope.
 * - `adoptable`: signal IDs retained from replaced content. A matching
 *   declaration keeps the existing value, assigns ownership to the current
 *   scope, and removes the ID from this set. Remaining IDs were not reused.
 */
export function hydrate(
	root: Node,
	from: Node | null,
	to: Node | null,
	initialScope: Scope,
	adoptable: Set<SignalId> = new Set(),
	/** [hearth] Content was cloned from a template: render text on first run. */
	fresh = false,
): void {
	const scan = scanHydration(root, from, to, initialScope, adoptable, fresh);
	const work = idleWork(initialScope);
	// SSR markers may use @N references. Preserve the table across yields.
	const table = getJsTable();
	if (work) {
		const step = () => {
			if (initialScope.isDisposed) return;
			const previous = setJsTable(table);
			try {
				if (!scan.next().done) work.add(step);
			} finally {
				setJsTable(previous);
			}
		};
		work.add(step);
	} else {
		while (!scan.next().done) { /* Synchronous visible hydration. */ }
	}
}

function* scanHydration(
	root: Node,
	from: Node | null,
	to: Node | null,
	initialScope: Scope,
	adoptable: Set<SignalId>,
	fresh: boolean,
): Generator<void> {
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_ELEMENT,
	);
	if (from) walker.currentNode = from;

	const stack: Frame[] = [{ scope: initialScope, shard: null, region: null }];
	const textExpressions: PendingTextExpression[] = [];
	const guard = (fn: () => void) => {
		try {
			fn();
		} catch (error) {
			const work = idleWork(initialScope);
			if (!work) throw error;
			work.reportError(error);
		}
	};

	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		if (to && node === to) break;
		yield;

		const current = stack[stack.length - 1]?.scope;
		if (current === undefined) throw new Error("Stack was empty");

		if (node.nodeType === Node.ELEMENT_NODE) {
			guard(() => processElement(node as Element, current));
			continue;
		}

		// COMMENT_NODE
		// [hearth] Client list / when regions: skip their content here and
		// let the region mount and hydrate it (per item / per arm scopes).
		const data = (node as Comment).data;
		const fl = FC_LIST_RE.exec(data) ?? FC_WHEN_RE.exec(data);
		if (fl) {
			const start = node as Comment;
			let depth = 0;
			let end: Node | null = null;
			for (let n = walker.nextNode(); n; n = walker.nextNode()) {
				if (n.nodeType !== Node.COMMENT_NODE) continue;
				const d = (n as Comment).data;
				if (FC_LIST_RE.test(d) || FC_WHEN_RE.test(d)) depth++;
				else if (FC_END_RE.test(d)) {
					if (depth === 0) {
						end = n;
						break;
					}
					depth--;
				}
			}
			if (!end) throw new Error("[hearth] unterminated region");
			guard(() => {
				const payload = JSON.parse(decodeComment(fl[1]!));
				if (FC_LIST_RE.test(data)) mountList(start, end as Comment, payload as ListMarker, current);
				else mountWhen(start, end as Comment, payload.cond, payload.template, current);
			});
			continue;
		}
		const marker = parseComment(node as Comment);
		if (!marker) continue;

		guard(() => processMarker(marker, node as Comment, stack, textExpressions, adoptable, fresh));
	}
}

function processElement(el: Element, scope: Scope): void {
	for (const attr of Array.from(el.attributes)) {
		setupBinding(el, attr, scope);
		setupEventHandler(el, attr, scope);
	}
	if (
		el instanceof HTMLAnchorElement &&
		el.getAttribute(LINK_ATTRIBUTE) === "viewport"
	) {
		scope.runtime.navigation.observe(el, scope.abortSignal);
	}
}

function processMarker(
	marker: CommentMarker,
	node: Comment,
	stack: Frame[],
	textExpressions: PendingTextExpression[],
	adoptable: Set<SignalId>,
	fresh = false,
): void {
	// The last stack entry owns the content around this marker.
	const current = stack[stack.length - 1]?.scope;
	if (current === undefined) throw new Error("Stack was empty");

	switch (marker.kind) {
		case "signal": {
			// An existing signal wins over the declaration's value, and the
			// scanning scope takes it over when it comes from replaced
			// content; a signal another live scope owns stays theirs.
			const { context, registry } = current.runtime;
			if (
				registry.insert(marker.id, context.hydrate(marker.value)) ||
				adoptable.delete(marker.id)
			) {
				current.signalIds.add(marker.id);
			}
			break;
		}

		case "dep": {
			current.dependencies.add(marker.id);
			break;
		}

		case "connect": {
			current.requiresConnection = true;
			break;
		}

		case "expr-start": {
			textExpressions.push({
				start: node,
				js: marker.js,
				scope: current,
			});
			break;
		}

		case "expr-end": {
			const pending = textExpressions.pop();
			if (!pending) {
				throw new Error("Unbalanced text expression: end marker has no start");
			}
			setupTextExpression(pending.start, node, pending.js, pending.scope, fresh);
			break;
		}

		case "region-start": {
			const scope = new Scope(current, current.runtime, current.unit);
			const region: Region = { id: marker.id, start: node, end: null, scope };
			current.regions.set(marker.id, region);
			stack.push({ scope, shard: null, region });
			break;
		}

		case "region-end": {
			const region = stack[stack.length - 1]?.region;
			if (!region) {
				throw new Error(
					`Unbalanced region: end marker ${marker.id} has no matching start`,
				);
			}
			if (region.id !== marker.id) {
				throw new Error(
					`Mismatched region: end ${marker.id} does not match start ${region.id}`,
				);
			}
			region.end = node;
			stack.pop();
			break;
		}

		case "shard-start": {
			const shard = new ShardUnit(
				current,
				current.runtime,
				marker.path,
				marker.identity,
				marker.exprs,
				node,
			);
			stack.push({ scope: shard.contentScope, shard, region: null });
			break;
		}

		case "shard-end": {
			const shard = stack[stack.length - 1]?.shard;
			if (!shard) {
				throw new Error(
					`Unbalanced shard: end marker ${marker.identity} has no matching start`,
				);
			}
			if (shard.identity !== marker.identity) {
				throw new Error(
					`Mismatched shard: end ${marker.identity} does not match start ${shard.identity}`,
				);
			}
			shard.attachEnd(node);
			stack.pop();
			shard.startWatching();
			break;
		}
	}
}
