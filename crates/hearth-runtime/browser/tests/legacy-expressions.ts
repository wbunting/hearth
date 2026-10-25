// Legacy DOM fixtures author JS strings directly. Keep their compiler in the
// test harness only; compile.test.ts un-mocks this to exercise production code.
import { vi } from "vitest";

vi.mock("../src/expression/compile", () => {
	let table: string[] = [];
	return {
		getJsTable: () => table,
		setJsTable: (next: string[]) => {
			const prev = table;
			table = next;
			return prev;
		},
		loadExpressions: async () => {},
		compile: (source: string) => {
			const src = source.startsWith("@")
				? table[Number(source.slice(1))]!
				: source;
			return new Function("cx", `return ${src};`);
		},
	};
});
