import { expect, it } from "vitest";
import { Integer, integerType } from "./integer";
import { Option } from "./option";
import { String as RString, Str } from "./string";

it("parse_i64 matches Rust str::parse::<i64>().ok()", () => {
	const cases: [string, string | null][] = [
		["42", "42"], ["-7", "-7"], ["+3", "3"], ["", null], ["4 2", null], ["1.5", null],
		["9223372036854775807", "9223372036854775807"], ["9223372036854775808", null], ["abc", null],
	];
	for (const [input, out] of cases) {
		const r = new Str(input).parse_i64();
		expect(r.is_some().dehydrate() ? String(r.unwrap()) : null, input).toBe(out);
	}
});

it("integer to_text", () => {
	expect(new Integer(-12n, integerType("i64", 64)).to_text().toNodeText()).toBe("-12");
});

it("string concat and unwrap_or", () => {
	expect(new RString("/issue/").add(new Str("42")).toNodeText()).toBe("/issue/42");
	expect(Option.none<RString>().unwrap_or(new RString("?")).toNodeText()).toBe("?");
	expect(Option.some(new RString("a")).unwrap_or(new RString("?")).toNodeText()).toBe("a");
});
