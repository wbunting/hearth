// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalDb, type Query, type Schema } from "./db";

const schema: Schema = {
	version: "1",
	scope: "user",
	tables: [
		{
			name: "items",
			key: "id",
			columns: { id: "string", value: "string" },
			indexes: [],
			load: "/load",
			mutate: "/mutate",
		},
	],
};
const query: Query = {
	from: { table: "items", alias: "i" },
	joins: [],
	where: null,
	order: [],
	limit: null,
	select: { id: { col: ["i", "id"] } },
	key: "id",
	types: { id: "string" },
};
function db(rows = [{ id: "a", value: "old" }]) {
	const d = new LocalDb();
	d.init(schema, { items: rows });
	d.live(query, []);
	return d;
}
const reply = (value: unknown) =>
	Promise.resolve(new Response(JSON.stringify(value)));
afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe("delta synchronization", () => {
	it("preserves fresh SSR keys while restoring stale cache before validation", async () => {
		vi.useFakeTimers();
		let release!: (response: Response) => void;
		let loading!: () => void;
		const started = new Promise<void>((r) => {
			loading = r;
		});
		vi.stubGlobal(
			"fetch",
			vi.fn(() => {
				loading();
				return new Promise<Response>((r) => {
					release = r;
				});
			}),
		);
		const d = new LocalDb();
		vi.spyOn(
			d as unknown as { cache(): Promise<unknown> },
			"cache",
		).mockResolvedValue({
			restore: async (_name: string, apply: (rows: object[]) => void) => {
				apply([
					{ id: "a", value: "stale" },
					{ id: "b", value: "cached" },
				]);
				return "checkpoint";
			},
			save: async () => {},
		} as never);
		d.init(schema, { items: [{ id: "a", value: "fresh SSR" }] });
		d.live(query, []);
		const syncing = d.backfill();
		await started;
		expect(d.get("items", "a")?.value).toBe("fresh SSR");
		expect(d.get("items", "b")?.value).toBe("cached");
		release(
			new Response(
				JSON.stringify({
					rows: [{ id: "a", value: "validated" }],
					deleted: ["b"],
					full: false,
					cursor: "next",
				}),
			),
		);
		await syncing;
		expect(d.get("items", "a")?.value).toBe("validated");
		expect(d.get("items", "b")).toBeUndefined();
		vi.restoreAllMocks();
	});
	it("applies inserts, updates, scoped deletions and full reset, serializes refreshes", async () => {
		vi.useFakeTimers();
		const fetch = vi
			.fn()
			.mockImplementationOnce(() =>
				reply({
					rows: [
						{ id: "a", value: "new" },
						{ id: "b", value: "insert" },
					],
					deleted: [],
					full: true,
					cursor: "1",
				}),
			)
			.mockImplementationOnce(() =>
				reply({
					rows: [{ id: "c", value: "insert2" }],
					deleted: ["a"],
					full: false,
					cursor: "2",
				}),
			)
			.mockImplementationOnce(() =>
				reply({ rows: [], deleted: [], full: true, cursor: "3" }),
			);
		vi.stubGlobal("fetch", fetch);
		const d = db();
		await Promise.all([d.backfill(), d.backfill()]);
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(d.get("items", "a")?.value).toBe("new");
		await d.backfill();
		expect(fetch.mock.calls[1]?.[0]).toBe("/load?since=1");
		expect(d.get("items", "a")).toBeUndefined();
		expect([...d.tables.get("items")!.rows.keys()].sort()).toEqual(["b", "c"]);
		await d.backfill();
		expect(d.tables.get("items")!.size).toBe(0);
	});
	it("discards a pre-mutation fetch and retries after acknowledgement", async () => {
		vi.useFakeTimers();
		let release!: (response: Response) => void;
		let loading!: () => void;
		const started = new Promise<void>((r) => {
			loading = r;
		});
		const fetch = vi.fn().mockImplementation((url: string) => {
			if (url === "/mutate") return reply({ id: "a", value: "accepted" });
			if (
				url === "/load?sync=1" &&
				fetch.mock.calls.filter((c) => c[0] === url).length === 1
			) {
				loading();
				return new Promise<Response>((r) => {
					release = r;
				});
			}
			return reply({
				rows: [{ id: "a", value: "accepted" }],
				deleted: [],
				full: true,
				cursor: "2",
			});
		});
		vi.stubGlobal("fetch", fetch);
		const d = db();
		const syncing = d.backfill();
		await started;
		d.update("items", "a", { value: "accepted" });
		release(
			new Response(
				JSON.stringify({
					rows: [{ id: "a", value: "stale" }],
					deleted: [],
					full: true,
					cursor: "1",
				}),
			),
		);
		await syncing;
		expect(d.get("items", "a")?.value).toBe("accepted");
		expect(fetch).toHaveBeenCalledTimes(3);
	});
	it("remains retryable after network failure", async () => {
		vi.useFakeTimers();
		vi.spyOn(console, "error").mockImplementation(() => {});
		const fetch = vi
			.fn()
			.mockRejectedValueOnce(new Error("offline"))
			.mockImplementation(() =>
				reply({ rows: [{ id: "b" }], deleted: [], full: true, cursor: "1" }),
			);
		vi.stubGlobal("fetch", fetch);
		const d = db();
		await d.backfill();
		expect(d.get("items", "a")).toBeDefined();
		await d.backfill();
		expect(d.get("items", "a")).toBeUndefined();
		expect(d.get("items", "b")).toBeDefined();
		vi.restoreAllMocks();
	});
});
