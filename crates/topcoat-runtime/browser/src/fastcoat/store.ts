// [fastcoat] Local table store: server rows + optimistic writes + indexes.
//
// Replaces TanStack DB collections. One map per table holds the *visible*
// rows (server state with pending optimistic writes applied); a small shadow
// map holds the server row only for keys that have a pending write. So each
// row is stored once, and there is one set of indexes, which the query
// engine (engine.ts) reads directly.
//
// Semantics, checked against TanStack DB by store.test.ts (differential):
// - user insert/update/delete apply immediately (optimistic), run the
//   table's handler, and roll back if it rejects;
// - insert of a visible key, update/delete of a missing key throw;
// - a pending write shows the row the user produced (a full snapshot);
//   server rows for that key arriving meanwhile update the server state
//   underneath and show once the key has no pending writes;
// - when the last pending write on a key settles, the key shows the server
//   row (the handler is expected to have applied the server's response).

export type Row = { [k: string]: unknown };
export type MutationType = "insert" | "update" | "delete";
/** `value` is the full row the user saw after the change (absent for delete). */
export type Mutation = { id: number; type: MutationType; key: string; value?: Row; changes?: Row };
/**
 * Persists a write. Resolve to accept, reject to roll back. Resolve with
 * `{ rows, deleted }` to apply the server's response in the same step as the
 * write settles (so an insert stored under another key never shows twice).
 */
export type Handler = (m: Mutation) => Promise<unknown> | unknown;

type OrderSpec = { col: string; desc: boolean }[];
type Sorted = { spec: OrderSpec; cmp: (a: Row, b: Row) => number; arr: Row[] | null; pending: Row[] };

let seq = 0;

export class Table {
	/** Visible rows by key. Never mutated in place. */
	readonly rows = new Map<string, Row>();
	/** Server row (or `undefined` = absent) for keys with pending writes. */
	private shadow = new Map<string, Row | undefined>();
	private writes = new Map<string, Mutation[]>();
	private listeners = new Set<() => void>();
	private ready = false;
	private readyCbs: (() => void)[] = [];
	private sorted = new Map<string, Sorted>();
	private hashes = new Map<string, Map<unknown, Set<Row>> | null>();

	constructor(
		readonly name: string,
		readonly keyField: string,
	) {}

	// ------------------------------------------------------------ reads

	get size(): number {
		return this.rows.size;
	}
	get(key: string): Row | undefined {
		return this.rows.get(key);
	}
	has(key: string): boolean {
		return this.rows.has(key);
	}
	values(): IterableIterator<Row> {
		return this.rows.values();
	}
	/** Number of keys with an unsettled optimistic write. */
	get pendingCount(): number {
		return this.writes.size;
	}

	isReady(): boolean {
		return this.ready;
	}
	markReady(): void {
		if (this.ready) return;
		this.ready = true;
		const cbs = this.readyCbs;
		this.readyCbs = [];
		for (const cb of cbs) cb();
	}
	onFirstReady(cb: () => void): () => void {
		if (this.ready) {
			cb();
			return () => {};
		}
		this.readyCbs.push(cb);
		return () => {
			this.readyCbs = this.readyCbs.filter((c) => c !== cb);
		};
	}

	/** Called after any batch that changed visible rows. */
	listen(cb: () => void): () => void {
		this.listeners.add(cb);
		return () => this.listeners.delete(cb);
	}

	// ------------------------------------------------------------ server

	/** Server state for `key` (ignores pending writes). */
	serverGet(key: string): Row | undefined {
		return this.shadow.has(key) ? this.shadow.get(key) : this.rows.get(key);
	}

	/** Keys the server has (ignores pending writes). */
	serverKeys(): string[] {
		const out: string[] = [];
		for (const k of this.rows.keys()) if (!this.shadow.has(k)) out.push(k);
		for (const [k, v] of this.shadow) if (v !== undefined) out.push(k);
		return out;
	}

	/** Upserts server rows and removes `deleted` keys. Returns whether visible rows changed. */
	applyServer(rows: Row[], deleted: Iterable<string> = [], notify = true): boolean {
		// Large batches merge into sorted indexes once (see flushSorted).
		const bulk = rows.length > 64;
		let changed = false;
		for (const r of rows) {
			const k = String(r[this.keyField]);
			if (this.writes.has(k)) {
				const prev = this.shadow.get(k);
				if (prev && shallowEqual(prev, r)) continue;
				this.shadow.set(k, r);
				changed = this.recompute(k, bulk) || changed;
				continue;
			}
			const prev = this.rows.get(k);
			if (prev && shallowEqual(prev, r)) continue;
			this.setVisible(k, prev, r, bulk);
			changed = true;
		}
		for (const k of deleted) {
			if (this.writes.has(k)) {
				if (this.shadow.get(k) === undefined) continue;
				this.shadow.set(k, undefined);
				changed = this.recompute(k, false) || changed;
				continue;
			}
			const prev = this.rows.get(k);
			if (!prev) continue;
			this.setVisible(k, prev, undefined, false);
			changed = true;
		}
		if (changed && notify) this.emit();
		return changed;
	}

	// ------------------------------------------------------------ writes

	insert(row: Row, handler: Handler): Promise<void> {
		const key = String(row[this.keyField]);
		if (key === "undefined" || key === "null") throw new Error(`[fastcoat] ${this.name}: row has no key`);
		if (this.rows.has(key)) throw new Error(`[fastcoat] ${this.name}: duplicate key ${key}`);
		return this.write({ id: ++seq, type: "insert", key, value: row }, handler);
	}

	update(key: string, changes: Row, handler: Handler): Promise<void> {
		if (!this.rows.has(key)) throw new Error(`[fastcoat] ${this.name}: no row ${key}`);
		if (this.keyField in changes && String(changes[this.keyField]) !== key)
			throw new Error(`[fastcoat] ${this.name}: cannot change a row's key`);
		// Only fields whose value actually changes count (TanStack's change
		// tracker); a no-op update creates no write and calls no handler.
		const cur = this.rows.get(key)!;
		const real: Row = {};
		for (const f in changes) if (!Object.is(cur[f], changes[f])) real[f] = changes[f];
		if (Object.keys(real).length === 0) return Promise.resolve();
		changes = real;
		// Snapshot the full row now (like TanStack's `mutation.modified`): a
		// pending edit shows exactly what the user produced, whatever the
		// server sends for that key meanwhile.
		const value = { ...cur, ...changes };
		return this.write({ id: ++seq, type: "update", key, changes, value }, handler);
	}

	delete(key: string, handler: Handler): Promise<void> {
		if (!this.rows.has(key)) throw new Error(`[fastcoat] ${this.name}: no row ${key}`);
		return this.write({ id: ++seq, type: "delete", key }, handler);
	}

	private write(m: Mutation, handler: Handler): Promise<void> {
		const k = m.key;
		let list = this.writes.get(k);
		if (!list) {
			this.shadow.set(k, this.rows.get(k));
			this.writes.set(k, (list = []));
		}
		list.push(m);
		if (this.recompute(k, false)) this.emit();
		const settle = (result?: unknown) => {
			const l = this.writes.get(k);
			if (!l) return;
			const r = result as { rows?: Row[]; deleted?: string[] } | undefined;
			let serverChanged = false;
			if (r?.rows || r?.deleted) serverChanged = this.applyServer(r.rows ?? [], r.deleted ?? [], false);
			const i = l.indexOf(m);
			if (i >= 0) l.splice(i, 1);
			let changed: boolean;
			if (l.length === 0) {
				const server = this.shadow.get(k);
				this.writes.delete(k);
				this.shadow.delete(k);
				changed = this.setVisible(k, this.rows.get(k), server, false);
			} else changed = this.recompute(k, false);
			if (changed || serverChanged) this.emit();
		};
		return Promise.resolve()
			.then(() => handler(m))
			.then(
				(result) => settle(result),
				(e) => {
					settle();
					throw e;
				},
			);
	}

	/** Visible row for `k`: the newest pending write's row, else the server row. */
	private recompute(k: string, bulk: boolean): boolean {
		const l = this.writes.get(k);
		const last = l?.[l.length - 1];
		const row = last ? (last.type === "delete" ? undefined : last.value) : this.shadow.get(k);
		return this.setVisible(k, this.rows.get(k), row, bulk);
	}

	private setVisible(k: string, prev: Row | undefined, next: Row | undefined, bulk: boolean): boolean {
		if (prev === next) return false;
		if (prev && next && shallowEqual(prev, next)) return false;
		if (prev) this.unindex(prev);
		if (next) {
			this.rows.set(k, next);
			this.index(next, bulk);
		} else this.rows.delete(k);
		return true;
	}

	private emit() {
		for (const l of this.listeners) l();
	}

	// ------------------------------------------------------------ indexes

	private comparator(spec: OrderSpec) {
		const key = this.keyField;
		return (a: Row, b: Row) => {
			for (const { col, desc } of spec) {
				const c = cmpv(a[col], b[col]);
				if (c !== 0) return desc ? -c : c;
			}
			const ka = String(a[key]);
			const kb = String(b[key]);
			return ka < kb ? -1 : ka > kb ? 1 : 0;
		};
	}

	/** Visible rows in `spec` order, ties by key. Built lazily, then maintained. */
	sortedIndex(id: string, spec: OrderSpec): Row[] {
		let s = this.sorted.get(id);
		if (!s) {
			s = { spec, cmp: this.comparator(spec), arr: null, pending: [] };
			this.sorted.set(id, s);
		}
		if (!s.arr) {
			s.arr = [...this.rows.values()].sort(s.cmp);
			s.pending = [];
		} else if (s.pending.length) flushSorted(s);
		return s.arr;
	}

	/** Visible rows whose `col` equals `v`. */
	lookup(col: string, v: unknown): Iterable<Row> {
		if (col === this.keyField) {
			const r = this.rows.get(String(v));
			return r ? [r] : EMPTY;
		}
		return this.hashIndex(col).get(v) ?? EMPTY;
	}

	private hashIndex(col: string): Map<unknown, Set<Row>> {
		let h = this.hashes.get(col);
		if (!h) {
			h = new Map();
			for (const r of this.rows.values()) addTo(h, r[col], r);
			this.hashes.set(col, h);
		}
		return h;
	}

	private index(r: Row, bulk: boolean) {
		for (const [col, h] of this.hashes) if (h) addTo(h, r[col], r);
		for (const s of this.sorted.values()) {
			if (!s.arr) continue;
			if (bulk) {
				s.pending.push(r);
				continue;
			}
			flushSorted(s);
			s.arr.splice(lowerBound(s.arr, r, s.cmp), 0, r);
		}
	}

	private unindex(r: Row) {
		for (const [col, h] of this.hashes) {
			const set = h?.get(r[col]);
			if (!set) continue;
			set.delete(r);
			if (set.size === 0) h!.delete(r[col]);
		}
		for (const s of this.sorted.values()) {
			if (!s.arr) continue;
			const p = s.pending.indexOf(r);
			if (p >= 0) {
				s.pending.splice(p, 1);
				continue;
			}
			let i = lowerBound(s.arr, r, s.cmp);
			if (s.arr[i] !== r) i = s.arr.indexOf(r);
			if (i >= 0) s.arr.splice(i, 1);
		}
	}
}

// ---------------------------------------------------------------- helpers

/** Ordering shared with `ir::cmp` (Rust): null first, then by type. */
export function cmpv(a: unknown, b: unknown): number {
	if (a === b) return 0;
	if (a == null) return b == null ? 0 : -1;
	if (b == null) return 1;
	if (typeof a === "number" && typeof b === "number") return a < b ? -1 : a > b ? 1 : 0;
	if (typeof a === "string" && typeof b === "string") return a < b ? -1 : a > b ? 1 : 0;
	if (typeof a === "boolean" && typeof b === "boolean") return a === b ? 0 : a ? 1 : -1;
	return 0;
}

export function shallowEqual(a: Row, b: Row): boolean {
	for (const k in a) if (a[k] !== b[k]) return false;
	for (const k in b) if (!(k in a)) return false;
	return true;
}

const EMPTY: Row[] = [];

function addTo(h: Map<unknown, Set<Row>>, v: unknown, r: Row) {
	let s = h.get(v);
	if (!s) h.set(v, (s = new Set()));
	s.add(r);
}

function lowerBound(arr: Row[], r: Row, cmp: (a: Row, b: Row) => number): number {
	let lo = 0;
	let hi = arr.length;
	while (lo < hi) {
		const mid = (lo + hi) >>> 1;
		if (cmp(arr[mid]!, r) < 0) lo = mid + 1;
		else hi = mid;
	}
	return lo;
}

/** Sort queued bulk inserts and merge them in one linear pass. */
function flushSorted(s: Sorted) {
	if (!s.arr || !s.pending.length) return;
	const add = s.pending.sort(s.cmp);
	const old = s.arr;
	const out = new Array<Row>(old.length + add.length);
	let i = 0;
	let j = 0;
	let k = 0;
	while (i < old.length && j < add.length) out[k++] = s.cmp(old[i]!, add[j]!) <= 0 ? old[i++]! : add[j++]!;
	while (i < old.length) out[k++] = old[i++]!;
	while (j < add.length) out[k++] = add[j++]!;
	s.arr = out;
	s.pending = [];
}
