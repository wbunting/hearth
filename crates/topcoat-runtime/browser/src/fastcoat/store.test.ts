// Differential test: fastcoat's Table vs TanStack DB collections.
//
// TanStack DB is a dev dependency only (it no longer ships in the runtime).
// Random sequences of server syncs and optimistic writes (accepted or
// rejected, settling in random order) run against both.
//
// One intentional difference: while *any* write is persisting, TanStack
// holds back *all* incoming server data for the collection; we hold back
// only the keys that have a pending write (other rows update immediately).
// A consequence: an edit made while TanStack is holding sync data applies
// on top of an older row there, and on top of the newest row here. So while
// writes are pending we require, for every key with a pending write, the
// same presence and the same values for the fields the user wrote; and
// whenever nothing is pending, identical state.

import { createCollection } from "@tanstack/db";
import { describe, expect, it } from "vitest";
import { type Row, Table } from "./store";

type Deferred = { resolve: () => void; reject: (e: Error) => void };

/** Same operations against TanStack and our Table, with controllable handlers. */
function pair(initial: Row[]) {
	let w: any;
	// Server keys as TanStack sees them, including sync transactions it is
	// holding back while a write persists.
	const serverKeys = new Set(initial.map((r) => String(r.id)));
	const tsPending: Deferred[] = [];
	const ours = new Table("t", "id");
	ours.applyServer(initial);
	ours.markReady();
	const handler = (pending: Deferred[]) => () =>
		new Promise<void>((resolve, reject) => pending.push({ resolve, reject }));
	const ts = createCollection<Row, string>({
		id: `ts${Math.random()}`,
		getKey: (r) => String(r.id),
		startSync: true,
		gcTime: 0,
		sync: {
			rowUpdateMode: "full",
			sync: (p: any) => {
				w = p;
				p.begin();
				for (const r of initial) p.write({ type: "insert", value: r });
				p.commit();
				p.markReady();
			},
		},
		onInsert: handler(tsPending),
		onUpdate: handler(tsPending),
		onDelete: handler(tsPending),
	});
	const ourPending: Deferred[] = [];
	const ourHandler = handler(ourPending);
	const swallow = (p: Promise<unknown>) => p.catch(() => {});
	return {
		ts,
		ours,
		sync(rows: Row[], deleted: string[] = []) {
			w.begin();
			for (const r of rows) w.write({ type: hasServer(r.id) ? "update" : "insert", value: r });
			for (const k of deleted) if (hasServer(k)) w.write({ type: "delete", value: { id: k } });
			w.commit();
			for (const r of rows) serverKeys.add(String(r.id));
			for (const k of deleted) serverKeys.delete(k);
			ours.applyServer(rows, deleted);
		},
		insert(r: Row) {
			swallow(ts.insert(r).isPersisted.promise);
			swallow(ours.insert(r, ourHandler));
		},
		update(k: string, changes: Row) {
			swallow(ts.update(k, (d: Row) => Object.assign(d, changes)).isPersisted.promise);
			swallow(ours.update(k, changes, ourHandler));
		},
		delete(k: string) {
			swallow(ts.delete(k).isPersisted.promise);
			swallow(ours.delete(k, ourHandler));
		},
		pending: () => tsPending.length,
		pendingKeys: () => [...(ours as any).writes.keys()] as string[],
		/** Fields the pending writes on `k` set (all fields for an insert). */
		writtenFields: (k: string) => {
			const ms = ((ours as any).writes.get(k) ?? []) as { type: string; value?: Row; changes?: Row }[];
			const out = new Set<string>(["id"]);
			for (const m of ms) for (const f of Object.keys((m.type === "insert" ? m.value : m.changes) ?? {})) out.add(f);
			return [...out];
		},
		/** Let both libraries call their handlers. */
		async flush() {
			for (let j = 0; j < 10; j++) await Promise.resolve();
			expect(ourPending.length).toBe(tsPending.length);
		},
		async settle(i: number, ok: boolean) {
			await this.flush();
			const a = tsPending.splice(i, 1)[0]!;
			const b = ourPending.splice(i, 1)[0]!;
			if (ok) {
				a.resolve();
				b.resolve();
			} else {
				a.reject(new Error("rejected"));
				b.reject(new Error("rejected"));
			}
			for (let j = 0; j < 10; j++) await Promise.resolve();
		},
		state: () => ({
			ts: Object.fromEntries([...ts.entries()].map(([k, v]) => [String(k), strip(v)] as [string, unknown]).sort(byKey)),
			ours: Object.fromEntries([...ours.rows.entries()].map(([k, v]) => [k, strip(v)] as [string, unknown]).sort(byKey)),
		}),
	};
	function hasServer(id: unknown) {
		return serverKeys.has(String(id));
	}
}

const pickFields = (r: Row, fs: string[]) => Object.fromEntries(fs.sort().map((f) => [f, r[f]]));
const RUNS = Number((globalThis as any).process?.env?.STORE_RUNS ?? 300);
const STEPS = Number((globalThis as any).process?.env?.STORE_STEPS ?? 14);
const byKey = (a: [string, unknown], b: [string, unknown]) => (a[0] < b[0] ? -1 : 1);
const strip = (r: Row) => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith("$")));

describe("Table (vs TanStack DB)", () => {
	it("optimistic update shows immediately and rolls back on rejection", async () => {
		const p = pair([{ id: "a", n: 1 }]);
		p.update("a", { n: 2 });
		expect(p.ours.get("a")).toEqual({ id: "a", n: 2 });
		expect(p.state().ours).toEqual(p.state().ts);
		await p.settle(0, false);
		expect(p.ours.get("a")).toEqual({ id: "a", n: 1 });
		expect(p.state().ours).toEqual(p.state().ts);
	});

	it("server data during a pending write stays underneath until it settles", async () => {
		const p = pair([{ id: "a", n: 1, m: 1 }]);
		p.update("a", { n: 2 });
		p.sync([{ id: "a", n: 1, m: 5 }]);
		expect(p.state().ours).toEqual(p.state().ts);
		await p.settle(0, true);
		expect(p.state().ours).toEqual(p.state().ts);
	});

	it("unrelated server rows apply during a pending write (TanStack holds them)", async () => {
		const p = pair([{ id: "a", n: 1 }, { id: "b", n: 1 }]);
		p.update("a", { n: 2 });
		await p.flush();
		p.sync([{ id: "b", n: 7 }]);
		expect(p.ours.get("b")).toEqual({ id: "b", n: 7 });
		expect(strip(p.ts.get("b")!)).toEqual({ id: "b", n: 1 }); // held until the write settles
		await p.settle(0, true);
		expect(p.state().ours).toEqual(p.state().ts);
	});

	it("rejected insert disappears; rejected delete comes back", async () => {
		const p = pair([{ id: "a", n: 1 }]);
		p.insert({ id: "b", n: 9 });
		p.delete("a");
		expect(p.state().ours).toEqual(p.state().ts);
		await p.settle(0, false);
		await p.settle(0, false);
		expect(p.state().ours).toEqual(p.state().ts);
		expect(p.ours.has("a")).toBe(true);
		expect(p.ours.has("b")).toBe(false);
	});

	it("an insert the server stores under another key never shows twice", async () => {
		const t = new Table("t", "id");
		t.markReady();
		const sizes: number[] = [];
		t.listen(() => sizes.push(t.size));
		await t.insert({ id: "tmp", v: 1 }, async () => ({ rows: [{ id: "real", v: 1 }] }));
		expect([...t.rows.keys()]).toEqual(["real"]);
		expect(Math.max(...sizes)).toBe(1);
	});

	it("throws like TanStack on bad writes", () => {
		const t = new Table("t", "id");
		t.applyServer([{ id: "a" }]);
		const h = () => {};
		expect(() => t.insert({ id: "a" }, h)).toThrow();
		expect(() => t.update("zz", {}, h)).toThrow();
		expect(() => t.delete("zz", h)).toThrow();
		expect(() => t.update("a", { id: "b" }, h)).toThrow();
	});

	it("keeps indexes consistent through optimistic writes and rollback", async () => {
		const t = new Table("t", "id");
		t.applyServer(Array.from({ length: 100 }, (_, i) => ({ id: `r${i}`, open: i % 2 === 0, m: i })));
		const spec = [{ col: "m", desc: true }];
		t.sortedIndex("m", spec);
		[...t.lookup("open", true)];
		let reject!: (e: Error) => void;
		const p = t.update("r10", { m: 1000, open: false }, () => new Promise((_, r) => (reject = r)));
		p.catch(() => {});
		await Promise.resolve();
		await Promise.resolve();
		expect(t.sortedIndex("m", spec)[0]!.id).toBe("r10");
		expect([...t.lookup("open", true)].some((r) => r.id === "r10")).toBe(false);
		reject(new Error("no"));
		await p.catch(() => {});
		expect(t.sortedIndex("m", spec)[0]!.id).toBe("r99");
		expect([...t.lookup("open", true)].some((r) => r.id === "r10")).toBe(true);
		const ids = t.sortedIndex("m", spec).map((r) => r.id);
		expect(ids.length).toBe(100);
		expect(new Set(ids).size).toBe(100);
	});

	it("matches TanStack on random interleavings", async () => {
		let seed = 7;
		const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
		const pick = <T>(xs: T[]) => xs[Math.floor(rnd() * xs.length)]!;
		const keys = ["a", "b", "c", "d", "e"];
		for (let run = 0; run < RUNS; run++) {
			const p = pair(keys.slice(0, 3).map((id, i) => ({ id, n: i, s: "x" })));
			const log: string[] = [];
			for (let step = 0; step < STEPS; step++) {
				const r = rnd();
				const before = JSON.stringify(p.state().ts);
				try {
					if (r < 0.25) {
						const rows = keys.filter(() => rnd() < 0.4).map((id) => ({ id, n: Math.floor(rnd() * 5), s: pick(["x", "y"]) }));
						const deleted = keys.filter(() => rnd() < 0.15);
						p.sync(rows, deleted.filter((k) => !rows.some((r) => r.id === k)));
						log.push(`sync ${JSON.stringify(rows)} del ${deleted.filter((k) => !rows.some((r) => r.id === k))}`);
					} else if (r < 0.45) {
						const k = pick(keys);
						if (!p.ours.has(k) && !p.ts.has(k)) { p.insert({ id: k, n: 9, s: "new" }); log.push(`insert ${k}`); }
					} else if (r < 0.65) {
						const k = pick(keys);
						if (p.ours.has(k) && p.ts.has(k)) {
							const c: Row = rnd() < 0.5 ? { n: Math.floor(rnd() * 5) } : { s: pick(["p", "q"]) };
							const [f, v] = Object.entries(c)[0]!;
							// Both libraries skip a no-op update; only compare real ones.
							if (p.ours.get(k)![f] !== v && (p.ts.get(k) as Row)[f] !== v) {
								p.update(k, c);
								log.push(`update ${k} ${JSON.stringify(c)}`);
							}
						}
					} else if (r < 0.75) {
						const k = pick(keys);
						if (p.ours.has(k) && p.ts.has(k)) { p.delete(k); log.push(`delete ${k}`); }
					} else {
						await p.flush();
						if (p.pending() > 0) { const i = Math.floor(rnd() * p.pending()); const ok = rnd() < 0.7; await p.settle(i, ok); log.push(`settle #${i} ${ok ? "ok" : "REJECT"}`); }
					}
				} catch (e) {
					throw new Error(`run ${run} step ${step}: ${(e as Error).message}`);
				}
				const s = p.state();
				const quiet = p.pending() === 0 && p.ours.pendingCount === 0;
				const pk = p.pendingKeys();
				const view = (o: { [k: string]: unknown }) =>
					Object.fromEntries(pk.sort().map((k) => [k, o[k] ? pickFields(o[k] as Row, p.writtenFields(k)) : null]));
				const cmp = quiet ? s : { ours: view(s.ours), ts: view(s.ts) };
				if (JSON.stringify(cmp.ours) !== JSON.stringify(cmp.ts)) {
					throw new Error(`run ${run} step ${step} diverged:\n${log.join("\n")}\n`+`\n ours ${JSON.stringify(cmp.ours)}\n ts   ${JSON.stringify(cmp.ts)}`);
				}
			}
			await p.flush();
			while (p.pending() > 0) await p.settle(0, rnd() < 0.7);
			expect(p.state().ours).toEqual(p.state().ts);
		}
	});
});
