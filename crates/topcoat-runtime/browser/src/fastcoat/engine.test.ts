import { BTreeIndex, createCollection } from "@tanstack/db";
import { describe, expect, it } from "vitest";
import type { Query } from "./db";
import { LiveQuery, Mirror, run } from "./engine";

type Row = { [k: string]: unknown };

function table(rows: Row[], key = "id") {
	let w: any;
	const c = createCollection<Row, string>({
		id: `t${Math.random()}`,
		getKey: (r) => String(r[key]),
		startSync: true,
		gcTime: 0,
		sync: {
			rowUpdateMode: "full",
			sync: (p: any) => {
				w = p;
				p.begin();
				for (const r of rows) p.write({ type: "insert", value: r });
				p.commit();
				p.markReady();
			},
		},
	});
	c.createIndex((r: any) => r.open, { indexType: BTreeIndex });
	return { c, write: (rows: Row[], type = "insert") => (w.begin(), rows.forEach((r) => w.write({ type, value: r })), w.commit()) };
}

const WORDS = ["replicache", "sync", "auth", "chunk", "rocicorp", "zero", "bug", "perf"];
function issues(n: number): Row[] {
	let seed = 1;
	const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
	return Array.from({ length: n }, (_, i) => ({
		id: `i${i}`,
		shortId: i,
		title: `${WORDS[Math.floor(rnd() * 8)]} ${WORDS[Math.floor(rnd() * 8)]} ${i}`,
		open: rnd() < 0.3,
		modified: Math.floor(rnd() * 1e6),
		creatorId: `u${Math.floor(rnd() * 14)}`,
		assigneeId: rnd() < 0.5 ? null : `u${Math.floor(rnd() * 14)}`,
	}));
}
const users: Row[] = Array.from({ length: 14 }, (_, i) => ({ id: `u${i}`, login: `user${i}` }));

const listQuery: Query = {
	from: { table: "issues", alias: "i" },
	joins: [
		{ table: "users", alias: "c", kind: "left", on: [{ col: ["i", "creatorId"] }, { col: ["c", "id"] }] },
		{ table: "users", alias: "a", kind: "left", on: [{ col: ["i", "assigneeId"] }, { col: ["a", "id"] }] },
	],
	where: {
		op: "and",
		args: [
			{ op: "if", cond: { param: 0 }, then: { op: "eq", l: { col: ["i", "open"] }, r: { param: 1 } } },
			{ op: "if", cond: { param: 2 }, then: { op: "eq", l: { col: ["i", "creatorId"] }, r: { param: 3 } } },
			{ op: "if", cond: { param: 4 }, then: { op: "contains", l: { col: ["i", "title"] }, r: { param: 5 } } },
		],
	},
	order: [{ expr: { col: ["i", "modified"] }, desc: true }],
	limit: 200,
	select: {
		id: { col: ["i", "id"] },
		title: { col: ["i", "title"] },
		open: { col: ["i", "open"] },
		creator: { col: ["c", "login"] },
		assignee: { col: ["a", "login"] },
	},
	key: "id",
	types: {} as any,
};

/** Straightforward reference: filter everything, sort, slice, join. */
function reference(all: Row[], p: unknown[]): Row[] {
	const byId = new Map(users.map((u) => [u.id, u]));
	return all
		.filter((r) => (!p[0] || r.open === p[1]) && (!p[2] || r.creatorId === p[3]) && (!p[4] || String(r.title).toLowerCase().includes(String(p[5]).toLowerCase())))
		.sort((a, b) => (b.modified as number) - (a.modified as number) || (String(a.id) < String(b.id) ? -1 : 1))
		.slice(0, 200)
		.map((r) => ({ id: r.id, title: r.title, open: r.open, creator: (byId.get(r.creatorId) as any)?.login ?? null, assignee: (byId.get(r.assigneeId) as any)?.login ?? null }));
}

describe("engine", () => {
	const all = issues(50_000);
	const it_ = table(all);
	const us = table(users);
	const mirrors = new Map([
		["issues", new Mirror(it_.c, "id")],
		["users", new Mirror(us.c, "id")],
	]);
	const tables = (n: string) => mirrors.get(n)!;

	const cases: unknown[][] = [
		[true, true, false, "", false, ""],
		[true, false, false, "", false, ""],
		[false, null, false, "", false, ""],
		[true, true, true, "u3", false, ""],
		[true, true, false, "", true, "repl"],
		[true, false, true, "u7", true, "SYNC"],
		[true, true, false, "", true, "nomatch"],
	];
	for (const p of cases) {
		it(`matches reference for ${JSON.stringify(p)}`, () => {
			expect(run(listQuery, p, tables)).toEqual(reference(all, p));
		});
	}

	it("pushes base filters below joins (order by a joined column)", () => {
		const labels = Array.from({ length: 30 }, (_, i) => ({ id: `l${i}`, name: `label${String(29 - i).padStart(2, "0")}` }));
		const il = Array.from({ length: 100_000 }, (_, i) => ({ id: `il${i}`, issueId: `i${i % 50_000}`, labelId: `l${i % 30}` }));
		const lt = table(labels);
		const ilt = table(il);
		const ms = new Map([
			["labels", new Mirror(lt.c, "id")],
			["issue_labels", new Mirror(ilt.c, "id")],
		]);
		const q: Query = {
			from: { table: "issue_labels", alias: "il" },
			joins: [{ table: "labels", alias: "l", kind: "inner", on: [{ col: ["il", "labelId"] }, { col: ["l", "id"] }] }],
			where: { op: "eq", l: { col: ["il", "issueId"] }, r: { param: 0 } },
			order: [{ expr: { col: ["l", "name"] }, desc: false }],
			limit: null,
			select: { id: { col: ["il", "id"] }, name: { col: ["l", "name"] } },
			key: "id",
			types: {} as any,
		};
		const t = (n: string) => ms.get(n)!;
		run(q, ["i7"], t);
		const t0 = performance.now();
		const out = run(q, ["i7"], t);
		expect(performance.now() - t0).toBeLessThan(2);
		expect(out).toEqual([
			{ id: "il50007", name: "label02" },
			{ id: "il7", name: "label22" },
		]);
	});

	it("is fast at 50k rows", () => {
		run(listQuery, cases[0]!, tables); // build indexes
		for (const p of cases) {
			const t = performance.now();
			run(listQuery, p, tables);
			const ms = performance.now() - t;
			expect(ms).toBeLessThan(40);
		}
	});

	it("bulk inserts after the index exists stay correct", () => {
		const base = issues(5_000);
		const t = table(base.slice(0, 1000));
		const m = new Map([
			["issues", new Mirror(t.c, "id")],
			["users", new Mirror(us.c, "id")],
		]);
		const tb = (n: string) => m.get(n)!;
		run(listQuery, cases[0]!, tb); // build sorted index on 1k rows
		for (let i = 1000; i < 5000; i += 1000) t.write(base.slice(i, i + 1000));
		for (const p of cases) expect(run(listQuery, p, tb)).toEqual(reference(base, p));
		// updates after bulk
		t.write([{ ...base[10]!, modified: 2e6 }], "update");
		const after = base.map((r, i) => (i === 10 ? { ...r, modified: 2e6 } : r));
		for (const p of cases) expect(run(listQuery, p, tb)).toEqual(reference(after, p));
	});

	it("live query sees writes and keeps unchanged row identity", async () => {
		const lq = new LiveQuery(listQuery, cases[0]!, tables);
		const before = lq.toArray;
		let fired = 0;
		lq.subscribeChanges(() => fired++);
		const top = all.filter((r) => r.open).sort((a, b) => (b.modified as number) - (a.modified as number))[0]!;
		it_.write([{ ...top, open: false }], "update");
		await Promise.resolve();
		await Promise.resolve();
		const after = lq.toArray;
		expect(fired).toBe(1);
		expect(after.find((r) => r.id === top.id)).toBeUndefined();
		expect(after.length).toBe(200);
		expect(after[0]).toBe(before[1]);
		lq.cleanup();
	});
});

import { lisMask } from "./list";
describe("lisMask", () => {
	it("keeps the longest in-order run", () => {
		expect(lisMask([0, 1, 2, 3])).toEqual([true, true, true, true]);
		expect(lisMask([-1, 0, 1, 2])).toEqual([false, true, true, true]);
		expect(lisMask([3, 0, 1, 2])).toEqual([false, true, true, true]);
		expect(lisMask([2, 1, 0])).toEqual([false, false, true]);
		expect(lisMask([])).toEqual([]);
	});
});
