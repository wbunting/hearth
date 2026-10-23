// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/error-message.js
// @__NO_SIDE_EFFECTS__
function e() {
	try {
		return !1;
	} catch {
		return !1;
	}
}
function t(e, n) {
	return Array.isArray(e) ? `[${e.map((e) => t(e, !0) ?? "\"[object]\"").join(",")}]` : e instanceof Error ? n ? void 0 : JSON.stringify(e.message) : typeof e == "symbol" || typeof e == "bigint" || n && (e === void 0 || typeof e == "number" && !Number.isFinite(e)) ? JSON.stringify(String(e)) : e === void 0 || typeof e == "number" && !Number.isFinite(e) ? String(e) : typeof e != "object" || !e ? JSON.stringify(e) : void 0;
}
function n(e, n = {}, r = "error") {
	let i = Object.entries(n).flatMap(([e, n]) => {
		try {
			let r = t(n, !1);
			return r === void 0 ? [] : [`${e}=${r}`];
		} catch {
			return [];
		}
	}).join(", ").replace(/[\u2028\u2029]/g, (e) => `\\u${e.charCodeAt(0).toString(16)}`);
	return `TanStack DB ${r} ${e}${i && ` (${i})`}: https://tanstack.com/db/latest/docs/errors#${r}-${e}`;
}
function r(e, t) {
	return n(e, t, "warning");
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/builder/ref-proxy-identity.js
var i = /* @__PURE__ */ Symbol("refProxy");
function a(e) {
	if (e && typeof e == "object") try {
		let t = e[i];
		return t === !0 || Array.isArray(t) ? t : void 0;
	} catch {
		return;
	}
}
function o(e) {
	return e && typeof e == "object" && a(e) !== void 0;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/ir.js
var s = "__includes_scalar__", c = 0, l = 0, u = class {}, d = class extends u {
	constructor(e, t, n) {
		super(), this.type = "collectionRef", this.#e = `source-${++c}`, this.collection = e, this.alias = t, this.#t = n ?? `binding-${++l}`;
	}
	#e;
	#t;
	get sourceId() {
		return this.#e;
	}
	get bindingId() {
		return this.#t;
	}
}, f = class extends u {
	constructor(e, t, n) {
		super(), this.descriptor = e, this.alias = t, this.type = "descriptorRef", this.#e = `source-${++c}`, this.#t = n ?? `binding-${++l}`;
	}
	#e;
	#t;
	get sourceId() {
		return this.#e;
	}
	get bindingId() {
		return this.#t;
	}
};
function p(e) {
	if (e.type === "descriptorRef") throw Error(n(113, { alias: e.alias }));
	return e.collection;
}
var m = class extends u {
	constructor(e, t, n) {
		super(), this.query = e, this.alias = t, this.type = "queryRef", this.#e = n ?? `binding-${++l}`;
	}
	#e;
	get bindingId() {
		return this.#e;
	}
}, h = class extends u {
	constructor(e) {
		super(), this.sources = e, this.type = "unionFrom";
	}
	get alias() {
		return this.sources[0]?.alias ?? "";
	}
}, g = class extends u {
	constructor(e) {
		super(), this.queries = e, this.type = "unionAll";
	}
	get alias() {
		return "";
	}
}, _ = class extends u {
	constructor(e, t, n) {
		super(), this.path = e, this.type = "ref", t !== void 0 && (this.sourceAlias = t), n !== void 0 && Object.defineProperty(this, "bindingId", {
			value: n,
			enumerable: !1
		});
	}
};
function v(e) {
	return e.sourceAlias !== void 0 && e.path[0] === e.sourceAlias ? e.sourceAlias : void 0;
}
function y(e) {
	return v(e) === void 0 ? e.path : e.path.slice(1);
}
var b = class extends u {
	constructor(e) {
		super(), this.value = e, this.type = "val";
	}
}, x = class extends u {
	constructor(e, t) {
		super(), this.name = e, this.args = t, this.type = "func";
	}
}, S = class extends u {
	constructor(e, t) {
		super(), this.name = e, this.args = t, this.type = "agg";
	}
};
function C(e) {
	return e.type === "ref" ? [e] : e.type === "func" || e.type === "agg" ? e.args.flatMap(C) : [];
}
var w = class extends u {
	constructor(e, t, n, r, i, a, o = "collection", s) {
		super(), this.query = e, this.correlationField = t, this.childCorrelationField = n, this.fieldName = r, this.parentFilters = i, this.parentProjection = a, this.materialization = o, this.scalarField = s, this.type = "includesSubquery";
	}
}, T = class extends u {
	constructor(e, t) {
		super(), this.branches = e, this.defaultValue = t, this.type = "conditionalSelect";
	}
};
function E(e) {
	return e instanceof S || e instanceof x || e instanceof _ || e instanceof b;
}
function D(e) {
	return E(e) || e instanceof T || e instanceof w;
}
function ee(e) {
	let t = [], n = /* @__PURE__ */ new Set(), r = (e) => {
		e.type === "collectionRef" || e.type === "descriptorRef" ? n.has(e.sourceId) || (n.add(e.sourceId), t.push(e)) : e.type === "queryRef" ? a(e.query) : e.type === "unionFrom" ? e.sources.forEach(r) : e.queries.forEach(a);
	}, i = (e) => {
		e instanceof w ? a(e.query) : e instanceof T ? (e.branches.forEach((e) => i(e.value)), e.defaultValue !== void 0 && i(e.defaultValue)) : typeof e == "object" && e && !Array.isArray(e) && !D(e) && !o(e) && Object.values(e).forEach(i);
	}, a = (e) => {
		r(e.from), e.join?.forEach(({ from: e }) => r(e)), e.select && Object.values(e.select).forEach(i);
	};
	return a(e), t;
}
function O(e) {
	return ee(e).map((e) => e.type === "descriptorRef" ? p(e) : e);
}
function k(e) {
	return typeof e == "object" && "expression" in e ? e.expression : e;
}
function te(e) {
	return typeof e == "object" && "expression" in e ? e.expression : e;
}
function A(e) {
	return typeof e == "object" && "expression" in e && e.residual === !0;
}
function ne(e) {
	return {
		expression: e,
		residual: !0
	};
}
function j(e) {
	return e.type === "unionFrom" ? e.sources : e.type === "unionAll" ? [] : [e];
}
function re(e, t, n) {
	for (let r of j(e.from)) if (r.alias === t && (n === void 0 || r.bindingId === n)) return r;
	for (let r of e.join || []) if (r.from.alias === t && (n === void 0 || r.from.bindingId === n)) return r.from;
}
function M(e, t, n) {
	let r = v(t);
	if (r !== void 0) {
		let i = re(e, r, t.bindingId);
		if (!i) return;
		let a = y(t);
		return i.type === "queryRef" ? M(i.query, new _(a), n) : {
			collection: p(i),
			path: a,
			alias: r,
			sourceId: i.sourceId
		};
	}
	if (t.path.length !== 0) {
		if (t.path.length === 1) {
			let r = t.path[0];
			if (e.select) {
				let t = e.select[r];
				if (t) return t.type === "ref" ? M(e, t, n) : void 0;
			}
			let i = j(e.from)[0];
			return i?.type === "queryRef" ? M(i.query, new _([r]), n) : i?.type === "collectionRef" ? {
				collection: n,
				path: [r],
				alias: i.alias,
				sourceId: i.sourceId
			} : void 0;
		}
		if (t.path.length > 1) {
			let [r, ...i] = t.path, a = re(e, r, t.bindingId);
			return a ? a.type === "queryRef" ? M(a.query, new _(i), n) : {
				collection: p(a),
				path: i,
				alias: r,
				sourceId: a.sourceId
			} : void 0;
		}
	}
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/hashing/temporal.js
var N = /* @__PURE__ */ new Set([
	"Temporal.Duration",
	"Temporal.Instant",
	"Temporal.PlainDate",
	"Temporal.PlainDateTime",
	"Temporal.PlainMonthDay",
	"Temporal.PlainTime",
	"Temporal.PlainYearMonth",
	"Temporal.ZonedDateTime"
]);
function ie(e) {
	let t = e[Symbol.toStringTag];
	return typeof t == "string" && N.has(t) && Object.getPrototypeOf(e)?.[Symbol.toStringTag] === t;
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/utils.js
var P = 3e4;
function ae(e, t) {
	if (t.length <= P) e.push(...t);
	else for (let n = 0; n < t.length; n += P) {
		let r = t.slice(n, n + P);
		e.push(...r);
	}
}
function oe(e, t, n) {
	let r = 0, i = e.length;
	for (; r < i;) {
		let a = Math.floor((r + i) / 2), o = n(e[a], t);
		if (o < 0) r = a + 1;
		else if (o > 0) i = a;
		else return a;
	}
	return r;
}
function se(e, t) {
	if (e === null) return "null";
	if (e === void 0) return "undefined";
	let n = typeof e;
	if (n === "object" || n === "function" || n === "symbol") {
		let n = e, r = t.get(n);
		return r === void 0 && t.set(n, r = t.size), `ref_${r}`;
	}
	return `${n}_${String(e)}`;
}
function ce(e, t) {
	let [n, r] = e, [i, a] = t;
	return {
		onlyInA: [...F(n, Math.min(r, i)), ...F(Math.max(n, a), r)],
		onlyInB: [...F(i, Math.min(a, n)), ...F(Math.max(i, r), a)]
	};
}
function F(e, t) {
	let n = [];
	for (let r = e; r < t; r++) n.push(r);
	return n;
}
function le(e, t) {
	if (typeof e == typeof t) {
		if (typeof e == "number" && typeof t == "number") {
			let n = Number.isNaN(e), r = Number.isNaN(t);
			if (n || r) return n && r ? 0 : n ? 1 : -1;
		}
		return e < t ? -1 : +(e > t);
	}
	return typeof e == "string" ? -1 : 1;
}
function I(e) {
	return ue(e, /* @__PURE__ */ new Set()) ? JSON.stringify(de(e)) : `~${JSON.stringify(fe(e, /* @__PURE__ */ new Set()))}`;
}
function ue(e, t) {
	if (e === null) return !0;
	switch (typeof e) {
		case "boolean":
		case "string": return !0;
		case "number": return Number.isFinite(e);
		case "undefined":
		case "bigint":
		case "symbol":
		case "function": return !1;
	}
	return me(e, t, () => e instanceof Date || e instanceof RegExp || e instanceof Uint8Array || ie(e) || e instanceof Map || e instanceof Set ? !1 : Array.isArray(e) ? e.every((e) => ue(e, t)) : Object.keys(e).every((n) => ue(e[n], t)));
}
function de(e) {
	return e === null || typeof e == "boolean" || typeof e == "number" || typeof e == "string" ? e : Array.isArray(e) ? e.map(de) : Object.fromEntries(Object.keys(e).sort().map((t) => [t, de(e[t])]));
}
function fe(e, t) {
	if (e === void 0) return ["undefined"];
	if (e === null) return ["null"];
	switch (typeof e) {
		case "boolean": return ["boolean", e];
		case "number": return Number.isNaN(e) ? ["number", "NaN"] : e === Infinity ? ["number", "Infinity"] : e === -Infinity ? ["number", "-Infinity"] : ["number", e === 0 ? 0 : e];
		case "bigint": return ["bigint", e.toString()];
		case "string": return ["string", e];
		case "symbol":
		case "function": throw TypeError(`Cannot serialize ${typeof e} as a structural relation key`);
	}
	return me(e, t, () => {
		if (e instanceof Date) {
			let t = e.getTime();
			return Number.isNaN(t) ? ["date", "Invalid"] : ["date", t];
		}
		if (e instanceof RegExp) return [
			"regexp",
			e.source,
			e.flags
		];
		if (e instanceof Uint8Array) return ["bytes", Array.from(e)];
		if (ie(e)) return [
			"temporal",
			e[Symbol.toStringTag],
			e.toString()
		];
		if (Array.isArray(e)) return ["array", e.map((e) => fe(e, t))];
		if (e instanceof Map) {
			let n = [...e.entries()].map(([e, n]) => [fe(e, t), fe(n, t)]);
			return n.sort((e, t) => pe(JSON.stringify(e), JSON.stringify(t))), ["map", n];
		}
		if (e instanceof Set) {
			let n = [...e].map((e) => fe(e, t));
			return n.sort((e, t) => pe(JSON.stringify(e), JSON.stringify(t))), ["set", n];
		}
		return ["object", Object.keys(e).sort().map((n) => [n, fe(e[n], t)])];
	});
}
function pe(e, t) {
	return e < t ? -1 : +(e > t);
}
function me(e, t, n) {
	if (t.has(e)) throw TypeError("Cannot serialize a cyclic structural relation key");
	t.add(e);
	try {
		return n();
	} finally {
		t.delete(e);
	}
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/hashing/murmur.js
var he = L(), ge = L(), _e = L(), ve = L(), ye = L(), be = we(), xe = /* @__PURE__ */ new Map(), Se = 0;
function Ce(e) {
	let t = Symbol.keyFor(e);
	if (t !== void 0) {
		let e = xe.get(t);
		return e === void 0 && (e = ++Se, xe.set(t, e)), e;
	}
	let n = be.get(e);
	return n === void 0 && (n = ++Se, be.set(e, n)), n;
}
function we() {
	let e = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ Symbol();
	try {
		if (e.set(t, 0), e.get(t) === 0) return e;
	} catch {}
	return /* @__PURE__ */ new Map();
}
function L() {
	return Math.random() * (2 ** 31 - 1) >>> 0;
}
var Te = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8)), Ee = class {
	constructor() {
		this.hash = he, this.length = 0, this.carry = 0, this.carryBytes = 0;
	}
	_mix(e) {
		e = Math.imul(e, 3432918353), e = e << 15 | e >>> 17, e = Math.imul(e, 461845907), this.hash ^= e, this.hash = this.hash << 13 | this.hash >>> 19, this.hash = Math.imul(this.hash, 5) + 3864292196;
	}
	writeByte(e) {
		this.carry |= (e & 255) << 8 * this.carryBytes, this.carryBytes++, this.length++, this.carryBytes === 4 && (this._mix(this.carry >>> 0), this.carry = 0, this.carryBytes = 0);
	}
	writeWord(e) {
		if (this.length += 4, this.carryBytes === 0) {
			this._mix(e >>> 0);
			return;
		}
		let t = 8 * this.carryBytes;
		this._mix((this.carry | e << t) >>> 0), this.carry = e >>> 32 - t;
	}
	update(e) {
		switch (typeof e) {
			case "symbol":
				this.update(ye), this.update(Ce(e));
				return;
			case "string":
				this.update(ge);
				{
					let t = e.length - e.length % 2;
					for (let n = 0; n < t; n += 2) this.writeWord(e.charCodeAt(n) | e.charCodeAt(n + 1) << 16);
					if (t < e.length) {
						let n = e.charCodeAt(t);
						this.writeByte(n & 255), this.writeByte(n >>> 8 & 255);
					}
				}
				return;
			case "number":
				Te.setFloat64(0, e, !0), this.writeWord(Te.getUint32(0, !0)), this.writeWord(Te.getUint32(4, !0));
				return;
			case "bigint": {
				let t = e;
				for (t < 0n ? (t = -t, this.update(ve)) : this.update(_e); t > 0n;) this.writeByte(Number(t & 255n)), t >>= 8n;
				e === 0n && this.writeByte(0);
				return;
			}
			default: throw TypeError(`Unsupported input type: ${typeof e}`);
		}
	}
	digest() {
		if (this.carryBytes > 0) {
			let e = this.carry >>> 0;
			e = Math.imul(e, 3432918353), e = e << 15 | e >>> 17, e = Math.imul(e, 461845907), this.hash ^= e;
		}
		return this.hash ^= this.length, this.hash ^= this.hash >>> 16, this.hash = Math.imul(this.hash, 2246822507), this.hash ^= this.hash >>> 13, this.hash = Math.imul(this.hash, 3266489909), this.hash ^= this.hash >>> 16, this.hash >>> 0;
	}
}, De = L(), Oe = L(), ke = L(), Ae = L(), je = L(), Me = L(), Ne = { hash: L() }, Pe = { hash: L() }, Fe = { hash: L() }, Ie = { hash: L() }, Le = { hash: L() }, Re = { hash: L() }, ze = { hash: L() }, Be = { hash: L() }, Ve = 1e6, He = 768, Ue = 128, We = /* @__PURE__ */ new WeakMap(), Ge = /* @__PURE__ */ new WeakSet();
function Ke(e) {
	tt(e);
}
function R(e) {
	let t = new Ee();
	return Ye(t, e), t.digest();
}
function qe(e, t) {
	if (t.activeObjects.size >= He) throw RangeError("Value is too complex to hash safely: structural depth");
	t.activeObjects.add(e);
	let n;
	try {
		let [r, i, a] = Je(e), o = new Ee();
		o.update(r.hash);
		for (let e of i) a ? Ye(o, e, t) : o.update(e);
		if (a) {
			let e = Object.keys(a);
			(!Array.isArray(a) || e.length !== a.length || e.length !== 0 && e[e.length - 1] !== String(a.length - 1)) && e.sort(), e.push(...Object.getOwnPropertySymbols(a).filter((e) => Object.prototype.propertyIsEnumerable.call(a, e)).sort((e, t) => Ce(e) - Ce(t)));
			for (let n of e) o.update(je), o.update(n), Ye(o, a[n], t);
		}
		n = o.digest();
	} finally {
		t.activeObjects.delete(e);
	}
	return t.pendingHashes.set(e, n), n;
}
function Je(e) {
	if (e instanceof Date) {
		let t = e.getTime();
		return [Ne, [Number.isNaN(t) ? "invalid" : t]];
	}
	return Qe(e) ? [ze, [String.fromCharCode.apply(null, e)]] : ie(e) ? [Be, [e[Symbol.toStringTag], e.toString()]] : e instanceof RegExp ? [
		Pe,
		[
			e.source,
			e.flags,
			e.lastIndex
		],
		e
	] : e instanceof Map ? [
		Le,
		[],
		[...e.entries()]
	] : e instanceof Set ? [
		Re,
		[],
		[...e.values()]
	] : e instanceof Array ? [
		Ie,
		[e.length],
		e
	] : [
		Fe,
		[],
		e
	];
}
function Ye(e, t, n) {
	if (n && ++n.work > Ve) throw RangeError("Value is too complex to hash safely: structural work");
	if (t === null) e.update(ke);
	else switch (typeof t) {
		case "undefined":
			e.update(Ae);
			return;
		case "boolean":
			e.update(t ? De : Oe);
			return;
		case "number":
			e.update(isNaN(t) ? NaN : t === 0 ? 0 : t);
			return;
		case "bigint":
		case "string":
		case "symbol":
			e.update(t);
			return;
		case "object":
			e.update(Xe(t, n));
			return;
		case "function": e.update(tt(t));
	}
}
function Xe(e, t) {
	let n = We.get(e) ?? t?.pendingHashes.get(e);
	if (n !== void 0) return n;
	if (Ze(e)) return tt(e);
	if (t) {
		if (t.activeObjects.has(e)) throw TypeError("Cannot hash cyclic structural values");
		return qe(e, t);
	}
	let r = {
		activeObjects: /* @__PURE__ */ new Set(),
		work: 0,
		pendingHashes: /* @__PURE__ */ new Map()
	}, i = qe(e, r);
	for (let [e, t] of r.pendingHashes) We.set(e, t);
	return i;
}
function Ze(e) {
	return Ge.has(e) || typeof File < "u" && e instanceof File || Qe(e) && e.byteLength > Ue;
}
function Qe(e) {
	return typeof Buffer < "u" && e instanceof Buffer || e instanceof Uint8Array;
}
function $e(e, t) {
	let n = /* @__PURE__ */ new Map(), r = (e) => Reflect.ownKeys(e).filter((t) => Object.prototype.propertyIsEnumerable.call(e, t));
	function i(e, t) {
		if (e === t || Number.isNaN(e) && Number.isNaN(t)) return !0;
		if (e === null || t === null || typeof e != "object" || typeof t != "object" || Ze(e) || Ze(t) || Array.isArray(e) && Array.isArray(t) && e.length !== t.length) return !1;
		let a = n.get(e);
		if (a?.has(t)) return !0;
		let [o, s, c] = Je(e), [l, u, d] = Je(t);
		if (o !== l || !s.every((e, t) => e === u[t])) return !1;
		if (!c || !d) return !0;
		a ? a.add(t) : n.set(e, /* @__PURE__ */ new Set([t]));
		let f = r(c);
		return f.length === r(d).length && f.every((e) => Object.prototype.propertyIsEnumerable.call(d, e) && i(c[e], d[e]));
	}
	return i(e, t);
}
var et = 1;
function tt(e) {
	let t = We.get(e);
	return t === void 0 && (t = et ^ Me, et++, We.set(e, t), Ge.add(e)), t;
}
var nt = /* @__PURE__ */ new Map([
	[Ie, "["],
	[Fe, "{"],
	[Ne, "<"],
	[Pe, "/"],
	[Le, "&"],
	[Re, "*"],
	[ze, "^"],
	[Be, "?"]
]), rt = 4;
function it(e, t = 0) {
	switch (typeof e) {
		case "number": return `#${e === 0 ? 0 : e}`;
		case "string": return `"${e.length}:${e}`;
		case "boolean": return e ? "+" : "-";
		case "undefined": return "~";
		case "bigint": return `%${e}`;
		case "symbol": return `$${Ce(e)}`;
		case "object": {
			if (e === null) return "!";
			if (t >= rt || Ze(e)) return;
			let [n, r, i] = Je(e), a = nt.get(n);
			for (let e of r) {
				if (Number.isNaN(e)) return;
				a += it(e, t + 1);
			}
			if (!i) return a;
			if (Object.getOwnPropertySymbols(i).some((e) => Object.prototype.propertyIsEnumerable.call(i, e))) return;
			let o = "";
			for (let e of Object.keys(i).sort()) {
				let n = it(i[e], t + 1);
				if (n === void 0) return;
				o += `${e.length}:${e}=${n}|`;
			}
			return `${a}:${o.length}:${o}`;
		}
		default: return;
	}
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/multiset.js
var z = class e {
	#e;
	constructor(e = []) {
		this.#e = e;
	}
	toString(e = !1) {
		return `MultiSet(${JSON.stringify(this.#e, null, e ? 2 : void 0)})`;
	}
	toJSON() {
		return JSON.stringify(Array.from(this.getInner()));
	}
	static fromJSON(t) {
		return new e(JSON.parse(t));
	}
	map(t) {
		return new e(this.#e.map(([e, n]) => [t(e), n]));
	}
	filter(t) {
		return new e(this.#e.filter(([e, n]) => t(e)));
	}
	negate() {
		return new e(this.#e.map(([e, t]) => [e, -t]));
	}
	concat(t) {
		let n = [];
		return ae(n, this.#e), ae(n, t.getInner()), new e(n);
	}
	consolidate() {
		let e = this.#e;
		if (e.every(([e]) => Array.isArray(e) && e.length === 2 && (typeof e[0] == "string" || typeof e[0] == "number"))) {
			let t = /* @__PURE__ */ new Map();
			return at(e, (e) => {
				let [n, r] = e, i;
				if (Array.isArray(r) && r.length === 2) {
					let e = se(r[0], t), n = se(r[1], t);
					i = `tuple_${e.length}:${e}${n}`;
				} else i = `leaf_${se(r, t)}`;
				let a = se(n, t);
				return `${a.length}:${a}${i}`;
			});
		}
		let t;
		return e.some(([e]) => {
			let n = typeof e;
			return n !== "string" && n !== "number" || (t ??= n, n !== t);
		}) ? at(e, R) : at(e, (e) => e, !0);
	}
	extend(t) {
		let n = t instanceof e ? t.getInner() : t;
		ae(this.#e, n);
	}
	add(e, t) {
		t !== 0 && this.#e.push([e, t]);
	}
	getInner() {
		return this.#e;
	}
};
function at(e, t, n = !1) {
	let r = /* @__PURE__ */ new Map();
	for (let [n, i] of e) {
		let e = t(n), a = r.get(e);
		a ? a[1] += i : r.set(e, [n, i]);
	}
	let i = [];
	for (let [e, [t, a]] of r) a !== 0 && i.push([n ? e : t, a]);
	return new z(i);
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/graph.js
var ot = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	drain() {
		let e = [...this.#e].reverse();
		return this.#e.length = 0, e;
	}
	isEmpty() {
		return this.#e.length === 0;
	}
}, st = class {
	#e = [];
	sendData(e) {
		e instanceof z || (e = new z(e));
		for (let t of this.#e) t.unshift(e);
	}
	newReader() {
		let e = [];
		return this.#e.push(e), new ot(e);
	}
}, ct = class {
	constructor(e, t, n) {
		this.id = e, this.inputs = t, this.output = n;
	}
	hasPendingWork() {
		return this.inputs.some((e) => !e.isEmpty());
	}
}, lt = class extends ct {
	constructor(e, t, n) {
		super(e, [t], n), this.id = e;
	}
	inputMessages() {
		return this.inputs[0].drain();
	}
}, ut = class extends ct {
	constructor(e, t, n, r) {
		super(e, [t, n], r), this.id = e;
	}
	inputAMessages() {
		return this.inputs[0].drain();
	}
	inputBMessages() {
		return this.inputs[1].drain();
	}
}, dt = class extends lt {
	run() {
		for (let e of this.inputMessages()) this.output.sendData(this.inner(e));
	}
}, ft = class {
	#e = [];
	#t = 0;
	#n = !1;
	constructor() {}
	#r() {
		if (this.#n) throw Error("Graph already finalized");
	}
	getNextOperatorId() {
		return this.#r(), this.#t++;
	}
	newInput() {
		this.#r();
		let e = new st();
		return new pt(this, e);
	}
	addOperator(e) {
		this.#r(), this.#e.push(e);
	}
	finalize() {
		this.#r(), this.#n = !0;
	}
	step() {
		if (!this.#n) throw Error("Graph not finalized");
		for (let e of this.#e) e.run();
	}
	pendingWork() {
		return this.#e.some((e) => e.hasPendingWork());
	}
	run() {
		if (!this.#n) throw Error("Graph not finalized");
		let e = !0;
		for (; e;) {
			e = !1;
			for (let t of this.#e) t.hasPendingWork() && (t.run(), e = !0);
		}
	}
}, B = class {
	#e;
	#t;
	constructor(e, t) {
		this.#e = e, this.#t = t;
	}
	connectReader() {
		return this.#t.newReader();
	}
	get writer() {
		return this.#t;
	}
	get graph() {
		return this.#e;
	}
	pipe(...e) {
		return e.reduce((e, t) => t(e), this);
	}
}, pt = class extends B {
	sendData(e) {
		this.writer.sendData(e);
	}
}, mt = class extends ut {
	run() {
		for (let e of this.inputAMessages()) this.output.sendData(e);
		for (let e of this.inputBMessages()) this.output.sendData(e);
	}
};
function ht(e) {
	return (t) => {
		if (t.graph !== e.graph) throw Error("Cannot concat streams from different graphs");
		let n = new B(t.graph, new st()), r = new mt(t.graph.getNextOperatorId(), t.connectReader(), e.connectReader(), n.writer);
		return t.graph.addOperator(r), n;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/consolidate.js
var gt = class extends lt {
	run() {
		let e = this.inputMessages();
		if (e.length === 0) return;
		let t = new z();
		for (let n of e) t.extend(n);
		let n = t.consolidate();
		n.getInner().length > 0 && this.output.sendData(n);
	}
};
function _t() {
	return (e) => {
		let t = new B(e.graph, new st()), n = new gt(e.graph.getNextOperatorId(), e.connectReader(), t.writer);
		return e.graph.addOperator(n), t;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/distinct.js
var vt = class extends lt {
	#e;
	#t;
	constructor(e, t, n, r = (e) => e) {
		super(e, t, n), this.#e = r, this.#t = /* @__PURE__ */ new Map();
	}
	run() {
		let e = /* @__PURE__ */ new Map();
		for (let t of this.inputMessages()) for (let [n, r] of t.getInner()) {
			let t = R(this.#e(n)), i = (e.get(t)?.[0] ?? this.#t.get(t) ?? 0) + r;
			e.set(t, [i, n]);
		}
		let t = [];
		for (let [n, [r, i]] of e.entries()) {
			let e = this.#t.get(n) ?? 0;
			r === 0 ? this.#t.delete(n) : this.#t.set(n, r), e <= 0 && r > 0 ? t.push([[R(this.#e(i)), i[1]], 1]) : e > 0 && r <= 0 && t.push([[R(this.#e(i)), i[1]], -1]);
		}
		t.length > 0 && this.output.sendData(new z(t));
	}
};
function yt(e = (e) => e) {
	return (t) => {
		let n = new B(t.graph, new st()), r = new vt(t.graph.getNextOperatorId(), t.connectReader(), n.writer, e);
		return t.graph.addOperator(r), n;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/filter.js
var bt = class extends dt {
	#e;
	constructor(e, t, n, r) {
		super(e, t, n), this.#e = r;
	}
	inner(e) {
		return e.filter(this.#e);
	}
};
function xt(e) {
	return (t) => {
		let n = new B(t.graph, new st()), r = new bt(t.graph.getNextOperatorId(), t.connectReader(), n.writer, e);
		return t.graph.addOperator(r), n;
	};
}
// ../node_modules/.pnpm/fractional-indexing@3.4.0/node_modules/fractional-indexing/src/index.js
var St = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", Ct = /* @__PURE__ */ new Map();
function wt(e) {
	let t = Ct.get(e);
	if (t === void 0) {
		t = /* @__PURE__ */ new Uint8Array(256);
		for (let n = 0; n < e.length; n++) t[e.charCodeAt(n)] = n;
		Ct.set(e, t);
	}
	return t;
}
function Tt(e, t, n, r) {
	let i = n[0];
	if (t != null && e >= t) throw Error(e + " >= " + t);
	if (e.slice(-1) === i || t && t.slice(-1) === i) throw Error("trailing zero");
	if (t) {
		let a = 0;
		for (; (e[a] || i) === t[a];) a++;
		if (a > 0) return t.slice(0, a) + Tt(e.slice(a), t.slice(a), n, r);
	}
	let a = e ? r[e.charCodeAt(0)] : 0, o = t == null ? n.length : r[t.charCodeAt(0)];
	return o - a > 1 ? n[Math.round(.5 * (a + o))] : t && t.length > 1 ? t.slice(0, 1) : n[a] + Tt(e.slice(1), null, n, r);
}
function Et(e, t) {
	if (e.length !== Dt(e[0], t)) throw Error("invalid integer part of order key: " + e);
}
function Dt(e, t) {
	if (t === void 0) {
		let t = e.charCodeAt(0);
		if (t >= 97 && t <= 122) return t - 97 + 2;
		if (t >= 65 && t <= 90) return 90 - t + 2;
	} else {
		let n = t.indexOf(e);
		if (n !== -1) {
			let e = t.length / 2;
			return n < e ? e - n + 1 : n - e + 2;
		}
	}
	throw Error("invalid order key head: " + e);
}
function Ot(e, t) {
	let n = Dt(e[0], t);
	if (n > e.length) throw Error("invalid order key: " + e);
	return e.slice(0, n);
}
function kt(e, t, n) {
	if (Nt(e, t, n)) throw Error("invalid order key: " + e);
	let r = Ot(e, n);
	if (e.slice(r.length).slice(-1) === t[0]) throw Error("invalid order key: " + e);
}
function At(e, t, n, r) {
	Et(e, r);
	let i = e[0], a = t[0], o = "";
	for (let r = e.length - 1; r >= 1; r--) {
		let s = n[e.charCodeAt(r)] + 1;
		if (s === t.length) o = a + o;
		else return i + e.slice(1, r) + t[s] + o;
	}
	if (r === void 0) {
		if (i === "Z") return "a" + a;
		if (i === "z") return null;
		let e = String.fromCharCode(i.charCodeAt(0) + 1);
		return e + (e > "a" ? o + a : o.slice(1));
	}
	let s = r.indexOf(i);
	if (s === r.length - 1) return null;
	let c = r[s + 1], l = Dt(c, r) - Dt(i, r);
	return c + (l > 0 ? o + a : l < 0 ? o.slice(1) : o);
}
function jt(e, t, n, r) {
	Et(e, r);
	let i = e[0], a = t[t.length - 1], o = "";
	for (let r = e.length - 1; r >= 1; r--) {
		let s = n[e.charCodeAt(r)] - 1;
		if (s === -1) o = a + o;
		else return i + e.slice(1, r) + t[s] + o;
	}
	if (r === void 0) {
		if (i === "a") return "Z" + a;
		if (i === "A") return null;
		let e = String.fromCharCode(i.charCodeAt(0) - 1);
		return e + (e < "Z" ? o + a : o.slice(1));
	}
	let s = r.indexOf(i);
	if (s === 0) return null;
	let c = r[s - 1], l = Dt(c, r) - Dt(i, r);
	return c + (l > 0 ? o + a : l < 0 ? o.slice(1) : o);
}
var Mt = /* @__PURE__ */ new Map();
function Nt(e, t, n = "") {
	let r = Mt.get(n);
	r === void 0 && (r = /* @__PURE__ */ new Map(), Mt.set(n, r));
	let i = t.charCodeAt(0), a = r.get(i);
	return a === void 0 && (a = n === "" ? "A" + t[0].repeat(26) : n[0] + t[0].repeat(n.length / 2), r.set(i, a)), e === a;
}
function Pt(e) {
	for (let t = 1; t < e.length; t++) if (e.charCodeAt(t - 1) >= e.charCodeAt(t)) return !1;
	return !0;
}
function Ft(e) {
	for (let t = 0; t < e.length; t++) if (e.charCodeAt(t) > 255) return !1;
	return !0;
}
var It = /* @__PURE__ */ new Set();
function Lt(e) {
	if (!It.has(e)) {
		if (e.length < 2 || !Pt(e)) throw Error("digits must be at least 2 characters in strictly ascending character code order: " + e);
		if (!Ft(e)) throw Error("digits must be single-byte (char code 0-255): " + e);
		It.add(e);
	}
}
var Rt = /* @__PURE__ */ new Set();
function zt(e) {
	if (!Rt.has(e)) {
		if (e.length < 2 || e.length % 2 != 0 || !Pt(e)) throw Error("intDigits must be an even number of at least 2 characters in strictly ascending character code order: " + e);
		if (!Ft(e)) throw Error("intDigits must be single-byte (char code 0-255): " + e);
		Rt.add(e);
	}
}
function Bt(e, t, n = St, r = void 0) {
	Lt(n), r !== void 0 && zt(r);
	let i = wt(n);
	if (e != null && kt(e, n, r), t != null && kt(t, n, r), e != null && t != null && e > t) {
		let n = e;
		e = t, t = n;
	}
	if (e == null) {
		if (t == null) return (r === void 0 ? "a" : r[r.length / 2]) + n[0];
		let e = Ot(t, r), a = t.slice(e.length);
		if (Nt(e, n, r)) return e + Tt("", a, n, i);
		if (e < t) return e;
		let o = jt(e, n, i, r);
		if (o == null) throw Error("cannot decrement any more");
		return o;
	}
	if (t == null) {
		let t = Ot(e, r), a = e.slice(t.length);
		return At(t, n, i, r) ?? t + Tt(a, null, n, i);
	}
	let a = Ot(e, r), o = e.slice(a.length), s = Ot(t, r), c = t.slice(s.length);
	if (a === s) return a + Tt(o, c, n, i);
	let l = At(a, n, i, r);
	if (l == null) throw Error("cannot increment any more");
	return l < t ? l : a + Tt(o, null, n, i);
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/topKArray.js
function Vt(e, t) {
	return [e, t];
}
function Ht(e) {
	return e[0];
}
function Ut(e) {
	return e[1];
}
function Wt(e) {
	return ([t, n], [r, i]) => {
		let a = e(n, i);
		return a === 0 ? le(t, r) : a;
	};
}
var Gt = class {
	#e = [];
	#t;
	#n;
	#r;
	constructor(e, t, n) {
		this.#n = e, this.#r = e + t, this.#t = n;
	}
	get size() {
		let e = this.#n, t = this.#r - this.#n, n = this.#e.length - e;
		return Math.max(0, Math.min(t, n));
	}
	countLeadingInWindow(e) {
		let t = 0, n = this.#n + this.size;
		for (let r = this.#n; r < n && e(Ht(this.#e[r])); r++) t++;
		return t;
	}
	move({ offset: e, limit: t }) {
		let n = this.#n, r = this.#r - this.#n, i = [this.#n, this.#r === Infinity ? this.#n + this.size : this.#r];
		this.#n = e ?? n, this.#r = this.#n + (t ?? r);
		let { onlyInA: a, onlyInB: o } = ce(i, [this.#n, this.#r === Infinity ? Math.max(this.#n + this.size, i[1]) : this.#r]), s = [];
		o.forEach((e) => {
			let t = this.#e[e];
			t && s.push(t);
		});
		let c = [];
		return a.forEach((e) => {
			let t = this.#e[e];
			t && c.push(t);
		}), {
			moveIns: s,
			moveOuts: c,
			changes: a.length + o.length > 0
		};
	}
	insert(e) {
		let t = {
			moveIn: null,
			moveOut: null
		}, n = this.#i(e), r = Vt(e, Bt(n === 0 ? null : Ut(this.#e[n - 1]), n === this.#e.length ? null : Ut(this.#e[n])));
		if (this.#e.splice(n, 0, r), this.#n === this.#r) return t;
		if (n < this.#r) {
			let e = Math.max(n, this.#n);
			e < this.#e.length && (t.moveIn = this.#e[e], this.#r < this.#e.length && (t.moveOut = this.#e[this.#r]));
		}
		return t;
	}
	delete(e) {
		let t = {
			moveIn: null,
			moveOut: null
		}, n = this.#i(e), [r] = this.#e.splice(n, 1);
		if (this.#n === this.#r) return t;
		if (n < this.#r) {
			if (t.moveOut = r, n < this.#n) {
				let e = this.#n - 1;
				t.moveOut = e < this.#e.length ? this.#e[e] : null;
			}
			let e = this.#r - 1;
			e < this.#e.length && (t.moveIn = this.#e[e]);
		}
		return t;
	}
	#i(e) {
		return oe(this.#e, Vt(e, ""), (e, t) => this.#t(Ht(e), Ht(t)));
	}
};
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/topKState.js
function* Kt(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) for (let [e, r] of n.getInner()) {
		let n = t.get(e[0]);
		n ? n.push([e, r]) : t.set(e[0], [[e, r]]);
	}
	let n = [];
	for (let e of t.values()) {
		if (e.length === 1) {
			n.push(e[0]);
			continue;
		}
		let t = [];
		for (let [n, r] of e) {
			let e = t.find(([e]) => $e(e[1], n[1]));
			e ? e[1] += r : t.push([n, r]);
		}
		n.push(...t);
	}
	for (let e of n) e[1] < 0 && (yield e);
	for (let e of n) e[1] > 0 && (yield e);
}
var qt = class {
	#e = /* @__PURE__ */ new Map();
	#t;
	constructor(e) {
		this.#t = e;
	}
	get size() {
		return this.#t.size;
	}
	countLeadingInWindow(e) {
		return this.#t.countLeadingInWindow?.(([, t]) => e(t)) ?? this.#t.size;
	}
	get isEmpty() {
		return this.#e.size === 0 && this.#t.size === 0;
	}
	processElement(e, t, n) {
		let { oldMultiplicity: r, newMultiplicity: i } = this.#n(e, n);
		return r <= 0 && i > 0 ? this.#t.insert([e, t]) : r > 0 && i <= 0 ? this.#t.delete([e, t]) : {
			moveIn: null,
			moveOut: null
		};
	}
	move(e) {
		if (!(this.#t instanceof Gt)) throw Error("Cannot move B+-tree implementation of TopK with fractional index");
		return this.#t.move(e);
	}
	#n(e, t) {
		if (t === 0) {
			let t = this.#e.get(e) ?? 0;
			return {
				oldMultiplicity: t,
				newMultiplicity: t
			};
		}
		let n = this.#e.get(e) ?? 0, r = n + t;
		return r === 0 ? this.#e.delete(e) : this.#e.set(e, r), {
			oldMultiplicity: n,
			newMultiplicity: r
		};
	}
};
function Jt(e, t) {
	if (e) {
		let [[n, r], i] = e;
		t.push([[n, [r, i]], 1]);
	}
}
function Yt(e, t) {
	if (e) {
		let [[n, r], i] = e;
		t.push([[n, [r, i]], -1]);
	}
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/groupedTopKWithFractionalIndex.js
var Xt = class extends lt {
	#e = /* @__PURE__ */ new Map();
	#t;
	#n;
	#r;
	#i;
	constructor(e, t, n, r, i) {
		super(e, t, n), this.#t = i.groupKeyFn, this.#i = i.limit ?? Infinity, this.#r = i.offset ?? 0, this.#n = Wt(r), i.setSizeCallback?.(() => this.#a()), i.setWindowFn?.(this.#c.bind(this));
	}
	#a() {
		let e = 0;
		for (let t of this.#e.values()) e += t.size;
		return e;
	}
	#o(e) {
		let t = this.#e.get(e);
		return t || (t = new qt(new Gt(this.#r, this.#i, this.#n)), this.#e.set(e, t)), t;
	}
	#s(e, t) {
		t.isEmpty && this.#e.delete(e);
	}
	#c({ offset: e, limit: t }) {
		e !== void 0 && (this.#r = e), t !== void 0 && (this.#i = t);
		let n = [], r = !1;
		for (let e of this.#e.values()) {
			let t = e.move({
				offset: this.#r,
				limit: this.#i
			});
			t.moveIns.forEach((e) => Jt(e, n)), t.moveOuts.forEach((e) => Yt(e, n)), t.changes && (r = !0);
		}
		r && this.output.sendData(new z(n));
	}
	run() {
		let e = [];
		for (let [[t, n], r] of Kt(this.inputMessages())) this.#l(t, n, r, e);
		e.length > 0 && this.output.sendData(new z(e));
	}
	#l(e, t, n, r) {
		let i = this.#t(e, t), a = this.#o(i), o = a.processElement(e, t, n);
		Jt(o.moveIn, r), Yt(o.moveOut, r), this.#s(i, a);
	}
};
function Zt(e, t) {
	return (n) => {
		let r = new B(n.graph, new st()), i = new Xt(n.graph.getNextOperatorId(), n.connectReader(), r.writer, e, t);
		return n.graph.addOperator(i), r;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/indexes.js
var Qt = /* @__PURE__ */ Symbol("NO_PREFIX"), $t = class extends Map {
	addValue(e, t, n = !1) {
		if (t === 0) return this.size === 0;
		let r = rn(e), i = this.get(r);
		if (an(i)) {
			let [a, o] = i;
			if (!nn(rn(a), r)) throw Error("Mismatching prefixes, this should never happen");
			if (a === e || n && r !== Qt || R(a) === R(e)) {
				let n = o + t;
				n === 0 ? this.delete(r) : this.set(r, [e, n]);
			} else {
				let n = new en();
				n.set(R(a), i), n.set(R(e), [e, t]), this.set(r, n);
			}
		} else i === void 0 ? this.set(r, [e, t]) : i.addValue(e, t) && this.delete(r);
		return this.size === 0;
	}
}, en = class extends Map {
	addValue(e, t) {
		if (t === 0) return this.size === 0;
		let n = R(e), r = this.get(n);
		if (r) {
			let [, i] = r, a = i + t;
			a === 0 ? this.delete(n) : this.set(n, [e, a]);
		} else this.set(n, [e, t]);
		return this.size === 0;
	}
}, tn = class e {
	#e;
	#t;
	#n;
	constructor(e) {
		this.#e = /* @__PURE__ */ new Map(), (e?.trackPresence ?? !0) && (this.#t = /* @__PURE__ */ new Map()), this.#n = e?.prefixIdentity ?? !1;
	}
	static fromMultiSets(t) {
		let n = new e();
		for (let e of t) for (let [t, r] of e.getInner()) {
			let [e, i] = t;
			n.addValue(e, [i, r]);
		}
		return n;
	}
	toString(e = !1) {
		return `Index(${JSON.stringify([...this.entries()], void 0, e ? 2 : void 0)})`;
	}
	get size() {
		return this.#e.size;
	}
	#r() {
		if (this.#t === void 0) throw Error("This Index does not track presence");
		return this.#t;
	}
	has(e) {
		return this.#e.has(e);
	}
	hasPresence(e) {
		return (this.#r().get(e) || 0) !== 0;
	}
	getConsolidatedMultiplicity(e) {
		return this.#r().get(e) || 0;
	}
	getPresenceKeys() {
		return this.#r().keys();
	}
	get(e) {
		let t = this.#e.get(e);
		if (t === void 0) return [];
		if (an(t)) return [t];
		if (t instanceof en) return [...t.values()];
		let n = [];
		for (let e of t.values()) if (an(e)) n.push(e);
		else for (let t of e.values()) n.push(t);
		return n;
	}
	*getIterator(e) {
		let t = this.#e.get(e);
		if (an(t)) yield t;
		else if (t === void 0) return;
		else if (t instanceof en) for (let e of t.values()) yield e;
		else for (let e of t.values()) if (an(e)) yield e;
		else for (let t of e.values()) yield t;
	}
	*entries() {
		for (let e of this.#e.keys()) for (let t of this.getIterator(e)) yield [e, t];
	}
	*entriesIterators() {
		for (let e of this.#e.keys()) yield [e, this.getIterator(e)];
	}
	addValue(e, t) {
		let [n, r] = t;
		if (r === 0) return;
		let i = this.#t;
		if (i) {
			let t = (i.get(e) || 0) + r;
			t === 0 ? i.delete(e) : i.set(e, t);
		}
		let a = this.#e.get(e);
		if (a === void 0) this.#e.set(e, t);
		else if (an(a)) this.#i(e, a, n, r);
		else if (a instanceof en) {
			let i = rn(n);
			if (i !== Qt) {
				let n = new $t();
				n.set(Qt, a), n.set(i, t), this.#e.set(e, n);
			} else a.addValue(n, r) && this.#e.delete(e);
		} else a.addValue(n, r, this.#n) && this.#e.delete(e);
	}
	#i(e, t, n, r) {
		let [i, a] = t;
		if (i === n) {
			let t = a + r;
			t === 0 ? this.#e.delete(e) : this.#e.set(e, [n, t]);
			return;
		}
		let o = rn(n), s = rn(i);
		if (nn(s, o) && (this.#n && o !== Qt || R(i) === R(n))) {
			let t = a + r;
			t === 0 ? this.#e.delete(e) : this.#e.set(e, [n, t]);
		} else if (s === Qt && o === Qt) {
			let a = new en();
			a.set(R(i), t), a.set(R(n), [n, r]), this.#e.set(e, a);
		} else {
			let a = new $t();
			if (nn(s, o)) {
				let e = new en();
				e.set(R(i), t), e.set(R(n), [n, r]), a.set(s, e);
			} else a.set(s, t), a.set(o, [n, r]);
			this.#e.set(e, a);
		}
	}
	append(e) {
		for (let [t, n] of e.entries()) this.addValue(t, n);
	}
	join(e) {
		let t = [];
		if (this.size <= e.size) for (let [n, r] of this.entriesIterators()) {
			if (!e.has(n)) continue;
			let i = e.get(n);
			for (let [e, a] of r) for (let [r, o] of i) a !== 0 && o !== 0 && t.push([[n, [e, r]], a * o]);
		}
		else for (let [n, r] of e.entriesIterators()) {
			if (!this.has(n)) continue;
			let e = this.get(n);
			for (let [i, a] of r) for (let [r, o] of e) o !== 0 && a !== 0 && t.push([[n, [r, i]], o * a]);
		}
		return new z(t);
	}
};
function nn(e, t) {
	return e === t || Number.isNaN(e) && Number.isNaN(t);
}
function rn(e) {
	return Array.isArray(e) && (typeof e[0] == "string" || typeof e[0] == "number" || typeof e[0] == "bigint") ? e[0] : Qt;
}
function an(e) {
	return Array.isArray(e);
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/join.js
var on = class extends ut {
	#e = new tn();
	#t = new tn();
	#n;
	constructor(e, t, n, r, i = "inner") {
		super(e, t, n, r), this.#n = i;
	}
	run() {
		let e = tn.fromMultiSets(this.inputAMessages()), t = tn.fromMultiSets(this.inputBMessages());
		if (e.size === 0 && t.size === 0) return;
		let n = new z();
		this.#n !== "anti" && this.emitInnerResults(e, t, n), (this.#n === "left" || this.#n === "full" || this.#n === "anti") && this.emitLeftOuterResults(e, t, n), (this.#n === "right" || this.#n === "full") && this.emitRightOuterResults(e, t, n), this.#e.append(e), this.#t.append(t), n.getInner().length > 0 && this.output.sendData(n);
	}
	emitInnerResults(e, t, n) {
		e.size > 0 && n.extend(e.join(this.#t)), t.size > 0 && n.extend(this.#e.join(t)), e.size > 0 && t.size > 0 && n.extend(e.join(t));
	}
	emitLeftOuterResults(e, t, n) {
		if (e.size > 0) {
			for (let [r, i] of e.entriesIterators()) if (this.#t.getConsolidatedMultiplicity(r) + t.getConsolidatedMultiplicity(r) === 0) for (let [e, t] of i) t !== 0 && n.add([r, [e, null]], t);
		}
		if (t.size > 0) for (let e of t.getPresenceKeys()) {
			let r = this.#t.getConsolidatedMultiplicity(e), i = t.getConsolidatedMultiplicity(e);
			if (i === 0) continue;
			let a = r + i;
			if (r === 0 == (a === 0)) continue;
			let o = r === 0;
			for (let [t, r] of this.#e.getIterator(e)) r !== 0 && n.add([e, [t, null]], o ? -r : +r);
		}
	}
	emitRightOuterResults(e, t, n) {
		if (t.size > 0) {
			for (let [r, i] of t.entriesIterators()) if (this.#e.getConsolidatedMultiplicity(r) + e.getConsolidatedMultiplicity(r) === 0) for (let [e, t] of i) t !== 0 && n.add([r, [null, e]], t);
		}
		if (e.size > 0) for (let t of e.getPresenceKeys()) {
			let r = this.#e.getConsolidatedMultiplicity(t), i = e.getConsolidatedMultiplicity(t);
			if (i === 0) continue;
			let a = r + i;
			if (r === 0 == (a === 0)) continue;
			let o = r === 0;
			for (let [e, r] of this.#t.getIterator(t)) r !== 0 && n.add([t, [null, e]], o ? -r : +r);
		}
	}
};
function sn(e, t = "inner") {
	return (n) => {
		if (n.graph !== e.graph) throw Error("Cannot join streams from different graphs");
		let r = new B(n.graph, new st()), i = new on(n.graph.getNextOperatorId(), n.connectReader(), e.connectReader(), r.writer, t);
		return n.graph.addOperator(i), r;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/map.js
var cn = class extends dt {
	#e;
	constructor(e, t, n, r) {
		super(e, t, n), this.#e = r;
	}
	inner(e) {
		return e.map(this.#e);
	}
};
function V(e) {
	return (t) => {
		let n = new B(t.graph, new st()), r = new cn(t.graph.getNextOperatorId(), t.connectReader(), n.writer, e);
		return t.graph.addOperator(r), n;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/output.js
var ln = class extends lt {
	#e;
	constructor(e, t, n, r) {
		super(e, t, n), this.#e = r;
	}
	run() {
		for (let e of this.inputMessages()) this.#e(e), this.output.sendData(e);
	}
};
function un(e) {
	return (t) => {
		let n = new B(t.graph, new st()), r = new ln(t.graph.getNextOperatorId(), t.connectReader(), n.writer, e);
		return t.graph.addOperator(r), n;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/reduce.js
function dn(e, t) {
	return e === t || e !== e && t !== t;
}
function fn(e) {
	return e === 0 ? 0 : e;
}
var pn = class extends lt {
	#e;
	#t = new tn({ trackPresence: !1 });
	#n;
	constructor(e, t, n, r, i) {
		super(e, t, n), this.#e = new tn({
			...i,
			trackPresence: !1
		}), this.#n = r;
	}
	run() {
		let e = /* @__PURE__ */ new Set();
		for (let t of this.inputMessages()) for (let [n, r] of t.getInner()) {
			let [t, i] = n;
			this.#e.addValue(t, [i, r]), e.add(t);
		}
		let t = [];
		for (let n of e) {
			let e = this.#e.get(n), r = this.#t.get(n), i = this.#n(e);
			if (i.length <= 1 && r.length <= 1) {
				let e = r[0], a = i[0], o = a === void 0 ? void 0 : fn(a[0]);
				if (e !== void 0 && a !== void 0 && dn(e[0], o)) {
					let r = a[1] - e[1];
					r !== 0 && (t.push([[n, e[0]], r]), this.#t.addValue(n, [e[0], r]));
					continue;
				}
				e !== void 0 && (t.push([[n, e[0]], -e[1]]), this.#t.addValue(n, [e[0], -e[1]])), a !== void 0 && a[1] !== 0 && (t.push([[n, o], a[1]]), this.#t.addValue(n, [o, a[1]]));
				continue;
			}
			let a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
			for (let [e, t] of i) {
				let n = a.get(e) ?? 0;
				a.set(e, n + t);
			}
			for (let [e, t] of r) {
				let n = o.get(e) ?? 0;
				o.set(e, n + t);
			}
			for (let [e, r] of o) a.has(e) || (t.push([[n, e], -r]), this.#t.addValue(n, [e, -r]));
			for (let [e, r] of a) o.has(e) || r !== 0 && (t.push([[n, e], r]), this.#t.addValue(n, [e, r]));
			for (let [e, r] of a) {
				let i = o.get(e);
				if (i !== void 0) {
					let a = r - i;
					a !== 0 && (t.push([[n, e], a]), this.#t.addValue(n, [e, a]));
				}
			}
		}
		t.length > 0 && this.output.sendData(new z(t));
	}
};
function mn(e, t) {
	return (n) => {
		let r = new B(n.graph, new st()), i = new pn(n.graph.getNextOperatorId(), n.connectReader(), r.writer, e, t);
		return n.graph.addOperator(i), r;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/tap.js
var hn = class extends dt {
	#e;
	constructor(e, t, n, r) {
		super(e, t, n), this.#e = r;
	}
	inner(e) {
		return this.#e(e), e;
	}
};
function gn(e) {
	return (t) => {
		let n = new B(t.graph, new st()), r = new hn(t.graph.getNextOperatorId(), t.connectReader(), n.writer, e);
		return t.graph.addOperator(r), n;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/topKWithFractionalIndex.js
var _n = class extends lt {
	#e;
	constructor(e, t, n, r, i) {
		super(e, t, n);
		let a = i.limit ?? Infinity, o = i.offset ?? 0;
		this.#e = new qt(new Gt(o, a, Wt(r))), i.setSizeCallback?.((e) => e ? this.#e.countLeadingInWindow(e) : this.#e.size), i.setWindowFn?.(this.moveTopK.bind(this));
	}
	moveTopK({ offset: e, limit: t }) {
		let n = [], r = this.#e.move({
			offset: e,
			limit: t
		});
		r.moveIns.forEach((e) => Jt(e, n)), r.moveOuts.forEach((e) => Yt(e, n)), r.changes && this.output.sendData(new z(n));
	}
	run() {
		let e = [];
		for (let [[t, n], r] of Kt(this.inputMessages())) this.processElement(t, n, r, e);
		e.length > 0 && this.output.sendData(new z(e));
	}
	processElement(e, t, n, r) {
		let i = this.#e.processElement(e, t, n);
		Jt(i.moveIn, r), Yt(i.moveOut, r);
	}
};
function vn(e, t) {
	let n = t || {};
	return (t) => {
		let r = new B(t.graph, new st()), i = new _n(t.graph.getNextOperatorId(), t.connectReader(), r.writer, e, n);
		return t.graph.addOperator(i), r;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/groupBy.js
function yn(e, t = {}) {
	return (n) => {
		let r = /* @__PURE__ */ Symbol("original_group_key"), i = Object.entries(t);
		return n.pipe(V((t) => {
			let n = e(t), a = I(n), o = {};
			o[r] = n;
			let s = it(n) ?? null;
			for (let [e, n] of i) {
				let r = n.preMap(t);
				if (o[e] = r, s === null) continue;
				let i = it(r);
				s = i === void 0 ? null : `${s}|${i}`;
			}
			return [a, [s, o]];
		})).pipe(mn((e) => {
			let t = 0;
			for (let [n, r] of e) t += r;
			if (t <= 0) return [];
			let n = {}, a = e[0]?.[0][1][r];
			n[r] = a;
			for (let [t, r] of i) {
				let i = e.map(([[, e], n]) => [e[t], n]);
				n[t] = r.reduce(i);
			}
			return [[n, 1]];
		}, { prefixIdentity: !0 })).pipe(V(([e, t]) => {
			let n = t[r], a = {};
			Object.assign(a, n);
			for (let [e, n] of i) a[e] = n.postMap ? n.postMap(t[e]) : t[e];
			return [e, a];
		}));
	};
}
function bn(e = (e) => e) {
	return {
		preMap: (t) => e(t),
		reduce: (e) => {
			let t = 0;
			for (let [n, r] of e) t += n * r;
			return t;
		}
	};
}
function xn(e = (e) => e) {
	return {
		preMap: (t) => e(t) == null ? 0 : 1,
		reduce: (e) => {
			let t = 0;
			for (let [n, r] of e) t += n * r;
			return t;
		}
	};
}
function Sn(e = (e) => e) {
	return {
		preMap: (t) => ({
			sum: e(t),
			count: 0
		}),
		reduce: (e) => {
			let t = 0, n = 0;
			for (let [r, i] of e) t += r.sum * i, n += i;
			return {
				sum: t,
				count: n
			};
		},
		postMap: (e) => e.sum / e.count
	};
}
function Cn(e) {
	let t = e ?? ((e) => e);
	return {
		preMap: (e) => t(e),
		reduce: (e) => {
			let t;
			for (let [n, r] of e) n !== void 0 && (t === void 0 || n < t) && (t = n);
			return t;
		}
	};
}
function wn(e) {
	let t = e ?? ((e) => e);
	return {
		preMap: (e) => t(e),
		reduce: (e) => {
			let t;
			for (let [n, r] of e) n !== void 0 && (t === void 0 || n > t) && (t = n);
			return t;
		}
	};
}
function Tn(e = (e) => e) {
	return {
		preMap: (t) => [e(t)],
		reduce: (e) => {
			let t = [];
			for (let [n, r] of e) for (let e of n) for (let n = 0; n < r; n++) t.push(e);
			return t.length === 0 ? [] : (t.sort((e, t) => e - t), t);
		},
		postMap: (e) => {
			if (e.length === 0) return 0;
			let t = Math.floor(e.length / 2);
			return e.length % 2 == 0 ? (e[t - 1] + e[t]) / 2 : e[t];
		}
	};
}
function En(e = (e) => e) {
	return {
		preMap: (t) => {
			let n = e(t), r = /* @__PURE__ */ new Map();
			return r.set(n, 1), r;
		},
		reduce: (e) => {
			let t = /* @__PURE__ */ new Map();
			for (let [n, r] of e) for (let [e, i] of n.entries()) {
				let n = t.get(e) || 0;
				t.set(e, n + i * r);
			}
			return t;
		},
		postMap: (e) => {
			if (e.size === 0) return 0;
			let t = 0, n = 0;
			for (let [r, i] of e.entries()) i > n && (n = i, t = r);
			return t;
		}
	};
}
var Dn = {
	sum: bn,
	count: xn,
	avg: Sn,
	min: Cn,
	max: wn,
	median: Tn,
	mode: En
};
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/groupedOrderBy.js
function On(e, t) {
	let n = t.limit ?? Infinity, r = t.offset ?? 0, i = t.setSizeCallback, a = t.setWindowFn, o = t.groupKeyFn, s = t.comparator ?? ((e, t) => e === t ? 0 : e < t ? -1 : 1);
	return (t) => t.pipe(Zt((t, n) => s(e(t), e(n)), {
		limit: n,
		offset: r,
		setSizeCallback: i,
		setWindowFn: a,
		groupKeyFn: o
	}), _t());
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/orderBy.js
function kn(e, t) {
	let n = t?.limit ?? Infinity, r = t?.offset ?? 0, i = t?.setSizeCallback, a = t?.setWindowFn, o = t?.comparator ?? ((e, t) => e === t ? 0 : e < t ? -1 : 1);
	return (t) => t.pipe(vn((t, n) => o(e(t), e(n)), {
		limit: n,
		offset: r,
		setSizeCallback: i,
		setWindowFn: a
	}), _t());
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/uuid.js
function An() {
	let e = typeof globalThis < "u" ? globalThis.crypto : void 0;
	if (e && typeof e.randomUUID == "function") return e.randomUUID();
	if (e && typeof e.getRandomValues == "function") {
		let t = e.getRandomValues(/* @__PURE__ */ new Uint8Array(16));
		t[6] = t[6] & 15 | 64, t[8] = t[8] & 63 | 128;
		let n = [];
		for (let e = 0; e < 16; e++) n.push(t[e].toString(16).padStart(2, "0"));
		return n.slice(0, 4).join("") + "-" + n.slice(4, 6).join("") + "-" + n.slice(6, 8).join("") + "-" + n.slice(8, 10).join("") + "-" + n.slice(10, 16).join("");
	}
	throw Error(n(171));
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/collection-options-brand.js
var jn = /* @__PURE__ */ Symbol.for("@tanstack/db.collectionOptions");
function Mn(e) {
	return typeof e == "object" && !!e && e[jn] === !0;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/collection-options.js
var Nn = /* @__PURE__ */ Symbol.for("@tanstack/db.collectionOptions.claim");
function Pn(e) {
	return Mn(e);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/errors.js
var H = class extends Error {
	constructor(e) {
		super(e), this.name = "TanStackDBError";
	}
}, Fn = class extends H {
	constructor(e, t, n) {
		let r = `${e === "insert" ? "Insert" : "Update"} validation failed: ${t.map((e) => `
- ${e.message} - path: ${e.path}`).join("")}`;
		super(n || r), this.name = "SchemaValidationError", this.type = e, this.issues = t;
	}
}, In = class extends H {
	constructor(e) {
		super(e), this.name = "CollectionConfigurationError";
	}
}, Ln = class extends In {
	constructor() {
		super(n(4));
	}
}, Rn = class extends In {
	constructor() {
		super(n(5));
	}
}, zn = class extends In {
	constructor() {
		super(n(6));
	}
}, Bn = class extends In {
	constructor() {
		super(n(7));
	}
}, Vn = class extends H {
	constructor(e) {
		super(e), this.name = "CollectionStateError";
	}
}, Hn = class extends Vn {
	constructor(e, t) {
		super(n(8, {
			operation: e,
			collectionId: t
		}));
	}
}, Un = class extends Vn {
	constructor(e, t, r) {
		super(n(9, {
			from: e,
			to: t,
			collectionId: r
		}));
	}
}, Wn = class extends Vn {
	constructor() {
		super(n(10));
	}
}, Gn = class extends Vn {
	constructor() {
		super(n(11));
	}
}, Kn = class extends H {
	constructor(e) {
		super(e), this.name = "CollectionOperationError";
	}
}, qn = class extends Kn {
	constructor(e) {
		super(n(14, { item: e }));
	}
}, Jn = class extends Kn {
	constructor(e, t) {
		super(n(15, {
			key: e,
			type: e === null ? "null" : typeof e
		}));
	}
}, Yn = class extends Kn {
	constructor(e) {
		super(n(16, { key: e }));
	}
}, Xn = class extends Kn {
	constructor(e, t, r) {
		super(n(17, {
			key: e,
			collectionId: t,
			...r
		}));
	}
}, Zn = class extends Kn {
	constructor() {
		super(n(18));
	}
}, Qn = class extends Kn {
	constructor() {
		super(n(19));
	}
}, $n = class extends Kn {
	constructor(e) {
		super(n(20, { key: e }));
	}
}, er = class extends Kn {
	constructor(e, t) {
		super(n(21, {
			originalKey: e,
			newKey: t
		}));
	}
}, tr = class extends Kn {
	constructor() {
		super(n(22));
	}
}, nr = class extends Kn {
	constructor(e) {
		super(n(23, { key: e }));
	}
}, rr = class extends H {
	constructor(e) {
		super(e), this.name = "MissingHandlerError";
	}
}, ir = class extends rr {
	constructor() {
		super(n(24));
	}
}, ar = class extends rr {
	constructor() {
		super(n(25));
	}
}, or = class extends rr {
	constructor() {
		super(n(26));
	}
}, sr = class extends H {
	constructor(e) {
		super(e), this.name = "TransactionError";
	}
}, cr = class extends sr {
	constructor() {
		super(n(31));
	}
}, lr = class extends sr {
	constructor() {
		super(n(33));
	}
}, ur = class extends sr {
	constructor() {
		super(n(34));
	}
}, dr = class extends sr {
	constructor(e) {
		super(n(233, { id: e }));
	}
}, fr = class extends sr {
	constructor() {
		super(n(35));
	}
}, pr = class extends sr {
	constructor() {
		super(n(36));
	}
}, mr = class extends sr {
	constructor() {
		super(n(37));
	}
}, hr = class extends sr {
	constructor(e) {
		super(n(38, { key: e }));
	}
}, gr = class extends sr {
	constructor() {
		super(n(39));
	}
}, _r = class extends sr {
	constructor() {
		super(n(40));
	}
}, vr = class extends sr {
	constructor(e) {
		super(n(41, { detail: e }));
	}
}, yr = class extends H {
	constructor(e) {
		super(e), this.name = "QueryBuilderError";
	}
}, br = class extends yr {
	constructor(e) {
		super(n(42, { context: e }));
	}
}, xr = class extends yr {
	constructor(e) {
		super(n(43, { context: e }));
	}
}, Sr = class extends yr {
	constructor(e) {
		super(n(44, { alias: e }));
	}
}, Cr = class extends yr {
	constructor(e, t) {
		super(n(45, {
			context: e,
			type: t
		}));
	}
}, wr = class extends yr {
	constructor() {
		super(n(46));
	}
}, Tr = class extends yr {
	constructor() {
		super(n(47));
	}
}, Er = class extends yr {
	constructor(e) {
		super(n(48, { valueType: e }));
	}
}, U = class extends H {
	constructor(e) {
		super(e), this.name = "QueryCompilationError";
	}
}, Dr = class extends U {
	constructor(e) {
		super(n(49, { segment: e })), this.name = "UnsafeAliasPathError";
	}
}, Or = class extends U {
	constructor() {
		super(n(50));
	}
}, kr = class extends U {
	constructor() {
		super(n(51));
	}
}, Ar = class extends U {
	constructor(e) {
		super(n(52, { valueDescription: e }));
	}
}, jr = class extends U {
	constructor() {
		super(n(53));
	}
}, Mr = class extends U {
	constructor() {
		super(n(54));
	}
}, Nr = class extends U {
	constructor() {
		super(n(55));
	}
}, Pr = class extends U {
	constructor(e, t, r) {
		super(n(56, {
			alias: e,
			collectionId: t,
			availableKeys: r
		}));
	}
}, Fr = class extends U {
	constructor(e) {
		super(n(58, { type: e }));
	}
}, Ir = class extends U {
	constructor(e) {
		super(n(59, { type: e }));
	}
}, Lr = class extends U {
	constructor() {
		super(n(60));
	}
}, Rr = class extends U {
	constructor(e) {
		super(n(61, { functionName: e }));
	}
}, zr = class extends U {
	constructor(e) {
		super(n(62, { collectionId: e }));
	}
}, Br = class extends H {
	constructor(e) {
		super(e), this.name = "JoinError";
	}
}, Vr = class extends Br {
	constructor(e) {
		super(n(63, { joinType: e }));
	}
}, Hr = class extends Br {
	constructor(e) {
		super(n(64, { sourceAlias: e }));
	}
}, Ur = class extends Br {
	constructor() {
		super(n(65));
	}
}, Wr = class extends Br {
	constructor(e) {
		super(n(66, { sourceAlias: e }));
	}
}, Gr = class extends Br {
	constructor(e) {
		super(n(67, { sourceAlias: e }));
	}
}, Kr = class extends Br {
	constructor() {
		super(n(68));
	}
}, qr = class extends Br {
	constructor(e) {
		super(n(69, { type: e }));
	}
}, Jr = class extends H {
	constructor(e) {
		super(e), this.name = "GroupByError";
	}
}, Yr = class extends Jr {
	constructor(e) {
		super(n(70, { alias: e }));
	}
}, Xr = class extends Jr {
	constructor(e) {
		super(n(71, { functionName: e }));
	}
}, Zr = class extends Jr {
	constructor(e) {
		super(n(72, { functionName: e }));
	}
}, Qr = class extends Jr {
	constructor(e) {
		super(n(73, { type: e }));
	}
}, $r = class extends H {
	constructor(e, t) {
		super(n(78, {
			collectionId: e,
			error: t
		})), this.name = "SyncCleanupError";
	}
}, ei = class extends Error {
	constructor() {
		super(n(79)), this.name = "AbortError";
	}
}, ti = class extends Error {
	constructor() {
		super(n(80)), this.name = "AbortError";
	}
}, ni = class extends Error {
	constructor() {
		super(n(81)), this.name = "AbortError";
	}
}, ri = class extends H {
	constructor(e) {
		super(e), this.name = "QueryOptimizerError";
	}
}, ii = class extends ri {
	constructor() {
		super(n(82));
	}
}, ai = class extends U {
	constructor(e) {
		super(n(83, { missingAliases: e }));
	}
}, oi = class extends U {
	constructor() {
		super(n(84));
	}
}, si = class extends U {
	constructor() {
		super(n(244));
	}
}, ci = class extends H {
	constructor() {
		super(n(85)), this.name = "SetWindowReentrancyError";
	}
}, li = class extends Error {
	constructor(e, t) {
		super(n(87, {
			path: e,
			reason: t
		})), this.path = e, this.reason = t, this.name = "UnhashableQueryIRError";
	}
}, ui = [
	"years",
	"months",
	"weeks",
	"days",
	"hours",
	"minutes",
	"seconds",
	"milliseconds",
	"microseconds",
	"nanoseconds"
];
function W(e, t) {
	return pi(e, t, void 0);
}
function di(e) {
	return e === null || Object.getPrototypeOf(e) === null;
}
function fi(e) {
	let t = Object.keys(e);
	for (let n of Object.getOwnPropertySymbols(e)) Object.prototype.propertyIsEnumerable.call(e, n) && t.push(n);
	return t;
}
function pi(e, t, n, r = !1, i = !1) {
	if (e === t || Object.is(e, t)) return !0;
	if (e == null || t == null || typeof e != typeof t || i && typeof e == "object" && Object.getPrototypeOf(e) !== Object.getPrototypeOf(t)) return !1;
	if (e instanceof Date) return t instanceof Date && Object.is(e.getTime(), t.getTime());
	if (t instanceof Date) return !1;
	if (e instanceof RegExp) return t instanceof RegExp && e.source === t.source && e.flags === t.flags && (!r || e.lastIndex === t.lastIndex);
	if (t instanceof RegExp) return !1;
	if (e instanceof Map) {
		if (!(t instanceof Map) || e.size !== t.size) return !1;
		if (n?.has(e)) return n.get(e) === t;
		n ??= /* @__PURE__ */ new Map(), n.set(e, t);
		let a = r && Array.from(t.entries()), o = Array.from(e.entries()).every(([e, o], s) => a ? Object.is(e, a[s][0]) && pi(o, a[s][1], n, !0, i) : t.has(e) && pi(o, t.get(e), n, r, i));
		return n.delete(e), o;
	}
	if (t instanceof Map) return !1;
	if (e instanceof Set) {
		if (!(t instanceof Set) || e.size !== t.size) return !1;
		if (n?.has(e)) return n.get(e) === t;
		n ??= /* @__PURE__ */ new Map(), n.set(e, t);
		let a = Array.from(e), o = Array.from(t);
		if (r) {
			let t = a.every((e, t) => pi(e, o[t], n, r, i));
			return n.delete(e), t;
		}
		if (a.every((e) => typeof e != "object")) return n.delete(e), a.every((e) => t.has(e));
		let s = (e, t, n) => {
			if (e === a.length) return !0;
			let c = a[e];
			for (let [a, l] of t.entries()) {
				let u = new Map(n);
				if (pi(c, o[l], u, r, i) && s(e + 1, t.filter((e, t) => t !== a), u)) return !0;
			}
			return !1;
		}, c = s(0, o.map((e, t) => t), n);
		return n.delete(e), c;
	}
	if (t instanceof Set) return !1;
	if (ArrayBuffer.isView(e) && ArrayBuffer.isView(t) && !(e instanceof DataView) && !(t instanceof DataView)) {
		let n = e, i = t;
		if (r && Object.getPrototypeOf(e) !== Object.getPrototypeOf(t) || n.length !== i.length) return !1;
		for (let e = 0; e < n.length; e++) {
			let t = n[e], r = i[e];
			if (t !== r && (t === t || r === r)) return !1;
		}
		return !0;
	}
	if (ArrayBuffer.isView(t) && !(t instanceof DataView) && !ArrayBuffer.isView(e)) return !1;
	if (G(e) && G(t)) {
		let n = e[Symbol.toStringTag];
		if (n !== t[Symbol.toStringTag]) return !1;
		if (n === "Temporal.Duration") {
			let n = e, r = t;
			return ui.every((e) => n[e] === r[e]);
		}
		return typeof e.equals == "function" ? e.equals(t) : e.toString() === t.toString();
	}
	if (G(t) || Array.isArray(e) !== Array.isArray(t) || Array.isArray(e) && e.length !== t.length) return !1;
	if (Array.isArray(e) && !r) {
		if (n?.has(e)) return n.get(e) === t;
		n ??= /* @__PURE__ */ new Map(), n.set(e, t);
		let a = e.every((e, a) => pi(e, t[a], n, r, i));
		return n.delete(e), a;
	}
	if (typeof e == "object") {
		let a = Object.getPrototypeOf(e), o = Object.getPrototypeOf(t), s = di(a), c = di(o);
		if (a !== o && !s && !c) return !1;
		if (n?.has(e)) return n.get(e) === t;
		let l = fi(e), u = fi(t);
		if (l.length !== u.length) return !1;
		if (l.length === 0 && !Array.isArray(e) && !(s && c)) return e instanceof URL && e.href === t.href;
		let d = !1, f = !0;
		for (let a of l) {
			let o = e[a];
			if (!d && typeof o == "object" && o && (n ??= /* @__PURE__ */ new Map(), n.set(e, t), d = !0), !Object.prototype.propertyIsEnumerable.call(t, a) || !pi(o, t[a], n, r, i)) {
				f = !1;
				break;
			}
		}
		return d && n.delete(e), f;
	}
	return !1;
}
var mi = /* @__PURE__ */ new Set([
	"Temporal.Duration",
	"Temporal.Instant",
	"Temporal.PlainDate",
	"Temporal.PlainDateTime",
	"Temporal.PlainMonthDay",
	"Temporal.PlainTime",
	"Temporal.PlainYearMonth",
	"Temporal.ZonedDateTime"
]);
function G(e) {
	if (typeof e != "object" || !e) return !1;
	let t = e[Symbol.toStringTag];
	return typeof t == "string" && mi.has(t);
}
var hi = {
	direction: "asc",
	nulls: "first",
	stringSort: "locale"
};
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/runtime-reference-identity.js
function gi() {
	let e = /* @__PURE__ */ new WeakMap(), t, n, r, i = 0, a = (e, t) => {
		let n = e.get(t);
		return n === void 0 && (n = ++i, e.set(t, n)), n;
	};
	return (i) => {
		r ??= xi();
		let o;
		if (typeof i == "symbol") {
			let e = Symbol.keyFor(i);
			e === void 0 ? (t ??= _i(), o = a(t, i)) : (n ??= /* @__PURE__ */ new Map(), o = a(n, e));
		} else o = a(e, i);
		return [
			"runtimeReference",
			r,
			o
		];
	};
}
function _i() {
	let e = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ Symbol();
	try {
		if (e.set(t, 0), e.get(t) === 0) return e;
	} catch {}
	return /* @__PURE__ */ new Map();
}
var vi;
function yi(e) {
	return vi ??= gi(), vi(e);
}
function bi(e) {
	return e?.stringSort === "custom" ? {
		...e,
		compare: yi(e.compare)
	} : e;
}
function xi() {
	let e = /* @__PURE__ */ new Uint32Array(4), t = Reflect.get(globalThis, "crypto");
	return typeof t?.getRandomValues == "function" ? (t.getRandomValues(e), Array.from(e, (e) => e.toString(36)).join("-")) : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/comparison.js
function K(e) {
	return typeof e == "number" && Number.isNaN(e) || e instanceof Date && Number.isNaN(e.getTime());
}
var Si = (e, t, n) => {
	let { nulls: r } = n;
	if (e == null && t == null) return 0;
	if (e == null) return r === "first" ? -1 : 1;
	if (t == null) return r === "first" ? 1 : -1;
	let i = K(e), a = K(t);
	if (i && a) return 0;
	if (i) return 1;
	if (a) return -1;
	if (typeof e == "string" && typeof t == "string") {
		if (n.stringSort === "custom") return n.compare(e, t);
		if (n.stringSort === "locale") return e.localeCompare(t, n.locale, n.localeOptions);
	}
	if (Array.isArray(e) && Array.isArray(t)) {
		for (let r = 0; r < Math.min(e.length, t.length); r++) {
			let i = Si(e[r], t[r], n);
			if (i !== 0) return i;
		}
		return e.length - t.length;
	}
	if (e instanceof Date && t instanceof Date) return e.getTime() - t.getTime();
	if (G(e) && G(t)) return Fi(e, t);
	let o = typeof e == "symbol", s = typeof t == "symbol";
	if (o && s) return e === t ? 0 : yi(e)[2] - yi(t)[2];
	if (o) return 1;
	if (s) return -1;
	let c = typeof e == "object", l = typeof t == "object";
	if (c || l) {
		if (c && l) return yi(e)[2] - yi(t)[2];
		if (c) return 1;
		if (l) return -1;
	}
	return e < t ? -1 : +(e > t);
}, Ci = (e, t, n) => e == null || t == null ? Si(e, t, n) : Si(t, e, n);
function wi(e) {
	if (Oi(e)) return "Binary";
	if (G(e)) {
		let t = e[Symbol.toStringTag], n = e;
		return t === "Temporal.Duration" && (n.years || n.months || n.weeks) ? "Temporal.Duration.calendar" : t;
	}
	return Array.isArray(e) ? "Array" : "Object";
}
function Ti(e, t = "values") {
	let n = e.direction === "asc" ? Si : Ci;
	if (t !== "index") return (t, r) => n(t, r, e);
	let r = e.direction === "asc" ? 1 : -1;
	return (t, i) => {
		if (t != null && i != null) {
			t instanceof Date && (t = t.getTime()), i instanceof Date && (i = i.getTime());
			let e = typeof t, n = typeof i;
			if (e !== n) return (e < n ? -1 : 1) * r;
			if (e === "object") {
				let e = wi(t), n = wi(i);
				if (e !== n) return (e < n ? -1 : 1) * r;
				if (e === "Binary" || e === "Temporal.Duration.calendar" || e === "Temporal.PlainMonthDay") {
					let e = q(t), n = q(i);
					return (e < n ? -1 : +(e > n)) * r;
				}
			}
		}
		return n(t, i, e);
	};
}
function Ei(e) {
	return (t, r) => {
		let i = e(t, r);
		if (typeof i != "number" || Number.isNaN(i)) throw TypeError(n(166, { result: i }));
		return i;
	};
}
var Di = Ti({
	direction: "asc",
	nulls: "first",
	stringSort: "locale"
});
function Oi(e) {
	return e instanceof Uint8Array || typeof Buffer < "u" && e instanceof Buffer;
}
function ki(e, t) {
	if (e.byteLength !== t.byteLength) return !1;
	for (let n = 0; n < e.byteLength; n++) if (e[n] !== t[n]) return !1;
	return !0;
}
var Ai = "\0tanstack-db:";
function ji(e, t) {
	return `${Ai}${e}:${t}`;
}
var Mi = /* @__PURE__ */ new WeakMap();
function Ni(e) {
	let t = Mi.get(e);
	if (t) return t;
	let n;
	if (e.byteLength <= 8192) n = String.fromCharCode.apply(null, e);
	else {
		let t = [];
		for (let n = 0; n < e.byteLength; n += 8192) t.push(String.fromCharCode.apply(null, e.subarray(n, n + 8192)));
		n = t.join("");
	}
	let r = ji("binary", n);
	return Mi.set(e, r), r;
}
function q(e) {
	if (typeof e == "string") return e.startsWith(Ai) ? ji("string", e) : e;
	if (typeof e != "object" || !e) return e;
	if (e instanceof Date) return e.getTime();
	if (G(e)) {
		let t = e[Symbol.toStringTag];
		if (t === "Temporal.Duration") {
			let n = e;
			return ji(t, ui.map((e) => n[e]).join(","));
		}
		return ji(t, e.toString());
	}
	return Oi(e) ? Ni(e) : e;
}
function Pi(e, t) {
	return e === t || Number.isNaN(e) && Number.isNaN(t);
}
function Fi(e, t) {
	let r = e[Symbol.toStringTag], i = t[Symbol.toStringTag];
	if (r !== i) throw TypeError(n(167, {
		aTag: r,
		bTag: i
	}));
	let a = e.constructor.compare;
	if (typeof a != "function") throw TypeError(n(168, { aTag: r }));
	return a(e, t);
}
function Ii(e, t) {
	return G(e) && G(t) ? Fi(e, t) : e < t ? -1 : +(e > t);
}
function Li(e, t) {
	return e === t ? !0 : Oi(e) && Oi(t) ? ki(e, t) : !1;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/equality-value-identity.js
var Ri = /* @__PURE__ */ Symbol("tanstack_db_parent_context"), zi = /* @__PURE__ */ Symbol("tanstack_db_parent_projection_not_found");
function Bi(e, t) {
	let n = q(e);
	return typeof n == "object" && n || typeof n == "function" || typeof n == "symbol" ? t(n) : n;
}
function Vi(e, t) {
	if (typeof e == "object" && e || typeof e == "function" || typeof e == "symbol") return t(e);
	if (typeof e == "number") {
		if (Object.is(e, -0)) return ["number", "-0"];
		if (Number.isNaN(e)) return ["number", "NaN"];
	}
	return e;
}
function Hi() {
	let e = gi(), t = (t) => Bi(t, e);
	return {
		equality: t,
		exact: (t) => Vi(t, e),
		serializeEquality: (e) => I(t(e))
	};
}
function Ui(e) {
	return Bi(e, yi);
}
function Wi(e, t, n = {}) {
	return {
		[Ri]: !0,
		value: e,
		projectedBindings: n,
		identity: t
	};
}
function Gi(e) {
	return qi(e) ? e.projectedBindings : void 0;
}
function Ki(e, t) {
	let n = Gi(e);
	return n && Object.prototype.hasOwnProperty.call(n, t) ? n[t] : zi;
}
function qi(e) {
	return typeof e == "object" && !!e && Ri in e;
}
function Ji(e) {
	if (qi(e)) return e.value;
	if (typeof e == "object" && e) return e;
}
function Yi(e) {
	return qi(e) ? e.identity : e;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/type-guards.js
function Xi(e) {
	if (typeof e != "object" || !e) return !1;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}
function Zi(e) {
	return !!e && (typeof e == "object" || typeof e == "function") && typeof e.then == "function";
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/route-metadata.js
var Qi = /* @__PURE__ */ Symbol("tanstack_db_routed_scalar_value"), $i = /* @__PURE__ */ Symbol("tanstack_db_route_metadata"), J = /* @__PURE__ */ Symbol("includesPublicKey"), ea = /* @__PURE__ */ Symbol("includesRouting"), ta = /* @__PURE__ */ new Set([$i, J]), na = /* @__PURE__ */ new Set([...ta, ea]);
function ra(e, t, n) {
	return Object.assign(e, { [$i]: {
		correlationKey: t,
		parentContext: n
	} });
}
function ia(e) {
	if (typeof e == "object" && e && $i in e) return e[$i];
}
function aa(e, t) {
	return ia(e) ?? (typeof e == "object" && e ? ia(e[t]) : void 0);
}
function oa(e) {
	let t = { ...e };
	return delete t[$i], t;
}
function sa(e, t, n, r) {
	return t === void 0 && n === void 0 && r === void 0 ? e : Xi(e) ? {
		...e,
		[$i]: {
			correlationKey: t,
			parentContext: n
		},
		[J]: r
	} : {
		[Qi]: e,
		[$i]: {
			correlationKey: t,
			parentContext: n
		},
		[J]: r
	};
}
function ca(e) {
	if (typeof e != "object" || !e || !(Qi in e)) return;
	let t = e, n = t[$i];
	return {
		value: t[Qi],
		correlationKey: n.correlationKey,
		parentContext: n.parentContext,
		publicKey: t[J]
	};
}
function la(e) {
	return da(e, (e) => e, ta);
}
function ua(e) {
	return da(e, (e) => e, na);
}
function da(e, t, n) {
	let r = t(e);
	if (!Object.is(r, e)) return r;
	if (!fa(e)) return e;
	let i = /* @__PURE__ */ new WeakMap(), a = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new Set(), s = (e) => {
		if (a.has(e)) return;
		let r = /* @__PURE__ */ new Map();
		a.set(e, r);
		for (let a of Reflect.ownKeys(e)) {
			if (n.has(a)) {
				o.add(e);
				continue;
			}
			let c = Object.getOwnPropertyDescriptor(e, a);
			if (!c) continue;
			let l = { descriptor: c };
			if (r.set(a, l), !c.enumerable || !("value" in c)) continue;
			let u = c.value, d = t(u);
			if (l.value = {
				original: u,
				replacement: d
			}, !Object.is(d, u)) {
				o.add(e);
				continue;
			}
			if (!fa(u)) continue;
			let f = i.get(u) ?? /* @__PURE__ */ new Set();
			f.add(e), i.set(u, f), s(u);
		}
	};
	s(e);
	let c = [...o];
	for (let e of c) for (let t of i.get(e) ?? []) o.has(t) || (o.add(t), c.push(t));
	if (!o.has(e)) return e;
	let l = /* @__PURE__ */ new WeakMap(), u = (e) => {
		if (!o.has(e)) return e;
		let t = l.get(e);
		if (t) return t;
		let n = Array.isArray(e) ? [] : Object.create(Object.getPrototypeOf(e));
		l.set(e, n);
		for (let [t, r] of a.get(e) ?? []) {
			let e = { ...r.descriptor };
			if (r.value) {
				let { original: t, replacement: n } = r.value;
				e.value = Object.is(n, t) ? fa(t) ? u(t) : t : n;
			}
			Object.defineProperty(n, t, e);
		}
		return n;
	};
	return u(e);
}
function fa(e) {
	return Array.isArray(e) || Xi(e);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/evaluators.js
function Y(e) {
	return e == null;
}
function pa(e) {
	return Oi(e) ? e : q(e);
}
function ma(e, t) {
	return K(e) || K(t) ? K(e) && K(t) : Li(e, t);
}
function ha(e) {
	if (e instanceof Date) return Number.isNaN(e.getTime()) ? null : e;
	if (typeof e == "string" || typeof e == "number") {
		let t = new Date(e);
		return Number.isNaN(t.getTime()) ? null : t;
	}
	return null;
}
function ga(e, t) {
	return e === "%Y-%m-%d" ? t.toISOString().slice(0, 10) : t.toISOString();
}
function _a(e) {
	return e === !0;
}
function X(e, t = !1) {
	return ya(e, t);
}
function va(e) {
	return ya(e, !0);
}
function ya(e, t) {
	switch (e.type) {
		case "val": {
			let t = e.value;
			return () => t;
		}
		case "ref": return t ? xa(e) : ba(e);
		case "func": return Sa(e, t);
		default: throw new Ir(e.type);
	}
}
function ba(e) {
	let t = v(e), [n, ...r] = e.path, i = t ?? n, a = t === void 0 ? r : y(e);
	if (!i) throw new Lr();
	let o = e.bindingId ? JSON.stringify([e.bindingId, a]) : void 0, s = o ? (e) => Ki(aa(e, i)?.parentContext, o) : void 0;
	if (i === "$selected") {
		if (a.length === 0) return (e) => e.$selected;
		if (a.length === 1) {
			let e = a[0];
			return (t) => t.$selected?.[e];
		}
		return (e) => {
			let t = e.$selected;
			if (t === void 0) return;
			let n = t;
			for (let e of a) {
				if (n == null) return n;
				n = n[e];
			}
			return n;
		};
	}
	let c = i;
	if (a.length === 0) return (e) => {
		let t = s?.(e);
		return s && t !== zi ? t : e[c];
	};
	if (a.length === 1) {
		let e = a[0];
		return (t) => {
			let n = s?.(t);
			return s && n !== zi ? n : t[c]?.[e];
		};
	}
	return (e) => {
		let t = s?.(e);
		if (s && t !== zi) return t;
		let n = e[c];
		if (n === void 0) return;
		let r = n;
		for (let e of a) {
			if (r == null) return r;
			r = r[e];
		}
		return r;
	};
}
function xa(e) {
	let t = y(e);
	return (e) => {
		let n = e;
		for (let e of t) {
			if (n == null) return n;
			n = n[e];
		}
		return n;
	};
}
function Sa(e, t) {
	let r = e.args.map((e) => ya(e, t));
	switch (e.name) {
		case "array": return (e) => r.map((t) => t(e));
		case "eq": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n), a = typeof r;
				if (a === typeof i && (a === "string" || a === "boolean")) return r === i;
				let o = pa(r), s = pa(i);
				return Y(o) || Y(s) ? null : ma(o, s);
			};
		}
		case "gt": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n);
				return Y(r) || Y(i) ? null : K(r) || K(i) ? K(r) && !K(i) : Ii(r, i) > 0;
			};
		}
		case "gte": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n);
				return Y(r) || Y(i) ? null : K(r) || K(i) ? K(r) : Ii(r, i) >= 0;
			};
		}
		case "lt": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n);
				return Y(r) || Y(i) ? null : K(r) || K(i) ? K(i) && !K(r) : Ii(r, i) < 0;
			};
		}
		case "lte": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n);
				return Y(r) || Y(i) ? null : K(r) || K(i) ? K(i) : Ii(r, i) <= 0;
			};
		}
		case "and": return (e) => {
			let t = !1;
			for (let n of r) {
				let r = n(e);
				if (r === !1) return !1;
				Y(r) && (t = !0);
			}
			return !t || null;
		};
		case "or": return (e) => {
			let t = !1;
			for (let n of r) {
				let r = n(e);
				if (r === !0) return !0;
				Y(r) && (t = !0);
			}
			return t ? null : !1;
		};
		case "not": {
			let e = r[0];
			return (t) => {
				let n = e(t);
				return Y(n) ? null : !n;
			};
		}
		case "in": {
			let t = r[0], n = r[1], i = e.args[1];
			if (i.type === "val" && Array.isArray(i.value)) {
				let e = i.value.filter((e) => !Y(e)), n = e.filter(Oi), r = new Set(e.filter((e) => !Oi(e)).map(q));
				return (e) => {
					let i = t(e);
					return Y(i) ? null : Oi(i) ? n.some((e) => Li(e, i)) : r.has(q(i));
				};
			}
			return (e) => {
				let r = pa(t(e)), i = n(e);
				return Y(r) ? null : Array.isArray(i) ? i.some((e) => ma(pa(e), r)) : !1;
			};
		}
		case "like": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n);
				return Y(r) || Y(i) ? null : wa(r, i, !1);
			};
		}
		case "ilike": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n);
				return Y(r) || Y(i) ? null : wa(r, i, !0);
			};
		}
		case "upper": {
			let e = r[0];
			return (t) => {
				let n = e(t);
				return typeof n == "string" ? n.toUpperCase() : n;
			};
		}
		case "lower": {
			let e = r[0];
			return (t) => {
				let n = e(t);
				return typeof n == "string" ? n.toLowerCase() : n;
			};
		}
		case "length": {
			let e = r[0];
			return (t) => {
				let n = e(t);
				return typeof n == "string" || Array.isArray(n) ? n.length : 0;
			};
		}
		case "concat": return (e) => r.map((t) => {
			let n = t(e);
			try {
				return String(n ?? "");
			} catch {
				try {
					return JSON.stringify(n) || "";
				} catch {
					return "[object]";
				}
			}
		}).join("");
		case "coalesce": return (e) => {
			for (let t of r) {
				let n = t(e);
				if (n != null) return n;
			}
			return null;
		};
		case "caseWhen": {
			let e = r.length % 2 == 1, t = Math.floor(r.length / 2);
			if (r.length < 2) throw Error(n(127));
			return (n) => {
				for (let e = 0; e < t; e++) {
					let t = r[e * 2];
					if (Ca(t(n))) {
						let t = r[e * 2 + 1];
						return t(n);
					}
				}
				return e ? r[r.length - 1](n) : null;
			};
		}
		case "add": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n);
				return (r ?? 0) + (i ?? 0);
			};
		}
		case "subtract": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n);
				return (r ?? 0) - (i ?? 0);
			};
		}
		case "multiply": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n);
				return (r ?? 0) * (i ?? 0);
			};
		}
		case "divide": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n) ?? 0;
				return i === 0 ? null : (r ?? 0) / i;
			};
		}
		case "date": {
			let e = r[0];
			return (t) => {
				let n = ha(e(t));
				return n ? n.toISOString().slice(0, 10) : null;
			};
		}
		case "datetime": {
			let e = r[0];
			return (t) => {
				let n = ha(e(t));
				return n ? n.toISOString() : null;
			};
		}
		case "strftime": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n);
				if (typeof r != "string") return null;
				let i = ha(t(n));
				return i ? ga(r, i) : null;
			};
		}
		case "isUndefined": {
			let e = r[0];
			return (t) => e(t) === void 0;
		}
		case "isNull": {
			let e = r[0];
			return (t) => e(t) === null;
		}
		default: throw new Rr(e.name);
	}
}
function Ca(e) {
	return e == null || e === !1 ? !1 : e === !0 ? !0 : typeof e == "number" ? e !== 0 && !Number.isNaN(e) : typeof e == "bigint" ? e !== 0n : !!e;
}
function wa(e, t, n) {
	if (typeof e != "string" || typeof t != "string") return !1;
	let r = n ? e.toLowerCase() : e, i = n ? t.toLowerCase() : t, a = 0, o = 0, s = -1, c = 0;
	for (; a < r.length;) {
		let e = o < i.length ? i[o] : void 0;
		if (e === "%") s = o, c = a, o++;
		else if (e === "_" || e === r[a]) a++, o++;
		else if (s !== -1) c++, a = c, o = s + 1;
		else return !1;
	}
	for (; i[o] === "%";) o++;
	return o === i.length;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/indexes/reverse-index.js
var Ta = class {
	constructor(e, t) {
		this.gu = t, this.bl = e;
	}
	lookup(e, t) {
		let n = e === "gt" ? "lt" : e === "gte" ? "lte" : e === "lt" ? "gt" : e === "lte" ? "gte" : e;
		return this.bl.lookup(n, t);
	}
	rangeQuery(e = {}) {
		return this.bl.rangeQueryReversed(e);
	}
	take(e, t, n) {
		return this.gu === void 0 ? this.bl.takeReversed(e, t, n) : this.read(e, n, t ?? null);
	}
	takeFromStart(e, t) {
		return this.gu === void 0 ? this.bl.takeReversedFromEnd(e, t) : this.read(e, t);
	}
	read(e, t, n) {
		let r = /* @__PURE__ */ new Set([...this.bl.equalityLookup(null), ...this.bl.equalityLookup(void 0)]), i = (e) => t?.(e) ?? !0, a = (e) => !r.has(e) && i(e), o = (e) => e <= 0 ? [] : n == null ? this.bl.takeReversedFromEnd(e, a) : this.bl.takeReversed(e, n, a), s = (e) => e <= 0 ? [] : [...r].sort(le).filter(i).slice(0, e);
		if (n === null) return this.gu ? o(e) : [];
		if (this.gu && n === void 0) {
			let t = s(e);
			return [...t, ...o(e - t.length)];
		}
		let c = o(e);
		return this.gu ? c : [...c, ...s(e - c.length)];
	}
	supports(e) {
		return this.bl.supports(e);
	}
	get supportsRangeOptimization() {
		return this.bl.supportsRangeOptimization;
	}
	get supportsOrderOptimization() {
		return this.bl.supportsOrderOptimization === !0;
	}
	canOptimizeRangeFor(e) {
		return this.bl.canOptimizeRangeFor?.(e) ?? !0;
	}
	get keyCount() {
		return this.bl.keyCount;
	}
};
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/virtual-props.js
function Ea(e, t, n, r, i) {
	let a = e, o = a.$synced ?? r();
	return {
		...e,
		$hasPendingWrites: !o,
		$synced: o,
		$origin: a.$origin ?? i(),
		$key: a.$key ?? t,
		$collectionId: a.$collectionId ?? n
	};
}
var Da = [
	"$hasPendingWrites",
	"$synced",
	"$origin",
	"$key",
	"$collectionId"
];
function Oa(e) {
	return Da.includes(e);
}
function ka(e) {
	return e.some((e) => Oa(e));
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/index-optimization.js
function Aa(e) {
	return e.supports("gt") && e.supportsRangeOptimization;
}
function ja(e) {
	return Aa(e) && !!e.supportsOrderOptimization;
}
function Ma(e, t, n, r) {
	if (ka(t)) return;
	let i = n ?? {
		...hi,
		...e.compareOptions
	};
	for (let n of e.indexes.values()) if (n.matchesField(t) && n.matchesCompareOptions(i)) {
		let e = n.matchesDirection(i.direction) ? n : new Ta(n, i.nulls === "first");
		if (!r || r(e)) return e;
	}
}
function Na(e) {
	if (e.length === 0) return /* @__PURE__ */ new Set();
	if (e.length === 1) return new Set(e[0]);
	let t = new Set(e[0]);
	for (let n = 1; n < e.length; n++) {
		let r = /* @__PURE__ */ new Set();
		for (let i of t) e[n].has(i) && r.add(i);
		t = r;
	}
	return t;
}
function Pa(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) for (let e of n) t.add(e);
	return t;
}
function Fa(e) {
	return e != null;
}
function Ia(e) {
	return {
		...hi,
		...e.compareOptions
	}.stringSort !== "lexical";
}
function La(e, t) {
	switch (typeof e) {
		case "number":
		case "bigint":
		case "boolean": return !1;
		case "string": return Ia(t);
		case "symbol": return !0;
		case "object": return e !== null && !(e instanceof Date);
		default: return !1;
	}
}
function Ra(e, t, n) {
	return !La(e, n) && t.supportsRangeOptimization && (t.canOptimizeRangeFor?.(e) ?? !0);
}
function za(e, t) {
	return Ba(e, t);
}
function Ba(e, t) {
	if (e.type === "func") switch (e.name) {
		case "eq":
		case "gt":
		case "gte":
		case "lt":
		case "lte": return Ha(e, t);
		case "and": return Ua(e, t);
		case "or": return Wa(e, t);
		case "in": return Ga(e, t);
	}
	return {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1
	};
}
function Va(e, t) {
	if (e.type !== "func" || e.args.length < 2) return {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1,
		coveredArgIndices: /* @__PURE__ */ new Set()
	};
	let n = /* @__PURE__ */ new Map();
	for (let [t, r] of e.args.entries()) if (r.type === "func" && [
		"gt",
		"gte",
		"lt",
		"lte"
	].includes(r.name)) {
		let e = r;
		if (e.args.length === 2) {
			let r = e.args[0], i = e.args[1], a = null, o = null, s = e.name;
			if (r.type === "ref" && i.type === "val") a = r, o = i;
			else if (r.type === "val" && i.type === "ref") switch (a = i, o = r, s) {
				case "gt":
					s = "lt";
					break;
				case "gte":
					s = "lte";
					break;
				case "lt":
					s = "gt";
					break;
				case "lte": s = "gte";
			}
			if (a && o) {
				let e = a.path, r = JSON.stringify(e), i = o.value;
				n.has(r) || n.set(r, []), n.get(r).push({
					operation: s,
					value: i,
					argIndex: t
				});
			}
		}
	}
	for (let [e, r] of n) if (r.length >= 2) {
		let n = Ma(t, JSON.parse(e));
		if (n && r.some((e) => !Ra(e.value, n, t))) continue;
		if (n && n.supports("gt") && n.supports("lt")) {
			let e = Ti({
				...hi,
				...t.compareOptions,
				direction: "asc"
			}), i, a, o = !1, s = !1, c = !0, l = !0, u = !1;
			for (let { operation: t, value: n } of r) if (!Fa(n)) u = !0;
			else switch (t) {
				case "gt":
				case "gte": {
					let r = o ? e(n, i) : 1;
					r > 0 ? (i = n, o = !0, c = t === "gte") : r === 0 && t === "gt" && (c = !1);
					break;
				}
				case "lt":
				case "lte": {
					let r = s ? e(n, a) : -1;
					r < 0 ? (a = n, s = !0, l = t === "lte") : r === 0 && t === "lt" && (l = !1);
					break;
				}
			}
			let d = {};
			return o && (d.from = i, d.fromInclusive = c), s && (d.to = a, d.toInclusive = l), {
				canOptimize: !0,
				matchingKeys: n.rangeQuery(d),
				isExact: o && !u,
				coveredArgIndices: new Set(r.map((e) => e.argIndex))
			};
		}
	}
	return {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1,
		coveredArgIndices: /* @__PURE__ */ new Set()
	};
}
function Ha(e, t) {
	if (e.type !== "func" || e.args.length !== 2) return {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1
	};
	let n = e.args[0], r = e.args[1], i = null, a = null, o = e.name;
	if (n.type === "ref" && r.type === "val") i = n, a = r;
	else if (n.type === "val" && r.type === "ref") switch (i = r, a = n, o) {
		case "gt":
			o = "lt";
			break;
		case "gte":
			o = "lte";
			break;
		case "lt":
			o = "gt";
			break;
		case "lte": o = "gte";
	}
	if (i && a) {
		let e = i.path, n = Ma(t, e);
		if (n) {
			let e = a.value, r = o;
			return !n.supports(r) || (o === "gt" || o === "gte" || o === "lt" || o === "lte") && !Ra(e, n, t) ? {
				canOptimize: !1,
				matchingKeys: /* @__PURE__ */ new Set(),
				isExact: !1
			} : {
				canOptimize: !0,
				matchingKeys: n.lookup(r, e),
				isExact: o === "lt" || o === "lte" ? !1 : Fa(e)
			};
		}
	}
	return {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1
	};
}
function Ua(e, t) {
	if (e.type !== "func" || e.args.length < 2) return {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1
	};
	let n = Va(e, t), r = n.canOptimize ? n.coveredArgIndices : /* @__PURE__ */ new Set(), i = [];
	n.canOptimize && i.push(n);
	let a = !n.canOptimize || n.isExact;
	for (let [n, o] of e.args.entries()) {
		if (r.has(n)) continue;
		let e = Ba(o, t);
		e.canOptimize ? (i.push(e), e.isExact || (a = !1)) : a = !1;
	}
	return i.length > 0 ? {
		canOptimize: !0,
		matchingKeys: Na(i.map((e) => e.matchingKeys)),
		isExact: a
	} : {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1
	};
}
function Wa(e, t) {
	if (e.type !== "func" || e.args.length < 2) return {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1
	};
	let n = [];
	for (let r of e.args) {
		let e = Ba(r, t);
		if (!e.canOptimize) return {
			canOptimize: !1,
			matchingKeys: /* @__PURE__ */ new Set(),
			isExact: !1
		};
		n.push(e);
	}
	return {
		canOptimize: !0,
		matchingKeys: Pa(n.map((e) => e.matchingKeys)),
		isExact: n.every((e) => e.isExact)
	};
}
function Ga(e, t) {
	if (e.type !== "func" || e.args.length !== 2) return {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1
	};
	let n = e.args[0], r = e.args[1];
	if (n.type === "ref" && r.type === "val" && Array.isArray(r.value)) {
		let e = n.path, i = r.value, a = Ma(t, e), o = i.every((e) => Fa(e));
		if (a) {
			if (a.supports("in")) return {
				canOptimize: !0,
				matchingKeys: a.lookup("in", i),
				isExact: o
			};
			if (a.supports("eq")) {
				let e = /* @__PURE__ */ new Set();
				for (let t of i) {
					let n = a.lookup("eq", t);
					for (let t of n) e.add(t);
				}
				return {
					canOptimize: !0,
					matchingKeys: e,
					isExact: o
				};
			}
		}
	}
	return {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1
	};
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/builder/wrapper-identity.js
var Ka = /* @__PURE__ */ new WeakMap();
function qa(e, t) {
	Ka.set(e, t);
}
function Ja(e) {
	return typeof e == "object" && e ? Ka.get(e) : void 0;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/builder/ref-proxy.js
var Ya = 0;
function Xa() {
	let e = /* @__PURE__ */ new Map();
	function t(n) {
		let r = JSON.stringify(n);
		if (e.has(r)) return e.get(r);
		let a = new Proxy({}, {
			get(e, r, a) {
				if (r === "__refProxy") return !0;
				if (r === "__path") return n;
				if (r !== "__sourceAlias" && r !== "__bindingId" && r !== "__type") return r === i ? !0 : typeof r == "symbol" ? Reflect.get(e, r, a) : t([...n, String(r)]);
			},
			has(e, t) {
				return t === "__refProxy" || t === "__path" || t === "__sourceAlias" || t === "__bindingId" || t === "__type" || Reflect.has(e, t);
			},
			ownKeys(e) {
				return Reflect.ownKeys(e);
			},
			getOwnPropertyDescriptor(e, t) {
				return t === "__refProxy" || t === "__path" || t === "__sourceAlias" || t === "__bindingId" || t === "__type" ? {
					enumerable: !1,
					configurable: !0
				} : Reflect.getOwnPropertyDescriptor(e, t);
			}
		});
		return e.set(r, a), a;
	}
	return t([]);
}
function Za(e, t) {
	let n = /* @__PURE__ */ new Map();
	function r(e) {
		let n, a;
		return new Proxy({}, {
			get(o, s, c) {
				if (s === "__refProxy") return !0;
				if (s === "__path") return e;
				if (s === "__sourceAlias") return e[0];
				if (s === "__bindingId") return t?.get(e[0] ?? "");
				if (s === "__type") return;
				if (s === i) return e;
				if (typeof s == "symbol") return Reflect.get(o, s, c);
				if (s === a?.key) return a.ref;
				if (Object.prototype.hasOwnProperty.call(o, s)) return Reflect.get(o, s, c);
				n ??= /* @__PURE__ */ new Map();
				let l = n.get(s);
				return l === void 0 && (l = r([...e, s]), n.set(s, l)), l;
			},
			has(e, t) {
				return t === a?.key || t === "__refProxy" || t === "__path" || t === "__sourceAlias" || t === "__bindingId" || t === "__type" || Reflect.has(e, t);
			},
			ownKeys(n) {
				let r = ++Ya, i = `__SPREAD_SENTINEL__${e.join(".")}__${r}`;
				return a = {
					key: i,
					ref: new _(e, e[0], t?.get(e[0] ?? ""))
				}, [...Reflect.ownKeys(n), i];
			},
			getOwnPropertyDescriptor(e, t) {
				return t === a?.key ? {
					enumerable: !0,
					configurable: !0,
					value: a.ref
				} : t === "__refProxy" || t === "__path" || t === "__sourceAlias" || t === "__bindingId" || t === "__type" ? {
					enumerable: !1,
					configurable: !0
				} : Reflect.getOwnPropertyDescriptor(e, t);
			}
		});
	}
	return new Proxy({}, {
		get(t, a, o) {
			if (a === "__refProxy") return !0;
			if (a === "__path") return [];
			if (a === "__sourceAlias" || a === "__bindingId" || a === "__type") return;
			if (a === i) return !0;
			if (typeof a == "symbol") return Reflect.get(t, a, o);
			let s = String(a);
			if (e.includes(s) || e.includes("*")) {
				let e = n.get(s);
				return e === void 0 && (e = r([s]), n.set(s, e)), e;
			}
		},
		has(t, n) {
			return n === "__refProxy" || n === "__path" || n === "__sourceAlias" || n === "__bindingId" || n === "__type" || typeof n == "string" && e.includes(n) ? !0 : Reflect.has(t, n);
		},
		ownKeys(t) {
			return [
				...e,
				"__refProxy",
				"__path",
				"__sourceAlias",
				"__bindingId",
				"__type"
			];
		},
		getOwnPropertyDescriptor(t, n) {
			if (n === "__refProxy" || n === "__path" || n === "__sourceAlias" || n === "__bindingId" || n === "__type") return {
				enumerable: !1,
				configurable: !0
			};
			if (typeof n == "string" && e.includes(n)) return {
				enumerable: !0,
				configurable: !0
			};
		}
	});
}
function Qa(e, t) {
	let n = Za(e, t), r = /* @__PURE__ */ new Map();
	function a(e) {
		let t = JSON.stringify(e);
		if (r.has(t)) return r.get(t);
		let n = new Proxy({}, {
			get(t, n, r) {
				if (n === "__refProxy") return !0;
				if (n === "__path") return ["$selected", ...e];
				if (n === "__sourceAlias") return "$selected";
				if (n !== "__bindingId" && n !== "__type") return n === i ? !0 : typeof n == "symbol" ? Reflect.get(t, n, r) : a([...e, String(n)]);
			},
			has(e, t) {
				return t === "__refProxy" || t === "__path" || t === "__sourceAlias" || t === "__bindingId" || t === "__type" || Reflect.has(e, t);
			},
			ownKeys(e) {
				return Reflect.ownKeys(e);
			},
			getOwnPropertyDescriptor(e, t) {
				return t === "__refProxy" || t === "__path" || t === "__sourceAlias" || t === "__bindingId" || t === "__type" ? {
					enumerable: !1,
					configurable: !0
				} : Reflect.getOwnPropertyDescriptor(e, t);
			}
		});
		return r.set(t, n), n;
	}
	let o = a([]);
	return new Proxy(n, {
		get(e, t, n) {
			return t === "$selected" ? o : Reflect.get(e, t, n);
		},
		has(e, t) {
			return t === "$selected" || Reflect.has(e, t);
		},
		ownKeys(e) {
			return [...Reflect.ownKeys(e), "$selected"];
		},
		getOwnPropertyDescriptor(e, t) {
			return t === "$selected" ? {
				enumerable: !0,
				configurable: !0,
				value: o
			} : Reflect.getOwnPropertyDescriptor(e, t);
		}
	});
}
function Z(e) {
	if (e === null || typeof e != "object" && typeof e != "function") return new b(e);
	let t = a(e);
	if (t !== void 0) return Array.isArray(t) ? new _(t, t[0], e.__bindingId) : new _(e.__path, e.__sourceAlias, e.__bindingId);
	let r = Ja(e);
	if (r) throw Error(n(126, { name: r }));
	return E(e) ? e : new b(e);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/builder/functions.js
function $a(e, t) {
	return new x("eq", [Z(e), Z(t)]);
}
function eo(e, t) {
	return new x("gt", [Z(e), Z(t)]);
}
function to(e, t) {
	return new x("gte", [Z(e), Z(t)]);
}
function no(e, t) {
	return new x("lt", [Z(e), Z(t)]);
}
function ro(e, t, ...n) {
	return new x("and", [
		e,
		t,
		...n
	].map((e) => Z(e)));
}
function io(e, t, ...n) {
	return new x("or", [
		e,
		t,
		...n
	].map((e) => Z(e)));
}
function ao(e) {
	return new x("not", [Z(e)]);
}
function oo(e) {
	return new x("isUndefined", [Z(e)]);
}
function so(e) {
	return new x("isNull", [Z(e)]);
}
function co(e, t) {
	return new x("in", [Z(e), Z(t)]);
}
function lo(e, t) {
	return new x("ilike", [Z(e), Z(t)]);
}
var uo = [
	"eq",
	"gt",
	"gte",
	"lt",
	"lte",
	"in"
], fo = class {
	constructor(e) {
		this.query = e, this.__brand = "ToArrayWrapper", qa(this, "toArray()");
	}
}, po = class {
	constructor(e) {
		this.query = e, this.__brand = "ConcatToArrayWrapper", qa(this, "concat(toArray())");
	}
}, mo = class {
	constructor(e) {
		this.args = e, this.__brand = "CaseWhenWrapper", qa(this, "caseWhen()");
	}
}, ho = class {
	constructor(e) {
		this.query = e, this.__brand = "MaterializeWrapper", qa(this, "materialize()");
	}
};
function go() {
	return /* @__PURE__ */ e() && !1;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/indexes/auto-index.js
function _o(e) {
	return e.config.autoIndex === "eager";
}
function vo(e, t, n, i, a) {
	if (ka(t)) return;
	let o = _o(n);
	if (!o && !go()) return;
	let s = i ?? {
		...hi,
		...n.compareOptions
	};
	if (!Ma(n, t, s, a)) {
		if (!o) n.id, n.size;
		else try {
			n.createIndex((e) => {
				let n = e;
				for (let e of t) n = n[e];
				return n;
			}, {
				name: `auto:${t.join(".")}`,
				options: { compareOptions: s }
			});
		} catch (e) {
			console.warn(r(215, {
				id: n.id,
				value: t.join(".")
			}), e);
		}
	}
}
function yo(e, t) {
	if (!_o(t) && !go()) return;
	let n = bo(e);
	for (let { fieldName: e, fieldPath: r } of n) vo(e, r, t);
}
function bo(e) {
	let t = [];
	function n(e) {
		if (e.type !== "func") return;
		let r = e;
		if (r.name === "and") {
			for (let e of r.args) n(e);
			return;
		}
		if (!uo.includes(r.name) || r.args.length < 1 || r.args[0].type !== "ref") return;
		let i = r.args[0].path;
		if (i.length === 0) return;
		let a = i.join("_");
		t.push({
			fieldName: a,
			fieldPath: i
		});
	}
	return n(e), t;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/equality-conjunct.js
function xo(e) {
	let t = q(e), n = typeof t;
	return n === "string" || n === "number" || n === "boolean" ? `${n}:${String(t)}` : void 0;
}
function So(e, t) {
	try {
		let n = e;
		for (let e of t) n = n?.[e];
		return n;
	} catch {
		return;
	}
}
function Co(e, t) {
	if (e.type !== "func" || e.name !== "eq") return;
	let n = e.args;
	if (n.length !== 2) return;
	let r = n[0], i = n[1], a = r.type === "ref" ? r : i, o = r.type === "val" ? r : i;
	if (a.type !== "ref" || o.type !== "val") return;
	let s = t(a);
	if (!s?.length || Oa(s[0])) return;
	let c = xo(o.value);
	return c === void 0 ? void 0 : {
		path: s,
		literalKey: c
	};
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/expressions.js
function wo(e) {
	switch (e.type) {
		case "ref": {
			let t = v(e) ?? e.path[0];
			return new Set(t ? [t] : []);
		}
		case "func": {
			let t = /* @__PURE__ */ new Set();
			for (let n of e.args) for (let e of wo(n)) t.add(e);
			return t;
		}
		default: return /* @__PURE__ */ new Set();
	}
}
function To(e, t) {
	let n = e.type;
	if (n === "val") return new b(e.value);
	if (n === "ref") {
		let n = e.path, r = v(e);
		if (Array.isArray(n)) {
			if (r === t) return new _(y(e));
			if (r !== void 0) return new _(n, r);
			if (n[0] === t && n.length > 1) return new _(n.slice(1));
			if (n.length === 1 && n[0] !== void 0) return new _([n[0]]);
		}
		return new _(Array.isArray(n) ? n : [String(n)]);
	}
	{
		let n = [];
		for (let r of e.args) {
			let e = To(r, t);
			n.push(e);
		}
		return new x(e.name, n);
	}
}
function Eo(e, t) {
	return e.map((e) => {
		let n = To(e.expression, t);
		return {
			...e,
			expression: n
		};
	});
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/group-by.js
var Do = /* @__PURE__ */ Symbol("raw_group_representative");
function Oo(e, t) {
	let n = Object.keys(t ?? {}), r = "__tanstack_group_";
	for (; n.some((e) => e.startsWith(r));) r += "_";
	return {
		virtual: `${r}virtual`,
		route: `${r}route`,
		exactInputs: `${r}exact_inputs`,
		correlationIdentity: `${r}correlation_identity`,
		parentContextIdentity: `${r}parent_context_identity`,
		singleGroup: `${r}single_group`,
		aggregatePrefix: `${r}aggregate_`,
		groupKeys: Array.from({ length: e }, (e, t) => `${r}key_${t}`),
		groupValues: Array.from({ length: e }, (e, t) => `${r}value_${t}`),
		groupKeyRefs: Array.from({ length: e }, (e, t) => `${r}key_ref_${t}`)
	};
}
function ko(e) {
	let t = e.map(Ui);
	if (t.length === 1) {
		let e = t[0];
		if (e == null || typeof e != "object" && typeof e != "function" && typeof e != "symbol") return e;
	}
	return I(t);
}
function Ao(e, t) {
	let n = e;
	n[J] = t;
}
function jo(e, t) {
	let n = { key: I(t) };
	return Object.defineProperty(n, Do, { value: e }), n;
}
function Mo(e, t, n) {
	return Object.is(e, -0) ? [
		1,
		"",
		""
	] : typeof e != "object" || !e ? [
		0,
		"",
		n.exact(e)
	] : [
		2,
		No(e),
		t
	];
}
function No(e) {
	return e instanceof Date ? "Date" : G(e) ? e[Symbol.toStringTag] : typeof Buffer < "u" && e instanceof Buffer ? "Buffer" : e instanceof Uint8Array ? "Uint8Array" : "Object";
}
function Po(e) {
	let t;
	for (let [n, r] of e) r <= 0 || (t === void 0 || n.key < t.key) && (t = n);
	return t;
}
function Fo(e) {
	return e?.[Do];
}
function Io(e, t, n, r, i) {
	let a = aa(t, n);
	e[r.correlationIdentity] = i.equality(a?.correlationKey), a?.parentContext != null && (e[r.parentContextIdentity] = Yi(a.parentContext));
}
function Lo(e, t, n, r) {
	e[n.route] = {
		preMap: ([, e]) => {
			let n = aa(e, t);
			return jo(n, [r.exact(n?.correlationKey), r.exact(n?.parentContext)]);
		},
		reduce: Po,
		postMap: Fo
	};
}
function Ro(e, t) {
	return e[t.route];
}
function zo(e, t) {
	return Ro(e, t)?.parentContext == null ? e[t.correlationIdentity] : [e[t.correlationIdentity], e[t.parentContextIdentity]];
}
function Bo(e, t, n = e.$selected) {
	return {
		...Ji(Ro(e, t)?.parentContext),
		$selected: n
	};
}
function Vo(e) {
	let t = !1, n = !0, r = !1;
	for (let [i, a] of Object.entries(e)) {
		if (i === "$selected" || typeof a != "object" || !a) continue;
		let e = a, o = "$synced" in e, s = "$hasPendingWrites" in e, c = "$origin" in e;
		(o || s || c) && (t = !0, (e.$synced === !1 || !o && e.$hasPendingWrites === !0) && (n = !1), e.$origin === "local" && (r = !0));
	}
	return {
		synced: !t || n,
		hasLocal: r
	};
}
var { sum: Ho, count: Uo, avg: Wo, min: Go, max: Ko } = Dn;
function qo(e, t, n, r, i, a, o, s, c, l = !1) {
	let u = Oo(t.length, a), d = { [u.virtual]: {
		preMap: ([, e]) => Vo(e),
		reduce: (e) => {
			let t = {
				synced: !0,
				hasLocal: !1
			};
			for (let [n, r] of e) r <= 0 || (n.synced || (t.synced = !1), n.hasLocal && (t.hasLocal = !0));
			return t;
		}
	} };
	c && Lo(d, c, u, n);
	let f = t.length === 0;
	if (a) {
		for (let [e, n] of Object.entries(a)) if (Xo(e, n, r, t)) throw new Yr(e.startsWith(Jo) ? `...${Yo(e)}` : e);
	}
	let p = t.map((e) => X(e)), m = ([, e]) => {
		let r = f ? e : { ...e };
		f || delete r.$selected;
		let i = f ? { [u.singleGroup]: !0 } : {};
		for (let e = 0; e < t.length; e++) {
			let t = p[e], a = t(r);
			i[u.groupKeys[e]] = n.equality(a);
		}
		return c && Io(i, e, c, u, n), i;
	}, h = d, g = {}, _ = { value: 0 };
	for (let e = 0; e < p.length; e++) {
		let t = p[e];
		h[u.groupValues[e]] = {
			preMap: ([e, r]) => {
				let i = t(r);
				return jo(i, Mo(i, e, n));
			},
			reduce: Po,
			postMap: Fo
		};
	}
	let v = [], y = (e, t) => {
		h[e] = $o(t);
		let n = t.name.toLowerCase();
		(n === "min" || n === "max") && v.push(Qo(X(t.args[0])));
	};
	if (a) for (let [e, n] of Object.entries(a)) if (n.type === "agg") y(e, n);
	else {
		let { transformed: r, extracted: i } = rs(n, _, u.aggregatePrefix);
		for (let [e, t] of Object.entries(i)) y(e, t);
		g[e] = os(is(r, t, u.groupKeyRefs));
	}
	if (v.length > 0 && (h[u.exactInputs] = {
		preMap: (e) => v.map((t) => Mo(t(e), e[0], n)),
		reduce: () => void 0
	}), e = e.pipe(yn(m, h)), e = e.pipe(V(([, e]) => {
		let n = {};
		if (a) {
			for (let [t, r] of Object.entries(a)) n[t] = r.type === "agg" ? e[t] : void 0;
			ts(n, e, g, u);
		} else for (let r = 0; r < t.length; r++) n[`__key_${r}`] = e[u.groupValues[r]];
		let r = c ? Ro(e, u) : void 0, i = r?.correlationKey, o = c ? zo(e, u) : void 0, l = [], d = [];
		for (let n = 0; n < t.length; n++) l.push(e[u.groupKeys[n]]), d.push(e[u.groupValues[n]]);
		o !== void 0 && l.push(o);
		let p = f ? o === void 0 ? "single_group" : `single_group_${I(o)}` : l.length === 1 ? l[0] : I(l), m = f ? "single_group" : ko(d), h = {
			...e,
			$selected: n
		}, _ = e[u.virtual];
		return h.$synced = _?.synced ?? !0, h.$hasPendingWrites = !h.$synced, h.$origin = _?.hasLocal ? "local" : "remote", h.$key = m, h.$collectionId = s ?? h.$collectionId, c && i !== void 0 && (Ao(h, m), ra(h, i, r?.parentContext ?? null)), [c ? p : m, h];
	})), i && i.length > 0) for (let n of i) {
		let i = te(n);
		if (Xo("", i, r, t)) throw new Yr("HAVING");
		let o = X(as(es(i, a || {}), t, u.groupKeyRefs));
		e = e.pipe(xt(([, e]) => {
			let t = e.$selected;
			if (u.groupKeyRefs.length > 0) {
				let n = { ...t };
				u.groupKeyRefs.forEach((t, r) => {
					n[t] = e[u.groupValues[r]];
				}), t = n;
			}
			let n = Bo(e, u, t), r = o(n);
			return f ? _a(r) : r;
		}));
	}
	if (o && o.length > 0) for (let t of o) e = e.pipe(xt(([, e]) => {
		let n = Bo(e, u), r = l ? ua(n) : n;
		return _a(t(r));
	}));
	return e;
}
var Jo = "__SPREAD_SENTINEL__";
function Yo(e) {
	let t = e.slice(Jo.length), n = t.lastIndexOf("__");
	return n >= 0 ? t.slice(0, n) : t;
}
function Xo(e, t, n, r) {
	if (e.startsWith(Jo)) return !0;
	if (r.some((e) => Zo(t, e))) return !1;
	if (us(t)) return t.branches.some((e) => Xo("", e.condition, n, r) || Xo("", e.value, n, r)) || Xo("", t.defaultValue, n, r);
	if (D(t)) {
		let e = t;
		return e.type === "ref" ? n(e) : e.type === "func" && e.args.some((e) => Xo("", e, n, r));
	}
	return ls(t) ? Object.entries(t).some(([e, t]) => Xo(e, t, n, r)) : !1;
}
function Zo(e, t) {
	if (!e || !t || e.type !== t.type) return !1;
	switch (e.type) {
		case "ref": return e.bindingId !== t.bindingId || !e.path || !t.path || e.path.length !== t.path.length ? !1 : e.path.every((e, n) => e === t.path[n]);
		case "val": return typeof e.value == "number" ? Object.is(e.value, t.value) : W(e.value, t.value);
		case "func": return e.name === t.name && e.args?.length === t.args?.length && (e.args || []).every((e, n) => Zo(e, t.args[n]));
		case "agg": return e.name === t.name && e.args?.length === t.args?.length && (e.args || []).every((e, n) => Zo(e, t.args[n]));
		default: return !1;
	}
}
function Qo(e) {
	return ([, t]) => {
		let n = e(t);
		return typeof n == "number" || typeof n == "string" || typeof n == "bigint" || n instanceof Date ? n : n == null ? 0 : Number(n);
	};
}
function $o(e) {
	let t = X(e.args[0]), n = ([, e]) => {
		let n = t(e);
		return typeof n == "number" ? n : n == null ? 0 : Number(n);
	}, r = Qo(t), i = ([, e]) => t(e);
	switch (e.name.toLowerCase()) {
		case "sum": return Ho(n);
		case "count": return Uo(i);
		case "avg": return Wo(n);
		case "min": return Go(r);
		case "max": return Ko(r);
		default: throw new Xr(e.name);
	}
}
function es(e, t, n = "$selected") {
	switch (e.type) {
		case "agg": {
			let r = e;
			for (let [e, i] of Object.entries(t)) if (i.type === "agg" && ds(r, i)) return new _([n, e], n);
			throw new Zr(r.name);
		}
		case "func": {
			let n = e, r = n.args.map((e) => es(e, t));
			return new x(n.name, r);
		}
		case "ref": return e;
		case "val": return e;
		default: throw new Qr(e.type);
	}
}
function ts(e, t, n, r) {
	for (let n of Object.keys(t)) n.startsWith(r.aggregatePrefix) && (e[n] = t[n]);
	for (let n = 0; n < r.groupKeyRefs.length; n++) e[r.groupKeyRefs[n]] = t[r.groupValues[n]];
	let i = Bo(t, r, e);
	for (let [t, r] of Object.entries(n)) e[t] = r(i);
	for (let t of Object.keys(e)) (t.startsWith(r.aggregatePrefix) || r.groupKeyRefs.includes(t)) && delete e[t];
}
function ns(e) {
	return us(e) ? e.branches.some((e) => ns(e.condition) || ns(e.value)) || e.defaultValue !== void 0 && ns(e.defaultValue) : ls(e) ? Object.values(e).some((e) => ns(e)) : D(e) ? e.type === "agg" || e.type === "func" && "args" in e && e.args.some((e) => ns(e)) : !1;
}
function rs(e, t, n) {
	if (e.type === "agg") {
		let r = `${n}${t.value++}`;
		return {
			transformed: new _(["$selected", r], "$selected"),
			extracted: { [r]: e }
		};
	}
	if (e.type === "func") {
		let r = {}, i = e.args.map((e) => {
			let i = rs(e, t, n);
			return Object.assign(r, i.extracted), i.transformed;
		});
		return {
			transformed: new x(e.name, i),
			extracted: r
		};
	}
	if (us(e)) {
		let r = {}, i = e.branches.map((e) => {
			let i = rs(e.condition, t, n), a = rs(e.value, t, n);
			return Object.assign(r, i.extracted, a.extracted), {
				condition: i.transformed,
				value: a.transformed
			};
		}), a = e.defaultValue === void 0 ? void 0 : rs(e.defaultValue, t, n);
		return a && Object.assign(r, a.extracted), {
			transformed: new T(i, a?.transformed),
			extracted: r
		};
	}
	if (ls(e)) {
		let r = {}, i = {};
		for (let [a, o] of Object.entries(e)) {
			let e = rs(o, t, n);
			Object.assign(r, e.extracted), i[a] = e.transformed;
		}
		return {
			transformed: i,
			extracted: r
		};
	}
	return {
		transformed: e,
		extracted: {}
	};
}
function is(e, t, n) {
	if (us(e)) return new T(e.branches.map((e) => ({
		condition: as(e.condition, t, n),
		value: is(e.value, t, n)
	})), e.defaultValue === void 0 ? void 0 : is(e.defaultValue, t, n));
	if (ls(e)) {
		let r = {};
		for (let [i, a] of Object.entries(e)) r[i] = is(a, t, n);
		return r;
	}
	return !D(e) || e.type === "includesSubquery" || e.type === "agg" ? e : as(e, t, n);
}
function as(e, t, n) {
	let r = t.findIndex((t) => Zo(e, t));
	return r === -1 ? e.type === "func" ? new x(e.name, e.args.map((e) => as(e, t, n))) : e : new _(["$selected", n[r]], "$selected");
}
function os(e) {
	return us(e) ? cs(e) : ls(e) ? ss(e) : D(e) ? X(e) : () => e;
}
function ss(e) {
	let t = Object.entries(e).map(([e, t]) => [e, os(t)]);
	return (e) => {
		let n = {};
		for (let [r, i] of t) n[r] = i(e);
		return n;
	};
}
function cs(e) {
	let t = e.branches.map((e) => ({
		condition: X(e.condition),
		value: os(e.value)
	})), n = e.defaultValue === void 0 ? void 0 : os(e.defaultValue);
	return (e) => {
		for (let n of t) if (Ca(n.condition(e))) return n.value(e);
		return n === void 0 ? null : n(e);
	};
}
function ls(e) {
	return typeof e == "object" && !!e && !Array.isArray(e) && !o(e) && !D(e);
}
function us(e) {
	return e instanceof T || typeof e == "object" && !!e && e.type === "conditionalSelect";
}
function ds(e, t) {
	return e.name === t.name && e.args.length === t.args.length && e.args.every((e, n) => Zo(e, t.args[n]));
}
function fs(e, t, n, r, i, a, o, s, c, l) {
	let u = n.map((e) => ({
		compiledExpression: X(es(e.expression, r, "$selected")),
		compareOptions: ps(e, i)
	})), d = (e) => n.length > 1 ? u.map((t) => t.compiledExpression(e)) : n.length === 1 ? u[0].compiledExpression(e) : null, f = (e, t) => {
		if (n.length > 1) {
			let r = e, i = t;
			for (let e = 0; e < n.length; e++) {
				let t = u[e], n = Ti(t.compareOptions)(r[e], i[e]);
				if (n !== 0) return n;
			}
			return r.length - i.length;
		}
		if (n.length === 1) {
			let n = u[0];
			return Ti(n.compareOptions)(e, t);
		}
		return Di(e, t);
	}, p, m;
	if (s !== void 0 && n.length > 0 && !l && e.from.type !== "unionFrom" && e.from.type !== "unionAll") {
		let t, r, o = e.from.alias, l, u = n[0], d = u.expression, f = d.type === "ref" ? M(e, d, i) : void 0;
		if (d.type === "ref" && f) {
			r = f.collection, l = f.sourceId;
			let n = f.path[0], a = ps(u, i);
			n && vo(n, f.path, r, a, Aa), t = Ma(r, f.path, a, ja), f.path, o = d.path.length > 1 ? String(d.path[0]) : e.from.alias, l ??= O(e).find((e) => e.alias === o && e.collection === r)?.sourceId;
		}
		if (l && f) {
			let r = ms(n, i.compareOptions), u = n.every(({ expression: t }) => t.type === "ref" && M(e, t, i)?.sourceId === l), d = X(new _(f.path), !0), h = Ti(r[0].compareOptions), g = (e, t) => h(e && d(e), t && d(t)), v = e.where?.some((e) => [...wo(k(e))].some((e) => e !== o)) ?? !1, y = v && e.join?.length === 1 && e.join[0].type === "left" && e.join[0].from.type === "collectionRef" ? e.join[0].from.sourceId : void 0, b = {
				sourceId: l,
				alias: o,
				offset: c ?? 0,
				limit: s,
				comparator: g,
				valueExtractorForRawRow: d,
				index: t,
				orderBy: r,
				joinedFilterSourceId: y,
				sourceHoldsAllRows: f.collection.config.syncMode !== "on-demand",
				requiresFullSource: r.some(({ compareOptions: e }) => e.stringSort === "custom") || !u || e.from.type !== "collectionRef" || e.from.sourceId !== l || (e.join?.some(({ type: e }) => e !== "left") ?? !1) || (e.where?.some(A) ?? !1) || v && y === void 0 || (e.fnWhere?.length ?? 0) > 0 || e.groupBy !== void 0 || e.having !== void 0 || e.fnHaving !== void 0 || e.distinct === !0
			};
			m = b, a[l] = b;
			let x = b.joinedFilterSourceId !== void 0 && !b.sourceHoldsAllRows;
			(t || x) && (p = (e) => {
				b.dataNeeded = (t) => {
					let n = e(t && ((e) => g(e[o], t) <= 0));
					return Math.max(0, b.limit - n);
				};
			});
		}
	}
	return l ? t.pipe(On(d, {
		limit: s,
		offset: c,
		comparator: f,
		setSizeCallback: p,
		groupKeyFn: l,
		setWindowFn: (e) => {
			o((t) => {
				e(t), m && (m.offset = t.offset ?? m.offset, m.limit = t.limit ?? m.limit);
			});
		}
	})) : t.pipe(kn(d, {
		limit: s,
		offset: c,
		comparator: f,
		setSizeCallback: p,
		setWindowFn: (e) => {
			o((t) => {
				e(t), m && (m.offset = t.offset ?? m.offset, m.limit = t.limit ?? m.limit);
			});
		}
	}));
}
function ps(e, t) {
	return hs(e, t.compareOptions);
}
function ms(e, t) {
	return e.map((e) => ({
		expression: e.expression,
		compareOptions: hs(e, t)
	}));
}
function hs(e, t) {
	return e.compareOptions.stringSort === void 0 ? {
		...t,
		direction: e.compareOptions.direction,
		nulls: e.compareOptions.nulls
	} : e.compareOptions;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/collection/change-events.js
function gs(e) {
	let t = e.type === "func" && e.name === "and" ? e.args : [e];
	for (let e of t) {
		let t = Co(e, y);
		if (t) return (e) => xo(So(e, t.path)) === t.literalKey;
	}
}
function _s(e, t = {}, i) {
	let a = (n) => {
		let r = [], a = n && i && t.where ? gs(t.where) : void 0, o = a ? i(a) : e.entries();
		for (let [e, t] of o) (n?.(t) ?? !0) && r.push({
			type: "insert",
			key: e,
			value: t
		});
		return r;
	};
	if (t.limit !== void 0 && !t.orderBy) throw Error(n(94));
	if (t.orderBy) {
		let n = t.where ? vs(t.where) : void 0, r = bs(e, t.orderBy, t.limit, n, t.optimizedOnly);
		if (r === void 0) return;
		let i = [];
		for (let t of r) {
			let n = e.get(t);
			n !== void 0 && i.push({
				type: "insert",
				key: t,
				value: n
			});
		}
		return i;
	}
	if (!t.where) return a();
	try {
		let n = t.where, r = za(n, e);
		if (r.canOptimize) {
			let t = r.isExact ? void 0 : vs(n), i = [];
			for (let n of r.matchingKeys) {
				let r = e.get(n);
				r !== void 0 && (t?.(r) ?? !0) && i.push({
					type: "insert",
					key: n,
					value: r
				});
			}
			return i;
		}
		return t.optimizedOnly ? void 0 : a(vs(n));
	} catch (n) {
		console.warn(r(213, { id: e.id }), n);
		let i = vs(t.where);
		return t.optimizedOnly ? void 0 : a(i);
	}
}
function vs(e) {
	let t = va(e);
	return (e) => {
		try {
			return _a(t(e));
		} catch {
			return !1;
		}
	};
}
function ys(e, t) {
	let n = vs(t.whereExpression);
	return (t) => {
		let r = [];
		for (let e of t) if (e.type === "insert") n(e.value) && r.push(e);
		else if (e.type === "update") {
			let t = n(e.value), i = e.previousValue ? n(e.previousValue) : !1;
			t && i ? r.push(e) : t && !i ? r.push({
				...e,
				type: "insert"
			}) : !t && i && r.push({
				...e,
				type: "delete",
				value: e.previousValue
			});
		} else n(e.value) && r.push(e);
		return r.length > 0 || t.length === 0 ? (e(r), !0) : !1;
	};
}
function bs(e, t, n, r, i) {
	if (t.length === 1) {
		let i = t[0], a = i.expression;
		if (a.type === "ref") {
			let t = a.path, o = ps(i, e);
			vo(t[0], t, e, o, Aa);
			let s = Ma(e, t, o, ja);
			if (s) return s.takeFromStart(n ?? s.keyCount, (t) => {
				let n = e.get(t);
				return n === void 0 ? !1 : r?.(n) ?? !0;
			});
		}
	}
	if (i) return;
	let a = [];
	for (let [t, n] of e.entries()) (r?.(n) ?? !0) && a.push({
		key: t,
		value: n
	});
	let o = t.map((t) => ({
		expression: t.expression,
		compare: Ti(ps(t, e))
	}));
	a.sort((e, t) => {
		for (let n of o) {
			let r = xs(e.value, n.expression), i = xs(t.value, n.expression), a = n.compare(r, i);
			if (a !== 0) return a;
		}
		return 0;
	});
	let s = a.map((e) => e.key);
	return n === void 0 ? s : s.slice(0, n);
}
function xs(e, t) {
	if (t.type === "ref") {
		let n = t, r = e;
		for (let e of n.path) r = r?.[e];
		return r;
	}
	return t.type === "val" ? t.value : va(t)(e);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/SortedMap.js
var Ss = class {
	constructor(e) {
		this.d4 = !1, this.cz = 0, this.map = /* @__PURE__ */ new Map(), this.am = [], this.comparator = e;
	}
	indexOf(e, t) {
		let n = 0, r = this.am.length;
		if (!this.comparator) {
			for (; n < r;) {
				let t = Math.floor((n + r) / 2), i = this.am[t], a = le(e, i);
				if (a < 0) r = t;
				else if (a > 0) n = t + 1;
				else return t;
			}
			return n;
		}
		for (; n < r;) {
			let i = Math.floor((n + r) / 2), a = this.am[i], o = this.map.get(a), s = this.comparator(t, o);
			if (s < 0) r = i;
			else if (s > 0) n = i + 1;
			else {
				let t = le(e, a);
				if (t < 0) r = i;
				else if (t > 0) n = i + 1;
				else return i;
			}
		}
		return n;
	}
	restoreOrder() {
		if (this.d4) {
			this.am.length = 0;
			for (let e of this.map.keys()) this.am.push(e);
			this.am.sort((e, t) => (this.comparator?.(this.map.get(e), this.map.get(t)) ?? 0) || le(e, t)), this.d4 = !1;
		}
	}
	set(e, t, n = !1) {
		if (!this.comparator && this.map.has(e)) return this.map.set(e, t), this;
		let r = typeof e != "string" && typeof e != "number";
		if (n && this.cz === 0 && !r) return this.map.set(e, t), this.d4 = !0, this;
		this.restoreOrder();
		let i = this.map.has(e);
		if (i) {
			let t = this.map.get(e), n = this.indexOf(e, t);
			this.am.splice(n, 1);
		}
		let a = this.indexOf(e, t);
		return this.am.splice(a, 0, e), this.map.set(e, t), r && !i && this.cz++, this;
	}
	get(e) {
		return this.map.get(e);
	}
	delete(e, t = !1) {
		if (t && this.cz === 0) {
			let t = this.map.delete(e);
			return this.d4 ||= t, t;
		}
		if (this.restoreOrder(), this.map.has(e)) {
			let t = this.map.get(e), n = this.indexOf(e, t);
			this.am.splice(n, 1);
			let r = this.map.delete(e);
			return r && typeof e != "string" && typeof e != "number" && this.cz--, r;
		}
		return !1;
	}
	has(e) {
		return this.map.has(e);
	}
	clear() {
		this.map.clear(), this.am = [], this.d4 = !1, this.cz = 0;
	}
	get size() {
		return this.map.size;
	}
	*[Symbol.iterator]() {
		this.restoreOrder();
		for (let e of this.am) yield [e, this.map.get(e)];
	}
	entries() {
		return this[Symbol.iterator]();
	}
	keys() {
		return this.restoreOrder(), this.am[Symbol.iterator]();
	}
	*values() {
		this.restoreOrder();
		for (let e of this.am) yield this.map.get(e);
	}
	forEach(e) {
		this.restoreOrder();
		for (let t of this.am) e(this.map.get(t), t, this.map);
	}
};
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/collection/state.js
function Cs(e) {
	return e.metadata !== void 0 && e.type !== "delete" ? {
		type: "set",
		value: e.metadata
	} : e.type === "update" ? void 0 : { type: "delete" };
}
var ws = class {
	constructor(e) {
		this.pendingSyncedTransactions = [], this.a7 = {
			states: /* @__PURE__ */ new Map(),
			truncated: !1
		}, this.syncedMetadata = /* @__PURE__ */ new Map(), this.syncedCollectionMetadata = /* @__PURE__ */ new Map(), this.hydrationSeedKeys = /* @__PURE__ */ new Set(), this.hydratedKeys = /* @__PURE__ */ new Set(), this.b_ = !1, this.optimisticUpserts = /* @__PURE__ */ new Map(), this.optimisticDeletes = /* @__PURE__ */ new Set(), this.isDeferredSyncKey = () => !1, this.heldOptimisticRows = /* @__PURE__ */ new Map(), this.rowOrigins = /* @__PURE__ */ new Map(), this.pendingLocalChanges = /* @__PURE__ */ new Set(), this.pendingLocalOrigins = /* @__PURE__ */ new Set(), this.dE = /* @__PURE__ */ new Map(), this.size = 0, this.preSyncVisibleState = /* @__PURE__ */ new Map(), this.preSyncVirtualState = /* @__PURE__ */ new Map(), this.recentlySyncedKeys = /* @__PURE__ */ new Set(), this.hasReceivedFirstCommit = !1, this.isCommittingSyncTransactions = !1, this.bU = !1, this.syncRunGeneration = 0, this.isLocalOnly = !1, this.commitPendingTransactions = () => {
			if (this.bU) return;
			this.bU = !0;
			let e = !1, t;
			try {
				let n;
				do
					n = this.dG(), n.failure && !e && (e = !0, t = n.failure.error);
				while (n.processed);
			} finally {
				this.bU = !1;
			}
			if (e) throw t;
		}, this.config = e, this.transactions = new Ss((e, t) => e.compareCreatedAt(t)), this.syncedData = new Ss(e.compare);
	}
	setDeps(e) {
		this.collection = e.collection, this.lifecycle = e.lifecycle, this.changes = e.changes, this.indexes = e.indexes, this.a3 = e.events;
	}
	isRowSynced(e) {
		return this.isLocalOnly ? !0 : !this.optimisticUpserts.has(e) && !this.optimisticDeletes.has(e);
	}
	getRowOrigin(e) {
		return this.isLocalOnly || this.optimisticUpserts.has(e) || this.optimisticDeletes.has(e) ? "local" : this.rowOrigins.get(e) ?? "remote";
	}
	bT(e, t) {
		let n = t?.$synced ?? this.isRowSynced(e);
		return {
			$hasPendingWrites: !n,
			$synced: n,
			$origin: t?.$origin ?? this.getRowOrigin(e),
			$key: t?.$key ?? e,
			$collectionId: t?.$collectionId ?? this.collection.id
		};
	}
	ak(e, t) {
		if (this.isLocalOnly) return this.bT(e, {
			$synced: !0,
			$origin: "local"
		});
		let n = t?.optimisticUpserts ?? this.optimisticUpserts, r = t?.optimisticDeletes ?? this.optimisticDeletes, i = n.has(e) || r.has(e);
		return this.bT(e, {
			$synced: !i,
			$origin: i ? "local" : (t?.rowOrigins ?? this.rowOrigins).get(e) ?? "remote"
		});
	}
	et(e) {
		let t = /* @__PURE__ */ new Map();
		for (let n of e) {
			let e = this.rowOrigins.get(n);
			e !== void 0 && t.set(n, e);
		}
		return t;
	}
	aW(e, t) {
		let n = e, r = n.$synced ?? t.$synced, i = n.$origin ?? t.$origin, a = n.$key ?? t.$key, o = n.$collectionId ?? t.$collectionId, s = this.dE.get(a);
		if (s && s.row === e && s.synced === r && s.origin === i && s.collectionId === o) return s.enriched;
		let c = {
			...e,
			$hasPendingWrites: !r,
			$synced: r,
			$origin: i,
			$key: a,
			$collectionId: o
		};
		return this.dE.set(a, {
			row: e,
			synced: r,
			origin: i,
			collectionId: o,
			enriched: c
		}), c;
	}
	dh() {
		this.dE.clear(), this.rowOrigins.clear(), this.pendingLocalChanges.clear(), this.pendingLocalOrigins.clear();
	}
	enrichWithVirtualProps(e, t) {
		return this.aW(e, this.bT(t));
	}
	*entriesPassing(e) {
		let t = this.optimisticUpserts.size === 0 && this.optimisticDeletes.size === 0 ? this.syncedData : this.entries();
		for (let [n, r] of t) e(r) && (yield [n, this.enrichWithVirtualProps(r, n)]);
	}
	enrichChangeMessage(e) {
		let { __virtualProps: t } = e, n = e.previousValue ? t?.previousValue ? this.aW(e.previousValue, t.previousValue) : this.enrichWithVirtualProps(e.previousValue, e.key) : void 0, r = t?.value ? this.aW(e.value, t.value) : this.enrichWithVirtualProps(e.value, e.key);
		return e.type === "delete" && this.dE.delete(e.key), {
			key: e.key,
			type: e.type,
			value: r,
			previousValue: n,
			metadata: e.metadata
		};
	}
	getWithVirtualProps(e) {
		let t = this.get(e);
		if (t !== void 0) return this.enrichWithVirtualProps(t, e);
	}
	get(e) {
		let { optimisticDeletes: t, optimisticUpserts: n, syncedData: r } = this;
		if (!t.has(e)) return n.has(e) ? n.get(e) : r.get(e);
	}
	has(e) {
		let { optimisticDeletes: t, optimisticUpserts: n, syncedData: r } = this;
		return t.has(e) ? !1 : n.has(e) ? !0 : r.has(e);
	}
	*keys() {
		let { syncedData: e, optimisticDeletes: t, optimisticUpserts: n } = this;
		for (let n of e.keys()) t.has(n) || (yield n);
		for (let r of n.keys()) !e.has(r) && !t.has(r) && (yield r);
	}
	*values() {
		for (let e of this.keys()) {
			let t = this.get(e);
			t !== void 0 && (yield t);
		}
	}
	*entries() {
		for (let e of this.keys()) {
			let t = this.get(e);
			t !== void 0 && (yield [e, t]);
		}
	}
	*[Symbol.iterator]() {
		for (let [e, t] of this.entries()) yield [e, t];
	}
	forEach(e) {
		let t = 0;
		for (let [n, r] of this.entries()) e(r, n, t++);
	}
	map(e) {
		let t = [], n = 0;
		for (let [r, i] of this.entries()) t.push(e(i, r, n++));
		return t;
	}
	aP(e) {
		return e === this.collection;
	}
	setDeferredSyncKeys(e) {
		this.isDeferredSyncKey = e;
	}
	recomputeOptimisticState(e = !1) {
		if (this.isCommittingSyncTransactions && !e) return;
		let t = new Map(this.optimisticUpserts), n = new Set(this.optimisticDeletes), r = this.rowOrigins, i = /* @__PURE__ */ new Set();
		for (let e of this.pendingSyncedTransactions) if (e.committed) for (let t of e.operations) i.add(t.key);
		let a = (e) => i.has(e) || this.isDeferredSyncKey(e);
		for (let e of this.transactions.values()) if (e.state === "completed") for (let t of e.mutations) {
			if (!this.aP(t.collection) || !a(t.key) || (this.pendingLocalOrigins.add(t.key), !t.optimistic)) continue;
			let n = this.heldOptimisticRows.get(t.key);
			n && n.owner.compareCreatedAt(e) > 0 || this.heldOptimisticRows.set(t.key, {
				owner: e,
				row: t.type === "delete" ? void 0 : t.modified
			});
		}
		this.optimisticUpserts.clear(), this.optimisticDeletes.clear(), this.pendingLocalChanges.clear(), this.overlayHeldAndActive(a), this.size = this.e1();
		let o = [];
		this.ey(t, n, r, o);
		let s = e ? o : o.filter((e) => !this.recentlySyncedKeys.has(e.key));
		s.length > 0 && this.indexes.updateIndexes(s), this.changes.emitEvents(s, e);
	}
	trackTransaction(e) {
		let t = this.transactions.get(e.id);
		if (t === e) return !1;
		if (t && t.state !== "completed" && t.state !== "failed") throw new dr(e.id);
		return this.transactions.set(e.id, e), e.collections.add(this.collection), !0;
	}
	overlayHeldAndActive(e) {
		if (e) {
			for (let t of this.heldOptimisticRows.keys()) e(t) || this.heldOptimisticRows.delete(t);
			for (let t of this.pendingLocalOrigins) e(t) || this.pendingLocalOrigins.delete(t);
		}
		for (let [e, { row: t }] of this.heldOptimisticRows) t === void 0 ? this.optimisticDeletes.add(e) : this.optimisticUpserts.set(e, t);
		this.gl();
	}
	gl() {
		let e = [];
		for (let [t, n] of this.transactions) if (n.state === "completed" || n.state === "failed") e.push(t);
		else for (let e of n.mutations) this.aP(e.collection) && (this.pendingLocalChanges.add(e.key), e.optimistic && (e.type === "delete" ? (this.optimisticUpserts.delete(e.key), this.optimisticDeletes.add(e.key)) : (this.optimisticUpserts.set(e.key, e.modified), this.optimisticDeletes.delete(e.key))));
		for (let t of e) this.transactions.delete(t);
	}
	e1() {
		let e = this.syncedData.size, t = Array.from(this.optimisticDeletes).filter((e) => this.syncedData.has(e) && !this.optimisticUpserts.has(e)).length, n = Array.from(this.optimisticUpserts.keys()).filter((e) => !this.syncedData.has(e)).length;
		return e - t + n;
	}
	ey(e, t, n, r) {
		let i = /* @__PURE__ */ new Set([
			...e.keys(),
			...this.optimisticUpserts.keys(),
			...t,
			...this.optimisticDeletes
		]);
		for (let a of i) {
			let i = this.get(a), o = this.fs(a, e, t), s = this.ak(a, {
				rowOrigins: n,
				optimisticUpserts: e,
				optimisticDeletes: t
			}), c = this.ak(a);
			o !== void 0 && i === void 0 ? r.push({
				type: "delete",
				key: a,
				value: o,
				__virtualProps: { value: s }
			}) : o === void 0 && i !== void 0 ? r.push({
				type: "insert",
				key: a,
				value: i,
				__virtualProps: { value: c }
			}) : o === void 0 || i === void 0 || W(o, i) && s.$origin === c.$origin && s.$synced === c.$synced || r.push({
				type: "update",
				key: a,
				value: i,
				previousValue: o,
				__virtualProps: {
					value: c,
					previousValue: s
				}
			});
		}
	}
	createSyncedKeyLookup() {
		if (this.pendingSyncedTransactions.length === 0) return (e) => this.syncedData.has(e);
		let e = /* @__PURE__ */ new Map(), t = !1;
		for (let n of this.pendingSyncedTransactions) if (n.committed) {
			n.truncate && (e.clear(), t = !0);
			for (let t of n.operations) e.set(t.key, t.type !== "delete");
		}
		return (n) => e.get(n) ?? (!t && this.syncedData.has(n));
	}
	enableHydrationAuthorityTracking() {
		this.ar ??= /* @__PURE__ */ new Set();
	}
	createAdapterAuthorityLookup() {
		let e = /* @__PURE__ */ new Set(), t = !1;
		for (let n of this.pendingSyncedTransactions) if (n.committed && !n.preserveHydrationSeedKeys) {
			n.truncate && (t = !0);
			for (let t of n.operations) e.add(t.key);
		}
		return (n) => this.b_ || t || e.has(n) || this.ar?.has(n) === !0 || this.syncedData.has(n) && !this.hydrationSeedKeys.has(n);
	}
	bj(e, t) {
		let n = e.states.get(t);
		return n === void 0 ? e.truncated ? {
			exists: !1,
			value: void 0
		} : {
			exists: this.syncedData.has(t),
			value: this.syncedData.get(t)
		} : n;
	}
	getAcceptedSyncedRow(e) {
		return this.bj(this.a7, e).value;
	}
	acceptSeedTransaction(e) {
		let t = this.pendingSyncedTransactions.findIndex((e) => !e.committed);
		t === -1 ? this.pendingSyncedTransactions.push(e) : this.pendingSyncedTransactions.splice(t, 0, e), this.refreshPendingSyncedProjection(), this.commitPendingTransactions();
	}
	hasOpenSyncTransaction() {
		return this.pendingSyncedTransactions.at(-1)?.committed === !1;
	}
	hasHeldSyncTransaction() {
		return this.pendingSyncedTransactions.some((e) => e.committed);
	}
	*acceptedSyncedEntries() {
		let { states: e, truncated: t } = this.a7;
		if (!t) for (let t of this.syncedData.entries()) e.has(t[0]) || (yield t);
		for (let [t, n] of e) n.exists && (yield [t, n.value]);
	}
	dt(e, t, n) {
		let r = this.bj(e, t);
		return r.exists ? r.value !== void 0 && W(r.value, n) || this.hydrationSeedKeys.has(t) ? "update" : "duplicate" : "insert";
	}
	classifyPendingSyncedInsert(e, t) {
		return this.dt(this.a7, e, t);
	}
	c1(e, t) {
		let n = t.key, r = this.config.sync.rowUpdateMode || "partial";
		if (t.type === "delete") e.states.set(n, {
			exists: !1,
			value: void 0
		});
		else if (t.type === "update" && r === "partial") {
			let r = this.bj(e, n);
			e.states.set(n, {
				exists: !0,
				value: {
					...r.value,
					...t.value
				}
			});
		} else e.states.set(n, {
			exists: !0,
			value: t.value
		});
	}
	stagePendingSyncOperation(e) {
		this.c1(this.a7, e);
	}
	fs(e, t, n) {
		if (!n.has(e)) return t.has(e) ? t.get(e) : this.syncedData.get(e);
	}
	dJ(e) {
		let t = e.explicitRowMetadataWrites, n = e.rowMetadataWrites;
		for (let t of e.operations) n.delete(t.key);
		for (let [e, r] of t) n.set(e, r.write);
		e.operations.forEach((e, r) => {
			let i = e.key;
			if (r < (t.get(i)?.position ?? 0)) return;
			let a = Cs(e);
			a && n.set(i, a);
		});
	}
	bA() {
		let e = {
			states: /* @__PURE__ */ new Map(),
			truncated: !1
		};
		for (let t of this.pendingSyncedTransactions) {
			if (t.invalidationError !== void 0) continue;
			let n = new Map(e.states), r = e.truncated;
			t.truncate && (e.states = /* @__PURE__ */ new Map(), e.truncated = !0);
			let i;
			for (let n of t.operations) {
				let t = n.key;
				if (n.originalSyncType === "insert" && n.type !== "delete") {
					let r = this.dt(e, t, n.value);
					if (r === "duplicate") {
						i = t;
						break;
					}
					n.type = r;
				}
				this.c1(e, n);
			}
			if (i !== void 0) {
				if (t.committed) throw new vr("replay made an accepted insert a duplicate");
				e.states = n, e.truncated = r, t.invalidationError = t.duplicateKeyError?.(i) ?? new ei();
			} else this.dJ(t);
		}
		this.a7 = e;
	}
	refreshPendingSyncedProjection() {
		this.bA();
	}
	hasPersistingTransaction() {
		for (let e of this.transactions.values()) if (e.state === "persisting") return !0;
		return !1;
	}
	dG() {
		let e = this.syncRunGeneration, t = this.hasPersistingTransaction(), n = [], r = [], i = !1, a = !1, o = !1;
		for (let e of this.pendingSyncedTransactions) e.committed ? (n.push(e), o ||= e.layoutChanged, e.truncate && (i = !0, a = e.truncateMarkReady !== !1)) : r.push(e);
		if (n.length === 0) return { processed: !1 };
		if (!t || i) {
			let t = o ? [...this.keys()] : void 0;
			this.pendingSyncedTransactions = r;
			let s = n.reduce((e, t) => e + t.operations.length, 0) >= 512;
			for (let e of n) e.applicationStarted = !0;
			this.isCommittingSyncTransactions = !0;
			let c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Map();
			for (let e of n) {
				for (let t of e.operations) {
					let e = t.key;
					c.add(e), u.has(e) || u.set(e, t), t.type !== "delete" && l.add(e);
				}
				for (let [t] of e.rowMetadataWrites) c.add(t);
			}
			let d = this.et(c), f = new Map(this.optimisticUpserts), p = new Set(this.optimisticDeletes), m = this.preSyncVisibleState;
			if (m.size === 0) {
				m = /* @__PURE__ */ new Map();
				for (let e of c) {
					let t = this.get(e);
					t !== void 0 && m.set(e, t);
				}
			}
			let h = [], g;
			if (i) for (let [e, t] of this.entries()) h.push({
				type: "delete",
				key: e,
				value: this.aW(t, this.ak(e))
			});
			let _ = this.config.sync.rowUpdateMode || "partial";
			for (let e of n) {
				if (e.truncate) {
					this.syncedData.clear(), this.syncedMetadata.clear(), this.hydrationSeedKeys.clear(), this.hydratedKeys.clear(), !e.preserveHydrationSeedKeys && this.ar && (this.b_ = !0, this.ar.clear()), this.dE.clear(), this.rowOrigins.clear(), this.pendingLocalOrigins.clear();
					for (let e of c) m.delete(e);
					this.a3.emit("truncate", {
						type: "truncate",
						collection: this.collection
					});
				}
				let t = /* @__PURE__ */ new Set();
				for (let n of e.operations) {
					let r = n.key, i = this.isLocalOnly || this.pendingLocalChanges.has(r) || this.pendingLocalOrigins.has(r) || t.has(r) ? "local" : "remote";
					i === "local" && t.add(r), this.dE.delete(r), n.type === "delete" ? (this.syncedData.delete(r, s), this.syncedMetadata.delete(r), this.rowOrigins.delete(r)) : (this.syncedData.set(r, n.type === "update" && _ === "partial" ? {
						...this.syncedData.get(r),
						...n.value
					} : n.value, s), this.rowOrigins.set(r, i)), this.pendingLocalChanges.delete(r), this.pendingLocalOrigins.delete(r), this.isDeferredSyncKey(r) || this.heldOptimisticRows.delete(r), e.preserveHydrationSeedKeys || (this.hydrationSeedKeys.delete(r), this.hydratedKeys.delete(r), n.type === "delete" ? this.ar?.add(r) : this.ar?.delete(r));
				}
				for (let [t, n] of e.rowMetadataWrites) n.type === "delete" ? this.syncedMetadata.delete(t) : this.syncedMetadata.set(t, n.value);
				for (let [t, n] of e.collectionMetadataWrites) n.type === "delete" ? this.syncedCollectionMetadata.delete(t) : this.syncedCollectionMetadata.set(t, n.value);
			}
			if (this.syncedData.restoreOrder(), this.refreshPendingSyncedProjection(), this.optimisticUpserts.clear(), this.optimisticDeletes.clear(), this.isCommittingSyncTransactions = !1, this.overlayHeldAndActive(), i) {
				for (let [e, t] of this.optimisticUpserts) h.push({
					type: "insert",
					key: e,
					value: t
				});
				g = new Set(this.optimisticUpserts.keys());
			}
			for (let e of c) {
				if (g?.has(e)) continue;
				let t = u.get(e), n = t?.type === "update" && m.get(e) === t.value ? t.previousValue : void 0, r = !i && !f.has(e) && !p.has(e) && n !== void 0 ? n : m.get(e), a = this.get(e), o = this.preSyncVirtualState.get(e) ?? this.ak(e, {
					rowOrigins: d,
					optimisticUpserts: f,
					optimisticDeletes: p
				}), s = this.ak(e), c = o.$synced !== s.$synced || o.$origin !== s.$origin, l = (t) => Ea(t, e, this.collection.id, () => o.$synced, () => o.$origin);
				if (r === void 0) {
					if (a === void 0) continue;
					h.push({
						type: "insert",
						key: e,
						value: a
					});
				} else a === void 0 ? h.push({
					type: "delete",
					key: e,
					value: l(r)
				}) : (c || !W(r, a)) && h.push({
					type: "update",
					key: e,
					value: a,
					previousValue: l(r)
				});
			}
			this.size = this.e1(), h.length > 0 && this.indexes.updateIndexes(h);
			let v, y = (e) => {
				try {
					e();
				} catch (e) {
					v ??= { error: e };
				}
			}, b = t !== void 0 && (t.length !== this.size || [...this.keys()].some((e, n) => e !== t[n])), x = !1, S = () => {
				x = !0, y(() => this.changes.emitEvents(h, !0, b));
			};
			a && this.lifecycle.status !== "ready" && y(() => this.lifecycle.markReady(S)), x || S(), this.syncRunGeneration === e && (this.preSyncVisibleState.clear(), this.preSyncVirtualState.clear(), Promise.resolve().then(() => {
				this.syncRunGeneration === e && this.recentlySyncedKeys.clear();
			}), this.hasReceivedFirstCommit = !0);
			for (let e of n) e.applied.resolve();
			return {
				processed: !0,
				failure: v
			};
		}
		return { processed: !1 };
	}
	cancelPendingSyncedTransaction(e, t = new ei()) {
		if (e.committed || this.pendingSyncedTransactions.at(-1) !== e) throw new vr("only the open last sync transaction can be canceled");
		this.pendingSyncedTransactions.pop();
		let n = /* @__PURE__ */ new Set();
		for (let t of e.operations) n.add(t.key);
		e.applied.reject(t), this.bA();
		let r = /* @__PURE__ */ new Set();
		for (let e of this.pendingSyncedTransactions) if (e.invalidationError === void 0) for (let t of e.operations) r.add(t.key);
		for (let e of n) r.has(e) || (this.recentlySyncedKeys.delete(e), this.preSyncVisibleState.delete(e), this.preSyncVirtualState.delete(e));
		this.pendingSyncedTransactions.length === 0 ? (this.preSyncVisibleState.clear(), this.preSyncVirtualState.clear(), this.recentlySyncedKeys.clear(), this.changes.emitEvents([], !0)) : this.recomputeOptimisticState(!1);
	}
	capturePreSyncVisibleState() {
		if (this.pendingSyncedTransactions.length === 0) return;
		let e = /* @__PURE__ */ new Set();
		for (let t of this.pendingSyncedTransactions) if (t.committed) {
			for (let n of t.operations) e.add(n.key);
			for (let n of t.rowMetadataWrites.keys()) e.add(n);
		}
		for (let t of e) this.recentlySyncedKeys.add(t);
		for (let t of e) if (!this.preSyncVisibleState.has(t)) {
			let e = this.get(t);
			this.preSyncVisibleState.set(t, e), e !== void 0 && this.preSyncVirtualState.set(t, this.ak(t));
		}
	}
	onTransactionStateChange() {
		let e = this.hasPersistingTransaction();
		this.changes.shouldBatchEvents = this.pendingSyncedTransactions.some((t) => t.committed && (!e || t.truncate)), this.changes.shouldBatchEvents && this.capturePreSyncVisibleState(), this.recomputeOptimisticState(!1);
	}
	cleanup() {
		this.syncRunGeneration++;
		for (let e of this.pendingSyncedTransactions) e.applied.reject(new ei());
		this.syncedData.clear(), this.syncedMetadata.clear(), this.syncedCollectionMetadata.clear(), this.optimisticUpserts.clear(), this.optimisticDeletes.clear(), this.heldOptimisticRows.clear(), this.hydrationSeedKeys.clear(), this.hydratedKeys.clear(), this.ar?.clear(), this.b_ = !1, this.dh(), this.isLocalOnly = !1, this.localOnlyDirectWrite = void 0, this.size = 0, this.pendingSyncedTransactions = [], this.a7 = {
			states: /* @__PURE__ */ new Map(),
			truncated: !1
		}, this.preSyncVisibleState.clear(), this.preSyncVirtualState.clear(), this.recentlySyncedKeys.clear(), this.hasReceivedFirstCommit = !1;
	}
}, Ts = new class {
	constructor() {
		this.fW = /* @__PURE__ */ new Map();
	}
	fg(e) {
		let t = this.fW.get(e);
		return t || (t = {
			queue: [],
			jobs: /* @__PURE__ */ new Map(),
			dependencies: /* @__PURE__ */ new Map()
		}, this.fW.set(e, t)), t;
	}
	schedule({ contextId: e, jobId: t, dependencies: n, run: r }) {
		if (e === void 0) {
			r();
			return;
		}
		let i = this.fg(e);
		if (i.jobs.has(t) || i.queue.push(t), i.jobs.set(t, r), n) {
			let e = new Set(n);
			e.delete(t), i.dependencies.set(t, e);
		} else i.dependencies.has(t) || i.dependencies.set(t, /* @__PURE__ */ new Set());
	}
	flush(e) {
		let t = this.fW.get(e);
		if (!t) return;
		let { queue: r, jobs: i, dependencies: a } = t;
		for (; r.length > 0;) {
			let t = !1, o = r.length;
			for (let e = 0; e < o; e++) {
				let e = r.shift(), n = i.get(e);
				if (!n) {
					a.delete(e);
					continue;
				}
				let o = a.get(e), s = !o;
				if (o) {
					s = !0;
					for (let t of o) if (t !== e && i.has(t)) {
						s = !1;
						break;
					}
				}
				s ? (i.delete(e), a.delete(e), n(), t = !0) : r.push(e);
			}
			if (!t) throw Error(n(161, { contextId: e }));
		}
		this.fW.delete(e);
	}
	clear(e) {
		this.fW.delete(e);
	}
}(), Es, Ds;
function Os() {
	return Ds;
}
function ks() {
	return Es;
}
function As(e) {
	if (Es === void 0) throw e;
	Ds ??= { error: e };
}
function js(e) {
	if (Es !== void 0) return e();
	let t = /* @__PURE__ */ Symbol("collection-publication");
	Es = t, Ds = void 0;
	let n, r;
	try {
		n = e(), Ts.flush(t), r = Os();
	} catch (e) {
		try {
			Ts.clear(t);
		} catch {}
		let n = Os();
		throw n ? n.error : e;
	} finally {
		Es = void 0, Ds = void 0;
	}
	if (r) throw r.error;
	return n;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/callbacks.js
function Ms(e) {
	let t;
	for (let n of e) try {
		n();
	} catch (e) {
		t ??= { error: e };
	}
	if (t) throw t.error;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live/internal.js
var Ns = /* @__PURE__ */ Symbol("liveQueryInternal"), Ps = /* @__PURE__ */ new WeakMap();
function Fs(e) {
	return e.utils?.[Ns]?.getBuilder?.();
}
function Is(e, t) {
	Ps.set(e, t);
}
function Ls(e) {
	return Ps.get(e);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/event-emitter.js
var Rs = class {
	constructor() {
		this.listeners = /* @__PURE__ */ new Map(), this.e4 = /* @__PURE__ */ new WeakMap();
	}
	on(e, t) {
		this.listeners.has(e) || this.listeners.set(e, /* @__PURE__ */ new Map());
		let n = this.listeners.get(e), r = t, i = n.get(r);
		return i || (i = {}, n.set(r, i)), () => {
			let t = this.listeners.get(e);
			t?.get(r) === i && t.delete(r);
		};
	}
	once(e, t) {
		let n = () => {}, r = (e) => {
			n(), t(e);
		};
		return this.e4.set(r, t), n = this.on(e, r), n;
	}
	off(e, t) {
		let n = this.listeners.get(e);
		if (n) for (let e of n.keys()) (e === t || this.e4.get(e) === t) && n.delete(e);
	}
	waitFor(e, t) {
		return new Promise((r, i) => {
			let a, o = this.on(e, (e) => {
				a &&= (clearTimeout(a), void 0), r(e), o();
			});
			t && (a = setTimeout(() => {
				a = void 0, o(), i(Error(n(98, { event: e })));
			}, t));
		});
	}
	emitInner(e, t) {
		this.emitInnerWhile(e, t, () => !0);
	}
	emitInnerWhile(e, t, n) {
		let r = this.listeners.get(e);
		if (r) for (let [i, a] of [...r]) {
			if (!n()) break;
			if (this.listeners.get(e)?.get(i) === a) try {
				i(t);
			} catch (e) {
				queueMicrotask(() => {
					throw e;
				});
			}
		}
	}
	clearListeners() {
		this.listeners.clear();
	}
};
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/cursor.js
function zs(e) {
	return io(so(e), oo(e));
}
function Bs(e, t) {
	let n = zs(e.expression);
	if (t == null) return e.compareOptions.nulls === "first" ? ao(n) : new b(!1);
	let r = (e.compareOptions.direction === "asc" ? eo : no)(e.expression, new b(t));
	return e.compareOptions.nulls === "last" ? io(r, n) : r;
}
function Vs(e, t) {
	if (t.length !== 0) {
		if (e.length === 0 || t.length !== 1) throw Error(n(169));
		return Bs(e[0], t[0]);
	}
}
function Hs(e, t) {
	let { expression: n } = e[0] ?? {};
	if (!n || t.length === 0) return;
	let r = t[0];
	if (r == null) return zs(n);
	if (r instanceof Date) return Number.isFinite(r.getTime()) ? ro(to(n, new b(r)), no(n, new b(new Date(r.getTime() + 1)))) : void 0;
	if (typeof r != "object") return $a(n, new b(r));
}
function Us(e, t) {
	if (e.length === 0 || t.length !== 1) return !1;
	let n = t[0];
	return n == null ? !1 : n instanceof Date ? Number.isFinite(n.getTime()) : typeof n == "string" ? e[0].compareOptions.stringSort === "lexical" : typeof n == "number" && Number.isFinite(n) || typeof n == "bigint" || typeof n == "boolean";
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/error.js
var Ws = (e) => {
	try {
		return e instanceof Error ? e : Error(String(e));
	} catch {
		return Error(n(170));
	}
};
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/deferred.js
function Gs() {
	let e, t, n = !0;
	return {
		promise: new Promise((r, i) => {
			e = (e) => {
				n = !1, r(e);
			}, t = (e) => {
				n = !1, i(e);
			};
		}),
		resolve: e,
		reject: t,
		isPending: () => n
	};
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/collection/subscription.js
function Ks() {
	let e = Gs();
	return e.promise.catch(() => {}), e;
}
function qs(e) {
	e.abortController?.abort(), e.removeRequestAbortListener?.();
}
var Js = class extends Rs {
	constructor(e, t, n) {
		super(), this.collection = e, this.callback = t, this.options = n, this.loadedInitialState = !1, this.ej = !1, this.snapshotSent = !1, this.C = [], this.bf = 0, this.d8 = /* @__PURE__ */ new WeakMap(), this.aC = /* @__PURE__ */ new Set(), this.ac = /* @__PURE__ */ new Map(), this.ad = /* @__PURE__ */ new Map(), this.fk = "ready", this.aV = 0, this.aq = /* @__PURE__ */ new Set(), this.dx = /* @__PURE__ */ new WeakMap(), this.aR = !1, this.unsubscribed = !1, this.c_ = n.deferAcquisition === !0, n.onUnsubscribe && this.on("unsubscribed", n.onUnsubscribe), n.onLoadSubsetError && this.on("loadSubset:error", n.onLoadSubsetError), n.whereExpression && yo(n.whereExpression, this.collection);
		let r = (e) => {
			this.fj(e), this.e9(e), t(e);
		};
		this.callback = r, this.dN = n.whereExpression ? ys(this.callback, n) : (e) => (this.callback(e), !0), this.ec = this.collection.on("truncate", () => {
			this.fC();
		}), this.dB = this.collection._onCleanupStart(() => {
			this.eE();
		}), this.cb = this.collection.on("status:change", ({ status: e }) => {
			if (e !== "loading" && e !== "ready") return;
			let t = this.collection._sync.getSyncRunGeneration(), n = this.o;
			this.C.some((e) => e.acquisitionState === "detached") && this.setStatus("loadingSubset"), queueMicrotask(() => {
				this.o === n && this.eM(t);
			});
		});
	}
	get status() {
		return this.fk;
	}
	get lastError() {
		return this.fu;
	}
	isDeferringAcquisition() {
		return this.c_;
	}
	resumeDeferredAcquisition() {
		this.c_ && !this.unsubscribed && (this.options.onResumeAcquisition?.(), this.c_ = !1, this.collection.status !== "idle" && this.eM(this.collection._sync.getSyncRunGeneration()));
	}
	eE() {
		this.bP(), this.ad = new Map(this.ac), this.aq.clear();
		for (let e of [...this.C]) if (e.initialResult?.reject(new ni()), qs(e.acquisition), e.acquisitionState === "starting") {
			let t = this.C.indexOf(e);
			t !== -1 && this.C.splice(t, 1);
		} else e.acquisitionState = "detached", e.acquisition = {
			options: e.requestOptions,
			syncRunGeneration: e.acquisition.syncRunGeneration
		};
		this.b9();
	}
	eM(e) {
		if (this.unsubscribed || this.c_ || !this.Z(e)) return;
		if (this.collection.status === "error" || this.collection.config.syncMode === "on-demand" && this.collection._sync.syncLoadSubsetFn === null) {
			this.b9();
			return;
		}
		let t = this.C.filter((e) => e.acquisitionState === "detached" && !e.requestOptions.signal?.aborted);
		if (t.length === 0) {
			this.b9();
			return;
		}
		if (this.collection.config.syncMode !== "on-demand" && this.collection.status !== "ready") return;
		let n = this.c4(e, () => {
			let e = this.collection.currentStateAsChanges({ optimizedOnly: !1 });
			return new Map((e ?? []).filter((e) => e.type !== "delete").map((e) => [e.key, e.value]));
		}), r = n.currentAttempt;
		this.o = n, this.setStatus("loadingSubset"), this.o === n && this.cX(n, r, t);
	}
	fC() {
		let e = this.collection.config.syncMode === "on-demand" && this.collection._sync.syncLoadSubsetFn !== null && !this.c_ ? [...this.C] : [];
		if (e.length === 0 && this.ad.size === 0) {
			this.dU();
			return;
		}
		let t = this.o;
		t ? (t.completion.isPending() || (t.completion = Ks()), t.pendingSetups++, t.failures.clear(), t.failed = !1, t.currentAttempt = {
			pendingCount: 0,
			setupComplete: !1
		}) : (t = this.c4(this.collection._sync.getSyncRunGeneration(), () => new Map(this.ac)), this.o = t);
		let n = t.currentAttempt;
		if (this.setStatus("loadingSubset"), this.o === t) {
			this.options.truncateReplayPublication && (this.aR = !0, this.options.truncateReplayPublication.start());
			for (let t of e) t.acquisition.abortController?.abort();
			this.dU(), queueMicrotask(() => {
				this.o === t && (this.Z(t.syncRunGeneration) ? this.cX(t, n, t.currentAttempt === n ? e : []) : this.c8(t));
			});
		}
	}
	eu(e, t, n) {
		let r = () => this.o === e && e.currentAttempt === t, i = () => r() && this.Z(e.syncRunGeneration) && this.a4(n), a = (t) => {
			i() && (e.failures.set(n, Ws(t)), e.failed = !0);
		};
		n.initialResult && e.completion.promise.then(n.initialResult.resolve, n.initialResult.reject);
		let o = n.acquisition, s = n.acquisitionState === "active";
		if (n.acquisitionState = "detached", s) try {
			this.al(o);
		} catch (e) {
			a(e);
			return;
		}
		if (!i() || n.requestOptions.signal?.aborted) return;
		let c = this.cF(n);
		n.acquisition = c, n.acquisitionState = "starting";
		let l;
		try {
			l = this.loadSubset(c.options, i);
		} catch (e) {
			n.acquisition === c && (n.acquisitionState = "detached"), qs(c), a(e);
			return;
		}
		if (i()) n.acquisitionState = "active", this.cB(e, t, n, l), this.co(l, n, c.options, !0, () => i() && !c.options.signal?.aborted);
		else {
			n.acquisition === c && (n.acquisitionState = "detached");
			try {
				this.al(c);
			} catch (e) {
				a(e);
			}
		}
	}
	ea(e, t) {
		try {
			if (this.o !== e) return;
			if (!this.Z(e.syncRunGeneration)) {
				this.c8(e);
				return;
			}
			e.pending.delete(t) && t.attempt.pendingCount--, this.bJ(e);
		} catch (e) {
			queueMicrotask(() => {
				throw e;
			});
		}
	}
	cB(e, t, n, r) {
		if (this.o !== e || e.currentAttempt !== t && t.setupComplete && t.pendingCount === 0 || !(r instanceof Promise)) return;
		let i = {
			demand: n,
			attempt: t
		};
		t.pendingCount++, e.pending.add(i), r.then(() => this.ea(e, i), (a) => {
			if (this.o === e && e.currentAttempt === t && this.Z(e.syncRunGeneration) && this.C.includes(n)) {
				let t = this.cl(r, a);
				e.failures.set(n, t), e.failed = !0;
			}
			this.ea(e, i);
		});
	}
	dX(e) {
		let t = this.o;
		if (t) {
			t.failures.delete(e);
			for (let n of t.pending) n.demand === e && (t.pending.delete(n), n.attempt.pendingCount--);
		}
	}
	bJ(e) {
		if (this.o !== e || e.pendingSetups > 0 || e.pending.size > 0) return;
		let t = [...e.failures].find(([e]) => this.C.includes(e));
		try {
			t ? this.eP(e, t[1]) : this.fb(e);
		} finally {
			this.b9();
		}
	}
	eP(e, t) {
		if (this.o !== e || (e.completion.reject(t), !e.privateRows)) return;
		let n = e.publicationState;
		this.loadedInitialState = n.loadedInitialState, this.snapshotSent = n.snapshotSent;
	}
	fb(e) {
		if (this.o === e) {
			this.o = void 0, this.aR = !1;
			try {
				this.gy(e.privateRows);
			} finally {
				e.completion.resolve(), this.options.truncateReplayPublication?.succeed();
			}
		}
	}
	gy(e) {
		for (let t of this.ad.keys()) e?.delete(t);
		this.ad.clear();
		try {
			if (e) {
				let t = this.fx(this.ac, e);
				t.length > 0 && this.dN(t);
			}
		} finally {
			this.cg();
		}
	}
	cg() {
		this.aC = new Set(this.ac.keys());
	}
	eG(e) {
		let t = this.o?.privateRows;
		if (!t) return !1;
		for (let n of e) n.type === "delete" ? t.delete(n.key) : t.set(n.key, n.value);
		return !0;
	}
	fx(e, t) {
		let n = [];
		for (let [r, i] of e) {
			let e = t.get(r);
			e === void 0 ? n.push({
				type: "delete",
				key: r,
				value: i
			}) : W(e, i) || n.push({
				type: "update",
				key: r,
				value: e,
				previousValue: i
			});
		}
		for (let [r, i] of t) e.has(r) || n.push({
			type: "insert",
			key: r,
			value: i
		});
		return n;
	}
	get fS() {
		return this.o !== void 0;
	}
	b9() {
		let e = this.o, t = e && (e.pendingSetups > 0 || e.pending.size > 0);
		this.aq.size === 0 && !t && this.setStatus("ready");
	}
	Z(e) {
		return e === this.collection._sync.getSyncRunGeneration();
	}
	c8(e) {
		this.o === e && (this.bP(), this.ad.clear());
	}
	bP() {
		let e = this.o;
		e?.completion.isPending() && e.completion.reject(new ni()), this.o = void 0, this.aR = !1;
	}
	dU() {
		this.snapshotSent = !1, this.loadedInitialState = !1;
	}
	c4(e, t) {
		return {
			syncRunGeneration: e,
			publicationState: {
				loadedInitialState: this.loadedInitialState,
				snapshotSent: this.snapshotSent
			},
			privateRows: this.options.truncateReplayPublication ? void 0 : t(),
			pending: /* @__PURE__ */ new Set(),
			pendingSetups: 1,
			currentAttempt: {
				pendingCount: 0,
				setupComplete: !1
			},
			failures: /* @__PURE__ */ new Map(),
			failed: !1,
			completion: Ks()
		};
	}
	cX(e, t, n) {
		for (let r of n) if (this.C.includes(r) && (this.eu(e, t, r), this.o !== e || e.currentAttempt !== t)) break;
		t.setupComplete = !0, e.pendingSetups--, this.bJ(e);
	}
	get hasPendingTruncateReplacement() {
		return this.aR;
	}
	get hasHeldSyncTransaction() {
		return this.collection._hasHeldSyncTransaction();
	}
	get pendingTruncateReplacement() {
		let e = this.o?.completion;
		return e?.isPending() ? e.promise : void 0;
	}
	get hasFailedTruncateReplacement() {
		let e = this.o?.completion;
		return this.aR && e !== void 0 && !e.isPending();
	}
	setOrderByIndex(e) {
		this.orderByIndex = e;
	}
	setStatus(e) {
		if (this.unsubscribed || this.fk === e) return;
		let t = this.fk;
		this.fk = e;
		let n = ++this.aV;
		if (this.emitInnerWhile("status:change", {
			type: "status:change",
			subscription: this,
			previousStatus: t,
			status: e
		}, () => this.aV === n), this.aV !== n) return;
		let r = `status:${e}`;
		this.emitInnerWhile(r, {
			type: r,
			subscription: this,
			previousStatus: t,
			status: e
		}, () => this.aV === n);
	}
	co(e, t, n, r, i = () => !0) {
		if (!(e instanceof Promise)) return;
		let a = this.collection._sync.getSyncRunGeneration(), o = {
			demand: t,
			promise: e
		};
		r && (this.aq.add(o), this.setStatus("loadingSubset"));
		let s = () => {
			r && (this.aq.delete(o), this.Z(a) && this.b9());
		};
		e.then(s, (t) => {
			this.Z(a) && i() && this.bR(n, this.cl(e, t)), s();
		});
	}
	cl(e, t) {
		let n = this.dx.get(e);
		if (n) return n;
		let r = Ws(t);
		return this.dx.set(e, r), r;
	}
	cO(e) {
		for (let t of this.aq) t.demand === e && this.aq.delete(t);
		this.b9();
	}
	loadSubset(e, t = () => !0) {
		try {
			return this.collection._sync.loadSubset(e);
		} catch (n) {
			let r = Ws(n);
			throw t() && this.bR(e, r), r;
		}
	}
	cF(e) {
		if (this.collection.config.syncMode !== "on-demand") return {
			options: e.requestOptions,
			syncRunGeneration: this.collection._sync.getSyncRunGeneration()
		};
		let t = new AbortController(), n = e.requestOptions.signal, r;
		if (n?.aborted) t.abort(n.reason);
		else if (n) {
			let e = () => t.abort(n.reason);
			n.addEventListener("abort", e, { once: !0 }), r = () => n.removeEventListener("abort", e);
		}
		return {
			options: {
				...e.requestOptions,
				signal: t.signal
			},
			syncRunGeneration: this.collection._sync.getSyncRunGeneration(),
			abortController: t,
			removeRequestAbortListener: r
		};
	}
	al(e, t = this.bf === 0) {
		if (!e.releaseAttempted) {
			e.releaseAttempted = !0;
			try {
				e.abortController?.abort(), this.Z(e.syncRunGeneration) && this.collection._sync.unloadSubset(e.options);
			} catch (n) {
				throw t ? this.bR(e.options, Ws(n), !0) : Ws(n);
			} finally {
				e.removeRequestAbortListener?.();
			}
		}
	}
	dD(e) {
		let t = {
			requestOptions: e,
			acquisition: {
				options: e,
				syncRunGeneration: this.collection._sync.getSyncRunGeneration()
			},
			acquisitionState: "starting"
		};
		if (this.collection.status === "cleaned-up" || this.c_ && this.collection.config.syncMode === "on-demand" || this.collection.config.syncMode === "on-demand" && (this.collection.status === "error" || this.collection.status !== "idle" && this.collection._sync.syncLoadSubsetFn === null)) {
			t.acquisitionState = "detached", this.C.push(t);
			let n = Gs();
			t.initialResult = n;
			let r = () => n.reject(new ni());
			e.signal?.addEventListener("abort", r, { once: !0 });
			let i = () => {
				e.signal?.removeEventListener("abort", r), t.initialResult = void 0;
			};
			return n.promise.then(i, i), {
				demand: t,
				result: n.promise,
				started: !1
			};
		}
		let n = this.cF(t);
		t.acquisition = n;
		let r = this.o, i = r?.currentAttempt, a = this.collection._sync.getSyncRunGeneration();
		this.C.push(t);
		let o;
		try {
			o = this.loadSubset(n.options, () => this.Z(a) && this.C.includes(t) && (r === void 0 || this.o === r && r.currentAttempt === i));
		} catch (e) {
			let a = this.C.indexOf(t);
			throw a !== -1 && (r && i && this.o === r && r.currentAttempt === i && (r.failures.set(t, Ws(e)), r.failed = !0), this.C.splice(a, 1)), qs(n), e;
		}
		if (!this.Z(a)) {
			let e = this.C.indexOf(t);
			return e !== -1 && this.C.splice(e, 1), qs(n), {
				demand: t,
				result: o,
				started: !0
			};
		}
		return t.acquisitionState = "active", this.C.includes(t) ? (r && i && this.cB(r, i, t, o), {
			demand: t,
			result: o,
			started: !0
		}) : (this.al(n), {
			demand: t,
			result: o,
			started: !0
		});
	}
	a4(e) {
		return !this.unsubscribed && this.C.includes(e);
	}
	bR(e, t, n = !1) {
		let r = Ws(t);
		if (e.signal?.aborted && !n) return r;
		this.fu = r, this.bf++;
		try {
			this.emitInner("loadSubset:error", {
				type: "loadSubset:error",
				subscription: this,
				options: e,
				error: r
			});
		} finally {
			this.bf--;
		}
		return r;
	}
	emitEvents(e) {
		if (this.unsubscribed) return !1;
		let t = this.d0(e);
		return e.length > 0 && t.length === 0 || this.eG(t) ? !1 : this.dN(t);
	}
	eH(e) {
		this.eG(e) || this.callback(e);
	}
	requestSnapshot(e) {
		if (this.unsubscribed || e?.signal?.aborted || this.loadedInitialState) return !1;
		let t = {
			where: this.options.whereExpression,
			optimizedOnly: e?.optimizedOnly ?? !1
		};
		if (e) {
			if ("where" in e) {
				let n = e.where;
				if (t.where) {
					let e = t.where;
					t.where = ro(e, n);
				} else t.where = n;
			}
			e.boundedPrefix && (t.orderBy = e.orderBy, t.limit = e.limit);
		} else this.loadedInitialState = !0;
		let n = {
			...e?.refetch ? { refetch: !0 } : {},
			where: t.where,
			signal: e?.signal,
			subscription: this,
			orderBy: e?.orderBy,
			limit: e?.limit === void 0 ? void 0 : e.limit + this.collection._optimisticOverlaySize()
		};
		e?.where && this.d8.set(n, e.where);
		let { demand: r, result: i, started: a } = this.dD(n);
		if (!this.a4(r) || (e?.onLoadSubsetResult?.(i, r.acquisition.options, (e) => this.e6(r, e)), !this.a4(r)) || (a && this.co(i, r, r.acquisition.options, e?.trackLoadSubsetPromise ?? !0), !this.a4(r))) return !1;
		let o;
		if (e?.onUnoptimized) {
			if (o = this.collection.currentStateAsChanges({
				...t,
				optimizedOnly: !0
			}), o === void 0) {
				if (e.onUnoptimized(), !this.a4(r)) return !1;
				o = this.collection.currentStateAsChanges({
					...t,
					optimizedOnly: !1
				});
			}
		} else o = this.collection.currentStateAsChanges(t);
		if (!this.a4(r) || o === void 0) return !1;
		let s = this.o?.privateRows ?? this.ac, c = o.filter((e) => !this.fS && this.ad.has(e.key) || !this.aC.has(e.key) && !s.has(e.key));
		for (let e of c) this.aC.add(e.key);
		return this.snapshotSent = !0, this.eH(this.fS ? c : this.cy(c)), !0;
	}
	releaseSnapshot(e) {
		let t = this.C.findIndex((t) => t.requestOptions.where === e || this.d8.get(t.requestOptions) === e);
		t !== -1 && this.d7(t);
	}
	e6(e, t) {
		if (t) try {
			this.bR(e.acquisition.options, t.error, !0);
		} finally {
			let t = this.C.indexOf(e);
			t !== -1 && this.d7(t, !1);
		}
		else {
			let t = this.C.indexOf(e);
			t !== -1 && this.d7(t);
		}
	}
	d7(e, t = this.bf === 0) {
		let n = this.C[e];
		if (!n) return;
		let r = this.o, i = n.acquisition;
		this.C.splice(e, 1), n.initialResult?.reject(new ni()), Ms([
			() => this.dX(n),
			...n.acquisitionState === "active" ? [() => this.al(i, t)] : [],
			() => this.fm(),
			() => {
				r && this.bJ(r);
			},
			() => this.cO(n)
		]);
	}
	fm() {
		let e = this.o;
		this.C.length === 0 && e && (e.privateRows && !e.failed ? this.fb(e) : (this.bP(), this.ad = new Map(this.ac), this.cg(), this.options.truncateReplayPublication?.succeed()));
	}
	readOrderedSnapshot(e) {
		let t = [
			this.options.whereExpression,
			e.where,
			e.cursor?.whereFrom
		].filter((e) => e !== void 0), n = this.collection.currentStateAsChanges({
			orderBy: e.orderBy,
			limit: e.limit,
			where: t.length > 0 ? t.reduce((e, t) => ro(e, t)) : void 0
		});
		return Array.isArray(n) ? n.filter(({ key: e }) => !this.collection._hasOptimisticOverlay(e)) : [];
	}
	requestLimitedSnapshot({ refetch: e, orderBy: t, limit: r, minValues: i, offset: a, trackLoadSubsetPromise: o = !0, onLoadSubsetResult: s }) {
		if (this.unsubscribed) return;
		if (!r) throw Error(n(96));
		if (!this.orderByIndex) throw Error(n(97));
		let c = i ? Vs(t, i) : void 0, l = i !== void 0 && i.length > 0, u = i?.[0], d = this.orderByIndex, f = this.options.whereExpression, p = f ? vs(f) : void 0, m = (e) => {
			if (e !== void 0 && this.aC.has(e)) return !1;
			let t = this.collection.get(e);
			return t === void 0 ? !1 : p?.(t) ?? !0;
		}, h = u, g = [], v = [];
		if (l) {
			let { expression: e } = t[0], n = this.collection.currentStateAsChanges({ where: $a(e, new b(u)) });
			if (n) {
				let e = n.map((e) => e.key).filter(m);
				v.push(...e);
				let t = d.take(r - v.length, u, m);
				v.push(...t);
			} else v = d.take(r, u, m);
		} else v = d.takeFromStart(r, m);
		let x = () => Math.max(r - g.length, 0), S = () => v.length === 0, C = t[0].expression, w = C.type === "ref" ? X(new _(y(C)), !0) : null;
		for (; x() > 0 && !S();) {
			for (let e of v) {
				let t = this.collection.get(e);
				g.push({
					type: "insert",
					key: e,
					value: t
				}), h = w ? w(t) : t;
			}
			v = d.take(x(), h, m);
		}
		for (let e of g) this.aC.add(e.key);
		if (this.eH(g), this.unsubscribed) return;
		let T;
		if (c && i) {
			let e = Hs(t, i);
			e && (T = {
				whereFrom: c,
				whereCurrent: e
			});
		}
		let E = this.collection._optimisticOverlaySize(), D = a === void 0 ? l ? void 0 : r + this.aC.size + E : r + E, ee = {
			...e ? { refetch: !0 } : {},
			where: f,
			limit: D,
			orderBy: t,
			cursor: T,
			offset: a ?? 0,
			subscription: this
		}, { demand: O, result: k, started: te } = this.dD(ee);
		this.a4(O) && (s?.(k, O.acquisition.options, (e) => this.e6(O, e)), this.a4(O) && (te && this.co(k, O, O.acquisition.options, o), this.a4(O)));
	}
	d0(e) {
		if (e = this.cy(e), this.loadedInitialState || this.ej) return e;
		let t = this.fS, n = /* @__PURE__ */ new Set(), r = [];
		for (let i of e) {
			let e = i;
			if (!(this.aC.has(i.key) || n.has(i.key))) {
				if (i.type === "update") e = {
					...i,
					type: "insert",
					previousValue: void 0
				}, n.add(i.key);
				else if (i.type === "delete") {
					if (!t) continue;
				} else n.add(i.key);
			} else if (i.type === "insert") continue;
			else i.type === "delete" && (this.aC.delete(i.key), n.delete(i.key));
			r.push(e);
		}
		return r;
	}
	cy(e) {
		if (this.ad.size === 0) return e;
		let t = [];
		for (let n of e) {
			let e = this.ad.get(n.key);
			e === void 0 ? t.push(n) : (this.ad.delete(n.key), n.type === "delete" ? t.push({
				...n,
				value: e,
				previousValue: void 0
			}) : W(e, n.value) || t.push({
				...n,
				type: "update",
				previousValue: e
			}));
		}
		if (this.collection.config.syncMode !== "on-demand" && !this.fS) for (let [e, n] of this.ad) this.collection.has(e) || (this.ad.delete(e), t.push({
			type: "delete",
			key: e,
			value: n
		}));
		return t;
	}
	fj(e) {
		for (let t of e) t.type === "delete" ? this.ac.delete(t.key) : this.ac.set(t.key, t.value);
	}
	e9(e) {
		for (let t of e) t.type === "delete" ? this.aC.delete(t.key) : this.aC.add(t.key);
	}
	markAllStateAsSeen() {
		this.ej = !0;
	}
	unsubscribe() {
		if (this.unsubscribed) return;
		this.unsubscribed = !0, this.aV++;
		let e = [
			this.ec,
			this.dB,
			this.cb
		];
		this.ec = void 0, this.dB = void 0, this.cb = void 0, Ms([
			...e.map((e) => () => e?.()),
			() => {
				this.bP(), this.ad.clear();
				let e = this.C.filter((e) => e.acquisitionState === "active").map((e) => e.acquisition);
				for (let e of this.C) e.initialResult?.reject(new ni()), this.cO(e), e.acquisitionState === "starting" && qs(e.acquisition);
				this.C = [], Ms(e.map((e) => () => this.al(e)));
			},
			() => this.emitInner("unsubscribed", {
				type: "unsubscribed",
				subscription: this
			}),
			() => this.clearListeners()
		]);
	}
}, Ys = class {
	constructor() {
		this.activeSubscribersCount = 0, this.acquiringSubscribersCount = 0, this.changeSubscriptions = /* @__PURE__ */ new Set(), this.batchedEvents = [], this.shouldBatchEvents = !1, this.cM = /* @__PURE__ */ new Set(), this.f2 = !1, this.ex = /* @__PURE__ */ new Set(), this.stateRevision = 0, this.layoutRevision = 0;
	}
	setDeps(e) {
		this.lifecycle = e.lifecycle, this.sync = e.sync, this.events = e.events, this.collection = e.collection, this.state = e.state;
	}
	emitEmptyReadyEvent() {
		js(() => {
			try {
				Ms([...this.changeSubscriptions].map((e) => () => e.emitEvents([])));
			} catch (e) {
				As(e);
			}
		});
	}
	cK(e) {
		return this.state.enrichChangeMessage(e);
	}
	eW(e, t) {
		if (!e) return t;
		if (e.type === "insert") return t.type === "delete" ? void 0 : {
			...t,
			type: "insert",
			previousValue: void 0
		};
		let n = e.type === "update" ? e.previousValue ?? e.value : e.value;
		return t.type === "delete" ? {
			...t,
			value: n,
			previousValue: void 0
		} : {
			...t,
			type: "update",
			previousValue: n
		};
	}
	emitEvents(e, t = !1, n = !1) {
		if (e.length > 0 && this.stateRevision++, n && this.layoutRevision++, this.shouldBatchEvents && !t) {
			this.batchedEvents.push(...e.map((e) => this.cK(e)));
			return;
		}
		let r = e;
		if (t) {
			if (this.batchedEvents.length > 0) {
				let t = /* @__PURE__ */ new Map();
				for (let n of [...this.batchedEvents, ...e]) t.set(n.key, this.eW(t.get(n.key), n));
				r = [...t.values()].flatMap((e) => e ? [e] : []);
			}
			this.batchedEvents = [], this.shouldBatchEvents = !1;
		}
		this.aN ? this.aN.publications.push({
			changes: r,
			layoutChanged: n
		}) : this.e5(r, n);
	}
	deferPublication() {
		let e = this.aN ??= {
			depth: 0,
			discard: !1,
			stateRevision: this.stateRevision,
			layoutRevision: this.layoutRevision,
			publications: []
		};
		e.depth++;
		let t = !1, n = (n) => {
			if (t || this.aN !== e || (t = !0, e.discard ||= n, --e.depth > 0)) return;
			let r = e.publications;
			e.publications = [], this.aN = void 0, e.discard ? (this.stateRevision = e.stateRevision, this.layoutRevision = e.layoutRevision) : this.e5(r.flatMap(({ changes: e }) => e), r.some(({ layoutChanged: e }) => e));
		};
		return {
			publish: () => n(!1),
			discard: () => n(!0)
		};
	}
	e5(e, t) {
		if (e.length === 0 && !t) return;
		let n = e.map((e) => this.cK(e)), r = [...this.cM], i = [...this.changeSubscriptions];
		js(() => {
			let t = i.map((e) => () => e.emitEvents(n));
			e.length === 0 && t.unshift(...r);
			try {
				Ms(t);
			} catch (e) {
				As(e);
			}
		});
	}
	subscribeLayoutChanges(e) {
		return this.cM.add(e), () => this.cM.delete(e);
	}
	subscribeChanges(e, t = {}) {
		if (t.where && t.whereExpression) throw Error(n(95));
		let { where: r, ...i } = t, a = i.whereExpression;
		r && (a = Z(r(Xa())));
		let o = i.deferAcquisition === !0;
		this.ei(o);
		let s, c = { closed: !1 };
		try {
			s = new Js(this.collection, e, {
				...i,
				whereExpression: a,
				deferAcquisition: o,
				onResumeAcquisition: () => this.gA(),
				onUnsubscribe: () => {
					c.closed = !0, this.eB(s?.isDeferringAcquisition() ?? !1), s && this.changeSubscriptions.delete(s);
				}
			}), t.onStatusChange && s.on("status:change", t.onStatusChange), t.includeInitialState ? s.requestSnapshot({
				trackLoadSubsetPromise: !1,
				orderBy: t.orderBy,
				limit: t.limit,
				onLoadSubsetResult: t.onLoadSubsetResult
			}) : t.includeInitialState === !1 && s.markAllStateAsSeen(), c.closed || this.changeSubscriptions.add(s);
		} catch (e) {
			if (s) try {
				s.unsubscribe();
			} catch {}
			else this.eB(o);
			throw e;
		}
		return s;
	}
	hasSubscriberOrPreload() {
		return this.f2;
	}
	onFirstSubscriberOrPreload(e) {
		return this.ex.add(e), () => this.ex.delete(e);
	}
	markSubscriberOrPreload() {
		if (this.f2) return;
		this.f2 = !0;
		let e = [];
		for (let t of [...this.ex]) try {
			t();
		} catch (t) {
			e.push(t);
		}
		if (e.length) throw e[0];
	}
	gA() {
		this.markSubscriberOrPreload(), this.gr(), this.e2(1);
	}
	e2(e) {
		let t = this.acquiringSubscribersCount;
		this.acquiringSubscribersCount += e, this.events.emitSubscribersChange(this.acquiringSubscribersCount, t);
	}
	gr() {
		(this.lifecycle.status === "cleaned-up" || this.lifecycle.status === "idle") && this.sync.startSync();
	}
	ei(e) {
		let t = this.activeSubscribersCount;
		this.activeSubscribersCount++, this.lifecycle.cancelGCTimer();
		try {
			e ? Fs(this.collection.config) && this.gr() : (this.markSubscriberOrPreload(), this.gr());
		} catch (e) {
			throw this.activeSubscribersCount = t, this.activeSubscribersCount === 0 && this.lifecycle.startGCTimer(), e;
		}
		e || this.e2(1);
	}
	eB(e) {
		if (this.activeSubscribersCount--, this.activeSubscribersCount === 0) this.lifecycle.startGCTimer();
		else if (this.activeSubscribersCount < 0) throw new Gn();
		e || this.e2(-1);
	}
	cleanup() {
		this.f2 = [...this.changeSubscriptions].some((e) => !e.isDeferringAcquisition()), this.stateRevision++, this.batchedEvents = [], this.shouldBatchEvents = !1, this.aN && (this.aN.publications.length = 0), this.aN = void 0;
	}
}, Xs = (e) => setTimeout(() => {
	e({
		didTimeout: !0,
		timeRemaining: () => 50
	});
}, 0), Zs = (e) => {
	clearTimeout(e);
}, Qs = typeof window < "u" && "requestIdleCallback" in window ? (e, t) => window.requestIdleCallback(e, t) : (e, t) => Xs(e), $s = typeof window < "u" && "cancelIdleCallback" in window ? (e) => window.cancelIdleCallback(e) : Zs, ec = class e {
	constructor() {
		this.tasks = /* @__PURE__ */ new Map(), this.timeoutId = null, this.dm = !1, this.now = () => globalThis.performance?.now() ?? Date.now();
	}
	static getInstance() {
		return e.fY ||= new e(), e.fY;
	}
	schedule(e, t, n) {
		let r = this.now() + t;
		this.tasks.set(e, {
			executeAt: r,
			callback: n
		}), this.dm || (this.dm = !0, Promise.resolve().then(() => {
			this.dm = !1, this.fa();
		}));
	}
	cancel(e) {
		this.tasks.delete(e), this.tasks.size === 0 && this.timeoutId !== null && (clearTimeout(this.timeoutId), this.timeoutId = null);
	}
	fa() {
		if (this.timeoutId !== null && (clearTimeout(this.timeoutId), this.timeoutId = null), this.tasks.size === 0) return;
		let e = Infinity;
		for (let t of this.tasks.values()) t.executeAt < e && (e = t.executeAt);
		let t = Math.max(0, e - this.now());
		this.timeoutId = setTimeout(() => this.process(), t), typeof this.timeoutId == "object" && this.timeoutId.unref();
	}
	process() {
		this.timeoutId = null;
		let e = this.now();
		for (let [t, r] of this.tasks.entries()) if (e >= r.executeAt) {
			this.tasks.delete(t);
			try {
				r.callback();
			} catch (e) {
				console.error(n(214), e);
			}
		}
		this.tasks.size > 0 && this.fa();
	}
};
ec.fY = null;
var tc = ec, nc = class {
	constructor(e, t, n = () => {}) {
		this.status = "idle", this.hasBeenReady = !1, this.hasReceivedFirstCommit = !1, this.onFirstReadyCallbacks = [], this.aI = null, this.aV = 0, this.dr = !1, this.b5 = null, this.bO = /* @__PURE__ */ new Set(), this.config = e, this.id = t, this.fX = n;
	}
	setDeps(e) {
		this.indexes = e.indexes, this.events = e.events, this.changes = e.changes, this.sync = e.sync, this.state = e.state;
	}
	validateStatusTransition(e, t) {
		if (e !== t && !{
			idle: [
				"loading",
				"error",
				"cleaned-up"
			],
			loading: [
				"ready",
				"error",
				"cleaned-up"
			],
			ready: ["cleaned-up", "error"],
			error: [
				"ready",
				"cleaned-up",
				"idle"
			],
			"cleaned-up": ["loading", "error"]
		}[e].includes(t)) throw new Un(e, t, this.id);
	}
	setStatus(e, t = !1, r) {
		if (e === "ready" && !t) throw new Vn(n(208));
		this.validateStatusTransition(this.status, e);
		let i = ++this.aV, a = this.status;
		this.status = e, r?.(), this.events.emitStatusChange(e, a, () => this.aV === i);
	}
	validateCollectionUsable(e) {
		switch (this.status) {
			case "error": throw new Hn(e, this.id);
			case "cleaned-up": this.sync.startSync();
		}
	}
	markReady(e) {
		let t = this.d_(e);
		if (t) {
			if (this.gn) this.gn(t);
			else throw t.error;
		}
	}
	deferReadyFailures() {
		let e;
		return this.gn = (t) => {
			e ??= t;
		}, () => (this.gn = void 0, e);
	}
	d_(e) {
		if (this.validateStatusTransition(this.status, "ready"), this.status === "loading" || this.status === "error") {
			this.dp = void 0;
			let t = this.aV + 1;
			if (this.setStatus("ready", !0, e), this.status !== "ready" || this.aV !== t) return;
			let n = [];
			this.hasBeenReady || (this.hasBeenReady = !0, this.hasReceivedFirstCommit = !0, n.push(...this.onFirstReadyCallbacks), this.onFirstReadyCallbacks = []), n.push(() => this.changes.emitEmptyReadyEvent());
			try {
				Ms(n);
			} catch (e) {
				return { error: e };
			}
		}
	}
	markError(e) {
		this.validateStatusTransition(this.status, "error"), this.dp = e, this.setStatus("error");
	}
	getSyncError() {
		return this.dp;
	}
	assertCanStartSync() {
		if (this.dr) throw new Vn(n(209, { id: this.id }));
		this.b5 = null;
	}
	onCleanupStart(e) {
		if (this.bO.add(e), this.dr) try {
			e();
		} catch (t) {
			throw this.bO.delete(e), t;
		}
		return () => this.bO.delete(e);
	}
	startGCTimerIfUnsubscribed() {
		this.startGCTimer(50);
	}
	dA() {
		return !this.dr && this.changes.activeSubscribersCount === 0 && !this.sync.hasPendingPreload;
	}
	startGCTimer(e = 0) {
		if (!this.dA()) return;
		let t = this.config.gcTime ?? 3e5;
		t <= 0 || !Number.isFinite(t) || tc.getInstance().schedule(this, Math.max(t, e), () => {
			this.dA() && this.eg();
		});
	}
	cancelGCTimer() {
		tc.getInstance().cancel(this), this.aI !== null && ($s(this.aI), this.aI = null);
	}
	eg() {
		this.aI !== null && $s(this.aI), this.aI = Qs((e) => {
			this.dA() ? this.fD(e) && (this.aI = null) : this.aI = null;
		}, { timeout: 1e3 });
	}
	fD(e) {
		return this.dr ? !0 : !e || e.timeRemaining() > 0 || e.didTimeout ? (this.fe().catch(() => void 0), !0) : (this.eg(), !1);
	}
	fe() {
		if (this.b5) return this.b5;
		let e = Gs();
		this.b5 = e.promise, this.dr = !0;
		let t = [], r, i = !0, a = !1, o = (e) => {
			try {
				e();
			} catch (e) {
				t.push(e);
			}
		};
		for (let e of [...this.bO]) o(e);
		let s = (r) => {
			if (a) return;
			a = !0, this.dr = !1, o(() => this.setStatus("cleaned-up")), this.changes.activeSubscribersCount === 0 && o(() => this.events.cleanup());
			let i = r ? [r.error, ...t] : t, s = i.length === 0 ? void 0 : { error: i.length === 1 ? i[0] : AggregateError(i, n(173, { syncFailure: r !== void 0 }), { cause: i[0] }) };
			Promise.resolve().then(() => Promise.resolve()).then(() => {
				this.b5 === e.promise && (this.b5 = null), s ? e.reject(s.error) : e.resolve();
			});
		};
		o(() => this.fX());
		try {
			i = this.sync.cleanup(s);
		} catch (e) {
			r = { error: e };
		}
		return o(() => this.state.cleanup()), o(() => this.changes.cleanup()), o(() => this.indexes.cleanup()), tc.getInstance().cancel(this), this.hasBeenReady = !1, this.dp = void 0, this.onFirstReadyCallbacks = [], i && s(r), e.promise;
	}
	onFirstReady(e) {
		return this.hasBeenReady ? (e(), () => {}) : (this.onFirstReadyCallbacks.push(e), () => {
			let t = this.onFirstReadyCallbacks.indexOf(e);
			t !== -1 && this.onFirstReadyCallbacks.splice(t, 1);
		});
	}
	cleanup() {
		return this.aI !== null && ($s(this.aI), this.aI = null), this.fe();
	}
}, rc = /* @__PURE__ */ Symbol("tanstack-db.sync-receipt.accepted");
function ic(e, t) {
	return e[rc] = t, e;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/collection/sync.js
function ac(e, t) {
	let n = Object.keys(e);
	return n.length === Object.keys(t).length && n.every((n) => Object.is(e[n], t[n]));
}
var oc = class {
	constructor(e, t) {
		this.preloadPromise = null, this.syncCleanupFn = null, this.syncLoadSubsetFn = null, this.syncUnloadSubsetFn = null, this.aw = /* @__PURE__ */ new Set(), this.a5 = /* @__PURE__ */ new Set(), this.bb = !1, this.bM = !1, this.ab = [], this.bZ = 0, this.syncRunGeneration = 0, this.bg = !1, this.config = e, this.id = t, this.syncMode = e.syncMode ?? "eager";
	}
	setDeps(e) {
		this.collection = e.collection, this.state = e.state, this.lifecycle = e.lifecycle, this.a3 = e.events;
	}
	f6(e, t, n) {
		let r = n.value, i = this.f4 ??= /* @__PURE__ */ new WeakMap();
		try {
			let a = i.get(r);
			if (a && t === "update" && !("previousValue" in n) && !ac(a, r)) throw new hr(e);
			i.set(r, { ...r });
		} catch (e) {
			if (e instanceof hr) throw e;
			i.delete(r);
		}
	}
	du(e) {
		let t = this.config.utils?.[Ns];
		return new Xn(e, this.id, {
			hasCustomGetKey: t?.hasCustomGetKey ?? !1,
			hasJoins: t?.hasJoins ?? !1,
			hasDistinct: t?.hasDistinct ?? !1
		});
	}
	markLayoutChange() {
		this.aA().layoutChanged = !0;
	}
	startSync() {
		if (this.lifecycle.assertCanStartSync(), this.lifecycle.status !== "idle" && this.lifecycle.status !== "cleaned-up") return;
		if (this.bb) {
			this.bM = !0;
			return;
		}
		let e = ++this.bZ, t = () => e === this.bZ, r = !1;
		if (this.lifecycle.setStatus("loading"), !t()) return;
		let i = this.lifecycle.deferReadyFailures(), a;
		this.bg = !0;
		try {
			let e = sc(this.config.sync.sync({
				collection: this.collection,
				begin: () => {
					if (!t()) return;
					let e = Gs();
					e.promise.catch(() => void 0), this.state.pendingSyncedTransactions.push({
						committed: !1,
						applicationStarted: !1,
						layoutChanged: !1,
						operations: [],
						rowMetadataWrites: /* @__PURE__ */ new Map(),
						explicitRowMetadataWrites: /* @__PURE__ */ new Map(),
						collectionMetadataWrites: /* @__PURE__ */ new Map(),
						applied: e,
						duplicateKeyError: (e) => this.du(e)
					});
				},
				write: (e) => {
					if (!t()) return;
					let n = this.aA();
					if (n.invalidationError !== void 0) return;
					let r = "key" in e ? e.key : this.config.getKey(e.value), i = e.type;
					if (e.type === "insert") {
						let t = this.state.classifyPendingSyncedInsert(r, e.value);
						if (t === "duplicate") throw this.du(r);
						i = t;
					}
					"value" in e;
					let a = {
						...e,
						type: i,
						key: r,
						originalSyncType: e.type === "insert" ? "insert" : void 0
					};
					n.operations.push(a), this.state.stagePendingSyncOperation(a);
					let o = Cs(a);
					o && n.rowMetadataWrites.set(r, o);
				},
				commit: (e) => {
					if (!t()) return !0;
					let n = this.state.pendingSyncedTransactions.at(-1);
					if (!n) throw new gr();
					if (n.committed) throw new _r();
					return e?.aborted ? (this.state.cancelPendingSyncedTransaction(n), n.applied.promise) : n.invalidationError === void 0 ? (n.committed = !0, this.state.commitPendingTransactions(), !n.applied.isPending() || ic(n.applied.promise, !0)) : (this.state.cancelPendingSyncedTransaction(n, n.invalidationError), n.applied.promise);
				},
				markReady: () => {
					t() && this.lifecycle.markReady();
				},
				markError: (e) => {
					t() && this.lifecycle.markError(e);
				},
				truncate: (e) => {
					if (!t()) return;
					let n = this.aA();
					n.operations = [], n.rowMetadataWrites.clear(), n.explicitRowMetadataWrites.clear(), n.invalidationError = void 0, n.truncate = !0, n.truncateMarkReady = e?.markReady ?? !0, this.state.refreshPendingSyncedProjection();
				},
				invalidateLoadedSubsets: () => {
					t() && !r && (r = !0, queueMicrotask(() => {
						r = !1, t() && this.a3.emit("loadedSubsets:invalidated", {
							type: "loadedSubsets:invalidated",
							collection: this.collection
						});
					}));
				},
				metadata: this.eT(t)
			}));
			if (this.bg = !1, a = i(), !t()) {
				if (e?.cleanup && this.dW(e.cleanup), this.ck(), a) throw a.error;
				return;
			}
			if (this.syncCleanupFn = e?.cleanup ?? null, this.syncLoadSubsetFn = e?.loadSubset ?? null, this.syncUnloadSubsetFn = e?.unloadSubset ?? null, this.syncMode === "on-demand" && !this.syncLoadSubsetFn) throw new In(n(210, { id: this.id }));
			this.lifecycle.startGCTimerIfUnsubscribed();
		} catch (e) {
			throw this.bg = !1, this.ck(), i(), t() && this.lifecycle.markError(e), e;
		}
		if (a) throw a.error;
	}
	deferStart() {
		return this.lifecycle.status !== "idle" && this.lifecycle.status !== "cleaned-up" ? !1 : (this.bb = !0, !0);
	}
	resumeStart() {
		if (!this.bb) return;
		this.bb = !1;
		let e = this.bM || this.ab.length > 0;
		this.bM = !1;
		let t = this.ab;
		this.ab = [];
		let n = this.syncRunGeneration;
		try {
			e && this.startSync();
		} catch (e) {
			for (let { deferred: n } of t) n.reject(e);
			throw e;
		}
		for (let { options: e, deferred: r } of t) {
			let t = this.syncLoadSubsetFn;
			try {
				if (n !== this.syncRunGeneration || e.signal?.aborted) throw new ni();
				let i = t?.(e) ?? !0;
				i instanceof Promise ? i.then((e) => r.resolve(e), (e) => r.reject(e)) : r.resolve(void 0);
			} catch (e) {
				r.reject(e);
			}
		}
	}
	aA() {
		let e = this.state.pendingSyncedTransactions.at(-1);
		if (!e) throw new pr();
		if (e.committed) throw new mr();
		return e;
	}
	a8(e, t) {
		let n = this.aA();
		n.explicitRowMetadataWrites.set(e, {
			position: n.operations.length,
			write: t
		}), n.rowMetadataWrites.set(e, t);
	}
	eT(e) {
		return {
			persistence: null,
			row: {
				get: (t) => {
					if (!e()) return;
					let n = this.state.pendingSyncedTransactions.at(-1), r = n?.rowMetadataWrites.get(t);
					if (r) return r.type === "delete" ? void 0 : r.value;
					if (!n?.truncate) return this.state.syncedMetadata.get(t);
				},
				set: (t, n) => {
					e() && this.a8(t, {
						type: "set",
						value: n
					});
				},
				delete: (t) => {
					e() && this.a8(t, { type: "delete" });
				}
			},
			collection: {
				get: (t) => {
					if (!e()) return;
					let n = this.state.pendingSyncedTransactions.at(-1)?.collectionMetadataWrites.get(t);
					return n ? n.type === "delete" ? void 0 : n.value : this.state.syncedCollectionMetadata.get(t);
				},
				set: (t, n) => {
					e() && this.aA().collectionMetadataWrites.set(t, {
						type: "set",
						value: n
					});
				},
				delete: (t) => {
					e() && this.aA().collectionMetadataWrites.set(t, { type: "delete" });
				},
				list: (t) => {
					if (!e()) return [];
					let n = new Map(this.state.syncedCollectionMetadata), r = this.state.pendingSyncedTransactions.at(-1);
					if (r) for (let [e, t] of r.collectionMetadataWrites) t.type === "delete" ? n.delete(e) : n.set(e, t.value);
					return Array.from(n.entries()).filter(([e]) => !t || e.startsWith(t)).map(([e, t]) => ({
						key: e,
						value: t
					}));
				}
			}
		};
	}
	get hasPendingPreload() {
		return this.cW !== void 0;
	}
	preload() {
		try {
			this.lifecycle.assertCanStartSync(), this.bb && this.resumeStart();
		} catch (e) {
			return Promise.reject(e);
		}
		if (this.lifecycle.status === "ready" && (this.lifecycle.cancelGCTimer(), this.lifecycle.startGCTimerIfUnsubscribed()), this.preloadPromise) return this.preloadPromise;
		let e = new Promise((e, t) => {
			if (this.lifecycle.status === "ready") {
				e();
				return;
			}
			if (this.lifecycle.status === "error") {
				t(this.d1());
				return;
			}
			let n = !1, r = {
				active: !1,
				ready: !1
			}, i = () => {}, a = () => {}, o = () => {
				n = !0, i(), a(), this.cW === c && (this.cW = void 0), this.lifecycle.startGCTimerIfUnsubscribed();
			}, s = () => {
				r.active ? r.ready = !0 : n || (o(), e());
			}, c = (e) => {
				n || (o(), t(e));
			};
			if (this.cW = c, this.lifecycle.cancelGCTimer(), a = this.lifecycle.onFirstReady(s), i = this.collection.on("status:error", () => {
				r.active || c(this.d1());
			}), this.lifecycle.status === "idle" || this.lifecycle.status === "cleaned-up") {
				r.active = !0;
				let e;
				try {
					this.startSync();
				} catch (t) {
					e = { error: t };
				} finally {
					r.active = !1;
				}
				this.collection.status === "error" ? c(this.d1()) : r.ready ? s() : e && c(e.error);
			}
		});
		return this.preloadPromise = e, e.then(void 0, () => {
			this.preloadPromise === e && (this.preloadPromise = null);
		}), e;
	}
	d1() {
		let e = this.lifecycle.getSyncError();
		return e === void 0 ? new Wn() : e;
	}
	get isLoadingSubset() {
		return this.aw.size > 0;
	}
	beginLoadSubsetOperation() {
		let e = this.aa, t = {
			pending: /* @__PURE__ */ new Set(),
			waiting: !1,
			completed: !1,
			hasError: !1
		};
		return this.aa = t, this.a5.add(t), {
			wait: () => this.el(t),
			cancel: () => {
				t.completed = !0, this.a5.delete(t), this.aa === t && (this.aa = e?.completed ? void 0 : e);
			}
		};
	}
	el(e) {
		return e.waiting = !0, e.pending.size === 0 ? (this.gm(e), !e.hasError || Promise.reject(e.error)) : (e.deferred = Gs(), e.deferred.promise);
	}
	c9(e, t, n) {
		e.completed || (e.pending.delete(t), !n.ok && !e.hasError && (e.hasError = !0, e.error = n.error), !(!e.waiting || e.pending.size > 0) && queueMicrotask(() => {
			e.completed || e.pending.size > 0 || (this.gm(e), e.hasError ? e.deferred.reject(e.error) : e.deferred.resolve());
		}));
	}
	gm(e) {
		e.completed = !0, this.a5.delete(e), this.aa === e && (this.aa = void 0);
	}
	gk(e) {
		this.a3.emit("loadingSubset:change", {
			type: "loadingSubset:change",
			collection: this.collection,
			isLoadingSubset: e,
			previousIsLoadingSubset: !e,
			loadingSubsetTransition: e ? "start" : "end"
		});
	}
	trackLoadSubsetOperationPromise(e) {
		let t = this.aa;
		t && !t.pending.has(e) && (t.pending.add(e), e.then(() => this.c9(t, e, { ok: !0 }), (n) => this.c9(t, e, {
			ok: !1,
			error: n
		})));
	}
	trackLoadPromise(e) {
		let t = this.syncRunGeneration, n = !this.isLoadingSubset;
		this.aw.add(e), this.trackLoadSubsetOperationPromise(e), n && this.gk(!0);
		let r = () => {
			if (t !== this.syncRunGeneration) return;
			let n = this.aw.size === 1 && this.aw.has(e);
			this.aw.delete(e), n && this.gk(!1);
		};
		e.then(r, r);
	}
	getSyncRunGeneration() {
		return this.syncRunGeneration;
	}
	loadSubset(e) {
		if (e.signal?.aborted) return Promise.reject(new ni());
		if (this.syncMode === "eager") return !0;
		if (this.bb) {
			this.bM = !0;
			let t = Gs();
			return this.ab.push({
				options: e,
				deferred: t
			}), this.trackLoadPromise(t.promise), t.promise;
		}
		if (this.syncLoadSubsetFn) {
			let t = this.syncLoadSubsetFn(e);
			if (t instanceof Promise) return this.trackLoadPromise(t), t;
		}
		return !0;
	}
	unloadSubset(e) {
		this.syncMode !== "eager" && (this.bb ? this.ab = this.ab.filter((t) => t.options !== e || (t.deferred.reject(new ni()), !1)) : this.syncUnloadSubsetFn && this.syncUnloadSubsetFn(e));
	}
	eC(e) {
		let t = new $r(this.id, e);
		return t.cause = e, e instanceof Error && (t.stack = e.stack), t;
	}
	e3(e) {
		if (!e) return !0;
		try {
			let t = e();
			return !Zi(t) || Promise.resolve(t).then(() => void 0, (e) => {
				throw this.eC(e);
			});
		} catch (e) {
			throw this.eC(e);
		}
	}
	dW(e) {
		let t = this.bE;
		if (t) try {
			let n = this.e3(e);
			n !== !0 && (t.tasks.push(n), n.catch(() => void 0));
		} catch (e) {
			t.failure ??= { error: e };
		}
	}
	ck() {
		let e = this.bE;
		if (!e) return;
		this.bE = void 0;
		let t = (t) => {
			let n = e.failure ?? t;
			e.onSettled?.(n), n ? e.completion?.reject(n.error) : e.completion?.resolve();
		};
		e.tasks.length === 0 ? t() : Promise.allSettled(e.tasks).then((e) => {
			let n = e.find((e) => e.status === "rejected");
			t(n ? { error: n.reason } : void 0);
		});
	}
	cleanup(e) {
		++this.bZ, this.syncRunGeneration++, this.cW?.(new ti());
		let t = this.syncCleanupFn;
		this.syncCleanupFn = null, this.syncLoadSubsetFn = null, this.syncUnloadSubsetFn = null;
		let n = !0, r;
		try {
			n = this.e3(t);
		} catch (e) {
			r = { error: e };
		}
		this.preloadPromise = null, this.bb = !1, this.bM = !1;
		let i = this.aw.size > 0;
		this.aw.clear(), i && this.gk(!1), this.aa = void 0;
		for (let e of this.a5) e.completed || (e.completed = !0, e.pending.clear(), e.hasError = !0, e.error = new ni(), e.deferred?.reject(e.error));
		this.a5.clear();
		let a = this.ab;
		this.ab = [];
		for (let e of a) e.deferred.reject(new ni());
		if (this.bg) {
			let t = e ? void 0 : Gs(), i = {
				tasks: [],
				failure: r,
				onSettled: e,
				completion: t
			};
			return n !== !0 && (i.tasks.push(n), n.catch(() => void 0)), this.bE = i, !e && t.promise;
		}
		if (r) throw r.error;
		return n === !0 ? !0 : e ? (n.then(() => e(), (t) => e({ error: t })), !1) : n;
	}
};
function sc(e) {
	if (typeof e == "function") return { cleanup: e };
	if (typeof e == "object") return e;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/indexes/base-index.js
function cc(e) {
	return Object.fromEntries(Object.entries(e ?? {}).filter(([, e]) => e !== void 0));
}
function lc(e) {
	return e === void 0 ? void 0 : Intl.getCanonicalLocales(e)[0];
}
function uc(e) {
	return e.stringSort ?? hi.stringSort;
}
var dc = /* @__PURE__ */ new WeakMap(), fc = class {
	constructor(e, t, n, r) {
		this.aH = /* @__PURE__ */ new Map(), this.id = e, this.expression = t, this.compareOptions = r?.compareOptions ?? hi, this.hasCustomComparator = r?.compareFn != null, this.compareFn = Ei(r?.compareFn ? (e, t) => r.compareFn(q(e), q(t)) : Ti(this.compareOptions, "index")), this.name = n, this.supportedOperations = new Set(uo), this.initialize(r);
	}
	exactBucketKeys(e) {
		return this.equalityLookup(e);
	}
	lookupSupportedOperation(e, t) {
		if (e === "eq") return this.equalityLookup(t);
		if (e === "in") return this.inArrayLookup(t);
		if (e === "gt" || e === "gte") return this.rangeQuery({
			from: t,
			fromInclusive: e === "gte"
		});
		if (e === "lt" || e === "lte") return this.rangeQuery({
			to: t,
			toInclusive: e === "lte"
		});
	}
	inArrayLookup(e) {
		let t = /* @__PURE__ */ new Set();
		for (let n of e) {
			let e = this.exactBucketKeys(n);
			if (e) for (let n of e) t.add(n);
		}
		return t;
	}
	rangeQueryReversed(e = {}) {
		let { from: t, to: n, fromInclusive: r = !0, toInclusive: i = !0 } = e, a = {};
		return "to" in e && (a.from = n, a.fromInclusive = i), "from" in e && (a.to = t, a.toInclusive = r), this.rangeQuery(a);
	}
	supports(e) {
		return this.supportedOperations.has(e);
	}
	get supportsRangeOptimization() {
		return !this.hasCustomComparator;
	}
	get supportsOrderOptimization() {
		if (this.hasCustomComparator || this.aH.size > 1) return !1;
		let e = this.aH.keys().next().value;
		return e === void 0 || ![
			"Array",
			"Binary",
			"Temporal.Duration.calendar",
			"Temporal.PlainMonthDay",
			"function"
		].includes(e);
	}
	addRangeValue(e) {
		let t = pc(e);
		t !== void 0 && this.aH.set(t, (this.aH.get(t) ?? 0) + 1);
	}
	removeRangeValue(e) {
		let t = pc(e);
		if (t === void 0) return;
		let n = this.aH.get(t);
		n !== void 0 && (n === 1 ? this.aH.delete(t) : this.aH.set(t, n - 1));
	}
	clearRangeValues() {
		this.aH.clear();
	}
	canOptimizeRangeFor(e) {
		let t = pc(e);
		return t === void 0 ? !0 : mc(t) ? this.aH.size === 0 || this.aH.size === 1 && this.aH.has(t) : !1;
	}
	matchesField(e) {
		return this.expression.type === "ref" && this.expression.path.length === e.length && this.expression.path.every((t, n) => t === e[n]);
	}
	matchesCompareOptions(e) {
		let t = this.compareOptions, n = uc(t), r = uc(e);
		if (t.nulls !== e.nulls || n !== r) return !1;
		if (n === "custom" && r === "custom") return t.stringSort === "custom" && e.stringSort === "custom" && t.compare === e.compare;
		if (n !== "locale" || r !== "locale") return !0;
		let i = t, a = e;
		return lc(i.locale) === lc(a.locale) && W(cc(i.localeOptions), cc(a.localeOptions));
	}
	matchesDirection(e) {
		return this.compareOptions.direction === e;
	}
	initialize(e) {}
	evaluateIndexExpression(e) {
		return (this.eK ??= va(this.expression))(e);
	}
	evaluateAddedValue(e, t) {
		try {
			return this.evaluateIndexExpression(t);
		} catch (t) {
			throw Error(n(99, {
				key: e,
				error: t
			}), { cause: t });
		}
	}
};
function pc(e) {
	if (e != null) return e instanceof Date ? "date" : typeof e == "object" ? wi(e) : typeof e;
}
function mc(e) {
	return e === "number" || e === "bigint" || e === "boolean" || e === "string" || e === "date";
}
function hc(e, t) {
	console.warn(r(216, { key: e }), t);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/collection/indexes.js
var gc = 1;
function _c(e) {
	if (!G(e)) return !1;
	let t = Object.getPrototypeOf(e);
	return t !== null && t !== Object.prototype;
}
function vc(e, t) {
	return e === t ? 0 : e < t ? -1 : 1;
}
function yc(e) {
	let t = dc.get(e) ?? e.name;
	return {
		kind: "constructor",
		...t ? { name: t } : {}
	};
}
function bc(e) {
	if (e == null) return e;
	switch (typeof e) {
		case "string":
		case "boolean": return e;
		case "number": return Number.isFinite(e) ? e : null;
		case "bigint": return {
			__type: "bigint",
			value: e.toString()
		};
		case "function":
		case "symbol": return;
		case "undefined": return;
	}
	if (Array.isArray(e)) return e.map((e) => bc(e) ?? null);
	if (_c(e)) return {
		__type: e[Symbol.toStringTag],
		value: String(e)
	};
	if (e instanceof Date) return {
		__type: "date",
		value: e.toISOString()
	};
	if (e instanceof Set) return {
		__type: "set",
		values: Array.from(e).map((e) => bc(e) ?? null).sort((e, t) => vc(xc(e), xc(t)))
	};
	if (e instanceof Map) return {
		__type: "map",
		entries: Array.from(e.entries()).map(([e, t]) => ({
			key: bc(e) ?? null,
			value: bc(t) ?? null
		})).sort((e, t) => vc(xc(e.key), xc(t.key)))
	};
	if (e instanceof RegExp) return {
		__type: "regexp",
		value: e.toString()
	};
	let t = {}, n = Object.entries(e).sort(([e], [t]) => vc(e, t));
	for (let [e, r] of n) {
		let n = bc(r);
		n !== void 0 && (t[e] = n);
	}
	return Object.hasOwn(t, "__type") ? {
		__type: "object",
		value: t
	} : t;
}
function xc(e) {
	return e === null ? "null" : Array.isArray(e) ? `[${e.map(xc).join(",")}]` : typeof e == "object" ? `{${Object.keys(e).sort((e, t) => vc(e, t)).map((t) => `${JSON.stringify(t)}:${xc(e[t])}`).join(",")}}` : JSON.stringify(e);
}
function Sc(e, t, n, r, i) {
	let a = yc(r), o = bc(t) ?? null, s = bc(i);
	return {
		signatureVersion: gc,
		signature: xc({
			signatureVersion: gc,
			expression: o,
			options: s ?? null
		}),
		indexId: e,
		name: n,
		expression: t,
		resolver: a,
		...s === void 0 ? {} : { options: s }
	};
}
function Cc(e) {
	if (typeof e != "object" || !e) return e;
	if (Array.isArray(e)) return e.map((e) => Cc(e));
	let t = {};
	for (let [n, r] of Object.entries(e)) t[n] = Cc(r);
	return t;
}
function wc(e) {
	return _c(e) ? e : e instanceof Date ? new Date(e.getTime()) : Array.isArray(e) ? e.map(wc) : typeof e == "object" && e ? Object.fromEntries(Object.entries(e).map(([e, t]) => [e, wc(t)])) : e;
}
function Tc(e) {
	return wc(e);
}
var Ec = class {
	constructor() {
		this.indexes = /* @__PURE__ */ new Map(), this.indexMetadata = /* @__PURE__ */ new Map(), this.indexCounter = 0;
	}
	setDeps(e) {
		this.state = e.state, this.lifecycle = e.lifecycle, this.defaultIndexType = e.defaultIndexType, this.events = e.events;
	}
	createIndex(e, t = {}) {
		this.lifecycle.validateCollectionUsable("createIndex");
		let r = ++this.indexCounter, i = Z(e(Xa())), a = t.indexType ?? this.defaultIndexType;
		if (!a) throw new In(n(207));
		let o = new a(r, i, t.name, t.options);
		o.build(this.state.entries()), this.indexes.set(r, o);
		let s = Sc(r, i, t.name, a, t.options);
		return this.indexMetadata.set(r, s), this.events.emitIndexAdded(s), o;
	}
	removeIndex(e) {
		this.lifecycle.validateCollectionUsable("removeIndex");
		let t = typeof e == "number" ? e : e.id, n = this.indexes.get(t);
		if (!n || typeof e != "number" && n !== e) return !1;
		this.indexes.delete(t);
		let r = this.indexMetadata.get(t);
		return this.indexMetadata.delete(t), r && this.events.emitIndexRemoved(r), !0;
	}
	getIndexMetadataSnapshot() {
		return Array.from(this.indexMetadata.values()).sort((e, t) => e.indexId - t.indexId).map((e) => ({
			...e,
			expression: Tc(e.expression),
			resolver: { ...e.resolver },
			...e.options === void 0 ? {} : { options: Cc(e.options) }
		}));
	}
	updateIndexes(e) {
		try {
			for (let t of this.indexes.values()) for (let n of e) switch (n.type) {
				case "insert":
					t.add(n.key, n.value);
					break;
				case "update":
					n.previousValue ? t.update(n.key, n.previousValue, n.value) : t.add(n.key, n.value);
					break;
				case "delete": t.remove(n.key, n.value);
			}
		} catch (e) {
			throw this.lifecycle.markError(e), e;
		}
	}
	cleanup() {
		this.indexes.clear(), this.indexMetadata.clear();
	}
}, Dc = /* @__PURE__ */ new WeakMap();
function Oc(e, t, n) {
	t === "__proto__" ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n;
}
function kc(e) {
	return typeof e == "object" && e ? Dc.get(e) ?? e : e;
}
var Ac = /* @__PURE__ */ new Set([
	"pop",
	"push",
	"shift",
	"unshift",
	"splice",
	"sort",
	"reverse",
	"fill",
	"copyWithin",
	"set"
]), jc = /* @__PURE__ */ new Set([
	"entries",
	"keys",
	"values",
	"forEach"
]);
function Mc(e) {
	return typeof e == "object" && !!e && !(e instanceof Date) && !(e instanceof RegExp) && !G(e);
}
function Nc(e, t, n, r) {
	return function(...i) {
		let a = e.apply(t.copy_, i);
		return n(t), a === t.copy_ ? r : a;
	};
}
function Pc(e, t, r, i, a) {
	if (jc.has(e) || t === Symbol.iterator) return (...o) => {
		let s = r.copy_, c = s instanceof Map;
		if (c && e === "keys") return s.keys();
		let l = (e) => Mc(e) ? a(e, {
			tracker: r,
			prop: "",
			retainIdentity: !0
		}).proxy : e;
		if (e === "forEach") {
			let e = o[0];
			if (typeof e != "function") throw TypeError(n(109));
			return s.forEach((t, n) => {
				let r = l(t);
				e.call(o[1], r, c ? n : r, i);
			});
		}
		let u = s.entries(), d = e === "entries" || c && t === Symbol.iterator;
		return {
			next() {
				let e = u.next();
				if (e.done) return e;
				let [t, n] = e.value, r = l(n);
				return {
					done: !1,
					value: d ? [c ? t : r, r] : r
				};
			},
			[Symbol.iterator]() {
				return this;
			}
		};
	};
}
function Fc(e, t = /* @__PURE__ */ new WeakMap(), n = !1) {
	if (e = kc(e), typeof e != "object" || !e) return e;
	if (t.has(e)) return t.get(e);
	if (e instanceof Date) {
		let n = new Date(e.getTime());
		return t.set(e, n), n;
	}
	if (e instanceof RegExp) {
		let n = new RegExp(e.source, e.flags);
		return n.lastIndex = e.lastIndex, t.set(e, n), n;
	}
	if (e instanceof URL) {
		let n = new URL(e.href);
		return t.set(e, n), n;
	}
	if (Array.isArray(e)) {
		let r = Array(e.length);
		return t.set(e, r), e.forEach((e, i) => {
			r[i] = Fc(e, t, n);
		}), r;
	}
	let r = Object.prototype.toString.call(e), i = r === "[object ArrayBuffer]" ? ArrayBuffer : r === "[object SharedArrayBuffer]" && typeof SharedArrayBuffer < "u" ? SharedArrayBuffer : void 0;
	if (i) {
		let n;
		try {
			n = Object.getOwnPropertyDescriptor(i.prototype, "byteLength").get.call(e);
		} catch {}
		if (n !== void 0) {
			let r = new i(n);
			return new Uint8Array(r).set(new Uint8Array(e)), t.set(e, r), r;
		}
	}
	if (ArrayBuffer.isView(e)) {
		let r = Fc(e.buffer, t, n), i = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), Symbol.toStringTag).get.call(e);
		if (i === void 0) {
			let n = new DataView(r, e.byteOffset, e.byteLength);
			return t.set(e, n), n;
		}
		let a = Object.getPrototypeOf(e).constructor, o = e.length, s = Function.prototype.toString.call(a) === Function.prototype.toString.call(globalThis[i]) ? new a(r, e.byteOffset, o) : new a(o);
		return t.set(e, s), s.set(e), s;
	}
	if (e instanceof Map) {
		let r = /* @__PURE__ */ new Map();
		return t.set(e, r), e.forEach((e, i) => {
			r.set(i, Fc(e, t, n));
		}), r;
	}
	if (e instanceof Set) {
		let r = /* @__PURE__ */ new Set();
		return t.set(e, r), e.forEach((e) => {
			r.add(Fc(e, t, n));
		}), r;
	}
	if (G(e)) return e;
	if (n) {
		let t = Object.getPrototypeOf(e);
		if (t !== Object.prototype && t !== null) return e;
	}
	let a = {};
	t.set(e, a);
	for (let r of Reflect.ownKeys(e)) (typeof r == "symbol" || Object.prototype.propertyIsEnumerable.call(e, r)) && Oc(a, r, Fc(e[r], t, n));
	return a;
}
function Ic(e, t, n) {
	return pi(e, t, n, !0);
}
function Lc(e, t) {
	let n = /* @__PURE__ */ new Map();
	function r(e, t) {
		if (n.has(e)) return n.get(e);
		{
			let r = Lc(e, t);
			return n.set(e, r), r;
		}
	}
	let i = t?.tracker.valueCopies ?? /* @__PURE__ */ new WeakMap(), a = {
		valueCopies: i,
		copy_: t ? i.get(e) ?? e : Fc(e, i),
		originalObject: t ? Fc(e) : e,
		modified: !1,
		assigned_: /* @__PURE__ */ Object.create(null),
		parent: t,
		target: e
	};
	function o(e) {
		e.modified ||= !0, e.parent && (!e.parent.retainIdentity && e.parent.tracker.copy_[e.parent.prop] === e.copy_ && (e.parent.tracker.assigned_[e.parent.prop] = !0), o(e.parent.tracker));
	}
	function s(e) {
		if (e.copy_ instanceof Map || e.copy_ instanceof Set) return Ic(Array.from(e.copy_), Array.from(e.originalObject));
		for (let t in e.assigned_) if (!e.assigned_[t] || Object.hasOwn(e.copy_, t) !== Object.hasOwn(e.originalObject, t) || !Ic(e.copy_[t], e.originalObject[t])) return !1;
		return !0;
	}
	function c(e) {
		if (s(e)) {
			e.modified = !1, e.assigned_ = /* @__PURE__ */ Object.create(null);
			let t = e.parent;
			t && (Ic(t.tracker.copy_[t.prop], t.tracker.originalObject[t.prop]) && delete t.tracker.assigned_[t.prop], c(t.tracker));
		}
	}
	function l(e, t) {
		let n = a.originalObject;
		return Object.hasOwn(n, e) && Ic(t, n[e]);
	}
	function u(e, t) {
		t ? (delete a.assigned_[e.toString()], a.modified = !0, c(a)) : (a.assigned_[e.toString()] = !0, o(a));
	}
	let d = new Proxy(a.copy_, {
		get(e, t, n) {
			let s = a.copy_[t], c = Object.getOwnPropertyDescriptor(e, t);
			if (c?.get) return s;
			if (c?.configurable === !1 && !c.writable) return Mc(s) && (a.assigned_[String(t)] = !0, o(a)), s;
			if (typeof s == "function") {
				if (Object.hasOwn(e, t) || t === "constructor") return s;
				let c = t.toString();
				if (c === "subarray" && ArrayBuffer.isView(e)) return (...t) => r(s.apply(e, t), {
					tracker: a,
					prop: "",
					retainIdentity: !0
				}).proxy;
				if (Ac.has(c) && (Array.isArray(e) || ArrayBuffer.isView(e))) return Nc(s, a, o, n);
				if (Array.isArray(e)) return s.bind(n);
				if (e instanceof Map || e instanceof Set) {
					let l = (e) => {
						let t = kc(e);
						return typeof t == "object" && t ? i.get(t) ?? t : t;
					};
					if (c === "has" || c === "delete" || c === "add" || c === "set") return (...t) => {
						e instanceof Set ? t[0] = l(t[0]) : c === "set" && (t[1] = l(t[1]));
						let r = s.apply(e, t);
						return c !== "has" && o(a), r === e ? n : r;
					};
					if (e instanceof Map && c === "get") return (t) => {
						let n = e.get(t);
						return Mc(n) ? r(n, {
							tracker: a,
							prop: "",
							retainIdentity: !0
						}).proxy : n;
					};
					if (c === "clear") return Nc(s, a, o, n);
					let u = Pc(c, t, a, n, r);
					if (u) return u;
				}
				return s.bind(e);
			}
			return Mc(s) ? r(s, {
				tracker: a,
				prop: String(t)
			}).proxy : s;
		},
		set(e, t, n) {
			if (Reflect.getOwnPropertyDescriptor(e, t)?.get) return Reflect.set(e, t, n);
			let r = a.copy_[t];
			if (!Object.hasOwn(a.copy_, t) || !Ic(r, n)) {
				let e = l(t, n);
				a.copy_[t] = e ? Fc(a.originalObject[t]) : n, u(t, e);
			}
			return !0;
		},
		defineProperty(e, t, n) {
			let r = Reflect.defineProperty(e, t, n);
			return r && ("value" in n || n.get || n.set) && u(t, l(t, Reflect.get(e, t))), r;
		},
		getOwnPropertyDescriptor(e, t) {
			return Reflect.getOwnPropertyDescriptor(e, t);
		},
		preventExtensions(e) {
			return Reflect.preventExtensions(e);
		},
		isExtensible(e) {
			return Reflect.isExtensible(e);
		},
		deleteProperty(e, t) {
			let n = typeof t == "symbol" ? t.toString() : t;
			if (Object.hasOwn(e, t)) {
				let r = Object.prototype.propertyIsEnumerable.call(a.originalObject, t), i = Reflect.deleteProperty(e, t);
				return i && (r ? (a.assigned_[n] = !1, o(a)) : (delete a.assigned_[n], a.modified = !0, c(a))), i;
			}
			return !0;
		}
	});
	return Dc.set(d, a.copy_), {
		proxy: d,
		getChanges: () => {
			if (!a.modified) return {};
			if (typeof a.copy_ != "object" || Array.isArray(a.copy_) || Object.keys(a.assigned_).length === 0) return a.copy_;
			let e = {}, t = Object.keys(a.assigned_).some((e) => typeof a.copy_[e] == "object" || typeof a.originalObject[e] == "object"), n = /* @__PURE__ */ new Map([[a.copy_, a.originalObject]]);
			for (let r in a.copy_) {
				let i = a.copy_[r], o = a.originalObject[r];
				(a.assigned_[r] === !0 || t && !Ic(i instanceof Set ? Array.from(i) : i, o instanceof Set ? Array.from(o) : o, n)) && Oc(e, r, a.copy_[r]);
			}
			for (let t of Object.keys(a.assigned_)) a.assigned_[t] === !1 && Oc(e, t, void 0);
			return e;
		}
	};
}
function Rc(e) {
	let t = e.map((e) => Lc(e));
	return {
		proxies: t.map((e) => e.proxy),
		getChanges: () => t.map((e) => e.getChanges())
	};
}
function zc(e, t) {
	let { proxy: n, getChanges: r } = Lc(e);
	return t(n), Fc(r(), void 0, !0);
}
function Bc(e, t) {
	let { proxies: n, getChanges: r } = Rc(e);
	return t(n), Fc(r(), void 0, !0);
}
function Vc(e) {
	let t = Object.getPrototypeOf(e);
	if (t !== Object.prototype && t !== null) return !1;
	for (let t in e) {
		let { value: n, get: r } = Object.getOwnPropertyDescriptor(e, t);
		if (r || typeof n == "object" && n) return !1;
	}
	return Object.getOwnPropertySymbols(e).length === 0;
}
function Hc(e, t, n) {
	if (!e.every(Vc)) return;
	let r = e.map((e) => ({ ...e }));
	return t(n ? r : r[0]), r.map((t, n) => {
		let r = e[n], i = {}, a = !1;
		for (let e in t) {
			let n = t[e], o = r[e];
			Object.hasOwn(r, e) && (n === o || Object.is(n, o) || typeof o == "object" && o && Ic(n, o)) || (Oc(i, e, n), typeof n == "object" && n && (a = !0));
		}
		for (let e in r) Object.hasOwn(t, e) || Oc(i, e, void 0);
		return a ? Fc(i, void 0, !0) : i;
	});
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/transaction-commit-work.js
var Uc = /* @__PURE__ */ new WeakMap();
function Wc(e) {
	let t = Uc.get(e);
	if (t) return Uc.delete(e), Promise.allSettled(t).then((e) => {
		let t = e.find((e) => e.status === "rejected");
		if (t?.status === "rejected") throw t.reason;
	});
}
var Gc = new class {
	constructor() {
		this.transactions = [], this.bm = [], this.sequenceNumber = 0;
	}
	createTransaction(e) {
		let t = new $c(e, this, this.sequenceNumber++);
		return this.transactions.push(t), t;
	}
	getActiveTransaction() {
		return this.bm.at(-1);
	}
	getActiveTransactionForCollection() {
		let e = this.getActiveTransaction();
		if (e) return e;
		if (this !== Gc) return Gc.eJ(this);
	}
	eJ(e) {
		let t = this.getActiveTransaction();
		if (!t) return;
		let r = Jc(t);
		if (r === e) return t;
		if (r !== this) throw Error(n(162));
		return this.removeTransaction(t), e.transactions.push(t), e.bm.push(t), t.sequenceNumber = e.sequenceNumber++, Kc.set(t, e), t;
	}
	registerTransaction(e) {
		Ts.clear(e.id), this.bm.push(e);
	}
	unregisterTransaction(e, t = !1) {
		try {
			Ts.flush(e.id);
		} finally {
			t || this.clearTransactionContext(e);
		}
	}
	clearTransactionContext(e) {
		let t = this.bm.lastIndexOf(e);
		t !== -1 && this.bm.splice(t, 1);
	}
	removeTransaction(e) {
		let t = this.transactions.indexOf(e);
		t !== -1 && this.transactions.splice(t, 1);
	}
	rollbackConflictingTransactions(e, t) {
		let n = [];
		for (let r of [...this.transactions]) if (r !== e && r.state === "pending" && r.mutations.some((e) => t.has(e.globalKey))) try {
			r.rollback({ isSecondaryRollback: !0 });
		} catch (e) {
			n.push(e);
		}
		if (n.length > 0) throw n[0];
	}
	clear() {
		let e = /* @__PURE__ */ new Set([...this.transactions.map((e) => e.id), ...this.bm.map((e) => e.id)]);
		for (let t of e) Ts.clear(t);
		this.transactions = [], this.bm = [];
	}
}(), Kc = /* @__PURE__ */ new WeakMap(), qc = /* @__PURE__ */ new WeakMap();
function Jc(e) {
	let t = Kc.get(e);
	if (!t) throw Error(n(163));
	return t;
}
function Yc(e) {
	let t = qc.get(e);
	if (!t) throw Error(n(164));
	return t;
}
function Xc(e, t) {
	switch (`${e.type}-${t.type}`) {
		case "insert-update": return {
			...e,
			type: "insert",
			original: {},
			modified: t.modified,
			changes: {
				...e.changes,
				...t.changes
			},
			key: e.key,
			globalKey: e.globalKey,
			metadata: t.metadata ?? e.metadata,
			syncMetadata: {
				...e.syncMetadata,
				...t.syncMetadata
			},
			mutationId: t.mutationId,
			updatedAt: t.updatedAt
		};
		case "insert-delete": return null;
		case "update-delete":
		case "delete-delete": return t;
		case "update-update": return {
			...t,
			original: e.original,
			changes: {
				...e.changes,
				...t.changes
			},
			metadata: t.metadata ?? e.metadata,
			syncMetadata: {
				...e.syncMetadata,
				...t.syncMetadata
			}
		};
		case "insert-insert": return t;
		case "delete-insert": {
			let n = e.collection._state.syncedData.get(e.key);
			if (n === void 0) return t;
			if (W(n, t.modified)) return null;
			let r = t.modified, i = /* @__PURE__ */ new Set([...Object.keys(n), ...Object.keys(r)]), a = {};
			for (let e of i) Object.hasOwn(n, e) === Object.hasOwn(r, e) && W(n[e], r[e]) || (a[e] = r[e]);
			return {
				...t,
				type: "update",
				original: n,
				changes: a,
				metadata: t.metadata ?? e.metadata,
				syncMetadata: {
					...e.syncMetadata,
					...t.syncMetadata
				}
			};
		}
		default: {
			let r = `${e.type}-${t.type}`;
			throw Error(n(165, { combination: r }));
		}
	}
}
function Zc(e) {
	return Gc.createTransaction(e);
}
function Qc() {
	return Gc.getActiveTransaction();
}
var $c = class {
	constructor(e, t, n) {
		if (this.collections = /* @__PURE__ */ new Set(), e.mutationFn === void 0) throw new cr();
		this.id = e.id ?? An(), this.mutationFn = e.mutationFn, this.state = "pending", this.mutations = [], this.isPersisted = Gs(), this.isPersisted.promise.catch(() => void 0), this.autoCommit = e.autoCommit ?? !0, this.createdAt = /* @__PURE__ */ new Date(), this.sequenceNumber = n, this.metadata = e.metadata ?? {}, Kc.set(this, t), qc.set(this, t);
	}
	when(e) {
		return this.isPersisted.promise;
	}
	setState(e) {
		this.state = e, (e === "completed" || e === "failed") && Jc(this).removeTransaction(this);
	}
	mutate(e) {
		if (this.state !== "pending") throw new lr();
		let t = Jc(this), r = /* @__PURE__ */ new Set([t, Yc(this)]);
		for (let e of r) e.registerTransaction(this);
		let i, a = this.gq;
		this.gq = () => {
			a?.(), i ??= [...this.mutations];
		};
		let o = !1;
		try {
			e();
		} catch (e) {
			let t = i ?? this.mutations, a = new Set([...t, ...this.mutations].map((e) => e.collection));
			i && this.mutations.splice(0, this.mutations.length, ...i), r.add(Jc(this));
			for (let e of r) e.clearTransactionContext(this);
			o = !0;
			let s = [];
			for (let e of a) try {
				e._state.onTransactionStateChange();
			} catch (e) {
				s.push(e);
			}
			throw s.length ? AggregateError([e, ...s], n(174), { cause: e }) : e;
		} finally {
			this.gq = a, r.add(Jc(this));
			for (let e of r) e.unregisterTransaction(this, o);
		}
		return this.autoCommit && this.commit().catch(() => {}), this;
	}
	applyMutations(e) {
		this.gq?.();
		let t = /* @__PURE__ */ new Map();
		for (let e of this.mutations) t.set(e.globalKey, e);
		for (let n of e) {
			let e = t.get(n.globalKey);
			if (e) {
				let r = Xc(e, n);
				r === null ? t.delete(n.globalKey) : t.set(n.globalKey, r);
			} else t.set(n.globalKey, n);
		}
		this.mutations.length = 0;
		for (let e of t.values()) this.mutations.push(e);
	}
	rollback(e) {
		let t = e?.isSecondaryRollback ?? !1;
		if (this.state === "completed") throw new ur();
		if (this.state === "failed") return this;
		e?.error && (this.error = {
			message: e.error.message,
			error: e.error
		}), this.setState("failed");
		try {
			if (!t) {
				let e = new Set(this.mutations.map((e) => e.globalKey));
				Jc(this).rollbackConflictingTransactions(this, e);
			}
		} finally {
			this.isPersisted.reject(this.error?.error), this.touchCollection();
		}
		return this;
	}
	touchCollection() {
		let e = new Set(this.collections);
		for (let t of this.mutations) e.add(t.collection);
		(this.state === "completed" || this.state === "failed") && this.collections.clear();
		let t = [];
		for (let n of e) try {
			n._state.onTransactionStateChange(), n._state.pendingSyncedTransactions.length > 0 && n._state.commitPendingTransactions();
		} catch (e) {
			t.push(e);
		}
		if (t.length > 0) throw t[0];
	}
	async commit() {
		if (this.state !== "pending") throw new fr();
		if (this.setState("persisting"), this.mutations.length === 0) {
			this.setState("completed");
			try {
				this.touchCollection();
			} finally {
				this.isPersisted.resolve(this);
			}
			return this;
		}
		try {
			await this.mutationFn({ transaction: this });
			let e = Wc(this);
			e && await e;
		} catch (e) {
			if (this.state !== "persisting") return this;
			let t = Ws(e);
			try {
				await Wc(this);
			} catch {}
			this.error = {
				message: t.message,
				error: t
			};
			try {
				this.rollback();
			} catch {}
			throw t;
		}
		if (this.state !== "persisting") return this;
		this.setState("completed");
		try {
			this.touchCollection();
		} finally {
			this.isPersisted.resolve(this);
		}
		return this;
	}
	compareCreatedAt(e) {
		let t = this.createdAt.getTime() - e.createdAt.getTime();
		return t === 0 ? this.sequenceNumber - e.sequenceNumber : t;
	}
}, el, tl = 0;
function nl() {
	return el ??= An(), `${el}-${++tl}`;
}
var rl = class {
	constructor(e, t) {
		this.insert = (e, t) => {
			this.lifecycle.validateCollectionUsable("insert");
			let n = this.state, r = this.getActiveTransaction();
			if (!r && !this.config.onInsert) throw new ir();
			let i = Array.isArray(e) ? e : [e], a = /* @__PURE__ */ new Date(), o = [], s = /* @__PURE__ */ new Set();
			i.forEach((e) => {
				let n = this.validateData(e, "insert"), r = this.config.getKey(n);
				if (s.has(r)) throw new Yn(r);
				s.add(r);
				let i = this.generateGlobalKey(r, e), c = {
					mutationId: nl(),
					original: {},
					modified: n,
					changes: Object.fromEntries(Object.keys(e).map((e) => [e, n[e]])),
					globalKey: i,
					key: r,
					metadata: t?.metadata,
					syncMetadata: this.config.sync.getSyncMetadata?.() || {},
					optimistic: t?.optimistic ?? !0,
					type: "insert",
					createdAt: a,
					updatedAt: a,
					collection: this.collection
				};
				o.push(c);
			});
			let c = o.find(({ key: e }) => n.has(e));
			if (c || (this.collection._sync.startSync(), c = o.find(({ key: e }) => n.has(e)), c)) throw new Yn(c.key);
			return r ? (this.bX(r, o), r) : this.cn("insert", (e) => this.config.onInsert(e), o);
		}, this.delete = (e, t) => {
			let n = this.state;
			this.lifecycle.validateCollectionUsable("delete");
			let r = this.getActiveTransaction();
			if (!r && !this.config.onDelete) throw new or();
			if (Array.isArray(e) && e.length === 0) throw new tr();
			let i = Array.isArray(e) ? e : [e];
			this.collection._sync.startSync();
			let a = /* @__PURE__ */ new Date(), o = [];
			for (let e of i) {
				if (!this.state.has(e)) throw new nr(e);
				let r = this.generateGlobalKey(e, this.state.get(e)), i = {
					mutationId: nl(),
					original: this.state.get(e),
					modified: this.state.get(e),
					changes: this.state.get(e),
					globalKey: r,
					key: e,
					metadata: t?.metadata,
					syncMetadata: n.syncedMetadata.get(e) || {},
					optimistic: t?.optimistic ?? !0,
					type: "delete",
					createdAt: a,
					updatedAt: a,
					collection: this.collection
				};
				o.push(i);
			}
			return r ? (this.bX(r, o), r) : this.cn("delete", (e) => this.config.onDelete(e), o);
		}, this.id = t, this.config = e;
	}
	setDeps(e) {
		this.lifecycle = e.lifecycle, this.state = e.state, this.collection = e.collection;
	}
	setTransactionScope(e) {
		this.fR = e;
	}
	getActiveTransaction() {
		return this.fR ? this.fR.getActiveTransactionForCollection() : Qc();
	}
	createTransaction(e) {
		return this.fR ? this.fR.createTransaction(e) : Zc(e);
	}
	eX(e) {
		if (e && "~standard" in e) return e;
		throw new zn();
	}
	validateData(e, t, n) {
		if (!this.config.schema) return e;
		let r = this.eX(this.config.schema);
		if (t === "update" && n) {
			let i = this.state.get(n);
			if (i && e && typeof e == "object" && typeof i == "object") {
				let n = {
					...i,
					...e
				}, a = r["~standard"].validate(n);
				if (a instanceof Promise) throw new Bn();
				if ("issues" in a && a.issues) throw new Fn(t, a.issues.map((e) => ({
					message: e.message,
					path: e.path?.map((e) => String(e))
				})));
				let o = a.value, s = Object.keys(e);
				return Object.fromEntries(s.map((e) => [e, o[e]]));
			}
		}
		let i = r["~standard"].validate(e);
		if (i instanceof Promise) throw new Bn();
		if ("issues" in i && i.issues) throw new Fn(t, i.issues.map((e) => ({
			message: e.message,
			path: e.path?.map((e) => String(e))
		})));
		return i.value;
	}
	generateGlobalKey(e, t) {
		if (typeof e != "string" && typeof e != "number") throw e === void 0 ? new qn(t) : new Jn(e, t);
		return `KEY::${JSON.stringify([
			this.id,
			typeof e,
			String(e)
		])}`;
	}
	f7(e, t) {
		let n = this.state.localOnlyDirectWrite;
		if (!n?.types.has(t)) return;
		for (let e of this.state.transactions.values()) if (e.state === "pending" || e.state === "persisting") return;
		let r = this.createTransaction({
			autoCommit: !1,
			mutationFn: () => Promise.resolve()
		});
		r.applyMutations(e);
		try {
			n.write(e);
		} finally {
			r.setState("completed"), r.isPersisted.resolve(r);
		}
		return r;
	}
	bX(e, t) {
		this.state.trackTransaction(e), e.applyMutations(t), this.state.recomputeOptimisticState(!0);
	}
	cn(e, t, n) {
		let r = this.f7(n, e);
		if (r) return r;
		let i = this.createTransaction({ mutationFn: async (e) => await t({
			transaction: e.transaction,
			collection: this.collection
		}) });
		try {
			this.bX(i, n);
		} catch (e) {
			try {
				i.rollback({
					isSecondaryRollback: !0,
					error: Ws(e)
				});
			} catch {}
			throw e;
		}
		return i.commit().catch(() => void 0), i;
	}
	update(e, t, n) {
		if (e === void 0) throw new Zn();
		let r = this.state;
		this.lifecycle.validateCollectionUsable("update");
		let i = this.getActiveTransaction();
		if (!i && !this.config.onUpdate) throw new ar();
		let a = Array.isArray(e), o = a ? e : [e];
		if (a && o.length === 0) throw new Qn();
		let s = typeof t == "function" ? t : n;
		if (typeof s != "function") throw TypeError();
		let c = typeof t == "function" ? {} : t;
		this.collection._sync.startSync();
		let l = o.map((e) => {
			let t = this.state.get(e);
			if (!t) throw new $n(e);
			return t;
		}), u = Hc(l, s, a) ?? (a ? Bc(l, s) : [zc(l[0], s)]), d = /* @__PURE__ */ new Date(), f = o.map((e, t) => {
			let n = u[t];
			if (!n || Object.keys(n).length === 0) return null;
			let i = l[t], a = this.validateData(n, "update", e), o = {
				...i,
				...a
			}, s = this.config.getKey(i), f = this.config.getKey(o);
			if (s !== f) throw new er(s, f);
			let p = this.generateGlobalKey(f, o);
			return {
				mutationId: nl(),
				original: i,
				modified: o,
				changes: a === n ? n : Object.fromEntries(Object.keys(n).map((e) => [e, o[e]])),
				globalKey: p,
				key: e,
				metadata: c.metadata,
				syncMetadata: r.syncedMetadata.get(e) || {},
				optimistic: c.optimistic ?? !0,
				type: "update",
				createdAt: d,
				updatedAt: d,
				collection: this.collection
			};
		}).filter(Boolean);
		if (f.length === 0) {
			let e = this.createTransaction({ mutationFn: async () => {} });
			return e.commit().catch(() => void 0), e;
		}
		return i ? (this.bX(i, f), i) : this.cn("update", (e) => this.config.onUpdate(e), f);
	}
}, il = class extends Rs {
	constructor() {
		super();
	}
	setDeps(e) {
		this.collection = e.collection;
	}
	emit(e, t) {
		this.emitInner(e, t);
	}
	emitStatusChange(e, t, n) {
		if (this.emitInnerWhile("status:change", {
			type: "status:change",
			collection: this.collection,
			previousStatus: t,
			status: e
		}, n), !n()) return;
		let r = `status:${e}`;
		this.emitInnerWhile(r, {
			type: r,
			collection: this.collection,
			previousStatus: t,
			status: e
		}, n);
	}
	emitSubscribersChange(e, t) {
		this.emit("subscribers:change", {
			type: "subscribers:change",
			collection: this.collection,
			previousSubscriberCount: t,
			subscriberCount: e
		});
	}
	emitIndexAdded(e) {
		this.emit("index:added", {
			type: "index:added",
			collection: this.collection,
			index: e
		});
	}
	emitIndexRemoved(e) {
		this.emit("index:removed", {
			type: "index:removed",
			collection: this.collection,
			index: e
		});
	}
	cleanup() {
		this.clearListeners();
	}
}, al = /* @__PURE__ */ Symbol.for("@tanstack/db.collectionSyncConfig.factory"), ol = /* @__PURE__ */ Symbol.for("@tanstack/db.collectionSyncConfig.cleanup");
function sl(e, t, n) {
	let r = e[al];
	if (!r) return {
		sync: e,
		utilities: t
	};
	let i = Object.create(Object.getPrototypeOf(t), Object.getOwnPropertyDescriptors(t));
	return {
		sync: r(e, i, n),
		utilities: i
	};
}
function cl(e) {
	let t = e[ol];
	t?.();
}
function ll(e) {
	let t = e[Nn];
	return ul(e, t?.());
}
function ul(e, t) {
	try {
		return new dl(e);
	} catch (e) {
		throw t?.(), e;
	}
}
var dl = class {
	constructor(e) {
		if (this.utils = {}, this.deferDataRefresh = null, this.insert = (e, t) => this.cS.insert(e, t), this.delete = (e, t) => this.cS.delete(e, t), !e) throw new Ln();
		if (!e.sync) throw new Rn();
		this.id = e.id ? e.id : An();
		let { sync: t, utilities: r } = sl(e.sync, e.utils ?? {}, () => {
			this._lifecycle.status === "idle" && this._sync.startSync();
		});
		if (this.config = {
			...e,
			sync: t,
			autoIndex: e.autoIndex ?? "off",
			utils: r
		}, this.utils = r, this.config.autoIndex === "eager" && !e.defaultIndexType) throw new In(n(206));
		Ke(this), this.cC = new Ys(), this.a3 = new il(), this.dd = new Ec(), this._lifecycle = new nc(this.config, this.id, () => cl(this.config.sync)), this.cS = new rl(this.config, this.id), this._state = new ws(this.config), this._sync = new oc(this.config, this.id), this.eS = fl(e), this.cC.setDeps({
			collection: this,
			lifecycle: this._lifecycle,
			sync: this._sync,
			events: this.a3,
			state: this._state
		}), this.a3.setDeps({ collection: this }), this.dd.setDeps({
			state: this._state,
			lifecycle: this._lifecycle,
			defaultIndexType: e.defaultIndexType,
			events: this.a3
		}), this._lifecycle.setDeps({
			changes: this.cC,
			events: this.a3,
			indexes: this.dd,
			state: this._state,
			sync: this._sync
		}), this.cS.setDeps({
			collection: this,
			lifecycle: this._lifecycle,
			state: this._state
		}), this._state.setDeps({
			collection: this,
			lifecycle: this._lifecycle,
			changes: this.cC,
			indexes: this.dd,
			events: this.a3
		}), this._sync.setDeps({
			collection: this,
			state: this._state,
			lifecycle: this._lifecycle,
			events: this.a3
		}), e.startSync === !0 && this._sync.startSync();
	}
	get status() {
		return this._lifecycle.status;
	}
	get subscriberCount() {
		return this.cC.acquiringSubscribersCount;
	}
	get _stateRevision() {
		return this.cC.stateRevision;
	}
	get _layoutRevision() {
		return this.cC.layoutRevision;
	}
	_subscribeLayoutChanges(e) {
		return this.cC.subscribeLayoutChanges(e);
	}
	_markLayoutChange() {
		this._sync.markLayoutChange();
	}
	_deferPublication() {
		return this.cC.deferPublication();
	}
	onFirstReady(e) {
		return this._lifecycle.onFirstReady(e);
	}
	isReady() {
		return this._lifecycle.status === "ready";
	}
	get isLoadingSubset() {
		return this._sync.isLoadingSubset;
	}
	startSyncImmediate() {
		this._sync.startSync();
	}
	_onCleanupStart(e) {
		return this._lifecycle.onCleanupStart(e);
	}
	_setTransactionScope(e) {
		this.cS.setTransactionScope(e);
	}
	_hasHydratedKey(e) {
		return this._state.hydratedKeys.has(e);
	}
	_deferSyncStart() {
		return this._sync.deferStart();
	}
	_resumeSyncStart() {
		this._sync.resumeStart();
	}
	preload() {
		return this.gz(() => this._sync.preload());
	}
	gz(e) {
		try {
			this._markPreload();
		} catch (e) {
			return Promise.reject(e);
		}
		return e();
	}
	_markPreload() {
		this.cC.markSubscriberOrPreload();
	}
	_hasSubscriberOrPreload() {
		return this.cC.hasSubscriberOrPreload();
	}
	_onFirstSubscriberOrPreload(e) {
		return this.cC.onFirstSubscriberOrPreload(e);
	}
	get base() {
		return this._state.syncedData;
	}
	_syncedRowMetadataKeysOutsideBase() {
		let e = [];
		for (let t of this._state.syncedMetadata.keys()) this._state.syncedData.has(t) || e.push(t);
		return e;
	}
	get(e) {
		return this._state.getWithVirtualProps(e);
	}
	has(e) {
		return this._state.has(e);
	}
	_optimisticOverlaySize() {
		return this._state.optimisticDeletes.size + this._state.optimisticUpserts.size;
	}
	_hasOptimisticOverlay(e) {
		return this._state.optimisticDeletes.has(e) || this._state.optimisticUpserts.has(e);
	}
	_hasHeldSyncTransaction() {
		return this._state.hasHeldSyncTransaction();
	}
	get size() {
		return this._state.size;
	}
	*keys() {
		yield* this._state.keys();
	}
	*values() {
		for (let e of this._state.keys()) {
			let t = this.get(e);
			t !== void 0 && (yield t);
		}
	}
	*entries() {
		for (let e of this._state.keys()) {
			let t = this.get(e);
			t !== void 0 && (yield [e, t]);
		}
	}
	*[Symbol.iterator]() {
		yield* this.entries();
	}
	forEach(e) {
		let t = 0;
		for (let [n, r] of this.entries()) e(r, n, t++);
	}
	map(e) {
		let t = [], n = 0;
		for (let [r, i] of this.entries()) t.push(e(i, r, n++));
		return t;
	}
	getKeyFromItem(e) {
		return this.config.getKey(e);
	}
	createIndex(e, t = {}) {
		return this.dd.createIndex(e, t);
	}
	removeIndex(e) {
		return this.dd.removeIndex(e);
	}
	getIndexMetadata() {
		return this.dd.getIndexMetadataSnapshot();
	}
	get indexes() {
		return this.dd.indexes;
	}
	validateData(e, t, n) {
		return this.cS.validateData(e, t, n);
	}
	get compareOptions() {
		return { ...this.eS };
	}
	update(e, t, n) {
		return this.cS.update(e, t, n);
	}
	get state() {
		let e = /* @__PURE__ */ new Map();
		for (let [t, n] of this.entries()) e.set(t, n);
		return e;
	}
	stateWhenReady() {
		return this.preload().then(() => this.state);
	}
	get toArray() {
		return Array.from(this.values());
	}
	toArrayWhenReady() {
		return this.preload().then(() => this.toArray);
	}
	currentStateAsChanges(e = {}) {
		return _s(this, e, (e) => this._state.entriesPassing(e));
	}
	subscribeChanges(e, t = {}) {
		return this.cC.subscribeChanges((t) => e(t), t);
	}
	on(e, t) {
		return this.a3.on(e, t);
	}
	once(e, t) {
		return this.a3.once(e, t);
	}
	off(e, t) {
		this.a3.off(e, t);
	}
	waitFor(e, t) {
		return this.a3.waitFor(e, t);
	}
	cleanup() {
		return this._lifecycle.cleanup();
	}
};
function fl(e) {
	let t = e.defaultStringCollation;
	return t ? t.stringSort === "lexical" ? { stringSort: "lexical" } : t.stringSort === "custom" ? {
		stringSort: "custom",
		compare: t.compare
	} : {
		stringSort: "locale",
		..."locale" in t && t.locale !== void 0 && { locale: t.locale },
		..."localeOptions" in t && t.localeOptions !== void 0 && { localeOptions: t.localeOptions }
	} : { stringSort: "locale" };
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/get-or-create.js
function pl(e, t, n) {
	let r = e.get(t);
	return r === void 0 && (r = n(), e.set(t, r)), r;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/optimizer.js
function ml(e) {
	if (e.from.type === "unionAll") return {
		optimizedQuery: {
			...e,
			from: new g(e.from.queries.map((e) => ml(e).optimizedQuery))
		},
		sourceWhereClauses: /* @__PURE__ */ new Map()
	};
	let t = hl(e), n = e, r, i = 0;
	for (; i < 10 && !W(n, r);) r = n, n = vl(n), i++;
	return {
		optimizedQuery: bl(n),
		sourceWhereClauses: t
	};
}
function hl(e) {
	let t = /* @__PURE__ */ new Map();
	if (!e.where || e.where.length === 0) return t;
	let n = wl(e.where), r = El(e), i = Ol(n.map((e) => Dl(e, r))), a = _l(e);
	for (let [n, r] of i.singleSource) gl(e, n) && !a.has(n) && t.set(n, r);
	return t;
}
function gl(e, t) {
	for (let n of j(e.from)) if (n.alias === t) return n.type === "collectionRef" || n.type === "descriptorRef";
	if (e.join) {
		for (let n of e.join) if (n.from.alias === t) return n.from.type === "collectionRef" || n.from.type === "descriptorRef";
	}
	return !1;
}
function _l(e) {
	let t = /* @__PURE__ */ new Set();
	if (e.join) {
		let n = new Set(j(e.from).map((e) => e.alias));
		for (let r of e.join) {
			let e = r.from.alias;
			if ((r.type === "left" || r.type === "full") && t.add(e), r.type === "right" || r.type === "full") for (let e of n) t.add(e);
			n.add(e);
		}
	}
	return t;
}
function vl(e) {
	return yl({
		...e,
		from: Nl(e.from),
		join: e.join?.map((e) => ({
			...e,
			from: e.from.type === "queryRef" ? new m(vl(e.from.query), e.from.alias, e.from.bindingId) : e.from
		}))
	});
}
function yl(e) {
	if (!e.where || e.where.length === 0 || e.from.type === "unionFrom") return e;
	if (!e.join || e.join.length === 0) {
		if (e.where.length > 1) {
			let t = Bl(wl(e.where));
			return {
				...e,
				where: [t]
			};
		}
		return e;
	}
	let t = wl(e.where.filter((e) => !A(e))), n = El(e);
	return kl(e, Ol(t.map((e) => Dl(e, n))));
}
function bl(e) {
	return {
		...e,
		from: xl(e.from),
		join: e.join?.map((e) => ({
			...e,
			from: Sl(e.from)
		}))
	};
}
function xl(e) {
	if (e.type === "unionFrom") return new h(e.sources.map((e) => xl(e)));
	if (e.type === "unionAll") return new g(e.queries.map((e) => bl(e)));
	if (e.type === "collectionRef" || e.type === "descriptorRef") return e;
	let t = bl(e.query);
	if (Cl(t) && e.alias === Pl(t)) {
		let n = xl(t.from);
		if (n.type === "collectionRef" || n.type === "descriptorRef") return n.bindingId === e.bindingId ? n : new m(t, e.alias, e.bindingId);
		if (n.type === "queryRef") return new m(n.query, e.alias, e.bindingId);
	}
	return new m(t, e.alias, e.bindingId);
}
function Sl(e) {
	return xl(e);
}
function Cl(e) {
	return (!e.where || e.where.length === 0) && !e.select && (!e.groupBy || e.groupBy.length === 0) && (!e.having || e.having.length === 0) && (!e.orderBy || e.orderBy.length === 0) && (!e.join || e.join.length === 0) && e.limit === void 0 && e.offset === void 0 && !e.fnSelect && (!e.fnWhere || e.fnWhere.length === 0) && (!e.fnHaving || e.fnHaving.length === 0) && !e.distinct && !e.singleResult;
}
function wl(e) {
	let t = [];
	for (let n of e) {
		let e = k(n);
		t.push(...Tl(e));
	}
	return t;
}
function Tl(e) {
	if (e.type === "func" && e.name === "and") {
		let t = [];
		for (let n of e.args) t.push(...Tl(n));
		return t;
	}
	return [e];
}
function El(e) {
	return /* @__PURE__ */ new Set([...j(e.from).map((e) => e.bindingId), ...e.join?.map(({ from: e }) => e.bindingId) ?? []]);
}
function Dl(e, t) {
	let n = /* @__PURE__ */ new Set(), r = !1, i = !1;
	function a(e) {
		switch (e.type) {
			case "ref":
				if (e.bindingId !== void 0 && !t.has(e.bindingId) && (i = !0), e.path && e.path.length > 0) {
					let t = e.path[0];
					t && (n.add(t), e.path.length === 1 && (r = !0));
				}
				break;
			case "func":
				e.args && e.args.forEach(a);
				break;
			case "val": break;
			case "agg": e.args && e.args.forEach(a);
		}
	}
	return a(e), {
		expression: e,
		touchedSources: n,
		hasNamespaceOnlyRef: r,
		hasExternalBinding: i
	};
}
function Ol(e) {
	let t = /* @__PURE__ */ new Map(), n = [];
	for (let r of e) if (r.touchedSources.size === 1 && !r.hasNamespaceOnlyRef && !r.hasExternalBinding) {
		let e = Array.from(r.touchedSources)[0];
		t.has(e) || t.set(e, []), t.get(e).push(r.expression);
	} else n.push(r.expression);
	let r = /* @__PURE__ */ new Map();
	for (let [e, n] of t) r.set(e, Bl(n));
	return {
		singleSource: r,
		multiSource: n.length > 0 ? Bl(n) : void 0
	};
}
function kl(e, t) {
	let n = /* @__PURE__ */ new Set(), r = _l(e), i = /* @__PURE__ */ new Map();
	for (let [e, n] of t.singleSource) r.has(e) || i.set(e, n);
	let a = Fl(e.from, i, n), o = e.join ? e.join.map((e) => ({
		...e,
		from: Fl(e.from, i, n)
	})) : void 0, s = [], c = e.where?.filter(A) ?? [];
	t.multiSource && s.push(t.multiSource);
	let l = r.size > 0;
	for (let [e, r] of t.singleSource) n.has(e) ? l && c.push(ne(r)) : s.push(r);
	let u = (e) => e.length > 1 ? Bl(e.flatMap((e) => Tl(k(e)))) : e[0], d = u(s), f = u(c), p = [...d ? [d] : [], ...f ? [ne(k(f))] : []];
	return {
		...jl(e),
		from: a,
		join: o,
		where: p.length > 0 ? p : []
	};
}
function Al(e) {
	return {
		...jl(e),
		from: Ml(e.from),
		join: e.join ? e.join.map((e) => ({
			type: e.type,
			on: e.on,
			from: Ml(e.from)
		})) : void 0,
		where: e.where ? [...e.where] : void 0
	};
}
function jl(e) {
	return {
		...e,
		groupBy: e.groupBy ? [...e.groupBy] : void 0,
		having: e.having ? [...e.having] : void 0,
		orderBy: e.orderBy ? [...e.orderBy] : void 0,
		fnWhere: e.fnWhere ? [...e.fnWhere] : void 0,
		fnHaving: e.fnHaving ? [...e.fnHaving] : void 0
	};
}
function Ml(e) {
	return e.type === "collectionRef" || e.type === "descriptorRef" ? e : e.type === "queryRef" ? new m(Al(e.query), e.alias, e.bindingId) : e.type === "unionAll" ? new g(e.queries.map((e) => Al(e))) : new h(e.sources.map((e) => Ml(e)));
}
function Nl(e) {
	return e.type === "queryRef" ? new m(vl(e.query), e.alias, e.bindingId) : e.type === "unionFrom" ? new h(e.sources.map((e) => Nl(e))) : e.type === "unionAll" ? new g(e.queries.map((e) => vl(e))) : e;
}
function Pl(e) {
	return j(e.from)[0]?.alias;
}
function Fl(e, t, n) {
	if (e.type === "unionFrom") return new h(e.sources.map((e) => Fl(e, t, n)));
	if (e.type === "unionAll") return new g(e.queries.map((e) => Al(e)));
	let r = t.get(e.alias);
	if (!r) return e.type === "collectionRef" || e.type === "descriptorRef" ? e : new m(Al(e.query), e.alias, e.bindingId);
	if (e.type === "collectionRef" || e.type === "descriptorRef") {
		let t = {
			from: e,
			where: [r]
		};
		return n.add(e.alias), new m(t, e.alias, e.bindingId);
	}
	if (!Ll(e.query, r, e.alias) || zl(e.query, r, e.alias)) return new m(Al(e.query), e.alias, e.bindingId);
	let i = e.query.where || [], a = Il(e.query, r, e.alias);
	if (a === void 0) return new m(Al(e.query), e.alias, e.bindingId);
	let o = {
		...Al(e.query),
		where: [...i, a]
	};
	return n.add(e.alias), new m(o, e.alias, e.bindingId);
}
function Il(e, t, n) {
	let r = Pl(e);
	if (r === void 0) return;
	let i = (t) => {
		if (t instanceof _) {
			if (t.path[0] !== n) return t;
			let i = t.path[1], a = i ? e.select?.[i] : void 0, o = e.join !== void 0 || e.from.type === "unionFrom";
			return new _(a instanceof _ ? [...a.path, ...t.path.slice(2)] : o ? t.path.slice(1) : [r, ...t.path.slice(1)]);
		}
		return t instanceof x ? new x(t.name, t.args.map(i)) : t;
	};
	return i(t);
}
function Ll(e, t, n) {
	return !(e.distinct || e.select && (ns(e.select) || Rl(e.select, t, n)) || e.groupBy?.length || e.having?.length || e.orderBy?.length && (e.limit !== void 0 || e.offset !== void 0) || e.fnSelect || e.fnWhere?.length || e.fnHaving?.length);
}
function Rl(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	for (let [t, n] of Object.entries(e)) t.startsWith("__SPREAD_SENTINEL__") || n instanceof _ || r.add(t);
	let i = C(t);
	for (let e of i) {
		let t = e.path;
		if (!Array.isArray(t) || t.length < 2) continue;
		let i = t[0], a = t[1];
		if (i === n && r.has(a)) return !0;
	}
	return !1;
}
function zl(e, t, n) {
	let r = C(t);
	if (r.every((e) => e.path[0] !== n)) return !1;
	if (e.fnSelect) return !0;
	let i = e.select;
	if (!i) return !1;
	let a = Object.keys(i).some((e) => e.startsWith("__SPREAD_SENTINEL__")), o = El(e);
	for (let t of r) {
		let r = t.path;
		if (r.length < 2 || r[0] !== n) continue;
		let s = i[r[1]];
		if (!s) {
			if (a) return !0;
			continue;
		}
		if (!(s instanceof _) || s.bindingId !== void 0 && !o.has(s.bindingId) || s.path.length < 2) return !0;
		let [c, l] = s.path, u = Pl(e);
		if (c !== n && c !== u || l !== r[1]) return !0;
	}
	return !1;
}
function Bl(e) {
	if (e.length === 0) throw new ii();
	return e.length === 1 ? e[0] : new x("and", e);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live/materialized-pipeline.js
var Vl = /* @__PURE__ */ Symbol("bucketFacadeRef"), Hl = 0;
function Ul(e, t, n = !1) {
	if (!e.includes?.length && !(t && n)) return {
		pipeline: e.pipeline,
		facades: void 0
	};
	let r = Wl(e, t, /* @__PURE__ */ new WeakMap(), "root");
	return {
		...r,
		facades: Gl(r.facades)
	};
}
function Wl(e, t, n, r) {
	let i = n.get(e)?.[r];
	if (i) return i;
	let a = ql(Kl(e.pipeline), t, r, e.valueIdentity), o = [];
	for (let t of e.includes ?? []) {
		let i = Wl(t.childCompilationResult, void 0, n, "child");
		o.push(...i.facades);
		let s = Xl(i.pipeline, t.childCompilationResult.valueIdentity);
		if (t.materialization === "collection") {
			let n = `bucket-facade-${++Hl}`, i = Ql(a, t, e.valueIdentity), c = i.pipe(sn(s), V(([e, [, t]]) => [e, t]));
			o.push({
				edgeId: n,
				rows: c,
				activeBuckets: i,
				hasOrderBy: t.hasOrderBy
			}), a = Zl(a, t, n, r, e.valueIdentity);
		} else a = Yl(a, s, t, r, e.valueIdentity);
	}
	let s = {
		pipeline: a,
		facades: o
	};
	return n.set(e, {
		...n.get(e),
		[r]: s
	}), s;
}
function Gl(e) {
	return [...new Map(e.map((e) => [e.edgeId, e])).values()];
}
function Kl(e) {
	return e.pipe(V(([e, t]) => {
		let n = t;
		return [e, [
			n[0],
			n[1],
			n[2],
			n[3],
			n[0][ea],
			n[4]
		]];
	}));
}
function ql(e, t, r, i) {
	return e.pipe(V(([e, n]) => {
		let a = n, o = t ? t(a[0]) : a[5] ?? e;
		return [I(r === "root" ? ["root", o] : [tu(a[2], a[3], i), o]), {
			publicKey: o,
			tuple: a
		}];
	}), mn((e) => {
		let t = e.reduce((e, [, t]) => e + t, 0);
		if (t === 0) return [];
		if (t < 0) throw Error(n(154));
		let r = e.find(([, e]) => e > 0)?.[0];
		if (!r) throw Error(n(155));
		for (let [t, n] of e) n <= 0 || Jl(r, t);
		return [[r, 1]];
	}), V(([e, { publicKey: t, tuple: n }]) => [r === "root" ? t : e, n]));
}
function Jl(e, t) {
	let [r, i, a, o, s] = e.tuple, [c, l, u, d, f] = t.tuple;
	if (i !== l || !W(r, c) || !W(a, u) || !W(o, d) || !W(s, f)) throw Error(n(156, { publicKey: e.publicKey }));
}
function Yl(e, t, r, i, a) {
	let o = t.pipe(mn((e) => {
		let t = [];
		for (let [r, i] of e) {
			if (i < 0) throw Error(n(157));
			for (let e = 0; e < i; e++) t.push(r);
		}
		return t.length === 0 ? [] : (t.sort(nu), [[{ value: ru(t, r) }, 1]]);
	}));
	return ql(e.pipe(V(([e, t]) => {
		let n = t, i = eu(n, r.fieldName);
		return [i?.active === !0 ? tu(i.correlationKey, i.parentContext, a) : `inactive:${I(e)}`, [e, n]];
	}), sn(o, "left"), V(([e, [t, n]]) => {
		let [i, a] = t, [o, s, c, l, u, d] = a;
		if (u?.[r.fieldName]?.active !== !0) return [i, [
			o,
			s,
			c,
			l,
			u,
			d
		]];
		let f = n === null ? iu(r.materialization) : n.value;
		return [i, [
			au(o, r.resultPath, f),
			s,
			c,
			l,
			u,
			d
		]];
	})), void 0, i, a);
}
function Xl(e, t) {
	return e.pipe(V(([e, n]) => {
		let [r, i, a, o, , s] = n;
		return [tu(a, o, t), [
			s ?? e,
			r,
			i
		]];
	}));
}
function Zl(e, t, n, r, i) {
	return ql(e.pipe(V(([e, r]) => {
		let a = r, o = eu(a, t.fieldName);
		if (o?.active !== !0) return [e, a];
		let s = $l(n, tu(o.correlationKey, o.parentContext, i));
		return [e, [
			au(a[0], t.resultPath, s),
			a[1],
			a[2],
			a[3],
			a[4],
			a[5]
		]];
	})), void 0, r, i);
}
function Ql(e, t, n) {
	return e.pipe(V(([e, r]) => {
		let i = eu(r, t.fieldName);
		return [e, i?.active === !0 ? tu(i.correlationKey, i.parentContext, n) : void 0];
	}), xt(([, e]) => e !== void 0), yt(([, e]) => e), V(([, e]) => [e, !0]));
}
function $l(e, t) {
	return { [Vl]: {
		edgeId: e,
		bucketKey: t
	} };
}
function eu(e, t) {
	return e[4]?.[t];
}
function tu(e, t, n) {
	return I([n.equality(e ?? null), Yi(t ?? null)]);
}
function nu(e, t) {
	let [n, , r] = e, [i, , a] = t;
	if (r !== a) return r === void 0 ? 1 : a === void 0 || r < a ? -1 : 1;
	if ((typeof n == "string" || typeof n == "number") && (typeof i == "string" || typeof i == "number")) return le(n, i);
	let o = I(n), s = I(i);
	return o < s ? -1 : +(o > s);
}
function ru(e, t) {
	let n = t.scalarField, r = n ? e.map(([, e]) => e[n]) : e.map(([, e]) => e);
	return t.materialization === "array" ? r : t.materialization === "singleton" ? r[0] : r.map((e) => String(e ?? "")).join("");
}
function iu(e) {
	if (e === "array") return [];
	if (e === "concat") return "";
	if (e !== "singleton") throw Error(n(158));
}
function au(e, t, n) {
	let r = { ...e }, i = r, a = e;
	for (let e = 0; e < t.length - 1; e++) {
		let n = t[e], r = a?.[n], o = Array.isArray(r) ? [...r] : { ...r ?? {} };
		i[n] = o, i = o, a = r;
	}
	return i[t[t.length - 1]] = n, r;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/join-conditions.js
function ou(e) {
	if (e.type === "func") {
		if (e.name === "eq" && e.args.length === 2) return [[e.args[0], e.args[1]]];
		if (e.name === "and" && e.args.length > 0) return e.args.flatMap(ou);
	}
	throw new wr();
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/builder/query-ir.js
function su(e) {
	let t = e;
	if (t == null) throw Error(n(237, { received: t === null ? "null" : "undefined" }));
	return e._getQuery();
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/builder/clone-query.js
function cu(e, t) {
	return lu(e, {
		clones: /* @__PURE__ */ new WeakMap(),
		resolveDescriptor: t
	});
}
function lu(e, t) {
	let { clones: n } = t, r = n.get(e);
	if (r) return r;
	let i = { ...e };
	return n.set(e, i), i.from = uu(e.from, t), i.join = e.join?.map((e) => ({
		...e,
		from: du(e.from, t)
	})), i.select = e.select === void 0 || D(e.select) ? e.select : fu(e.select, t), i;
}
function uu(e, t) {
	return e.type === "unionFrom" ? new h(e.sources.map((e) => du(e, t))) : e.type === "unionAll" ? new g(e.queries.map((e) => lu(e, t))) : du(e, t);
}
function du(e, t) {
	return e.type === "collectionRef" ? new d(e.collection, e.alias, e.bindingId) : e.type === "descriptorRef" ? t.resolveDescriptor ? new d(t.resolveDescriptor(e.descriptor), e.alias, e.bindingId) : new f(e.descriptor, e.alias, e.bindingId) : new m(lu(e.query, t), e.alias, e.bindingId);
}
function fu(e, t) {
	let { clones: n } = t, r = n.get(e);
	if (r) return r;
	let i = {};
	n.set(e, i);
	for (let [n, r] of Object.entries(e)) i[n] = pu(r, t);
	return i;
}
function pu(e, t) {
	let { clones: n } = t;
	if (e instanceof w) {
		let r = n.get(e);
		if (r) return r;
		let i = new w(lu(e.query, t), e.correlationField, e.childCorrelationField, e.fieldName, e.parentFilters, e.parentProjection, e.materialization, e.scalarField);
		return n.set(e, i), i;
	}
	if (e instanceof T) {
		let r = n.get(e);
		if (r) return r;
		let i = new T(e.branches.map((e) => ({
			...e,
			value: pu(e.value, t)
		})), e.defaultValue === void 0 ? void 0 : pu(e.defaultValue, t));
		return n.set(e, i), i;
	}
	return typeof e != "object" || !e || Array.isArray(e) || o(e) || D(e) ? e : fu(e, t);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/builder/index.js
var mu = "unionAll clause", hu = class e {
	constructor(e = {}, t = !1) {
		this.query = t ? e : { ...e };
	}
	bW(t) {
		return new e(t, !0);
	}
	ee(e, t) {
		let n = this.dY(e, t);
		if (n.length !== 1) throw new br(t);
		return n[0];
	}
	dY(t, n) {
		if (typeof t == "string") throw new Cr(n, "string");
		let r;
		try {
			r = Object.keys(t);
		} catch {
			throw new Cr(n, t === null ? "null" : "undefined");
		}
		if (Array.isArray(t)) throw new Cr(n, "array");
		if (r.length === 0) throw new Cr(n, "empty object");
		if (n !== mu && r.length !== 1) throw new br(n);
		let i = [];
		for (let a of r) {
			let r = t[a], o;
			if (r instanceof dl) o = new d(r, a);
			else if (Pn(r)) o = new f(r, a);
			else if (r instanceof e) {
				let e = cu(r._getQuery());
				if (!e.from) throw new xr(n);
				o = new m(e, a);
			} else throw new Sr(a);
			i.push([a, o]);
		}
		return i;
	}
	from(e) {
		let [, t] = this.ee(e, "from clause");
		return this.bW({
			...this.query,
			from: t
		});
	}
	unionAll(t, ...n) {
		if (t instanceof e) return this.bW({
			...this.query,
			from: new g([t, ...n].map((e) => cu(e._getQuery())))
		});
		let r = this.dY(t, mu), i = r.length === 1 ? r[0][1] : new h(r.map((e) => e[1]));
		return this.bW({
			...this.query,
			from: i
		});
	}
	join(e, t, n = "left") {
		let [r, i] = this.ee(e, "join clause"), a = t(Za([...this.bo(), r], new Map([...this.dH(), [r, i.bindingId]])));
		ou(a);
		let o = {
			from: i,
			type: n,
			on: a
		}, s = this.query.join || [];
		return this.bW({
			...this.query,
			join: [...s, o]
		});
	}
	leftJoin(e, t) {
		return this.join(e, t, "left");
	}
	rightJoin(e, t) {
		return this.join(e, t, "right");
	}
	innerJoin(e, t) {
		return this.join(e, t, "inner");
	}
	fullJoin(e, t) {
		return this.join(e, t, "full");
	}
	where(e) {
		let t = e(Za(this.bo(), this.dH())), n = o(t) ? Z(t) : t;
		if (!D(n)) throw new Er(gu(n));
		let r = this.query.where || [];
		return this.bW({
			...this.query,
			where: [...r, n]
		});
	}
	having(e) {
		let t = this.bo(), n = e(this.query.select || this.query.fnSelect ? Qa(t, this.dH()) : Za(t, this.dH())), r = o(n) ? Z(n) : n;
		if (!D(r)) throw new Er(gu(r));
		let i = this.query.having || [];
		return this.bW({
			...this.query,
			having: [...i, r]
		});
	}
	select(e) {
		let t = this.bo(), n = e(Za(t, this.dH()));
		o(n) && n.__path.length === 1 && (n = { [`__SPREAD_SENTINEL__${n.__path[0]}__0`]: Z(n) });
		let r = yu(n, {
			aliases: t,
			bindingIds: ku(this._getQuery())
		});
		return this.bW({
			...this.query,
			select: r,
			fnSelect: void 0
		});
	}
	orderBy(e, t = "asc") {
		let n = this.bo(), r = e(this.query.select || this.query.fnSelect ? Qa(n, this.dH()) : Za(n, this.dH())), i = typeof t == "string" ? {
			direction: t,
			nulls: "first"
		} : {
			direction: t.direction ?? "asc",
			nulls: t.nulls ?? "first",
			...t.stringSort === "custom" ? {
				stringSort: "custom",
				compare: t.compare
			} : {
				stringSort: t.stringSort,
				locale: t.stringSort === "locale" ? t.locale : void 0,
				localeOptions: t.stringSort === "locale" ? t.localeOptions : void 0
			}
		}, a = (e) => ({
			expression: Z(e),
			compareOptions: i
		}), o = Array.isArray(r) ? r.map((e) => a(e)) : [a(r)], s = this.query.orderBy || [];
		return this.bW({
			...this.query,
			orderBy: [...s, ...o]
		});
	}
	groupBy(e) {
		let t = e(Za(this.bo(), this.dH())), n = Array.isArray(t) ? t.map((e) => Z(e)) : [Z(t)], r = this.query.groupBy || [];
		return this.bW({
			...this.query,
			groupBy: [...r, ...n]
		});
	}
	limit(e) {
		return this.bW({
			...this.query,
			limit: e
		});
	}
	offset(e) {
		return this.bW({
			...this.query,
			offset: e
		});
	}
	distinct() {
		return this.bW({
			...this.query,
			distinct: !0
		});
	}
	findOne() {
		return this.bW({
			...this.query,
			singleResult: !0
		});
	}
	bo() {
		let e = [];
		if (this.query.from && (this.query.from.type === "unionFrom" ? e.push(...this.query.from.sources.map((e) => e.alias)) : this.query.from.type === "unionAll" ? e.push("*") : e.push(this.query.from.alias)), this.query.join) for (let t of this.query.join) e.push(t.from.alias);
		return e;
	}
	dH() {
		let e = /* @__PURE__ */ new Map(), t = this.query.from;
		if (t?.type === "unionFrom") for (let n of t.sources) e.set(n.alias, n.bindingId);
		else t && t.type !== "unionAll" && e.set(t.alias, t.bindingId);
		for (let t of this.query.join ?? []) e.set(t.from.alias, t.from.bindingId);
		return e;
	}
	get fn() {
		let e = this;
		return {
			select(t) {
				return e.bW({
					...e.query,
					select: void 0,
					fnSelect: t
				});
			},
			where(t) {
				return e.bW({
					...e.query,
					fnWhere: [...e.query.fnWhere || [], t]
				});
			},
			having(t) {
				return e.bW({
					...e.query,
					fnHaving: [...e.query.fnHaving || [], t]
				});
			}
		};
	}
	_getQuery() {
		if (!this.query.from) throw new Tr();
		return this.query;
	}
	_bindCollectionSources(t) {
		if (!t || !this.query.from) return this;
		let n = this._getQuery();
		return ee(n).some((e) => e.type === "descriptorRef") ? new e(cu(n, t), !0) : this;
	}
};
function gu(e) {
	return e === null ? "null" : e === void 0 ? "undefined" : typeof e == "object" ? "object" : typeof e;
}
function _u(e) {
	return Z(e ?? null);
}
function vu(e) {
	return Xi(e) && !Array.isArray(e) && !D(e) && !o(e);
}
function yu(e, t, r) {
	if (Array.isArray(e)) return e.some((e) => o(e) || D(e)) ? new x("array", e.map((e) => Z(e ?? null))) : _u(e);
	if (e instanceof hu) {
		if (!r) throw Error(n(114));
		return Du(e, r, t, "collection");
	}
	if (e instanceof fo) {
		if (!(e.query instanceof hu)) throw Error(n(115));
		if (!r) throw Error(n(116));
		return Du(e.query, r, t, "array");
	}
	if (e instanceof po) {
		if (!(e.query instanceof hu)) throw Error(n(117));
		if (!r) throw Error(n(118));
		return Du(e.query, r, t, "concat");
	}
	if (e instanceof mo) return bu(e, t, r);
	if (!vu(e)) return _u(e);
	let i = {}, a = 0;
	for (let [r, o] of Object.entries(e)) if (typeof r == "string" && r.startsWith("__SPREAD_SENTINEL__")) {
		let e = r.slice(0, r.lastIndexOf("__"));
		i[`${e}__${++a}`] = o;
	} else if (o instanceof hu) i[r] = Du(o, r, t, "collection");
	else if (o instanceof fo) {
		if (!(o.query instanceof hu)) throw Error(n(119));
		i[r] = Du(o.query, r, t, "array");
	} else if (o instanceof po) {
		if (!(o.query instanceof hu)) throw Error(n(120));
		i[r] = Du(o.query, r, t, "concat");
	} else if (o instanceof ho) {
		if (!(o.query instanceof hu)) throw Error(n(121));
		let e = o.query._getQuery().singleResult ? "singleton" : "array";
		i[r] = Du(o.query, r, t, e);
	} else i[r] = o instanceof mo ? bu(o, t, r) : yu(o, t, r);
	return i;
}
function bu(e, t, r) {
	let i = e.args;
	if (i.length < 2) throw Error(n(122));
	let a = i.length % 2 == 1, o = Math.floor(i.length / 2), s = [];
	for (let e = 0; e < o; e++) s.push({
		condition: Z(i[e * 2]),
		value: yu(i[e * 2 + 1], t, r)
	});
	return new T(s, a ? yu(i[i.length - 1], t, r) : void 0);
}
function xu(e) {
	return e instanceof _ || e instanceof x || e instanceof S ? C(e) : e instanceof T ? [...e.branches.flatMap((e) => [...C(e.condition), ...xu(e.value)]), ...e.defaultValue === void 0 ? [] : xu(e.defaultValue)] : e instanceof w ? [
		e.correlationField,
		...e.parentProjection ?? [],
		...Su(e.query)
	] : vu(e) ? Object.values(e).flatMap(xu) : [];
}
function Su(e) {
	let t = new Set(Ou(e)), n = ku(e), r = [], i = (e) => {
		r.push(...C(e));
	}, a = (e) => {
		i(typeof e == "object" && "expression" in e ? e.expression : e);
	};
	for (let t of e.where ?? []) a(t);
	for (let t of e.join ?? []) i(t.on), t.from.type === "queryRef" && r.push(...Su(t.from.query));
	for (let t of e.groupBy ?? []) i(t);
	for (let t of e.having ?? []) a(t);
	for (let { expression: t } of e.orderBy ?? []) i(t);
	if (e.select && r.push(...xu(e.select)), e.from.type === "queryRef") r.push(...Su(e.from.query));
	else if (e.from.type === "unionFrom") for (let t of e.from.sources) t.type === "queryRef" && r.push(...Su(t.query));
	else if (e.from.type === "unionAll") for (let t of e.from.queries) r.push(...Su(t));
	let o = /* @__PURE__ */ new Set();
	return r.filter((e) => {
		let r = e.path.length > 1 || e.bindingId !== void 0 ? e.path[0] : void 0, i = JSON.stringify([e.bindingId, e.path]);
		return r == null || r === "$selected" || (e.bindingId === void 0 ? t.has(r) : n.has(e.bindingId)) || o.has(i) ? !1 : (o.add(i), !0);
	});
}
function Cu(e, t) {
	let n = ku(e), r = [], i = (e) => {
		r.push(...C(e));
	}, a = (e) => {
		i(typeof e == "object" && "expression" in e ? e.expression : e);
	};
	for (let t of e.where ?? []) a(t);
	for (let n of e.join ?? []) i(n.on), n.from.type === "queryRef" && r.push(...Cu(n.from.query, t));
	for (let t of e.groupBy ?? []) i(t);
	for (let t of e.having ?? []) a(t);
	for (let { expression: t } of e.orderBy ?? []) i(t);
	if (e.select && r.push(...xu(e.select)), e.from.type === "queryRef") r.push(...Cu(e.from.query, t));
	else if (e.from.type === "unionFrom") for (let n of e.from.sources) n.type === "queryRef" && r.push(...Cu(n.query, t));
	else if (e.from.type === "unionAll") for (let n of e.from.queries) r.push(...Cu(n, t));
	let o = /* @__PURE__ */ new Set();
	return r.filter((e) => {
		let r = JSON.stringify([e.bindingId, e.path]);
		return e.path[0] == null || !t.includes(e.path[0]) || e.bindingId !== void 0 && n.has(e.bindingId) || o.has(r) ? !1 : (o.add(r), !0);
	});
}
function wu(e) {
	return [...new Set(Su(e).map((e) => e.path[0]).filter((e) => e !== void 0))];
}
function Tu(e, t, n) {
	return C(typeof e == "object" && "expression" in e ? e.expression : e).some((e) => e.path[0] != null && t.includes(e.path[0]) && (e.bindingId === void 0 || !n.has(e.bindingId)));
}
function Eu(e, t, n = /* @__PURE__ */ new Set()) {
	if (n.has(e)) return !1;
	n.add(e);
	let r = (e) => t.has(e.bindingId) || e instanceof m && Eu(e.query, t, n), i = (e) => e instanceof w ? Eu(e.query, t, n) : e instanceof T ? e.branches.some((e) => i(e.value)) || e.defaultValue !== void 0 && i(e.defaultValue) : vu(e) && Object.values(e).some(i), a = e.from;
	return (a.type === "unionFrom" ? a.sources.some(r) : a.type === "unionAll" ? a.queries.some((e) => Eu(e, t, n)) : r(a)) || (e.join?.some((e) => r(e.from)) ?? !1) || e.select !== void 0 && i(e.select);
}
function Du(e, t, r, i) {
	let a = e._getQuery();
	if (Eu(a, r.bindingIds)) throw Error(n(236, { fieldName: t }));
	let o = cu(a), c = Ou(o), l = ku(o), u = [.../* @__PURE__ */ new Set([...r.aliases, ...wu(o)])], d, f, p = -1, m = -1;
	if (o.where) for (let e = 0; e < o.where.length; e++) {
		let t = o.where[e], n = typeof t == "object" && "expression" in t ? t.expression : t;
		if (n.type === "func" && n.name === "eq" && n.args.length === 2) {
			let t = ju(n.args[0], n.args[1], u, c, l);
			if (t) {
				d = t.parentRef, f = t.childRef, p = e;
				break;
			}
		}
		if (n.type === "func" && n.name === "and" && n.args.length >= 2) {
			for (let t = 0; t < n.args.length; t++) {
				let r = n.args[t];
				if (r.type === "func" && r.name === "eq" && r.args.length === 2) {
					let n = ju(r.args[0], r.args[1], u, c, l);
					if (n) {
						d = n.parentRef, f = n.childRef, p = e, m = t;
						break;
					}
				}
			}
			if (d) break;
		}
	}
	if (!d || !f || p === -1) throw Error(n(123, { fieldName: t }));
	let h = [...o.where];
	if (m >= 0) {
		let e = h[p], t = (typeof e == "object" && "expression" in e ? e.expression : e).args.filter((e, t) => t !== m);
		if (t.length === 1) {
			let n = typeof e == "object" && "expression" in e && e.residual;
			h[p] = n ? {
				expression: t[0],
				residual: !0
			} : t[0];
		} else {
			let n = new x("and", t), r = typeof e == "object" && "expression" in e && e.residual;
			h[p] = r ? {
				expression: n,
				residual: !0
			} : n;
		}
	} else h.splice(p, 1);
	let g = [], _ = [];
	for (let e of h) Tu(e, u, l) ? _.push(e) : g.push(e);
	let v = Cu({
		...o,
		where: h
	}, u), y = v.length > 0 ? v : void 0, b = {
		...o,
		where: g.length > 0 ? g : void 0
	}, S = b.select, C = S === void 0 || vu(S), T = b, E;
	if (i === "concat" && (S === void 0 || C)) throw Error(n(124, { fieldName: t }));
	if (!C) {
		if (i === "collection") throw Error(n(125, { fieldName: t }));
		E = s, T = {
			...b,
			select: { [E]: S }
		};
	}
	return new w(T, d, f, t, _.length > 0 ? _ : void 0, y, i, E);
}
function Ou(e) {
	let t = new Set(Au(e.from));
	if (e.join) for (let n of e.join) t.add(n.from.alias);
	return [...t];
}
function ku(e) {
	let t = /* @__PURE__ */ new Set(), n = e.from;
	if (n.type === "unionFrom") for (let e of n.sources) t.add(e.bindingId);
	else n.type !== "unionAll" && t.add(n.bindingId);
	for (let n of e.join ?? []) t.add(n.from.bindingId);
	return t;
}
function Au(e) {
	return e.type === "unionFrom" ? e.sources.map((e) => e.alias) : e.type === "unionAll" ? e.queries.flatMap((e) => Ou(e)) : [e.alias];
}
function ju(e, t, n, r, i) {
	if (e.type === "ref" && t.type === "ref") {
		if (e.bindingId !== void 0 && t.bindingId !== void 0) {
			let n = i.has(e.bindingId);
			return n === i.has(t.bindingId) ? void 0 : n ? {
				parentRef: t,
				childRef: e
			} : {
				parentRef: e,
				childRef: t
			};
		}
		let a = e.path[0], o = t.path[0];
		if (a && o && n.includes(a) && r.includes(o)) return {
			parentRef: e,
			childRef: t
		};
		if (a && o && n.includes(o) && r.includes(a)) return {
			parentRef: t,
			childRef: e
		};
	}
}
function Mu(e) {
	return su(e(new hu()));
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/source-record.js
function Nu() {
	return /* @__PURE__ */ Object.create(null);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/lazy-targets.js
function Pu(e, t, n, r, i, a) {
	if (t.type === "unionFrom") return Lu(e, r);
	if (t.type === "queryRef" && Fu(t.query.from)) return Vu(Iu(t.query, n, r));
	if (!i) return [];
	let o = Hu(r);
	if (!o) return [];
	let s = M(e, o, i);
	if (!s) return [];
	let c = s.alias || a[n] || n, l = Bu(e, t, {
		alias: c,
		collection: s.collection,
		sourceId: s.sourceId
	});
	return l ? [{
		sourceId: l.sourceId,
		alias: c,
		collection: s.collection,
		path: s.path
	}] : [];
}
function Fu(e) {
	return e.type === "unionFrom" ? !0 : e.type === "queryRef" ? Fu(e.query.from) : e.type === "unionAll" && e.queries.some((e) => Fu(e.from));
}
function Iu(e, t, n) {
	if (!n || typeof n != "object" || !("type" in n)) return [];
	let r = n;
	if (r.type === "func" && r.name === "coalesce") return Vu(r.args.flatMap((n) => Iu(e, t, n)));
	let i = Hu(r);
	return !i || i.path[0] !== t ? [] : Ru(e, new _(i.path.slice(1)));
}
function Lu(e, t) {
	if (!t || typeof t != "object" || !("type" in t)) return [];
	let n = t;
	return n.type === "ref" ? Ru(e, n) : n.type === "func" && n.name === "coalesce" ? Vu(n.args.flatMap((t) => Lu(e, t))) : [];
}
function Ru(e, t) {
	if (t.path.length === 0) return [];
	if (t.path.length === 1) {
		let n = t.path[0], r = e.select?.[n];
		return r ? Lu(e, r) : [];
	}
	let [n, ...r] = t.path, i = zu(e, n, t.bindingId);
	return i ? i.type === "collectionRef" ? [{
		sourceId: i.sourceId,
		alias: i.alias,
		collection: i.collection,
		path: r
	}] : i.type === "descriptorRef" ? p(i) : i.query.limit !== void 0 || i.query.offset !== void 0 || i.query.singleResult ? [] : Iu(i.query, i.alias, t) : [];
}
function zu(e, t, n) {
	if (e.join) {
		for (let r of e.join) if (r.from.alias === t && (n === void 0 || r.from.bindingId === n)) return r.from;
	}
	return j(e.from).find((e) => e.alias === t && (n === void 0 || e.bindingId === n));
}
function Bu(e, t, n) {
	if (n.sourceId !== void 0) return O(e).find((e) => e.sourceId === n.sourceId && e.collection === n.collection);
	if (t.type === "collectionRef" && t.collection === n.collection && t.alias === n.alias) return t;
}
function Vu(e) {
	let t = /* @__PURE__ */ new Set(), n = [];
	for (let r of e) {
		let e = `${r.sourceId}:${JSON.stringify(r.path)}`;
		t.has(e) || (t.add(e), n.push(r));
	}
	return n;
}
function Hu(e) {
	if (e instanceof _) return e;
	if (e && typeof e == "object" && "type" in e && e.type === "ref" && Array.isArray(e.path)) {
		let t = e;
		return new _(t.path, t.sourceAlias);
	}
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/parent-routes.js
var Uu = "__tanstack_parent_route_cross__";
function Wu(e, t, n) {
	let r = e.pipe(V(([e, t]) => [Uu, [e, t]])), i = t.pipe(V(([e, t]) => [Uu, [e, t]]));
	return r.pipe(sn(i, "inner"), xt(([, [e, t]]) => e != null && t != null), V(([, [e, t]]) => {
		let [r, i] = e, [a, o] = t;
		return n(r, i, a, o);
	}));
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/ir-stable-identity.js
function Gu(e) {
	return JSON.stringify(Ku(e));
}
function Ku(e) {
	return Yu(e, "query", /* @__PURE__ */ new WeakSet());
}
function qu(e, t) {
	let n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = (e) => {
		e.type === "unionFrom" ? e.sources.forEach(i) : e.type !== "unionAll" && (n.has(e.alias) || n.set(e.alias, n.size), r.set(e.bindingId, n.get(e.alias)));
	};
	return i(e.from), e.join?.forEach(({ from: e }) => i(e)), {
		bindings: n,
		bindingIds: r,
		hasUnqualifiedOutput: e.from.type === "unionAll",
		parent: t
	};
}
function Ju(e, t, n) {
	let r = e, i = 0;
	for (; r;) {
		let e = n === void 0 ? r.bindings.get(t) : r.bindingIds.get(n);
		if (e !== void 0) return [i, e];
		if (r.hasUnqualifiedOutput) return;
		r = r.parent, i++;
	}
}
function Yu(e, t, n, r) {
	return Xu(e, t, n, qu(e, r));
}
function Xu(e, t, n, r) {
	if (e.fnSelect) throw new li(`${t}.fnSelect`, "function select");
	if (e.fnWhere?.length) throw new li(`${t}.fnWhere`, "function where");
	if (e.fnHaving?.length) throw new li(`${t}.fnHaving`, "function having");
	let i = {
		type: "query",
		from: $u(e.from, `${t}.from`, n, r)
	};
	return e.select && (i.select = ed(e.select, `${t}.select`, n, r)), e.select || e.from.type !== "unionFrom" && e.join === void 0 && e.groupBy === void 0 || (i.implicitOutput = {
		type: "namespaced",
		aliases: Array.from(r.bindings.keys())
	}), e.join && (i.join = e.join.map((e, i) => Qu(e, `${t}.join[${i}]`, n, r))), e.where && (i.where = Zu(e.where, `${t}.where`, n, r)), e.groupBy && (i.groupBy = e.groupBy.map((e, i) => Q(e, `${t}.groupBy[${i}]`, n, "exact-output", r))), e.having && (i.having = Zu(e.having, `${t}.having`, n, r)), e.orderBy && (i.orderBy = e.orderBy.map((e, i) => rd(e, `${t}.orderBy[${i}]`, n, "ordering-operand", r))), e.limit !== void 0 && (i.limit = $(e.limit, `${t}.limit`, n)), e.offset !== void 0 && e.offset !== 0 && (i.offset = $(e.offset, `${t}.offset`, n)), e.distinct && (i.distinct = !0), e.singleResult && (i.singleResult = !0), i;
}
function Zu(e, t, n, r) {
	let i = e.map((e, i) => nd(e, `${t}[${i}]`, n, r));
	return i.sort(fd), i.filter((e, t) => t === 0 || fd(e, i[t - 1]) !== 0);
}
function Qu(e, t, n, r) {
	return {
		type: e.type,
		from: $u(e.from, `${t}.from`, n, r),
		on: Q(e.on, `${t}.on`, n, "exact-output", r)
	};
}
function $u(e, t, n, r) {
	return e.type === "collectionRef" || e.type === "descriptorRef" ? {
		type: "collectionRef",
		collectionId: $(e.type === "descriptorRef" ? e.descriptor.id : e.collection.id, `${t}.collection.id`, n)
	} : e.type === "unionFrom" ? {
		type: "unionFrom",
		sources: e.sources.map((e, i) => $u(e, `${t}.sources[${i}]`, n, r))
	} : e.type === "unionAll" ? {
		type: "unionAll",
		queries: e.queries.map((e, i) => Yu(e, `${t}.queries[${i}]`, n, r.parent))
	} : {
		type: "queryRef",
		query: Yu(e.query, `${t}.query`, n, r)
	};
}
function ed(e, t, n, r) {
	return {
		type: "select",
		fields: Object.keys(e).sort().map((i) => [i, td(e[i], `${t}.${i}`, n, r)])
	};
}
function td(e, t, n, r) {
	return o(e) ? Q(Z(e), t, n, "exact-output", r) : gd(e) ? Q(e, t, n, "exact-output", r) : Xi(e) ? ed(e, t, n, r) : ld(e, t, n);
}
function nd(e, t, n, r) {
	if (hd(e)) {
		let i = {
			type: "where",
			expression: Q(e.expression, `${t}.expression`, n, "exact-output", r)
		};
		return e.residual === !0 && (i.residual = !0), i;
	}
	return Q(e, t, n, "exact-output", r);
}
function rd(e, t, n, r = "exact-output", i) {
	return {
		expression: Q(e.expression, `${t}.expression`, n, r, i),
		compareOptions: id(e.compareOptions, `${t}.compareOptions`, n)
	};
}
function id(e, t, n) {
	return $(bi(e), t, n);
}
function Q(e, t, n, r = "exact-output", i) {
	if (e.type === "ref") {
		let r = v(e);
		if (r !== void 0) {
			let a = Ju(i, r, e.bindingId);
			return a === void 0 ? {
				type: "ref",
				path: e.path.map((e, r) => $(e, `${t}.path[${r}]`, n)),
				sourceAlias: $(r, `${t}.sourceAlias`, n)
			} : {
				type: "ref",
				path: [["binding", ...a], ...y(e).map((e, r) => $(e, `${t}.path[${r + 1}]`, n))]
			};
		}
		let a = Ju(i, e.path[0] ?? "", e.bindingId);
		return {
			type: "ref",
			path: a === void 0 ? e.path.map((e, r) => $(e, `${t}.path[${r}]`, n)) : [["binding", ...a], ...e.path.slice(1).map((e, r) => $(e, `${t}.path[${r + 1}]`, n))]
		};
	}
	if (e.type === "val") return {
		type: "val",
		value: r === "equality-operand" ? ud(e.value, `${t}.value`, n, i) : r === "ordering-operand" ? dd(e.value, `${t}.value`, n) : ld(e.value, `${t}.value`, n)
	};
	if (e.type === "func") {
		if (e.name === "in" && e.args.length === 2 && e.args[1]?.type === "val" && Array.isArray(e.args[1].value)) {
			let r = e.args[1].value.map((e, r) => ud(e, `${t}.args[1].value[${r}]`, n, i));
			return ad(e.name, [Q(e.args[0], `${t}.args[0]`, n, "equality-operand", i), {
				type: "val",
				value: ["set", od(r)]
			}]);
		}
		let r = e.name === "eq" ? "equality-operand" : e.name === "gt" || e.name === "gte" || e.name === "lt" || e.name === "lte" ? "ordering-operand" : "exact-output", a = e.args.map((e, a) => Q(e, `${t}.args[${a}]`, n, r, i));
		return ad(e.name, a);
	}
	if (e.type === "agg") return {
		type: "agg",
		name: e.name,
		args: e.args.map((e, r) => Q(e, `${t}.args[${r}]`, n, "exact-output", i))
	};
	if (e.type === "conditionalSelect") {
		let r = {
			type: "conditionalSelect",
			branches: e.branches.map((e, r) => ({
				condition: Q(e.condition, `${t}.branches[${r}].condition`, n, "exact-output", i),
				value: td(e.value, `${t}.branches[${r}].value`, n, i)
			}))
		};
		return e.defaultValue !== void 0 && (r.defaultValue = td(e.defaultValue, `${t}.defaultValue`, n, i)), r;
	}
	let a = qu(e.query, i), o = {
		type: "includesSubquery",
		query: Xu(e.query, `${t}.query`, n, a),
		correlationField: Q(e.correlationField, `${t}.correlationField`, n, "equality-operand", i),
		childCorrelationField: Q(e.childCorrelationField, `${t}.childCorrelationField`, n, "equality-operand", a),
		fieldName: e.fieldName,
		materialization: e.materialization
	};
	return e.parentFilters && (o.parentFilters = e.parentFilters.map((e, r) => nd(e, `${t}.parentFilters[${r}]`, n, i))), e.parentProjection && (o.parentProjection = e.parentProjection.map((e, r) => Q(e, `${t}.parentProjection[${r}]`, n, "exact-output", i))), e.scalarField !== void 0 && (o.scalarField = e.scalarField), o;
}
function ad(e, t) {
	return (e === "and" || e === "or") && t.length > 0 ? {
		type: "func",
		name: e,
		args: od(t.flatMap((t) => sd(t, e) ? t.args : [t]))
	} : e === "eq" && t.length === 2 ? (t.sort(fd), {
		type: "func",
		name: e,
		args: t
	}) : (e === "gt" || e === "gte" || e === "lt" || e === "lte") && t.length === 2 && fd(t[0], t[1]) > 0 ? {
		type: "func",
		name: cd(e),
		args: [t[1], t[0]]
	} : {
		type: "func",
		name: e,
		args: t
	};
}
function od(e) {
	let t = e.map((e) => ({
		key: JSON.stringify(e),
		value: e
	}));
	return t.sort((e, t) => e.key < t.key ? -1 : +(e.key > t.key)), t.filter((e, n) => n === 0 || e.key !== t[n - 1].key).map((e) => e.value);
}
function sd(e, t) {
	return typeof e == "object" && !!e && !Array.isArray(e) && e.type === "func" && e.name === t && Array.isArray(e.args);
}
function cd(e) {
	switch (e) {
		case "gt": return "lt";
		case "gte": return "lte";
		case "lt": return "gt";
		case "lte": return "gte";
	}
}
function $(e, t, n) {
	if (e === null) return ["null"];
	if (typeof e == "string") return ["string", e];
	if (typeof e == "boolean") return ["boolean", e];
	if (typeof e == "number") return Number.isNaN(e) ? ["number", "NaN"] : e === Infinity ? ["number", "Infinity"] : e === -Infinity ? ["number", "-Infinity"] : Object.is(e, -0) ? ["number", "-0"] : ["number", e];
	if (e === void 0) return ["undefined"];
	if (typeof e == "bigint") return ["bigint", e.toString()];
	if (typeof e == "function") throw new li(t, "function value");
	if (typeof e == "symbol") throw new li(t, "symbol value");
	if (o(e)) return Q(Z(e), t, n);
	if (Array.isArray(e)) return md(e, t, n, () => ["array", e.map((e, r) => $(e, `${t}[${r}]`, n))]);
	if (e instanceof Date) {
		let n = e.getTime();
		if (Number.isNaN(n)) throw new li(t, "invalid Date");
		return ["Date", e.toISOString()];
	}
	if (e instanceof ArrayBuffer) return [
		"binary",
		"ArrayBuffer",
		Array.from(new Uint8Array(e))
	];
	if (ArrayBuffer.isView(e)) return [
		"binary",
		e.constructor.name,
		Array.from(new Uint8Array(e.buffer, e.byteOffset, e.byteLength))
	];
	if (e instanceof Map) return md(e, t, n, () => {
		let r = Array.from(e.entries(), ([e, r], i) => [$(e, `${t}.key[${i}]`, n), $(r, `${t}.value[${i}]`, n)]);
		return r.sort(fd), ["Map", r];
	});
	if (e instanceof Set) return md(e, t, n, () => {
		let r = Array.from(e, (e, r) => $(e, `${t}[${r}]`, n));
		return r.sort(fd), ["Set", r];
	});
	if (Xi(e)) return pd(e, t, n);
	throw new li(t, "non-plain object value");
}
function ld(e, t, n) {
	return typeof e == "object" && e || typeof e == "function" || typeof e == "symbol" ? yi(e) : $(e, t, n);
}
function ud(e, t, n, r) {
	if (o(e)) return Q(Z(e), t, n, "equality-operand", r);
	if (typeof e == "number" && Object.is(e, -0)) return $(0, t, n);
	if (typeof Buffer < "u" && e instanceof Buffer || e instanceof Uint8Array) return [
		"binary",
		"Uint8Array",
		Array.from(e)
	];
	let i = q(e);
	return i === e ? typeof e == "object" && e || typeof e == "function" || typeof e == "symbol" ? yi(e) : $(e, t, n) : $(i, t, n);
}
function dd(e, t, n) {
	if (typeof e == "number" && Object.is(e, -0)) return $(0, t, n);
	if (e instanceof Date && Number.isNaN(e.getTime())) return $(NaN, t, n);
	let r = q(e);
	if (r !== e && !(e instanceof Uint8Array)) return $(r, t, n);
	try {
		return $(e, t, n);
	} catch (t) {
		if (t instanceof li && typeof e == "object" && e) return yi(e);
		throw t;
	}
}
function fd(e, t) {
	let n = JSON.stringify(e), r = JSON.stringify(t);
	return n < r ? -1 : +(n > r);
}
function pd(e, t, n) {
	return md(e, t, n, () => ["object", Object.keys(e).sort().map((r) => [r, $(e[r], `${t}.${r}`, n)])]);
}
function md(e, t, n, r) {
	if (n.has(e)) throw new li(t, "circular value");
	n.add(e);
	try {
		return r();
	} finally {
		n.delete(e);
	}
}
function hd(e) {
	return "expression" in e;
}
function gd(e) {
	if (typeof e != "object" || !e) return !1;
	let t = e.type;
	return t === "agg" || t === "conditionalSelect" || t === "func" || t === "ref" || t === "val" || t === "includesSubquery";
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/query-equivalence.js
function _d(e, t) {
	if (!W(vd(e), vd(t))) return !1;
	try {
		return Gu(e) === Gu(t);
	} catch (e) {
		if (e instanceof li) return !1;
		throw e;
	}
}
function vd(e) {
	return {
		from: yd(e.from),
		select: e.select,
		join: e.join?.map((e) => ({
			from: yd(e.from),
			type: e.type,
			on: e.on
		})),
		where: e.where,
		groupBy: e.groupBy,
		having: e.having,
		orderBy: e.orderBy,
		limit: e.limit,
		offset: e.offset,
		distinct: e.distinct,
		singleResult: e.singleResult,
		fnSelect: e.fnSelect,
		fnWhere: e.fnWhere,
		fnHaving: e.fnHaving
	};
}
function yd(e) {
	switch (e.type) {
		case "collectionRef": return {
			type: e.type,
			collection: e.collection,
			alias: e.alias
		};
		case "descriptorRef": return {
			type: e.type,
			descriptor: e.descriptor,
			alias: e.alias
		};
		case "queryRef": return {
			type: e.type,
			query: vd(e.query),
			alias: e.alias
		};
		case "unionFrom": return {
			type: e.type,
			sources: e.sources.map(yd)
		};
		case "unionAll": return {
			type: e.type,
			queries: e.queries.map(vd)
		};
	}
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/joins.js
var bd = 0;
function xd(e, t, n) {
	return Wu(e, t, (e, t, r, i) => [I([
		n.equality(e),
		n.equality(r),
		Yi(i)
	]), ra({ ...t }, r, i)]);
}
function Sd(e, t) {
	let n = ca(t);
	if (n) return ra({
		...Ji(n.parentContext),
		[e]: n.value,
		[J]: n.publicKey
	}, n.correlationKey, n.parentContext);
	if (typeof t != "object" || !t) return { [e]: t };
	let r = ia(t), i = r ? oa(t) : t, a = {
		...Ji(r?.parentContext),
		[e]: i
	};
	return r && ra(a, r.correlationKey, r.parentContext), a;
}
function Cd(e, t, n, r) {
	let i = aa(e, t);
	return I([
		r.equality(i?.correlationKey),
		Yi(i?.parentContext ?? null),
		n
	]);
}
function wd(e, t, n, r, i, a, o) {
	let s = i[0](t), c = [
		e,
		t,
		void 0
	], l = r === "main" ? "\0m" : "\0j";
	if (s == null) return [l, c];
	let u = o.equality(s);
	if (i.length > 1) {
		let e = [u];
		for (let n = 1; n < i.length; n++) {
			let r = i[n](t);
			if (r == null) return [l, c];
			e.push(o.equality(r));
		}
		u = e;
	}
	return c[2] = s, [a ? Cd(t, n, u, o) : I(u), c];
}
function Td(e, t, n = /* @__PURE__ */ new Set()) {
	let r = {
		id: `lazy-demand-${++bd}`,
		path: t.path,
		collectionId: t.collection.id,
		initialKeys: new Set(n)
	}, i = e[t.sourceId] ??= {};
	return (i.plans ??= []).push(r), r;
}
function Ed(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _, v, y, b, x, S) {
	let C = e, w = new Set(j(h).map((e) => e.bindingId));
	for (let e of t) C = Dd(C, e, n, r, i, a, o, s, c, l, u, d, f, p, m, g, _, v, y, b, x, w, S), w.add(e.from.bindingId);
	return C;
}
function Dd(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _, v, y, b, x, S) {
	let w = t.from.type === "collectionRef", T = t.from.alias, E = Object.keys(n), D = (e) => {
		let n = Od(e);
		return e.bindingId === void 0 ? n === T ? "joined" : n && (E.includes(n) || m.from.type === "unionAll") ? "main" : "unknown" : e.bindingId === t.from.bindingId ? "joined" : x.has(e.bindingId) ? "main" : "ancestor";
	}, ee = ou(t.on).map(([e, t]) => kd(e, t, T, D)), { mainExpr: O, joinedExpr: k } = ee[0], te = ee.some(({ joinedExpr: e }) => C(e).some((e) => {
		let t = D(e);
		return t === "ancestor" || t === "unknown";
	})), A = S !== void 0 && (t.from.type === "queryRef" || (t.type === "right" || t.type === "full") && !y || te), { alias: ne, input: j, collectionId: re } = Ad(t.from, a, c, l, u, d, f, p, o, s, h, g, _, v, b, A ? S : void 0);
	if (ne !== T) throw new Ur();
	n[T] = j, w && (g[T] = re);
	let M = c[r], N = c[re];
	if (!M) throw new zr(r);
	if (!N) throw new zr(re);
	let ie = Pd(t.type, M, N, y), P = A ? void 0 : ie.activeSource, ae = ie.lazySource, oe = ee.map((e) => X(e.mainExpr)), se = ee.map((e) => X(e.joinedExpr)), ce = e.pipe(V(([e, t]) => wd(e, t, i, "main", oe, A, b))), F = j.pipe(V(([e, t]) => wd(e, Sd(T, t), T, "joined", se, A, b)));
	if (![
		"inner",
		"left",
		"right",
		"full"
	].includes(t.type)) throw new Vr(t.type);
	if (P) {
		let e = P === "main" ? t.from : m.from, n = e.type === "queryRef" && (e.query.limit !== void 0 || e.query.offset !== void 0 || e.query.singleResult), r = e.type === "unionAll" ? [] : Pu(m, e, P === "main" ? T : i, P === "main" ? k : O, ae, _);
		if (!n && r.length > 0) {
			for (let e of r) d.add(e.sourceId);
			let e = r.map((e) => Td(u, e)), t = /* @__PURE__ */ new Map(), n = P === "main" ? ce : F;
			for (let e of r) {
				let t = e.path[0];
				t && vo(t, e.path, e.collection);
			}
			let i = n.pipe(gn((n) => {
				for (let [[e, [, , r]], i] of n.getInner()) {
					if (r == null) continue;
					let n = t.get(e), a = (n?.weight ?? 0) + i;
					a === 0 ? t.delete(e) : t.set(e, {
						key: n?.key ?? r,
						weight: a
					});
				}
				let i = new Set([...t.values()].filter(({ weight: e }) => e > 0).map(({ key: e }) => e));
				for (let t = 0; t < r.length; t++) u[r[t].sourceId]?.setDemand?.(e[t], i);
			}));
			P === "main" ? ce = i : F = i;
		}
	}
	return ce.pipe(sn(F, t.type), Nd(T, E));
}
function Od(e) {
	return v(e) ?? e.path[0];
}
function kd(e, t, n, r) {
	let i = C(e), a = C(t), o = new Set(i.map(r)), s = new Set(a.map(r)), c = o.has("main") || o.has("ancestor"), l = s.has("main") || s.has("ancestor"), u = o.has("joined"), d = s.has("joined");
	if (c && !u && d && !s.has("main")) return {
		mainExpr: e,
		joinedExpr: t
	};
	if (u && !o.has("main") && l && !d) return {
		mainExpr: t,
		joinedExpr: e
	};
	throw i.length === 0 || a.length === 0 ? new Ur() : i.length === 1 && a.length === 1 && (i[0].bindingId !== void 0 && a[0].bindingId !== void 0 ? i[0].bindingId === a[0].bindingId : Od(i[0]) === Od(a[0])) ? new Hr(Od(i[0])) : c ? d ? new Kr() : new Gr(n) : new Wr(Od(i[0]));
}
function Ad(e, t, n, r, i, a, o, s, c, l, u, d, f, m, h, g) {
	switch (e.type) {
		case "descriptorRef": return p(e);
		case "collectionRef": {
			let n = t[e.sourceId];
			if (!n) throw new Pr(e.alias, e.collection.id, Object.keys(t));
			return d[e.alias] = e.collection.id, {
				alias: e.alias,
				input: g ? xd(n, g, h) : n,
				collectionId: e.collection.id
			};
		}
		case "queryRef": {
			let p = l.get(e.query), h = u(p && _d(e.query, p) ? p : e.query, t, n, r, i, a, o, s, c, l, g);
			Object.assign(d, h.aliasToCollectionId), Object.assign(f, h.aliasRemapping);
			let _ = l.has(e.query), v = Md(e.query);
			if (_ || v === void 0 || e.alias !== v) for (let [e, t] of h.sourceWhereClauses) m.set(e, t);
			let y = Object.keys(h.aliasToCollectionId).find((e) => h.aliasToCollectionId[e] === h.collectionId);
			y && y !== e.alias && (f[e.alias] = y);
			let b = h.pipeline.pipe(V((e) => {
				let [t, [n, r, i, a, o]] = e;
				return g ? [t, sa(n, i, a, o)] : [t, n];
			}));
			return {
				alias: e.alias,
				input: b,
				collectionId: h.collectionId
			};
		}
		default: throw new qr(e.type);
	}
}
function jd(e, t) {
	return typeof t == "number" && !Number.isFinite(t) ? { number: String(t) } : t;
}
function Md(e) {
	return j(e.from)[0]?.alias;
}
function Nd(e, t) {
	return (n) => n.pipe(V((n) => {
		let [r, [i, a]] = n, o = i?.[0], s = i?.[1], c = a?.[0], l = a?.[1], u = Object.assign({}, s ?? l);
		if (i == null) for (let e of t) delete u[e];
		return l ? u[e] = l[e] : delete u[e], [JSON.stringify([o ?? null, c ?? null], jd), u];
	}));
}
function Pd(e, t, n, r) {
	switch (e) {
		case "left": return {
			activeSource: "main",
			lazySource: n
		};
		case "right": return {
			activeSource: "joined",
			lazySource: t
		};
		case "inner": return r || t.size < n.size ? {
			activeSource: "main",
			lazySource: n
		} : {
			activeSource: "joined",
			lazySource: t
		};
		default: return {
			activeSource: void 0,
			lazySource: void 0
		};
	}
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/select.js
function Fd(e) {
	return e instanceof b ? e.value : e;
}
var Id = /* @__PURE__ */ new Set([
	"__proto__",
	"prototype",
	"constructor"
]);
function Ld(e) {
	for (let t of e) if (Id.has(t)) throw new Dr(t);
}
function Rd(e, t, n) {
	Ld(e.targetPath);
	let r = e.source(t);
	if (r && typeof r == "object") {
		let t = n, i = e.targetPath;
		if (i.length === 0) for (let [e, t] of Object.entries(r)) n[e] = Fd(t);
		else for (let e = 0; e < i.length; e++) {
			let n = i[e];
			if (e === i.length - 1) {
				let e = t[n] ??= {};
				if (typeof e == "object") for (let [t, n] of Object.entries(r)) e[t] = Fd(n);
			} else {
				let e = t[n];
				typeof e == "object" && e || (t[n] = {}), t = t[n];
			}
		}
	}
}
function zd(e, t, n) {
	let r = e.alias.split(".");
	if (Ld(r), r.length === 1) n[e.alias] = e.compiled(t);
	else {
		let i = n;
		for (let e = 0; e < r.length - 1; e++) {
			let t = r[e], n = i[t];
			typeof n == "object" && n || (i[t] = {}), i = i[t];
		}
		i[r[r.length - 1]] = Fd(e.compiled(t));
	}
}
function Bd([e, t], n) {
	let r = {};
	for (let e of n) e.kind === "merge" ? Rd(e, t, r) : zd(e, t, r);
	return [e, {
		...t,
		$selected: r
	}];
}
function Vd(e, t, n) {
	if (!Gd(t)) {
		let n = Ud(t);
		return e.pipe(V(([e, t]) => [e, {
			...t,
			$selected: n(t)
		}]));
	}
	let r = [];
	return Kd([], t, r), e.pipe(V((e) => Bd(e, r)));
}
function Hd(e) {
	let t = [];
	return Kd([], e, t), (e) => {
		let n = {};
		for (let r of t) r.kind === "merge" ? Rd(r, e, n) : zd(r, e, n);
		return n;
	};
}
function Ud(e) {
	return e == null ? () => e : qd(e) ? Wd(e) : e instanceof b ? () => e.value : e.type === "includesSubquery" ? () => null : Gd(e) ? Hd(e) : D(e) ? X(e) : () => e;
}
function Wd(e) {
	let t = e.branches.map((e) => ({
		condition: X(e.condition),
		value: Ud(e.value)
	})), n = e.defaultValue === void 0 ? void 0 : Ud(e.defaultValue);
	return (e) => {
		for (let n of t) if (Ca(n.condition(e))) return n.value(e);
		return n === void 0 ? null : n(e);
	};
}
function Gd(e) {
	return e && typeof e == "object" && !D(e);
}
function Kd(e, t, n) {
	for (let [r, i] of Object.entries(t)) {
		if (r.startsWith("__SPREAD_SENTINEL__") || Ld(r.split(".")), r.startsWith("__SPREAD_SENTINEL__")) {
			let t = r.slice(19), a = t.lastIndexOf("__"), o = a >= 0 ? t.slice(0, a) : t, s = i && typeof i == "object" && "type" in i && i.type === "ref";
			if (o.includes(".") || s) {
				let t = [...e], r = o.split("."), a = X(s ? i : new _(r, r[0]));
				n.push({
					kind: "merge",
					targetPath: t,
					source: a
				});
			} else {
				let t = o, r = [...e];
				n.push({
					kind: "merge",
					targetPath: r,
					source: (e) => e[t]
				});
			}
			continue;
		}
		let t = i;
		if (qd(t)) n.push({
			kind: "field",
			alias: [...e, r].join("."),
			compiled: Wd(t)
		});
		else if (t && t.type === "includesSubquery") n.push({
			kind: "field",
			alias: [...e, r].join("."),
			compiled: () => null
		});
		else if (Gd(t)) Kd([...e, r], t, n);
		else if (t === void 0 || !D(t)) n.push({
			kind: "field",
			alias: [...e, r].join("."),
			compiled: () => t
		});
		else if (t instanceof b) {
			let i = t.value;
			n.push({
				kind: "field",
				alias: [...e, r].join("."),
				compiled: () => i
			});
		} else n.push({
			kind: "field",
			alias: [...e, r].join("."),
			compiled: X(t)
		});
	}
}
function qd(e) {
	return e instanceof T || typeof e == "object" && !!e && e.type === "conditionalSelect" && Array.isArray(e.branches);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/index.js
function Jd(e, t = /* @__PURE__ */ new Set()) {
	if (e instanceof hu) return "a child query builder";
	if (e instanceof fo) return "toArray()";
	if (e instanceof po) return "concat(toArray())";
	if (e instanceof ho) return "materialize()";
	if (e instanceof mo) return "caseWhen()";
	if (D(e)) return e && typeof e == "object" && "name" in e && typeof e.name == "string" ? `${e.name}()` : "a query expression";
	if (typeof e != "object" || !e || t.has(e)) return;
	t.add(e);
	let n = [...Object.keys(e), ...Object.getOwnPropertySymbols(e).filter((t) => Object.prototype.propertyIsEnumerable.call(e, t))];
	for (let r of n) {
		let n = e[r], i = Jd(n, t);
		if (i) return i;
	}
}
function Yd(e) {
	let t = Jd(e);
	if (t) throw new Ar(t);
}
function Xd(e, t, n) {
	let r = ia(e)?.parentContext, i = Ji(r), a = i === void 0 ? {} : { ...i }, o = { ...Gi(r) }, s = [];
	for (let r of t) {
		let t = r.compiled(e);
		if (s.push([
			r.alias,
			r.bindingKey,
			r.field,
			n.equality(t)
		]), r.bindingKey !== void 0 && (o[r.bindingKey] = t), r.field.length === 0) {
			let e = t;
			a[r.alias] = typeof e == "object" && e ? { ...e } : e;
			continue;
		}
		let i = a[r.alias], c = typeof i == "object" && i ? { ...i } : {};
		a[r.alias] = c;
		let l = c;
		for (let e = 0; e < r.field.length - 1; e++) {
			let t = r.field[e], n = l[t], i = typeof n == "object" && n ? { ...n } : {};
			l[t] = i, l = i;
		}
		l[r.field[r.field.length - 1]] = t;
	}
	return Wi(a, [Yi(r), s], o);
}
function Zd(e, t, n, r) {
	return Wu(e, t, (e, t, i, a) => {
		let o = {
			...Ji(a),
			...t
		};
		return o[n] = {
			...o[n],
			[J]: o[n]?.[J] ?? e
		}, ra(o, i, a), [I([
			r.equality(e),
			r.equality(i),
			Yi(a)
		]), o];
	});
}
function Qd(e, t) {
	return aa(e, t)?.correlationKey;
}
function $d(e, t) {
	return aa(e, t)?.parentContext ?? null;
}
function ef(e, t) {
	if (e == null || t == null) return !1;
	let n = q(e), r = q(t);
	return Object.is(n, r) || typeof n == "number" && typeof r == "number" && Number.isNaN(n) && Number.isNaN(r);
}
var tf = /* @__PURE__ */ new WeakMap();
function nf(e) {
	return pl(tf, e, Hi);
}
function rf(...e) {
	return af(e, !1);
}
function af([e, t, r, i, a, o, s, c, l = /* @__PURE__ */ new WeakMap(), u = /* @__PURE__ */ new WeakMap(), d, f, p = !1], m) {
	let h = d === void 0 ? l.get(e) : void 0;
	if (h) return h;
	let g = nf(l);
	m || ff(e);
	let _ = O(e), { optimizedQuery: v, sourceWhereClauses: y } = ml(e), b = sf(e, y), x = v;
	u.set(x, e), xf(x, e, u);
	let S = Object.assign(Nu(), t);
	cf(_, S);
	let C = {}, w = {}, T = {}, { alias: E, collectionId: D, pipeline: ee, sources: te, sourceIncludes: A, directIncludes: ne, isUnionFrom: j, isParentRouted: re } = pf(x.from, S, r, i, a, o, s, Lf, l, u, C, w, b, d);
	Object.assign(T, te);
	let M = d !== void 0 || A.length > 0 || ne.length > 0, N = ee, ie = f?.path[0], P = !j && !re && d !== void 0 && f !== void 0 && ie === E;
	if (d && f && P) {
		let e = T[E], t = e, n = f.path.slice(1), r = e.pipe(V(([e, t]) => {
			let r = If(t, n);
			return [g.serializeEquality(r), [
				e,
				t,
				r
			]];
		})), i = d.pipe(V(([e, t]) => [g.serializeEquality(e), t]), mn((e) => e.map(([e, t]) => [e, +(t > 0)])));
		t = r.pipe(sn(i, "inner")).pipe(xt(([e, [t]]) => t != null), V(([e, [t, n]]) => {
			let [r, i, a] = t, o = ra({
				...i,
				[J]: r
			}, a, n);
			return [n == null ? r : I([g.equality(r), Yi(n)]), o];
		})), T[E] = t, N = hf(t, E);
	} else d && !re && (N = Zd(ee, d, E, g));
	x.join && x.join.length > 0 && (N = Ed(N, x.join, T, D, E, S, l, u, r, i, a, o, s, Lf, e, x.from, (...e) => af(e, !0), C, w, b, P, g, d));
	let ae = x.join?.some(({ type: e }) => e === "right" || e === "full");
	if (d && f && (!P || ae)) {
		let e = X(f);
		N = N.pipe(xt(([, t]) => ef(e(t), Qd(t, E))));
	}
	if (x.where && x.where.length > 0) for (let e of x.where) {
		let t = X(k(e));
		N = N.pipe(xt(([e, n]) => _a(t(n))));
	}
	if (x.fnWhere && x.fnWhere.length > 0) for (let e of x.fnWhere) N = N.pipe(xt(([t, n]) => {
		let r = M ? ua(n) : n;
		return _a(e(r));
	}));
	let oe = [...ne, ...A.map(({ include: e }) => e)], se = !!x.fnSelect && oe.length > 0, ce = x.select ? [] : [...ne], F = [], le = [...A.map(({ sourceAlias: e, include: t }) => ({
		include: t,
		keyPrefix: `${e}.`,
		paths: x.select == null ? x.fnSelect && !se ? [] : [{
			path: [e, ...t.resultPath],
			guards: []
		}] : wf(x.select, [e, ...t.resultPath]),
		route: (n) => Rf(n[e], t.fieldName)
	})), ...(x.select ? ne : []).map((e) => ({
		include: e,
		keyPrefix: "",
		paths: wf(x.select, e.resultPath),
		route: (t) => Rf(t, e.fieldName)
	}))];
	for (let { include: e, keyPrefix: t, paths: n, route: r } of le) for (let { path: i, guards: a } of n) {
		let n = jf(t + i.join("."), F);
		ce.push({
			...e,
			fieldName: n,
			resultPath: i
		}), F.push({
			fieldName: n,
			getRouting: Bf(a, r)
		});
	}
	let ue = x.select !== void 0 && ns(x.select), de = (x.orderBy?.length ?? 0) > 0, fe = de || !!x.singleResult, pe = [];
	if (x.select) {
		let t = Df(x.select);
		if (t.length > 0 && ((x.groupBy?.length ?? 0) > 0 || ue)) throw new Yr(t[0].path.join("."));
		t.length > 0 && (x = {
			...x,
			select: { ...x.select }
		});
		for (let { key: n, path: c, subquery: d, guards: f } of t) {
			let t = jf(n, F), m = X(d.correlationField), h = d.parentProjection?.map((e) => ({
				alias: e.path[0],
				field: e.path.slice(1),
				bindingKey: e.bindingId ? JSON.stringify([e.bindingId, e.path.slice(1)]) : void 0,
				compiled: X(e)
			})) ?? [], _ = Bf(f, (e) => ({
				active: !0,
				correlationKey: m(e),
				parentContext: h.length > 0 ? Xd(e, h, g) : null
			})), v = (n) => {
				let f = (n ? n.pipe(V(([, [e]]) => zf(e, t))) : N.pipe(V(([, e]) => _(e)))).pipe(xt((e) => e.active), V((e) => [e.correlationKey, e.parentContext]), mn((e) => e.map(([e, t]) => [e, +(t > 0)]))), m = d.childCorrelationField.path[0], h = d.query.from.type === "collectionRef" ? d.query.from.collection : void 0, v = Pu(d.query, d.query.from, m, d.childCorrelationField, h, w);
				if (v.length > 0) {
					for (let e of v) {
						o.add(e.sourceId);
						let t = e.path[0];
						t && vo(t, e.path, e.collection);
					}
					let t = Vf(e, d.correlationField), r = !p && (!n || x.singleResult && x.offset === void 0 && (x.limit ?? 1) > 0 && t.size === 1) ? t : /* @__PURE__ */ new Set(), i = v.map((e) => Td(a, e, r)), s = /* @__PURE__ */ new Map();
					f = f.pipe(gn((e) => {
						for (let [[t], n] of e.getInner()) {
							if (t == null) continue;
							let e = g.serializeEquality(t), r = (s.get(e)?.weight ?? 0) + n;
							r === 0 ? s.delete(e) : s.set(e, {
								key: t,
								weight: r
							});
						}
						let t = new Set([...s.values()].filter(({ weight: e }) => e > 0).map(({ key: e }) => e));
						v.forEach((e, n) => a[e.sourceId]?.setDemand?.(i[n], t));
					}));
				}
				let y = af([
					d.parentFilters && d.parentFilters.length > 0 ? {
						...d.query,
						where: [...d.query.where || [], ...d.parentFilters]
					} : d.query,
					S,
					r,
					i,
					a,
					o,
					s,
					Lf,
					l,
					u,
					f,
					d.childCorrelationField,
					p || fe
				], !0);
				for (let [e, t] of y.sourceWhereClauses) b.set(e, t);
				ce.push({
					pipeline: y.pipeline,
					fieldName: t,
					resultPath: c,
					correlationField: d.correlationField,
					childCorrelationField: d.childCorrelationField,
					hasOrderBy: (d.query.orderBy?.length ?? 0) > 0,
					childCompilationResult: y,
					parentProjection: d.parentProjection,
					materialization: d.materialization,
					scalarField: d.scalarField
				});
			};
			fe ? pe.push(v) : v(), F.push({
				fieldName: t,
				getRouting: _
			}), x = {
				...x,
				select: Pf(x.select, c).value
			};
		}
	}
	if (x.distinct && !x.fnSelect && !x.select && x.from.type !== "unionAll") throw new Or();
	if (x.fnSelect && x.groupBy && x.groupBy.length > 0) throw new kr();
	let me = F, he = (e) => Object.fromEntries(me.map(({ fieldName: t, getRouting: n }) => [t, n(e)]));
	if (se) {
		if (!oe.every(of)) throw Error(n(128));
		N = Ul({
			pipeline: N.pipe(V(([e, t]) => [e, [{
				...t,
				[ea]: {
					...t[ea],
					...he(t)
				}
			}, void 0]])),
			includes: ce,
			valueIdentity: g,
			collectionId: D,
			sourceWhereClauses: b,
			aliasToCollectionId: C,
			aliasRemapping: w
		}).pipeline.pipe(V(([e, [t]]) => {
			let n = { ...t };
			return delete n[ea], [e, n];
		})), ce = [], F = [];
	}
	if (x.fnSelect) {
		let e = (e) => {
			let t = x.fnSelect(e);
			return Yd(t), t;
		}, t = (t) => {
			let n = M ? ua(t) : t, r = e(n), i = r;
			if (r && typeof r == "object" && (Array.isArray(r) || Xi(r))) {
				i = Array.isArray(r) ? [...r] : { ...r };
				let e = t[ea];
				e && (i[ea] = e);
			}
			return {
				...t,
				$selected: i
			};
		};
		N = N.pipe(V(([e, n]) => [e, t(n)]));
	} else x.select ? !ue && !(x.groupBy && x.groupBy.length > 0) && (N = Vd(N, x.select)) : N = N.pipe(V(([e, t]) => {
		let n = ca(t), r = j && n ? n.value : !j && !x.join && !x.groupBy ? t[E] : t;
		return [e, {
			...t,
			$selected: r
		}];
	}));
	F.length > 0 && (N = N.pipe(V(([e, t]) => {
		let n = Array.isArray(t.$selected) ? [...t.$selected] : { ...t.$selected };
		return n[ea] = he(t), [e, {
			...t,
			$selected: n
		}];
	})));
	let ge = d ? E : void 0, _e = new Map(Sf(x).map((e) => [e.alias, e.bindingId])), ve = x.from.type === "unionAll", ye = (e) => {
		let t = _e.get(e.path[0]);
		return t === void 0 ? ve && e.bindingId === void 0 && e.path[0] !== "$selected" : (e.bindingId ?? t) === t;
	};
	if (x.groupBy && x.groupBy.length > 0 ? N = qo(N, x.groupBy, g, ye, x.having, x.select, x.fnHaving, D, ge, M || F.length > 0) : ue && (N = qo(N, [], g, ye, x.having, x.select, x.fnHaving, D, ge, M || F.length > 0)), x.having && (!x.groupBy || x.groupBy.length === 0) && !ue) throw new Mr();
	if (x.fnHaving && x.fnHaving.length > 0 && (!x.groupBy || x.groupBy.length === 0)) for (let e of x.fnHaving) N = N.pipe(xt(([t, n]) => {
		let r = M || F.length > 0 ? ua(n) : n;
		return e(r);
	}));
	!ue && x.distinct && (N = lf(N, x, E, d !== void 0)), x.distinct && (N = N.pipe(yt(([e, t]) => t.$selected)));
	let be = (e, t, n) => {
		let r = yf(vf(t.$selected), t);
		return d ? [e, [
			la(r),
			n,
			Qd(t, E),
			$d(t, E),
			bf(t, E, e)
		]] : [e, [r, n]];
	}, xe = x.singleResult ? Math.min(x.limit ?? 1, 1) : x.limit;
	if (!de && (x.limit !== void 0 || x.offset !== void 0)) throw new Nr();
	let Se, Ce;
	if (de || x.singleResult) {
		let t = d && (xe !== void 0 || x.offset !== void 0) ? (e, t) => {
			let n = Qd(t, E), r = $d(t, E);
			return r == null ? g.equality(n) : I([g.equality(n), Yi(r)]);
		} : void 0, n = fs(e, N, x.orderBy ?? [], x.select || {}, r[D], s, (e) => Ce = e, xe, x.offset, t);
		for (let e of pe) e(n);
		Ce && c(Ce), Se = n.pipe(V(([e, [t, n]]) => be(e, t, n)));
	} else Se = N.pipe(V(([e, t]) => be(e, t, void 0)));
	let we = {
		collectionId: D,
		pipeline: Se,
		valueIdentity: g,
		sourceWhereClauses: b,
		aliasToCollectionId: C,
		aliasRemapping: w,
		includes: ce.length > 0 ? ce : void 0
	};
	return d === void 0 && l.set(e, we), we;
}
function of(e) {
	return e.materialization !== "collection" && (e.childCompilationResult.includes ?? []).every(of);
}
function sf(e, t) {
	let n = [...j(e.from), ...e.join?.map(({ from: e }) => e) ?? []].filter((e) => e.type === "collectionRef"), r = new Map(n.map((e) => [e.alias, e])), i = /* @__PURE__ */ new Map();
	for (let [e, n] of t) {
		let t = r.get(e);
		t && i.set(t.sourceId, n);
	}
	return i;
}
function cf(e, t) {
	for (let n of e) {
		let e = t[n.sourceId] ?? t[n.alias];
		e && (t[n.sourceId] = e);
	}
}
function lf(e, t, r, i) {
	let a = (t.orderBy ?? []).map(({ expression: e }) => X(e)), o = (e) => ({
		value: e.$selected,
		routing: e.$selected?.[ea],
		outerCorrelation: i ? Qd(e, r) : void 0,
		parentContext: i ? $d(e, r) : void 0,
		order: a.map((t) => t(e))
	});
	return e.pipe(mn((e) => {
		let t = e.reduce((e, [, t]) => e + t, 0);
		if (t === 0) return [];
		if (t < 0) throw Error(n(129));
		let r = e.find(([, e]) => e > 0)?.[0];
		if (!r) throw Error(n(130));
		let i = o(r);
		for (let [t, r] of e) if (r > 0 && !W(i, o(t))) throw Error(n(131));
		return [[r, 1]];
	}));
}
function uf(e, t) {
	for (let r of C(e)) if (r.bindingId !== void 0 && !t.has(r.bindingId)) throw new U(n(238, { path: r.path }));
}
function df(e, t) {
	if (!(e instanceof w)) {
		if (E(e)) uf(e, t);
		else if (e instanceof T) {
			for (let n of e.branches) uf(n.condition, t), df(n.value, t);
			e.defaultValue !== void 0 && df(e.defaultValue, t);
		} else if (Mf(e)) for (let n of Object.values(e)) df(n, t);
	}
}
function ff(e, t = /* @__PURE__ */ new Set()) {
	let r = Sf(e).map((e) => e.alias);
	for (let [e, t] of r.entries()) if (r.indexOf(t) !== e) throw new U(n(211, { alias: t }));
	let i = new Set(t);
	if (e.from.type === "unionAll") for (let n of e.from.queries) ff(n, t);
	else for (let n of j(e.from)) n.type === "queryRef" && ff(n.query, t), i.add(n.bindingId);
	if (e.join) for (let n of e.join) {
		n.from.type === "queryRef" && ff(n.from.query, t);
		let e = new Set(i);
		e.add(n.from.bindingId), uf(n.on, e), i.add(n.from.bindingId);
	}
	for (let t of e.where ?? []) uf(k(t), i);
	for (let t of e.groupBy ?? []) uf(t, i);
	for (let t of e.having ?? []) uf(te(t), i);
	for (let { expression: t } of e.orderBy ?? []) uf(t, i);
	if (e.select) {
		df(e.select, i);
		for (let { subquery: t } of Df(e.select)) {
			uf(t.correlationField, i);
			let e = new Set(i);
			for (let n of Sf(t.query)) e.add(n.bindingId);
			uf(t.childCorrelationField, e);
			for (let n of t.parentFilters ?? []) uf(k(n), e);
			ff(t.query, i);
			let r = new Set((t.parentProjection ?? []).map((e) => JSON.stringify([e.bindingId, e.path]))), a = [...Su(t.query), ...(t.parentFilters ?? []).flatMap((e) => C(k(e)))];
			for (let e of a) if (e.bindingId !== void 0 && i.has(e.bindingId) && !r.has(JSON.stringify([e.bindingId, e.path]))) throw new U(n(239, { path: e.path }));
		}
	}
}
function pf(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
	let m = nf(c);
	if (e.type === "unionAll") return mf(e, t, n, r, i, a, o, s, c, l, u, d, f, p);
	if (e.type !== "unionFrom") {
		let { alias: m, input: h, collectionId: g, sourceIncludes: _, isParentRouted: v } = _f(e, t, n, r, i, a, o, s, c, l, u, d, f, p);
		return {
			alias: m,
			pipeline: hf(h, m),
			collectionId: g,
			sources: { [m]: h },
			sourceIncludes: _,
			directIncludes: [],
			isUnionFrom: !1,
			isParentRouted: v
		};
	}
	if (e.sources.length === 0) throw new Fr("empty unionFrom");
	let h = {}, g = [], _, v = "", y = "";
	for (let b of e.sources) {
		let { alias: e, input: x, collectionId: S, sourceIncludes: C, isParentRouted: w } = _f(b, t, n, r, i, a, o, s, c, l, u, d, f, p);
		v || (v = e, y = S), h[e] = x, g.push(...C);
		let T = (p && !w ? Zd(hf(x, e), p, e, m) : hf(x, e)).pipe(V(([t, n]) => {
			let r = `${e}:${gf(t)}`, i = n[e]?.[J] ?? t, a = `${e}:${gf(i)}`;
			return [r, p ? {
				...n,
				[J]: a,
				[e]: {
					...n[e],
					[J]: a
				}
			} : n];
		}));
		_ = _ ? _.pipe(ht(T)) : T;
	}
	return {
		alias: v,
		pipeline: _,
		collectionId: y,
		sources: h,
		sourceIncludes: g,
		directIncludes: [],
		isUnionFrom: !0,
		isParentRouted: p !== void 0
	};
}
function mf(e, t, r, i, a, o, s, c, l, u, d, f, p, m) {
	if (e.queries.length === 0) throw new Fr("empty unionAll");
	let h = {}, g = [], _ = [], v, y = "", b = /* @__PURE__ */ new Set();
	for (let g = 0; g < e.queries.length; g++) {
		let x = e.queries[g];
		for (let e of Sf(x)) {
			if (b.has(e.alias)) throw Error(n(132, { alias: e.alias }));
			b.add(e.alias);
		}
		let S = af([
			x,
			t,
			r,
			i,
			a,
			o,
			s,
			c,
			l,
			u,
			m,
			void 0
		], !0);
		y ||= S.collectionId, Object.assign(d, S.aliasToCollectionId), Object.assign(f, S.aliasRemapping), _.push(...S.includes ?? []), Object.assign(h, t);
		for (let [e, t] of S.sourceWhereClauses) p.set(e, t);
		let C = S.pipeline.pipe(V((e) => {
			let [t, [n, r, i, a, o]] = e, s = `${g}:${gf(t)}`, c = `${g}:${gf(o ?? t)}`;
			return [s, m ? sa(n, i, a, c) : n];
		}));
		v = v ? v.pipe(ht(C)) : C;
	}
	return {
		alias: "",
		pipeline: v,
		collectionId: y,
		sources: h,
		sourceIncludes: g,
		directIncludes: _,
		isUnionFrom: !0,
		isParentRouted: m !== void 0
	};
}
function hf(e, t) {
	return e.pipe(V(([e, n]) => {
		let r = n, i = ca(r);
		if (i) return [e, ra({
			...Ji(i.parentContext),
			[t]: i.value,
			[J]: i.publicKey
		}, i.correlationKey, i.parentContext)];
		if (typeof r != "object" || !r) return [e, { [t]: r }];
		let a = ia(r), o = a ? oa(r) : r, s = {
			...Ji(a?.parentContext),
			[t]: o
		};
		return a && ra(s, a.correlationKey, a.parentContext), [e, s];
	}));
}
function gf(e) {
	return typeof e == "string" ? `string:${e}` : typeof e == "number" ? `number:${String(e)}` : typeof e == "bigint" ? `bigint:${String(e)}` : `${typeof e}:${JSON.stringify(e)}`;
}
function _f(e, t, n, r, i, a, o, s, c, l, u, d, f, m) {
	switch (e.type) {
		case "descriptorRef": return p(e);
		case "collectionRef": {
			let n = t[e.sourceId];
			if (!n) throw new Pr(e.alias, e.collection.id, Object.keys(t));
			return u[e.alias] = e.collection.id, {
				alias: e.alias,
				input: n,
				collectionId: e.collection.id,
				sourceIncludes: [],
				isParentRouted: !1
			};
		}
		case "queryRef": {
			let p = l.get(e.query), h = af([
				p && _d(e.query, p) ? p : e.query,
				t,
				n,
				r,
				i,
				a,
				o,
				s,
				c,
				l,
				m,
				void 0
			], !0);
			Object.assign(u, h.aliasToCollectionId), Object.assign(d, h.aliasRemapping);
			let g = l.has(e.query), _ = Cf(e.query.from);
			if (g || e.alias !== _) for (let [e, t] of h.sourceWhereClauses) f.set(e, t);
			let v = Object.keys(h.aliasToCollectionId).find((e) => h.aliasToCollectionId[e] === h.collectionId);
			v && v !== e.alias && (d[e.alias] = v);
			let y = h.pipeline.pipe(V((e) => {
				let [t, [n, r, i, a, o]] = e;
				return [t, sa(vf(n), i, a, o)];
			}));
			return {
				alias: e.alias,
				input: y,
				collectionId: h.collectionId,
				sourceIncludes: h.includes?.map((t) => ({
					sourceAlias: e.alias,
					include: t
				})) ?? [],
				isParentRouted: m !== void 0
			};
		}
		default: throw new Fr(e.type);
	}
}
function vf(e) {
	return e instanceof b ? e.value : e;
}
function yf(e, t) {
	if (!e || typeof e != "object" || !Array.isArray(e) && !Xi(e)) return e;
	let n = e, r = !1;
	for (let e of Da) if (n[e] == null && e in t) {
		r = !0;
		break;
	}
	if (!r) return e;
	let i = Array.isArray(e) ? [...e] : { ...e };
	for (let e of Da) n[e] == null && e in t && (i[e] = t[e]);
	return i;
}
function bf(e, t, n) {
	return e[t]?.[J] ?? e[J] ?? n;
}
function xf(e, t, n) {
	if (Ef(e.from, t.from, n), e.join && t.join) for (let r = 0; r < e.join.length && r < t.join.length; r++) {
		let i = e.join[r], a = t.join[r];
		i.from.type === "queryRef" && a.from.type === "queryRef" && (n.set(i.from.query, a.from.query), xf(i.from.query, a.from.query, n));
	}
}
function Sf(e) {
	return [...j(e.from), ...e.join?.map((e) => e.from) ?? []];
}
function Cf(e) {
	return j(e)[0]?.alias ?? "";
}
function wf(e, t) {
	let n = [], r = (e, t, n) => {
		for (let [r, o] of Object.entries(e)) r.startsWith("__SPREAD_SENTINEL__") ? i(r, o, t, n) : a(o, [...t, r], n);
	}, i = (e, r, i, a) => {
		let o = e.slice(19), s = o.lastIndexOf("__"), c = s >= 0 ? o.slice(0, s) : o, l = r && typeof r == "object" && "type" in r && r.type === "ref" ? r.path : c.split(".").filter(Boolean);
		Tf(t, l) && n.push({
			path: [...i, ...t.slice(l.length)],
			guards: a
		});
	}, a = (e, i, o) => {
		if (e instanceof _ && Tf(t, e.path)) n.push({
			path: [...i, ...t.slice(e.path.length)],
			guards: o
		});
		else if (e instanceof T) {
			let t = [];
			for (let n of e.branches) a(n.value, i, [
				...o,
				...t,
				{
					condition: n.condition,
					expected: !0
				}
			]), t.push({
				condition: n.condition,
				expected: !1
			});
			e.defaultValue !== void 0 && a(e.defaultValue, i, [...o, ...t]);
		} else Mf(e) && r(e, i, o);
	};
	return r(e, [], []), n;
}
function Tf(e, t) {
	return t.length <= e.length && t.every((t, n) => e[n] === t);
}
function Ef(e, t, n) {
	if (e.type === "unionAll" && t.type === "unionAll") {
		for (let r = 0; r < e.queries.length && r < t.queries.length; r++) {
			let i = e.queries[r], a = t.queries[r];
			n.set(i, a), xf(i, a, n);
		}
		return;
	}
	let r = j(e), i = j(t);
	for (let e = 0; e < r.length && e < i.length; e++) {
		let t = r[e], a = i[e];
		t.type === "queryRef" && a.type === "queryRef" && (n.set(t.query, a.query), xf(t.query, a.query, n));
	}
}
function Df(e) {
	let t = [];
	for (let [n, r] of Object.entries(e)) n.startsWith("__SPREAD_SENTINEL__") || (r instanceof w ? t.push({
		key: Af([n], t),
		path: [n],
		subquery: r,
		guards: []
	}) : r instanceof T ? Of(r, [n], [], t) : Mf(r) && Nf(r, n));
	return t;
}
function Of(e, t, n, r) {
	let i = [];
	for (let a of e.branches) kf(a.value, t, [
		...n,
		...i,
		{
			condition: a.condition,
			expected: !0
		}
	], r), i.push({
		condition: a.condition,
		expected: !1
	});
	e.defaultValue !== void 0 && kf(e.defaultValue, t, [...n, ...i], r);
}
function kf(e, t, n, r) {
	if (e instanceof w) {
		let i = Af(t, r);
		r.push({
			key: i,
			path: t,
			subquery: e,
			guards: n
		});
	} else if (e instanceof T) Of(e, t, n, r);
	else if (Mf(e)) for (let [i, a] of Object.entries(e)) i.startsWith("__SPREAD_SENTINEL__") || kf(a, [...t, i], n, r);
}
function Af(e, t) {
	return jf(e.join("."), t);
}
function jf(e, t) {
	let n = new Set(t.map((e) => e.key ?? e.fieldName));
	if (!n.has(e)) return e;
	let r = t.length;
	for (; n.has(`${e}#${r}`);) r++;
	return `${e}#${r}`;
}
function Mf(e) {
	return typeof e == "object" && !!e && !Array.isArray(e) && !D(e) && !o(e);
}
function Nf(e, t) {
	for (let [r, i] of Object.entries(e)) if (!r.startsWith("__SPREAD_SENTINEL__")) {
		if (i instanceof w) throw Error(n(133, {
			parentPath: t,
			key: r
		}));
		Mf(i) && Nf(i, `${t}.${r}`);
	}
}
function Pf(e, t) {
	if (t.length === 0 && e instanceof w) return {
		value: new b(null),
		replaced: !0
	};
	if (e instanceof T) return Ff(e, t);
	if (t.length === 0 || !Mf(e)) return {
		value: e,
		replaced: !1
	};
	let [n, ...r] = t, i = Pf(e[n], r);
	return i.replaced ? {
		value: {
			...e,
			[n]: i.value
		},
		replaced: !0
	} : {
		value: e,
		replaced: !1
	};
}
function Ff(e, t) {
	let n = !1, r = e.branches.map((e) => {
		let r = Pf(e.value, t);
		return r.replaced ? (n = !0, {
			...e,
			value: r.value
		}) : e;
	}), i = e.defaultValue;
	if (e.defaultValue !== void 0) {
		let r = Pf(e.defaultValue, t);
		r.replaced && (n = !0, i = r.value);
	}
	return n ? {
		value: new T(r, i),
		replaced: !0
	} : {
		value: e,
		replaced: !1
	};
}
function If(e, t) {
	let n = e;
	for (let e of t) {
		if (n == null) return n;
		n = n[e];
	}
	return n;
}
var Lf = () => {};
function Rf(e, t) {
	return e?.[ea]?.[t];
}
function zf(e, t) {
	let r = Rf(e.$selected, t);
	if (!r) throw Error(n(243));
	return r;
}
function Bf(e, t) {
	let n = e.map((e) => ({
		condition: X(e.condition),
		expected: e.expected
	}));
	return (e) => (n.every((t) => Ca(t.condition(e)) === t.expected) ? t(e) : void 0) ?? {
		active: !1,
		correlationKey: null,
		parentContext: null
	};
}
function Vf(e, t) {
	let n = [], r = (e) => {
		if (e.type !== "func") return;
		if (e.name === "and") {
			e.args.forEach(r);
			return;
		}
		if (e.name !== "eq" && e.name !== "in") return;
		let [i, a] = e.args, o = i?.type === "ref" && Hf(i.path, t.path) && a instanceof b ? a.value : a?.type === "ref" && Hf(a.path, t.path) && i instanceof b ? i.value : void 0;
		o !== void 0 && n.push(new Set(Array.isArray(o) ? o : [o]));
	};
	return e.where?.forEach((e) => r(k(e))), n.length === 0 ? /* @__PURE__ */ new Set() : new Set([...n[0]].filter((e) => n.slice(1).every((t) => t.has(e))));
}
function Hf(e, t) {
	return e.length === t.length && e.every((e, n) => e === t[n]);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live/ordered-source-loader.js
var Uf = class {
	constructor(e) {
		this.cause = e;
	}
}, Wf = class {
	constructor(e, t, n, r = () => {}, i = () => !1, a, o = () => !1) {
		this.info = e, this.subscription = t, this.alias = n, this.f_ = r, this.f0 = i, this.getGraphInputRevision = a, this.hasPendingJoinedWork = o, this.aL = !1, this.ap = !1, this.ae = !1, this.fT = !1, this.l = "none", this.aF = /* @__PURE__ */ new Map(), this.av = /* @__PURE__ */ new Set(), this.a_ = /* @__PURE__ */ new Map(), this.active = !0, this.orderedLoadGeneration = 0, this.orderingInvalidationGeneration = 0, this.needsOptimisticRefill = !1, this.retiringSupersededAcquisitions = !1, this.cr = 0, this.bG = !1, this.info.isRequesting = () => this.fT, this.gp = e.sourceHoldsAllRows && e.index !== void 0 && e.orderBy.length === 1 && e.joinedFilterSourceId === void 0;
	}
	onSourceChanges(e, t, n) {
		let r = !1, i = !1;
		for (let a of e) {
			let e = t?.get(a.key);
			if (!(a.type === "delete" && this.retiringSupersededAcquisitions)) {
				if (n(a.key) && a.type !== "insert" && e !== void 0 && (a.type === "delete" || this.info.comparator(e, a.value) !== 0) && (i = !0), !n(a.key) && a.type !== "insert" && e !== void 0 && (a.type === "delete" || this.info.comparator(e, a.value) !== 0)) {
					this.invalidateSourceOrdering();
					return;
				}
				a.type !== "delete" && e === void 0 && (r = !0);
			}
		}
		i && !this.info.sourceHoldsAllRows && this.subscription.readOrderedSnapshot({
			orderBy: Eo(this.info.orderBy, this.alias),
			limit: this.info.offset + this.info.limit
		}).filter(({ key: e }) => !n(e)).length < this.info.offset + this.info.limit && (this.needsOptimisticRefill = !0, this.invalidateCursor()), r && this.invalidateCursor();
	}
	start() {
		let { index: e, limit: t, offset: n, requiresFullSource: r } = this.info;
		e && this.subscription.setOrderByIndex(e), t !== 0 && (r ? this.loadFullSource() : e ? this.fK(n + t) : this.e$(n + t));
	}
	loadMore(e, t = !1) {
		if (this.fT && (this.graphCheckedDuringRequest = this.getGraphInputRevision?.()), !this.active || this.info.limit === 0 || this.fT) return;
		if (e ??= this.bN?.windowOperationGeneration, t ||= this.bN?.continuesOrderedPrefixRepair ?? !1, this.info.joinedFilterSourceId && this.hasPendingJoinedWork()) return (e !== void 0 || t) && (this.bN = {
			windowOperationGeneration: e,
			continuesOrderedPrefixRepair: t
		}), this.pending;
		if (this.bN = void 0, this.S) {
			if (this.ap && !this.S.isAuthoritativeRequest) this.S = void 0;
			else if (this.c3(e), !this.active || this.pending) return this.pending;
		}
		if (!(this.aj === void 0 || e !== void 0 && e !== this.aj.windowOperationGeneration)) return this.pending;
		if ((this.aj || this.a_.size > 0) && e !== void 0 && (this.cG(), this.cr = 0, this.aj && (this.aj.windowOperationGeneration = e), this.c7(), !this.active)) return;
		if (this.l === "failed") this.l = "none";
		else if (this.l !== "none" && !(t && this.F === "ordered-repair")) return e !== void 0 && (this.bN = {
			windowOperationGeneration: e,
			continuesOrderedPrefixRepair: t
		}), this.pending;
		if (this.ap && !(t && this.F === "ordered-repair") || this.info.requiresFullSource) return this.ae && !this.info.requiresFullSource ? this.dw(e) : this.loadFullSource(e), this.pending;
		if (!this.info.index) return e !== void 0 || this.needsOptimisticRefill || (this.info.dataNeeded?.(this.ah) ?? 0) > 0 || this.bQ !== void 0 && this.bQ < this.info.offset + this.info.limit ? (this.needsOptimisticRefill = !1, this.e$(this.info.offset + this.info.limit, e, t)) : t && this.au(e), this.pending;
		if (!this.info.dataNeeded || this.pending) return this.pending && e !== void 0 && (this.bN = {
			windowOperationGeneration: e,
			continuesOrderedPrefixRepair: t
		}), t && !this.pending && this.au(e), this.pending;
		let n = Math.max(this.info.dataNeeded(this.ah), this.aL ? 0 : this.info.offset + this.info.limit, +!!this.needsOptimisticRefill);
		if (e !== void 0 && this.ah !== void 0) {
			let e = this.info.offset + this.info.limit;
			n = Math.max(n, e - this.em());
		}
		return n > 0 ? (this.needsOptimisticRefill = !1, this.fK(n, e, t)) : t && this.au(e), this.pending;
	}
	loadFullSource(e) {
		this.active && this.l === "none" && (this.l = "held", this.F = "full-source", this.bY((e) => {
			this.subscription.requestSnapshot({
				...this.ap ? { refetch: !0 } : {},
				trackLoadSubsetPromise: !1,
				onLoadSubsetResult: e
			});
		}, "full-source", e));
	}
	dw(e) {
		this.active && this.l === "none" && (this.W = this.orderingInvalidationGeneration, this.av = /* @__PURE__ */ new Set(), this.l = "held", this.F = "ordered-repair", this.ownPrefixCount = this.info.offset + this.info.limit, this.bY((e) => {
			this.subscription.requestSnapshot({
				refetch: !0,
				orderBy: Eo(this.info.orderBy, this.alias),
				limit: this.info.offset + this.info.limit,
				boundedPrefix: this.gp,
				trackLoadSubsetPromise: !1,
				onLoadSubsetResult: e
			});
		}, "ordered-repair", e, !0, this.info.offset + this.info.limit));
	}
	e$(e, t, n = !1) {
		!this.active || this.pending || this.S || (this.bQ === e ? (this.info.dataNeeded?.(this.ah) ?? 0) > 0 ? (n && this.bi(), this.loadFullSource(t)) : n && this.au(t) : (this.bY((t) => {
			this.subscription.requestSnapshot({
				...n ? { refetch: !0 } : {},
				orderBy: Eo(this.info.orderBy, this.alias),
				limit: e,
				boundedPrefix: this.gp,
				trackLoadSubsetPromise: !1,
				onLoadSubsetResult: t
			});
		}, "ordered", t, n, e), this.bQ = e, this.ownPrefixCount = e));
	}
	resetCursor() {
		this.cG(), this.cr = 0, this.orderedLoadGeneration++, this.l === "complete" && (this.l = "held"), this.pending = void 0, this.bN = void 0, this.dl = void 0, this.ah = void 0, this.S = void 0, this.invalidateCursor();
	}
	settleFullSourceReplay() {
		if (this.F === "ordered-repair") this.au();
		else {
			if (this.l === "failed") {
				for (let [e, t] of this.a_) t === "full-source" && this.a_.delete(e);
				this.l = "held";
			}
			this.l !== "none" && (this.l = "complete", this.F = void 0, this.aB());
		}
	}
	aB(e, t) {
		if (this.l !== "complete" && !e && !t || this.subscription.hasPendingTruncateReplacement) return;
		let n = this.orderedLoadGeneration;
		Ms(Array.from(this.aF, ([r, i]) => () => {
			t?.has(r) || this.active && n === this.orderedLoadGeneration && (this.l !== "complete" && !t && (!e || r === e.release || i === void 0 || i > e.count) || (this.aF.delete(r), r()));
		}));
	}
	invalidateCursor() {
		this.S?.isAuthoritativeRequest || (this.S = void 0), this.eZ = void 0, this.bQ = void 0;
	}
	invalidateSourceOrdering() {
		this.orderingInvalidationGeneration++, this.invalidateCursor(), this.dl = void 0, !this.ap && this.aL && this.l === "none" && (this.ae = !0), this.ah = void 0, this.ap = !0;
	}
	revalidateLoadedCoverage() {
		this.active && !this.info.requiresFullSource && this.aL && this.l !== "complete" && !this.windowIsInsideOwnPrefix() && this.invalidateSourceOrdering();
	}
	windowIsInsideOwnPrefix() {
		let e = this.info.offset + this.info.limit;
		if ((this.ownPrefixCount ?? 0) < e || !this.info.dataNeeded || this.subscription.hasHeldSyncTransaction) return !1;
		let t = this.subscription.readOrderedSnapshot({
			orderBy: Eo(this.info.orderBy, this.alias),
			limit: e + 1
		});
		if (t.length <= e) return !1;
		let n = t[e - 1].value;
		return this.info.comparator(t[e].value, n) > 0 && this.info.dataNeeded(n) === 0;
	}
	au(e) {
		if (this.F !== "ordered-repair") return;
		if (this.W !== this.orderingInvalidationGeneration) {
			if (this.av = /* @__PURE__ */ new Set(), this.l = "none", this.F = void 0, this.W = void 0, !this.active) return;
			this.aj ? (this.ae = !1, this.loadFullSource(e)) : (this.ae = !0, this.dw(e));
			return;
		}
		let t = this.av;
		this.retiringSupersededAcquisitions = !0;
		try {
			this.aB(void 0, t);
		} finally {
			this.retiringSupersededAcquisitions = !1;
			let e = [...this.aF.keys()].some((e) => !t.has(e));
			this.active && e || (this.av = /* @__PURE__ */ new Set(), this.cG(), this.cr = 0, this.ae = !1, this.ap = !1, this.l = "none", this.F = void 0, this.W = void 0);
		}
	}
	bi() {
		this.F === "ordered-repair" && (this.av = /* @__PURE__ */ new Set(), this.ae = !1, this.l = "none", this.F = void 0, this.W = void 0);
	}
	dispose() {
		this.active = !1, this.resetCursor(), this.a_.clear(), this.aF.clear();
	}
	em() {
		return this.subscription.readOrderedSnapshot({
			orderBy: Eo(this.info.orderBy, this.alias),
			limit: this.info.offset + this.info.limit
		}).filter(({ value: e }) => this.info.comparator(e, this.ah) <= 0).length;
	}
	fK(e, t, n = !1) {
		if (!this.active || this.pending || this.S) return;
		let r = this.ah === void 0, i = this.ah, a;
		if (i !== void 0) {
			let e = this.info.valueExtractorForRawRow(i);
			if (!Us(this.info.orderBy, [e])) {
				this.e$(this.info.offset + this.info.limit, t, n);
				return;
			}
			a = [e];
		}
		let o = a?.[0];
		this.eZ?.count === e && Object.is(this.eZ.boundary, o) ? n && this.au(t) : (this.eZ = {
			count: e,
			boundary: o
		}, this.ownPrefixCount = r ? e : void 0, this.bY((t) => {
			this.subscription.requestLimitedSnapshot({
				...n ? { refetch: !0 } : {},
				orderBy: Eo(this.info.orderBy, this.alias),
				limit: e,
				minValues: a,
				offset: r ? 0 : this.em(),
				trackLoadSubsetPromise: !1,
				onLoadSubsetResult: t
			});
		}, "ordered", t, n, e));
	}
	observe(e, t, n, r, i, a = !1, o, s) {
		let c = n === "full-source", l = n === "ordered-repair", u = c || l || a, d = u && this.aL && this.ap && r === void 0, f = this.orderedLoadGeneration, p = this.orderingInvalidationGeneration, m = e instanceof Promise, h = !m && r === void 0 && (!u || (c ? !this.ap : this.gp)) && o !== void 0, g, _ = (e) => ({
			kind: e,
			orderedLoadGeneration: f,
			orderingInvalidationGeneration: p,
			isAuthoritativeRequest: u,
			windowOperationGeneration: r,
			continuesOrderedPrefixRepair: a
		}), v = (e, t) => {
			t ? this.S = e : this.eI(e);
		}, y = (e, o = !1) => {
			e && this.pending === e && (this.pending = void 0), this.active && Ms([() => {
				if (!c) {
					let e = i?.orderBy && !i.cursor ? i.limit : void 0;
					if (this.aF.set(t, e), (l || a) && this.av.add(t), a || this.aB(), !a && f === this.orderedLoadGeneration && (u || p === this.orderingInvalidationGeneration) && e !== void 0 && this.aB({
						release: t,
						count: e
					}), !u && f === this.orderedLoadGeneration && p !== this.orderingInvalidationGeneration && this.l === "none" && !this.ap && this.aF.delete(t)) {
						this.retiringSupersededAcquisitions = !0;
						try {
							t();
						} finally {
							this.retiringSupersededAcquisitions = !1;
						}
					}
				}
			}, () => {
				if (f === this.orderedLoadGeneration && (u || p === this.orderingInvalidationGeneration) && (u || !this.aj && this.l === "none")) {
					if ((l || a) && this.aj) this.bi(), this.loadFullSource(r);
					else {
						if (this.aj = void 0, n !== "boundary" && (this.aL = !0, i?.orderBy && !i.cursor && (this.bQ = i.limit), !c && i?.orderBy)) try {
							this.ah = this.subscription.readOrderedSnapshot({
								...i,
								limit: s ?? i.limit
							}).at(-1)?.value ?? this.ah;
						} catch (e) {
							if (h) throw g = { error: e }, e;
							b(e);
						}
						(l || a) && this.W !== this.orderingInvalidationGeneration ? this.au(r) : (c && (this.cG(), this.cr = 0, this.ae = !1, this.ap = !1, this.l = "complete", this.F = void 0, this.W = void 0, this.aB()), v(_(l || n === "ordered" ? "boundary" : "more"), o));
					}
				}
			}]);
		}, b = (e, i) => {
			if (this.aF.delete(t), this.S = void 0, i && this.pending === i && (this.pending = void 0), !this.active) return;
			let a = !u && p !== this.orderingInvalidationGeneration && this.aj === void 0 && this.l === "none" && !this.ap;
			if (this.dy(), f === this.orderedLoadGeneration) throw u && (c ? this.l = "failed" : (this.l = "none", this.F = void 0, this.W = void 0)), this.d5(r), this.a_.set(t, n), d && this.eh(), a && f === this.orderedLoadGeneration && this.loadFullSource(r), e;
		};
		if (h) {
			try {
				Ms([
					() => y(void 0, !0),
					() => {
						g || this.f_(!0, !1, !1);
					},
					() => {
						!g && this.graphHasProcessedInput(o) && this.es(o);
					}
				]);
			} catch (e) {
				throw g ? g.error : new Uf(e);
			}
			return this.pending;
		}
		let x = (m ? e : Promise.resolve()).then(() => y(x), (e) => b(e, x));
		return this.pending = x, x.catch(() => {}), this.f_(x, u && this.ap, m), x;
	}
	eI(e, t = e.windowOperationGeneration) {
		if (this.active && e.orderedLoadGeneration === this.orderedLoadGeneration && (e.isAuthoritativeRequest || e.orderingInvalidationGeneration === this.orderingInvalidationGeneration)) {
			if (e.kind === "boundary") this.fJ(t, e.continuesOrderedPrefixRepair);
			else {
				if (this.info.joinedFilterSourceId && this.hasPendingJoinedWork()) {
					this.S = e;
					return;
				}
				this.loadMore(t, e.continuesOrderedPrefixRepair);
			}
		}
	}
	c3(e) {
		let t = this.S;
		t && (this.S = void 0, this.eI(t, e));
	}
	graphHasProcessedInput(e) {
		let t = this.getGraphInputRevision?.();
		return t === e || t === this.graphCheckedDuringRequest;
	}
	es(e) {
		if (!this.bG) {
			this.bG = !0;
			try {
				for (; this.S && !this.pending && this.graphHasProcessedInput(e);) this.c3();
			} finally {
				this.bG = !1;
			}
		}
	}
	fJ(e, t = !1) {
		let n = this.ah;
		if (n === void 0) return t ? this.loadMore(e, !0) : void 0;
		let r = this.info.valueExtractorForRawRow(n), i = Eo(this.info.orderBy, this.alias);
		if (!Us(i.slice(0, 1), [r])) return t && this.bi(), this.loadFullSource(e), this.pending;
		if (Object.is(this.dl, r)) return this.loadMore(e, t);
		let a = Hs(i, [r]);
		return a ? (this.dl = r, this.bY((e) => {
			this.subscription.requestSnapshot({
				...t ? { refetch: !0 } : {},
				where: a,
				trackLoadSubsetPromise: !1,
				onLoadSubsetResult: e
			});
		}, "boundary", e, t)) : (t && this.bi(), this.loadFullSource(e), this.pending);
	}
	dy() {
		this.ah = void 0, this.ae = !1, this.av.clear(), this.W = void 0, this.ap = !0;
	}
	cG() {
		clearTimeout(this.dK), this.dK = void 0;
	}
	c7() {
		let e = this.a_;
		this.a_ = /* @__PURE__ */ new Map(), this.fT = !0;
		try {
			Ms(e.keys());
		} finally {
			this.fT = !1;
		}
	}
	eh() {
		if (!this.active || !this.f0() || this.dK !== void 0 || this.cr >= 2) return;
		let e = this.orderedLoadGeneration, t = this.aj;
		this.dK = setTimeout(() => {
			this.dK = void 0;
			let n = Promise.resolve().then(() => {
				this.active && this.f0() && e === this.orderedLoadGeneration && this.aj === t && this.aj?.windowOperationGeneration === void 0 && (this.c7(), this.active && e === this.orderedLoadGeneration && !this.subscription.hasPendingTruncateReplacement && (this.aj = void 0, this.l = "none", this.loadFullSource()));
			});
			n.catch(() => {}), this.f_(n, !0, !0);
		}, 250 * 2 ** this.cr++);
	}
	fN(e, t, n, r, i = !1) {
		i && (this.orderedLoadGeneration++, this.pending = void 0), this.dy(), this.d5(r), n && (this.l = "none", this.F = void 0);
		try {
			e?.release({ error: t });
		} catch {}
		return n && this.aL && r === void 0 && this.eh(), t;
	}
	d5(e) {
		this.aj = { windowOperationGeneration: e }, this.S = void 0, this.bN = void 0, this.invalidateCursor(), this.dl = void 0;
	}
	bY(e, t, n, r = !1, i) {
		let a = t === "full-source" || t === "ordered-repair" || r, o;
		this.fT = !0, this.graphCheckedDuringRequest = void 0;
		let s = !1, c = this.getGraphInputRevision?.();
		try {
			try {
				e((e, t, n) => {
					o = {
						result: e,
						options: t,
						release: n
					};
				});
			} finally {
				this.fT = !1;
			}
			return o ? (s = !0, this.observe(o.result, o.release, t, n, o.options, r, c, i)) : void 0;
		} catch (e) {
			if (e instanceof Uf) throw e.cause;
			this.fT = !0;
			try {
				let t = this.fN(o, Ws(e), a, n, s);
				if (!s && a && this.aL) {
					let e = Promise.reject(t);
					e.catch(() => {}), this.f_(e, !0, !0);
				}
				throw t;
			} finally {
				this.fT = !1;
			}
		}
	}
};
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live/utils.js
function Gf(e) {
	let t = {};
	for (let n of O(e)) t[n.collection.id] = n.collection;
	return t;
}
function Kf(e) {
	return e.config.syncMode === "on-demand" || e.isReady();
}
function qf(e) {
	let t = e.from;
	if (t.type === "collectionRef") return t.collection;
	if (t.type === "descriptorRef") return p(t);
	if (t.type === "queryRef") return qf(t.query);
	if (t.type === "unionFrom") return qf({ from: t.sources[0] });
	if (t.type === "unionAll") return qf(t.queries[0]);
	throw Error(n(160));
}
function Jf(e) {
	return !(typeof e != "object" || !e || D(e) || o(e));
}
function Yf(e) {
	let t = typeof e.query == "function" ? Mu(e.query) : su(e.query);
	if (e.requireObjectResult && t.select && !Jf(t.select)) throw new jr();
	return t;
}
function Xf(e, t) {
	let n = [];
	for (let e of t) {
		let t = e.key;
		e.type === "insert" ? n.push([[t, e.value], 1]) : e.type === "update" ? (n.push([[t, e.previousValue], -1]), n.push([[t, e.value], 1])) : n.push([[t, e.value], -1]);
	}
	return n.length !== 0 && e.sendData(new z(n)), n.length;
}
function* Zf(e) {
	for (let t of e) t.type === "update" ? (yield {
		type: "delete",
		key: t.key,
		value: t.previousValue
	}, yield {
		type: "insert",
		key: t.key,
		value: t.value
	}) : yield t;
}
function Qf(e, t) {
	let n = [];
	for (let r of e) {
		let e = t.get(r.key);
		if (r.type === "insert") {
			if (e !== void 0) continue;
			t.set(r.key, r.value), n.push(r);
		} else if (r.type === "delete") {
			if (e === void 0) continue;
			t.delete(r.key), n.push({
				...r,
				value: e
			});
		} else t.set(r.key, r.value), n.push(e === void 0 ? {
			type: "insert",
			key: r.key,
			value: r.value
		} : {
			...r,
			previousValue: e
		});
	}
	return n;
}
function $f(e, t, n) {
	let { orderBy: r, limit: i, offset: a } = e, o = i !== void 0 && a !== void 0 ? i + a : i, s = r ? Eo(r, t) : void 0, c = !(s?.some((e) => (e.compareOptions.stringSort ?? n.stringSort) === "custom") ?? !1) && (s?.every((e) => {
		let t = e.expression;
		if (t.type !== "ref") return !1;
		let n = t.path;
		return Array.isArray(n) && n.length === 1;
	}) ?? !1);
	return {
		orderBy: c ? s : void 0,
		limit: c ? o : void 0
	};
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live/subset-demand-controller.js
var ep = class {
	constructor() {
		this.states = /* @__PURE__ */ new Map(), this.eO = /* @__PURE__ */ new Set(), this.valueIdentity = Hi();
	}
	setDemand(e, t, r) {
		let i = np(r, this.valueIdentity), a = this.states.get(t.id), o = a?.segments.some((e) => e.state === "failed" && ip(e.keys, i));
		if (a && rp(a.keys, i) && !o) return {
			changed: !1,
			empty: i.size === 0,
			ready: !0
		};
		let s = (a?.segments ?? []).filter((e) => e.state !== "failed" && ip(e.keys, i) && (!e.replaces || rp(e.keys, i))), c = (a?.segments ?? []).filter((e) => !s.includes(e)), l = a?.segments.some((e) => e.replaces && e.state === "failed" && rp(e.keys, i)), u = {
			keys: i,
			segments: s
		};
		this.states.set(t.id, u);
		for (let t of c) sp(e, t);
		if (this.states.get(t.id) !== u) return {
			changed: !1,
			empty: !1,
			ready: !0
		};
		if (i.size === 0) return this.states.delete(t.id), {
			changed: !0,
			empty: !0,
			ready: !0
		};
		let d = new Set(s.flatMap((e) => [...e.keys.keys()])), f = new Map([...i].filter(([e]) => !d.has(e))), p = a ? [...a.keys.keys()].some((e) => !i.has(e)) : !1, m = l || p && (f.size > 0 || s.length > 1), h = m ? i : f;
		if (h.size > 0) {
			let r = ap(t, h);
			m && (r.replaces = [...s]), s.push(r);
			let i = op(e, r, () => this.fB(t));
			if (this.states.get(t.id) !== u) return {
				changed: !1,
				empty: !1,
				ready: !0
			};
			if (!i) throw Error(n(159));
			m && (r.ready instanceof Promise ? r.ready.then(() => this.ep(e, t.id, r), () => {}) : this.ep(e, t.id, r));
		}
		let g = u.segments.filter((e) => e.state === "pending" && ip(e.keys, i)).map((e) => e.ready).filter((e) => e instanceof Promise);
		return {
			changed: !0,
			empty: !1,
			ready: g.length > 0 ? Promise.all(g) : !0
		};
	}
	clear() {
		for (let e of this.states.values()) for (let t of e.segments) t.abortController.abort();
		this.states.clear(), this.eO.clear(), this.valueIdentity = Hi();
	}
	hasPendingDemand(e) {
		return this.states.get(e)?.segments.some((e) => e.state === "pending") ?? !1;
	}
	ep(e, t, n) {
		let r = this.states.get(t);
		if (!r?.segments.includes(n) || !rp(n.keys, r.keys)) {
			sp(e, n);
			return;
		}
		let i = n.replaces ?? [];
		n.replaces = void 0, r.segments = [n];
		for (let t of i) sp(e, t);
	}
	fB(e) {}
};
function tp(e, t, n, r) {
	return (t[e]?.plans?.some((e) => r(e.id)) ?? !1) || n[e]?.status === "loadingSubset";
}
function np(e, t) {
	return new Map([...e].map((e) => [t.serializeEquality(e), e]));
}
function rp(e, t) {
	return e.size === t.size && [...e.keys()].every((e) => t.has(e));
}
function ip(e, t) {
	return [...e.keys()].some((e) => t.has(e));
}
function ap(e, t) {
	return {
		keys: t,
		where: co(new _(e.path), [...t.values()]),
		abortController: new AbortController(),
		ready: !0,
		state: "starting"
	};
}
function op(e, t, n) {
	let r = !1, i = e.requestSnapshot({
		where: t.where,
		signal: t.abortController.signal,
		trackLoadSubsetPromise: !1,
		onUnoptimized: n,
		onLoadSubsetResult: (e) => {
			r = !0, t.ready = e, t.state = e instanceof Promise ? "pending" : "settled";
		}
	});
	return t.ready instanceof Promise && t.ready.then(() => {
		t.state = "settled";
	}, () => {
		t.state = "failed";
	}), i && r;
}
function sp(e, t) {
	t.abortController.abort();
	try {
		e.releaseSnapshot(t.where);
	} catch {}
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live/collection-subscriber.js
var cp = class {
	constructor(e, t, n, r) {
		this.sourceId = e, this.alias = t, this.collection = n, this.fQ = r, this.az = /* @__PURE__ */ new Map(), this.fh = /* @__PURE__ */ new Map(), this.demand = new ep();
	}
	subscribe() {
		let e = this.fQ.sourceWhereClausesCache?.get(this.sourceId);
		return this.fi(e ? To(e, this.alias) : void 0);
	}
	c_() {
		return !this.fQ.hasSubscriberOrPreload();
	}
	fi(e) {
		let t = this.fQ.optimizableOrderByCollections[this.sourceId], n = (e) => {
			if (e instanceof Promise) {
				let t = e.catch(async (e) => {
					throw await Promise.resolve(), e;
				});
				this.fQ.trackSubsetLoadPromise(t);
			}
		}, r = (e) => {
			if (this.fQ.isLazySource(this.sourceId)) return;
			let t = e.subscription;
			if (e.status === "loadingSubset") this.d$(t);
			else {
				let e = this.az.get(t);
				e && (this.az.delete(t), e.resolve());
			}
		}, i = (e) => {
			this.fQ.recordSubsetError(e.error, !this.fQ.isLazySource(this.sourceId) && this.fQ.liveQueryCollection?.status === "loading");
		}, a;
		if (t) a = this.da(e, t, r, n, i);
		else {
			let t = (this.collection.config.syncMode !== "on-demand" || this.fQ.query.limit !== 0) && !this.fQ.isLazySource(this.sourceId);
			a = this.ek(e, t, r, n, i), this.cQ(a);
		}
		return !this.fQ.isLazySource(this.sourceId) && a.status === "loadingSubset" && this.d$(a), a;
	}
	cQ(e) {
		this.fQ.currentSyncState.unsubscribeCallbacks.add(() => {
			let t = this.az.get(e);
			t && (this.az.delete(e), t.resolve());
			try {
				this.demand.clear();
			} finally {
				e.unsubscribe();
			}
		});
	}
	setDemand(e, t, n) {
		let r;
		try {
			r = this.demand.setDemand(e, t, n);
		} catch (n) {
			if (!Object.is(e.lastError, n)) throw n;
			let r = this.fQ.liveQueryCollection?.status === "loading", i = this.fQ.beginDemand(t.id);
			if (this.fQ.failDemand(t.id, i, n), r) throw n;
			return;
		}
		if (!r.changed) return;
		if (r.empty) {
			this.fQ.retireDemand(t.id);
			return;
		}
		let i = this.fQ.beginDemand(t.id, r.ready instanceof Promise);
		if (r.ready instanceof Promise) {
			let n = (r) => void r.then(() => this.fQ.settleDemand(t.id, i), (r) => {
				let a = e.pendingTruncateReplacement;
				a ? n(a) : this.fQ.failDemand(t.id, i, r);
			});
			n(r.ready);
		} else this.fQ.settleDemand(t.id, i);
	}
	dV(e) {
		let t = Qf(Array.isArray(e) ? e : [...e], this.fh), n = this.fQ.currentSyncState.inputs[this.sourceId];
		Xf(n, t) > 0 && this.fQ.advanceGraphInputRevision(), this.fQ.scheduleGraphRun();
	}
	ek(e, t, n, r, i) {
		let a = (e) => {
			this.dV(e);
		}, o = $f(this.fQ.query, this.alias, this.fQ.queryCompareOptions);
		return this.collection.subscribeChanges(a, {
			...t && { includeInitialState: t },
			whereExpression: e,
			onStatusChange: n,
			onLoadSubsetError: i,
			deferAcquisition: this.c_(),
			truncateReplayPublication: this.ci(),
			orderBy: o.orderBy,
			limit: o.limit,
			onLoadSubsetResult: t ? r : void 0
		});
	}
	da(e, t, n, r, i) {
		let a = {}, o = this.collection.subscribeChanges((e) => {
			if (!a.current) return;
			let t = Array.isArray(e) ? e : [...e];
			this.bk?.onSourceChanges(t, this.fh, (e) => this.collection._hasOptimisticOverlay(e));
			let n = Zf(t);
			this.dV(n);
		}, {
			whereExpression: e,
			onStatusChange: n,
			onLoadSubsetError: i,
			deferAcquisition: this.c_(),
			truncateReplayPublication: this.ci(() => {
				let e = this.bk;
				this.fQ.trackOrderedLoadPromise(Promise.resolve().then(() => e?.loadFullSource()), !0);
			})
		});
		a.current = o, this.cQ(o);
		let s = this.collection.on("truncate", () => {
			this.bk?.resetCursor();
		}), c = this.collection.on("loadedSubsets:invalidated", () => {
			let e = this.bk;
			e && (e.revalidateLoadedCoverage(), this.fQ.scheduleGraphRunIfSyncRunCurrent(this.fQ.getSyncRunGeneration()));
		});
		return o.on("unsubscribed", () => {
			s(), c(), a.current = void 0, this.bk?.dispose(), this.bk = void 0;
		}), this.bk = new Wf(t, o, this.alias, (e, t, n) => {
			e instanceof Promise && this.fQ.trackOrderedLoadPromise(e, t && n && !o.hasPendingTruncateReplacement), r(e);
		}, () => this.fQ.liveQueryCollection?.status === "ready" && !this.fQ.hasActiveWindowOperation(), () => this.fQ.getGraphInputRevision(), () => t.joinedFilterSourceId !== void 0 && this.fQ.hasPendingJoinedWork(t.joinedFilterSourceId)), this.bk.start(), o;
	}
	ci(e) {
		let t = this.fQ.getSyncRunGeneration();
		return {
			start: () => {
				e?.();
			},
			succeed: () => {
				t === this.fQ.getSyncRunGeneration() && (this.bk?.settleFullSourceReplay(), this.fQ.scheduleGraphRunIfSyncRunCurrent(t));
			}
		};
	}
	loadMoreIfNeeded(e) {
		if ((!e.hasPendingTruncateReplacement || this.fQ.hasActiveWindowOperation()) && this.fQ.optimizableOrderByCollections[this.sourceId]) try {
			let e = this.bk?.loadMore(this.fQ.getActiveWindowOperationGeneration());
			e && this.fQ.trackSubsetLoadOperationPromise(e);
		} catch (t) {
			if (!Object.is(e.lastError, t)) throw t;
		}
	}
	d$(e) {
		if (this.az.has(e)) return;
		let t, n = new Promise((e) => {
			t = e;
		});
		this.az.set(e, { resolve: t }), this.fQ.trackSubsetLoadPromise(n);
	}
}, lp = /* @__PURE__ */ new Set([ea]), up = {
	prepare: () => {},
	publish: () => {},
	rollback: () => {}
}, dp = class {
	constructor(e, t, n) {
		this.parentId = e, this.f3 = t, this.pending = /* @__PURE__ */ new Map(), this.cx = /* @__PURE__ */ new Map(), this.activeBuckets = /* @__PURE__ */ new Map(), this.entries = /* @__PURE__ */ new Map(), this.bH = /* @__PURE__ */ new Map(), this.ds = /* @__PURE__ */ new WeakMap(), this.cleanedUp = !1;
		for (let e of t) e.rows.pipe(un((t) => {
			let r = t.getInner();
			n(r.length);
			for (let [[t, n], i] of r) this.fv(e.edgeId, t, n, i);
		})), e.activeBuckets.pipe(un((t) => {
			let r = t.getInner();
			n(r.length);
			for (let [[t], n] of r) this.fc(e.edgeId, t, n);
		}));
	}
	hasPendingChanges() {
		return this.pending.size > 0 || this.cx.size > 0;
	}
	flush() {
		if (!this.hasPendingChanges()) return up;
		let e = this.snapshot(), t = [], r = [];
		try {
			for (let n of this.f3) {
				let i = this.cx.get(n.edgeId), a = this.fq(n.edgeId);
				for (let [e, t] of i ?? []) t > 0 && !a.has(e) && (a.add(e), r.push(this.fr(n.edgeId, e)));
				let o = this.pending.get(n.edgeId);
				for (let [r, i] of o ?? []) {
					let o = this.entries.get(n.edgeId)?.get(r);
					if (!a.has(r) && !o) continue;
					let s = this.fr(n.edgeId, r), c = s.sync;
					if (c && i.size !== 0) {
						for (let e of i.values()) this.fF(s, e);
						this.gB(s, c, e, t, [...i.values()].map(({ value: [e] }) => e));
						for (let e of i.values()) this.fM(s, c, e, n.hasOrderBy);
						c.commit();
					}
				}
				for (let [e, t] of i ?? []) t >= 0 || (a.delete(e), this.fO(n.edgeId, e));
			}
		} catch (n) {
			throw this.abort(e, t), n;
		}
		let i = this.pending, a = this.cx;
		this.pending = /* @__PURE__ */ new Map(), this.cx = /* @__PURE__ */ new Map();
		let o = !1, s = !1, c = () => {
			if (!(o || s)) {
				s = !0;
				for (let e of r) e.sync?.markReady();
			}
		};
		return {
			prepare: c,
			publish: () => {
				if (o) return;
				c(), o = !0;
				let e;
				for (let n of t) try {
					n.publish();
				} catch (t) {
					e ??= { error: t };
				}
				if (this.bH.clear(), e) throw e.error;
			},
			rollback: () => {
				if (!(o || this.cleanedUp)) {
					if (o = !0, this.abort(e, t), this.hasPendingChanges()) throw Error(n(235));
					this.pending = i, this.cx = a;
				}
			}
		};
	}
	resolve(e) {
		return this.dn(e);
	}
	cleanup() {
		this.cleanedUp = !0;
		for (let e of this.entries.values()) for (let t of e.values()) t.dispose();
		this.entries.clear(), this.eR(), this.pending.clear(), this.cx.clear(), this.activeBuckets.clear();
	}
	fv(e, t, n, r) {
		let i = pl(pl(this.pending, e, () => /* @__PURE__ */ new Map()), t, () => /* @__PURE__ */ new Map()), [a] = n, o = I(a), s = i.get(o) ?? {
			deletes: 0,
			inserts: 0,
			value: n
		};
		r < 0 ? s.deletes += -r : r > 0 && (s.inserts += r, s.value = n), i.set(o, s);
	}
	gD(e) {
		return [...e.collection._state.acceptedSyncedEntries()].map(([t, n]) => ({
			key: t,
			value: n,
			order: e.order.get(n)
		}));
	}
	snapshot() {
		return {
			activeBuckets: new Map([...this.activeBuckets].map(([e, t]) => [e, new Set(t)])),
			entries: new Map([...this.entries].map(([e, t]) => [e, new Map(t)])),
			rows: /* @__PURE__ */ new Map(),
			written: /* @__PURE__ */ new Map()
		};
	}
	abort(e, t) {
		try {
			this.gE(e);
		} finally {
			this.bH.clear();
			for (let e of t) e.discard();
		}
	}
	gE(e) {
		let t = new Set([...e.entries.values()].flatMap((e) => [...e.values()])), n = new Set([...this.entries.values()].flatMap((e) => [...e.values()]));
		for (let [n, r] of e.rows) {
			if (!t.has(n)) continue;
			let i = n.sync;
			if (!i) continue;
			let a = new Map(r.map((e) => [e.key, e]));
			n.collection._state.hasOpenSyncTransaction() || i.begin();
			for (let t of e.written.get(n)) {
				let e = a.get(t);
				e ? (e.order !== void 0 && n.order.set(e.value, e.order), i.write({
					type: n.collection._state.getAcceptedSyncedRow(t) === void 0 ? "insert" : "update",
					value: e.value
				})) : n.collection._state.getAcceptedSyncedRow(t) !== void 0 && i.write({
					type: "delete",
					key: t
				});
			}
			i.commit();
		}
		this.entries.clear();
		for (let [t, n] of e.entries) this.entries.set(t, new Map(n));
		this.activeBuckets.clear();
		for (let [t, n] of e.activeBuckets) this.activeBuckets.set(t, new Set(n));
		this.ds = /* @__PURE__ */ new WeakMap();
		for (let e of n) t.has(e) || e.dispose();
	}
	fc(e, t, n) {
		let r = pl(this.cx, e, () => /* @__PURE__ */ new Map());
		r.set(t, (r.get(t) ?? 0) + n);
	}
	fq(e) {
		return pl(this.activeBuckets, e, () => /* @__PURE__ */ new Set());
	}
	gB(e, t, n, r, i) {
		n.rows.has(e) || (n.rows.set(e, this.gD(e)), n.written.set(e, /* @__PURE__ */ new Set()), r.push(e.collection._deferPublication()));
		for (let t of i) n.written.get(e).add(t);
		t.begin();
	}
	fO(e, t) {
		let r = this.entries.get(e), i = r?.get(t);
		if (i) {
			if (!i.collection._state.acceptedSyncedEntries().next().done) throw Error(n(240));
			r.delete(t), r.size === 0 && this.entries.delete(e), pl(this.bH, e, () => /* @__PURE__ */ new Map()).set(t, i);
		}
	}
	fr(e, t) {
		let r = pl(this.entries, e, () => /* @__PURE__ */ new Map()), i = r.get(t);
		if (i) return i;
		let a = /* @__PURE__ */ new WeakMap(), o, s = ll({
			id: `__bucket-facade:${this.parentId}:${e}:${t}`,
			getKey: (e) => {
				let t = e?.$key;
				if (typeof t != "string" && typeof t != "number") throw Error(n(146));
				return t;
			},
			compare: (e, t) => {
				let n = a.get(e), r = a.get(t);
				return n === r ? 0 : n === void 0 ? 1 : r === void 0 || n < r ? -1 : 1;
			},
			sync: {
				rowUpdateMode: "full",
				sync: (e) => (o = e, () => {
					o = void 0;
				})
			},
			startSync: !0,
			gcTime: 0
		}), c = s.cleanup.bind(s);
		s.cleanup = () => Promise.reject(Error(n(241)));
		let l = {
			collection: s,
			dispose: c,
			get sync() {
				return o;
			},
			order: a
		};
		return r.set(t, l), l;
	}
	fM(e, t, n, r) {
		let [i, a, o] = n.value, s = i;
		if (n.deletes > n.inserts) {
			t.write({
				type: "delete",
				key: s
			});
			return;
		}
		let c = e.collection._state.getAcceptedSyncedRow(s), l = c !== void 0;
		if (n.inserts === n.deletes && !l) return;
		let u = l && e.order.get(c) !== o, d = {
			...this.resolve(a),
			$key: s
		};
		o !== void 0 && e.order.set(d, o), t.write({
			type: l ? "update" : "insert",
			value: d
		}), r && u && t.collection._markLayoutChange();
	}
	fF(e, t) {
		let [n, r] = t.value;
		this.resolve(r), e.collection.getKeyFromItem({ $key: n });
	}
	dn(e) {
		if (typeof e != "object" || !e) return e;
		let t = this.ds.get(e);
		if (t !== void 0) return t;
		if (fp(e)) {
			let { edgeId: t, bucketKey: n } = e[Vl], r = this.entries.get(t)?.get(n)?.collection ?? this.bH.get(t)?.get(n)?.collection ?? this.fr(t, n).collection;
			return this.ds.set(e, r), r;
		}
		if (Array.isArray(e) || Xi(e)) {
			let t = da(e, (e) => fp(e) ? this.dn(e) : e, lp);
			return this.ds.set(e, t), t;
		}
		return e;
	}
	eR() {
		for (let e of this.bH.values()) for (let t of e.values()) t.dispose();
		this.bH.clear();
	}
};
function fp(e) {
	return typeof e == "object" && !!e && Vl in e;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live/graph-scheduler.js
function pp(e, t, n, r = Qc()?.id ?? ks()) {
	let i = [...t];
	if (r !== void 0) for (let e of i) e.scheduleGraphRun({ contextId: r });
	Ts.schedule({
		contextId: r,
		jobId: e,
		dependencies: i,
		run: n
	});
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live/collection-config-builder.js
var mp = 0, hp = class {
	constructor(e) {
		this.config = e, this.fz = /* @__PURE__ */ new WeakMap(), this.cN = /* @__PURE__ */ new WeakMap(), this.br = !1, this.bq = 0, this.b6 = !1, this.cv = !1, this.cc = /* @__PURE__ */ new Set(), this.bh = /* @__PURE__ */ new Set(), this.subscriptions = Nu(), this.lazySourcesCallbacks = Nu(), this.lazySources = /* @__PURE__ */ new Set(), this.aQ = /* @__PURE__ */ new Map(), this.fp = 0, this.aG = /* @__PURE__ */ new Set(), this.ba = !1, this.dq = !1, this.syncRunGeneration = 0, this.windowOperationGeneration = 0, this.optimizableOrderByCollections = Nu(), this.id = e.id || `live-query-${++mp}`, this.query = Yf({
			query: e.query,
			requireObjectResult: !0
		}), this.cV = this.query.orderBy?.length || this.query.singleResult ? {
			offset: this.query.offset ?? 0,
			limit: this.query.singleResult ? Math.min(this.query.limit ?? 1, 1) : this.query.limit ?? Infinity
		} : void 0, this.bD = this.cV, this.collections = Gf(this.query), this.ai = O(this.query), this.query.orderBy && this.query.orderBy.length > 0 && (this.compare = gp(this.cN)), this.queryCompareOptions = qf(this.query).compareOptions, this.compareOptions = this.config.defaultStringCollation ?? this.queryCompareOptions, this.ef();
	}
	hasSubscriberOrPreload() {
		return this.liveQueryCollection?._hasSubscriberOrPreload() ?? !0;
	}
	getSourceCollections() {
		return this.ai.map(({ collection: e }) => e);
	}
	hasJoins(e) {
		if (e.join && e.join.length > 0) return !0;
		if (e.from.type === "queryRef") {
			if (this.hasJoins(e.from.query)) return !0;
		} else if (e.from.type === "unionFrom") {
			for (let t of e.from.sources) if (t.type === "queryRef" && this.hasJoins(t.query)) return !0;
		} else if (e.from.type === "unionAll") {
			for (let t of e.from.queries) if (this.hasJoins(t)) return !0;
		}
		return !1;
	}
	getConfig() {
		let e = this;
		return {
			id: this.id,
			getKey: this.config.getKey || ((e) => this.fz.get(e) ?? e.$key),
			sync: this.fE(),
			compare: this.compare,
			defaultStringCollation: this.compareOptions,
			gcTime: this.config.gcTime ?? 5e3,
			schema: this.config.schema,
			onInsert: this.config.onInsert,
			onUpdate: this.config.onUpdate,
			onDelete: this.config.onDelete,
			startSync: this.config.startSync,
			singleResult: this.query.singleResult,
			utils: {
				get lastSubsetError() {
					return e.lastSubsetError;
				},
				setWindow: this.setWindow.bind(this),
				getWindow: this.getWindow.bind(this),
				[Ns]: {
					getBuilder: () => this,
					hasCustomGetKey: !!this.config.getKey,
					hasJoins: this.hasJoins(this.query),
					hasDistinct: !!this.query.distinct
				}
			}
		};
	}
	setWindow(e) {
		let t = this.f$;
		if (!t) throw new oi();
		if (this.query.singleResult) {
			if (!this.query.orderBy?.length && (e.offset ?? 0) !== 0) throw new oi();
			if ((e.limit ?? this.cV.limit) !== this.cV.limit) throw new si();
		}
		if (this.ag || this.br || Object.values(this.optimizableOrderByCollections).some((e) => e.isRequesting?.())) throw new ci();
		let r = this.L ?? this.bD ?? this.cV, i = {
			offset: e.offset ?? r?.offset,
			limit: e.limit ?? r?.limit
		}, a = this.eV();
		if (a) return a.then(async () => {
			let e = this.setWindow(i);
			e !== !0 && await e;
		});
		if (this.eF()) return Promise.reject(this.lastSubsetError ?? Error(n(147)));
		let o = ++this.windowOperationGeneration, s = this.liveQueryCollection?._sync.beginLoadSubsetOperation();
		for (let e of Object.values(this.optimizableOrderByCollections)) if (e.joinedFilterSourceId) for (let t of this.lazySourcesCallbacks[e.joinedFilterSourceId]?.plans ?? []) {
			let e = this.aQ.get(t.id)?.participant;
			e?.isPending() && this.trackSubsetLoadOperationPromise(e.promise);
		}
		let c = this.ag, l = {
			generation: o,
			failed: !1
		};
		this.ag = l, this.dq = !1, this.aG.size === 0 && (this.ba = !1);
		try {
			if (this.L = i, js(() => {
				t(i), this.bx?.();
			}), l.failed) throw l.error;
		} catch (e) {
			throw o === this.windowOperationGeneration && (this.dq = !0, this.L = this.bD), s?.cancel(), e;
		} finally {
			this.ag = c;
		}
		let u = s?.wait() ?? !0;
		return u === !0 ? (this.bD = i, !0) : u.then(() => {
			o === this.windowOperationGeneration && (this.bD = i);
		}, (e) => {
			throw o === this.windowOperationGeneration && (this.dq = !0, this.L = this.bD), e;
		});
	}
	getWindow() {
		let e = this.bD ?? this.cV;
		if (this.f$ && e) return {
			offset: e.offset ?? 0,
			limit: e.limit ?? 0
		};
	}
	isLazySource(e) {
		return this.lazySources.has(e);
	}
	beginDemand(e, t = !1) {
		let n = ++this.fp, r = this.aQ.get(e), i = t ? Gs() : void 0;
		return i && (i.promise.catch(() => {}), this.trackSubsetLoadOperationPromise(i.promise)), this.aQ.set(e, {
			generation: n,
			settled: !1,
			participant: i
		}), r?.participant?.resolve(), n;
	}
	settleDemand(e, t) {
		let n = this.aQ.get(e);
		if (n && n.generation === t && !n.settled) {
			n.settled = !0;
			try {
				this.bx?.(), n.participant?.resolve();
			} catch (e) {
				throw n.participant?.reject(e), e;
			}
		}
	}
	hasPendingJoinedWork(e) {
		return tp(e, this.lazySourcesCallbacks, this.subscriptions, (e) => this.aQ.get(e)?.settled === !1);
	}
	failDemand(e, t, r) {
		let i = this.aQ.get(e);
		if (!i || i.generation !== t) return;
		let a = this.recordSubsetError(r);
		i.participant?.reject(a), this.cI(n(228, {
			planId: e,
			cause: a.message
		}), a);
	}
	recordSubsetError(e, t = !1) {
		let r = Ws(e);
		return this.lastSubsetError = r, this.ag && (this.ag.failed = !0, this.ag.error = r, this.ba = !0), t && this.cI(n(229, { cause: r.message }), r), r;
	}
	trackSubsetLoadPromise(e) {
		this.liveQueryCollection._sync.trackLoadPromise(e);
	}
	trackSubsetLoadOperationPromise(e) {
		this.liveQueryCollection._sync.trackLoadSubsetOperationPromise(e);
	}
	hasActiveWindowOperation() {
		return this.ag !== void 0;
	}
	getActiveWindowOperationGeneration() {
		return this.ag?.generation;
	}
	scheduleGraphRunIfSyncRunCurrent(e) {
		e === this.syncRunGeneration && this.currentSyncConfig && this.currentSyncState && this.scheduleGraphRun();
	}
	trackOrderedLoadPromise(e, t = !1) {
		if (!t && !this.ag && this.liveQueryCollection?.status !== "loading" && this.aG.size === 0) return;
		let n = this.syncRunGeneration;
		this.aG.size === 0 && (this.ba = !1), this.aG.add(e);
		let r = (t) => {
			n === this.syncRunGeneration && this.aG.delete(e) && (t || (this.ba = !0), !this.ba && this.aG.size === 0 && this.scheduleGraphRun());
		};
		e.then(() => r(!0), () => r(!1));
	}
	retireDemand(e) {
		let t = this.aQ.get(e);
		this.aQ.delete(e), t?.participant?.resolve();
	}
	hasPendingSourceRecovery() {
		return Object.values(this.subscriptions).some((e) => e.hasPendingTruncateReplacement);
	}
	eV() {
		let e = Object.values(this.subscriptions).flatMap((e) => e.pendingTruncateReplacement ? [e.pendingTruncateReplacement] : []);
		return e.length > 0 ? Promise.all(e).then(() => void 0) : void 0;
	}
	eF() {
		return Object.values(this.subscriptions).some((e) => e.hasFailedTruncateReplacement);
	}
	getSyncRunGeneration() {
		return this.syncRunGeneration;
	}
	advanceGraphInputRevision() {
		this.bq++;
	}
	getGraphInputRevision() {
		return this.bq;
	}
	maybeRunGraph() {
		if (!this.br) {
			if (!this.currentSyncConfig || !this.currentSyncState) throw Error(n(148));
			this.br = !0;
			try {
				let e = this.syncRunGeneration, t = this.currentSyncConfig, { begin: r, commit: i } = t, a = this.currentSyncState, o = () => e === this.syncRunGeneration && this.currentSyncConfig === t && this.currentSyncState === a;
				if (this.b6) return;
				if (a.subscribedToAllCollections) {
					let e = !1;
					for (; a.graph.pendingWork() || !e;) {
						if (a.graph.pendingWork()) {
							try {
								a.graph.run();
							} catch (e) {
								throw o() && this.cI(n(212), e), e;
							}
							if (!o()) return;
						}
						if (this.e_?.(), !o()) return;
						e = !0;
					}
					if (a.flushPendingChanges?.(), !o()) return;
					a.messagesCount === 0 && (r(), i()), this.bS(t);
				}
			} finally {
				this.br = !1;
			}
		}
	}
	scheduleGraphRun(e) {
		if (!this.currentSyncConfig || !this.currentSyncState) throw Error(n(149));
		let t = this.syncRunGeneration;
		pp(this, this.bh, () => {
			t === this.syncRunGeneration && this.currentSyncConfig && this.currentSyncState && this.maybeRunGraph();
		}, e?.contextId);
	}
	fE() {
		return {
			rowUpdateMode: "full",
			sync: this.fP.bind(this)
		};
	}
	fP(e) {
		let t = ++this.syncRunGeneration;
		this.liveQueryCollection = e.collection, this.b6 = !1, this.cv = !1, this.cc.clear(), this.lastSubsetError = void 0, this.currentSyncConfig = e;
		let n = {
			messagesCount: 0,
			subscribedToAllCollections: !1,
			unsubscribeCallbacks: /* @__PURE__ */ new Set()
		}, r = !1, i = () => {
			if (!r) {
				r = !0, this.syncRunGeneration === t && this.syncRunGeneration++;
				try {
					Ms(n.unsubscribeCallbacks);
				} finally {
					n.unsubscribeCallbacks.clear(), this.fl();
				}
			}
		};
		try {
			let t = this.dC(e, n);
			this.currentSyncState = t;
			let r = e.collection.on("loadingSubset:change", (t) => {
				t.isLoadingSubset || (this.bS(e), this.hasPendingSourceRecovery() && this.bx?.());
			});
			n.unsubscribeCallbacks.add(r), this.e_ = this.ev(e, t), this.bx = () => this.scheduleGraphRun(), this.scheduleGraphRun();
		} catch (e) {
			try {
				i();
			} catch {}
			throw e;
		}
		return i;
	}
	fl() {
		this.windowOperationGeneration++, this.currentSyncConfig = void 0, this.currentSyncState = void 0, this.bx = void 0, this.e_ = void 0, this.L = void 0, this.bD = this.cV, this.b6 = !1, this.cv = !1, this.cc.clear(), this.d3 = void 0, this.cY = void 0, this.dL = void 0, this.sourceWhereClausesCache = void 0, this.dg = void 0, this.lazySources.clear();
		for (let e of this.aQ.values()) e.participant?.reject(new ni());
		this.aQ.clear(), this.aG.clear(), this.ba = !1, this.dq = !1, this.optimizableOrderByCollections = Nu(), this.lazySourcesCallbacks = Nu(), Object.keys(this.subscriptions).forEach((e) => delete this.subscriptions[e]);
	}
	ef() {
		this.d3 = new ft();
		let e = Nu();
		for (let t of this.ai) e[t.sourceId] = this.d3.newInput();
		this.cY = e;
		let t = rf(this.query, this.cY, this.collections, this.subscriptions, this.lazySourcesCallbacks, this.lazySources, this.optimizableOrderByCollections, (e) => {
			this.f$ = e, this.L && e(this.L);
		}), n = Ul(t, this.config.getKey, this.hasJoins(this.query));
		this.dL = n.pipeline, this.sourceWhereClausesCache = t.sourceWhereClauses, this.dg = n.facades;
		let r = this.ai.map((e) => e.sourceId).filter((e) => !Object.hasOwn(this.cY, e));
		if (r.length > 0) throw new ai(r);
	}
	eA() {
		return this.d3 && this.cY && this.dL || this.ef(), {
			graph: this.d3,
			inputs: this.cY,
			pipeline: this.dL
		};
	}
	dC(e, t) {
		let { begin: r, commit: i } = e, { graph: a, inputs: o, pipeline: s } = this.eA(), c = /* @__PURE__ */ new Map();
		s.pipe(un((e) => {
			let n = e.getInner();
			t.messagesCount += n.length, n.reduce(_p, c);
		}));
		let l = this.dg, u = l ? new dp(this.id, l, (e) => {
			t.messagesCount += e;
		}) : void 0;
		return u && t.unsubscribeCallbacks.add(() => u.cleanup()), t.flushPendingChanges = () => {
			let t = c.size > 0, a = u?.hasPendingChanges() ?? !1;
			if (!t && !a || this.dq || this.ba || this.hasPendingSourceRecovery() || this.aG.size > 0 || Object.values(this.optimizableOrderByCollections).some((e) => e.joinedFilterSourceId !== void 0 && this.hasPendingJoinedWork(e.joinedFilterSourceId))) return;
			for (let [e, { inserts: t, deletes: r }] of c) if (Math.abs(t - r) > 1) throw Error(n(150, {
				key: e,
				change: t - r
			}));
			let o, s;
			try {
				o = u?.flush(), s = t ? e.collection._deferPublication() : void 0;
				let n = u ? new Map([...c].map(([e, t]) => {
					let n = {
						...t,
						value: u.resolve(t.value)
					};
					return t.previousValue !== void 0 && (n.previousValue = u.resolve(t.previousValue)), [e, n];
				})) : c;
				if (o?.prepare(), t) {
					r();
					let t;
					n.forEach(this.fG.bind(this, e, (n) => (t ??= e.collection._state.createSyncedKeyLookup(), t(n)))), vp(n) && yp(e.collection), i();
				}
			} catch (e) {
				throw s?.discard(), o?.rollback(), e;
			}
			c = /* @__PURE__ */ new Map();
			let l;
			for (let e of [s?.publish, o?.publish]) if (e) try {
				e();
			} catch (e) {
				l ??= e;
			}
			if (l !== void 0) throw l;
		}, a.finalize(), t.graph = a, t.inputs = o, t.pipeline = s, t;
	}
	fG(e, t, r, i) {
		let { write: a, collection: o } = e, { deletes: s, inserts: c, value: l, orderByIndex: u } = r;
		if (this.fz.set(l, i), u !== void 0 && this.cN.set(l, u), c && s === 0) a({
			value: l,
			type: "insert"
		});
		else if (c > s || c === s && t(o.getKeyFromItem(l))) a({
			value: l,
			type: "update"
		});
		else if (s > 0) a({
			value: l,
			type: "delete"
		});
		else throw Error(n(151));
	}
	dj(e, t, r, i) {
		let { status: a } = i;
		a === "error" ? (this.cc.add(t), this.e8(n(172, { collectionId: r }))) : a === "cleaned-up" ? this.di(r) : (a === "ready" && (this.cc.delete(t) && !this.cv && this.cc.size === 0 && (this.b6 = !1, this.bx?.()), Object.values(this.optimizableOrderByCollections).some((e) => e.joinedFilterSourceId === t) && this.bx?.()), this.bS(e));
	}
	di(e) {
		if (this.cv) return;
		let t = Error(n(152, {
			collectionId: e,
			id: this.id
		}));
		return this.cI(t.message, t), t;
	}
	bS(e) {
		let { markReady: t } = e;
		if (this.b6) return;
		let n = this.currentSyncState?.subscribedToAllCollections, r = this.eD(), i = [...this.aQ.values()].every((e) => e.settled), a = this.liveQueryCollection?.isLoadingSubset;
		n && r && i && !a && t();
	}
	cI(e, t) {
		this.cv = !0, this.e8(e, t);
	}
	e8(e, t) {
		this.b6 = !0, console.error(e), this.liveQueryCollection?._lifecycle.markError(t ?? Error(e));
	}
	eD() {
		return this.ai.every(({ collection: e }) => Kf(e));
	}
	ev(e, t) {
		if (this.ai.length === 0) throw Error(n(153, { id: this.id }));
		let r = this.ai.map((n) => {
			let { sourceId: r, alias: i, collection: a } = n, o = a.id, s = Ls(a);
			s && s !== this && this.bh.add(s);
			let c = new cp(r, i, a, this), l = a.on("status:change", (t) => {
				this.dj(e, r, o, t);
			}), u, d = a._onCleanupStart(() => {
				u = this.di(o);
			});
			if (u) throw d(), l(), u;
			t.unsubscribeCallbacks.add(l), t.unsubscribeCallbacks.add(d), a.status === "error" && this.dj(e, r, o, {
				type: "status:change",
				collection: a,
				status: "error",
				previousStatus: "error"
			});
			let f = c.subscribe();
			this.subscriptions[r] = f, f.isDeferringAcquisition() && (t.unsubscribeCallbacks.add(this.liveQueryCollection._onFirstSubscriberOrPreload(() => f.resumeDeferredAcquisition())), this.hasSubscriberOrPreload() && f.resumeDeferredAcquisition());
			let p = this.lazySourcesCallbacks[r];
			if (p) {
				p.setDemand = (e, t) => c.setDemand(f, e, t);
				for (let e of p.plans ?? []) e.initialKeys.size > 0 && !this.L?.offset && p.setDemand(e, e.initialKeys);
			}
			return c.loadMoreIfNeeded.bind(c, f);
		});
		return t.subscribedToAllCollections = !0, () => Ms(r);
	}
};
function gp(e) {
	return (t, n) => {
		let r = e.get(t), i = e.get(n);
		return r && i ? r < i ? -1 : +(r > i) : 0;
	};
}
function _p(e, [[t, n], r]) {
	let [i, a] = n, o = e.get(t) || {
		deletes: 0,
		inserts: 0,
		value: i,
		orderByIndex: a
	};
	return r < 0 ? (o.deletes === 0 && (o.previousValue = i, o.previousOrderByIndex = a), o.deletes += Math.abs(r)) : r > 0 && (o.inserts += r, o.value = i, a !== void 0 && (o.orderByIndex = a)), e.set(t, o), e;
}
function vp(e) {
	for (let t of e.values()) if (t.inserts > 0 && t.deletes > 0 && t.previousValue !== void 0 && W(t.previousValue, t.value) && t.orderByIndex !== t.previousOrderByIndex) return !0;
	return !1;
}
function yp(e) {
	e._markLayoutChange();
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live-query-collection.js
function bp(e) {
	return new hp(e).getConfig();
}
function xp(e) {
	if (typeof e == "function") return Sp(bp({ query: e }));
	{
		let t = e, n = bp(t);
		return t.utils && Object.defineProperties(n.utils, Object.getOwnPropertyDescriptors(t.utils)), Sp(n);
	}
}
function Sp(e) {
	let t = ll(e), n = Fs(e);
	return n && Is(t, n), t;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/array-utils.js
function Cp(e, t) {
	return le(t, e);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/btree.js
var wp = class {
	constructor(e, t) {
		this.c0 = new Tp(), this._size = 0, this._maxNodeSize = t >= 4 ? Math.min(t, 256) : 32, this._compare = e;
	}
	get size() {
		return this._size;
	}
	clear() {
		this.c0 = new Tp(), this._size = 0;
	}
	get(e, t) {
		return this.c0.get(e, t, this);
	}
	has(e) {
		let t = {};
		return this.get(e, t) !== t;
	}
	set(e, t) {
		let n = this.c0.set(e, t, this);
		return n === !0 || n === !1 ? n : (this.c0 = new Ep([this.c0, n]), !0);
	}
	delete(e) {
		let t = this._size, n = this.c0;
		for (n.forRange(e, e, !0, !0, this); n.keys.length <= 1 && !n.isLeaf;) this.c0 = n = n.keys.length === 0 ? new Tp() : n.children[0];
		return this._size !== t;
	}
	minKey() {
		return this.c0.minKey();
	}
	maxKey() {
		return this.c0.maxKey();
	}
	nextHigherPair(e) {
		return e === void 0 ? this.c0.minPair() : this.c0.getPairOrNextHigher(e, this._compare);
	}
	nextLowerPair(e) {
		return e === void 0 ? this.c0.maxPair() : this.c0.getPairOrNextLower(e, this._compare);
	}
	forRange(e, t, n, r) {
		this.c0.forRange(e, t, n, !1, this, r);
	}
}, Tp = class e {
	get isLeaf() {
		return this.children === void 0;
	}
	constructor(e = [], t = []) {
		this.keys = e, this.values = t;
	}
	maxKey() {
		return this.keys[this.keys.length - 1];
	}
	indexOf(e, t, n) {
		let r = this.keys, i = 0, a = r.length, o = a >> 1;
		for (; i < a;) {
			let t = n(r[o], e);
			if (t < 0) i = o + 1;
			else if (t > 0) a = o;
			else return o;
			o = i + a >> 1;
		}
		return o ^ t;
	}
	minKey() {
		return this.keys[0];
	}
	pairAt(e) {
		return e >= 0 && e < this.keys.length ? [this.keys[e], this.values[e]] : void 0;
	}
	minPair() {
		return this.pairAt(0);
	}
	maxPair() {
		return this.pairAt(this.keys.length - 1);
	}
	get(e, t, n) {
		let r = this.indexOf(e, -1, n._compare);
		return r < 0 ? t : this.values[r];
	}
	getPairOrNextLower(e, t) {
		let n = this.indexOf(e, -1, t);
		return this.pairAt(n < 0 ? ~n - 1 : n - 1);
	}
	getPairOrNextHigher(e, t) {
		let n = this.indexOf(e, -1, t);
		return this.pairAt(n < 0 ? ~n : n + 1);
	}
	set(e, t, n) {
		let r = this.indexOf(e, -1, n._compare);
		if (r >= 0) return this.keys[r] = e, this.values[r] = t, !1;
		r = ~r, n._size++;
		let i = this, a;
		return this.keys.length >= n._maxNodeSize && (a = this.splitOffRightSide(), r > this.keys.length && (r -= this.keys.length, i = a)), i.keys.splice(r, 0, e), i.values.splice(r, 0, t), a ?? !0;
	}
	takeFromRight(e) {
		this.values.push(e.values.shift()), this.keys.push(e.keys.shift());
	}
	splitOffRightSide() {
		let t = this.keys.length >> 1;
		return new e(this.keys.splice(t), this.values.splice(t));
	}
	forRange(e, t, n, r, i, a) {
		let o = i._compare, s, c;
		if (t === e) {
			if (!n || (c = (s = this.indexOf(e, -1, o)) + 1, s < 0)) return;
		} else s = this.indexOf(e, 0, o), c = this.indexOf(t, -1, o), c < 0 ? c = ~c : n && c++;
		if (r) c > s && (this.keys.splice(s, c - s), this.values.splice(s, c - s), i._size -= c - s);
		else for (let e = s; e < c; e++) a(this.keys[e], this.values[e]);
	}
	mergeSibling(e, t) {
		this.keys.push.apply(this.keys, e.keys), this.values.push.apply(this.values, e.values);
	}
}, Ep = class e extends Tp {
	constructor(e, t) {
		super(t ?? e.map((e) => e.maxKey())), this.children = e;
	}
	minKey() {
		return this.children[0].minKey();
	}
	minPair() {
		return this.children[0].minPair();
	}
	maxPair() {
		return this.children[this.children.length - 1].maxPair();
	}
	get(e, t, n) {
		let r = this.indexOf(e, 0, n._compare), i = this.children;
		return r < i.length ? i[r].get(e, t, n) : t;
	}
	getPairOrNextLower(e, t) {
		let n = this.indexOf(e, 0, t), r = this.children;
		return n >= r.length ? this.maxPair() : r[n].getPairOrNextLower(e, t) ?? (n > 0 ? r[n - 1].maxPair() : void 0);
	}
	getPairOrNextHigher(e, t) {
		let n = this.indexOf(e, 0, t), r = this.children;
		if (!(n >= r.length)) return r[n].getPairOrNextHigher(e, t) ?? r[n + 1]?.minPair();
	}
	set(e, t, n) {
		let r = this.children, i = n._maxNodeSize, a = n._compare, o = Math.min(this.indexOf(e, 0, a), r.length - 1), s = r[o];
		if (s.keys.length >= i) {
			let t;
			o > 0 && (t = r[o - 1]).keys.length < i && a(s.keys[0], e) < 0 && (t.takeFromRight(s), this.keys[o - 1] = t.maxKey());
		}
		let c = s.set(e, t, n);
		if (c === !1) return !1;
		if (this.keys[o] = s.maxKey(), c === !0) return !0;
		let l = this, u;
		return this.keys.length >= i && (u = this.splitOffRightSide(), o + 1 >= this.keys.length && (l = u, o -= this.keys.length)), l.children.splice(o + 1, 0, c), l.keys.splice(o + 1, 0, c.maxKey()), u ?? !0;
	}
	splitOffRightSide() {
		let t = this.children.length >> 1;
		return new e(this.children.splice(t), this.keys.splice(t));
	}
	takeFromRight(e) {
		this.keys.push(e.keys.shift()), this.children.push(e.children.shift());
	}
	forRange(e, t, n, r, i, a) {
		let o = i._compare, s = this.keys, c = this.children, l = this.indexOf(e, 0, o), u = l, d = Math.min(t === e ? l : this.indexOf(t, 0, o), s.length - 1);
		for (; u <= d; u++) c[u].forRange(e, t, n, r, i, a), r && (s[u] = c[u].maxKey());
		if (r) {
			let e = i._maxNodeSize >> 1;
			for (l > 0 && l--, u = d; u >= l; u--) c[u].keys.length <= e && (c[u].keys.length === 0 ? (s.splice(u, 1), c.splice(u, 1)) : this.tryMerge(u, i._maxNodeSize));
		}
	}
	tryMerge(e, t) {
		let n = this.children;
		e >= 0 && e + 1 < n.length && n[e].keys.length + n[e + 1].keys.length <= t && (n[e].mergeSibling(n[e + 1], t), n.splice(e + 1, 1), this.keys.splice(e + 1, 1), this.keys[e] = n[e].maxKey());
	}
	mergeSibling(e, t) {
		let n = this.keys.length;
		this.keys.push.apply(this.keys, e.keys);
		let r = e.children;
		this.children.push.apply(this.children, r), this.tryMerge(n - 1, t);
	}
}, Dp = class extends fc {
	constructor() {
		super(...arguments), this.ay = new wp((e, t) => this.compareFn(e.value, t.value)), this.ax = /* @__PURE__ */ new Map(), this.aK = /* @__PURE__ */ new Set();
	}
	add(e, t) {
		let n = this.evaluateAddedValue(e, t), r = q(n);
		this.dF(e, n, r), this.addRangeValue(n), this.aK.add(e);
	}
	dF(e, t, n) {
		let r = this.ax.get(n);
		if (r) {
			r.keys.set(e, t), r.buckets?.get(n).add(e);
			return;
		}
		let i = this.ay.get({ value: t });
		if (i) i.buckets ??= /* @__PURE__ */ new Map([[q(i.value), new Set(i.keys.keys())]]), i.buckets.set(n, /* @__PURE__ */ new Set([e])), i.keys.set(e, t), this.ax.set(n, i);
		else {
			let r = {
				value: t,
				keys: /* @__PURE__ */ new Map([[e, t]]),
				representativeKey: e
			};
			this.ay.set(r, r), this.ax.set(n, r);
		}
	}
	remove(e, t) {
		let n;
		try {
			n = this.evaluateIndexExpression(t);
		} catch (t) {
			hc(e, t);
			return;
		}
		let r = q(n);
		this.cf(e, r), this.removeRangeValue(n), this.aK.delete(e);
	}
	cf(e, t) {
		let n = this.ax.get(t);
		if (!n?.keys.has(e)) return;
		let r = n.buckets?.get(t);
		if ((!n.buckets || r?.has(e)) && (n.keys.size === 1 && this.ay.delete(n), r?.delete(e), n.keys.delete(e), (r?.size === 0 || n.keys.size === 0) && (this.ax.delete(t), n.buckets?.delete(t)), n.keys.size && n.representativeKey === e)) {
			let [e, t] = (n.nextRepresentative ??= n.keys.entries()).next().value;
			n.representativeKey = e, n.value = t;
		}
	}
	update(e, t, n) {
		let r, i;
		try {
			r = this.evaluateIndexExpression(t), i = this.evaluateIndexExpression(n);
		} catch {
			this.remove(e, t), this.add(e, n);
			return;
		}
		let a = q(r), o = q(i), s = this.ax.get(o), c = s?.buckets ? s.buckets.get(o)?.has(e) : s?.keys.has(e);
		Pi(a, o) && c ? (s.keys.set(e, i), s.representativeKey === e && (s.value = i), this.removeRangeValue(r), this.addRangeValue(i)) : (this.cf(e, a), this.removeRangeValue(r), this.dF(e, i, o), this.addRangeValue(i), this.aK.add(e));
	}
	build(e) {
		this.clear();
		for (let [t, n] of e) this.add(t, n);
	}
	clear() {
		this.ay.clear(), this.ax.clear(), this.aK.clear(), this.clearRangeValues();
	}
	lookup(e, t) {
		let r = this.lookupSupportedOperation(e, t);
		if (r !== void 0) return r;
		throw Error(n(101, { operation: e }));
	}
	get keyCount() {
		return this.aK.size;
	}
	equalityLookup(e) {
		return new Set(this.exactBucketKeys(e));
	}
	exactBucketKeys(e) {
		let t = q(e), n = this.ax.get(t);
		return n?.buckets ? n.buckets.get(t) : n?.keys.keys();
	}
	rangeQuery(e = {}) {
		let t = /* @__PURE__ */ new Set();
		if (this.ay.size === 0) return t;
		let { from: n, to: r, fromInclusive: i = !0, toInclusive: a = !0 } = e, o = "from" in e ? { value: n } : this.ay.minKey(), s = "to" in e ? { value: r } : this.ay.maxKey();
		return this.ay.forRange(o, s, !("to" in e) || a, (r, a) => {
			if (!("from" in e && !i && this.compareFn(r.value, n) === 0)) for (let e of a.keys.keys()) t.add(e);
		}), t;
	}
	eb(e, t, n, r) {
		let i = [], a = r ? this.ay.nextLowerPair(t) : this.ay.nextHigherPair(t);
		for (; a && i.length < e;) {
			for (let t of [...a[1].keys.keys()].sort(r ? Cp : le)) if ((n?.(t) ?? !0) && i.push(t), i.length >= e) break;
			if (i.length >= e) break;
			a = r ? this.ay.nextLowerPair(a[0]) : this.ay.nextHigherPair(a[0]);
		}
		return i;
	}
	take(e, t, n) {
		return this.eb(e, { value: t }, n, !1);
	}
	takeFromStart(e, t) {
		return this.eb(e, void 0, t, !1);
	}
	takeReversed(e, t, n) {
		return this.eb(e, { value: t }, n, !0);
	}
	takeReversedFromEnd(e, t) {
		return this.eb(e, void 0, t, !0);
	}
};
dc.set(Dp, "BTreeIndex");
// src/list.ts
function Op(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let t of Array.from(e.children)) {
		let e = t.dataset.key;
		e ? i.set(e, {
			el: t,
			row: void 0
		}) : t.remove();
	}
	let a = !1, o = () => {
		if (a = !1, !t.isReady()) return;
		let o = performance.now(), s = t.toArray, c = /* @__PURE__ */ new Set(), l = 0, u = e.firstChild;
		for (let t of s) {
			let r = n.key(t);
			c.add(r);
			let a = i.get(r);
			a || (a = {
				el: n.create(t),
				row: void 0
			}, a.el.dataset.key = r, i.set(r, a)), a.row !== t && (n.update(a.el, t, a.row), a.row = t, l++), a.el === u ? u = u.nextSibling : (e.insertBefore(a.el, u), l++);
		}
		for (let [e, t] of i) c.has(e) || (t.el.remove(), i.delete(e), l++);
		r?.({
			rows: s.length,
			ms: performance.now() - o,
			changed: l
		});
	}, s = () => {
		a || (a = !0, queueMicrotask(o));
	}, c = t.subscribeChanges(s);
	return t.onFirstReady(s), o(), () => c.unsubscribe();
}
// src/apps/issues.ts
var kp = 200, Ap = [
	"👍",
	"🎉",
	"❤️",
	"👀",
	"🚀"
];
function jp(e, t) {
	let n = e.get("issues"), r = e.get("users"), i = e.get("labels"), a = e.get("issueLabels"), o = e.get("comments"), s = e.get("emojis"), c = new Map(Object.entries(t.descriptions)), l = (e) => document.getElementById(e), u = l("app"), d = (e) => (e ? r.get(e)?.login : void 0) ?? "?", f = (e) => t.user.crew || e.creatorId === t.user.id, p = t.mode === "local" ? "?mode=local" : "", m = {
		open: "open",
		creator: "",
		assignee: "",
		label: "",
		text: "",
		sort: "modified"
	}, h = !1, g = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new Map(), v = (e, t, n, r) => {
		let i = e.get(t);
		i || e.set(t, i = /* @__PURE__ */ new Set()), r ? i.add(n) : i.delete(n);
	};
	a.subscribeChanges((e) => {
		for (let t of e) {
			let e = t.type !== "delete";
			v(g, t.value.issueId, t.value.labelId, e), v(_, t.value.labelId, t.value.issueId, e);
		}
		h && m.label && E();
	}, { includeInitialState: !0 });
	let y = (e) => [...g.get(e) ?? []].map((e) => i.get(e)?.name).filter(Boolean);
	function b(e) {
		let t = e.label ? [..._.get(e.label) ?? []] : null;
		return xp({
			startSync: !0,
			query: (i) => i.from({ issue: n }).where(({ issue: n }) => {
				let r = [];
				return e.open !== "all" && r.push($a(n.open, e.open === "open")), e.creator && r.push($a(n.creatorId, e.creator)), e.assignee && r.push($a(n.assigneeId, e.assignee)), t && r.push(co(n.id, t)), e.text && r.push(lo(n.title, `%${e.text}%`)), r.length === 0 ? $a(1, 1) : r.length === 1 ? r[0] : ro(r[0], r[1], ...r.slice(2));
			}).orderBy(({ issue: t }) => e.sort === "created" ? t.created : t.modified, "desc").limit(kp).leftJoin({ creator: r }, ({ issue: e, creator: t }) => $a(e.creatorId, t.id)).leftJoin({ assignee: r }, ({ issue: e, assignee: t }) => $a(e.assigneeId, t.id)).select(({ issue: e, creator: t, assignee: n }) => ({
				id: e.id,
				shortId: e.shortId,
				title: e.title,
				open: e.open,
				modified: e.modified,
				created: e.created,
				creator: t.login,
				assignee: n.login
			}))
		});
	}
	let x = l("issues"), S = null, C = null, w = 0, T = [];
	function E() {
		C?.(), S?.cleanup(), w = performance.now(), S = b(m);
		let e = !0;
		C = Op(x, S, {
			key: (e) => e.id,
			create: () => {
				let e = document.createElement("li");
				return e.innerHTML = "<button class=\"toggle\" data-action=\"toggle\"></button><a class=\"sid mono\" data-nav=\"issue\"></a><a class=\"title\" data-nav=\"issue\"></a><span class=\"labels\"></span><span class=\"who muted\"></span>", e;
			},
			update: (e, t) => {
				let [n, r, i, a, o] = e.children;
				n.textContent = t.open ? "○" : "●";
				let s = `/issue/${t.shortId}${p}`;
				r.href = s, i.href = s, r.textContent = String(t.shortId), i.textContent = t.title, a.replaceChildren(...y(t.id).map((e) => Object.assign(document.createElement("span"), { textContent: e }))), o.textContent = t.assignee ? `${t.creator ?? "?"} → ${t.assignee}` : t.creator ?? "?";
			}
		}, ({ rows: t, ms: r, changed: i }) => {
			if (T = S.toArray, l("count").textContent = `${t}${t === kp ? "+" : ""} of ${n.size} issues`, e || i > 0) {
				let t = e ? ` ${(performance.now() - w).toFixed(1)}ms ·` : "";
				l("timing").textContent = `${e ? "filter→dom" : "update"}${t} dom ${r.toFixed(1)}ms`;
			}
			e = !1;
		});
	}
	let D = (e, t) => {
		let n = e.value;
		e.replaceChildren(e.options[0], ...t.map((e) => new Option(e.name, e.id))), e.value = n;
	}, ee = (e, t) => e.name.localeCompare(t.name);
	r.subscribeChanges(() => {
		let e = r.toArray.map((e) => ({
			id: e.id,
			name: e.login
		})).sort(ee);
		D(l("f-creator"), e), D(l("f-assignee"), e);
	}, { includeInitialState: !0 }), i.subscribeChanges(() => D(l("f-label"), i.toArray.map((e) => ({
		id: e.id,
		name: e.name
	})).sort(ee)), { includeInitialState: !0 });
	let O = (e, t, n = "change") => l(e).addEventListener(n, (e) => {
		m[t] = e.target.value, E();
	});
	O("f-open", "open"), O("f-creator", "creator"), O("f-assignee", "assignee"), O("f-label", "label"), O("f-sort", "sort"), O("f-text", "text", "input"), x.addEventListener("click", (e) => {
		let t = e.target.closest("[data-action=toggle]");
		t && k(t.closest("li").dataset.key);
	});
	function k(e) {
		let t = n.get(e);
		if (t) {
			if (!f(t)) return Np("Only crew or the creator can edit");
			Mp(n.update(e, (e) => void (e.open = !e.open)));
		}
	}
	let te = l("detail-view"), A = null;
	function ne(e) {
		A?.();
		let l = [];
		A = () => l.forEach((e) => typeof e == "function" ? e() : e.unsubscribe()), te.innerHTML = `
      <nav class="crumbs">
        <a href="/issues${p}" data-nav="list">← Issues</a>
        <span class="mono muted" data-f="sid"></span>
        <span class="spacer"></span>
        <span class="muted"><kbd>j</kbd>/<kbd>k</kbd> next/prev · <kbd>esc</kbd> back</span>
      </nav>
      <h1 class="d-title" data-f="title"></h1>
      <div class="d-meta">
        <button data-a="toggle"></button>
        <span class="muted" data-f="by"></span>
        <label class="muted">Assignee <select data-a="assignee"><option value="">Unassigned</option></select></label>
        <span class="d-labels" data-f="labels"></span>
        <span class="muted mono" data-f="vis"></span>
      </div>
      <div class="reactions" data-f="issue-emojis"></div>
      <div class="d-desc" data-f="desc"></div>
      <h2>Comments <span class="muted" data-f="ccount"></span></h2>
      <ul class="comments" data-f="comments"></ul>
      <form class="new-comment" data-a="comment">
        <textarea placeholder="Leave a comment… (⌘↵ to send)"></textarea>
        <button>Comment</button>
      </form>`;
		let u = (e) => te.querySelector(`[data-f="${e}"]`), m = (e) => te.querySelector(`[data-a="${e}"]`), h = m("assignee");
		for (let e of r.toArray.slice().sort((e, t) => e.login.localeCompare(t.login))) h.add(new Option(e.login, e.id));
		let _ = () => {
			let t = n.get(e);
			if (!t) {
				u("title").textContent = "Issue not found (or not visible to you)";
				return;
			}
			document.title = `#${t.shortId} ${t.title} · zbugs`, u("sid").textContent = `#${t.shortId}`;
			let r = u("title");
			document.activeElement !== r && (r.textContent = t.title), r.contentEditable = String(f(t)), m("toggle").textContent = t.open ? "Close issue" : "Reopen issue", u("by").textContent = `${t.open ? "Open" : "Closed"} · by ${d(t.creatorId)} · ${new Date(t.created).toLocaleDateString()}`, h.value = t.assigneeId ?? "", h.disabled = !f(t), u("vis").textContent = t.visibility === "internal" ? "internal" : "";
			let a = g.get(e) ?? /* @__PURE__ */ new Set();
			u("labels").replaceChildren(...i.toArray.slice().sort(ee).filter((e) => a.has(e.id) || f(t)).map((e) => {
				let n = Object.assign(document.createElement("button"), {
					className: `chip${a.has(e.id) ? " on" : ""}`,
					textContent: e.name
				});
				return n.dataset.label = e.id, n.disabled = !f(t), n;
			}));
			let o = c.get(e);
			u("desc").textContent = o ?? "Loading description…", o === void 0 && j(e).then(() => _());
		}, v = xp({
			startSync: !0,
			query: (t) => t.from({ c: o }).where(({ c: t }) => $a(t.issueId, e)).orderBy(({ c: e }) => e.created, "asc")
		});
		l.push(() => v.cleanup()), l.push(Op(u("comments"), v, {
			key: (e) => e.id,
			create: () => {
				let e = document.createElement("li");
				return e.innerHTML = "<div class=\"c-head\"><strong></strong><span class=\"muted\"></span></div><div class=\"c-body\"></div><div class=\"reactions\"></div>", e;
			},
			update: (e, t) => {
				e.querySelector("strong").textContent = d(t.creatorId), e.querySelector(".c-head .muted").textContent = new Date(t.created).toLocaleString(), e.querySelector(".c-body").textContent = t.body, e.classList.toggle("pending", t.created === 0), y(e.querySelector(".reactions"), t.id);
			}
		}, ({ rows: e }) => u("ccount").textContent = `(${e})`));
		function y(e, n) {
			let r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
			for (let e of s.toArray) e.subjectId === n && (i.set(e.value, (i.get(e.value) ?? 0) + 1), e.creatorId === t.user.id && r.set(e.value, e.id));
			e.replaceChildren(...Ap.map((e) => {
				let t = document.createElement("button");
				return t.textContent = i.get(e) ? `${e} ${i.get(e)}` : e, t.className = r.has(e) ? "mine" : "", t.dataset.emoji = e, t.dataset.subject = n, t;
			}));
		}
		let b = () => {
			y(u("issue-emojis"), e);
			for (let e of u("comments").children) y(e.querySelector(".reactions"), e.dataset.key);
		};
		l.push(n.subscribeChanges((t) => t.some((t) => t.key === e) && _())), l.push(a.subscribeChanges((t) => t.some((t) => t.value.issueId === e) && _())), l.push(s.subscribeChanges(b)), l.push(r.subscribeChanges(_)), _(), b(), m("toggle").onclick = () => k(e), h.onchange = () => Mp(n.update(e, (e) => void (e.assigneeId = h.value || null))), u("title").onkeydown = (e) => {
			e.key === "Enter" && (e.preventDefault(), e.target.blur()), e.stopPropagation();
		}, u("title").onblur = () => {
			let t = u("title").textContent.trim(), r = n.get(e);
			r && t && t !== r.title ? Mp(n.update(e, (e) => void (e.title = t.slice(0, 128)))) : _();
		}, u("labels").onclick = (t) => {
			let n = t.target.closest("[data-label]");
			if (!n) return;
			let r = n.dataset.label, i = `${r}:${e}`;
			Mp(a.has(i) ? a.delete(i) : a.insert({
				id: i,
				labelId: r,
				issueId: e
			}));
		}, te.addEventListener("click", x), l.push(() => te.removeEventListener("click", x));
		function x(e) {
			let n = e.target.closest("[data-emoji]");
			if (!n) return;
			let r = s.toArray.find((e) => e.subjectId === n.dataset.subject && e.value === n.dataset.emoji && e.creatorId === t.user.id);
			Mp(r ? s.delete(r.id) : s.insert({
				id: crypto.randomUUID(),
				value: n.dataset.emoji,
				subjectId: n.dataset.subject,
				creatorId: t.user.id,
				created: Date.now()
			}));
		}
		let S = m("comment"), C = S.querySelector("textarea");
		C.onkeydown = (e) => {
			e.stopPropagation(), e.key === "Enter" && (e.metaKey || e.ctrlKey) && S.requestSubmit();
		}, S.onsubmit = (n) => {
			n.preventDefault();
			let r = C.value.trim();
			r && (C.value = "", Mp(o.insert({
				id: crypto.randomUUID(),
				issueId: e,
				created: Date.now(),
				body: r,
				creatorId: t.user.id
			})));
		};
	}
	async function j(e) {
		if (c.has(e)) return;
		let t = await fetch(`/api/issues/${encodeURIComponent(e)}/description`);
		c.set(e, t.ok ? await t.text() : "");
	}
	let re = (e) => {
		if (e.pathname === "/issues") return { view: "list" };
		let t = e.pathname.match(/^\/issue\/(\d+)$/);
		return t ? {
			view: "detail",
			shortId: Number(t[1])
		} : null;
	}, M = (e) => n.toArray.find((t) => t.shortId === e), N = null;
	function ie(e) {
		let t = performance.now();
		if (e.view === "list") u.dataset.view = "list", document.title = "zbugs · fastcoat", A?.(), A = null, S || E(), N && x.querySelector(`li[data-key="${CSS.escape(N)}"]`)?.scrollIntoView({ block: "nearest" });
		else {
			let t = M(e.shortId);
			if (!t) {
				location.reload();
				return;
			}
			N = t.id, u.dataset.view = "detail", ne(t.id), scrollTo(0, 0);
		}
		window.__fastcoatNav = performance.now() - t;
	}
	function P(e, t = !0) {
		let n = new URL(e, location.href), r = re(n);
		if (!r) return location.href = e;
		t && history.pushState({ fastcoat: !0 }, "", n), ie(r);
	}
	document.addEventListener("click", (e) => {
		if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		let t = e.target.closest("a[data-nav]");
		t && (e.preventDefault(), P(t.href));
	}), addEventListener("popstate", (e) => {
		(e.state?.fastcoat || re(new URL(location.href))) && P(location.href, !1);
	}), history.replaceState({ fastcoat: !0 }, ""), document.addEventListener("keydown", (e) => {
		let t = e.target.tagName;
		if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || e.target.isContentEditable) return;
		if (e.key === "Escape" && u.dataset.view === "detail") return P(`/issues${p}`);
		if (e.key !== "j" && e.key !== "k") return;
		let n = T.findIndex((e) => e.id === N), r = T[Math.max(0, Math.min(T.length - 1, n + (e.key === "j" ? 1 : -1)))];
		if (r) {
			N = r.id, u.dataset.view === "detail" && P(`/issue/${r.shortId}${p}`);
			for (let e of x.children) e.classList.toggle("selected", e.dataset.key === N);
		}
	}), h = !0, E();
	let ae = re(new URL(location.href));
	ae?.view === "detail" && n.onFirstReady(() => ie(ae)), window.__fastcoat = {
		store: e,
		boot: t,
		filters: m,
		remount: E,
		navigate: P
	};
}
function Mp(e) {
	e.isPersisted.promise.catch((e) => Np(`Rolled back: ${e.message}`));
}
function Np(e) {
	let t = Object.assign(document.createElement("div"), {
		id: "toast",
		textContent: e
	});
	document.body.append(t), setTimeout(() => t.remove(), 3500);
}
// src/runtime.ts
var Pp = class extends Error {};
async function Fp(e, t) {
	let n = await fetch(e, {
		...t,
		headers: {
			accept: "application/json",
			...t?.body ? { "content-type": "application/json" } : {}
		}
	});
	if (n.redirected && new URL(n.url).pathname === "/login" || n.status === 401) throw new Pp("signed out");
	if (!n.ok) throw Error(`${n.status} ${(await n.text()).slice(0, 200)}`);
	let r = await n.text();
	return r ? JSON.parse(r) : null;
}
function Ip(e, t, n) {
	let r = (t) => String(t[e.key]), i = null, a = /* @__PURE__ */ new Map(), o = (e, t, n = []) => {
		if (!i) return;
		i.begin();
		let o = /* @__PURE__ */ new Set();
		for (let t of e) {
			let e = r(t);
			o.add(e);
			let n = a.get(e);
			n ? Lp(n, t) || i.write({
				type: "update",
				value: t
			}) : i.write({
				type: "insert",
				value: t
			}), a.set(e, t);
		}
		let s = t ? [...a.keys()].filter((e) => !o.has(e)) : n;
		for (let e of s) {
			let t = a.get(e);
			t && i.write({
				type: "delete",
				value: t
			}), a.delete(e);
		}
		i.commit();
	}, s = () => Fp(e.load), c = (t, n) => t ? async ({ transaction: r }) => {
		let i = [], a = [];
		for (let o of r.mutations) n === "update" ? i.push(await Fp(t, {
			method: "POST",
			body: JSON.stringify({
				[e.key]: o.key,
				...o.changes
			})
		})) : n === "insert" ? i.push(await Fp(t, {
			method: "POST",
			body: JSON.stringify(o.modified)
		})) : (await Fp(t, {
			method: "POST",
			body: JSON.stringify(o.original)
		}), a.push(String(o.key)));
		o(i, !1, a);
	} : void 0, l = ll({
		id: `${t}/${e.name}`,
		getKey: r,
		startSync: !0,
		gcTime: 0,
		sync: {
			rowUpdateMode: "full",
			sync: (e) => (i = e, n ? (o(n, !0), e.markReady()) : s().then((t) => {
				o(t, !0), e.markReady();
			}).catch((t) => e.markError(t)), () => {
				i = null;
			})
		},
		onUpdate: c(e.update, "update"),
		onInsert: c(e.insert, "insert"),
		onDelete: c(e.delete, "delete")
	});
	for (let t of e.indexes) l.createIndex((e) => e[t], { indexType: Dp });
	return {
		collection: l,
		desc: e,
		refresh: async () => o(await s(), !0),
		applyServer: (e, t) => o(e, !1, t)
	};
}
function Lp(e, t) {
	for (let n in e) if (e[n] !== t[n]) return !1;
	for (let n in t) if (!(n in e)) return !1;
	return !0;
}
function Rp(e, t, n = {}) {
	let r = {};
	for (let i of e.collections) r[i.name] = Ip(i, t, n[i.name]);
	let i = () => Promise.all(Object.values(r).map((e) => e.refresh())), a = Date.now(), o = () => {
		Date.now() - a < 1e4 || (a = Date.now(), i().catch((e) => {
			e instanceof Pp && (location.href = "/login");
		}));
	};
	return window.addEventListener("focus", o), window.addEventListener("online", o), {
		synced: r,
		refreshAll: i,
		get: (e) => r[e].collection
	};
}
// src/index.ts
var zp = performance.now(), Bp = document.getElementById("fastcoat-boot");
if (Bp) {
	let e = JSON.parse(Bp.textContent), t = Rp(e.schema, e.scope, e.snapshot);
	try {
		jp(t, e);
	} catch (e) {
		throw window.__fastcoatError = String(e?.stack ?? e), e;
	}
	let n = { mounted: performance.now() - zp }, r = Object.keys(e.snapshot).length > 0;
	Promise.all(e.schema.collections.map((e) => t.get(e.name).toArrayWhenReady())).then(() => (n.firstViewReady = performance.now(), r ? t.refreshAll() : void 0)).then(() => {
		n.fullyLoaded = performance.now(), window.__fastcoatMarks = {
			...n,
			navToReady: n.fullyLoaded
		};
	}).catch((e) => {
		e instanceof Pp ? location.href = "/login" : console.error("[fastcoat]", e);
	});
}

//# sourceMappingURL=fastcoat.js.map