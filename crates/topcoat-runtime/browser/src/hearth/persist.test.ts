import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { LocalPersistence as Persistence } from "./persist";
import { type Row, Table } from "./store";

let stores: Persistence[] = [];
let sequence = 0;
async function open(namespace = `test-${++sequence}`) {
	const p = await Persistence.open(namespace);
	stores.push(p);
	return p;
}
afterEach(() => {
	for (const p of stores) p.close();
	stores = [];
});
async function read(p: Persistence, name = "items") {
	const rows: Row[] = [];
	const cursor = await p.restore(name, (part) => rows.push(...part));
	return {
		rows: rows.sort((a, b) => String(a.id).localeCompare(String(b.id))),
		cursor,
	};
}

describe("durable server checkpoints", () => {
	it("restores across reopen and applies inserts, updates and tombstones", async () => {
		const p = await open("reopen");
		await p.save("items", "id", {
			full: true,
			rows: [
				{ id: "a", v: 1 },
				{ id: "b", v: 2 },
			],
			deleted: [],
			cursor: "1",
		});
		p.close();
		const q = await open("reopen");
		await q.save(
			"items",
			"id",
			{
				full: false,
				rows: [
					{ id: "a", v: 3 },
					{ id: "c", v: 4 },
				],
				deleted: ["b"],
				cursor: "2",
			},
			"1",
		);
		expect(await read(q)).toEqual({
			rows: [
				{ id: "a", v: 3 },
				{ id: "c", v: 4 },
			],
			cursor: "2",
		});
	});
	it("full reset replaces old buckets and empty checkpoints remain valid", async () => {
		const p = await open();
		await p.save("items", "id", {
			full: true,
			rows: [{ id: "old" }],
			deleted: [],
			cursor: "1",
		});
		await p.save("items", "id", {
			full: true,
			rows: [],
			deleted: [],
			cursor: "2",
		});
		expect(await read(p)).toEqual({ rows: [], cursor: "2" });
	});
	it("schema/user namespaces are isolated even when an old tab reopens", async () => {
		const p = await open("schema1:user1:crew");
		await p.save("items", "id", {
			full: true,
			rows: [{ id: "private" }],
			deleted: [],
			cursor: "1",
		});
		const q = await open("schema2:user2:public");
		expect(await read(q)).toEqual({ rows: [], cursor: undefined });
		await q.save("items", "id", {
			full: true,
			rows: [{ id: "new-viewer" }],
			deleted: [],
			cursor: "q1",
		});
		// A stale opener must not clear the newer viewer's checkpoint.
		const stale = await open("schema1:user1:crew");
		await p.save("items", "id", {
			full: true,
			rows: [{ id: "leak" }],
			deleted: [],
			cursor: "2",
		});
		expect(await read(stale)).toEqual({ rows: [{ id: "leak" }], cursor: "2" });
		expect(await read(q)).toEqual({
			rows: [{ id: "new-viewer" }],
			cursor: "q1",
		});
	});
	it("a mismatched cross-tab delta base invalidates rather than corrupts rows", async () => {
		const p = await open();
		await p.save("items", "id", {
			full: true,
			rows: [{ id: "a" }],
			deleted: [],
			cursor: "newer",
		});
		await p.save(
			"items",
			"id",
			{ full: false, rows: [{ id: "b" }], deleted: [], cursor: "other" },
			"older",
		);
		expect(await read(p)).toEqual({ rows: [], cursor: undefined });
	});
	it("failed writes do not advance the checkpoint", async () => {
		const p = await open();
		await p.save("items", "id", {
			full: true,
			rows: [{ id: "a", v: 1 }],
			deleted: [],
			cursor: "1",
		});
		await expect(
			p.save(
				"items",
				"id",
				{
					full: false,
					rows: [{ id: "a", fn: () => {} }],
					deleted: [],
					cursor: "2",
				},
				"1",
			),
		).rejects.toBeDefined();
		expect(await read(p)).toEqual({ rows: [{ id: "a", v: 1 }], cursor: "1" });
	});
	it("scope tombstones update the server shadow beneath optimistic edits and rollback", async () => {
		const p = await open();
		await p.save("items", "id", {
			full: true,
			rows: [{ id: "a", v: 1 }],
			deleted: [],
			cursor: "1",
		});
		const t = new Table("items", "id");
		await p.restore("items", (rows) => t.applyServer(rows));
		let reject!: (error: Error) => void;
		const write = t.update(
			"a",
			{ v: 99 },
			() =>
				new Promise((_, r) => {
					reject = r;
				}),
		);
		await Promise.resolve();
		t.applyServer([], ["a"]);
		await p.save(
			"items",
			"id",
			{ full: false, rows: [], deleted: ["a"], cursor: "2" },
			"1",
		);
		expect(t.get("a")?.v).toBe(99);
		expect(await read(p)).toEqual({ rows: [], cursor: "2" });
		reject(new Error("denied"));
		await expect(write).rejects.toThrow("denied");
		expect(t.has("a")).toBe(false);
	});
});
