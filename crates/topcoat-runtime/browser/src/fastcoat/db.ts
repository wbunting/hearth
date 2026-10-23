// [fastcoat] Local database bridge: TanStack DB collections built from the
// Rust-emitted schema, a query-IR interpreter, and row values that look like
// Topcoat surrogates so `$()` expressions can read them.
//
// Nothing in here is app-specific. The app's tables, queries and mutations all
// come from Rust (`#[client_table]`, `live_query!`, `mutate!`).

import {
	and,
	BTreeIndex,
	createCollection,
	createLiveQueryCollection,
	eq,
	gt,
	gte,
	ilike,
	inArray,
	lt,
	lte,
	not,
	or,
	type Collection,
} from "@tanstack/db";
import { signal, type WriteSignal } from "../reactivity";
import { Bool } from "../surrogate/bool";
import { F64 } from "../surrogate/f64";
import { Integer } from "../surrogate/integer";
import { Option } from "../surrogate/option";
import { Record } from "../surrogate/record";
import { String as RString } from "../surrogate/string";

// ---------------------------------------------------------------- schema

export type ColumnType = "string" | "bool" | "i64" | "f64" | "opt_string" | "opt_i64";

export type TableDesc = {
	name: string;
	key: string;
	columns: Record_<string, ColumnType>;
	indexes: string[];
	load: string;
	mutate: string;
};
type Record_<K extends string, V> = { [k in K]: V };

export type Schema = { version: string; scope: string; tables: TableDesc[] };

type Row = { [k: string]: unknown };

// ---------------------------------------------------------------- IR
// Mirrors fastcoat::ir::Query (Rust). Values are plain JSON; params are
// `$(...)` expressions evaluated by the list region and passed in by index.

export type Expr =
	| { col: [string, string] } // [alias, column]
	| { lit: unknown }
	| { param: number }
	| { op: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "ilike"; l: Expr; r: Expr }
	| { op: "and" | "or"; args: Expr[] }
	| { op: "not"; arg: Expr }
	| { op: "in"; l: Expr; r: Expr }
	| { op: "if"; cond: Expr; then: Expr } // `cond ? then : true` (optional filters)
	| { op: "contains"; l: Expr; r: Expr }; // ilike %r%

export type Query = {
	from: { table: string; alias: string };
	joins: { table: string; alias: string; on: [Expr, Expr]; kind: "left" | "inner" }[];
	where: Expr | null;
	order: { expr: Expr; desc: boolean }[];
	limit: number | null;
	select: { [field: string]: Expr };
	key: string; // output field used as the list key
	types: { [field: string]: ColumnType };
	/** Set by the planner when order/limit are applied after the query. */
	clientOrder?: { expr: Expr; desc: boolean }[];
	clientLimit?: number;
};

// ---------------------------------------------------------------- db

export type RowRef = { read(): unknown };

export class LocalDb {
	readonly tables = new Map<string, Collection<Row, string>>();
	readonly desc = new Map<string, TableDesc>();
	private servers = new Map<string, Map<string, Row>>();
	private writers = new Map<string, Writer>();
	/** Bumps when any table syncs, for coarse `ready` reactivity. */
	readonly version: WriteSignal<number> = signal(0);

	private schema: Schema | null = null;
	private seeds: { [table: string]: Row[] } = {};
	private backfillScheduled = false;

	/** Tables are created lazily (on first seed/query) so SSR seeds can land first. */
	init(schema: Schema, snapshot: { [table: string]: Row[] }) {
		this.schema = schema;
		for (const [t, rows] of Object.entries(snapshot)) this.seed(t, rows);
	}

	/** Seed rows for a table from SSR (first view). */
	seed(table: string, rows: Row[]) {
		// An empty seed carries no information (e.g. a list inside a
		// `<template>` rendered with a placeholder row): don't let it mark the
		// table ready with zero rows.
		if (rows.length === 0) return;
		if (this.tables.has(table)) {
			this.apply(table, rows, false);
			return;
		}
		(this.seeds[table] ??= []).push(...rows);
	}

	private ensure(name: string) {
		if (this.tables.has(name)) return;
		const t = this.schema?.tables.find((x) => x.name === name);
		if (!t) throw new Error(`[fastcoat] unknown table ${name}`);
		const seeded = this.seeds[name];
		this.createTable(t, this.schema!.scope, seeded);
		delete this.seeds[name];
		// A table first used after the initial backfill (e.g. comments, when
		// the session started on the list page) still needs its full rows.
		if (this.backfillScheduled && seeded) void this.fetchTable(t).then((rows) => this.apply(name, rows, true));
		if (!this.backfillScheduled) {
			this.backfillScheduled = true;
			// After the first view is interactive, pull full tables.
			setTimeout(() => this.backfill().then(() => ((window as any).__fastcoatBackfilled = performance.now())), 0);
			this.watchFreshness();
		}
	}

	private createTable(t: TableDesc, scope: string, initial: Row[] | undefined) {
		this.desc.set(t.name, t);
		const server = new Map<string, Row>();
		this.servers.set(t.name, server);
		const keyOf = (r: Row) => String(r[t.key]);
		const coll = createCollection<Row, string>({
			id: `${scope}/${t.name}`,
			getKey: keyOf,
			startSync: true,
			gcTime: 0,
			sync: {
				rowUpdateMode: "full",
				sync: (params) => {
					const w = params as unknown as Writer;
					this.writers.set(t.name, w);
					if (initial && initial.length > 0) {
						this.seededTables.add(t.name);
						this.apply(t.name, initial, false);
						params.markReady();
					} else {
						this.fetchTable(t)
							.then((rows) => {
								this.apply(t.name, rows, true);
								params.markReady();
							})
							.catch((e) => params.markError(e));
					}
				},
			},
			onUpdate: async ({ transaction }) => {
				for (const m of transaction.mutations) {
					const row = (await post(t.mutate, { op: "update", key: m.key, changes: m.changes })) as Row;
					this.apply(t.name, [row], false);
				}
			},
			onInsert: async ({ transaction }) => {
				for (const m of transaction.mutations) {
					const row = (await post(t.mutate, { op: "insert", row: m.modified })) as Row;
					// The server may assign a different key (e.g. deterministic
					// reaction ids): drop the optimistic key if it changed.
					const optimistic = String(m.key);
					const real = String(row[t.key]);
					this.apply(t.name, [row], false, real === optimistic ? [] : [optimistic]);
				}
			},
			onDelete: async ({ transaction }) => {
				for (const m of transaction.mutations) {
					await post(t.mutate, { op: "delete", key: m.key });
					this.apply(t.name, [], false, [String(m.key)]);
				}
			},
		});
		for (const f of t.indexes) coll.createIndex((r: any) => r[f], { indexType: BTreeIndex });
		this.tables.set(t.name, coll);
	}

	private async fetchTable(t: TableDesc): Promise<Row[]> {
		return (await get(t.load)) as Row[];
	}

	/** Apply server rows; `full` = the complete table (diff out deletions). */
	apply(table: string, rows: Row[], full: boolean, deleted: string[] = []) {
		const w = this.writers.get(table);
		const server = this.servers.get(table)!;
		const key = this.desc.get(table)!.key;
		if (!w) return;
		w.begin();
		const seen = new Set<string>();
		for (const row of rows) {
			const k = String(row[key]);
			seen.add(k);
			const prev = server.get(k);
			if (!prev) w.write({ type: "insert", value: row });
			else if (!shallowEqual(prev, row)) w.write({ type: "update", value: row });
			server.set(k, row);
		}
		const gone = full ? [...server.keys()].filter((k) => !seen.has(k)) : deleted;
		for (const k of gone) {
			const prev = server.get(k);
			if (prev) w.write({ type: "delete", value: prev });
			server.delete(k);
		}
		w.commit();
		this.version.set((v) => v + 1);
	}

	/** Refresh synced tables when the tab regains focus or comes online. */
	private watchFreshness() {
		let last = Date.now();
		const refresh = () => {
			if (Date.now() - last < 5000) return;
			last = Date.now();
			void this.backfill();
		};
		addEventListener("focus", refresh);
		addEventListener("online", refresh);
		document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && refresh());
	}

	/** Backfill every created table with its full scoped rows. */
	async backfill() {
		const seeded = [...this.desc.values()];
		await Promise.all(seeded.map(async (t) => this.apply(t.name, await this.fetchTable(t), true)));
	}
	private seededTables = new Set<string>();

	// ------------------------------------------------------------ queries

	/** Builds a TanStack live query from IR + evaluated params. */
	live(q: Query, params: unknown[]): Collection<Row, string> & { planned?: Query } {
		// Planner rule (measured: 163ms -> 0.4ms at 50k rows): a point lookup
		// `col == $x` on an indexed column with `limit 1` must not carry
		// orderBy/limit, which forces TanStack's ordered top-K scan instead of
		// the index lookup. The result has at most a few rows anyway.
		const w = q.where as any;
		const pointLookup =
			q.limit === 1 && w && w.op === "eq" && "col" in w.l && w.l.col[0] === q.from.alias &&
			this.desc.get(q.from.table)?.indexes.includes(w.l.col[1]);
		if (pointLookup) q = { ...q, order: [], limit: null };
		// Planner rule 2: `contains` (unindexable) + orderBy/limit. TanStack's
		// ordered top-K walks the order index until `limit` rows match: cheap
		// when matches are common (7ms for "s"), terrible when rare (270ms
		// for "sel"); an unlimited scan is the opposite (160ms / 16ms). Pick
		// by measured selectivity: sample the base table and estimate how far
		// top-K would have to walk.
		if (q.limit != null && q.order.length && hasContains(q.where)) {
			const rate = this.sampleMatchRate(q, params);
			const expectedWalk = rate > 0 ? q.limit / rate : Number.POSITIVE_INFINITY;
			const size = this.tables.get(q.from.table)?.size ?? 0;
			if (expectedWalk > size * 0.05) {
				q = { ...q, order: [], limit: null, clientOrder: q.order, clientLimit: q.limit } as Query;
			}
		}
		const tables = this.tables;
		const coll = (name: string) => {
			this.ensure(name);
			const c = tables.get(name);
			if (!c) throw new Error(`[fastcoat] unknown table ${name}`);
			return c;
		};
		const planned = q;
		const out = createLiveQueryCollection({
			startSync: true,
			query: (qb: any) => {
				let b = qb.from({ [q.from.alias]: coll(q.from.table) });
				// Filter/order/limit on the base table *before* joins when they
				// only reference the base alias (indexes apply; joins then run over
				// <= limit rows). Otherwise join first, then filter/order/limit.
				const aliasesOf = (e: Expr | null): Set<string> => {
					const out = new Set<string>();
					const walk = (x: any) => {
						if (!x || typeof x !== "object") return;
						if ("col" in x) out.add(x.col[0]);
						for (const v of Object.values(x)) {
							if (Array.isArray(v)) v.forEach(walk);
							else if (v && typeof v === "object") walk(v);
						}
					};
					walk(e);
					return out;
				};
				const baseOnly = (e: Expr | null) => [...aliasesOf(e)].every((a) => a === q.from.alias);
				const early = q.joins.length === 0 || (baseOnly(q.where) && q.order.every((o) => baseOnly(o.expr)));
				const applyFilters = () => {
					const where = q.where && lower(q.where, params);
					if (where) b = b.where((refs: any) => where(refs));
					for (const o of q.order) {
						const ex = lower(o.expr, params);
						b = b.orderBy((refs: any) => ex(refs), o.desc ? "desc" : "asc");
					}
					if (q.limit != null) b = b.limit(q.limit);
				};
				if (early) applyFilters();
				for (const j of q.joins) {
					const [l, r] = j.on.map((e) => lower(e, params));
					const method = j.kind === "inner" ? "innerJoin" : "leftJoin";
					b = b[method]({ [j.alias]: coll(j.table) }, (refs: any) => eq(l!(refs), r!(refs)));
				}
				if (!early) applyFilters();
				const sel = Object.entries(q.select).map(([k, e]) => [k, lower(e, params)] as const);
				// Planner rule 2 needs the order columns in the output to sort by.
				const extra = (planned.clientOrder ?? []).map((o, i) => [`__o${i}`, lower(o.expr, params)] as const);
				return b.select((refs: any) =>
					Object.fromEntries([...sel, ...extra].map(([k, f]) => [k, f(refs)])),
				);
			},
		}) as unknown as Collection<Row, string> & { planned?: Query };
		out.planned = planned;
		return out;
	}

	private sampleCache = new Map<string, { version: number; rows: Row[] }>();

	/** Fraction of a ~2k-row sample of the base table matching `contains` terms. */
	private sampleMatchRate(q: Query, params: unknown[]): number {
		// The sample itself is cached per table and refreshed on sync, so a
		// keystroke costs ~2k substring tests (<1ms), not a 50k-row `toArray`.
		const version = this.version();
		let cached = this.sampleCache.get(q.from.table);
		if (!cached || cached.version !== version) {
			const all = this.tables.get(q.from.table)?.toArray ?? [];
			const step = Math.max(1, Math.floor(all.length / 2000));
			const rows: Row[] = [];
			for (let i = 0; i < all.length; i += step) rows.push(all[i] as Row);
			cached = { version, rows };
			this.sampleCache.set(q.from.table, cached);
		}
		const rows = cached.rows;
		if (rows.length === 0) return 1;
		const terms: [string, string][] = [];
		const walk = (e: any) => {
			if (!e || typeof e !== "object") return;
			if (e.op === "contains" && "col" in e.l) {
				const v = "param" in e.r ? plain(params[e.r.param]) : e.r.lit;
				terms.push([e.l.col[1], String(v ?? "").toLowerCase()]);
			} else if (e.op === "if") {
				if (plain(evalParam(e.cond, params))) walk(e.then);
			} else (e.args ?? (e.arg ? [e.arg] : [])).forEach(walk);
		};
		walk(q.where);
		if (terms.length === 0) return 1;
		let seen = 0;
		let hit = 0;
		for (let i = 0; i < rows.length; i++) {
			seen++;
			const r = rows[i] as Row;
			if (terms.every(([c, t]) => String(r[c] ?? "").toLowerCase().includes(t))) hit++;
		}
		return hit / seen;
	}

	/** Surrogate-shaped view of a plain row so `$()` can read fields. */
	surrogate(row: Row, types: { [f: string]: ColumnType }): Record {
		// Wire rows are camelCase; `$()` reads Rust field names (snake_case).
		return new Record(Object.entries(types).map(([f, ty]) => [snake(f), toSurrogate(row[f], ty)]));
	}

	// ------------------------------------------------------------ mutations

	update(table: string, key: unknown, changes: Row) {
		this.ensure(table);
		const c = this.tables.get(table)!;
		const k = String(plain(key));
		const tx = c.update(k, (d: Row) => Object.assign(d, changes));
		tx.isPersisted.promise.catch((e: Error) => toast(`Rolled back: ${e.message}`));
	}

	insert(table: string, row: Row) {
		this.ensure(table);
		const t = this.desc.get(table)!;
		// Client-generated key so the optimistic row and server row match.
		if (row[t.key] == null || row[t.key] === "") row[t.key] = crypto.randomUUID();
		const tx = this.tables.get(table)!.insert(row);
		tx.isPersisted.promise.catch((e: Error) => toast(`Rolled back: ${e.message}`));
	}

	delete(table: string, key: unknown) {
		this.ensure(table);
		const tx = this.tables.get(table)!.delete(String(plain(key)));
		tx.isPersisted.promise.catch((e: Error) => toast(`Rolled back: ${e.message}`));
	}

	/** Handle used by Rust `fastcoat::table_handle::<T>()` inside `$()`. */
	table(name: string) {
		return {
			set: (key: unknown, field: unknown, value: unknown) => this.update(name, key, { [String(plain(field))]: plain(value) }),
			/** Insert a row given as alternating field/value pairs (Rust varargs-free). */
			insert: (...kv: unknown[]) => {
				const row: Row = {};
				for (let i = 0; i + 1 < kv.length; i += 2) row[String(plain(kv[i]))] = plain(kv[i + 1]);
				this.insert(name, row);
			},
			remove: (key: unknown) => this.delete(name, key),
			insert1: (...kv: unknown[]) => this.table(name).insert(...kv),
			insert2: (...kv: unknown[]) => this.table(name).insert(...kv),
			insert3: (...kv: unknown[]) => this.table(name).insert(...kv),
			insert4: (...kv: unknown[]) => this.table(name).insert(...kv),
			toggle2: (key: unknown, ...kv: unknown[]) => this.table(name).toggle(key, ...kv),
			toggle3: (key: unknown, ...kv: unknown[]) => this.table(name).toggle(key, ...kv),
			/** Toggle membership: delete `key` if present, else insert. */
			toggle: (key: unknown, ...kv: unknown[]) => {
				const k = String(plain(key));
				this.ensure(name);
				if (this.tables.get(name)!.has(k)) this.delete(name, k);
				else {
					const row: Row = {};
					for (let i = 0; i + 1 < kv.length; i += 2) row[String(plain(kv[i]))] = plain(kv[i + 1]);
					this.insert(name, row);
				}
			},
			dehydrate: () => name,
		};
	}

	get(table: string, key: unknown): Row | undefined {
		return this.tables.get(table)?.get(String(plain(key)));
	}
}

type Writer = { begin(): void; write(m: { type: string; value: Row }): void; commit(): void };

let instance: LocalDb | null = null;
export function localDb(): LocalDb {
	instance ??= new LocalDb();
	return instance;
}

// ---------------------------------------------------------------- lowering

type Refs = { [alias: string]: { [col: string]: unknown } };
type Lowered = (refs: Refs) => any;

function lower(e: Expr, params: unknown[]): Lowered {
	if ("col" in e) {
		const [a, c] = e.col;
		return (refs) => (refs[a] as any)[c];
	}
	if ("lit" in e) return () => e.lit;
	if ("param" in e) {
		const v = plain(params[e.param]);
		return () => v;
	}
	switch (e.op) {
		case "eq":
		case "ne":
		case "lt":
		case "lte":
		case "gt":
		case "gte":
		case "ilike": {
			const l = lower(e.l, params);
			const r = lower(e.r, params);
			const f = { eq, ne: (a: any, b: any) => not(eq(a, b)), lt, lte, gt, gte, ilike }[e.op] as any;
			return (refs) => f(l(refs), r(refs));
		}
		case "contains": {
			const l = lower(e.l, params);
			const r = lower(e.r, params);
			return (refs) => ilike(l(refs), `%${r(refs)}%`);
		}
		case "in": {
			const l = lower(e.l, params);
			const r = lower(e.r, params);
			return (refs) => inArray(l(refs), r(refs));
		}
		case "and":
		case "or": {
			const args = e.args.map((a) => lower(a, params));
			if (args.length === 0) return () => eq(1, 1);
			if (args.length === 1) return args[0]!;
			const f = e.op === "and" ? and : or;
			return (refs) => (f as any)(...args.map((a) => a(refs)));
		}
		case "not": {
			const a = lower(e.arg, params);
			return (refs) => not(a(refs));
		}
		case "if": {
			// Optional filter: skipped entirely when the param is falsy/empty,
			// so it doesn't defeat indexes with a `true OR ...` predicate.
			const cond = plain(evalParam(e.cond, params));
			if (!cond) return () => eq(1, 1);
			return lower(e.then, params);
		}
	}
}

function hasContains(e: Expr | null): boolean {
	if (!e || typeof e !== "object") return false;
	const x = e as any;
	if (x.op === "contains") return true;
	if (x.op === "if") return hasContains(x.then);
	if (x.args) return x.args.some(hasContains);
	if (x.arg) return hasContains(x.arg);
	return false;
}

function evalParam(e: Expr, params: unknown[]): unknown {
	if ("param" in e) return params[e.param];
	if ("lit" in e) return e.lit;
	throw new Error("[fastcoat] `if` conditions must be params or literals");
}

/** Unwraps Topcoat surrogates (String, Bool, Integer, Option, Ref) to plain JS. */
export function plain(v: unknown): unknown {
	let cur = v;
	for (let i = 0; i < 8 && cur && typeof cur === "object"; i++) {
		const o = cur as any;
		if (typeof o.deref === "function" && !(o instanceof Option)) {
			cur = o.deref();
			continue;
		}
		if (o instanceof Option) return o.is_some().dehydrate() ? plain(o.unwrap()) : null;
		if (typeof o.dehydrate === "function") {
			const d = o.dehydrate();
			if (d && typeof d === "object" && "v" in d && (d as any).t !== "Record") {
				const n = (d as any).v;
				return typeof n === "string" && /^-?\d+$/.test(n) ? Number(n) : n;
			}
			return d;
		}
		return cur;
	}
	return cur;
}

function toSurrogate(v: unknown, ty: ColumnType): unknown {
	switch (ty) {
		case "string":
			return new RString(String(v ?? ""));
		case "bool":
			return new Bool(Boolean(v));
		case "i64":
			return Integer.hydrate({ t: "i64", bits: 64, v: String(Math.trunc(Number(v ?? 0))) } as any);
		case "f64":
			return new F64(Number(v ?? 0));
		case "opt_string":
			return v == null ? Option.none() : Option.some(new RString(String(v)));
		case "opt_i64":
			return v == null ? Option.none() : Option.some(toSurrogate(v, "i64"));
	}
}

function snake(s: string): string {
	return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function shallowEqual(a: Row, b: Row) {
	for (const k in a) if (a[k] !== b[k]) return false;
	for (const k in b) if (!(k in a)) return false;
	return true;
}

async function get(url: string): Promise<unknown> {
	const res = await fetch(url, { headers: { accept: "application/json" } });
	if (res.redirected && new URL(res.url).pathname.startsWith("/login")) {
		location.href = "/login";
		throw new Error("signed out");
	}
	if (!res.ok) throw new Error(`${res.status}`);
	return res.json();
}

async function post(url: string, body: unknown): Promise<unknown> {
	const res = await fetch(url, {
		method: "POST",
		headers: { "content-type": "application/json", accept: "application/json" },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 120)}`);
	const t = await res.text();
	return t ? JSON.parse(t) : null;
}

function toast(msg: string) {
	const el = Object.assign(document.createElement("div"), { className: "fastcoat-toast", textContent: msg });
	document.body.append(el);
	setTimeout(() => el.remove(), 3500);
}
