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
	from: { table: "items", alias: "i", key: "id" },
	joins: [],
	where: null,
	order: [],
	limit: null,
	select: { id: { col: ["i", "id"] } },
	key: "id",
	types: { id: "string" },
};
function db(rows = [{ id: "a", value: "old" }], config: Schema = schema) {
	const d = new LocalDb();
	d.init(config, { items: rows });
	d.live(query, []);
	return d;
}
const reply = (value: unknown) =>
	Promise.resolve(new Response(JSON.stringify(value)));
afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	document.body.innerHTML = "";
	vi.useRealTimers();
});

describe("delta synchronization", () => {
	it("does not discard a load when another table mutates", async () => {
		vi.useFakeTimers();
		const d = new LocalDb();
		d.init(
			{
				...schema,
				tables: [
					...schema.tables,
					{ ...schema.tables[0]!, name: "comments", load: "/comments/load" },
				],
			},
			{
				items: [{ id: "a", value: "old" }],
				comments: [{ id: "c", value: "old" }],
			},
		);
		d.live(query, []);
		d.live(
			{ ...query, from: { table: "comments", alias: "i", key: "id" } },
			[],
		);
		let release!: (r: Response) => void;
		let started!: () => void;
		const loading = new Promise<void>((r) => {
			started = r;
		});
		const fetch = vi.fn((url: string) => {
			if (url === "/mutate") return reply({ id: "c", value: "new" });
			if (url.startsWith("/comments/"))
				return reply({
					rows: [{ id: "c", value: "new" }],
					deleted: [],
					full: true,
					cursor: "c1",
				});
			started();
			return new Promise<Response>((r) => {
				release = r;
			});
		});
		vi.stubGlobal("fetch", fetch);
		const syncing = d.backfill();
		await loading;
		d.update("comments", "c", { value: "new" });
		release(
			new Response(
				JSON.stringify({
					rows: [{ id: "a", value: "loaded" }],
					deleted: [],
					full: true,
					cursor: "a1",
				}),
			),
		);
		await syncing;
		expect(d.get("items", "a")?.value).toBe("loaded");
		expect(
			fetch.mock.calls.filter(([url]) => url.startsWith("/load")),
		).toHaveLength(1);
	});
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

function redirected(url: string) {
	const response = new Response("<html>Sign in</html>", {
		headers: { "content-type": "text/html" },
	});
	Object.defineProperties(response, {
		redirected: { value: true },
		url: { value: url },
	});
	return response;
}

describe("unauthorized requests", () => {
	const policies = [
		{ name: "legacy default", policy: undefined, target: "/login" },
		{
			name: "custom sign-in",
			policy: { redirect: "/account/sign-in?from=hearth" },
			target: "/account/sign-in?from=hearth",
		},
		{ name: "error only", policy: "error", target: undefined },
	] as const;
	for (const { name, policy, target } of policies) {
		for (const response of ["401", "redirect"] as const) {
			if (!target && response === "redirect") continue;
			for (const operation of ["load", "update", "insert", "delete"] as const) {
				it(name + " " + response + " on " + operation, async () => {
					vi.useFakeTimers();
					vi.spyOn(console, "error").mockImplementation(() => {});
					const location = { href: "https://app.test/issues" };
					vi.stubGlobal("location", location);
					vi.stubGlobal(
						"fetch",
						vi.fn(async () =>
							response === "401"
								? new Response("Unauthorized", { status: 401 })
								: redirected("https://app.test" + target),
						),
					);
					const d = db(undefined, {
						...schema,
						...(policy ? { on_unauthorized: policy } : {}),
					});
					if (operation === "load") {
						const errors = [] as string[];
						vi.stubGlobal("__hearthErrors", errors);
						const save = vi.fn();
						vi.spyOn(
							d as unknown as { cache(): Promise<unknown> },
							"cache",
						).mockResolvedValue({ restore: async () => undefined, save } as never);
						await d.backfill();
						expect(save).not.toHaveBeenCalled();
						expect(d.get("items", "a")?.value).toBe("old");
						expect(errors).toHaveLength(1);
						expect(errors[0]).toContain("unauthorized");
					} else {
						if (operation === "update")
							d.update("items", "a", { value: "new" });
						if (operation === "insert")
							d.insert("items", { id: "b", value: "new" });
						if (operation === "delete") d.delete("items", "a");
						// Await rollback without starting the scheduled backfill.
						await vi.waitFor(
							() =>
								expect(
									document.querySelector(".hearth-toast")?.textContent,
								).toContain("unauthorized"),
							{ interval: 0 },
						);
						expect(d.get("items", "a")?.value).toBe("old");
						expect(d.get("items", "b")).toBeUndefined();
					}
					expect(location.href).toBe(target ?? "https://app.test/issues");
				});
			}
		}
	}
});

describe("sign-in redirect matching", () => {
	it.each([
		["/login-help", "/login"],
		["https://other.test/login", "/login"],
		["/login", "/account/sign-in"],
		["/login", null],
	])(
		"ignores unrelated redirect %s for sign-in %s",
		async (destination, signIn) => {
			vi.useFakeTimers();
			const location = { href: "https://app.test/issues" };
			vi.stubGlobal("location", location);
			vi.stubGlobal(
				"fetch",
				vi.fn(async () => {
					const response = redirected(new URL(destination, location.href).href);
					// Unrelated redirects may legitimately return table rows.
					return Object.assign(response, {
						json: async () => [{ id: "b", value: "loaded" }],
					});
				}),
			);
			const d = db(undefined, {
				...schema,
				on_unauthorized: signIn ? { redirect: signIn } : "error",
			});
			await d.backfill();
			expect(d.get("items", "b")?.value).toBe("loaded");
			expect(location.href).toBe("https://app.test/issues");
		},
	);

	it("recognizes sign-in redirects with server-added query parameters", async () => {
		vi.useFakeTimers();
		vi.spyOn(console, "error").mockImplementation(() => {});
		const location = { href: "https://app.test/issues" };
		vi.stubGlobal("location", location);
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				redirected("https://app.test/account/sign-in?next=issues"),
			),
		);
		const d = db(undefined, {
			...schema,
			on_unauthorized: { redirect: "/account/sign-in" },
		});
		await d.backfill();
		expect(location.href).toBe("/account/sign-in");
	});

	it("keeps forbidden mutations as ordinary rollback errors", async () => {
		vi.useFakeTimers();
		const location = { href: "https://app.test/issues" };
		vi.stubGlobal("location", location);
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("Forbidden", { status: 403 })),
		);
		const d = db();
		d.update("items", "a", { value: "rejected" });
		await vi.waitFor(
			() =>
				expect(document.querySelector(".hearth-toast")?.textContent).toContain(
					"403",
				),
			{ interval: 0 },
		);
		expect(d.get("items", "a")?.value).toBe("old");
		expect(location.href).toBe("https://app.test/issues");
	});
});
