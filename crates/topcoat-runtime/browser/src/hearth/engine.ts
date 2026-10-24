// [hearth] Query engine for list regions.
//
// TanStack DB builds a fresh incremental dataflow graph for every live query.
// That's ideal for a long-lived query, but a list re-queries on every filter
// change or keystroke, and graph construction measured 9-45 ms at 50k rows.
// Most UI queries are "filter, order by a column, take N", which a sorted
// index answers by walking in order and stopping after N matches
// (microseconds). This engine does that, and re-runs (cheaply) when a table
// changes instead of maintaining a dataflow graph.
//
// Tables (store.ts) hold the visible rows (server + optimistic writes) and
// the indexes; queries read them directly.
//
// Semantics mirror the SSR evaluator (`crates/hearth/src/list.rs` +
// `ir.rs`): same plan (filter/order/limit before joins when they only touch
// the base table), same null ordering, same `contains`.

import { plain, simplify, type Expr, type Query } from "./db";
import { cmpv, shallowEqual, type Row, type Table } from "./store";

type Env = { [alias: string]: Row | undefined };
type Fn = (env: Env) => unknown;

// ---------------------------------------------------------------- values

function truthy(v: unknown): boolean {
	if (v == null) return false;
	if (typeof v === "boolean") return v;
	if (typeof v === "string") return v.length > 0;
	if (typeof v === "number") return v !== 0;
	return true;
}

// ---------------------------------------------------------------- compile

function compile(e: Expr, params: unknown[]): Fn {
	if ("col" in e) {
		const [a, c] = e.col;
		return (env) => {
			const v = env[a]?.[c];
			return v === undefined ? null : v;
		};
	}
	if ("lit" in e) {
		const v = e.lit;
		return () => v;
	}
	if ("param" in e) {
		const v = plain(params[e.param]);
		return () => v;
	}
	switch (e.op) {
		case "eq":
		case "ne": {
			const l = compile(e.l, params);
			const r = compile(e.r, params);
			const ne = e.op === "ne";
			return (env) => {
				const a = l(env);
				const b = r(env);
				return (cmpv(a, b) === 0 && sameType(a, b)) !== ne;
			};
		}
		case "lt":
		case "lte":
		case "gt":
		case "gte": {
			const l = compile(e.l, params);
			const r = compile(e.r, params);
			const op = e.op;
			return (env) => {
				const c = cmpv(l(env), r(env));
				return op === "lt" ? c < 0 : op === "lte" ? c <= 0 : op === "gt" ? c > 0 : c >= 0;
			};
		}
		case "contains": {
			const l = compile(e.l, params);
			const r = compile(e.r, params);
			const constant = "param" in e.r || "lit" in e.r;
			const needle = constant ? String(r({}) ?? "").toLowerCase() : "";
			return (env) => {
				const h = l(env);
				if (typeof h !== "string") return false;
				const n = constant ? needle : String(r(env) ?? "").toLowerCase();
				return lower(h).includes(n);
			};
		}
		case "ilike": {
			const l = compile(e.l, params);
			const r = compile(e.r, params);
			return (env) => {
				const h = l(env);
				const p = r(env);
				return typeof h === "string" && typeof p === "string" && likeRegex(p).test(h);
			};
		}
		case "in": {
			const l = compile(e.l, params);
			const r = compile(e.r, params);
			return (env) => {
				const arr = r(env);
				return Array.isArray(arr) && arr.includes(l(env));
			};
		}
		case "and": {
			const args = e.args.map((a) => compile(a, params));
			return (env) => args.every((a) => truthy(a(env)));
		}
		case "or": {
			const args = e.args.map((a) => compile(a, params));
			return (env) => args.some((a) => truthy(a(env)));
		}
		case "not": {
			const a = compile(e.arg, params);
			return (env) => !truthy(a(env));
		}
		case "if": {
			const cond = compile(e.cond, params);
			const then = compile(e.then, params);
			return (env) => (truthy(cond(env)) ? then(env) : true);
		}
	}
}

function sameType(a: unknown, b: unknown) {
	return a == null || b == null ? a == b : typeof a === typeof b;
}

// Lowercasing 50k titles per keystroke is the scan's main cost; cache it.
const lowerCache = new Map<string, string>();
function lower(s: string): string {
	let l = lowerCache.get(s);
	if (l === undefined) {
		if (lowerCache.size > 200_000) lowerCache.clear();
		l = s.toLowerCase();
		lowerCache.set(s, l);
	}
	return l;
}

const likeCache = new Map<string, RegExp>();
function likeRegex(p: string): RegExp {
	let re = likeCache.get(p);
	if (!re) {
		const src = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".");
		re = new RegExp(`^${src}$`, "is");
		likeCache.set(p, re);
	}
	return re;
}

function aliasesOf(e: Expr | null, out = new Set<string>()): Set<string> {
	if (!e) return out;
	if ("col" in e) out.add(e.col[0]);
	else if ("lit" in e || "param" in e) return out;
	else if ("args" in e) e.args.forEach((a) => aliasesOf(a, out));
	else if ("arg" in e) aliasesOf(e.arg, out);
	else if ("cond" in e) {
		aliasesOf(e.cond, out);
		aliasesOf(e.then, out);
	} else {
		aliasesOf(e.l, out);
		aliasesOf(e.r, out);
	}
	return out;
}

/** `col == const` conjuncts on `alias`: candidates for a hash lookup. */
function equalities(e: Expr | null, alias: string, params: unknown[]): { col: string; v: unknown }[] {
	if (!e || "col" in e || "lit" in e || "param" in e) return [];
	if (e.op === "and") return e.args.flatMap((a) => equalities(a, alias, params));
	if (e.op !== "eq") return [];
	const pick = (c: Expr, k: Expr) =>
		"col" in c && c.col[0] === alias && ("param" in k || "lit" in k)
			? [{ col: c.col[1], v: "param" in k ? plain(params[k.param]) : k.lit }]
			: [];
	return [...pick(e.l, e.r), ...pick(e.r, e.l)];
}

// ---------------------------------------------------------------- run

export type Tables = (name: string) => Table;

/** Evaluates `q` once over the mirrors. */
export function run(q: Query, params: unknown[], tables: Tables): Row[] {
	const base = tables(q.from.table);
	const alias = q.from.alias;
	const where = simplify(q.where, params);
	const pred = where ? compile(where, params) : null;
	const baseOnly = (e: Expr | null) => [...aliasesOf(e)].every((a) => a === alias);
	const early = q.joins.length === 0 || (baseOnly(where) && q.order.every((o) => baseOnly(o.expr)));
	const orderFns = q.order.map((o) => ({ f: compile(o.expr, params), desc: o.desc }));
	const keyField = base.keyField;
	const sortEnvs = (envs: Env[]) =>
		envs.sort((a, b) => {
			for (const { f, desc } of orderFns) {
				const c = cmpv(f(a), f(b));
				if (c !== 0) return desc ? -c : c;
			}
			const ka = String(a[alias]?.[keyField]);
			const kb = String(b[alias]?.[keyField]);
			return ka < kb ? -1 : ka > kb ? 1 : 0;
		});

	// Joins: hash lookups on the joined table's column where possible.
	const joins = q.joins.map((j) => {
		const m = tables(j.table);
		let [probe, build] = j.on;
		if (!("col" in build && build.col[0] === j.alias)) [probe, build] = [build, probe];
		const probeFn = compile(probe, params);
		const byCol = "col" in build && build.col[0] === j.alias ? build.col[1] : null;
		const onFn = compile({ op: "eq", l: j.on[0], r: j.on[1] }, params);
		return { j, m, probeFn, byCol, onFn };
	});
	const join = (envs: Env[]): Env[] => {
		for (const { j, m, probeFn, byCol, onFn } of joins) {
			const next: Env[] = [];
			for (const env of envs) {
				let matched = false;
				if (byCol !== null) {
					const v = probeFn(env);
					if (v != null) {
						for (const r of m.lookup(byCol, v)) {
							next.push({ ...env, [j.alias]: r });
							matched = true;
						}
					}
				} else {
					for (const r of m.rows.values()) {
						const e2 = { ...env, [j.alias]: r };
						if (truthy(onFn(e2))) {
							next.push(e2);
							matched = true;
						}
					}
				}
				if (!matched && j.kind !== "inner") next.push(env);
			}
			envs = next;
		}
		return envs;
	};

	let envs: Env[];
	if (early) {
		const env: Env = {};
		const test = (r: Row) => {
			if (!pred) return true;
			env[alias] = r;
			return truthy(pred(env));
		};
		const limit = q.limit;
		// Smallest equality bucket, if any.
		let bucket: Iterable<Row> | null = null;
		let bucketSize = Infinity;
		for (const { col, v } of equalities(where, alias, params)) {
			const b = base.lookup(col, v);
			const n = Array.isArray(b) ? b.length : (b as Set<Row>).size;
			if (n < bucketSize) {
				bucket = b;
				bucketSize = n;
			}
		}
		const orderCols = q.order.every((o) => "col" in o.expr && o.expr.col[0] === alias);
		let rows: Row[];
		if (q.order.length && orderCols && limit != null && bucketSize > limit * 8) {
			// Walk the order index; stop at `limit` matches.
			const spec = q.order.map((o) => ({ col: (o.expr as { col: [string, string] }).col[1], desc: o.desc }));
			const sorted = base.sortedIndex(JSON.stringify(spec), spec);
			rows = [];
			for (let i = 0; i < sorted.length && rows.length < limit; i++) {
				const r = sorted[i]!;
				if (test(r)) rows.push(r);
			}
			envs = rows.map((r) => ({ [alias]: r }));
		} else {
			rows = [];
			for (const r of bucket ?? base.rows.values()) if (test(r)) rows.push(r);
			envs = rows.map((r) => ({ [alias]: r }));
			if (q.order.length) sortEnvs(envs);
			if (limit != null) envs.length = Math.min(envs.length, limit);
		}
		envs = join(envs);
	} else {
		// Push base-only conjuncts below the joins (with an equality bucket
		// when available) so `il.issueId = $x ORDER BY l.name` joins 2 rows,
		// not 100k. Remaining predicates run after the join.
		const conj = where && !("col" in where) && !("lit" in where) && !("param" in where) && where.op === "and" ? where.args : where ? [where] : [];
		const pushed = conj.filter((c) => baseOnly(c));
		const rest = conj.filter((c) => !baseOnly(c));
		const pre = pushed.length ? compile({ op: "and", args: pushed }, params) : null;
		const post = rest.length ? compile({ op: "and", args: rest }, params) : null;
		let bucket: Iterable<Row> = base.rows.values();
		let bucketSize = Infinity;
		for (const { col, v } of equalities(pushed.length ? { op: "and", args: pushed } : null, alias, params)) {
			const b = base.lookup(col, v);
			const n = Array.isArray(b) ? b.length : (b as Set<Row>).size;
			if (n < bucketSize) {
				bucket = b;
				bucketSize = n;
			}
		}
		const seed: Env[] = [];
		for (const r of bucket) {
			const e: Env = { [alias]: r };
			if (!pre || truthy(pre(e))) seed.push(e);
		}
		envs = join(seed);
		if (post) envs = envs.filter((e) => truthy(post(e)));
		if (q.order.length) sortEnvs(envs);
		if (q.limit != null) envs.length = Math.min(envs.length, q.limit);
	}

	const select = Object.entries(q.select).map(([k, e]) => [k, compile(e, params)] as const);
	return envs.map((env) => {
		const o: Row = {};
		for (const [k, f] of select) o[k] = f(env);
		return o;
	});
}

// ---------------------------------------------------------------- live

type ChangeCb = () => void;

/**
 * A live query result. API-compatible with the subset of TanStack's live
 * query collection that list regions use.
 */
export class LiveQuery {
	readonly planned = undefined;
	private result: Row[] = [];
	private dirty = true;
	private scheduled = false;
	private subs = new Set<ChangeCb>();
	private unlisten: (() => void)[] = [];
	private mirrors: Table[];
	private prevByKey = new Map<string, Row>();

	constructor(
		readonly query: Query,
		readonly params: unknown[],
		private tables: Tables,
	) {
		const names = new Set([query.from.table, ...query.joins.map((j) => j.table)]);
		this.mirrors = [...names].map((n) => tables(n));
		for (const m of this.mirrors) this.unlisten.push(m.listen(() => this.changed()));
	}

	isReady(): boolean {
		return this.mirrors.every((m) => m.isReady());
	}

	onFirstReady(cb: () => void) {
		if (this.isReady()) {
			cb();
			return;
		}
		let pending = this.mirrors.filter((m) => !m.isReady()).length;
		for (const m of this.mirrors)
			if (!m.isReady())
				m.onFirstReady(() => {
					if (--pending === 0) {
						this.dirty = true;
						cb();
					}
				});
	}

	get toArray(): Row[] {
		if (this.dirty) this.recompute();
		return this.result;
	}

	get size(): number {
		return this.toArray.length;
	}

	subscribeChanges(cb: ChangeCb) {
		this.subs.add(cb);
		return { unsubscribe: () => this.subs.delete(cb) };
	}

	cleanup() {
		for (const u of this.unlisten) u();
		this.unlisten = [];
		this.subs.clear();
	}

	private changed() {
		this.dirty = true;
		// Unobserved (warm) queries recompute lazily on next read.
		if (this.subs.size === 0 || this.scheduled) return;
		this.scheduled = true;
		queueMicrotask(() => {
			this.scheduled = false;
			if (!this.dirty) return;
			if (this.recompute()) for (const cb of this.subs) cb();
		});
	}

	/** Returns whether the result changed. Unchanged rows keep identity. */
	private recompute(): boolean {
		this.dirty = false;
		const t0 = performance.now();
		const rows = run(this.query, this.params, this.tables);
		(globalThis as any).__hearthRunMs = performance.now() - t0;
		const key = this.query.key;
		const prev = this.prevByKey;
		const next = new Map<string, Row>();
		let changed = rows.length !== this.result.length;
		for (let i = 0; i < rows.length; i++) {
			const r = rows[i]!;
			const k = String(r[key]);
			const p = prev.get(k);
			if (p && shallowEqual(p, r)) rows[i] = p;
			next.set(k, rows[i]!);
			if (rows[i] !== this.result[i]) changed = true;
		}
		this.prevByKey = next;
		this.result = rows;
		return changed;
	}
}
