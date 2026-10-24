// [hearth] Local database: tables built from the
// Rust-emitted schema (store.ts), live queries (engine.ts), and row values that look like
// Topcoat surrogates so `$()` expressions can read them.
//
// Nothing in here is app-specific. The app's tables, queries and mutations all
// come from Rust (`#[client_table]`, `live_query!`, `mutate!`).

import { signal, type WriteSignal } from "../reactivity";
import { LiveQuery } from "./engine";
import { Table } from "./store";
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
// Mirrors hearth::ir::Query (Rust). Values are plain JSON; params are
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
	from: { table: string; alias: string; key: string };
	joins: { table: string; alias: string; key: string; on: [Expr, Expr]; kind: "left" | "inner" }[];
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
	readonly tables = new Map<string, Table>();
	readonly desc = new Map<string, TableDesc>();
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
		if (!t) throw new Error(`[hearth] unknown table ${name}`);
		const seeded = this.seeds[name];
		this.createTable(t, seeded);
		delete this.seeds[name];
		// A table first used after the initial backfill (e.g. comments, when
		// the session started on the list page) still needs its full rows.
		if (this.backfillStarted && seeded) void this.fetchTable(t).then((rows) => this.applyChunked(name, rows));
		if (!this.backfillScheduled) {
			this.backfillScheduled = true;
			// After the first view is interactive, pull full tables.
			setTimeout(() => this.backfill().then(() => ((window as any).__hearthBackfilled = performance.now())), 0);
			this.watchFreshness();
		}
	}

	private createTable(t: TableDesc, initial: Row[] | undefined) {
		this.desc.set(t.name, t);
		const table = new Table(t.name, t.key);
		this.tables.set(t.name, table);
		if (initial && initial.length > 0) {
			table.applyServer(initial);
			table.markReady();
		} else {
			// Unseeded table: applied in slices (no long task), ready once
			// complete so queries never see a partial table.
			this.fetchTable(t)
				.then((rows) => this.applyChunked(t.name, rows))
				.then(() => table.markReady())
				.catch((e) => reportLoadError(t.name, e));
		}
	}

	// One in-flight full-table fetch per table: `backfill()` and a late
	// `ensure()` must not both pull a 12 MB table.
	private inflight = new Map<string, Promise<Row[]>>();
	private fetchTable(t: TableDesc): Promise<Row[]> {
		let p = this.inflight.get(t.name);
		if (!p) {
			p = (get(t.load) as Promise<Row[]>)
.finally(() => this.inflight.delete(t.name));
			this.inflight.set(t.name, p);
		}
		return p;
	}

	/** Apply server rows; `full` = the complete table (diff out deletions). */
	apply(table: string, rows: Row[], full: boolean, deleted: string[] = []) {
		const t = this.tables.get(table);
		if (!t) return;
		let gone: Iterable<string> = deleted;
		if (full) {
			const seen = new Set(rows.map((r) => String(r[t.keyField])));
			gone = t.serverKeys().filter((k) => !seen.has(k));
		}
		if (t.applyServer(rows, gone)) this.version.set((v) => v + 1);
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
	private backfillStarted = false;
	async backfill() {
		this.backfillStarted = true;
		const seeded = [...this.desc.values()];
		await Promise.all(seeded.map(async (t) => this.applyChunked(t.name, await this.fetchTable(t))));
	}

	/**
	 * Full-table apply in slices that yield to the browser between them, so a
	 * 50k-row backfill never blocks input or paint for more than a few ms.
	 * Deletions (rows the server no longer has) are diffed at the end.
	 */
	private async applyChunked(table: string, rows: Row[]) {
		// ~1000 rows ≈ 6-8 ms of TanStack + index work: well inside a frame.
		const CHUNK = 1000;
		if (rows.length <= CHUNK) {
			this.apply(table, rows, true);
			return;
		}
		const key = this.desc.get(table)!.key;
		const seen = new Set<string>();
		for (let i = 0; i < rows.length; i += CHUNK) {
			const slice = rows.slice(i, i + CHUNK);
			for (const r of slice) seen.add(String(r[key]));
			this.apply(table, slice, false);
			await yieldToBrowser();
		}
		const t = this.tables.get(table);
		const gone = t ? t.serverKeys().filter((k) => !seen.has(k)) : [];
		if (gone.length) this.apply(table, [], false, gone);
	}

	// ------------------------------------------------------------ queries

	private table_ = (name: string): Table => {
		this.ensure(name);
		return this.tables.get(name)!;
	};

	/**
	 * A live query over the local tables (see engine.ts: index walk + cheap
	 * re-run, instead of building a TanStack dataflow graph per param set).
	 */
	live(q: Query, params: unknown[]): LiveQuery {
		return new LiveQuery(q, params, this.table_);
	}

	/** Surrogate-shaped view of a plain row so `$()` can read fields. */
	surrogate(row: Row, types: { [f: string]: ColumnType }): Record {
		// Wire rows are camelCase; `$()` reads Rust field names (snake_case).
		return new Record(Object.entries(types).map(([f, ty]) => [snake(f), toSurrogate(row[f], ty)]));
	}

	// ------------------------------------------------------------ mutations

	update(table: string, key: unknown, changes: Row) {
		this.ensure(table);
		const t = this.desc.get(table)!;
		const k = String(plain(key));
		this.track(
			this.tables.get(table)!.update(k, changes, async (m) => {
				const row = (await post(t.mutate, { op: "update", key: m.key, changes: m.changes })) as Row;
				return { rows: [row] };
			}),
		);
	}

	insert(table: string, row: Row) {
		this.ensure(table);
		const t = this.desc.get(table)!;
		// Client-generated key so the optimistic row and server row match.
		if (row[t.key] == null || row[t.key] === "") row[t.key] = crypto.randomUUID();
		this.track(
			this.tables.get(table)!.insert(row, async (m) => {
				// The server may store it under another key (e.g. deterministic
				// reaction ids); the store swaps rows in one step.
				const saved = (await post(t.mutate, { op: "insert", row: m.value })) as Row;
				return { rows: [saved] };
			}),
		);
	}

	delete(table: string, key: unknown) {
		this.ensure(table);
		const t = this.desc.get(table)!;
		this.track(
			this.tables.get(table)!.delete(String(plain(key)), async (m) => {
				await post(t.mutate, { op: "delete", key: m.key });
				return { deleted: [m.key] };
			}),
		);
	}

	private track(p: Promise<void>) {
		p.catch((e: Error) => toast(`Rolled back: ${e.message}`));
	}

	/** Handle used by Rust `hearth::table_handle::<T>()` inside `$()`. */
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


let instance: LocalDb | null = null;
export function localDb(): LocalDb {
	instance ??= new LocalDb();
	return instance;
}

function evalParam(e: Expr, params: unknown[]): unknown {
	if ("param" in e) return params[e.param];
	if ("lit" in e) return e.lit;
	throw new Error("[hearth] `if` conditions must be params or literals");
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

function reportLoadError(table: string, e: unknown) {
	const errs = ((globalThis as any).__hearthErrors ??= []) as string[];
	errs.push(`load ${table}: ${(e as Error)?.message ?? e}`);
	console.error("[hearth] load", table, e);
}

function toast(msg: string) {
	const el = Object.assign(document.createElement("div"), { className: "hearth-toast", textContent: msg });
	document.body.append(el);
	setTimeout(() => el.remove(), 3500);
}

/**
 * Resolves optional filters (`if`) against the current params and flattens
 * `and`, so TanStack sees `eq(i.open, true)` rather than
 * `and(eq(i.open, true), eq(1,1), eq(1,1), eq(1,1))`. The latter defeats
 * index selection and ordered top-K (measured: 35-65ms → see perf-gaps.md).
 */
export function simplify(e: Expr | null, params: unknown[]): Expr | null {
	if (!e || "col" in e || "lit" in e || "param" in e) return e;
	if (e.op === "if") return plain(evalParam(e.cond, params)) ? simplify(e.then, params) : null;
	if (e.op === "and") {
		const args: Expr[] = [];
		for (const a of e.args) {
			const x = simplify(a, params);
			if (!x) continue;
			if (!("col" in x) && !("lit" in x) && !("param" in x) && x.op === "and") args.push(...x.args);
			else args.push(x);
		}
		if (args.length === 0) return null;
		if (args.length === 1) return args[0]!;
		return { ...e, args };
	}
	return e;
}

/** Yields to input and rendering (scheduler.yield where supported). */
function yieldToBrowser(): Promise<void> {
	// Background priority: input and rendering always go first.
	const sched = (globalThis as any).scheduler;
	if (sched?.postTask) return sched.postTask(() => {}, { priority: "background" });
	return new Promise((r) => setTimeout(r, 0));
}
