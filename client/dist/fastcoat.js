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
function O(e) {
	let t = [], n = /* @__PURE__ */ new Set(), r = (e) => {
		e.type === "collectionRef" || e.type === "descriptorRef" ? n.has(e.sourceId) || (n.add(e.sourceId), t.push(e)) : e.type === "queryRef" ? a(e.query) : e.type === "unionFrom" ? e.sources.forEach(r) : e.queries.forEach(a);
	}, i = (e) => {
		e instanceof w ? a(e.query) : e instanceof T ? (e.branches.forEach((e) => i(e.value)), e.defaultValue !== void 0 && i(e.defaultValue)) : typeof e == "object" && e && !Array.isArray(e) && !D(e) && !o(e) && Object.values(e).forEach(i);
	}, a = (e) => {
		r(e.from), e.join?.forEach(({ from: e }) => r(e)), e.select && Object.values(e.select).forEach(i);
	};
	return a(e), t;
}
function ee(e) {
	return O(e).map((e) => e.type === "descriptorRef" ? p(e) : e);
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
function F(e, t) {
	if (t.length <= P) e.push(...t);
	else for (let n = 0; n < t.length; n += P) {
		let r = t.slice(n, n + P);
		e.push(...r);
	}
}
function ae(e, t, n) {
	let r = 0, i = e.length;
	for (; r < i;) {
		let a = Math.floor((r + i) / 2), o = n(e[a], t);
		if (o < 0) r = a + 1;
		else if (o > 0) i = a;
		else return a;
	}
	return r;
}
function oe(e, t) {
	if (e === null) return "null";
	if (e === void 0) return "undefined";
	let n = typeof e;
	if (n === "object" || n === "function" || n === "symbol") {
		let n = e, r = t.get(n);
		return r === void 0 && t.set(n, r = t.size), `ref_${r}`;
	}
	return `${n}_${String(e)}`;
}
function se(e, t) {
	let [n, r] = e, [i, a] = t;
	return {
		onlyInA: [...I(n, Math.min(r, i)), ...I(Math.max(n, a), r)],
		onlyInB: [...I(i, Math.min(a, n)), ...I(Math.max(i, r), a)]
	};
}
function I(e, t) {
	let n = [];
	for (let r = e; r < t; r++) n.push(r);
	return n;
}
function ce(e, t) {
	if (typeof e == typeof t) {
		if (typeof e == "number" && typeof t == "number") {
			let n = Number.isNaN(e), r = Number.isNaN(t);
			if (n || r) return n && r ? 0 : n ? 1 : -1;
		}
		return e < t ? -1 : +(e > t);
	}
	return typeof e == "string" ? -1 : 1;
}
function L(e) {
	return le(e, /* @__PURE__ */ new Set()) ? JSON.stringify(ue(e)) : `~${JSON.stringify(R(e, /* @__PURE__ */ new Set()))}`;
}
function le(e, t) {
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
	return fe(e, t, () => e instanceof Date || e instanceof RegExp || e instanceof Uint8Array || ie(e) || e instanceof Map || e instanceof Set ? !1 : Array.isArray(e) ? e.every((e) => le(e, t)) : Object.keys(e).every((n) => le(e[n], t)));
}
function ue(e) {
	return e === null || typeof e == "boolean" || typeof e == "number" || typeof e == "string" ? e : Array.isArray(e) ? e.map(ue) : Object.fromEntries(Object.keys(e).sort().map((t) => [t, ue(e[t])]));
}
function R(e, t) {
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
	return fe(e, t, () => {
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
		if (Array.isArray(e)) return ["array", e.map((e) => R(e, t))];
		if (e instanceof Map) {
			let n = [...e.entries()].map(([e, n]) => [R(e, t), R(n, t)]);
			return n.sort((e, t) => de(JSON.stringify(e), JSON.stringify(t))), ["map", n];
		}
		if (e instanceof Set) {
			let n = [...e].map((e) => R(e, t));
			return n.sort((e, t) => de(JSON.stringify(e), JSON.stringify(t))), ["set", n];
		}
		return ["object", Object.keys(e).sort().map((n) => [n, R(e[n], t)])];
	});
}
function de(e, t) {
	return e < t ? -1 : +(e > t);
}
function fe(e, t, n) {
	if (t.has(e)) throw TypeError("Cannot serialize a cyclic structural relation key");
	t.add(e);
	try {
		return n();
	} finally {
		t.delete(e);
	}
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/hashing/murmur.js
var z = H(), pe = H(), me = H(), B = H(), he = H(), ge = ye(), V = /* @__PURE__ */ new Map(), _e = 0;
function ve(e) {
	let t = Symbol.keyFor(e);
	if (t !== void 0) {
		let e = V.get(t);
		return e === void 0 && (e = ++_e, V.set(t, e)), e;
	}
	let n = ge.get(e);
	return n === void 0 && (n = ++_e, ge.set(e, n)), n;
}
function ye() {
	let e = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ Symbol();
	try {
		if (e.set(t, 0), e.get(t) === 0) return e;
	} catch {}
	return /* @__PURE__ */ new Map();
}
function H() {
	return Math.random() * (2 ** 31 - 1) >>> 0;
}
var be = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8)), U = class {
	constructor() {
		this.hash = z, this.length = 0, this.carry = 0, this.carryBytes = 0;
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
				this.update(he), this.update(ve(e));
				return;
			case "string":
				this.update(pe);
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
				be.setFloat64(0, e, !0), this.writeWord(be.getUint32(0, !0)), this.writeWord(be.getUint32(4, !0));
				return;
			case "bigint": {
				let t = e;
				for (t < 0n ? (t = -t, this.update(B)) : this.update(me); t > 0n;) this.writeByte(Number(t & 255n)), t >>= 8n;
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
}, xe = H(), Se = H(), Ce = H(), we = H(), Te = H(), Ee = H(), De = { hash: H() }, Oe = { hash: H() }, ke = { hash: H() }, Ae = { hash: H() }, je = { hash: H() }, Me = { hash: H() }, Ne = { hash: H() }, Pe = { hash: H() }, Fe = 1e6, Ie = 768, Le = 128, Re = /* @__PURE__ */ new WeakMap(), ze = /* @__PURE__ */ new WeakSet();
function Be(e) {
	Ye(e);
}
function W(e) {
	let t = new U();
	return Ue(t, e), t.digest();
}
function Ve(e, t) {
	if (t.activeObjects.size >= Ie) throw RangeError("Value is too complex to hash safely: structural depth");
	t.activeObjects.add(e);
	let n;
	try {
		let [r, i, a] = He(e), o = new U();
		o.update(r.hash);
		for (let e of i) a ? Ue(o, e, t) : o.update(e);
		if (a) {
			let e = Object.keys(a);
			(!Array.isArray(a) || e.length !== a.length || e.length !== 0 && e[e.length - 1] !== String(a.length - 1)) && e.sort(), e.push(...Object.getOwnPropertySymbols(a).filter((e) => Object.prototype.propertyIsEnumerable.call(a, e)).sort((e, t) => ve(e) - ve(t)));
			for (let n of e) o.update(Te), o.update(n), Ue(o, a[n], t);
		}
		n = o.digest();
	} finally {
		t.activeObjects.delete(e);
	}
	return t.pendingHashes.set(e, n), n;
}
function He(e) {
	if (e instanceof Date) {
		let t = e.getTime();
		return [De, [Number.isNaN(t) ? "invalid" : t]];
	}
	return Ke(e) ? [Ne, [String.fromCharCode.apply(null, e)]] : ie(e) ? [Pe, [e[Symbol.toStringTag], e.toString()]] : e instanceof RegExp ? [
		Oe,
		[
			e.source,
			e.flags,
			e.lastIndex
		],
		e
	] : e instanceof Map ? [
		je,
		[],
		[...e.entries()]
	] : e instanceof Set ? [
		Me,
		[],
		[...e.values()]
	] : e instanceof Array ? [
		Ae,
		[e.length],
		e
	] : [
		ke,
		[],
		e
	];
}
function Ue(e, t, n) {
	if (n && ++n.work > Fe) throw RangeError("Value is too complex to hash safely: structural work");
	if (t === null) e.update(Ce);
	else switch (typeof t) {
		case "undefined":
			e.update(we);
			return;
		case "boolean":
			e.update(t ? xe : Se);
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
			e.update(We(t, n));
			return;
		case "function": e.update(Ye(t));
	}
}
function We(e, t) {
	let n = Re.get(e) ?? t?.pendingHashes.get(e);
	if (n !== void 0) return n;
	if (Ge(e)) return Ye(e);
	if (t) {
		if (t.activeObjects.has(e)) throw TypeError("Cannot hash cyclic structural values");
		return Ve(e, t);
	}
	let r = {
		activeObjects: /* @__PURE__ */ new Set(),
		work: 0,
		pendingHashes: /* @__PURE__ */ new Map()
	}, i = Ve(e, r);
	for (let [e, t] of r.pendingHashes) Re.set(e, t);
	return i;
}
function Ge(e) {
	return ze.has(e) || typeof File < "u" && e instanceof File || Ke(e) && e.byteLength > Le;
}
function Ke(e) {
	return typeof Buffer < "u" && e instanceof Buffer || e instanceof Uint8Array;
}
function qe(e, t) {
	let n = /* @__PURE__ */ new Map(), r = (e) => Reflect.ownKeys(e).filter((t) => Object.prototype.propertyIsEnumerable.call(e, t));
	function i(e, t) {
		if (e === t || Number.isNaN(e) && Number.isNaN(t)) return !0;
		if (e === null || t === null || typeof e != "object" || typeof t != "object" || Ge(e) || Ge(t) || Array.isArray(e) && Array.isArray(t) && e.length !== t.length) return !1;
		let a = n.get(e);
		if (a?.has(t)) return !0;
		let [o, s, c] = He(e), [l, u, d] = He(t);
		if (o !== l || !s.every((e, t) => e === u[t])) return !1;
		if (!c || !d) return !0;
		a ? a.add(t) : n.set(e, /* @__PURE__ */ new Set([t]));
		let f = r(c);
		return f.length === r(d).length && f.every((e) => Object.prototype.propertyIsEnumerable.call(d, e) && i(c[e], d[e]));
	}
	return i(e, t);
}
var Je = 1;
function Ye(e) {
	let t = Re.get(e);
	return t === void 0 && (t = Je ^ Ee, Je++, Re.set(e, t), ze.add(e)), t;
}
var Xe = /* @__PURE__ */ new Map([
	[Ae, "["],
	[ke, "{"],
	[De, "<"],
	[Oe, "/"],
	[je, "&"],
	[Me, "*"],
	[Ne, "^"],
	[Pe, "?"]
]), Ze = 4;
function Qe(e, t = 0) {
	switch (typeof e) {
		case "number": return `#${e === 0 ? 0 : e}`;
		case "string": return `"${e.length}:${e}`;
		case "boolean": return e ? "+" : "-";
		case "undefined": return "~";
		case "bigint": return `%${e}`;
		case "symbol": return `$${ve(e)}`;
		case "object": {
			if (e === null) return "!";
			if (t >= Ze || Ge(e)) return;
			let [n, r, i] = He(e), a = Xe.get(n);
			for (let e of r) {
				if (Number.isNaN(e)) return;
				a += Qe(e, t + 1);
			}
			if (!i) return a;
			if (Object.getOwnPropertySymbols(i).some((e) => Object.prototype.propertyIsEnumerable.call(i, e))) return;
			let o = "";
			for (let e of Object.keys(i).sort()) {
				let n = Qe(i[e], t + 1);
				if (n === void 0) return;
				o += `${e.length}:${e}=${n}|`;
			}
			return `${a}:${o.length}:${o}`;
		}
		default: return;
	}
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/multiset.js
var $e = class e {
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
		return F(n, this.#e), F(n, t.getInner()), new e(n);
	}
	consolidate() {
		let e = this.#e;
		if (e.every(([e]) => Array.isArray(e) && e.length === 2 && (typeof e[0] == "string" || typeof e[0] == "number"))) {
			let t = /* @__PURE__ */ new Map();
			return et(e, (e) => {
				let [n, r] = e, i;
				if (Array.isArray(r) && r.length === 2) {
					let e = oe(r[0], t), n = oe(r[1], t);
					i = `tuple_${e.length}:${e}${n}`;
				} else i = `leaf_${oe(r, t)}`;
				let a = oe(n, t);
				return `${a.length}:${a}${i}`;
			});
		}
		let t;
		return e.some(([e]) => {
			let n = typeof e;
			return n !== "string" && n !== "number" || (t ??= n, n !== t);
		}) ? et(e, W) : et(e, (e) => e, !0);
	}
	extend(t) {
		let n = t instanceof e ? t.getInner() : t;
		F(this.#e, n);
	}
	add(e, t) {
		t !== 0 && this.#e.push([e, t]);
	}
	getInner() {
		return this.#e;
	}
};
function et(e, t, n = !1) {
	let r = /* @__PURE__ */ new Map();
	for (let [n, i] of e) {
		let e = t(n), a = r.get(e);
		a ? a[1] += i : r.set(e, [n, i]);
	}
	let i = [];
	for (let [e, [t, a]] of r) a !== 0 && i.push([n ? e : t, a]);
	return new $e(i);
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/graph.js
var tt = class {
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
}, G = class {
	#e = [];
	sendData(e) {
		e instanceof $e || (e = new $e(e));
		for (let t of this.#e) t.unshift(e);
	}
	newReader() {
		let e = [];
		return this.#e.push(e), new tt(e);
	}
}, nt = class {
	constructor(e, t, n) {
		this.id = e, this.inputs = t, this.output = n;
	}
	hasPendingWork() {
		return this.inputs.some((e) => !e.isEmpty());
	}
}, rt = class extends nt {
	constructor(e, t, n) {
		super(e, [t], n), this.id = e;
	}
	inputMessages() {
		return this.inputs[0].drain();
	}
}, it = class extends nt {
	constructor(e, t, n, r) {
		super(e, [t, n], r), this.id = e;
	}
	inputAMessages() {
		return this.inputs[0].drain();
	}
	inputBMessages() {
		return this.inputs[1].drain();
	}
}, at = class extends rt {
	run() {
		for (let e of this.inputMessages()) this.output.sendData(this.inner(e));
	}
}, ot = class {
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
		let e = new G();
		return new ct(this, e);
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
}, st = class {
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
}, ct = class extends st {
	sendData(e) {
		this.writer.sendData(e);
	}
}, lt = class extends it {
	run() {
		for (let e of this.inputAMessages()) this.output.sendData(e);
		for (let e of this.inputBMessages()) this.output.sendData(e);
	}
};
function ut(e) {
	return (t) => {
		if (t.graph !== e.graph) throw Error("Cannot concat streams from different graphs");
		let n = new st(t.graph, new G()), r = new lt(t.graph.getNextOperatorId(), t.connectReader(), e.connectReader(), n.writer);
		return t.graph.addOperator(r), n;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/consolidate.js
var dt = class extends rt {
	run() {
		let e = this.inputMessages();
		if (e.length === 0) return;
		let t = new $e();
		for (let n of e) t.extend(n);
		let n = t.consolidate();
		n.getInner().length > 0 && this.output.sendData(n);
	}
};
function ft() {
	return (e) => {
		let t = new st(e.graph, new G()), n = new dt(e.graph.getNextOperatorId(), e.connectReader(), t.writer);
		return e.graph.addOperator(n), t;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/distinct.js
var pt = class extends rt {
	#e;
	#t;
	constructor(e, t, n, r = (e) => e) {
		super(e, t, n), this.#e = r, this.#t = /* @__PURE__ */ new Map();
	}
	run() {
		let e = /* @__PURE__ */ new Map();
		for (let t of this.inputMessages()) for (let [n, r] of t.getInner()) {
			let t = W(this.#e(n)), i = (e.get(t)?.[0] ?? this.#t.get(t) ?? 0) + r;
			e.set(t, [i, n]);
		}
		let t = [];
		for (let [n, [r, i]] of e.entries()) {
			let e = this.#t.get(n) ?? 0;
			r === 0 ? this.#t.delete(n) : this.#t.set(n, r), e <= 0 && r > 0 ? t.push([[W(this.#e(i)), i[1]], 1]) : e > 0 && r <= 0 && t.push([[W(this.#e(i)), i[1]], -1]);
		}
		t.length > 0 && this.output.sendData(new $e(t));
	}
};
function mt(e = (e) => e) {
	return (t) => {
		let n = new st(t.graph, new G()), r = new pt(t.graph.getNextOperatorId(), t.connectReader(), n.writer, e);
		return t.graph.addOperator(r), n;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/filter.js
var ht = class extends at {
	#e;
	constructor(e, t, n, r) {
		super(e, t, n), this.#e = r;
	}
	inner(e) {
		return e.filter(this.#e);
	}
};
function gt(e) {
	return (t) => {
		let n = new st(t.graph, new G()), r = new ht(t.graph.getNextOperatorId(), t.connectReader(), n.writer, e);
		return t.graph.addOperator(r), n;
	};
}
// ../node_modules/.pnpm/fractional-indexing@3.4.0/node_modules/fractional-indexing/src/index.js
var _t = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", vt = /* @__PURE__ */ new Map();
function yt(e) {
	let t = vt.get(e);
	if (t === void 0) {
		t = /* @__PURE__ */ new Uint8Array(256);
		for (let n = 0; n < e.length; n++) t[e.charCodeAt(n)] = n;
		vt.set(e, t);
	}
	return t;
}
function bt(e, t, n, r) {
	let i = n[0];
	if (t != null && e >= t) throw Error(e + " >= " + t);
	if (e.slice(-1) === i || t && t.slice(-1) === i) throw Error("trailing zero");
	if (t) {
		let a = 0;
		for (; (e[a] || i) === t[a];) a++;
		if (a > 0) return t.slice(0, a) + bt(e.slice(a), t.slice(a), n, r);
	}
	let a = e ? r[e.charCodeAt(0)] : 0, o = t == null ? n.length : r[t.charCodeAt(0)];
	return o - a > 1 ? n[Math.round(.5 * (a + o))] : t && t.length > 1 ? t.slice(0, 1) : n[a] + bt(e.slice(1), null, n, r);
}
function xt(e, t) {
	if (e.length !== St(e[0], t)) throw Error("invalid integer part of order key: " + e);
}
function St(e, t) {
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
function Ct(e, t) {
	let n = St(e[0], t);
	if (n > e.length) throw Error("invalid order key: " + e);
	return e.slice(0, n);
}
function wt(e, t, n) {
	if (Ot(e, t, n)) throw Error("invalid order key: " + e);
	let r = Ct(e, n);
	if (e.slice(r.length).slice(-1) === t[0]) throw Error("invalid order key: " + e);
}
function Tt(e, t, n, r) {
	xt(e, r);
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
	let c = r[s + 1], l = St(c, r) - St(i, r);
	return c + (l > 0 ? o + a : l < 0 ? o.slice(1) : o);
}
function Et(e, t, n, r) {
	xt(e, r);
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
	let c = r[s - 1], l = St(c, r) - St(i, r);
	return c + (l > 0 ? o + a : l < 0 ? o.slice(1) : o);
}
var Dt = /* @__PURE__ */ new Map();
function Ot(e, t, n = "") {
	let r = Dt.get(n);
	r === void 0 && (r = /* @__PURE__ */ new Map(), Dt.set(n, r));
	let i = t.charCodeAt(0), a = r.get(i);
	return a === void 0 && (a = n === "" ? "A" + t[0].repeat(26) : n[0] + t[0].repeat(n.length / 2), r.set(i, a)), e === a;
}
function kt(e) {
	for (let t = 1; t < e.length; t++) if (e.charCodeAt(t - 1) >= e.charCodeAt(t)) return !1;
	return !0;
}
function At(e) {
	for (let t = 0; t < e.length; t++) if (e.charCodeAt(t) > 255) return !1;
	return !0;
}
var jt = /* @__PURE__ */ new Set();
function Mt(e) {
	if (!jt.has(e)) {
		if (e.length < 2 || !kt(e)) throw Error("digits must be at least 2 characters in strictly ascending character code order: " + e);
		if (!At(e)) throw Error("digits must be single-byte (char code 0-255): " + e);
		jt.add(e);
	}
}
var Nt = /* @__PURE__ */ new Set();
function Pt(e) {
	if (!Nt.has(e)) {
		if (e.length < 2 || e.length % 2 != 0 || !kt(e)) throw Error("intDigits must be an even number of at least 2 characters in strictly ascending character code order: " + e);
		if (!At(e)) throw Error("intDigits must be single-byte (char code 0-255): " + e);
		Nt.add(e);
	}
}
function Ft(e, t, n = _t, r = void 0) {
	Mt(n), r !== void 0 && Pt(r);
	let i = yt(n);
	if (e != null && wt(e, n, r), t != null && wt(t, n, r), e != null && t != null && e > t) {
		let n = e;
		e = t, t = n;
	}
	if (e == null) {
		if (t == null) return (r === void 0 ? "a" : r[r.length / 2]) + n[0];
		let e = Ct(t, r), a = t.slice(e.length);
		if (Ot(e, n, r)) return e + bt("", a, n, i);
		if (e < t) return e;
		let o = Et(e, n, i, r);
		if (o == null) throw Error("cannot decrement any more");
		return o;
	}
	if (t == null) {
		let t = Ct(e, r), a = e.slice(t.length);
		return Tt(t, n, i, r) ?? t + bt(a, null, n, i);
	}
	let a = Ct(e, r), o = e.slice(a.length), s = Ct(t, r), c = t.slice(s.length);
	if (a === s) return a + bt(o, c, n, i);
	let l = Tt(a, n, i, r);
	if (l == null) throw Error("cannot increment any more");
	return l < t ? l : a + bt(o, null, n, i);
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/topKArray.js
function It(e, t) {
	return [e, t];
}
function Lt(e) {
	return e[0];
}
function Rt(e) {
	return e[1];
}
function zt(e) {
	return ([t, n], [r, i]) => {
		let a = e(n, i);
		return a === 0 ? ce(t, r) : a;
	};
}
var Bt = class {
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
		for (let r = this.#n; r < n && e(Lt(this.#e[r])); r++) t++;
		return t;
	}
	move({ offset: e, limit: t }) {
		let n = this.#n, r = this.#r - this.#n, i = [this.#n, this.#r === Infinity ? this.#n + this.size : this.#r];
		this.#n = e ?? n, this.#r = this.#n + (t ?? r);
		let { onlyInA: a, onlyInB: o } = se(i, [this.#n, this.#r === Infinity ? Math.max(this.#n + this.size, i[1]) : this.#r]), s = [];
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
		}, n = this.#i(e), r = It(e, Ft(n === 0 ? null : Rt(this.#e[n - 1]), n === this.#e.length ? null : Rt(this.#e[n])));
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
		return ae(this.#e, It(e, ""), (e, t) => this.#t(Lt(e), Lt(t)));
	}
};
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/topKState.js
function* Vt(e) {
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
			let e = t.find(([e]) => qe(e[1], n[1]));
			e ? e[1] += r : t.push([n, r]);
		}
		n.push(...t);
	}
	for (let e of n) e[1] < 0 && (yield e);
	for (let e of n) e[1] > 0 && (yield e);
}
var Ht = class {
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
		if (!(this.#t instanceof Bt)) throw Error("Cannot move B+-tree implementation of TopK with fractional index");
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
function Ut(e, t) {
	if (e) {
		let [[n, r], i] = e;
		t.push([[n, [r, i]], 1]);
	}
}
function Wt(e, t) {
	if (e) {
		let [[n, r], i] = e;
		t.push([[n, [r, i]], -1]);
	}
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/groupedTopKWithFractionalIndex.js
var Gt = class extends rt {
	#e = /* @__PURE__ */ new Map();
	#t;
	#n;
	#r;
	#i;
	constructor(e, t, n, r, i) {
		super(e, t, n), this.#t = i.groupKeyFn, this.#i = i.limit ?? Infinity, this.#r = i.offset ?? 0, this.#n = zt(r), i.setSizeCallback?.(() => this.#a()), i.setWindowFn?.(this.#c.bind(this));
	}
	#a() {
		let e = 0;
		for (let t of this.#e.values()) e += t.size;
		return e;
	}
	#o(e) {
		let t = this.#e.get(e);
		return t || (t = new Ht(new Bt(this.#r, this.#i, this.#n)), this.#e.set(e, t)), t;
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
			t.moveIns.forEach((e) => Ut(e, n)), t.moveOuts.forEach((e) => Wt(e, n)), t.changes && (r = !0);
		}
		r && this.output.sendData(new $e(n));
	}
	run() {
		let e = [];
		for (let [[t, n], r] of Vt(this.inputMessages())) this.#l(t, n, r, e);
		e.length > 0 && this.output.sendData(new $e(e));
	}
	#l(e, t, n, r) {
		let i = this.#t(e, t), a = this.#o(i), o = a.processElement(e, t, n);
		Ut(o.moveIn, r), Wt(o.moveOut, r), this.#s(i, a);
	}
};
function Kt(e, t) {
	return (n) => {
		let r = new st(n.graph, new G()), i = new Gt(n.graph.getNextOperatorId(), n.connectReader(), r.writer, e, t);
		return n.graph.addOperator(i), r;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/indexes.js
var qt = /* @__PURE__ */ Symbol("NO_PREFIX"), Jt = class extends Map {
	addValue(e, t, n = !1) {
		if (t === 0) return this.size === 0;
		let r = Qt(e), i = this.get(r);
		if ($t(i)) {
			let [a, o] = i;
			if (!Zt(Qt(a), r)) throw Error("Mismatching prefixes, this should never happen");
			if (a === e || n && r !== qt || W(a) === W(e)) {
				let n = o + t;
				n === 0 ? this.delete(r) : this.set(r, [e, n]);
			} else {
				let n = new Yt();
				n.set(W(a), i), n.set(W(e), [e, t]), this.set(r, n);
			}
		} else i === void 0 ? this.set(r, [e, t]) : i.addValue(e, t) && this.delete(r);
		return this.size === 0;
	}
}, Yt = class extends Map {
	addValue(e, t) {
		if (t === 0) return this.size === 0;
		let n = W(e), r = this.get(n);
		if (r) {
			let [, i] = r, a = i + t;
			a === 0 ? this.delete(n) : this.set(n, [e, a]);
		} else this.set(n, [e, t]);
		return this.size === 0;
	}
}, Xt = class e {
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
		if ($t(t)) return [t];
		if (t instanceof Yt) return [...t.values()];
		let n = [];
		for (let e of t.values()) if ($t(e)) n.push(e);
		else for (let t of e.values()) n.push(t);
		return n;
	}
	*getIterator(e) {
		let t = this.#e.get(e);
		if ($t(t)) yield t;
		else if (t === void 0) return;
		else if (t instanceof Yt) for (let e of t.values()) yield e;
		else for (let e of t.values()) if ($t(e)) yield e;
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
		else if ($t(a)) this.#i(e, a, n, r);
		else if (a instanceof Yt) {
			let i = Qt(n);
			if (i !== qt) {
				let n = new Jt();
				n.set(qt, a), n.set(i, t), this.#e.set(e, n);
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
		let o = Qt(n), s = Qt(i);
		if (Zt(s, o) && (this.#n && o !== qt || W(i) === W(n))) {
			let t = a + r;
			t === 0 ? this.#e.delete(e) : this.#e.set(e, [n, t]);
		} else if (s === qt && o === qt) {
			let a = new Yt();
			a.set(W(i), t), a.set(W(n), [n, r]), this.#e.set(e, a);
		} else {
			let a = new Jt();
			if (Zt(s, o)) {
				let e = new Yt();
				e.set(W(i), t), e.set(W(n), [n, r]), a.set(s, e);
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
		return new $e(t);
	}
};
function Zt(e, t) {
	return e === t || Number.isNaN(e) && Number.isNaN(t);
}
function Qt(e) {
	return Array.isArray(e) && (typeof e[0] == "string" || typeof e[0] == "number" || typeof e[0] == "bigint") ? e[0] : qt;
}
function $t(e) {
	return Array.isArray(e);
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/join.js
var en = class extends it {
	#e = new Xt();
	#t = new Xt();
	#n;
	constructor(e, t, n, r, i = "inner") {
		super(e, t, n, r), this.#n = i;
	}
	run() {
		let e = Xt.fromMultiSets(this.inputAMessages()), t = Xt.fromMultiSets(this.inputBMessages());
		if (e.size === 0 && t.size === 0) return;
		let n = new $e();
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
function tn(e, t = "inner") {
	return (n) => {
		if (n.graph !== e.graph) throw Error("Cannot join streams from different graphs");
		let r = new st(n.graph, new G()), i = new en(n.graph.getNextOperatorId(), n.connectReader(), e.connectReader(), r.writer, t);
		return n.graph.addOperator(i), r;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/map.js
var nn = class extends at {
	#e;
	constructor(e, t, n, r) {
		super(e, t, n), this.#e = r;
	}
	inner(e) {
		return e.map(this.#e);
	}
};
function K(e) {
	return (t) => {
		let n = new st(t.graph, new G()), r = new nn(t.graph.getNextOperatorId(), t.connectReader(), n.writer, e);
		return t.graph.addOperator(r), n;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/output.js
var rn = class extends rt {
	#e;
	constructor(e, t, n, r) {
		super(e, t, n), this.#e = r;
	}
	run() {
		for (let e of this.inputMessages()) this.#e(e), this.output.sendData(e);
	}
};
function an(e) {
	return (t) => {
		let n = new st(t.graph, new G()), r = new rn(t.graph.getNextOperatorId(), t.connectReader(), n.writer, e);
		return t.graph.addOperator(r), n;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/reduce.js
function on(e, t) {
	return e === t || e !== e && t !== t;
}
function sn(e) {
	return e === 0 ? 0 : e;
}
var cn = class extends rt {
	#e;
	#t = new Xt({ trackPresence: !1 });
	#n;
	constructor(e, t, n, r, i) {
		super(e, t, n), this.#e = new Xt({
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
				let e = r[0], a = i[0], o = a === void 0 ? void 0 : sn(a[0]);
				if (e !== void 0 && a !== void 0 && on(e[0], o)) {
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
		t.length > 0 && this.output.sendData(new $e(t));
	}
};
function ln(e, t) {
	return (n) => {
		let r = new st(n.graph, new G()), i = new cn(n.graph.getNextOperatorId(), n.connectReader(), r.writer, e, t);
		return n.graph.addOperator(i), r;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/tap.js
var un = class extends at {
	#e;
	constructor(e, t, n, r) {
		super(e, t, n), this.#e = r;
	}
	inner(e) {
		return this.#e(e), e;
	}
};
function dn(e) {
	return (t) => {
		let n = new st(t.graph, new G()), r = new un(t.graph.getNextOperatorId(), t.connectReader(), n.writer, e);
		return t.graph.addOperator(r), n;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/topKWithFractionalIndex.js
var fn = class extends rt {
	#e;
	constructor(e, t, n, r, i) {
		super(e, t, n);
		let a = i.limit ?? Infinity, o = i.offset ?? 0;
		this.#e = new Ht(new Bt(o, a, zt(r))), i.setSizeCallback?.((e) => e ? this.#e.countLeadingInWindow(e) : this.#e.size), i.setWindowFn?.(this.moveTopK.bind(this));
	}
	moveTopK({ offset: e, limit: t }) {
		let n = [], r = this.#e.move({
			offset: e,
			limit: t
		});
		r.moveIns.forEach((e) => Ut(e, n)), r.moveOuts.forEach((e) => Wt(e, n)), r.changes && this.output.sendData(new $e(n));
	}
	run() {
		let e = [];
		for (let [[t, n], r] of Vt(this.inputMessages())) this.processElement(t, n, r, e);
		e.length > 0 && this.output.sendData(new $e(e));
	}
	processElement(e, t, n, r) {
		let i = this.#e.processElement(e, t, n);
		Ut(i.moveIn, r), Wt(i.moveOut, r);
	}
};
function pn(e, t) {
	let n = t || {};
	return (t) => {
		let r = new st(t.graph, new G()), i = new fn(t.graph.getNextOperatorId(), t.connectReader(), r.writer, e, n);
		return t.graph.addOperator(i), r;
	};
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/groupBy.js
function mn(e, t = {}) {
	return (n) => {
		let r = /* @__PURE__ */ Symbol("original_group_key"), i = Object.entries(t);
		return n.pipe(K((t) => {
			let n = e(t), a = L(n), o = {};
			o[r] = n;
			let s = Qe(n) ?? null;
			for (let [e, n] of i) {
				let r = n.preMap(t);
				if (o[e] = r, s === null) continue;
				let i = Qe(r);
				s = i === void 0 ? null : `${s}|${i}`;
			}
			return [a, [s, o]];
		})).pipe(ln((e) => {
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
		}, { prefixIdentity: !0 })).pipe(K(([e, t]) => {
			let n = t[r], a = {};
			Object.assign(a, n);
			for (let [e, n] of i) a[e] = n.postMap ? n.postMap(t[e]) : t[e];
			return [e, a];
		}));
	};
}
function hn(e = (e) => e) {
	return {
		preMap: (t) => e(t),
		reduce: (e) => {
			let t = 0;
			for (let [n, r] of e) t += n * r;
			return t;
		}
	};
}
function gn(e = (e) => e) {
	return {
		preMap: (t) => e(t) == null ? 0 : 1,
		reduce: (e) => {
			let t = 0;
			for (let [n, r] of e) t += n * r;
			return t;
		}
	};
}
function _n(e = (e) => e) {
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
function vn(e) {
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
function yn(e) {
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
function bn(e = (e) => e) {
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
function xn(e = (e) => e) {
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
var Sn = {
	sum: hn,
	count: gn,
	avg: _n,
	min: vn,
	max: yn,
	median: bn,
	mode: xn
};
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/groupedOrderBy.js
function Cn(e, t) {
	let n = t.limit ?? Infinity, r = t.offset ?? 0, i = t.setSizeCallback, a = t.setWindowFn, o = t.groupKeyFn, s = t.comparator ?? ((e, t) => e === t ? 0 : e < t ? -1 : 1);
	return (t) => t.pipe(Kt((t, n) => s(e(t), e(n)), {
		limit: n,
		offset: r,
		setSizeCallback: i,
		setWindowFn: a,
		groupKeyFn: o
	}), ft());
}
// ../node_modules/.pnpm/@tanstack+db-ivm@0.2.0_typescript@6.0.3/node_modules/@tanstack/db-ivm/dist/esm/operators/orderBy.js
function wn(e, t) {
	let n = t?.limit ?? Infinity, r = t?.offset ?? 0, i = t?.setSizeCallback, a = t?.setWindowFn, o = t?.comparator ?? ((e, t) => e === t ? 0 : e < t ? -1 : 1);
	return (t) => t.pipe(pn((t, n) => o(e(t), e(n)), {
		limit: n,
		offset: r,
		setSizeCallback: i,
		setWindowFn: a
	}), ft());
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/uuid.js
function Tn() {
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
var En = /* @__PURE__ */ Symbol.for("@tanstack/db.collectionOptions");
function Dn(e) {
	return typeof e == "object" && !!e && e[En] === !0;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/collection-options.js
var On = /* @__PURE__ */ Symbol.for("@tanstack/db.collectionOptions.claim");
function kn(e) {
	return Dn(e);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/errors.js
var An = class extends Error {
	constructor(e) {
		super(e), this.name = "TanStackDBError";
	}
}, jn = class extends An {
	constructor(e, t, n) {
		let r = `${e === "insert" ? "Insert" : "Update"} validation failed: ${t.map((e) => `
- ${e.message} - path: ${e.path}`).join("")}`;
		super(n || r), this.name = "SchemaValidationError", this.type = e, this.issues = t;
	}
}, Mn = class extends An {
	constructor(e) {
		super(e), this.name = "CollectionConfigurationError";
	}
}, Nn = class extends Mn {
	constructor(e) {
		super(n(3, { reason: e })), this.name = "InvalidSyncPersistenceCapabilityError";
	}
}, Pn = class extends Mn {
	constructor() {
		super(n(4));
	}
}, Fn = class extends Mn {
	constructor() {
		super(n(5));
	}
}, In = class extends Mn {
	constructor() {
		super(n(6));
	}
}, Ln = class extends Mn {
	constructor() {
		super(n(7));
	}
}, Rn = class extends An {
	constructor(e) {
		super(e), this.name = "CollectionStateError";
	}
}, zn = class extends Rn {
	constructor(e, t) {
		super(n(8, {
			operation: e,
			collectionId: t
		}));
	}
}, Bn = class extends Rn {
	constructor(e, t, r) {
		super(n(9, {
			from: e,
			to: t,
			collectionId: r
		}));
	}
}, Vn = class extends Rn {
	constructor() {
		super(n(10));
	}
}, Hn = class extends Rn {
	constructor() {
		super(n(11));
	}
}, Un = class extends An {
	constructor(e) {
		super(e), this.name = "CollectionOperationError";
	}
}, Wn = class extends Un {
	constructor(e) {
		super(n(14, { item: e }));
	}
}, Gn = class extends Un {
	constructor(e, t) {
		super(n(15, {
			key: e,
			type: e === null ? "null" : typeof e
		}));
	}
}, Kn = class extends Un {
	constructor(e) {
		super(n(16, { key: e }));
	}
}, qn = class extends Un {
	constructor(e, t, r) {
		super(n(17, {
			key: e,
			collectionId: t,
			...r
		}));
	}
}, Jn = class extends Un {
	constructor() {
		super(n(18));
	}
}, Yn = class extends Un {
	constructor() {
		super(n(19));
	}
}, Xn = class extends Un {
	constructor(e) {
		super(n(20, { key: e }));
	}
}, Zn = class extends Un {
	constructor(e, t) {
		super(n(21, {
			originalKey: e,
			newKey: t
		}));
	}
}, Qn = class extends Un {
	constructor() {
		super(n(22));
	}
}, $n = class extends Un {
	constructor(e) {
		super(n(23, { key: e }));
	}
}, er = class extends An {
	constructor(e) {
		super(e), this.name = "MissingHandlerError";
	}
}, tr = class extends er {
	constructor() {
		super(n(24));
	}
}, nr = class extends er {
	constructor() {
		super(n(25));
	}
}, rr = class extends er {
	constructor() {
		super(n(26));
	}
}, ir = class extends An {
	constructor(e) {
		super(e), this.name = "TransactionError";
	}
}, ar = class extends ir {
	constructor() {
		super(n(31));
	}
}, or = class extends ir {
	constructor() {
		super(n(33));
	}
}, sr = class extends ir {
	constructor() {
		super(n(34));
	}
}, cr = class extends ir {
	constructor(e) {
		super(n(233, { id: e }));
	}
}, lr = class extends ir {
	constructor() {
		super(n(35));
	}
}, ur = class extends ir {
	constructor() {
		super(n(36));
	}
}, dr = class extends ir {
	constructor() {
		super(n(37));
	}
}, fr = class extends ir {
	constructor(e) {
		super(n(38, { key: e }));
	}
}, pr = class extends ir {
	constructor() {
		super(n(39));
	}
}, mr = class extends ir {
	constructor() {
		super(n(40));
	}
}, hr = class extends ir {
	constructor(e) {
		super(n(41, { detail: e }));
	}
}, gr = class extends An {
	constructor(e) {
		super(e), this.name = "QueryBuilderError";
	}
}, _r = class extends gr {
	constructor(e) {
		super(n(42, { context: e }));
	}
}, vr = class extends gr {
	constructor(e) {
		super(n(43, { context: e }));
	}
}, yr = class extends gr {
	constructor(e) {
		super(n(44, { alias: e }));
	}
}, br = class extends gr {
	constructor(e, t) {
		super(n(45, {
			context: e,
			type: t
		}));
	}
}, xr = class extends gr {
	constructor() {
		super(n(46));
	}
}, Sr = class extends gr {
	constructor() {
		super(n(47));
	}
}, Cr = class extends gr {
	constructor(e) {
		super(n(48, { valueType: e }));
	}
}, wr = class extends An {
	constructor(e) {
		super(e), this.name = "QueryCompilationError";
	}
}, Tr = class extends wr {
	constructor(e) {
		super(n(49, { segment: e })), this.name = "UnsafeAliasPathError";
	}
}, Er = class extends wr {
	constructor() {
		super(n(50));
	}
}, Dr = class extends wr {
	constructor() {
		super(n(51));
	}
}, Or = class extends wr {
	constructor(e) {
		super(n(52, { valueDescription: e }));
	}
}, kr = class extends wr {
	constructor() {
		super(n(53));
	}
}, Ar = class extends wr {
	constructor() {
		super(n(54));
	}
}, jr = class extends wr {
	constructor() {
		super(n(55));
	}
}, Mr = class extends wr {
	constructor(e, t, r) {
		super(n(56, {
			alias: e,
			collectionId: t,
			availableKeys: r
		}));
	}
}, Nr = class extends wr {
	constructor(e) {
		super(n(58, { type: e }));
	}
}, Pr = class extends wr {
	constructor(e) {
		super(n(59, { type: e }));
	}
}, Fr = class extends wr {
	constructor() {
		super(n(60));
	}
}, Ir = class extends wr {
	constructor(e) {
		super(n(61, { functionName: e }));
	}
}, Lr = class extends wr {
	constructor(e) {
		super(n(62, { collectionId: e }));
	}
}, Rr = class extends An {
	constructor(e) {
		super(e), this.name = "JoinError";
	}
}, zr = class extends Rr {
	constructor(e) {
		super(n(63, { joinType: e }));
	}
}, Br = class extends Rr {
	constructor(e) {
		super(n(64, { sourceAlias: e }));
	}
}, Vr = class extends Rr {
	constructor() {
		super(n(65));
	}
}, Hr = class extends Rr {
	constructor(e) {
		super(n(66, { sourceAlias: e }));
	}
}, Ur = class extends Rr {
	constructor(e) {
		super(n(67, { sourceAlias: e }));
	}
}, Wr = class extends Rr {
	constructor() {
		super(n(68));
	}
}, Gr = class extends Rr {
	constructor(e) {
		super(n(69, { type: e }));
	}
}, Kr = class extends An {
	constructor(e) {
		super(e), this.name = "GroupByError";
	}
}, qr = class extends Kr {
	constructor(e) {
		super(n(70, { alias: e }));
	}
}, Jr = class extends Kr {
	constructor(e) {
		super(n(71, { functionName: e }));
	}
}, Yr = class extends Kr {
	constructor(e) {
		super(n(72, { functionName: e }));
	}
}, Xr = class extends Kr {
	constructor(e) {
		super(n(73, { type: e }));
	}
}, Zr = class extends An {
	constructor(e, t) {
		super(n(78, {
			collectionId: e,
			error: t
		})), this.name = "SyncCleanupError";
	}
}, Qr = class extends Error {
	constructor() {
		super(n(79)), this.name = "AbortError";
	}
}, $r = class extends Error {
	constructor() {
		super(n(80)), this.name = "AbortError";
	}
}, ei = class extends Error {
	constructor() {
		super(n(81)), this.name = "AbortError";
	}
}, ti = class extends An {
	constructor(e) {
		super(e), this.name = "QueryOptimizerError";
	}
}, ni = class extends ti {
	constructor() {
		super(n(82));
	}
}, ri = class extends wr {
	constructor(e) {
		super(n(83, { missingAliases: e }));
	}
}, ii = class extends wr {
	constructor() {
		super(n(84));
	}
}, ai = class extends wr {
	constructor() {
		super(n(244));
	}
}, oi = class extends An {
	constructor() {
		super(n(85)), this.name = "SetWindowReentrancyError";
	}
}, si = class extends Error {
	constructor(e, t) {
		super(n(87, {
			path: e,
			reason: t
		})), this.path = e, this.reason = t, this.name = "UnhashableQueryIRError";
	}
}, ci = [
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
function q(e, t) {
	return di(e, t, void 0);
}
function li(e) {
	return e === null || Object.getPrototypeOf(e) === null;
}
function ui(e) {
	let t = Object.keys(e);
	for (let n of Object.getOwnPropertySymbols(e)) Object.prototype.propertyIsEnumerable.call(e, n) && t.push(n);
	return t;
}
function di(e, t, n, r = !1, i = !1) {
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
		let a = r && Array.from(t.entries()), o = Array.from(e.entries()).every(([e, o], s) => a ? Object.is(e, a[s][0]) && di(o, a[s][1], n, !0, i) : t.has(e) && di(o, t.get(e), n, r, i));
		return n.delete(e), o;
	}
	if (t instanceof Map) return !1;
	if (e instanceof Set) {
		if (!(t instanceof Set) || e.size !== t.size) return !1;
		if (n?.has(e)) return n.get(e) === t;
		n ??= /* @__PURE__ */ new Map(), n.set(e, t);
		let a = Array.from(e), o = Array.from(t);
		if (r) {
			let t = a.every((e, t) => di(e, o[t], n, r, i));
			return n.delete(e), t;
		}
		if (a.every((e) => typeof e != "object")) return n.delete(e), a.every((e) => t.has(e));
		let s = (e, t, n) => {
			if (e === a.length) return !0;
			let c = a[e];
			for (let [a, l] of t.entries()) {
				let u = new Map(n);
				if (di(c, o[l], u, r, i) && s(e + 1, t.filter((e, t) => t !== a), u)) return !0;
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
	if (pi(e) && pi(t)) {
		let n = e[Symbol.toStringTag];
		if (n !== t[Symbol.toStringTag]) return !1;
		if (n === "Temporal.Duration") {
			let n = e, r = t;
			return ci.every((e) => n[e] === r[e]);
		}
		return typeof e.equals == "function" ? e.equals(t) : e.toString() === t.toString();
	}
	if (pi(t) || Array.isArray(e) !== Array.isArray(t) || Array.isArray(e) && e.length !== t.length) return !1;
	if (Array.isArray(e) && !r) {
		if (n?.has(e)) return n.get(e) === t;
		n ??= /* @__PURE__ */ new Map(), n.set(e, t);
		let a = e.every((e, a) => di(e, t[a], n, r, i));
		return n.delete(e), a;
	}
	if (typeof e == "object") {
		let a = Object.getPrototypeOf(e), o = Object.getPrototypeOf(t), s = li(a), c = li(o);
		if (a !== o && !s && !c) return !1;
		if (n?.has(e)) return n.get(e) === t;
		let l = ui(e), u = ui(t);
		if (l.length !== u.length) return !1;
		if (l.length === 0 && !Array.isArray(e) && !(s && c)) return e instanceof URL && e.href === t.href;
		let d = !1, f = !0;
		for (let a of l) {
			let o = e[a];
			if (!d && typeof o == "object" && o && (n ??= /* @__PURE__ */ new Map(), n.set(e, t), d = !0), !Object.prototype.propertyIsEnumerable.call(t, a) || !di(o, t[a], n, r, i)) {
				f = !1;
				break;
			}
		}
		return d && n.delete(e), f;
	}
	return !1;
}
var fi = /* @__PURE__ */ new Set([
	"Temporal.Duration",
	"Temporal.Instant",
	"Temporal.PlainDate",
	"Temporal.PlainDateTime",
	"Temporal.PlainMonthDay",
	"Temporal.PlainTime",
	"Temporal.PlainYearMonth",
	"Temporal.ZonedDateTime"
]);
function pi(e) {
	if (typeof e != "object" || !e) return !1;
	let t = e[Symbol.toStringTag];
	return typeof t == "string" && fi.has(t);
}
var mi = {
	direction: "asc",
	nulls: "first",
	stringSort: "locale"
}, hi = /* @__PURE__ */ new Set();
function gi(e, t) {
	hi.has(e) || (hi.add(e), console.warn(t));
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/runtime-reference-identity.js
function _i() {
	let e = /* @__PURE__ */ new WeakMap(), t, n, r, i = 0, a = (e, t) => {
		let n = e.get(t);
		return n === void 0 && (n = ++i, e.set(t, n)), n;
	};
	return (i) => {
		r ??= Si();
		let o;
		if (typeof i == "symbol") {
			let e = Symbol.keyFor(i);
			e === void 0 ? (t ??= vi(), o = a(t, i)) : (n ??= /* @__PURE__ */ new Map(), o = a(n, e));
		} else o = a(e, i);
		return [
			"runtimeReference",
			r,
			o
		];
	};
}
function vi() {
	let e = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ Symbol();
	try {
		if (e.set(t, 0), e.get(t) === 0) return e;
	} catch {}
	return /* @__PURE__ */ new Map();
}
var yi;
function bi(e) {
	return yi ??= _i(), yi(e);
}
function xi(e) {
	return e?.stringSort === "custom" ? {
		...e,
		compare: bi(e.compare)
	} : e;
}
function Si() {
	let e = /* @__PURE__ */ new Uint32Array(4), t = Reflect.get(globalThis, "crypto");
	return typeof t?.getRandomValues == "function" ? (t.getRandomValues(e), Array.from(e, (e) => e.toString(36)).join("-")) : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/comparison.js
function J(e) {
	return typeof e == "number" && Number.isNaN(e) || e instanceof Date && Number.isNaN(e.getTime());
}
var Ci = (e, t, n) => {
	let { nulls: r } = n;
	if (e == null && t == null) return 0;
	if (e == null) return r === "first" ? -1 : 1;
	if (t == null) return r === "first" ? 1 : -1;
	let i = J(e), a = J(t);
	if (i && a) return 0;
	if (i) return 1;
	if (a) return -1;
	if (typeof e == "string" && typeof t == "string") {
		if (n.stringSort === "custom") return n.compare(e, t);
		if (n.stringSort === "locale") return e.localeCompare(t, n.locale, n.localeOptions);
	}
	if (Array.isArray(e) && Array.isArray(t)) {
		for (let r = 0; r < Math.min(e.length, t.length); r++) {
			let i = Ci(e[r], t[r], n);
			if (i !== 0) return i;
		}
		return e.length - t.length;
	}
	if (e instanceof Date && t instanceof Date) return e.getTime() - t.getTime();
	if (pi(e) && pi(t)) return Li(e, t);
	let o = typeof e == "symbol", s = typeof t == "symbol";
	if (o && s) return e === t ? 0 : bi(e)[2] - bi(t)[2];
	if (o) return 1;
	if (s) return -1;
	let c = typeof e == "object", l = typeof t == "object";
	if (c || l) {
		if (c && l) return bi(e)[2] - bi(t)[2];
		if (c) return 1;
		if (l) return -1;
	}
	return e < t ? -1 : +(e > t);
}, wi = (e, t, n) => e == null || t == null ? Ci(e, t, n) : Ci(t, e, n);
function Ti(e) {
	if (ki(e)) return "Binary";
	if (pi(e)) {
		let t = e[Symbol.toStringTag], n = e;
		return t === "Temporal.Duration" && (n.years || n.months || n.weeks) ? "Temporal.Duration.calendar" : t;
	}
	return Array.isArray(e) ? "Array" : "Object";
}
function Ei(e, t = "values") {
	let n = e.direction === "asc" ? Ci : wi;
	if (t !== "index") return (t, r) => n(t, r, e);
	let r = e.direction === "asc" ? 1 : -1;
	return (t, i) => {
		if (t != null && i != null) {
			t instanceof Date && (t = t.getTime()), i instanceof Date && (i = i.getTime());
			let e = typeof t, n = typeof i;
			if (e !== n) return (e < n ? -1 : 1) * r;
			if (e === "object") {
				let e = Ti(t), n = Ti(i);
				if (e !== n) return (e < n ? -1 : 1) * r;
				if (e === "Binary" || e === "Temporal.Duration.calendar" || e === "Temporal.PlainMonthDay") {
					let e = Fi(t), n = Fi(i);
					return (e < n ? -1 : +(e > n)) * r;
				}
			}
		}
		return n(t, i, e);
	};
}
function Di(e) {
	return (t, r) => {
		let i = e(t, r);
		if (typeof i != "number" || Number.isNaN(i)) throw TypeError(n(166, { result: i }));
		return i;
	};
}
var Oi = Ei({
	direction: "asc",
	nulls: "first",
	stringSort: "locale"
});
function ki(e) {
	return e instanceof Uint8Array || typeof Buffer < "u" && e instanceof Buffer;
}
function Ai(e, t) {
	if (e.byteLength !== t.byteLength) return !1;
	for (let n = 0; n < e.byteLength; n++) if (e[n] !== t[n]) return !1;
	return !0;
}
var ji = "\0tanstack-db:";
function Mi(e, t) {
	return `${ji}${e}:${t}`;
}
var Ni = /* @__PURE__ */ new WeakMap();
function Pi(e) {
	let t = Ni.get(e);
	if (t) return t;
	let n;
	if (e.byteLength <= 8192) n = String.fromCharCode.apply(null, e);
	else {
		let t = [];
		for (let n = 0; n < e.byteLength; n += 8192) t.push(String.fromCharCode.apply(null, e.subarray(n, n + 8192)));
		n = t.join("");
	}
	let r = Mi("binary", n);
	return Ni.set(e, r), r;
}
function Fi(e) {
	if (typeof e == "string") return e.startsWith(ji) ? Mi("string", e) : e;
	if (typeof e != "object" || !e) return e;
	if (e instanceof Date) return e.getTime();
	if (pi(e)) {
		let t = e[Symbol.toStringTag];
		if (t === "Temporal.Duration") {
			let n = e;
			return Mi(t, ci.map((e) => n[e]).join(","));
		}
		return Mi(t, e.toString());
	}
	return ki(e) ? Pi(e) : e;
}
function Ii(e, t) {
	return e === t || Number.isNaN(e) && Number.isNaN(t);
}
function Li(e, t) {
	let r = e[Symbol.toStringTag], i = t[Symbol.toStringTag];
	if (r !== i) throw TypeError(n(167, {
		aTag: r,
		bTag: i
	}));
	let a = e.constructor.compare;
	if (typeof a != "function") throw TypeError(n(168, { aTag: r }));
	return a(e, t);
}
function Ri(e, t) {
	return pi(e) && pi(t) ? Li(e, t) : e < t ? -1 : +(e > t);
}
function zi(e, t) {
	return e === t ? !0 : ki(e) && ki(t) ? Ai(e, t) : !1;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/equality-value-identity.js
var Bi = /* @__PURE__ */ Symbol("tanstack_db_parent_context"), Vi = /* @__PURE__ */ Symbol("tanstack_db_parent_projection_not_found");
function Hi(e, t) {
	let n = Fi(e);
	return typeof n == "object" && n || typeof n == "function" || typeof n == "symbol" ? t(n) : n;
}
function Ui(e, t) {
	if (typeof e == "object" && e || typeof e == "function" || typeof e == "symbol") return t(e);
	if (typeof e == "number") {
		if (Object.is(e, -0)) return ["number", "-0"];
		if (Number.isNaN(e)) return ["number", "NaN"];
	}
	return e;
}
function Wi() {
	let e = _i(), t = (t) => Hi(t, e);
	return {
		equality: t,
		exact: (t) => Ui(t, e),
		serializeEquality: (e) => L(t(e))
	};
}
function Gi(e) {
	return Hi(e, bi);
}
function Ki(e, t, n = {}) {
	return {
		[Bi]: !0,
		value: e,
		projectedBindings: n,
		identity: t
	};
}
function qi(e) {
	return Yi(e) ? e.projectedBindings : void 0;
}
function Ji(e, t) {
	let n = qi(e);
	return n && Object.prototype.hasOwnProperty.call(n, t) ? n[t] : Vi;
}
function Yi(e) {
	return typeof e == "object" && !!e && Bi in e;
}
function Xi(e) {
	if (Yi(e)) return e.value;
	if (typeof e == "object" && e) return e;
}
function Zi(e) {
	return Yi(e) ? e.identity : e;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/type-guards.js
function Qi(e) {
	if (typeof e != "object" || !e) return !1;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}
function $i(e) {
	return !!e && (typeof e == "object" || typeof e == "function") && typeof e.then == "function";
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/route-metadata.js
var ea = /* @__PURE__ */ Symbol("tanstack_db_routed_scalar_value"), ta = /* @__PURE__ */ Symbol("tanstack_db_route_metadata"), na = /* @__PURE__ */ Symbol("includesPublicKey"), ra = /* @__PURE__ */ Symbol("includesRouting"), ia = /* @__PURE__ */ new Set([ta, na]), aa = /* @__PURE__ */ new Set([...ia, ra]);
function oa(e, t, n) {
	return Object.assign(e, { [ta]: {
		correlationKey: t,
		parentContext: n
	} });
}
function sa(e) {
	if (typeof e == "object" && e && ta in e) return e[ta];
}
function ca(e, t) {
	return sa(e) ?? (typeof e == "object" && e ? sa(e[t]) : void 0);
}
function la(e) {
	let t = { ...e };
	return delete t[ta], t;
}
function ua(e, t, n, r) {
	return t === void 0 && n === void 0 && r === void 0 ? e : Qi(e) ? {
		...e,
		[ta]: {
			correlationKey: t,
			parentContext: n
		},
		[na]: r
	} : {
		[ea]: e,
		[ta]: {
			correlationKey: t,
			parentContext: n
		},
		[na]: r
	};
}
function da(e) {
	if (typeof e != "object" || !e || !(ea in e)) return;
	let t = e, n = t[ta];
	return {
		value: t[ea],
		correlationKey: n.correlationKey,
		parentContext: n.parentContext,
		publicKey: t[na]
	};
}
function fa(e) {
	return ma(e, (e) => e, ia);
}
function pa(e) {
	return ma(e, (e) => e, aa);
}
function ma(e, t, n) {
	let r = t(e);
	if (!Object.is(r, e)) return r;
	if (!ha(e)) return e;
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
			if (!ha(u)) continue;
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
				e.value = Object.is(n, t) ? ha(t) ? u(t) : t : n;
			}
			Object.defineProperty(n, t, e);
		}
		return n;
	};
	return u(e);
}
function ha(e) {
	return Array.isArray(e) || Qi(e);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/evaluators.js
function Y(e) {
	return e == null;
}
function ga(e) {
	return ki(e) ? e : Fi(e);
}
function _a(e, t) {
	return J(e) || J(t) ? J(e) && J(t) : zi(e, t);
}
function va(e) {
	if (e instanceof Date) return Number.isNaN(e.getTime()) ? null : e;
	if (typeof e == "string" || typeof e == "number") {
		let t = new Date(e);
		return Number.isNaN(t.getTime()) ? null : t;
	}
	return null;
}
function ya(e, t) {
	return e === "%Y-%m-%d" ? t.toISOString().slice(0, 10) : t.toISOString();
}
function ba(e) {
	return e === !0;
}
function X(e, t = !1) {
	return Sa(e, t);
}
function xa(e) {
	return Sa(e, !0);
}
function Sa(e, t) {
	switch (e.type) {
		case "val": {
			let t = e.value;
			return () => t;
		}
		case "ref": return t ? wa(e) : Ca(e);
		case "func": return Ta(e, t);
		default: throw new Pr(e.type);
	}
}
function Ca(e) {
	let t = v(e), [n, ...r] = e.path, i = t ?? n, a = t === void 0 ? r : y(e);
	if (!i) throw new Fr();
	let o = e.bindingId ? JSON.stringify([e.bindingId, a]) : void 0, s = o ? (e) => Ji(ca(e, i)?.parentContext, o) : void 0;
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
		return s && t !== Vi ? t : e[c];
	};
	if (a.length === 1) {
		let e = a[0];
		return (t) => {
			let n = s?.(t);
			return s && n !== Vi ? n : t[c]?.[e];
		};
	}
	return (e) => {
		let t = s?.(e);
		if (s && t !== Vi) return t;
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
function wa(e) {
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
function Ta(e, t) {
	let r = e.args.map((e) => Sa(e, t));
	switch (e.name) {
		case "array": return (e) => r.map((t) => t(e));
		case "eq": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n), a = typeof r;
				if (a === typeof i && (a === "string" || a === "boolean")) return r === i;
				let o = ga(r), s = ga(i);
				return Y(o) || Y(s) ? null : _a(o, s);
			};
		}
		case "gt": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n);
				return Y(r) || Y(i) ? null : J(r) || J(i) ? J(r) && !J(i) : Ri(r, i) > 0;
			};
		}
		case "gte": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n);
				return Y(r) || Y(i) ? null : J(r) || J(i) ? J(r) : Ri(r, i) >= 0;
			};
		}
		case "lt": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n);
				return Y(r) || Y(i) ? null : J(r) || J(i) ? J(i) && !J(r) : Ri(r, i) < 0;
			};
		}
		case "lte": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n);
				return Y(r) || Y(i) ? null : J(r) || J(i) ? J(i) : Ri(r, i) <= 0;
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
				let e = i.value.filter((e) => !Y(e)), n = e.filter(ki), r = new Set(e.filter((e) => !ki(e)).map(Fi));
				return (e) => {
					let i = t(e);
					return Y(i) ? null : ki(i) ? n.some((e) => zi(e, i)) : r.has(Fi(i));
				};
			}
			return (e) => {
				let r = ga(t(e)), i = n(e);
				return Y(r) ? null : Array.isArray(i) ? i.some((e) => _a(ga(e), r)) : !1;
			};
		}
		case "like": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n);
				return Y(r) || Y(i) ? null : Da(r, i, !1);
			};
		}
		case "ilike": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n), i = t(n);
				return Y(r) || Y(i) ? null : Da(r, i, !0);
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
					if (Ea(t(n))) {
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
				let n = va(e(t));
				return n ? n.toISOString().slice(0, 10) : null;
			};
		}
		case "datetime": {
			let e = r[0];
			return (t) => {
				let n = va(e(t));
				return n ? n.toISOString() : null;
			};
		}
		case "strftime": {
			let e = r[0], t = r[1];
			return (n) => {
				let r = e(n);
				if (typeof r != "string") return null;
				let i = va(t(n));
				return i ? ya(r, i) : null;
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
		default: throw new Ir(e.name);
	}
}
function Ea(e) {
	return e == null || e === !1 ? !1 : e === !0 ? !0 : typeof e == "number" ? e !== 0 && !Number.isNaN(e) : typeof e == "bigint" ? e !== 0n : !!e;
}
function Da(e, t, n) {
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
var Oa = class {
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
		let r = /* @__PURE__ */ new Set([...this.bl.equalityLookup(null), ...this.bl.equalityLookup(void 0)]), i = (e) => t?.(e) ?? !0, a = (e) => !r.has(e) && i(e), o = (e) => e <= 0 ? [] : n == null ? this.bl.takeReversedFromEnd(e, a) : this.bl.takeReversed(e, n, a), s = (e) => e <= 0 ? [] : [...r].sort(ce).filter(i).slice(0, e);
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
function ka(e, t, n, r, i) {
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
var Aa = [
	"$hasPendingWrites",
	"$synced",
	"$origin",
	"$key",
	"$collectionId"
];
function ja(e) {
	return Aa.includes(e);
}
function Ma(e) {
	return e.some((e) => ja(e));
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/index-optimization.js
function Na(e) {
	return e.supports("gt") && e.supportsRangeOptimization;
}
function Pa(e) {
	return Na(e) && !!e.supportsOrderOptimization;
}
function Fa(e, t, n, r) {
	if (Ma(t)) return;
	let i = n ?? {
		...mi,
		...e.compareOptions
	};
	for (let n of e.indexes.values()) if (n.matchesField(t) && n.matchesCompareOptions(i)) {
		let e = n.matchesDirection(i.direction) ? n : new Oa(n, i.nulls === "first");
		if (!r || r(e)) return e;
	}
}
function Ia(e) {
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
function La(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) for (let e of n) t.add(e);
	return t;
}
function Ra(e) {
	return e != null;
}
function za(e) {
	return {
		...mi,
		...e.compareOptions
	}.stringSort !== "lexical";
}
function Ba(e, t) {
	switch (typeof e) {
		case "number":
		case "bigint":
		case "boolean": return !1;
		case "string": return za(t);
		case "symbol": return !0;
		case "object": return e !== null && !(e instanceof Date);
		default: return !1;
	}
}
function Va(e, t, n) {
	return !Ba(e, n) && t.supportsRangeOptimization && (t.canOptimizeRangeFor?.(e) ?? !0);
}
function Ha(e, t) {
	return Ua(e, t);
}
function Ua(e, t) {
	if (e.type === "func") switch (e.name) {
		case "eq":
		case "gt":
		case "gte":
		case "lt":
		case "lte": return Ga(e, t);
		case "and": return Ka(e, t);
		case "or": return qa(e, t);
		case "in": return Ja(e, t);
	}
	return {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1
	};
}
function Wa(e, t) {
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
		let n = Fa(t, JSON.parse(e));
		if (n && r.some((e) => !Va(e.value, n, t))) continue;
		if (n && n.supports("gt") && n.supports("lt")) {
			let e = Ei({
				...mi,
				...t.compareOptions,
				direction: "asc"
			}), i, a, o = !1, s = !1, c = !0, l = !0, u = !1;
			for (let { operation: t, value: n } of r) if (!Ra(n)) u = !0;
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
function Ga(e, t) {
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
		let e = i.path, n = Fa(t, e);
		if (n) {
			let e = a.value, r = o;
			return !n.supports(r) || (o === "gt" || o === "gte" || o === "lt" || o === "lte") && !Va(e, n, t) ? {
				canOptimize: !1,
				matchingKeys: /* @__PURE__ */ new Set(),
				isExact: !1
			} : {
				canOptimize: !0,
				matchingKeys: n.lookup(r, e),
				isExact: o === "lt" || o === "lte" ? !1 : Ra(e)
			};
		}
	}
	return {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1
	};
}
function Ka(e, t) {
	if (e.type !== "func" || e.args.length < 2) return {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1
	};
	let n = Wa(e, t), r = n.canOptimize ? n.coveredArgIndices : /* @__PURE__ */ new Set(), i = [];
	n.canOptimize && i.push(n);
	let a = !n.canOptimize || n.isExact;
	for (let [n, o] of e.args.entries()) {
		if (r.has(n)) continue;
		let e = Ua(o, t);
		e.canOptimize ? (i.push(e), e.isExact || (a = !1)) : a = !1;
	}
	return i.length > 0 ? {
		canOptimize: !0,
		matchingKeys: Ia(i.map((e) => e.matchingKeys)),
		isExact: a
	} : {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1
	};
}
function qa(e, t) {
	if (e.type !== "func" || e.args.length < 2) return {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1
	};
	let n = [];
	for (let r of e.args) {
		let e = Ua(r, t);
		if (!e.canOptimize) return {
			canOptimize: !1,
			matchingKeys: /* @__PURE__ */ new Set(),
			isExact: !1
		};
		n.push(e);
	}
	return {
		canOptimize: !0,
		matchingKeys: La(n.map((e) => e.matchingKeys)),
		isExact: n.every((e) => e.isExact)
	};
}
function Ja(e, t) {
	if (e.type !== "func" || e.args.length !== 2) return {
		canOptimize: !1,
		matchingKeys: /* @__PURE__ */ new Set(),
		isExact: !1
	};
	let n = e.args[0], r = e.args[1];
	if (n.type === "ref" && r.type === "val" && Array.isArray(r.value)) {
		let e = n.path, i = r.value, a = Fa(t, e), o = i.every((e) => Ra(e));
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
var Ya = /* @__PURE__ */ new WeakMap();
function Xa(e, t) {
	Ya.set(e, t);
}
function Za(e) {
	return typeof e == "object" && e ? Ya.get(e) : void 0;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/builder/ref-proxy.js
var Qa = 0;
function $a() {
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
function eo(e, t) {
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
				let r = ++Qa, i = `__SPREAD_SENTINEL__${e.join(".")}__${r}`;
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
function to(e, t) {
	let n = eo(e, t), r = /* @__PURE__ */ new Map();
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
	let r = Za(e);
	if (r) throw Error(n(126, { name: r }));
	return E(e) ? e : new b(e);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/builder/functions.js
function no(e, t) {
	return new x("eq", [Z(e), Z(t)]);
}
function ro(e, t) {
	return new x("gt", [Z(e), Z(t)]);
}
function io(e, t) {
	return new x("gte", [Z(e), Z(t)]);
}
function ao(e, t) {
	return new x("lt", [Z(e), Z(t)]);
}
function oo(e, t, ...n) {
	return new x("and", [
		e,
		t,
		...n
	].map((e) => Z(e)));
}
function so(e, t, ...n) {
	return new x("or", [
		e,
		t,
		...n
	].map((e) => Z(e)));
}
function co(e) {
	return new x("not", [Z(e)]);
}
function lo(e) {
	return new x("isUndefined", [Z(e)]);
}
function uo(e) {
	return new x("isNull", [Z(e)]);
}
function fo(e, t) {
	return new x("in", [Z(e), Z(t)]);
}
function po(e, t) {
	return new x("ilike", [Z(e), Z(t)]);
}
var mo = [
	"eq",
	"gt",
	"gte",
	"lt",
	"lte",
	"in"
], ho = class {
	constructor(e) {
		this.query = e, this.__brand = "ToArrayWrapper", Xa(this, "toArray()");
	}
}, go = class {
	constructor(e) {
		this.query = e, this.__brand = "ConcatToArrayWrapper", Xa(this, "concat(toArray())");
	}
}, _o = class {
	constructor(e) {
		this.args = e, this.__brand = "CaseWhenWrapper", Xa(this, "caseWhen()");
	}
}, vo = class {
	constructor(e) {
		this.query = e, this.__brand = "MaterializeWrapper", Xa(this, "materialize()");
	}
};
function yo() {
	return /* @__PURE__ */ e() && !1;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/indexes/auto-index.js
function bo(e) {
	return e.config.autoIndex === "eager";
}
function xo(e, t, n, i, a) {
	if (Ma(t)) return;
	let o = bo(n);
	if (!o && !yo()) return;
	let s = i ?? {
		...mi,
		...n.compareOptions
	};
	if (!Fa(n, t, s, a)) {
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
function So(e, t) {
	if (!bo(t) && !yo()) return;
	let n = Co(e);
	for (let { fieldName: e, fieldPath: r } of n) xo(e, r, t);
}
function Co(e) {
	let t = [];
	function n(e) {
		if (e.type !== "func") return;
		let r = e;
		if (r.name === "and") {
			for (let e of r.args) n(e);
			return;
		}
		if (!mo.includes(r.name) || r.args.length < 1 || r.args[0].type !== "ref") return;
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
function wo(e) {
	let t = Fi(e), n = typeof t;
	return n === "string" || n === "number" || n === "boolean" ? `${n}:${String(t)}` : void 0;
}
function To(e, t) {
	try {
		let n = e;
		for (let e of t) n = n?.[e];
		return n;
	} catch {
		return;
	}
}
function Eo(e, t) {
	if (e.type !== "func" || e.name !== "eq") return;
	let n = e.args;
	if (n.length !== 2) return;
	let r = n[0], i = n[1], a = r.type === "ref" ? r : i, o = r.type === "val" ? r : i;
	if (a.type !== "ref" || o.type !== "val") return;
	let s = t(a);
	if (!s?.length || ja(s[0])) return;
	let c = wo(o.value);
	return c === void 0 ? void 0 : {
		path: s,
		literalKey: c
	};
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/expressions.js
function Do(e) {
	switch (e.type) {
		case "ref": {
			let t = v(e) ?? e.path[0];
			return new Set(t ? [t] : []);
		}
		case "func": {
			let t = /* @__PURE__ */ new Set();
			for (let n of e.args) for (let e of Do(n)) t.add(e);
			return t;
		}
		default: return /* @__PURE__ */ new Set();
	}
}
function Oo(e, t) {
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
			let e = Oo(r, t);
			n.push(e);
		}
		return new x(e.name, n);
	}
}
function ko(e, t) {
	return e.map((e) => {
		let n = Oo(e.expression, t);
		return {
			...e,
			expression: n
		};
	});
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/group-by.js
var Ao = /* @__PURE__ */ Symbol("raw_group_representative");
function jo(e, t) {
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
function Mo(e) {
	let t = e.map(Gi);
	if (t.length === 1) {
		let e = t[0];
		if (e == null || typeof e != "object" && typeof e != "function" && typeof e != "symbol") return e;
	}
	return L(t);
}
function No(e, t) {
	let n = e;
	n[na] = t;
}
function Po(e, t) {
	let n = { key: L(t) };
	return Object.defineProperty(n, Ao, { value: e }), n;
}
function Fo(e, t, n) {
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
		Io(e),
		t
	];
}
function Io(e) {
	return e instanceof Date ? "Date" : pi(e) ? e[Symbol.toStringTag] : typeof Buffer < "u" && e instanceof Buffer ? "Buffer" : e instanceof Uint8Array ? "Uint8Array" : "Object";
}
function Lo(e) {
	let t;
	for (let [n, r] of e) r <= 0 || (t === void 0 || n.key < t.key) && (t = n);
	return t;
}
function Ro(e) {
	return e?.[Ao];
}
function zo(e, t, n, r, i) {
	let a = ca(t, n);
	e[r.correlationIdentity] = i.equality(a?.correlationKey), a?.parentContext != null && (e[r.parentContextIdentity] = Zi(a.parentContext));
}
function Bo(e, t, n, r) {
	e[n.route] = {
		preMap: ([, e]) => {
			let n = ca(e, t);
			return Po(n, [r.exact(n?.correlationKey), r.exact(n?.parentContext)]);
		},
		reduce: Lo,
		postMap: Ro
	};
}
function Vo(e, t) {
	return e[t.route];
}
function Ho(e, t) {
	return Vo(e, t)?.parentContext == null ? e[t.correlationIdentity] : [e[t.correlationIdentity], e[t.parentContextIdentity]];
}
function Uo(e, t, n = e.$selected) {
	return {
		...Xi(Vo(e, t)?.parentContext),
		$selected: n
	};
}
function Wo(e) {
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
var { sum: Go, count: Ko, avg: qo, min: Jo, max: Yo } = Sn;
function Xo(e, t, n, r, i, a, o, s, c, l = !1) {
	let u = jo(t.length, a), d = { [u.virtual]: {
		preMap: ([, e]) => Wo(e),
		reduce: (e) => {
			let t = {
				synced: !0,
				hasLocal: !1
			};
			for (let [n, r] of e) r <= 0 || (n.synced || (t.synced = !1), n.hasLocal && (t.hasLocal = !0));
			return t;
		}
	} };
	c && Bo(d, c, u, n);
	let f = t.length === 0;
	if (a) {
		for (let [e, n] of Object.entries(a)) if ($o(e, n, r, t)) throw new qr(e.startsWith(Zo) ? `...${Qo(e)}` : e);
	}
	let p = t.map((e) => X(e)), m = ([, e]) => {
		let r = f ? e : { ...e };
		f || delete r.$selected;
		let i = f ? { [u.singleGroup]: !0 } : {};
		for (let e = 0; e < t.length; e++) {
			let t = p[e], a = t(r);
			i[u.groupKeys[e]] = n.equality(a);
		}
		return c && zo(i, e, c, u, n), i;
	}, h = d, g = {}, _ = { value: 0 };
	for (let e = 0; e < p.length; e++) {
		let t = p[e];
		h[u.groupValues[e]] = {
			preMap: ([e, r]) => {
				let i = t(r);
				return Po(i, Fo(i, e, n));
			},
			reduce: Lo,
			postMap: Ro
		};
	}
	let v = [], y = (e, t) => {
		h[e] = ns(t);
		let n = t.name.toLowerCase();
		(n === "min" || n === "max") && v.push(ts(X(t.args[0])));
	};
	if (a) for (let [e, n] of Object.entries(a)) if (n.type === "agg") y(e, n);
	else {
		let { transformed: r, extracted: i } = os(n, _, u.aggregatePrefix);
		for (let [e, t] of Object.entries(i)) y(e, t);
		g[e] = ls(ss(r, t, u.groupKeyRefs));
	}
	if (v.length > 0 && (h[u.exactInputs] = {
		preMap: (e) => v.map((t) => Fo(t(e), e[0], n)),
		reduce: () => void 0
	}), e = e.pipe(mn(m, h)), e = e.pipe(K(([, e]) => {
		let n = {};
		if (a) {
			for (let [t, r] of Object.entries(a)) n[t] = r.type === "agg" ? e[t] : void 0;
			is(n, e, g, u);
		} else for (let r = 0; r < t.length; r++) n[`__key_${r}`] = e[u.groupValues[r]];
		let r = c ? Vo(e, u) : void 0, i = r?.correlationKey, o = c ? Ho(e, u) : void 0, l = [], d = [];
		for (let n = 0; n < t.length; n++) l.push(e[u.groupKeys[n]]), d.push(e[u.groupValues[n]]);
		o !== void 0 && l.push(o);
		let p = f ? o === void 0 ? "single_group" : `single_group_${L(o)}` : l.length === 1 ? l[0] : L(l), m = f ? "single_group" : Mo(d), h = {
			...e,
			$selected: n
		}, _ = e[u.virtual];
		return h.$synced = _?.synced ?? !0, h.$hasPendingWrites = !h.$synced, h.$origin = _?.hasLocal ? "local" : "remote", h.$key = m, h.$collectionId = s ?? h.$collectionId, c && i !== void 0 && (No(h, m), oa(h, i, r?.parentContext ?? null)), [c ? p : m, h];
	})), i && i.length > 0) for (let n of i) {
		let i = te(n);
		if ($o("", i, r, t)) throw new qr("HAVING");
		let o = X(cs(rs(i, a || {}), t, u.groupKeyRefs));
		e = e.pipe(gt(([, e]) => {
			let t = e.$selected;
			if (u.groupKeyRefs.length > 0) {
				let n = { ...t };
				u.groupKeyRefs.forEach((t, r) => {
					n[t] = e[u.groupValues[r]];
				}), t = n;
			}
			let n = Uo(e, u, t), r = o(n);
			return f ? ba(r) : r;
		}));
	}
	if (o && o.length > 0) for (let t of o) e = e.pipe(gt(([, e]) => {
		let n = Uo(e, u), r = l ? pa(n) : n;
		return ba(t(r));
	}));
	return e;
}
var Zo = "__SPREAD_SENTINEL__";
function Qo(e) {
	let t = e.slice(Zo.length), n = t.lastIndexOf("__");
	return n >= 0 ? t.slice(0, n) : t;
}
function $o(e, t, n, r) {
	if (e.startsWith(Zo)) return !0;
	if (r.some((e) => es(t, e))) return !1;
	if (ps(t)) return t.branches.some((e) => $o("", e.condition, n, r) || $o("", e.value, n, r)) || $o("", t.defaultValue, n, r);
	if (D(t)) {
		let e = t;
		return e.type === "ref" ? n(e) : e.type === "func" && e.args.some((e) => $o("", e, n, r));
	}
	return fs(t) ? Object.entries(t).some(([e, t]) => $o(e, t, n, r)) : !1;
}
function es(e, t) {
	if (!e || !t || e.type !== t.type) return !1;
	switch (e.type) {
		case "ref": return e.bindingId !== t.bindingId || !e.path || !t.path || e.path.length !== t.path.length ? !1 : e.path.every((e, n) => e === t.path[n]);
		case "val": return typeof e.value == "number" ? Object.is(e.value, t.value) : q(e.value, t.value);
		case "func": return e.name === t.name && e.args?.length === t.args?.length && (e.args || []).every((e, n) => es(e, t.args[n]));
		case "agg": return e.name === t.name && e.args?.length === t.args?.length && (e.args || []).every((e, n) => es(e, t.args[n]));
		default: return !1;
	}
}
function ts(e) {
	return ([, t]) => {
		let n = e(t);
		return typeof n == "number" || typeof n == "string" || typeof n == "bigint" || n instanceof Date ? n : n == null ? 0 : Number(n);
	};
}
function ns(e) {
	let t = X(e.args[0]), n = ([, e]) => {
		let n = t(e);
		return typeof n == "number" ? n : n == null ? 0 : Number(n);
	}, r = ts(t), i = ([, e]) => t(e);
	switch (e.name.toLowerCase()) {
		case "sum": return Go(n);
		case "count": return Ko(i);
		case "avg": return qo(n);
		case "min": return Jo(r);
		case "max": return Yo(r);
		default: throw new Jr(e.name);
	}
}
function rs(e, t, n = "$selected") {
	switch (e.type) {
		case "agg": {
			let r = e;
			for (let [e, i] of Object.entries(t)) if (i.type === "agg" && ms(r, i)) return new _([n, e], n);
			throw new Yr(r.name);
		}
		case "func": {
			let n = e, r = n.args.map((e) => rs(e, t));
			return new x(n.name, r);
		}
		case "ref": return e;
		case "val": return e;
		default: throw new Xr(e.type);
	}
}
function is(e, t, n, r) {
	for (let n of Object.keys(t)) n.startsWith(r.aggregatePrefix) && (e[n] = t[n]);
	for (let n = 0; n < r.groupKeyRefs.length; n++) e[r.groupKeyRefs[n]] = t[r.groupValues[n]];
	let i = Uo(t, r, e);
	for (let [t, r] of Object.entries(n)) e[t] = r(i);
	for (let t of Object.keys(e)) (t.startsWith(r.aggregatePrefix) || r.groupKeyRefs.includes(t)) && delete e[t];
}
function as(e) {
	return ps(e) ? e.branches.some((e) => as(e.condition) || as(e.value)) || e.defaultValue !== void 0 && as(e.defaultValue) : fs(e) ? Object.values(e).some((e) => as(e)) : D(e) ? e.type === "agg" || e.type === "func" && "args" in e && e.args.some((e) => as(e)) : !1;
}
function os(e, t, n) {
	if (e.type === "agg") {
		let r = `${n}${t.value++}`;
		return {
			transformed: new _(["$selected", r], "$selected"),
			extracted: { [r]: e }
		};
	}
	if (e.type === "func") {
		let r = {}, i = e.args.map((e) => {
			let i = os(e, t, n);
			return Object.assign(r, i.extracted), i.transformed;
		});
		return {
			transformed: new x(e.name, i),
			extracted: r
		};
	}
	if (ps(e)) {
		let r = {}, i = e.branches.map((e) => {
			let i = os(e.condition, t, n), a = os(e.value, t, n);
			return Object.assign(r, i.extracted, a.extracted), {
				condition: i.transformed,
				value: a.transformed
			};
		}), a = e.defaultValue === void 0 ? void 0 : os(e.defaultValue, t, n);
		return a && Object.assign(r, a.extracted), {
			transformed: new T(i, a?.transformed),
			extracted: r
		};
	}
	if (fs(e)) {
		let r = {}, i = {};
		for (let [a, o] of Object.entries(e)) {
			let e = os(o, t, n);
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
function ss(e, t, n) {
	if (ps(e)) return new T(e.branches.map((e) => ({
		condition: cs(e.condition, t, n),
		value: ss(e.value, t, n)
	})), e.defaultValue === void 0 ? void 0 : ss(e.defaultValue, t, n));
	if (fs(e)) {
		let r = {};
		for (let [i, a] of Object.entries(e)) r[i] = ss(a, t, n);
		return r;
	}
	return !D(e) || e.type === "includesSubquery" || e.type === "agg" ? e : cs(e, t, n);
}
function cs(e, t, n) {
	let r = t.findIndex((t) => es(e, t));
	return r === -1 ? e.type === "func" ? new x(e.name, e.args.map((e) => cs(e, t, n))) : e : new _(["$selected", n[r]], "$selected");
}
function ls(e) {
	return ps(e) ? ds(e) : fs(e) ? us(e) : D(e) ? X(e) : () => e;
}
function us(e) {
	let t = Object.entries(e).map(([e, t]) => [e, ls(t)]);
	return (e) => {
		let n = {};
		for (let [r, i] of t) n[r] = i(e);
		return n;
	};
}
function ds(e) {
	let t = e.branches.map((e) => ({
		condition: X(e.condition),
		value: ls(e.value)
	})), n = e.defaultValue === void 0 ? void 0 : ls(e.defaultValue);
	return (e) => {
		for (let n of t) if (Ea(n.condition(e))) return n.value(e);
		return n === void 0 ? null : n(e);
	};
}
function fs(e) {
	return typeof e == "object" && !!e && !Array.isArray(e) && !o(e) && !D(e);
}
function ps(e) {
	return e instanceof T || typeof e == "object" && !!e && e.type === "conditionalSelect";
}
function ms(e, t) {
	return e.name === t.name && e.args.length === t.args.length && e.args.every((e, n) => es(e, t.args[n]));
}
function hs(e, t, n, r, i, a, o, s, c, l) {
	let u = n.map((e) => ({
		compiledExpression: X(rs(e.expression, r, "$selected")),
		compareOptions: gs(e, i)
	})), d = (e) => n.length > 1 ? u.map((t) => t.compiledExpression(e)) : n.length === 1 ? u[0].compiledExpression(e) : null, f = (e, t) => {
		if (n.length > 1) {
			let r = e, i = t;
			for (let e = 0; e < n.length; e++) {
				let t = u[e], n = Ei(t.compareOptions)(r[e], i[e]);
				if (n !== 0) return n;
			}
			return r.length - i.length;
		}
		if (n.length === 1) {
			let n = u[0];
			return Ei(n.compareOptions)(e, t);
		}
		return Oi(e, t);
	}, p, m;
	if (s !== void 0 && n.length > 0 && !l && e.from.type !== "unionFrom" && e.from.type !== "unionAll") {
		let t, r, o = e.from.alias, l, u = n[0], d = u.expression, f = d.type === "ref" ? M(e, d, i) : void 0;
		if (d.type === "ref" && f) {
			r = f.collection, l = f.sourceId;
			let n = f.path[0], a = gs(u, i);
			n && xo(n, f.path, r, a, Na), t = Fa(r, f.path, a, Pa), f.path, o = d.path.length > 1 ? String(d.path[0]) : e.from.alias, l ??= ee(e).find((e) => e.alias === o && e.collection === r)?.sourceId;
		}
		if (l && f) {
			let r = _s(n, i.compareOptions), u = n.every(({ expression: t }) => t.type === "ref" && M(e, t, i)?.sourceId === l), d = X(new _(f.path), !0), h = Ei(r[0].compareOptions), g = (e, t) => h(e && d(e), t && d(t)), v = e.where?.some((e) => [...Do(k(e))].some((e) => e !== o)) ?? !1, y = v && e.join?.length === 1 && e.join[0].type === "left" && e.join[0].from.type === "collectionRef" ? e.join[0].from.sourceId : void 0, b = {
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
	return l ? t.pipe(Cn(d, {
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
	})) : t.pipe(wn(d, {
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
function gs(e, t) {
	return vs(e, t.compareOptions);
}
function _s(e, t) {
	return e.map((e) => ({
		expression: e.expression,
		compareOptions: vs(e, t)
	}));
}
function vs(e, t) {
	return e.compareOptions.stringSort === void 0 ? {
		...t,
		direction: e.compareOptions.direction,
		nulls: e.compareOptions.nulls
	} : e.compareOptions;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/collection/change-events.js
function ys(e) {
	let t = e.type === "func" && e.name === "and" ? e.args : [e];
	for (let e of t) {
		let t = Eo(e, y);
		if (t) return (e) => wo(To(e, t.path)) === t.literalKey;
	}
}
function bs(e, t = {}, i) {
	let a = (n) => {
		let r = [], a = n && i && t.where ? ys(t.where) : void 0, o = a ? i(a) : e.entries();
		for (let [e, t] of o) (n?.(t) ?? !0) && r.push({
			type: "insert",
			key: e,
			value: t
		});
		return r;
	};
	if (t.limit !== void 0 && !t.orderBy) throw Error(n(94));
	if (t.orderBy) {
		let n = t.where ? xs(t.where) : void 0, r = Cs(e, t.orderBy, t.limit, n, t.optimizedOnly);
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
		let n = t.where, r = Ha(n, e);
		if (r.canOptimize) {
			let t = r.isExact ? void 0 : xs(n), i = [];
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
		return t.optimizedOnly ? void 0 : a(xs(n));
	} catch (n) {
		console.warn(r(213, { id: e.id }), n);
		let i = xs(t.where);
		return t.optimizedOnly ? void 0 : a(i);
	}
}
function xs(e) {
	let t = xa(e);
	return (e) => {
		try {
			return ba(t(e));
		} catch {
			return !1;
		}
	};
}
function Ss(e, t) {
	let n = xs(t.whereExpression);
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
function Cs(e, t, n, r, i) {
	if (t.length === 1) {
		let i = t[0], a = i.expression;
		if (a.type === "ref") {
			let t = a.path, o = gs(i, e);
			xo(t[0], t, e, o, Na);
			let s = Fa(e, t, o, Pa);
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
		compare: Ei(gs(t, e))
	}));
	a.sort((e, t) => {
		for (let n of o) {
			let r = ws(e.value, n.expression), i = ws(t.value, n.expression), a = n.compare(r, i);
			if (a !== 0) return a;
		}
		return 0;
	});
	let s = a.map((e) => e.key);
	return n === void 0 ? s : s.slice(0, n);
}
function ws(e, t) {
	if (t.type === "ref") {
		let n = t, r = e;
		for (let e of n.path) r = r?.[e];
		return r;
	}
	return t.type === "val" ? t.value : xa(t)(e);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/SortedMap.js
var Ts = class {
	constructor(e) {
		this.d4 = !1, this.cz = 0, this.map = /* @__PURE__ */ new Map(), this.am = [], this.comparator = e;
	}
	indexOf(e, t) {
		let n = 0, r = this.am.length;
		if (!this.comparator) {
			for (; n < r;) {
				let t = Math.floor((n + r) / 2), i = this.am[t], a = ce(e, i);
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
				let t = ce(e, a);
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
			this.am.sort((e, t) => (this.comparator?.(this.map.get(e), this.map.get(t)) ?? 0) || ce(e, t)), this.d4 = !1;
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
function Es(e) {
	return e.metadata !== void 0 && e.type !== "delete" ? {
		type: "set",
		value: e.metadata
	} : e.type === "update" ? void 0 : { type: "delete" };
}
var Ds = class {
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
		}, this.config = e, this.transactions = new Ts((e, t) => e.compareCreatedAt(t)), this.syncedData = new Ts(e.compare);
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
		if (t && t.state !== "completed" && t.state !== "failed") throw new cr(e.id);
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
			}) : o === void 0 || i === void 0 || q(o, i) && s.$origin === c.$origin && s.$synced === c.$synced || r.push({
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
		return r.exists ? r.value !== void 0 && q(r.value, n) || this.hydrationSeedKeys.has(t) ? "update" : "duplicate" : "insert";
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
			let a = Es(e);
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
				if (t.committed) throw new hr("replay made an accepted insert a duplicate");
				e.states = n, e.truncated = r, t.invalidationError = t.duplicateKeyError?.(i) ?? new Qr();
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
				}), s = this.ak(e), c = o.$synced !== s.$synced || o.$origin !== s.$origin, l = (t) => ka(t, e, this.collection.id, () => o.$synced, () => o.$origin);
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
				}) : (c || !q(r, a)) && h.push({
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
	cancelPendingSyncedTransaction(e, t = new Qr()) {
		if (e.committed || this.pendingSyncedTransactions.at(-1) !== e) throw new hr("only the open last sync transaction can be canceled");
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
		for (let e of this.pendingSyncedTransactions) e.applied.reject(new Qr());
		this.syncedData.clear(), this.syncedMetadata.clear(), this.syncedCollectionMetadata.clear(), this.optimisticUpserts.clear(), this.optimisticDeletes.clear(), this.heldOptimisticRows.clear(), this.hydrationSeedKeys.clear(), this.hydratedKeys.clear(), this.ar?.clear(), this.b_ = !1, this.dh(), this.isLocalOnly = !1, this.localOnlyDirectWrite = void 0, this.size = 0, this.pendingSyncedTransactions = [], this.a7 = {
			states: /* @__PURE__ */ new Map(),
			truncated: !1
		}, this.preSyncVisibleState.clear(), this.preSyncVirtualState.clear(), this.recentlySyncedKeys.clear(), this.hasReceivedFirstCommit = !1;
	}
}, Os = new class {
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
}(), ks, As;
function js() {
	return As;
}
function Ms() {
	return ks;
}
function Ns(e) {
	if (ks === void 0) throw e;
	As ??= { error: e };
}
function Ps(e) {
	if (ks !== void 0) return e();
	let t = /* @__PURE__ */ Symbol("collection-publication");
	ks = t, As = void 0;
	let n, r;
	try {
		n = e(), Os.flush(t), r = js();
	} catch (e) {
		try {
			Os.clear(t);
		} catch {}
		let n = js();
		throw n ? n.error : e;
	} finally {
		ks = void 0, As = void 0;
	}
	if (r) throw r.error;
	return n;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/callbacks.js
function Fs(e) {
	let t;
	for (let n of e) try {
		n();
	} catch (e) {
		t ??= { error: e };
	}
	if (t) throw t.error;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live/internal.js
var Is = /* @__PURE__ */ Symbol("liveQueryInternal"), Ls = /* @__PURE__ */ new WeakMap();
function Rs(e) {
	return e.utils?.[Is]?.getBuilder?.();
}
function zs(e, t) {
	Ls.set(e, t);
}
function Bs(e) {
	return Ls.get(e);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/event-emitter.js
var Vs = class {
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
function Hs(e) {
	return so(uo(e), lo(e));
}
function Us(e, t) {
	let n = Hs(e.expression);
	if (t == null) return e.compareOptions.nulls === "first" ? co(n) : new b(!1);
	let r = (e.compareOptions.direction === "asc" ? ro : ao)(e.expression, new b(t));
	return e.compareOptions.nulls === "last" ? so(r, n) : r;
}
function Ws(e, t) {
	if (t.length !== 0) {
		if (e.length === 0 || t.length !== 1) throw Error(n(169));
		return Us(e[0], t[0]);
	}
}
function Gs(e, t) {
	let { expression: n } = e[0] ?? {};
	if (!n || t.length === 0) return;
	let r = t[0];
	if (r == null) return Hs(n);
	if (r instanceof Date) return Number.isFinite(r.getTime()) ? oo(io(n, new b(r)), ao(n, new b(new Date(r.getTime() + 1)))) : void 0;
	if (typeof r != "object") return no(n, new b(r));
}
function Ks(e, t) {
	if (e.length === 0 || t.length !== 1) return !1;
	let n = t[0];
	return n == null ? !1 : n instanceof Date ? Number.isFinite(n.getTime()) : typeof n == "string" ? e[0].compareOptions.stringSort === "lexical" : typeof n == "number" && Number.isFinite(n) || typeof n == "bigint" || typeof n == "boolean";
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/error.js
var qs = (e) => {
	try {
		return e instanceof Error ? e : Error(String(e));
	} catch {
		return Error(n(170));
	}
};
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/deferred.js
function Js() {
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
function Ys() {
	let e = Js();
	return e.promise.catch(() => {}), e;
}
function Xs(e) {
	e.abortController?.abort(), e.removeRequestAbortListener?.();
}
var Zs = class extends Vs {
	constructor(e, t, n) {
		super(), this.collection = e, this.callback = t, this.options = n, this.loadedInitialState = !1, this.ej = !1, this.snapshotSent = !1, this.C = [], this.bf = 0, this.d8 = /* @__PURE__ */ new WeakMap(), this.aC = /* @__PURE__ */ new Set(), this.ac = /* @__PURE__ */ new Map(), this.ad = /* @__PURE__ */ new Map(), this.fk = "ready", this.aV = 0, this.aq = /* @__PURE__ */ new Set(), this.dx = /* @__PURE__ */ new WeakMap(), this.aR = !1, this.unsubscribed = !1, this.c_ = n.deferAcquisition === !0, n.onUnsubscribe && this.on("unsubscribed", n.onUnsubscribe), n.onLoadSubsetError && this.on("loadSubset:error", n.onLoadSubsetError), n.whereExpression && So(n.whereExpression, this.collection);
		let r = (e) => {
			this.fj(e), this.e9(e), t(e);
		};
		this.callback = r, this.dN = n.whereExpression ? Ss(this.callback, n) : (e) => (this.callback(e), !0), this.ec = this.collection.on("truncate", () => {
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
		for (let e of [...this.C]) if (e.initialResult?.reject(new ei()), Xs(e.acquisition), e.acquisitionState === "starting") {
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
		t ? (t.completion.isPending() || (t.completion = Ys()), t.pendingSetups++, t.failures.clear(), t.failed = !1, t.currentAttempt = {
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
			i() && (e.failures.set(n, qs(t)), e.failed = !0);
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
			n.acquisition === c && (n.acquisitionState = "detached"), Xs(c), a(e);
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
			}) : q(e, i) || n.push({
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
		e?.completion.isPending() && e.completion.reject(new ei()), this.o = void 0, this.aR = !1;
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
			completion: Ys()
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
		let r = qs(t);
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
			let r = qs(n);
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
				throw t ? this.bR(e.options, qs(n), !0) : qs(n);
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
			let n = Js();
			t.initialResult = n;
			let r = () => n.reject(new ei());
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
			throw a !== -1 && (r && i && this.o === r && r.currentAttempt === i && (r.failures.set(t, qs(e)), r.failed = !0), this.C.splice(a, 1)), Xs(n), e;
		}
		if (!this.Z(a)) {
			let e = this.C.indexOf(t);
			return e !== -1 && this.C.splice(e, 1), Xs(n), {
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
		let r = qs(t);
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
					t.where = oo(e, n);
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
		this.C.splice(e, 1), n.initialResult?.reject(new ei()), Fs([
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
			where: t.length > 0 ? t.reduce((e, t) => oo(e, t)) : void 0
		});
		return Array.isArray(n) ? n.filter(({ key: e }) => !this.collection._hasOptimisticOverlay(e)) : [];
	}
	requestLimitedSnapshot({ refetch: e, orderBy: t, limit: r, minValues: i, offset: a, trackLoadSubsetPromise: o = !0, onLoadSubsetResult: s }) {
		if (this.unsubscribed) return;
		if (!r) throw Error(n(96));
		if (!this.orderByIndex) throw Error(n(97));
		let c = i ? Ws(t, i) : void 0, l = i !== void 0 && i.length > 0, u = i?.[0], d = this.orderByIndex, f = this.options.whereExpression, p = f ? xs(f) : void 0, m = (e) => {
			if (e !== void 0 && this.aC.has(e)) return !1;
			let t = this.collection.get(e);
			return t === void 0 ? !1 : p?.(t) ?? !0;
		}, h = u, g = [], v = [];
		if (l) {
			let { expression: e } = t[0], n = this.collection.currentStateAsChanges({ where: no(e, new b(u)) });
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
			let e = Gs(t, i);
			e && (T = {
				whereFrom: c,
				whereCurrent: e
			});
		}
		let E = this.collection._optimisticOverlaySize(), D = a === void 0 ? l ? void 0 : r + this.aC.size + E : r + E, O = {
			...e ? { refetch: !0 } : {},
			where: f,
			limit: D,
			orderBy: t,
			cursor: T,
			offset: a ?? 0,
			subscription: this
		}, { demand: ee, result: k, started: te } = this.dD(O);
		this.a4(ee) && (s?.(k, ee.acquisition.options, (e) => this.e6(ee, e)), this.a4(ee) && (te && this.co(k, ee, ee.acquisition.options, o), this.a4(ee)));
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
			}) : q(e, n.value) || t.push({
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
		this.ec = void 0, this.dB = void 0, this.cb = void 0, Fs([
			...e.map((e) => () => e?.()),
			() => {
				this.bP(), this.ad.clear();
				let e = this.C.filter((e) => e.acquisitionState === "active").map((e) => e.acquisition);
				for (let e of this.C) e.initialResult?.reject(new ei()), this.cO(e), e.acquisitionState === "starting" && Xs(e.acquisition);
				this.C = [], Fs(e.map((e) => () => this.al(e)));
			},
			() => this.emitInner("unsubscribed", {
				type: "unsubscribed",
				subscription: this
			}),
			() => this.clearListeners()
		]);
	}
}, Qs = class {
	constructor() {
		this.activeSubscribersCount = 0, this.acquiringSubscribersCount = 0, this.changeSubscriptions = /* @__PURE__ */ new Set(), this.batchedEvents = [], this.shouldBatchEvents = !1, this.cM = /* @__PURE__ */ new Set(), this.f2 = !1, this.ex = /* @__PURE__ */ new Set(), this.stateRevision = 0, this.layoutRevision = 0;
	}
	setDeps(e) {
		this.lifecycle = e.lifecycle, this.sync = e.sync, this.events = e.events, this.collection = e.collection, this.state = e.state;
	}
	emitEmptyReadyEvent() {
		Ps(() => {
			try {
				Fs([...this.changeSubscriptions].map((e) => () => e.emitEvents([])));
			} catch (e) {
				Ns(e);
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
		Ps(() => {
			let t = i.map((e) => () => e.emitEvents(n));
			e.length === 0 && t.unshift(...r);
			try {
				Fs(t);
			} catch (e) {
				Ns(e);
			}
		});
	}
	subscribeLayoutChanges(e) {
		return this.cM.add(e), () => this.cM.delete(e);
	}
	subscribeChanges(e, t = {}) {
		if (t.where && t.whereExpression) throw Error(n(95));
		let { where: r, ...i } = t, a = i.whereExpression;
		r && (a = Z(r($a())));
		let o = i.deferAcquisition === !0;
		this.ei(o);
		let s, c = { closed: !1 };
		try {
			s = new Zs(this.collection, e, {
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
			e ? Rs(this.collection.config) && this.gr() : (this.markSubscriberOrPreload(), this.gr());
		} catch (e) {
			throw this.activeSubscribersCount = t, this.activeSubscribersCount === 0 && this.lifecycle.startGCTimer(), e;
		}
		e || this.e2(1);
	}
	eB(e) {
		if (this.activeSubscribersCount--, this.activeSubscribersCount === 0) this.lifecycle.startGCTimer();
		else if (this.activeSubscribersCount < 0) throw new Hn();
		e || this.e2(-1);
	}
	cleanup() {
		this.f2 = [...this.changeSubscriptions].some((e) => !e.isDeferringAcquisition()), this.stateRevision++, this.batchedEvents = [], this.shouldBatchEvents = !1, this.aN && (this.aN.publications.length = 0), this.aN = void 0;
	}
}, $s = (e) => setTimeout(() => {
	e({
		didTimeout: !0,
		timeRemaining: () => 50
	});
}, 0), ec = (e) => {
	clearTimeout(e);
}, tc = typeof window < "u" && "requestIdleCallback" in window ? (e, t) => window.requestIdleCallback(e, t) : (e, t) => $s(e), nc = typeof window < "u" && "cancelIdleCallback" in window ? (e) => window.cancelIdleCallback(e) : ec, rc = class e {
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
rc.fY = null;
var ic = rc, ac = class {
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
		}[e].includes(t)) throw new Bn(e, t, this.id);
	}
	setStatus(e, t = !1, r) {
		if (e === "ready" && !t) throw new Rn(n(208));
		this.validateStatusTransition(this.status, e);
		let i = ++this.aV, a = this.status;
		this.status = e, r?.(), this.events.emitStatusChange(e, a, () => this.aV === i);
	}
	validateCollectionUsable(e) {
		switch (this.status) {
			case "error": throw new zn(e, this.id);
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
				Fs(n);
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
		if (this.dr) throw new Rn(n(209, { id: this.id }));
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
		t <= 0 || !Number.isFinite(t) || ic.getInstance().schedule(this, Math.max(t, e), () => {
			this.dA() && this.eg();
		});
	}
	cancelGCTimer() {
		ic.getInstance().cancel(this), this.aI !== null && (nc(this.aI), this.aI = null);
	}
	eg() {
		this.aI !== null && nc(this.aI), this.aI = tc((e) => {
			this.dA() ? this.fD(e) && (this.aI = null) : this.aI = null;
		}, { timeout: 1e3 });
	}
	fD(e) {
		return this.dr ? !0 : !e || e.timeRemaining() > 0 || e.didTimeout ? (this.fe().catch(() => void 0), !0) : (this.eg(), !1);
	}
	fe() {
		if (this.b5) return this.b5;
		let e = Js();
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
		return o(() => this.state.cleanup()), o(() => this.changes.cleanup()), o(() => this.indexes.cleanup()), ic.getInstance().cancel(this), this.hasBeenReady = !1, this.dp = void 0, this.onFirstReadyCallbacks = [], i && s(r), e.promise;
	}
	onFirstReady(e) {
		return this.hasBeenReady ? (e(), () => {}) : (this.onFirstReadyCallbacks.push(e), () => {
			let t = this.onFirstReadyCallbacks.indexOf(e);
			t !== -1 && this.onFirstReadyCallbacks.splice(t, 1);
		});
	}
	cleanup() {
		return this.aI !== null && (nc(this.aI), this.aI = null), this.fe();
	}
}, oc = /* @__PURE__ */ Symbol("tanstack-db.sync-receipt.accepted");
function sc(e, t) {
	return e[oc] = t, e;
}
function cc(e) {
	return e === !0 ? !0 : e[oc] ?? e;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/collection/sync.js
function lc(e, t) {
	let n = Object.keys(e);
	return n.length === Object.keys(t).length && n.every((n) => Object.is(e[n], t[n]));
}
var uc = class {
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
			if (a && t === "update" && !("previousValue" in n) && !lc(a, r)) throw new fr(e);
			i.set(r, { ...r });
		} catch (e) {
			if (e instanceof fr) throw e;
			i.delete(r);
		}
	}
	du(e) {
		let t = this.config.utils?.[Is];
		return new qn(e, this.id, {
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
			let e = dc(this.config.sync.sync({
				collection: this.collection,
				begin: () => {
					if (!t()) return;
					let e = Js();
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
					let o = Es(a);
					o && n.rowMetadataWrites.set(r, o);
				},
				commit: (e) => {
					if (!t()) return !0;
					let n = this.state.pendingSyncedTransactions.at(-1);
					if (!n) throw new pr();
					if (n.committed) throw new mr();
					return e?.aborted ? (this.state.cancelPendingSyncedTransaction(n), n.applied.promise) : n.invalidationError === void 0 ? (n.committed = !0, this.state.commitPendingTransactions(), !n.applied.isPending() || sc(n.applied.promise, !0)) : (this.state.cancelPendingSyncedTransaction(n, n.invalidationError), n.applied.promise);
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
			if (this.syncCleanupFn = e?.cleanup ?? null, this.syncLoadSubsetFn = e?.loadSubset ?? null, this.syncUnloadSubsetFn = e?.unloadSubset ?? null, this.syncMode === "on-demand" && !this.syncLoadSubsetFn) throw new Mn(n(210, { id: this.id }));
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
				if (n !== this.syncRunGeneration || e.signal?.aborted) throw new ei();
				let i = t?.(e) ?? !0;
				i instanceof Promise ? i.then((e) => r.resolve(e), (e) => r.reject(e)) : r.resolve(void 0);
			} catch (e) {
				r.reject(e);
			}
		}
	}
	aA() {
		let e = this.state.pendingSyncedTransactions.at(-1);
		if (!e) throw new ur();
		if (e.committed) throw new dr();
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
		return e === void 0 ? new Vn() : e;
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
		return e.waiting = !0, e.pending.size === 0 ? (this.gm(e), !e.hasError || Promise.reject(e.error)) : (e.deferred = Js(), e.deferred.promise);
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
		if (e.signal?.aborted) return Promise.reject(new ei());
		if (this.syncMode === "eager") return !0;
		if (this.bb) {
			this.bM = !0;
			let t = Js();
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
		this.syncMode !== "eager" && (this.bb ? this.ab = this.ab.filter((t) => t.options !== e || (t.deferred.reject(new ei()), !1)) : this.syncUnloadSubsetFn && this.syncUnloadSubsetFn(e));
	}
	eC(e) {
		let t = new Zr(this.id, e);
		return t.cause = e, e instanceof Error && (t.stack = e.stack), t;
	}
	e3(e) {
		if (!e) return !0;
		try {
			let t = e();
			return !$i(t) || Promise.resolve(t).then(() => void 0, (e) => {
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
		++this.bZ, this.syncRunGeneration++, this.cW?.(new $r());
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
		for (let e of this.a5) e.completed || (e.completed = !0, e.pending.clear(), e.hasError = !0, e.error = new ei(), e.deferred?.reject(e.error));
		this.a5.clear();
		let a = this.ab;
		this.ab = [];
		for (let e of a) e.deferred.reject(new ei());
		if (this.bg) {
			let t = e ? void 0 : Js(), i = {
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
function dc(e) {
	if (typeof e == "function") return { cleanup: e };
	if (typeof e == "object") return e;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/indexes/base-index.js
function fc(e) {
	return Object.fromEntries(Object.entries(e ?? {}).filter(([, e]) => e !== void 0));
}
function pc(e) {
	return e === void 0 ? void 0 : Intl.getCanonicalLocales(e)[0];
}
function mc(e) {
	return e.stringSort ?? mi.stringSort;
}
var hc = /* @__PURE__ */ new WeakMap(), gc = class {
	constructor(e, t, n, r) {
		this.aH = /* @__PURE__ */ new Map(), this.id = e, this.expression = t, this.compareOptions = r?.compareOptions ?? mi, this.hasCustomComparator = r?.compareFn != null, this.compareFn = Di(r?.compareFn ? (e, t) => r.compareFn(Fi(e), Fi(t)) : Ei(this.compareOptions, "index")), this.name = n, this.supportedOperations = new Set(mo), this.initialize(r);
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
		let t = _c(e);
		t !== void 0 && this.aH.set(t, (this.aH.get(t) ?? 0) + 1);
	}
	removeRangeValue(e) {
		let t = _c(e);
		if (t === void 0) return;
		let n = this.aH.get(t);
		n !== void 0 && (n === 1 ? this.aH.delete(t) : this.aH.set(t, n - 1));
	}
	clearRangeValues() {
		this.aH.clear();
	}
	canOptimizeRangeFor(e) {
		let t = _c(e);
		return t === void 0 ? !0 : vc(t) ? this.aH.size === 0 || this.aH.size === 1 && this.aH.has(t) : !1;
	}
	matchesField(e) {
		return this.expression.type === "ref" && this.expression.path.length === e.length && this.expression.path.every((t, n) => t === e[n]);
	}
	matchesCompareOptions(e) {
		let t = this.compareOptions, n = mc(t), r = mc(e);
		if (t.nulls !== e.nulls || n !== r) return !1;
		if (n === "custom" && r === "custom") return t.stringSort === "custom" && e.stringSort === "custom" && t.compare === e.compare;
		if (n !== "locale" || r !== "locale") return !0;
		let i = t, a = e;
		return pc(i.locale) === pc(a.locale) && q(fc(i.localeOptions), fc(a.localeOptions));
	}
	matchesDirection(e) {
		return this.compareOptions.direction === e;
	}
	initialize(e) {}
	evaluateIndexExpression(e) {
		return (this.eK ??= xa(this.expression))(e);
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
function _c(e) {
	if (e != null) return e instanceof Date ? "date" : typeof e == "object" ? Ti(e) : typeof e;
}
function vc(e) {
	return e === "number" || e === "bigint" || e === "boolean" || e === "string" || e === "date";
}
function yc(e, t) {
	console.warn(r(216, { key: e }), t);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/collection/indexes.js
var bc = 1;
function xc(e) {
	if (!pi(e)) return !1;
	let t = Object.getPrototypeOf(e);
	return t !== null && t !== Object.prototype;
}
function Sc(e, t) {
	return e === t ? 0 : e < t ? -1 : 1;
}
function Cc(e) {
	let t = hc.get(e) ?? e.name;
	return {
		kind: "constructor",
		...t ? { name: t } : {}
	};
}
function wc(e) {
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
	if (Array.isArray(e)) return e.map((e) => wc(e) ?? null);
	if (xc(e)) return {
		__type: e[Symbol.toStringTag],
		value: String(e)
	};
	if (e instanceof Date) return {
		__type: "date",
		value: e.toISOString()
	};
	if (e instanceof Set) return {
		__type: "set",
		values: Array.from(e).map((e) => wc(e) ?? null).sort((e, t) => Sc(Tc(e), Tc(t)))
	};
	if (e instanceof Map) return {
		__type: "map",
		entries: Array.from(e.entries()).map(([e, t]) => ({
			key: wc(e) ?? null,
			value: wc(t) ?? null
		})).sort((e, t) => Sc(Tc(e.key), Tc(t.key)))
	};
	if (e instanceof RegExp) return {
		__type: "regexp",
		value: e.toString()
	};
	let t = {}, n = Object.entries(e).sort(([e], [t]) => Sc(e, t));
	for (let [e, r] of n) {
		let n = wc(r);
		n !== void 0 && (t[e] = n);
	}
	return Object.hasOwn(t, "__type") ? {
		__type: "object",
		value: t
	} : t;
}
function Tc(e) {
	return e === null ? "null" : Array.isArray(e) ? `[${e.map(Tc).join(",")}]` : typeof e == "object" ? `{${Object.keys(e).sort((e, t) => Sc(e, t)).map((t) => `${JSON.stringify(t)}:${Tc(e[t])}`).join(",")}}` : JSON.stringify(e);
}
function Ec(e, t, n, r, i) {
	let a = Cc(r), o = wc(t) ?? null, s = wc(i);
	return {
		signatureVersion: bc,
		signature: Tc({
			signatureVersion: bc,
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
function Dc(e) {
	if (typeof e != "object" || !e) return e;
	if (Array.isArray(e)) return e.map((e) => Dc(e));
	let t = {};
	for (let [n, r] of Object.entries(e)) t[n] = Dc(r);
	return t;
}
function Oc(e) {
	return xc(e) ? e : e instanceof Date ? new Date(e.getTime()) : Array.isArray(e) ? e.map(Oc) : typeof e == "object" && e ? Object.fromEntries(Object.entries(e).map(([e, t]) => [e, Oc(t)])) : e;
}
function kc(e) {
	return Oc(e);
}
var Ac = class {
	constructor() {
		this.indexes = /* @__PURE__ */ new Map(), this.indexMetadata = /* @__PURE__ */ new Map(), this.indexCounter = 0;
	}
	setDeps(e) {
		this.state = e.state, this.lifecycle = e.lifecycle, this.defaultIndexType = e.defaultIndexType, this.events = e.events;
	}
	createIndex(e, t = {}) {
		this.lifecycle.validateCollectionUsable("createIndex");
		let r = ++this.indexCounter, i = Z(e($a())), a = t.indexType ?? this.defaultIndexType;
		if (!a) throw new Mn(n(207));
		let o = new a(r, i, t.name, t.options);
		o.build(this.state.entries()), this.indexes.set(r, o);
		let s = Ec(r, i, t.name, a, t.options);
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
			expression: kc(e.expression),
			resolver: { ...e.resolver },
			...e.options === void 0 ? {} : { options: Dc(e.options) }
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
}, jc = /* @__PURE__ */ new WeakMap();
function Mc(e, t, n) {
	t === "__proto__" ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n;
}
function Nc(e) {
	return typeof e == "object" && e ? jc.get(e) ?? e : e;
}
var Pc = /* @__PURE__ */ new Set([
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
]), Fc = /* @__PURE__ */ new Set([
	"entries",
	"keys",
	"values",
	"forEach"
]);
function Ic(e) {
	return typeof e == "object" && !!e && !(e instanceof Date) && !(e instanceof RegExp) && !pi(e);
}
function Lc(e, t, n, r) {
	return function(...i) {
		let a = e.apply(t.copy_, i);
		return n(t), a === t.copy_ ? r : a;
	};
}
function Rc(e, t, r, i, a) {
	if (Fc.has(e) || t === Symbol.iterator) return (...o) => {
		let s = r.copy_, c = s instanceof Map;
		if (c && e === "keys") return s.keys();
		let l = (e) => Ic(e) ? a(e, {
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
function zc(e, t = /* @__PURE__ */ new WeakMap(), n = !1) {
	if (e = Nc(e), typeof e != "object" || !e) return e;
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
			r[i] = zc(e, t, n);
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
		let r = zc(e.buffer, t, n), i = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), Symbol.toStringTag).get.call(e);
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
			r.set(i, zc(e, t, n));
		}), r;
	}
	if (e instanceof Set) {
		let r = /* @__PURE__ */ new Set();
		return t.set(e, r), e.forEach((e) => {
			r.add(zc(e, t, n));
		}), r;
	}
	if (pi(e)) return e;
	if (n) {
		let t = Object.getPrototypeOf(e);
		if (t !== Object.prototype && t !== null) return e;
	}
	let a = {};
	t.set(e, a);
	for (let r of Reflect.ownKeys(e)) (typeof r == "symbol" || Object.prototype.propertyIsEnumerable.call(e, r)) && Mc(a, r, zc(e[r], t, n));
	return a;
}
function Bc(e, t, n) {
	return di(e, t, n, !0);
}
function Vc(e, t) {
	let n = /* @__PURE__ */ new Map();
	function r(e, t) {
		if (n.has(e)) return n.get(e);
		{
			let r = Vc(e, t);
			return n.set(e, r), r;
		}
	}
	let i = t?.tracker.valueCopies ?? /* @__PURE__ */ new WeakMap(), a = {
		valueCopies: i,
		copy_: t ? i.get(e) ?? e : zc(e, i),
		originalObject: t ? zc(e) : e,
		modified: !1,
		assigned_: /* @__PURE__ */ Object.create(null),
		parent: t,
		target: e
	};
	function o(e) {
		e.modified ||= !0, e.parent && (!e.parent.retainIdentity && e.parent.tracker.copy_[e.parent.prop] === e.copy_ && (e.parent.tracker.assigned_[e.parent.prop] = !0), o(e.parent.tracker));
	}
	function s(e) {
		if (e.copy_ instanceof Map || e.copy_ instanceof Set) return Bc(Array.from(e.copy_), Array.from(e.originalObject));
		for (let t in e.assigned_) if (!e.assigned_[t] || Object.hasOwn(e.copy_, t) !== Object.hasOwn(e.originalObject, t) || !Bc(e.copy_[t], e.originalObject[t])) return !1;
		return !0;
	}
	function c(e) {
		if (s(e)) {
			e.modified = !1, e.assigned_ = /* @__PURE__ */ Object.create(null);
			let t = e.parent;
			t && (Bc(t.tracker.copy_[t.prop], t.tracker.originalObject[t.prop]) && delete t.tracker.assigned_[t.prop], c(t.tracker));
		}
	}
	function l(e, t) {
		let n = a.originalObject;
		return Object.hasOwn(n, e) && Bc(t, n[e]);
	}
	function u(e, t) {
		t ? (delete a.assigned_[e.toString()], a.modified = !0, c(a)) : (a.assigned_[e.toString()] = !0, o(a));
	}
	let d = new Proxy(a.copy_, {
		get(e, t, n) {
			let s = a.copy_[t], c = Object.getOwnPropertyDescriptor(e, t);
			if (c?.get) return s;
			if (c?.configurable === !1 && !c.writable) return Ic(s) && (a.assigned_[String(t)] = !0, o(a)), s;
			if (typeof s == "function") {
				if (Object.hasOwn(e, t) || t === "constructor") return s;
				let c = t.toString();
				if (c === "subarray" && ArrayBuffer.isView(e)) return (...t) => r(s.apply(e, t), {
					tracker: a,
					prop: "",
					retainIdentity: !0
				}).proxy;
				if (Pc.has(c) && (Array.isArray(e) || ArrayBuffer.isView(e))) return Lc(s, a, o, n);
				if (Array.isArray(e)) return s.bind(n);
				if (e instanceof Map || e instanceof Set) {
					let l = (e) => {
						let t = Nc(e);
						return typeof t == "object" && t ? i.get(t) ?? t : t;
					};
					if (c === "has" || c === "delete" || c === "add" || c === "set") return (...t) => {
						e instanceof Set ? t[0] = l(t[0]) : c === "set" && (t[1] = l(t[1]));
						let r = s.apply(e, t);
						return c !== "has" && o(a), r === e ? n : r;
					};
					if (e instanceof Map && c === "get") return (t) => {
						let n = e.get(t);
						return Ic(n) ? r(n, {
							tracker: a,
							prop: "",
							retainIdentity: !0
						}).proxy : n;
					};
					if (c === "clear") return Lc(s, a, o, n);
					let u = Rc(c, t, a, n, r);
					if (u) return u;
				}
				return s.bind(e);
			}
			return Ic(s) ? r(s, {
				tracker: a,
				prop: String(t)
			}).proxy : s;
		},
		set(e, t, n) {
			if (Reflect.getOwnPropertyDescriptor(e, t)?.get) return Reflect.set(e, t, n);
			let r = a.copy_[t];
			if (!Object.hasOwn(a.copy_, t) || !Bc(r, n)) {
				let e = l(t, n);
				a.copy_[t] = e ? zc(a.originalObject[t]) : n, u(t, e);
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
	return jc.set(d, a.copy_), {
		proxy: d,
		getChanges: () => {
			if (!a.modified) return {};
			if (typeof a.copy_ != "object" || Array.isArray(a.copy_) || Object.keys(a.assigned_).length === 0) return a.copy_;
			let e = {}, t = Object.keys(a.assigned_).some((e) => typeof a.copy_[e] == "object" || typeof a.originalObject[e] == "object"), n = /* @__PURE__ */ new Map([[a.copy_, a.originalObject]]);
			for (let r in a.copy_) {
				let i = a.copy_[r], o = a.originalObject[r];
				(a.assigned_[r] === !0 || t && !Bc(i instanceof Set ? Array.from(i) : i, o instanceof Set ? Array.from(o) : o, n)) && Mc(e, r, a.copy_[r]);
			}
			for (let t of Object.keys(a.assigned_)) a.assigned_[t] === !1 && Mc(e, t, void 0);
			return e;
		}
	};
}
function Hc(e) {
	let t = e.map((e) => Vc(e));
	return {
		proxies: t.map((e) => e.proxy),
		getChanges: () => t.map((e) => e.getChanges())
	};
}
function Uc(e, t) {
	let { proxy: n, getChanges: r } = Vc(e);
	return t(n), zc(r(), void 0, !0);
}
function Wc(e, t) {
	let { proxies: n, getChanges: r } = Hc(e);
	return t(n), zc(r(), void 0, !0);
}
function Gc(e) {
	let t = Object.getPrototypeOf(e);
	if (t !== Object.prototype && t !== null) return !1;
	for (let t in e) {
		let { value: n, get: r } = Object.getOwnPropertyDescriptor(e, t);
		if (r || typeof n == "object" && n) return !1;
	}
	return Object.getOwnPropertySymbols(e).length === 0;
}
function Kc(e, t, n) {
	if (!e.every(Gc)) return;
	let r = e.map((e) => ({ ...e }));
	return t(n ? r : r[0]), r.map((t, n) => {
		let r = e[n], i = {}, a = !1;
		for (let e in t) {
			let n = t[e], o = r[e];
			Object.hasOwn(r, e) && (n === o || Object.is(n, o) || typeof o == "object" && o && Bc(n, o)) || (Mc(i, e, n), typeof n == "object" && n && (a = !0));
		}
		for (let e in r) Object.hasOwn(t, e) || Mc(i, e, void 0);
		return a ? zc(i, void 0, !0) : i;
	});
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/transaction-commit-work.js
var qc = /* @__PURE__ */ new WeakMap();
function Jc(e) {
	let t = qc.get(e);
	if (t) return qc.delete(e), Promise.allSettled(t).then((e) => {
		let t = e.find((e) => e.status === "rejected");
		if (t?.status === "rejected") throw t.reason;
	});
}
var Yc = new class {
	constructor() {
		this.transactions = [], this.bm = [], this.sequenceNumber = 0;
	}
	createTransaction(e) {
		let t = new rl(e, this, this.sequenceNumber++);
		return this.transactions.push(t), t;
	}
	getActiveTransaction() {
		return this.bm.at(-1);
	}
	getActiveTransactionForCollection() {
		let e = this.getActiveTransaction();
		if (e) return e;
		if (this !== Yc) return Yc.eJ(this);
	}
	eJ(e) {
		let t = this.getActiveTransaction();
		if (!t) return;
		let r = Qc(t);
		if (r === e) return t;
		if (r !== this) throw Error(n(162));
		return this.removeTransaction(t), e.transactions.push(t), e.bm.push(t), t.sequenceNumber = e.sequenceNumber++, Xc.set(t, e), t;
	}
	registerTransaction(e) {
		Os.clear(e.id), this.bm.push(e);
	}
	unregisterTransaction(e, t = !1) {
		try {
			Os.flush(e.id);
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
		for (let t of e) Os.clear(t);
		this.transactions = [], this.bm = [];
	}
}(), Xc = /* @__PURE__ */ new WeakMap(), Zc = /* @__PURE__ */ new WeakMap();
function Qc(e) {
	let t = Xc.get(e);
	if (!t) throw Error(n(163));
	return t;
}
function $c(e) {
	let t = Zc.get(e);
	if (!t) throw Error(n(164));
	return t;
}
function el(e, t) {
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
			if (q(n, t.modified)) return null;
			let r = t.modified, i = /* @__PURE__ */ new Set([...Object.keys(n), ...Object.keys(r)]), a = {};
			for (let e of i) Object.hasOwn(n, e) === Object.hasOwn(r, e) && q(n[e], r[e]) || (a[e] = r[e]);
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
function tl(e) {
	return Yc.createTransaction(e);
}
function nl() {
	return Yc.getActiveTransaction();
}
var rl = class {
	constructor(e, t, n) {
		if (this.collections = /* @__PURE__ */ new Set(), e.mutationFn === void 0) throw new ar();
		this.id = e.id ?? Tn(), this.mutationFn = e.mutationFn, this.state = "pending", this.mutations = [], this.isPersisted = Js(), this.isPersisted.promise.catch(() => void 0), this.autoCommit = e.autoCommit ?? !0, this.createdAt = /* @__PURE__ */ new Date(), this.sequenceNumber = n, this.metadata = e.metadata ?? {}, Xc.set(this, t), Zc.set(this, t);
	}
	when(e) {
		return this.isPersisted.promise;
	}
	setState(e) {
		this.state = e, (e === "completed" || e === "failed") && Qc(this).removeTransaction(this);
	}
	mutate(e) {
		if (this.state !== "pending") throw new or();
		let t = Qc(this), r = /* @__PURE__ */ new Set([t, $c(this)]);
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
			i && this.mutations.splice(0, this.mutations.length, ...i), r.add(Qc(this));
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
			this.gq = a, r.add(Qc(this));
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
				let r = el(e, n);
				r === null ? t.delete(n.globalKey) : t.set(n.globalKey, r);
			} else t.set(n.globalKey, n);
		}
		this.mutations.length = 0;
		for (let e of t.values()) this.mutations.push(e);
	}
	rollback(e) {
		let t = e?.isSecondaryRollback ?? !1;
		if (this.state === "completed") throw new sr();
		if (this.state === "failed") return this;
		e?.error && (this.error = {
			message: e.error.message,
			error: e.error
		}), this.setState("failed");
		try {
			if (!t) {
				let e = new Set(this.mutations.map((e) => e.globalKey));
				Qc(this).rollbackConflictingTransactions(this, e);
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
		if (this.state !== "pending") throw new lr();
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
			let e = Jc(this);
			e && await e;
		} catch (e) {
			if (this.state !== "persisting") return this;
			let t = qs(e);
			try {
				await Jc(this);
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
}, il, al = 0;
function ol() {
	return il ??= Tn(), `${il}-${++al}`;
}
var sl = class {
	constructor(e, t) {
		this.insert = (e, t) => {
			this.lifecycle.validateCollectionUsable("insert");
			let n = this.state, r = this.getActiveTransaction();
			if (!r && !this.config.onInsert) throw new tr();
			let i = Array.isArray(e) ? e : [e], a = /* @__PURE__ */ new Date(), o = [], s = /* @__PURE__ */ new Set();
			i.forEach((e) => {
				let n = this.validateData(e, "insert"), r = this.config.getKey(n);
				if (s.has(r)) throw new Kn(r);
				s.add(r);
				let i = this.generateGlobalKey(r, e), c = {
					mutationId: ol(),
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
			if (c || (this.collection._sync.startSync(), c = o.find(({ key: e }) => n.has(e)), c)) throw new Kn(c.key);
			return r ? (this.bX(r, o), r) : this.cn("insert", (e) => this.config.onInsert(e), o);
		}, this.delete = (e, t) => {
			let n = this.state;
			this.lifecycle.validateCollectionUsable("delete");
			let r = this.getActiveTransaction();
			if (!r && !this.config.onDelete) throw new rr();
			if (Array.isArray(e) && e.length === 0) throw new Qn();
			let i = Array.isArray(e) ? e : [e];
			this.collection._sync.startSync();
			let a = /* @__PURE__ */ new Date(), o = [];
			for (let e of i) {
				if (!this.state.has(e)) throw new $n(e);
				let r = this.generateGlobalKey(e, this.state.get(e)), i = {
					mutationId: ol(),
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
		return this.fR ? this.fR.getActiveTransactionForCollection() : nl();
	}
	createTransaction(e) {
		return this.fR ? this.fR.createTransaction(e) : tl(e);
	}
	eX(e) {
		if (e && "~standard" in e) return e;
		throw new In();
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
				if (a instanceof Promise) throw new Ln();
				if ("issues" in a && a.issues) throw new jn(t, a.issues.map((e) => ({
					message: e.message,
					path: e.path?.map((e) => String(e))
				})));
				let o = a.value, s = Object.keys(e);
				return Object.fromEntries(s.map((e) => [e, o[e]]));
			}
		}
		let i = r["~standard"].validate(e);
		if (i instanceof Promise) throw new Ln();
		if ("issues" in i && i.issues) throw new jn(t, i.issues.map((e) => ({
			message: e.message,
			path: e.path?.map((e) => String(e))
		})));
		return i.value;
	}
	generateGlobalKey(e, t) {
		if (typeof e != "string" && typeof e != "number") throw e === void 0 ? new Wn(t) : new Gn(e, t);
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
					error: qs(e)
				});
			} catch {}
			throw e;
		}
		return i.commit().catch(() => void 0), i;
	}
	update(e, t, n) {
		if (e === void 0) throw new Jn();
		let r = this.state;
		this.lifecycle.validateCollectionUsable("update");
		let i = this.getActiveTransaction();
		if (!i && !this.config.onUpdate) throw new nr();
		let a = Array.isArray(e), o = a ? e : [e];
		if (a && o.length === 0) throw new Yn();
		let s = typeof t == "function" ? t : n;
		if (typeof s != "function") throw TypeError();
		let c = typeof t == "function" ? {} : t;
		this.collection._sync.startSync();
		let l = o.map((e) => {
			let t = this.state.get(e);
			if (!t) throw new Xn(e);
			return t;
		}), u = Kc(l, s, a) ?? (a ? Wc(l, s) : [Uc(l[0], s)]), d = /* @__PURE__ */ new Date(), f = o.map((e, t) => {
			let n = u[t];
			if (!n || Object.keys(n).length === 0) return null;
			let i = l[t], a = this.validateData(n, "update", e), o = {
				...i,
				...a
			}, s = this.config.getKey(i), f = this.config.getKey(o);
			if (s !== f) throw new Zn(s, f);
			let p = this.generateGlobalKey(f, o);
			return {
				mutationId: ol(),
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
}, cl = class extends Vs {
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
}, ll = /* @__PURE__ */ Symbol.for("@tanstack/db.collectionSyncConfig.factory"), ul = /* @__PURE__ */ Symbol.for("@tanstack/db.collectionSyncConfig.cleanup");
function dl(e, t) {
	return Object.defineProperty(e, ll, {
		value: t,
		enumerable: !0
	}), e;
}
function fl(e, t, n) {
	let r = e[ll];
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
function pl(e) {
	let t = e[ul];
	t?.();
}
function ml(e) {
	let t = e[On];
	return hl(e, t?.());
}
function hl(e, t) {
	try {
		return new gl(e);
	} catch (e) {
		throw t?.(), e;
	}
}
var gl = class {
	constructor(e) {
		if (this.utils = {}, this.deferDataRefresh = null, this.insert = (e, t) => this.cS.insert(e, t), this.delete = (e, t) => this.cS.delete(e, t), !e) throw new Pn();
		if (!e.sync) throw new Fn();
		this.id = e.id ? e.id : Tn();
		let { sync: t, utilities: r } = fl(e.sync, e.utils ?? {}, () => {
			this._lifecycle.status === "idle" && this._sync.startSync();
		});
		if (this.config = {
			...e,
			sync: t,
			autoIndex: e.autoIndex ?? "off",
			utils: r
		}, this.utils = r, this.config.autoIndex === "eager" && !e.defaultIndexType) throw new Mn(n(206));
		Be(this), this.cC = new Qs(), this.a3 = new cl(), this.dd = new Ac(), this._lifecycle = new ac(this.config, this.id, () => pl(this.config.sync)), this.cS = new sl(this.config, this.id), this._state = new Ds(this.config), this._sync = new uc(this.config, this.id), this.eS = _l(e), this.cC.setDeps({
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
		return bs(this, e, (e) => this._state.entriesPassing(e));
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
function _l(e) {
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
function vl(e, t, n) {
	let r = e.get(t);
	return r === void 0 && (r = n(), e.set(t, r)), r;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/optimizer.js
function yl(e) {
	if (e.from.type === "unionAll") return {
		optimizedQuery: {
			...e,
			from: new g(e.from.queries.map((e) => yl(e).optimizedQuery))
		},
		sourceWhereClauses: /* @__PURE__ */ new Map()
	};
	let t = bl(e), n = e, r, i = 0;
	for (; i < 10 && !q(n, r);) r = n, n = Cl(n), i++;
	return {
		optimizedQuery: Tl(n),
		sourceWhereClauses: t
	};
}
function bl(e) {
	let t = /* @__PURE__ */ new Map();
	if (!e.where || e.where.length === 0) return t;
	let n = kl(e.where), r = jl(e), i = Nl(n.map((e) => Ml(e, r))), a = Sl(e);
	for (let [n, r] of i.singleSource) xl(e, n) && !a.has(n) && t.set(n, r);
	return t;
}
function xl(e, t) {
	for (let n of j(e.from)) if (n.alias === t) return n.type === "collectionRef" || n.type === "descriptorRef";
	if (e.join) {
		for (let n of e.join) if (n.from.alias === t) return n.from.type === "collectionRef" || n.from.type === "descriptorRef";
	}
	return !1;
}
function Sl(e) {
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
function Cl(e) {
	return wl({
		...e,
		from: Rl(e.from),
		join: e.join?.map((e) => ({
			...e,
			from: e.from.type === "queryRef" ? new m(Cl(e.from.query), e.from.alias, e.from.bindingId) : e.from
		}))
	});
}
function wl(e) {
	if (!e.where || e.where.length === 0 || e.from.type === "unionFrom") return e;
	if (!e.join || e.join.length === 0) {
		if (e.where.length > 1) {
			let t = Gl(kl(e.where));
			return {
				...e,
				where: [t]
			};
		}
		return e;
	}
	let t = kl(e.where.filter((e) => !A(e))), n = jl(e);
	return Pl(e, Nl(t.map((e) => Ml(e, n))));
}
function Tl(e) {
	return {
		...e,
		from: El(e.from),
		join: e.join?.map((e) => ({
			...e,
			from: Dl(e.from)
		}))
	};
}
function El(e) {
	if (e.type === "unionFrom") return new h(e.sources.map((e) => El(e)));
	if (e.type === "unionAll") return new g(e.queries.map((e) => Tl(e)));
	if (e.type === "collectionRef" || e.type === "descriptorRef") return e;
	let t = Tl(e.query);
	if (Ol(t) && e.alias === zl(t)) {
		let n = El(t.from);
		if (n.type === "collectionRef" || n.type === "descriptorRef") return n.bindingId === e.bindingId ? n : new m(t, e.alias, e.bindingId);
		if (n.type === "queryRef") return new m(n.query, e.alias, e.bindingId);
	}
	return new m(t, e.alias, e.bindingId);
}
function Dl(e) {
	return El(e);
}
function Ol(e) {
	return (!e.where || e.where.length === 0) && !e.select && (!e.groupBy || e.groupBy.length === 0) && (!e.having || e.having.length === 0) && (!e.orderBy || e.orderBy.length === 0) && (!e.join || e.join.length === 0) && e.limit === void 0 && e.offset === void 0 && !e.fnSelect && (!e.fnWhere || e.fnWhere.length === 0) && (!e.fnHaving || e.fnHaving.length === 0) && !e.distinct && !e.singleResult;
}
function kl(e) {
	let t = [];
	for (let n of e) {
		let e = k(n);
		t.push(...Al(e));
	}
	return t;
}
function Al(e) {
	if (e.type === "func" && e.name === "and") {
		let t = [];
		for (let n of e.args) t.push(...Al(n));
		return t;
	}
	return [e];
}
function jl(e) {
	return /* @__PURE__ */ new Set([...j(e.from).map((e) => e.bindingId), ...e.join?.map(({ from: e }) => e.bindingId) ?? []]);
}
function Ml(e, t) {
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
function Nl(e) {
	let t = /* @__PURE__ */ new Map(), n = [];
	for (let r of e) if (r.touchedSources.size === 1 && !r.hasNamespaceOnlyRef && !r.hasExternalBinding) {
		let e = Array.from(r.touchedSources)[0];
		t.has(e) || t.set(e, []), t.get(e).push(r.expression);
	} else n.push(r.expression);
	let r = /* @__PURE__ */ new Map();
	for (let [e, n] of t) r.set(e, Gl(n));
	return {
		singleSource: r,
		multiSource: n.length > 0 ? Gl(n) : void 0
	};
}
function Pl(e, t) {
	let n = /* @__PURE__ */ new Set(), r = Sl(e), i = /* @__PURE__ */ new Map();
	for (let [e, n] of t.singleSource) r.has(e) || i.set(e, n);
	let a = Bl(e.from, i, n), o = e.join ? e.join.map((e) => ({
		...e,
		from: Bl(e.from, i, n)
	})) : void 0, s = [], c = e.where?.filter(A) ?? [];
	t.multiSource && s.push(t.multiSource);
	let l = r.size > 0;
	for (let [e, r] of t.singleSource) n.has(e) ? l && c.push(ne(r)) : s.push(r);
	let u = (e) => e.length > 1 ? Gl(e.flatMap((e) => Al(k(e)))) : e[0], d = u(s), f = u(c), p = [...d ? [d] : [], ...f ? [ne(k(f))] : []];
	return {
		...Il(e),
		from: a,
		join: o,
		where: p.length > 0 ? p : []
	};
}
function Fl(e) {
	return {
		...Il(e),
		from: Ll(e.from),
		join: e.join ? e.join.map((e) => ({
			type: e.type,
			on: e.on,
			from: Ll(e.from)
		})) : void 0,
		where: e.where ? [...e.where] : void 0
	};
}
function Il(e) {
	return {
		...e,
		groupBy: e.groupBy ? [...e.groupBy] : void 0,
		having: e.having ? [...e.having] : void 0,
		orderBy: e.orderBy ? [...e.orderBy] : void 0,
		fnWhere: e.fnWhere ? [...e.fnWhere] : void 0,
		fnHaving: e.fnHaving ? [...e.fnHaving] : void 0
	};
}
function Ll(e) {
	return e.type === "collectionRef" || e.type === "descriptorRef" ? e : e.type === "queryRef" ? new m(Fl(e.query), e.alias, e.bindingId) : e.type === "unionAll" ? new g(e.queries.map((e) => Fl(e))) : new h(e.sources.map((e) => Ll(e)));
}
function Rl(e) {
	return e.type === "queryRef" ? new m(Cl(e.query), e.alias, e.bindingId) : e.type === "unionFrom" ? new h(e.sources.map((e) => Rl(e))) : e.type === "unionAll" ? new g(e.queries.map((e) => Cl(e))) : e;
}
function zl(e) {
	return j(e.from)[0]?.alias;
}
function Bl(e, t, n) {
	if (e.type === "unionFrom") return new h(e.sources.map((e) => Bl(e, t, n)));
	if (e.type === "unionAll") return new g(e.queries.map((e) => Fl(e)));
	let r = t.get(e.alias);
	if (!r) return e.type === "collectionRef" || e.type === "descriptorRef" ? e : new m(Fl(e.query), e.alias, e.bindingId);
	if (e.type === "collectionRef" || e.type === "descriptorRef") {
		let t = {
			from: e,
			where: [r]
		};
		return n.add(e.alias), new m(t, e.alias, e.bindingId);
	}
	if (!Hl(e.query, r, e.alias) || Wl(e.query, r, e.alias)) return new m(Fl(e.query), e.alias, e.bindingId);
	let i = e.query.where || [], a = Vl(e.query, r, e.alias);
	if (a === void 0) return new m(Fl(e.query), e.alias, e.bindingId);
	let o = {
		...Fl(e.query),
		where: [...i, a]
	};
	return n.add(e.alias), new m(o, e.alias, e.bindingId);
}
function Vl(e, t, n) {
	let r = zl(e);
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
function Hl(e, t, n) {
	return !(e.distinct || e.select && (as(e.select) || Ul(e.select, t, n)) || e.groupBy?.length || e.having?.length || e.orderBy?.length && (e.limit !== void 0 || e.offset !== void 0) || e.fnSelect || e.fnWhere?.length || e.fnHaving?.length);
}
function Ul(e, t, n) {
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
function Wl(e, t, n) {
	let r = C(t);
	if (r.every((e) => e.path[0] !== n)) return !1;
	if (e.fnSelect) return !0;
	let i = e.select;
	if (!i) return !1;
	let a = Object.keys(i).some((e) => e.startsWith("__SPREAD_SENTINEL__")), o = jl(e);
	for (let t of r) {
		let r = t.path;
		if (r.length < 2 || r[0] !== n) continue;
		let s = i[r[1]];
		if (!s) {
			if (a) return !0;
			continue;
		}
		if (!(s instanceof _) || s.bindingId !== void 0 && !o.has(s.bindingId) || s.path.length < 2) return !0;
		let [c, l] = s.path, u = zl(e);
		if (c !== n && c !== u || l !== r[1]) return !0;
	}
	return !1;
}
function Gl(e) {
	if (e.length === 0) throw new ni();
	return e.length === 1 ? e[0] : new x("and", e);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live/materialized-pipeline.js
var Kl = /* @__PURE__ */ Symbol("bucketFacadeRef"), ql = 0;
function Jl(e, t, n = !1) {
	if (!e.includes?.length && !(t && n)) return {
		pipeline: e.pipeline,
		facades: void 0
	};
	let r = Yl(e, t, /* @__PURE__ */ new WeakMap(), "root");
	return {
		...r,
		facades: Xl(r.facades)
	};
}
function Yl(e, t, n, r) {
	let i = n.get(e)?.[r];
	if (i) return i;
	let a = Ql(Zl(e.pipeline), t, r, e.valueIdentity), o = [];
	for (let t of e.includes ?? []) {
		let i = Yl(t.childCompilationResult, void 0, n, "child");
		o.push(...i.facades);
		let s = tu(i.pipeline, t.childCompilationResult.valueIdentity);
		if (t.materialization === "collection") {
			let n = `bucket-facade-${++ql}`, i = ru(a, t, e.valueIdentity), c = i.pipe(tn(s), K(([e, [, t]]) => [e, t]));
			o.push({
				edgeId: n,
				rows: c,
				activeBuckets: i,
				hasOrderBy: t.hasOrderBy
			}), a = nu(a, t, n, r, e.valueIdentity);
		} else a = eu(a, s, t, r, e.valueIdentity);
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
function Xl(e) {
	return [...new Map(e.map((e) => [e.edgeId, e])).values()];
}
function Zl(e) {
	return e.pipe(K(([e, t]) => {
		let n = t;
		return [e, [
			n[0],
			n[1],
			n[2],
			n[3],
			n[0][ra],
			n[4]
		]];
	}));
}
function Ql(e, t, r, i) {
	return e.pipe(K(([e, n]) => {
		let a = n, o = t ? t(a[0]) : a[5] ?? e;
		return [L(r === "root" ? ["root", o] : [ou(a[2], a[3], i), o]), {
			publicKey: o,
			tuple: a
		}];
	}), ln((e) => {
		let t = e.reduce((e, [, t]) => e + t, 0);
		if (t === 0) return [];
		if (t < 0) throw Error(n(154));
		let r = e.find(([, e]) => e > 0)?.[0];
		if (!r) throw Error(n(155));
		for (let [t, n] of e) n <= 0 || $l(r, t);
		return [[r, 1]];
	}), K(([e, { publicKey: t, tuple: n }]) => [r === "root" ? t : e, n]));
}
function $l(e, t) {
	let [r, i, a, o, s] = e.tuple, [c, l, u, d, f] = t.tuple;
	if (i !== l || !q(r, c) || !q(a, u) || !q(o, d) || !q(s, f)) throw Error(n(156, { publicKey: e.publicKey }));
}
function eu(e, t, r, i, a) {
	let o = t.pipe(ln((e) => {
		let t = [];
		for (let [r, i] of e) {
			if (i < 0) throw Error(n(157));
			for (let e = 0; e < i; e++) t.push(r);
		}
		return t.length === 0 ? [] : (t.sort(su), [[{ value: cu(t, r) }, 1]]);
	}));
	return Ql(e.pipe(K(([e, t]) => {
		let n = t, i = au(n, r.fieldName);
		return [i?.active === !0 ? ou(i.correlationKey, i.parentContext, a) : `inactive:${L(e)}`, [e, n]];
	}), tn(o, "left"), K(([e, [t, n]]) => {
		let [i, a] = t, [o, s, c, l, u, d] = a;
		if (u?.[r.fieldName]?.active !== !0) return [i, [
			o,
			s,
			c,
			l,
			u,
			d
		]];
		let f = n === null ? lu(r.materialization) : n.value;
		return [i, [
			uu(o, r.resultPath, f),
			s,
			c,
			l,
			u,
			d
		]];
	})), void 0, i, a);
}
function tu(e, t) {
	return e.pipe(K(([e, n]) => {
		let [r, i, a, o, , s] = n;
		return [ou(a, o, t), [
			s ?? e,
			r,
			i
		]];
	}));
}
function nu(e, t, n, r, i) {
	return Ql(e.pipe(K(([e, r]) => {
		let a = r, o = au(a, t.fieldName);
		if (o?.active !== !0) return [e, a];
		let s = iu(n, ou(o.correlationKey, o.parentContext, i));
		return [e, [
			uu(a[0], t.resultPath, s),
			a[1],
			a[2],
			a[3],
			a[4],
			a[5]
		]];
	})), void 0, r, i);
}
function ru(e, t, n) {
	return e.pipe(K(([e, r]) => {
		let i = au(r, t.fieldName);
		return [e, i?.active === !0 ? ou(i.correlationKey, i.parentContext, n) : void 0];
	}), gt(([, e]) => e !== void 0), mt(([, e]) => e), K(([, e]) => [e, !0]));
}
function iu(e, t) {
	return { [Kl]: {
		edgeId: e,
		bucketKey: t
	} };
}
function au(e, t) {
	return e[4]?.[t];
}
function ou(e, t, n) {
	return L([n.equality(e ?? null), Zi(t ?? null)]);
}
function su(e, t) {
	let [n, , r] = e, [i, , a] = t;
	if (r !== a) return r === void 0 ? 1 : a === void 0 || r < a ? -1 : 1;
	if ((typeof n == "string" || typeof n == "number") && (typeof i == "string" || typeof i == "number")) return ce(n, i);
	let o = L(n), s = L(i);
	return o < s ? -1 : +(o > s);
}
function cu(e, t) {
	let n = t.scalarField, r = n ? e.map(([, e]) => e[n]) : e.map(([, e]) => e);
	return t.materialization === "array" ? r : t.materialization === "singleton" ? r[0] : r.map((e) => String(e ?? "")).join("");
}
function lu(e) {
	if (e === "array") return [];
	if (e === "concat") return "";
	if (e !== "singleton") throw Error(n(158));
}
function uu(e, t, n) {
	let r = { ...e }, i = r, a = e;
	for (let e = 0; e < t.length - 1; e++) {
		let n = t[e], r = a?.[n], o = Array.isArray(r) ? [...r] : { ...r ?? {} };
		i[n] = o, i = o, a = r;
	}
	return i[t[t.length - 1]] = n, r;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/join-conditions.js
function du(e) {
	if (e.type === "func") {
		if (e.name === "eq" && e.args.length === 2) return [[e.args[0], e.args[1]]];
		if (e.name === "and" && e.args.length > 0) return e.args.flatMap(du);
	}
	throw new xr();
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/builder/query-ir.js
function fu(e) {
	let t = e;
	if (t == null) throw Error(n(237, { received: t === null ? "null" : "undefined" }));
	return e._getQuery();
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/builder/clone-query.js
function pu(e, t) {
	return mu(e, {
		clones: /* @__PURE__ */ new WeakMap(),
		resolveDescriptor: t
	});
}
function mu(e, t) {
	let { clones: n } = t, r = n.get(e);
	if (r) return r;
	let i = { ...e };
	return n.set(e, i), i.from = hu(e.from, t), i.join = e.join?.map((e) => ({
		...e,
		from: gu(e.from, t)
	})), i.select = e.select === void 0 || D(e.select) ? e.select : _u(e.select, t), i;
}
function hu(e, t) {
	return e.type === "unionFrom" ? new h(e.sources.map((e) => gu(e, t))) : e.type === "unionAll" ? new g(e.queries.map((e) => mu(e, t))) : gu(e, t);
}
function gu(e, t) {
	return e.type === "collectionRef" ? new d(e.collection, e.alias, e.bindingId) : e.type === "descriptorRef" ? t.resolveDescriptor ? new d(t.resolveDescriptor(e.descriptor), e.alias, e.bindingId) : new f(e.descriptor, e.alias, e.bindingId) : new m(mu(e.query, t), e.alias, e.bindingId);
}
function _u(e, t) {
	let { clones: n } = t, r = n.get(e);
	if (r) return r;
	let i = {};
	n.set(e, i);
	for (let [n, r] of Object.entries(e)) i[n] = vu(r, t);
	return i;
}
function vu(e, t) {
	let { clones: n } = t;
	if (e instanceof w) {
		let r = n.get(e);
		if (r) return r;
		let i = new w(mu(e.query, t), e.correlationField, e.childCorrelationField, e.fieldName, e.parentFilters, e.parentProjection, e.materialization, e.scalarField);
		return n.set(e, i), i;
	}
	if (e instanceof T) {
		let r = n.get(e);
		if (r) return r;
		let i = new T(e.branches.map((e) => ({
			...e,
			value: vu(e.value, t)
		})), e.defaultValue === void 0 ? void 0 : vu(e.defaultValue, t));
		return n.set(e, i), i;
	}
	return typeof e != "object" || !e || Array.isArray(e) || o(e) || D(e) ? e : _u(e, t);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/builder/index.js
var yu = "unionAll clause", bu = class e {
	constructor(e = {}, t = !1) {
		this.query = t ? e : { ...e };
	}
	bW(t) {
		return new e(t, !0);
	}
	ee(e, t) {
		let n = this.dY(e, t);
		if (n.length !== 1) throw new _r(t);
		return n[0];
	}
	dY(t, n) {
		if (typeof t == "string") throw new br(n, "string");
		let r;
		try {
			r = Object.keys(t);
		} catch {
			throw new br(n, t === null ? "null" : "undefined");
		}
		if (Array.isArray(t)) throw new br(n, "array");
		if (r.length === 0) throw new br(n, "empty object");
		if (n !== yu && r.length !== 1) throw new _r(n);
		let i = [];
		for (let a of r) {
			let r = t[a], o;
			if (r instanceof gl) o = new d(r, a);
			else if (kn(r)) o = new f(r, a);
			else if (r instanceof e) {
				let e = pu(r._getQuery());
				if (!e.from) throw new vr(n);
				o = new m(e, a);
			} else throw new yr(a);
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
			from: new g([t, ...n].map((e) => pu(e._getQuery())))
		});
		let r = this.dY(t, yu), i = r.length === 1 ? r[0][1] : new h(r.map((e) => e[1]));
		return this.bW({
			...this.query,
			from: i
		});
	}
	join(e, t, n = "left") {
		let [r, i] = this.ee(e, "join clause"), a = t(eo([...this.bo(), r], new Map([...this.dH(), [r, i.bindingId]])));
		du(a);
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
		let t = e(eo(this.bo(), this.dH())), n = o(t) ? Z(t) : t;
		if (!D(n)) throw new Cr(xu(n));
		let r = this.query.where || [];
		return this.bW({
			...this.query,
			where: [...r, n]
		});
	}
	having(e) {
		let t = this.bo(), n = e(this.query.select || this.query.fnSelect ? to(t, this.dH()) : eo(t, this.dH())), r = o(n) ? Z(n) : n;
		if (!D(r)) throw new Cr(xu(r));
		let i = this.query.having || [];
		return this.bW({
			...this.query,
			having: [...i, r]
		});
	}
	select(e) {
		let t = this.bo(), n = e(eo(t, this.dH()));
		o(n) && n.__path.length === 1 && (n = { [`__SPREAD_SENTINEL__${n.__path[0]}__0`]: Z(n) });
		let r = wu(n, {
			aliases: t,
			bindingIds: Pu(this._getQuery())
		});
		return this.bW({
			...this.query,
			select: r,
			fnSelect: void 0
		});
	}
	orderBy(e, t = "asc") {
		let n = this.bo(), r = e(this.query.select || this.query.fnSelect ? to(n, this.dH()) : eo(n, this.dH())), i = typeof t == "string" ? {
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
		let t = e(eo(this.bo(), this.dH())), n = Array.isArray(t) ? t.map((e) => Z(e)) : [Z(t)], r = this.query.groupBy || [];
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
		if (!this.query.from) throw new Sr();
		return this.query;
	}
	_bindCollectionSources(t) {
		if (!t || !this.query.from) return this;
		let n = this._getQuery();
		return O(n).some((e) => e.type === "descriptorRef") ? new e(pu(n, t), !0) : this;
	}
};
function xu(e) {
	return e === null ? "null" : e === void 0 ? "undefined" : typeof e == "object" ? "object" : typeof e;
}
function Su(e) {
	return Z(e ?? null);
}
function Cu(e) {
	return Qi(e) && !Array.isArray(e) && !D(e) && !o(e);
}
function wu(e, t, r) {
	if (Array.isArray(e)) return e.some((e) => o(e) || D(e)) ? new x("array", e.map((e) => Z(e ?? null))) : Su(e);
	if (e instanceof bu) {
		if (!r) throw Error(n(114));
		return Mu(e, r, t, "collection");
	}
	if (e instanceof ho) {
		if (!(e.query instanceof bu)) throw Error(n(115));
		if (!r) throw Error(n(116));
		return Mu(e.query, r, t, "array");
	}
	if (e instanceof go) {
		if (!(e.query instanceof bu)) throw Error(n(117));
		if (!r) throw Error(n(118));
		return Mu(e.query, r, t, "concat");
	}
	if (e instanceof _o) return Tu(e, t, r);
	if (!Cu(e)) return Su(e);
	let i = {}, a = 0;
	for (let [r, o] of Object.entries(e)) if (typeof r == "string" && r.startsWith("__SPREAD_SENTINEL__")) {
		let e = r.slice(0, r.lastIndexOf("__"));
		i[`${e}__${++a}`] = o;
	} else if (o instanceof bu) i[r] = Mu(o, r, t, "collection");
	else if (o instanceof ho) {
		if (!(o.query instanceof bu)) throw Error(n(119));
		i[r] = Mu(o.query, r, t, "array");
	} else if (o instanceof go) {
		if (!(o.query instanceof bu)) throw Error(n(120));
		i[r] = Mu(o.query, r, t, "concat");
	} else if (o instanceof vo) {
		if (!(o.query instanceof bu)) throw Error(n(121));
		let e = o.query._getQuery().singleResult ? "singleton" : "array";
		i[r] = Mu(o.query, r, t, e);
	} else i[r] = o instanceof _o ? Tu(o, t, r) : wu(o, t, r);
	return i;
}
function Tu(e, t, r) {
	let i = e.args;
	if (i.length < 2) throw Error(n(122));
	let a = i.length % 2 == 1, o = Math.floor(i.length / 2), s = [];
	for (let e = 0; e < o; e++) s.push({
		condition: Z(i[e * 2]),
		value: wu(i[e * 2 + 1], t, r)
	});
	return new T(s, a ? wu(i[i.length - 1], t, r) : void 0);
}
function Eu(e) {
	return e instanceof _ || e instanceof x || e instanceof S ? C(e) : e instanceof T ? [...e.branches.flatMap((e) => [...C(e.condition), ...Eu(e.value)]), ...e.defaultValue === void 0 ? [] : Eu(e.defaultValue)] : e instanceof w ? [
		e.correlationField,
		...e.parentProjection ?? [],
		...Du(e.query)
	] : Cu(e) ? Object.values(e).flatMap(Eu) : [];
}
function Du(e) {
	let t = new Set(Nu(e)), n = Pu(e), r = [], i = (e) => {
		r.push(...C(e));
	}, a = (e) => {
		i(typeof e == "object" && "expression" in e ? e.expression : e);
	};
	for (let t of e.where ?? []) a(t);
	for (let t of e.join ?? []) i(t.on), t.from.type === "queryRef" && r.push(...Du(t.from.query));
	for (let t of e.groupBy ?? []) i(t);
	for (let t of e.having ?? []) a(t);
	for (let { expression: t } of e.orderBy ?? []) i(t);
	if (e.select && r.push(...Eu(e.select)), e.from.type === "queryRef") r.push(...Du(e.from.query));
	else if (e.from.type === "unionFrom") for (let t of e.from.sources) t.type === "queryRef" && r.push(...Du(t.query));
	else if (e.from.type === "unionAll") for (let t of e.from.queries) r.push(...Du(t));
	let o = /* @__PURE__ */ new Set();
	return r.filter((e) => {
		let r = e.path.length > 1 || e.bindingId !== void 0 ? e.path[0] : void 0, i = JSON.stringify([e.bindingId, e.path]);
		return r == null || r === "$selected" || (e.bindingId === void 0 ? t.has(r) : n.has(e.bindingId)) || o.has(i) ? !1 : (o.add(i), !0);
	});
}
function Ou(e, t) {
	let n = Pu(e), r = [], i = (e) => {
		r.push(...C(e));
	}, a = (e) => {
		i(typeof e == "object" && "expression" in e ? e.expression : e);
	};
	for (let t of e.where ?? []) a(t);
	for (let n of e.join ?? []) i(n.on), n.from.type === "queryRef" && r.push(...Ou(n.from.query, t));
	for (let t of e.groupBy ?? []) i(t);
	for (let t of e.having ?? []) a(t);
	for (let { expression: t } of e.orderBy ?? []) i(t);
	if (e.select && r.push(...Eu(e.select)), e.from.type === "queryRef") r.push(...Ou(e.from.query, t));
	else if (e.from.type === "unionFrom") for (let n of e.from.sources) n.type === "queryRef" && r.push(...Ou(n.query, t));
	else if (e.from.type === "unionAll") for (let n of e.from.queries) r.push(...Ou(n, t));
	let o = /* @__PURE__ */ new Set();
	return r.filter((e) => {
		let r = JSON.stringify([e.bindingId, e.path]);
		return e.path[0] == null || !t.includes(e.path[0]) || e.bindingId !== void 0 && n.has(e.bindingId) || o.has(r) ? !1 : (o.add(r), !0);
	});
}
function ku(e) {
	return [...new Set(Du(e).map((e) => e.path[0]).filter((e) => e !== void 0))];
}
function Au(e, t, n) {
	return C(typeof e == "object" && "expression" in e ? e.expression : e).some((e) => e.path[0] != null && t.includes(e.path[0]) && (e.bindingId === void 0 || !n.has(e.bindingId)));
}
function ju(e, t, n = /* @__PURE__ */ new Set()) {
	if (n.has(e)) return !1;
	n.add(e);
	let r = (e) => t.has(e.bindingId) || e instanceof m && ju(e.query, t, n), i = (e) => e instanceof w ? ju(e.query, t, n) : e instanceof T ? e.branches.some((e) => i(e.value)) || e.defaultValue !== void 0 && i(e.defaultValue) : Cu(e) && Object.values(e).some(i), a = e.from;
	return (a.type === "unionFrom" ? a.sources.some(r) : a.type === "unionAll" ? a.queries.some((e) => ju(e, t, n)) : r(a)) || (e.join?.some((e) => r(e.from)) ?? !1) || e.select !== void 0 && i(e.select);
}
function Mu(e, t, r, i) {
	let a = e._getQuery();
	if (ju(a, r.bindingIds)) throw Error(n(236, { fieldName: t }));
	let o = pu(a), c = Nu(o), l = Pu(o), u = [.../* @__PURE__ */ new Set([...r.aliases, ...ku(o)])], d, f, p = -1, m = -1;
	if (o.where) for (let e = 0; e < o.where.length; e++) {
		let t = o.where[e], n = typeof t == "object" && "expression" in t ? t.expression : t;
		if (n.type === "func" && n.name === "eq" && n.args.length === 2) {
			let t = Iu(n.args[0], n.args[1], u, c, l);
			if (t) {
				d = t.parentRef, f = t.childRef, p = e;
				break;
			}
		}
		if (n.type === "func" && n.name === "and" && n.args.length >= 2) {
			for (let t = 0; t < n.args.length; t++) {
				let r = n.args[t];
				if (r.type === "func" && r.name === "eq" && r.args.length === 2) {
					let n = Iu(r.args[0], r.args[1], u, c, l);
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
	for (let e of h) Au(e, u, l) ? _.push(e) : g.push(e);
	let v = Ou({
		...o,
		where: h
	}, u), y = v.length > 0 ? v : void 0, b = {
		...o,
		where: g.length > 0 ? g : void 0
	}, S = b.select, C = S === void 0 || Cu(S), T = b, E;
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
function Nu(e) {
	let t = new Set(Fu(e.from));
	if (e.join) for (let n of e.join) t.add(n.from.alias);
	return [...t];
}
function Pu(e) {
	let t = /* @__PURE__ */ new Set(), n = e.from;
	if (n.type === "unionFrom") for (let e of n.sources) t.add(e.bindingId);
	else n.type !== "unionAll" && t.add(n.bindingId);
	for (let n of e.join ?? []) t.add(n.from.bindingId);
	return t;
}
function Fu(e) {
	return e.type === "unionFrom" ? e.sources.map((e) => e.alias) : e.type === "unionAll" ? e.queries.flatMap((e) => Nu(e)) : [e.alias];
}
function Iu(e, t, n, r, i) {
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
function Lu(e) {
	return fu(e(new bu()));
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/source-record.js
function Ru() {
	return /* @__PURE__ */ Object.create(null);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/lazy-targets.js
function zu(e, t, n, r, i, a) {
	if (t.type === "unionFrom") return Hu(e, r);
	if (t.type === "queryRef" && Bu(t.query.from)) return Ku(Vu(t.query, n, r));
	if (!i) return [];
	let o = qu(r);
	if (!o) return [];
	let s = M(e, o, i);
	if (!s) return [];
	let c = s.alias || a[n] || n, l = Gu(e, t, {
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
function Bu(e) {
	return e.type === "unionFrom" ? !0 : e.type === "queryRef" ? Bu(e.query.from) : e.type === "unionAll" && e.queries.some((e) => Bu(e.from));
}
function Vu(e, t, n) {
	if (!n || typeof n != "object" || !("type" in n)) return [];
	let r = n;
	if (r.type === "func" && r.name === "coalesce") return Ku(r.args.flatMap((n) => Vu(e, t, n)));
	let i = qu(r);
	return !i || i.path[0] !== t ? [] : Uu(e, new _(i.path.slice(1)));
}
function Hu(e, t) {
	if (!t || typeof t != "object" || !("type" in t)) return [];
	let n = t;
	return n.type === "ref" ? Uu(e, n) : n.type === "func" && n.name === "coalesce" ? Ku(n.args.flatMap((t) => Hu(e, t))) : [];
}
function Uu(e, t) {
	if (t.path.length === 0) return [];
	if (t.path.length === 1) {
		let n = t.path[0], r = e.select?.[n];
		return r ? Hu(e, r) : [];
	}
	let [n, ...r] = t.path, i = Wu(e, n, t.bindingId);
	return i ? i.type === "collectionRef" ? [{
		sourceId: i.sourceId,
		alias: i.alias,
		collection: i.collection,
		path: r
	}] : i.type === "descriptorRef" ? p(i) : i.query.limit !== void 0 || i.query.offset !== void 0 || i.query.singleResult ? [] : Vu(i.query, i.alias, t) : [];
}
function Wu(e, t, n) {
	if (e.join) {
		for (let r of e.join) if (r.from.alias === t && (n === void 0 || r.from.bindingId === n)) return r.from;
	}
	return j(e.from).find((e) => e.alias === t && (n === void 0 || e.bindingId === n));
}
function Gu(e, t, n) {
	if (n.sourceId !== void 0) return ee(e).find((e) => e.sourceId === n.sourceId && e.collection === n.collection);
	if (t.type === "collectionRef" && t.collection === n.collection && t.alias === n.alias) return t;
}
function Ku(e) {
	let t = /* @__PURE__ */ new Set(), n = [];
	for (let r of e) {
		let e = `${r.sourceId}:${JSON.stringify(r.path)}`;
		t.has(e) || (t.add(e), n.push(r));
	}
	return n;
}
function qu(e) {
	if (e instanceof _) return e;
	if (e && typeof e == "object" && "type" in e && e.type === "ref" && Array.isArray(e.path)) {
		let t = e;
		return new _(t.path, t.sourceAlias);
	}
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/parent-routes.js
var Ju = "__tanstack_parent_route_cross__";
function Yu(e, t, n) {
	let r = e.pipe(K(([e, t]) => [Ju, [e, t]])), i = t.pipe(K(([e, t]) => [Ju, [e, t]]));
	return r.pipe(tn(i, "inner"), gt(([, [e, t]]) => e != null && t != null), K(([, [e, t]]) => {
		let [r, i] = e, [a, o] = t;
		return n(r, i, a, o);
	}));
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/ir-stable-identity.js
function Xu(e) {
	return JSON.stringify(Qu(e));
}
function Zu(e) {
	if (e.where === void 0 && !e.orderBy?.length && e.limit === void 0 && (e.offset === void 0 || e.offset === 0) && e.cursor === void 0) return;
	let t = /* @__PURE__ */ new WeakSet(), n = {
		type: "loadSubsetDemand",
		query: id(e, "loadSubset", t)
	};
	if (e.limit !== void 0 && (n.limit = Q(e.limit, "loadSubset.limit", t)), e.offset !== void 0 && e.offset !== 0 && (n.offset = Q(e.offset, "loadSubset.offset", t)), e.cursor !== void 0) {
		let r = {
			whereFrom: fd(e.cursor.whereFrom, "loadSubset.cursor.whereFrom", t, "exact-output"),
			whereCurrent: fd(e.cursor.whereCurrent, "loadSubset.cursor.whereCurrent", t, "exact-output")
		};
		e.cursor.lastKey !== void 0 && (r.lastKey = Q(e.cursor.lastKey, "loadSubset.cursor.lastKey", t)), n.cursor = r;
	}
	return JSON.stringify(n);
}
function Qu(e) {
	return td(e, "query", /* @__PURE__ */ new WeakSet());
}
function $u(e, t) {
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
function ed(e, t, n) {
	let r = e, i = 0;
	for (; r;) {
		let e = n === void 0 ? r.bindings.get(t) : r.bindingIds.get(n);
		if (e !== void 0) return [i, e];
		if (r.hasUnqualifiedOutput) return;
		r = r.parent, i++;
	}
}
function td(e, t, n, r) {
	return nd(e, t, n, $u(e, r));
}
function nd(e, t, n, r) {
	if (e.fnSelect) throw new si(`${t}.fnSelect`, "function select");
	if (e.fnWhere?.length) throw new si(`${t}.fnWhere`, "function where");
	if (e.fnHaving?.length) throw new si(`${t}.fnHaving`, "function having");
	let i = {
		type: "query",
		from: od(e.from, `${t}.from`, n, r)
	};
	return e.select && (i.select = sd(e.select, `${t}.select`, n, r)), e.select || e.from.type !== "unionFrom" && e.join === void 0 && e.groupBy === void 0 || (i.implicitOutput = {
		type: "namespaced",
		aliases: Array.from(r.bindings.keys())
	}), e.join && (i.join = e.join.map((e, i) => ad(e, `${t}.join[${i}]`, n, r))), e.where && (i.where = rd(e.where, `${t}.where`, n, r)), e.groupBy && (i.groupBy = e.groupBy.map((e, i) => fd(e, `${t}.groupBy[${i}]`, n, "exact-output", r))), e.having && (i.having = rd(e.having, `${t}.having`, n, r)), e.orderBy && (i.orderBy = e.orderBy.map((e, i) => ud(e, `${t}.orderBy[${i}]`, n, "ordering-operand", r))), e.limit !== void 0 && (i.limit = Q(e.limit, `${t}.limit`, n)), e.offset !== void 0 && e.offset !== 0 && (i.offset = Q(e.offset, `${t}.offset`, n)), e.distinct && (i.distinct = !0), e.singleResult && (i.singleResult = !0), i;
}
function rd(e, t, n, r) {
	let i = e.map((e, i) => ld(e, `${t}[${i}]`, n, r));
	return i.sort(bd), i.filter((e, t) => t === 0 || bd(e, i[t - 1]) !== 0);
}
function id(e, t, n) {
	let r = { type: "loadSubsetQuery" };
	return e.where !== void 0 && (r.where = fd(e.where, `${t}.where`, n, "exact-output")), e.orderBy?.length && (r.orderBy = e.orderBy.map((e, r) => ud(e, `${t}.orderBy[${r}]`, n, "ordering-operand"))), r;
}
function ad(e, t, n, r) {
	return {
		type: e.type,
		from: od(e.from, `${t}.from`, n, r),
		on: fd(e.on, `${t}.on`, n, "exact-output", r)
	};
}
function od(e, t, n, r) {
	return e.type === "collectionRef" || e.type === "descriptorRef" ? {
		type: "collectionRef",
		collectionId: Q(e.type === "descriptorRef" ? e.descriptor.id : e.collection.id, `${t}.collection.id`, n)
	} : e.type === "unionFrom" ? {
		type: "unionFrom",
		sources: e.sources.map((e, i) => od(e, `${t}.sources[${i}]`, n, r))
	} : e.type === "unionAll" ? {
		type: "unionAll",
		queries: e.queries.map((e, i) => td(e, `${t}.queries[${i}]`, n, r.parent))
	} : {
		type: "queryRef",
		query: td(e.query, `${t}.query`, n, r)
	};
}
function sd(e, t, n, r) {
	return {
		type: "select",
		fields: Object.keys(e).sort().map((i) => [i, cd(e[i], `${t}.${i}`, n, r)])
	};
}
function cd(e, t, n, r) {
	return o(e) ? fd(Z(e), t, n, "exact-output", r) : wd(e) ? fd(e, t, n, "exact-output", r) : Qi(e) ? sd(e, t, n, r) : _d(e, t, n);
}
function ld(e, t, n, r) {
	if (Cd(e)) {
		let i = {
			type: "where",
			expression: fd(e.expression, `${t}.expression`, n, "exact-output", r)
		};
		return e.residual === !0 && (i.residual = !0), i;
	}
	return fd(e, t, n, "exact-output", r);
}
function ud(e, t, n, r = "exact-output", i) {
	return {
		expression: fd(e.expression, `${t}.expression`, n, r, i),
		compareOptions: dd(e.compareOptions, `${t}.compareOptions`, n)
	};
}
function dd(e, t, n) {
	return Q(xi(e), t, n);
}
function fd(e, t, n, r = "exact-output", i) {
	if (e.type === "ref") {
		let r = v(e);
		if (r !== void 0) {
			let a = ed(i, r, e.bindingId);
			return a === void 0 ? {
				type: "ref",
				path: e.path.map((e, r) => Q(e, `${t}.path[${r}]`, n)),
				sourceAlias: Q(r, `${t}.sourceAlias`, n)
			} : {
				type: "ref",
				path: [["binding", ...a], ...y(e).map((e, r) => Q(e, `${t}.path[${r + 1}]`, n))]
			};
		}
		let a = ed(i, e.path[0] ?? "", e.bindingId);
		return {
			type: "ref",
			path: a === void 0 ? e.path.map((e, r) => Q(e, `${t}.path[${r}]`, n)) : [["binding", ...a], ...e.path.slice(1).map((e, r) => Q(e, `${t}.path[${r + 1}]`, n))]
		};
	}
	if (e.type === "val") return {
		type: "val",
		value: r === "equality-operand" ? vd(e.value, `${t}.value`, n, i) : r === "ordering-operand" ? yd(e.value, `${t}.value`, n) : _d(e.value, `${t}.value`, n)
	};
	if (e.type === "func") {
		if (e.name === "in" && e.args.length === 2 && e.args[1]?.type === "val" && Array.isArray(e.args[1].value)) {
			let r = e.args[1].value.map((e, r) => vd(e, `${t}.args[1].value[${r}]`, n, i));
			return pd(e.name, [fd(e.args[0], `${t}.args[0]`, n, "equality-operand", i), {
				type: "val",
				value: ["set", md(r)]
			}]);
		}
		let r = e.name === "eq" ? "equality-operand" : e.name === "gt" || e.name === "gte" || e.name === "lt" || e.name === "lte" ? "ordering-operand" : "exact-output", a = e.args.map((e, a) => fd(e, `${t}.args[${a}]`, n, r, i));
		return pd(e.name, a);
	}
	if (e.type === "agg") return {
		type: "agg",
		name: e.name,
		args: e.args.map((e, r) => fd(e, `${t}.args[${r}]`, n, "exact-output", i))
	};
	if (e.type === "conditionalSelect") {
		let r = {
			type: "conditionalSelect",
			branches: e.branches.map((e, r) => ({
				condition: fd(e.condition, `${t}.branches[${r}].condition`, n, "exact-output", i),
				value: cd(e.value, `${t}.branches[${r}].value`, n, i)
			}))
		};
		return e.defaultValue !== void 0 && (r.defaultValue = cd(e.defaultValue, `${t}.defaultValue`, n, i)), r;
	}
	let a = $u(e.query, i), o = {
		type: "includesSubquery",
		query: nd(e.query, `${t}.query`, n, a),
		correlationField: fd(e.correlationField, `${t}.correlationField`, n, "equality-operand", i),
		childCorrelationField: fd(e.childCorrelationField, `${t}.childCorrelationField`, n, "equality-operand", a),
		fieldName: e.fieldName,
		materialization: e.materialization
	};
	return e.parentFilters && (o.parentFilters = e.parentFilters.map((e, r) => ld(e, `${t}.parentFilters[${r}]`, n, i))), e.parentProjection && (o.parentProjection = e.parentProjection.map((e, r) => fd(e, `${t}.parentProjection[${r}]`, n, "exact-output", i))), e.scalarField !== void 0 && (o.scalarField = e.scalarField), o;
}
function pd(e, t) {
	return (e === "and" || e === "or") && t.length > 0 ? {
		type: "func",
		name: e,
		args: md(t.flatMap((t) => hd(t, e) ? t.args : [t]))
	} : e === "eq" && t.length === 2 ? (t.sort(bd), {
		type: "func",
		name: e,
		args: t
	}) : (e === "gt" || e === "gte" || e === "lt" || e === "lte") && t.length === 2 && bd(t[0], t[1]) > 0 ? {
		type: "func",
		name: gd(e),
		args: [t[1], t[0]]
	} : {
		type: "func",
		name: e,
		args: t
	};
}
function md(e) {
	let t = e.map((e) => ({
		key: JSON.stringify(e),
		value: e
	}));
	return t.sort((e, t) => e.key < t.key ? -1 : +(e.key > t.key)), t.filter((e, n) => n === 0 || e.key !== t[n - 1].key).map((e) => e.value);
}
function hd(e, t) {
	return typeof e == "object" && !!e && !Array.isArray(e) && e.type === "func" && e.name === t && Array.isArray(e.args);
}
function gd(e) {
	switch (e) {
		case "gt": return "lt";
		case "gte": return "lte";
		case "lt": return "gt";
		case "lte": return "gte";
	}
}
function Q(e, t, n) {
	if (e === null) return ["null"];
	if (typeof e == "string") return ["string", e];
	if (typeof e == "boolean") return ["boolean", e];
	if (typeof e == "number") return Number.isNaN(e) ? ["number", "NaN"] : e === Infinity ? ["number", "Infinity"] : e === -Infinity ? ["number", "-Infinity"] : Object.is(e, -0) ? ["number", "-0"] : ["number", e];
	if (e === void 0) return ["undefined"];
	if (typeof e == "bigint") return ["bigint", e.toString()];
	if (typeof e == "function") throw new si(t, "function value");
	if (typeof e == "symbol") throw new si(t, "symbol value");
	if (o(e)) return fd(Z(e), t, n);
	if (Array.isArray(e)) return Sd(e, t, n, () => ["array", e.map((e, r) => Q(e, `${t}[${r}]`, n))]);
	if (e instanceof Date) {
		let n = e.getTime();
		if (Number.isNaN(n)) throw new si(t, "invalid Date");
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
	if (e instanceof Map) return Sd(e, t, n, () => {
		let r = Array.from(e.entries(), ([e, r], i) => [Q(e, `${t}.key[${i}]`, n), Q(r, `${t}.value[${i}]`, n)]);
		return r.sort(bd), ["Map", r];
	});
	if (e instanceof Set) return Sd(e, t, n, () => {
		let r = Array.from(e, (e, r) => Q(e, `${t}[${r}]`, n));
		return r.sort(bd), ["Set", r];
	});
	if (Qi(e)) return xd(e, t, n);
	throw new si(t, "non-plain object value");
}
function _d(e, t, n) {
	return typeof e == "object" && e || typeof e == "function" || typeof e == "symbol" ? bi(e) : Q(e, t, n);
}
function vd(e, t, n, r) {
	if (o(e)) return fd(Z(e), t, n, "equality-operand", r);
	if (typeof e == "number" && Object.is(e, -0)) return Q(0, t, n);
	if (typeof Buffer < "u" && e instanceof Buffer || e instanceof Uint8Array) return [
		"binary",
		"Uint8Array",
		Array.from(e)
	];
	let i = Fi(e);
	return i === e ? typeof e == "object" && e || typeof e == "function" || typeof e == "symbol" ? bi(e) : Q(e, t, n) : Q(i, t, n);
}
function yd(e, t, n) {
	if (typeof e == "number" && Object.is(e, -0)) return Q(0, t, n);
	if (e instanceof Date && Number.isNaN(e.getTime())) return Q(NaN, t, n);
	let r = Fi(e);
	if (r !== e && !(e instanceof Uint8Array)) return Q(r, t, n);
	try {
		return Q(e, t, n);
	} catch (t) {
		if (t instanceof si && typeof e == "object" && e) return bi(e);
		throw t;
	}
}
function bd(e, t) {
	let n = JSON.stringify(e), r = JSON.stringify(t);
	return n < r ? -1 : +(n > r);
}
function xd(e, t, n) {
	return Sd(e, t, n, () => ["object", Object.keys(e).sort().map((r) => [r, Q(e[r], `${t}.${r}`, n)])]);
}
function Sd(e, t, n, r) {
	if (n.has(e)) throw new si(t, "circular value");
	n.add(e);
	try {
		return r();
	} finally {
		n.delete(e);
	}
}
function Cd(e) {
	return "expression" in e;
}
function wd(e) {
	if (typeof e != "object" || !e) return !1;
	let t = e.type;
	return t === "agg" || t === "conditionalSelect" || t === "func" || t === "ref" || t === "val" || t === "includesSubquery";
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/query-equivalence.js
function Td(e, t) {
	if (!q(Ed(e), Ed(t))) return !1;
	try {
		return Xu(e) === Xu(t);
	} catch (e) {
		if (e instanceof si) return !1;
		throw e;
	}
}
function Ed(e) {
	return {
		from: Dd(e.from),
		select: e.select,
		join: e.join?.map((e) => ({
			from: Dd(e.from),
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
function Dd(e) {
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
			query: Ed(e.query),
			alias: e.alias
		};
		case "unionFrom": return {
			type: e.type,
			sources: e.sources.map(Dd)
		};
		case "unionAll": return {
			type: e.type,
			queries: e.queries.map(Ed)
		};
	}
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/joins.js
var Od = 0;
function kd(e, t, n) {
	return Yu(e, t, (e, t, r, i) => [L([
		n.equality(e),
		n.equality(r),
		Zi(i)
	]), oa({ ...t }, r, i)]);
}
function Ad(e, t) {
	let n = da(t);
	if (n) return oa({
		...Xi(n.parentContext),
		[e]: n.value,
		[na]: n.publicKey
	}, n.correlationKey, n.parentContext);
	if (typeof t != "object" || !t) return { [e]: t };
	let r = sa(t), i = r ? la(t) : t, a = {
		...Xi(r?.parentContext),
		[e]: i
	};
	return r && oa(a, r.correlationKey, r.parentContext), a;
}
function jd(e, t, n, r) {
	let i = ca(e, t);
	return L([
		r.equality(i?.correlationKey),
		Zi(i?.parentContext ?? null),
		n
	]);
}
function Md(e, t, n, r, i, a, o) {
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
	return c[2] = s, [a ? jd(t, n, u, o) : L(u), c];
}
function Nd(e, t, n = /* @__PURE__ */ new Set()) {
	let r = {
		id: `lazy-demand-${++Od}`,
		path: t.path,
		collectionId: t.collection.id,
		initialKeys: new Set(n)
	}, i = e[t.sourceId] ??= {};
	return (i.plans ??= []).push(r), r;
}
function Pd(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _, v, y, b, x, S) {
	let C = e, w = new Set(j(h).map((e) => e.bindingId));
	for (let e of t) C = Fd(C, e, n, r, i, a, o, s, c, l, u, d, f, p, m, g, _, v, y, b, x, w, S), w.add(e.from.bindingId);
	return C;
}
function Fd(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _, v, y, b, x, S) {
	let w = t.from.type === "collectionRef", T = t.from.alias, E = Object.keys(n), D = (e) => {
		let n = Id(e);
		return e.bindingId === void 0 ? n === T ? "joined" : n && (E.includes(n) || m.from.type === "unionAll") ? "main" : "unknown" : e.bindingId === t.from.bindingId ? "joined" : x.has(e.bindingId) ? "main" : "ancestor";
	}, O = du(t.on).map(([e, t]) => Ld(e, t, T, D)), { mainExpr: ee, joinedExpr: k } = O[0], te = O.some(({ joinedExpr: e }) => C(e).some((e) => {
		let t = D(e);
		return t === "ancestor" || t === "unknown";
	})), A = S !== void 0 && (t.from.type === "queryRef" || (t.type === "right" || t.type === "full") && !y || te), { alias: ne, input: j, collectionId: re } = Rd(t.from, a, c, l, u, d, f, p, o, s, h, g, _, v, b, A ? S : void 0);
	if (ne !== T) throw new Vr();
	n[T] = j, w && (g[T] = re);
	let M = c[r], N = c[re];
	if (!M) throw new Lr(r);
	if (!N) throw new Lr(re);
	let ie = Hd(t.type, M, N, y), P = A ? void 0 : ie.activeSource, F = ie.lazySource, ae = O.map((e) => X(e.mainExpr)), oe = O.map((e) => X(e.joinedExpr)), se = e.pipe(K(([e, t]) => Md(e, t, i, "main", ae, A, b))), I = j.pipe(K(([e, t]) => Md(e, Ad(T, t), T, "joined", oe, A, b)));
	if (![
		"inner",
		"left",
		"right",
		"full"
	].includes(t.type)) throw new zr(t.type);
	if (P) {
		let e = P === "main" ? t.from : m.from, n = e.type === "queryRef" && (e.query.limit !== void 0 || e.query.offset !== void 0 || e.query.singleResult), r = e.type === "unionAll" ? [] : zu(m, e, P === "main" ? T : i, P === "main" ? k : ee, F, _);
		if (!n && r.length > 0) {
			for (let e of r) d.add(e.sourceId);
			let e = r.map((e) => Nd(u, e)), t = /* @__PURE__ */ new Map(), n = P === "main" ? se : I;
			for (let e of r) {
				let t = e.path[0];
				t && xo(t, e.path, e.collection);
			}
			let i = n.pipe(dn((n) => {
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
			P === "main" ? se = i : I = i;
		}
	}
	return se.pipe(tn(I, t.type), Vd(T, E));
}
function Id(e) {
	return v(e) ?? e.path[0];
}
function Ld(e, t, n, r) {
	let i = C(e), a = C(t), o = new Set(i.map(r)), s = new Set(a.map(r)), c = o.has("main") || o.has("ancestor"), l = s.has("main") || s.has("ancestor"), u = o.has("joined"), d = s.has("joined");
	if (c && !u && d && !s.has("main")) return {
		mainExpr: e,
		joinedExpr: t
	};
	if (u && !o.has("main") && l && !d) return {
		mainExpr: t,
		joinedExpr: e
	};
	throw i.length === 0 || a.length === 0 ? new Vr() : i.length === 1 && a.length === 1 && (i[0].bindingId !== void 0 && a[0].bindingId !== void 0 ? i[0].bindingId === a[0].bindingId : Id(i[0]) === Id(a[0])) ? new Br(Id(i[0])) : c ? d ? new Wr() : new Ur(n) : new Hr(Id(i[0]));
}
function Rd(e, t, n, r, i, a, o, s, c, l, u, d, f, m, h, g) {
	switch (e.type) {
		case "descriptorRef": return p(e);
		case "collectionRef": {
			let n = t[e.sourceId];
			if (!n) throw new Mr(e.alias, e.collection.id, Object.keys(t));
			return d[e.alias] = e.collection.id, {
				alias: e.alias,
				input: g ? kd(n, g, h) : n,
				collectionId: e.collection.id
			};
		}
		case "queryRef": {
			let p = l.get(e.query), h = u(p && Td(e.query, p) ? p : e.query, t, n, r, i, a, o, s, c, l, g);
			Object.assign(d, h.aliasToCollectionId), Object.assign(f, h.aliasRemapping);
			let _ = l.has(e.query), v = Bd(e.query);
			if (_ || v === void 0 || e.alias !== v) for (let [e, t] of h.sourceWhereClauses) m.set(e, t);
			let y = Object.keys(h.aliasToCollectionId).find((e) => h.aliasToCollectionId[e] === h.collectionId);
			y && y !== e.alias && (f[e.alias] = y);
			let b = h.pipeline.pipe(K((e) => {
				let [t, [n, r, i, a, o]] = e;
				return g ? [t, ua(n, i, a, o)] : [t, n];
			}));
			return {
				alias: e.alias,
				input: b,
				collectionId: h.collectionId
			};
		}
		default: throw new Gr(e.type);
	}
}
function zd(e, t) {
	return typeof t == "number" && !Number.isFinite(t) ? { number: String(t) } : t;
}
function Bd(e) {
	return j(e.from)[0]?.alias;
}
function Vd(e, t) {
	return (n) => n.pipe(K((n) => {
		let [r, [i, a]] = n, o = i?.[0], s = i?.[1], c = a?.[0], l = a?.[1], u = Object.assign({}, s ?? l);
		if (i == null) for (let e of t) delete u[e];
		return l ? u[e] = l[e] : delete u[e], [JSON.stringify([o ?? null, c ?? null], zd), u];
	}));
}
function Hd(e, t, n, r) {
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
function Ud(e) {
	return e instanceof b ? e.value : e;
}
var Wd = /* @__PURE__ */ new Set([
	"__proto__",
	"prototype",
	"constructor"
]);
function Gd(e) {
	for (let t of e) if (Wd.has(t)) throw new Tr(t);
}
function Kd(e, t, n) {
	Gd(e.targetPath);
	let r = e.source(t);
	if (r && typeof r == "object") {
		let t = n, i = e.targetPath;
		if (i.length === 0) for (let [e, t] of Object.entries(r)) n[e] = Ud(t);
		else for (let e = 0; e < i.length; e++) {
			let n = i[e];
			if (e === i.length - 1) {
				let e = t[n] ??= {};
				if (typeof e == "object") for (let [t, n] of Object.entries(r)) e[t] = Ud(n);
			} else {
				let e = t[n];
				typeof e == "object" && e || (t[n] = {}), t = t[n];
			}
		}
	}
}
function qd(e, t, n) {
	let r = e.alias.split(".");
	if (Gd(r), r.length === 1) n[e.alias] = e.compiled(t);
	else {
		let i = n;
		for (let e = 0; e < r.length - 1; e++) {
			let t = r[e], n = i[t];
			typeof n == "object" && n || (i[t] = {}), i = i[t];
		}
		i[r[r.length - 1]] = Ud(e.compiled(t));
	}
}
function Jd([e, t], n) {
	let r = {};
	for (let e of n) e.kind === "merge" ? Kd(e, t, r) : qd(e, t, r);
	return [e, {
		...t,
		$selected: r
	}];
}
function Yd(e, t, n) {
	if (!$d(t)) {
		let n = Zd(t);
		return e.pipe(K(([e, t]) => [e, {
			...t,
			$selected: n(t)
		}]));
	}
	let r = [];
	return ef([], t, r), e.pipe(K((e) => Jd(e, r)));
}
function Xd(e) {
	let t = [];
	return ef([], e, t), (e) => {
		let n = {};
		for (let r of t) r.kind === "merge" ? Kd(r, e, n) : qd(r, e, n);
		return n;
	};
}
function Zd(e) {
	return e == null ? () => e : tf(e) ? Qd(e) : e instanceof b ? () => e.value : e.type === "includesSubquery" ? () => null : $d(e) ? Xd(e) : D(e) ? X(e) : () => e;
}
function Qd(e) {
	let t = e.branches.map((e) => ({
		condition: X(e.condition),
		value: Zd(e.value)
	})), n = e.defaultValue === void 0 ? void 0 : Zd(e.defaultValue);
	return (e) => {
		for (let n of t) if (Ea(n.condition(e))) return n.value(e);
		return n === void 0 ? null : n(e);
	};
}
function $d(e) {
	return e && typeof e == "object" && !D(e);
}
function ef(e, t, n) {
	for (let [r, i] of Object.entries(t)) {
		if (r.startsWith("__SPREAD_SENTINEL__") || Gd(r.split(".")), r.startsWith("__SPREAD_SENTINEL__")) {
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
		if (tf(t)) n.push({
			kind: "field",
			alias: [...e, r].join("."),
			compiled: Qd(t)
		});
		else if (t && t.type === "includesSubquery") n.push({
			kind: "field",
			alias: [...e, r].join("."),
			compiled: () => null
		});
		else if ($d(t)) ef([...e, r], t, n);
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
function tf(e) {
	return e instanceof T || typeof e == "object" && !!e && e.type === "conditionalSelect" && Array.isArray(e.branches);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/compiler/index.js
function nf(e, t = /* @__PURE__ */ new Set()) {
	if (e instanceof bu) return "a child query builder";
	if (e instanceof ho) return "toArray()";
	if (e instanceof go) return "concat(toArray())";
	if (e instanceof vo) return "materialize()";
	if (e instanceof _o) return "caseWhen()";
	if (D(e)) return e && typeof e == "object" && "name" in e && typeof e.name == "string" ? `${e.name}()` : "a query expression";
	if (typeof e != "object" || !e || t.has(e)) return;
	t.add(e);
	let n = [...Object.keys(e), ...Object.getOwnPropertySymbols(e).filter((t) => Object.prototype.propertyIsEnumerable.call(e, t))];
	for (let r of n) {
		let n = e[r], i = nf(n, t);
		if (i) return i;
	}
}
function rf(e) {
	let t = nf(e);
	if (t) throw new Or(t);
}
function af(e, t, n) {
	let r = sa(e)?.parentContext, i = Xi(r), a = i === void 0 ? {} : { ...i }, o = { ...qi(r) }, s = [];
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
	return Ki(a, [Zi(r), s], o);
}
function of(e, t, n, r) {
	return Yu(e, t, (e, t, i, a) => {
		let o = {
			...Xi(a),
			...t
		};
		return o[n] = {
			...o[n],
			[na]: o[n]?.[na] ?? e
		}, oa(o, i, a), [L([
			r.equality(e),
			r.equality(i),
			Zi(a)
		]), o];
	});
}
function sf(e, t) {
	return ca(e, t)?.correlationKey;
}
function cf(e, t) {
	return ca(e, t)?.parentContext ?? null;
}
function lf(e, t) {
	if (e == null || t == null) return !1;
	let n = Fi(e), r = Fi(t);
	return Object.is(n, r) || typeof n == "number" && typeof r == "number" && Number.isNaN(n) && Number.isNaN(r);
}
var uf = /* @__PURE__ */ new WeakMap();
function df(e) {
	return vl(uf, e, Wi);
}
function ff(...e) {
	return pf(e, !1);
}
function pf([e, t, r, i, a, o, s, c, l = /* @__PURE__ */ new WeakMap(), u = /* @__PURE__ */ new WeakMap(), d, f, p = !1], m) {
	let h = d === void 0 ? l.get(e) : void 0;
	if (h) return h;
	let g = df(l);
	m || bf(e);
	let _ = ee(e), { optimizedQuery: v, sourceWhereClauses: y } = yl(e), b = hf(e, y), x = v;
	u.set(x, e), kf(x, e, u);
	let S = Object.assign(Ru(), t);
	gf(_, S);
	let C = {}, w = {}, T = {}, { alias: E, collectionId: D, pipeline: O, sources: te, sourceIncludes: A, directIncludes: ne, isUnionFrom: j, isParentRouted: re } = xf(x.from, S, r, i, a, o, s, Gf, l, u, C, w, b, d);
	Object.assign(T, te);
	let M = d !== void 0 || A.length > 0 || ne.length > 0, N = O, ie = f?.path[0], P = !j && !re && d !== void 0 && f !== void 0 && ie === E;
	if (d && f && P) {
		let e = T[E], t = e, n = f.path.slice(1), r = e.pipe(K(([e, t]) => {
			let r = Wf(t, n);
			return [g.serializeEquality(r), [
				e,
				t,
				r
			]];
		})), i = d.pipe(K(([e, t]) => [g.serializeEquality(e), t]), ln((e) => e.map(([e, t]) => [e, +(t > 0)])));
		t = r.pipe(tn(i, "inner")).pipe(gt(([e, [t]]) => t != null), K(([e, [t, n]]) => {
			let [r, i, a] = t, o = oa({
				...i,
				[na]: r
			}, a, n);
			return [n == null ? r : L([g.equality(r), Zi(n)]), o];
		})), T[E] = t, N = Cf(t, E);
	} else d && !re && (N = of(O, d, E, g));
	x.join && x.join.length > 0 && (N = Pd(N, x.join, T, D, E, S, l, u, r, i, a, o, s, Gf, e, x.from, (...e) => pf(e, !0), C, w, b, P, g, d));
	let F = x.join?.some(({ type: e }) => e === "right" || e === "full");
	if (d && f && (!P || F)) {
		let e = X(f);
		N = N.pipe(gt(([, t]) => lf(e(t), sf(t, E))));
	}
	if (x.where && x.where.length > 0) for (let e of x.where) {
		let t = X(k(e));
		N = N.pipe(gt(([e, n]) => ba(t(n))));
	}
	if (x.fnWhere && x.fnWhere.length > 0) for (let e of x.fnWhere) N = N.pipe(gt(([t, n]) => {
		let r = M ? pa(n) : n;
		return ba(e(r));
	}));
	let ae = [...ne, ...A.map(({ include: e }) => e)], oe = !!x.fnSelect && ae.length > 0, se = x.select ? [] : [...ne], I = [], ce = [...A.map(({ sourceAlias: e, include: t }) => ({
		include: t,
		keyPrefix: `${e}.`,
		paths: x.select == null ? x.fnSelect && !oe ? [] : [{
			path: [e, ...t.resultPath],
			guards: []
		}] : Mf(x.select, [e, ...t.resultPath]),
		route: (n) => Kf(n[e], t.fieldName)
	})), ...(x.select ? ne : []).map((e) => ({
		include: e,
		keyPrefix: "",
		paths: Mf(x.select, e.resultPath),
		route: (t) => Kf(t, e.fieldName)
	}))];
	for (let { include: e, keyPrefix: t, paths: n, route: r } of ce) for (let { path: i, guards: a } of n) {
		let n = zf(t + i.join("."), I);
		se.push({
			...e,
			fieldName: n,
			resultPath: i
		}), I.push({
			fieldName: n,
			getRouting: Jf(a, r)
		});
	}
	let le = x.select !== void 0 && as(x.select), ue = (x.orderBy?.length ?? 0) > 0, R = ue || !!x.singleResult, de = [];
	if (x.select) {
		let t = Ff(x.select);
		if (t.length > 0 && ((x.groupBy?.length ?? 0) > 0 || le)) throw new qr(t[0].path.join("."));
		t.length > 0 && (x = {
			...x,
			select: { ...x.select }
		});
		for (let { key: n, path: c, subquery: d, guards: f } of t) {
			let t = zf(n, I), m = X(d.correlationField), h = d.parentProjection?.map((e) => ({
				alias: e.path[0],
				field: e.path.slice(1),
				bindingKey: e.bindingId ? JSON.stringify([e.bindingId, e.path.slice(1)]) : void 0,
				compiled: X(e)
			})) ?? [], _ = Jf(f, (e) => ({
				active: !0,
				correlationKey: m(e),
				parentContext: h.length > 0 ? af(e, h, g) : null
			})), v = (n) => {
				let f = (n ? n.pipe(K(([, [e]]) => qf(e, t))) : N.pipe(K(([, e]) => _(e)))).pipe(gt((e) => e.active), K((e) => [e.correlationKey, e.parentContext]), ln((e) => e.map(([e, t]) => [e, +(t > 0)]))), m = d.childCorrelationField.path[0], h = d.query.from.type === "collectionRef" ? d.query.from.collection : void 0, v = zu(d.query, d.query.from, m, d.childCorrelationField, h, w);
				if (v.length > 0) {
					for (let e of v) {
						o.add(e.sourceId);
						let t = e.path[0];
						t && xo(t, e.path, e.collection);
					}
					let t = Yf(e, d.correlationField), r = !p && (!n || x.singleResult && x.offset === void 0 && (x.limit ?? 1) > 0 && t.size === 1) ? t : /* @__PURE__ */ new Set(), i = v.map((e) => Nd(a, e, r)), s = /* @__PURE__ */ new Map();
					f = f.pipe(dn((e) => {
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
				let y = pf([
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
					Gf,
					l,
					u,
					f,
					d.childCorrelationField,
					p || R
				], !0);
				for (let [e, t] of y.sourceWhereClauses) b.set(e, t);
				se.push({
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
			R ? de.push(v) : v(), I.push({
				fieldName: t,
				getRouting: _
			}), x = {
				...x,
				select: Hf(x.select, c).value
			};
		}
	}
	if (x.distinct && !x.fnSelect && !x.select && x.from.type !== "unionAll") throw new Er();
	if (x.fnSelect && x.groupBy && x.groupBy.length > 0) throw new Dr();
	let fe = I, z = (e) => Object.fromEntries(fe.map(({ fieldName: t, getRouting: n }) => [t, n(e)]));
	if (oe) {
		if (!ae.every(mf)) throw Error(n(128));
		N = Jl({
			pipeline: N.pipe(K(([e, t]) => [e, [{
				...t,
				[ra]: {
					...t[ra],
					...z(t)
				}
			}, void 0]])),
			includes: se,
			valueIdentity: g,
			collectionId: D,
			sourceWhereClauses: b,
			aliasToCollectionId: C,
			aliasRemapping: w
		}).pipeline.pipe(K(([e, [t]]) => {
			let n = { ...t };
			return delete n[ra], [e, n];
		})), se = [], I = [];
	}
	if (x.fnSelect) {
		let e = (e) => {
			let t = x.fnSelect(e);
			return rf(t), t;
		}, t = (t) => {
			let n = M ? pa(t) : t, r = e(n), i = r;
			if (r && typeof r == "object" && (Array.isArray(r) || Qi(r))) {
				i = Array.isArray(r) ? [...r] : { ...r };
				let e = t[ra];
				e && (i[ra] = e);
			}
			return {
				...t,
				$selected: i
			};
		};
		N = N.pipe(K(([e, n]) => [e, t(n)]));
	} else x.select ? !le && !(x.groupBy && x.groupBy.length > 0) && (N = Yd(N, x.select)) : N = N.pipe(K(([e, t]) => {
		let n = da(t), r = j && n ? n.value : !j && !x.join && !x.groupBy ? t[E] : t;
		return [e, {
			...t,
			$selected: r
		}];
	}));
	I.length > 0 && (N = N.pipe(K(([e, t]) => {
		let n = Array.isArray(t.$selected) ? [...t.$selected] : { ...t.$selected };
		return n[ra] = z(t), [e, {
			...t,
			$selected: n
		}];
	})));
	let pe = d ? E : void 0, me = new Map(Af(x).map((e) => [e.alias, e.bindingId])), B = x.from.type === "unionAll", he = (e) => {
		let t = me.get(e.path[0]);
		return t === void 0 ? B && e.bindingId === void 0 && e.path[0] !== "$selected" : (e.bindingId ?? t) === t;
	};
	if (x.groupBy && x.groupBy.length > 0 ? N = Xo(N, x.groupBy, g, he, x.having, x.select, x.fnHaving, D, pe, M || I.length > 0) : le && (N = Xo(N, [], g, he, x.having, x.select, x.fnHaving, D, pe, M || I.length > 0)), x.having && (!x.groupBy || x.groupBy.length === 0) && !le) throw new Ar();
	if (x.fnHaving && x.fnHaving.length > 0 && (!x.groupBy || x.groupBy.length === 0)) for (let e of x.fnHaving) N = N.pipe(gt(([t, n]) => {
		let r = M || I.length > 0 ? pa(n) : n;
		return e(r);
	}));
	!le && x.distinct && (N = _f(N, x, E, d !== void 0)), x.distinct && (N = N.pipe(mt(([e, t]) => t.$selected)));
	let ge = (e, t, n) => {
		let r = Df(Ef(t.$selected), t);
		return d ? [e, [
			fa(r),
			n,
			sf(t, E),
			cf(t, E),
			Of(t, E, e)
		]] : [e, [r, n]];
	}, V = x.singleResult ? Math.min(x.limit ?? 1, 1) : x.limit;
	if (!ue && (x.limit !== void 0 || x.offset !== void 0)) throw new jr();
	let _e, ve;
	if (ue || x.singleResult) {
		let t = d && (V !== void 0 || x.offset !== void 0) ? (e, t) => {
			let n = sf(t, E), r = cf(t, E);
			return r == null ? g.equality(n) : L([g.equality(n), Zi(r)]);
		} : void 0, n = hs(e, N, x.orderBy ?? [], x.select || {}, r[D], s, (e) => ve = e, V, x.offset, t);
		for (let e of de) e(n);
		ve && c(ve), _e = n.pipe(K(([e, [t, n]]) => ge(e, t, n)));
	} else _e = N.pipe(K(([e, t]) => ge(e, t, void 0)));
	let ye = {
		collectionId: D,
		pipeline: _e,
		valueIdentity: g,
		sourceWhereClauses: b,
		aliasToCollectionId: C,
		aliasRemapping: w,
		includes: se.length > 0 ? se : void 0
	};
	return d === void 0 && l.set(e, ye), ye;
}
function mf(e) {
	return e.materialization !== "collection" && (e.childCompilationResult.includes ?? []).every(mf);
}
function hf(e, t) {
	let n = [...j(e.from), ...e.join?.map(({ from: e }) => e) ?? []].filter((e) => e.type === "collectionRef"), r = new Map(n.map((e) => [e.alias, e])), i = /* @__PURE__ */ new Map();
	for (let [e, n] of t) {
		let t = r.get(e);
		t && i.set(t.sourceId, n);
	}
	return i;
}
function gf(e, t) {
	for (let n of e) {
		let e = t[n.sourceId] ?? t[n.alias];
		e && (t[n.sourceId] = e);
	}
}
function _f(e, t, r, i) {
	let a = (t.orderBy ?? []).map(({ expression: e }) => X(e)), o = (e) => ({
		value: e.$selected,
		routing: e.$selected?.[ra],
		outerCorrelation: i ? sf(e, r) : void 0,
		parentContext: i ? cf(e, r) : void 0,
		order: a.map((t) => t(e))
	});
	return e.pipe(ln((e) => {
		let t = e.reduce((e, [, t]) => e + t, 0);
		if (t === 0) return [];
		if (t < 0) throw Error(n(129));
		let r = e.find(([, e]) => e > 0)?.[0];
		if (!r) throw Error(n(130));
		let i = o(r);
		for (let [t, r] of e) if (r > 0 && !q(i, o(t))) throw Error(n(131));
		return [[r, 1]];
	}));
}
function vf(e, t) {
	for (let r of C(e)) if (r.bindingId !== void 0 && !t.has(r.bindingId)) throw new wr(n(238, { path: r.path }));
}
function yf(e, t) {
	if (!(e instanceof w)) {
		if (E(e)) vf(e, t);
		else if (e instanceof T) {
			for (let n of e.branches) vf(n.condition, t), yf(n.value, t);
			e.defaultValue !== void 0 && yf(e.defaultValue, t);
		} else if (Bf(e)) for (let n of Object.values(e)) yf(n, t);
	}
}
function bf(e, t = /* @__PURE__ */ new Set()) {
	let r = Af(e).map((e) => e.alias);
	for (let [e, t] of r.entries()) if (r.indexOf(t) !== e) throw new wr(n(211, { alias: t }));
	let i = new Set(t);
	if (e.from.type === "unionAll") for (let n of e.from.queries) bf(n, t);
	else for (let n of j(e.from)) n.type === "queryRef" && bf(n.query, t), i.add(n.bindingId);
	if (e.join) for (let n of e.join) {
		n.from.type === "queryRef" && bf(n.from.query, t);
		let e = new Set(i);
		e.add(n.from.bindingId), vf(n.on, e), i.add(n.from.bindingId);
	}
	for (let t of e.where ?? []) vf(k(t), i);
	for (let t of e.groupBy ?? []) vf(t, i);
	for (let t of e.having ?? []) vf(te(t), i);
	for (let { expression: t } of e.orderBy ?? []) vf(t, i);
	if (e.select) {
		yf(e.select, i);
		for (let { subquery: t } of Ff(e.select)) {
			vf(t.correlationField, i);
			let e = new Set(i);
			for (let n of Af(t.query)) e.add(n.bindingId);
			vf(t.childCorrelationField, e);
			for (let n of t.parentFilters ?? []) vf(k(n), e);
			bf(t.query, i);
			let r = new Set((t.parentProjection ?? []).map((e) => JSON.stringify([e.bindingId, e.path]))), a = [...Du(t.query), ...(t.parentFilters ?? []).flatMap((e) => C(k(e)))];
			for (let e of a) if (e.bindingId !== void 0 && i.has(e.bindingId) && !r.has(JSON.stringify([e.bindingId, e.path]))) throw new wr(n(239, { path: e.path }));
		}
	}
}
function xf(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
	let m = df(c);
	if (e.type === "unionAll") return Sf(e, t, n, r, i, a, o, s, c, l, u, d, f, p);
	if (e.type !== "unionFrom") {
		let { alias: m, input: h, collectionId: g, sourceIncludes: _, isParentRouted: v } = Tf(e, t, n, r, i, a, o, s, c, l, u, d, f, p);
		return {
			alias: m,
			pipeline: Cf(h, m),
			collectionId: g,
			sources: { [m]: h },
			sourceIncludes: _,
			directIncludes: [],
			isUnionFrom: !1,
			isParentRouted: v
		};
	}
	if (e.sources.length === 0) throw new Nr("empty unionFrom");
	let h = {}, g = [], _, v = "", y = "";
	for (let b of e.sources) {
		let { alias: e, input: x, collectionId: S, sourceIncludes: C, isParentRouted: w } = Tf(b, t, n, r, i, a, o, s, c, l, u, d, f, p);
		v || (v = e, y = S), h[e] = x, g.push(...C);
		let T = (p && !w ? of(Cf(x, e), p, e, m) : Cf(x, e)).pipe(K(([t, n]) => {
			let r = `${e}:${wf(t)}`, i = n[e]?.[na] ?? t, a = `${e}:${wf(i)}`;
			return [r, p ? {
				...n,
				[na]: a,
				[e]: {
					...n[e],
					[na]: a
				}
			} : n];
		}));
		_ = _ ? _.pipe(ut(T)) : T;
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
function Sf(e, t, r, i, a, o, s, c, l, u, d, f, p, m) {
	if (e.queries.length === 0) throw new Nr("empty unionAll");
	let h = {}, g = [], _ = [], v, y = "", b = /* @__PURE__ */ new Set();
	for (let g = 0; g < e.queries.length; g++) {
		let x = e.queries[g];
		for (let e of Af(x)) {
			if (b.has(e.alias)) throw Error(n(132, { alias: e.alias }));
			b.add(e.alias);
		}
		let S = pf([
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
		let C = S.pipeline.pipe(K((e) => {
			let [t, [n, r, i, a, o]] = e, s = `${g}:${wf(t)}`, c = `${g}:${wf(o ?? t)}`;
			return [s, m ? ua(n, i, a, c) : n];
		}));
		v = v ? v.pipe(ut(C)) : C;
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
function Cf(e, t) {
	return e.pipe(K(([e, n]) => {
		let r = n, i = da(r);
		if (i) return [e, oa({
			...Xi(i.parentContext),
			[t]: i.value,
			[na]: i.publicKey
		}, i.correlationKey, i.parentContext)];
		if (typeof r != "object" || !r) return [e, { [t]: r }];
		let a = sa(r), o = a ? la(r) : r, s = {
			...Xi(a?.parentContext),
			[t]: o
		};
		return a && oa(s, a.correlationKey, a.parentContext), [e, s];
	}));
}
function wf(e) {
	return typeof e == "string" ? `string:${e}` : typeof e == "number" ? `number:${String(e)}` : typeof e == "bigint" ? `bigint:${String(e)}` : `${typeof e}:${JSON.stringify(e)}`;
}
function Tf(e, t, n, r, i, a, o, s, c, l, u, d, f, m) {
	switch (e.type) {
		case "descriptorRef": return p(e);
		case "collectionRef": {
			let n = t[e.sourceId];
			if (!n) throw new Mr(e.alias, e.collection.id, Object.keys(t));
			return u[e.alias] = e.collection.id, {
				alias: e.alias,
				input: n,
				collectionId: e.collection.id,
				sourceIncludes: [],
				isParentRouted: !1
			};
		}
		case "queryRef": {
			let p = l.get(e.query), h = pf([
				p && Td(e.query, p) ? p : e.query,
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
			let g = l.has(e.query), _ = jf(e.query.from);
			if (g || e.alias !== _) for (let [e, t] of h.sourceWhereClauses) f.set(e, t);
			let v = Object.keys(h.aliasToCollectionId).find((e) => h.aliasToCollectionId[e] === h.collectionId);
			v && v !== e.alias && (d[e.alias] = v);
			let y = h.pipeline.pipe(K((e) => {
				let [t, [n, r, i, a, o]] = e;
				return [t, ua(Ef(n), i, a, o)];
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
		default: throw new Nr(e.type);
	}
}
function Ef(e) {
	return e instanceof b ? e.value : e;
}
function Df(e, t) {
	if (!e || typeof e != "object" || !Array.isArray(e) && !Qi(e)) return e;
	let n = e, r = !1;
	for (let e of Aa) if (n[e] == null && e in t) {
		r = !0;
		break;
	}
	if (!r) return e;
	let i = Array.isArray(e) ? [...e] : { ...e };
	for (let e of Aa) n[e] == null && e in t && (i[e] = t[e]);
	return i;
}
function Of(e, t, n) {
	return e[t]?.[na] ?? e[na] ?? n;
}
function kf(e, t, n) {
	if (Pf(e.from, t.from, n), e.join && t.join) for (let r = 0; r < e.join.length && r < t.join.length; r++) {
		let i = e.join[r], a = t.join[r];
		i.from.type === "queryRef" && a.from.type === "queryRef" && (n.set(i.from.query, a.from.query), kf(i.from.query, a.from.query, n));
	}
}
function Af(e) {
	return [...j(e.from), ...e.join?.map((e) => e.from) ?? []];
}
function jf(e) {
	return j(e)[0]?.alias ?? "";
}
function Mf(e, t) {
	let n = [], r = (e, t, n) => {
		for (let [r, o] of Object.entries(e)) r.startsWith("__SPREAD_SENTINEL__") ? i(r, o, t, n) : a(o, [...t, r], n);
	}, i = (e, r, i, a) => {
		let o = e.slice(19), s = o.lastIndexOf("__"), c = s >= 0 ? o.slice(0, s) : o, l = r && typeof r == "object" && "type" in r && r.type === "ref" ? r.path : c.split(".").filter(Boolean);
		Nf(t, l) && n.push({
			path: [...i, ...t.slice(l.length)],
			guards: a
		});
	}, a = (e, i, o) => {
		if (e instanceof _ && Nf(t, e.path)) n.push({
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
		} else Bf(e) && r(e, i, o);
	};
	return r(e, [], []), n;
}
function Nf(e, t) {
	return t.length <= e.length && t.every((t, n) => e[n] === t);
}
function Pf(e, t, n) {
	if (e.type === "unionAll" && t.type === "unionAll") {
		for (let r = 0; r < e.queries.length && r < t.queries.length; r++) {
			let i = e.queries[r], a = t.queries[r];
			n.set(i, a), kf(i, a, n);
		}
		return;
	}
	let r = j(e), i = j(t);
	for (let e = 0; e < r.length && e < i.length; e++) {
		let t = r[e], a = i[e];
		t.type === "queryRef" && a.type === "queryRef" && (n.set(t.query, a.query), kf(t.query, a.query, n));
	}
}
function Ff(e) {
	let t = [];
	for (let [n, r] of Object.entries(e)) n.startsWith("__SPREAD_SENTINEL__") || (r instanceof w ? t.push({
		key: Rf([n], t),
		path: [n],
		subquery: r,
		guards: []
	}) : r instanceof T ? If(r, [n], [], t) : Bf(r) && Vf(r, n));
	return t;
}
function If(e, t, n, r) {
	let i = [];
	for (let a of e.branches) Lf(a.value, t, [
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
	e.defaultValue !== void 0 && Lf(e.defaultValue, t, [...n, ...i], r);
}
function Lf(e, t, n, r) {
	if (e instanceof w) {
		let i = Rf(t, r);
		r.push({
			key: i,
			path: t,
			subquery: e,
			guards: n
		});
	} else if (e instanceof T) If(e, t, n, r);
	else if (Bf(e)) for (let [i, a] of Object.entries(e)) i.startsWith("__SPREAD_SENTINEL__") || Lf(a, [...t, i], n, r);
}
function Rf(e, t) {
	return zf(e.join("."), t);
}
function zf(e, t) {
	let n = new Set(t.map((e) => e.key ?? e.fieldName));
	if (!n.has(e)) return e;
	let r = t.length;
	for (; n.has(`${e}#${r}`);) r++;
	return `${e}#${r}`;
}
function Bf(e) {
	return typeof e == "object" && !!e && !Array.isArray(e) && !D(e) && !o(e);
}
function Vf(e, t) {
	for (let [r, i] of Object.entries(e)) if (!r.startsWith("__SPREAD_SENTINEL__")) {
		if (i instanceof w) throw Error(n(133, {
			parentPath: t,
			key: r
		}));
		Bf(i) && Vf(i, `${t}.${r}`);
	}
}
function Hf(e, t) {
	if (t.length === 0 && e instanceof w) return {
		value: new b(null),
		replaced: !0
	};
	if (e instanceof T) return Uf(e, t);
	if (t.length === 0 || !Bf(e)) return {
		value: e,
		replaced: !1
	};
	let [n, ...r] = t, i = Hf(e[n], r);
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
function Uf(e, t) {
	let n = !1, r = e.branches.map((e) => {
		let r = Hf(e.value, t);
		return r.replaced ? (n = !0, {
			...e,
			value: r.value
		}) : e;
	}), i = e.defaultValue;
	if (e.defaultValue !== void 0) {
		let r = Hf(e.defaultValue, t);
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
function Wf(e, t) {
	let n = e;
	for (let e of t) {
		if (n == null) return n;
		n = n[e];
	}
	return n;
}
var Gf = () => {};
function Kf(e, t) {
	return e?.[ra]?.[t];
}
function qf(e, t) {
	let r = Kf(e.$selected, t);
	if (!r) throw Error(n(243));
	return r;
}
function Jf(e, t) {
	let n = e.map((e) => ({
		condition: X(e.condition),
		expected: e.expected
	}));
	return (e) => (n.every((t) => Ea(t.condition(e)) === t.expected) ? t(e) : void 0) ?? {
		active: !1,
		correlationKey: null,
		parentContext: null
	};
}
function Yf(e, t) {
	let n = [], r = (e) => {
		if (e.type !== "func") return;
		if (e.name === "and") {
			e.args.forEach(r);
			return;
		}
		if (e.name !== "eq" && e.name !== "in") return;
		let [i, a] = e.args, o = i?.type === "ref" && Xf(i.path, t.path) && a instanceof b ? a.value : a?.type === "ref" && Xf(a.path, t.path) && i instanceof b ? i.value : void 0;
		o !== void 0 && n.push(new Set(Array.isArray(o) ? o : [o]));
	};
	return e.where?.forEach((e) => r(k(e))), n.length === 0 ? /* @__PURE__ */ new Set() : new Set([...n[0]].filter((e) => n.slice(1).every((t) => t.has(e))));
}
function Xf(e, t) {
	return e.length === t.length && e.every((e, n) => e === t[n]);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live/ordered-source-loader.js
var Zf = class {
	constructor(e) {
		this.cause = e;
	}
}, Qf = class {
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
			orderBy: ko(this.info.orderBy, this.alias),
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
				orderBy: ko(this.info.orderBy, this.alias),
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
				orderBy: ko(this.info.orderBy, this.alias),
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
		Fs(Array.from(this.aF, ([r, i]) => () => {
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
			orderBy: ko(this.info.orderBy, this.alias),
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
			orderBy: ko(this.info.orderBy, this.alias),
			limit: this.info.offset + this.info.limit
		}).filter(({ value: e }) => this.info.comparator(e, this.ah) <= 0).length;
	}
	fK(e, t, n = !1) {
		if (!this.active || this.pending || this.S) return;
		let r = this.ah === void 0, i = this.ah, a;
		if (i !== void 0) {
			let e = this.info.valueExtractorForRawRow(i);
			if (!Ks(this.info.orderBy, [e])) {
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
				orderBy: ko(this.info.orderBy, this.alias),
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
			e && this.pending === e && (this.pending = void 0), this.active && Fs([() => {
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
				Fs([
					() => y(void 0, !0),
					() => {
						g || this.f_(!0, !1, !1);
					},
					() => {
						!g && this.graphHasProcessedInput(o) && this.es(o);
					}
				]);
			} catch (e) {
				throw g ? g.error : new Zf(e);
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
		let r = this.info.valueExtractorForRawRow(n), i = ko(this.info.orderBy, this.alias);
		if (!Ks(i.slice(0, 1), [r])) return t && this.bi(), this.loadFullSource(e), this.pending;
		if (Object.is(this.dl, r)) return this.loadMore(e, t);
		let a = Gs(i, [r]);
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
			Fs(e.keys());
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
			if (e instanceof Zf) throw e.cause;
			this.fT = !0;
			try {
				let t = this.fN(o, qs(e), a, n, s);
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
function $f(e) {
	let t = {};
	for (let n of ee(e)) t[n.collection.id] = n.collection;
	return t;
}
function ep(e) {
	return e.config.syncMode === "on-demand" || e.isReady();
}
function tp(e) {
	let t = e.from;
	if (t.type === "collectionRef") return t.collection;
	if (t.type === "descriptorRef") return p(t);
	if (t.type === "queryRef") return tp(t.query);
	if (t.type === "unionFrom") return tp({ from: t.sources[0] });
	if (t.type === "unionAll") return tp(t.queries[0]);
	throw Error(n(160));
}
function np(e) {
	return !(typeof e != "object" || !e || D(e) || o(e));
}
function rp(e) {
	let t = typeof e.query == "function" ? Lu(e.query) : fu(e.query);
	if (e.requireObjectResult && t.select && !np(t.select)) throw new kr();
	return t;
}
function ip(e, t) {
	let n = [];
	for (let e of t) {
		let t = e.key;
		e.type === "insert" ? n.push([[t, e.value], 1]) : e.type === "update" ? (n.push([[t, e.previousValue], -1]), n.push([[t, e.value], 1])) : n.push([[t, e.value], -1]);
	}
	return n.length !== 0 && e.sendData(new $e(n)), n.length;
}
function* ap(e) {
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
function op(e, t) {
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
function sp(e, t, n) {
	let { orderBy: r, limit: i, offset: a } = e, o = i !== void 0 && a !== void 0 ? i + a : i, s = r ? ko(r, t) : void 0, c = !(s?.some((e) => (e.compareOptions.stringSort ?? n.stringSort) === "custom") ?? !1) && (s?.every((e) => {
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
var cp = class {
	constructor() {
		this.states = /* @__PURE__ */ new Map(), this.eO = /* @__PURE__ */ new Set(), this.valueIdentity = Wi();
	}
	setDemand(e, t, r) {
		let i = up(r, this.valueIdentity), a = this.states.get(t.id), o = a?.segments.some((e) => e.state === "failed" && fp(e.keys, i));
		if (a && dp(a.keys, i) && !o) return {
			changed: !1,
			empty: i.size === 0,
			ready: !0
		};
		let s = (a?.segments ?? []).filter((e) => e.state !== "failed" && fp(e.keys, i) && (!e.replaces || dp(e.keys, i))), c = (a?.segments ?? []).filter((e) => !s.includes(e)), l = a?.segments.some((e) => e.replaces && e.state === "failed" && dp(e.keys, i)), u = {
			keys: i,
			segments: s
		};
		this.states.set(t.id, u);
		for (let t of c) hp(e, t);
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
			let r = pp(t, h);
			m && (r.replaces = [...s]), s.push(r);
			let i = mp(e, r, () => this.fB(t));
			if (this.states.get(t.id) !== u) return {
				changed: !1,
				empty: !1,
				ready: !0
			};
			if (!i) throw Error(n(159));
			m && (r.ready instanceof Promise ? r.ready.then(() => this.ep(e, t.id, r), () => {}) : this.ep(e, t.id, r));
		}
		let g = u.segments.filter((e) => e.state === "pending" && fp(e.keys, i)).map((e) => e.ready).filter((e) => e instanceof Promise);
		return {
			changed: !0,
			empty: !1,
			ready: g.length > 0 ? Promise.all(g) : !0
		};
	}
	clear() {
		for (let e of this.states.values()) for (let t of e.segments) t.abortController.abort();
		this.states.clear(), this.eO.clear(), this.valueIdentity = Wi();
	}
	hasPendingDemand(e) {
		return this.states.get(e)?.segments.some((e) => e.state === "pending") ?? !1;
	}
	ep(e, t, n) {
		let r = this.states.get(t);
		if (!r?.segments.includes(n) || !dp(n.keys, r.keys)) {
			hp(e, n);
			return;
		}
		let i = n.replaces ?? [];
		n.replaces = void 0, r.segments = [n];
		for (let t of i) hp(e, t);
	}
	fB(e) {}
};
function lp(e, t, n, r) {
	return (t[e]?.plans?.some((e) => r(e.id)) ?? !1) || n[e]?.status === "loadingSubset";
}
function up(e, t) {
	return new Map([...e].map((e) => [t.serializeEquality(e), e]));
}
function dp(e, t) {
	return e.size === t.size && [...e.keys()].every((e) => t.has(e));
}
function fp(e, t) {
	return [...e.keys()].some((e) => t.has(e));
}
function pp(e, t) {
	return {
		keys: t,
		where: fo(new _(e.path), [...t.values()]),
		abortController: new AbortController(),
		ready: !0,
		state: "starting"
	};
}
function mp(e, t, n) {
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
function hp(e, t) {
	t.abortController.abort();
	try {
		e.releaseSnapshot(t.where);
	} catch {}
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live/collection-subscriber.js
var gp = class {
	constructor(e, t, n, r) {
		this.sourceId = e, this.alias = t, this.collection = n, this.fQ = r, this.az = /* @__PURE__ */ new Map(), this.fh = /* @__PURE__ */ new Map(), this.demand = new cp();
	}
	subscribe() {
		let e = this.fQ.sourceWhereClausesCache?.get(this.sourceId);
		return this.fi(e ? Oo(e, this.alias) : void 0);
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
		let t = op(Array.isArray(e) ? e : [...e], this.fh), n = this.fQ.currentSyncState.inputs[this.sourceId];
		ip(n, t) > 0 && this.fQ.advanceGraphInputRevision(), this.fQ.scheduleGraphRun();
	}
	ek(e, t, n, r, i) {
		let a = (e) => {
			this.dV(e);
		}, o = sp(this.fQ.query, this.alias, this.fQ.queryCompareOptions);
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
			let n = ap(t);
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
		}), this.bk = new Qf(t, o, this.alias, (e, t, n) => {
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
}, _p = /* @__PURE__ */ new Set([ra]), vp = {
	prepare: () => {},
	publish: () => {},
	rollback: () => {}
}, yp = class {
	constructor(e, t, n) {
		this.parentId = e, this.f3 = t, this.pending = /* @__PURE__ */ new Map(), this.cx = /* @__PURE__ */ new Map(), this.activeBuckets = /* @__PURE__ */ new Map(), this.entries = /* @__PURE__ */ new Map(), this.bH = /* @__PURE__ */ new Map(), this.ds = /* @__PURE__ */ new WeakMap(), this.cleanedUp = !1;
		for (let e of t) e.rows.pipe(an((t) => {
			let r = t.getInner();
			n(r.length);
			for (let [[t, n], i] of r) this.fv(e.edgeId, t, n, i);
		})), e.activeBuckets.pipe(an((t) => {
			let r = t.getInner();
			n(r.length);
			for (let [[t], n] of r) this.fc(e.edgeId, t, n);
		}));
	}
	hasPendingChanges() {
		return this.pending.size > 0 || this.cx.size > 0;
	}
	flush() {
		if (!this.hasPendingChanges()) return vp;
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
		let i = vl(vl(this.pending, e, () => /* @__PURE__ */ new Map()), t, () => /* @__PURE__ */ new Map()), [a] = n, o = L(a), s = i.get(o) ?? {
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
		let r = vl(this.cx, e, () => /* @__PURE__ */ new Map());
		r.set(t, (r.get(t) ?? 0) + n);
	}
	fq(e) {
		return vl(this.activeBuckets, e, () => /* @__PURE__ */ new Set());
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
			r.delete(t), r.size === 0 && this.entries.delete(e), vl(this.bH, e, () => /* @__PURE__ */ new Map()).set(t, i);
		}
	}
	fr(e, t) {
		let r = vl(this.entries, e, () => /* @__PURE__ */ new Map()), i = r.get(t);
		if (i) return i;
		let a = /* @__PURE__ */ new WeakMap(), o, s = ml({
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
		if (bp(e)) {
			let { edgeId: t, bucketKey: n } = e[Kl], r = this.entries.get(t)?.get(n)?.collection ?? this.bH.get(t)?.get(n)?.collection ?? this.fr(t, n).collection;
			return this.ds.set(e, r), r;
		}
		if (Array.isArray(e) || Qi(e)) {
			let t = ma(e, (e) => bp(e) ? this.dn(e) : e, _p);
			return this.ds.set(e, t), t;
		}
		return e;
	}
	eR() {
		for (let e of this.bH.values()) for (let t of e.values()) t.dispose();
		this.bH.clear();
	}
};
function bp(e) {
	return typeof e == "object" && !!e && Kl in e;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live/graph-scheduler.js
function xp(e, t, n, r = nl()?.id ?? Ms()) {
	let i = [...t];
	if (r !== void 0) for (let e of i) e.scheduleGraphRun({ contextId: r });
	Os.schedule({
		contextId: r,
		jobId: e,
		dependencies: i,
		run: n
	});
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live/collection-config-builder.js
var Sp = 0, Cp = class {
	constructor(e) {
		this.config = e, this.fz = /* @__PURE__ */ new WeakMap(), this.cN = /* @__PURE__ */ new WeakMap(), this.br = !1, this.bq = 0, this.b6 = !1, this.cv = !1, this.cc = /* @__PURE__ */ new Set(), this.bh = /* @__PURE__ */ new Set(), this.subscriptions = Ru(), this.lazySourcesCallbacks = Ru(), this.lazySources = /* @__PURE__ */ new Set(), this.aQ = /* @__PURE__ */ new Map(), this.fp = 0, this.aG = /* @__PURE__ */ new Set(), this.ba = !1, this.dq = !1, this.syncRunGeneration = 0, this.windowOperationGeneration = 0, this.optimizableOrderByCollections = Ru(), this.id = e.id || `live-query-${++Sp}`, this.query = rp({
			query: e.query,
			requireObjectResult: !0
		}), this.cV = this.query.orderBy?.length || this.query.singleResult ? {
			offset: this.query.offset ?? 0,
			limit: this.query.singleResult ? Math.min(this.query.limit ?? 1, 1) : this.query.limit ?? Infinity
		} : void 0, this.bD = this.cV, this.collections = $f(this.query), this.ai = ee(this.query), this.query.orderBy && this.query.orderBy.length > 0 && (this.compare = wp(this.cN)), this.queryCompareOptions = tp(this.query).compareOptions, this.compareOptions = this.config.defaultStringCollation ?? this.queryCompareOptions, this.ef();
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
				[Is]: {
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
		if (!t) throw new ii();
		if (this.query.singleResult) {
			if (!this.query.orderBy?.length && (e.offset ?? 0) !== 0) throw new ii();
			if ((e.limit ?? this.cV.limit) !== this.cV.limit) throw new ai();
		}
		if (this.ag || this.br || Object.values(this.optimizableOrderByCollections).some((e) => e.isRequesting?.())) throw new oi();
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
			if (this.L = i, Ps(() => {
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
		let n = ++this.fp, r = this.aQ.get(e), i = t ? Js() : void 0;
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
		return lp(e, this.lazySourcesCallbacks, this.subscriptions, (e) => this.aQ.get(e)?.settled === !1);
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
		let r = qs(e);
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
		xp(this, this.bh, () => {
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
					Fs(n.unsubscribeCallbacks);
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
		for (let e of this.aQ.values()) e.participant?.reject(new ei());
		this.aQ.clear(), this.aG.clear(), this.ba = !1, this.dq = !1, this.optimizableOrderByCollections = Ru(), this.lazySourcesCallbacks = Ru(), Object.keys(this.subscriptions).forEach((e) => delete this.subscriptions[e]);
	}
	ef() {
		this.d3 = new ot();
		let e = Ru();
		for (let t of this.ai) e[t.sourceId] = this.d3.newInput();
		this.cY = e;
		let t = ff(this.query, this.cY, this.collections, this.subscriptions, this.lazySourcesCallbacks, this.lazySources, this.optimizableOrderByCollections, (e) => {
			this.f$ = e, this.L && e(this.L);
		}), n = Jl(t, this.config.getKey, this.hasJoins(this.query));
		this.dL = n.pipeline, this.sourceWhereClausesCache = t.sourceWhereClauses, this.dg = n.facades;
		let r = this.ai.map((e) => e.sourceId).filter((e) => !Object.hasOwn(this.cY, e));
		if (r.length > 0) throw new ri(r);
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
		s.pipe(an((e) => {
			let n = e.getInner();
			t.messagesCount += n.length, n.reduce(Tp, c);
		}));
		let l = this.dg, u = l ? new yp(this.id, l, (e) => {
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
					n.forEach(this.fG.bind(this, e, (n) => (t ??= e.collection._state.createSyncedKeyLookup(), t(n)))), Ep(n) && Dp(e.collection), i();
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
		return this.ai.every(({ collection: e }) => ep(e));
	}
	ev(e, t) {
		if (this.ai.length === 0) throw Error(n(153, { id: this.id }));
		let r = this.ai.map((n) => {
			let { sourceId: r, alias: i, collection: a } = n, o = a.id, s = Bs(a);
			s && s !== this && this.bh.add(s);
			let c = new gp(r, i, a, this), l = a.on("status:change", (t) => {
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
		return t.subscribedToAllCollections = !0, () => Fs(r);
	}
};
function wp(e) {
	return (t, n) => {
		let r = e.get(t), i = e.get(n);
		return r && i ? r < i ? -1 : +(r > i) : 0;
	};
}
function Tp(e, [[t, n], r]) {
	let [i, a] = n, o = e.get(t) || {
		deletes: 0,
		inserts: 0,
		value: i,
		orderByIndex: a
	};
	return r < 0 ? (o.deletes === 0 && (o.previousValue = i, o.previousOrderByIndex = a), o.deletes += Math.abs(r)) : r > 0 && (o.inserts += r, o.value = i, a !== void 0 && (o.orderByIndex = a)), e.set(t, o), e;
}
function Ep(e) {
	for (let t of e.values()) if (t.inserts > 0 && t.deletes > 0 && t.previousValue !== void 0 && q(t.previousValue, t.value) && t.orderByIndex !== t.previousOrderByIndex) return !0;
	return !1;
}
function Dp(e) {
	e._markLayoutChange();
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/query/live-query-collection.js
function Op(e) {
	return new Cp(e).getConfig();
}
function kp(e) {
	if (typeof e == "function") return Ap(Op({ query: e }));
	{
		let t = e, n = Op(t);
		return t.utils && Object.defineProperties(n.utils, Object.getOwnPropertyDescriptors(t.utils)), Ap(n);
	}
}
function Ap(e) {
	let t = ml(e), n = Rs(e);
	return n && zs(t, n), t;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/client.js
var jp = /* @__PURE__ */ Symbol.for("@tanstack/db.collectionConfig.factory");
function Mp(e, t, n) {
	return Object.defineProperty(e, jp, {
		value: t,
		enumerable: !1
	}), n && Object.defineProperty(e, On, {
		value: n,
		enumerable: !0
	}), e;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/sync-persistence.js
var Np = "@tanstack/db/sync-persistence";
function Pp(e) {
	return typeof e == "object" && !!e;
}
function Fp(e, t, n = t) {
	if (typeof e[t] != "function") throw new Nn(`${n} must be a function`);
}
function Ip(e) {
	if (e === null) return null;
	if (!Pp(e)) throw new Nn("expected null or a complete capability object");
	if (e.protocol !== "@tanstack/db/sync-persistence") throw new Nn(`protocol must be "${Np}"`);
	if (e.version !== 1) throw new Nn("version must be 1");
	if (e.managedCacheGeneration !== void 0 && typeof e.managedCacheGeneration != "boolean") throw new Nn("managedCacheGeneration must be a boolean");
	if (e.startupCacheGenerationRotated !== void 0 && typeof e.startupCacheGenerationRotated != "boolean") throw new Nn("startupCacheGenerationRotated must be a boolean");
	Fp(e, "hydrateBaseline"), e.startScopedRecovery !== void 0 && Fp(e, "startScopedRecovery"), Fp(e, "reserveCommitTurn"), Fp(e, "scanPersistedRows");
	let t = e.resumeSnapshot;
	if (!Pp(t)) throw new Nn("resumeSnapshot must be an object");
	return Fp(t, "certify", "resumeSnapshot.certify"), Fp(t, "getKeySetEvidence", "resumeSnapshot.getKeySetEvidence"), Fp(t, "expectCurrentCommit", "resumeSnapshot.expectCurrentCommit"), e;
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/array-utils.js
function Lp(e, t) {
	return ce(t, e);
}
// ../node_modules/.pnpm/@tanstack+db@0.15.2_typescript@6.0.3/node_modules/@tanstack/db/dist/esm/utils/btree.js
var Rp = class {
	constructor(e, t) {
		this.c0 = new zp(), this._size = 0, this._maxNodeSize = t >= 4 ? Math.min(t, 256) : 32, this._compare = e;
	}
	get size() {
		return this._size;
	}
	clear() {
		this.c0 = new zp(), this._size = 0;
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
		return n === !0 || n === !1 ? n : (this.c0 = new Bp([this.c0, n]), !0);
	}
	delete(e) {
		let t = this._size, n = this.c0;
		for (n.forRange(e, e, !0, !0, this); n.keys.length <= 1 && !n.isLeaf;) this.c0 = n = n.keys.length === 0 ? new zp() : n.children[0];
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
}, zp = class e {
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
}, Bp = class e extends zp {
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
}, Vp = class extends gc {
	constructor() {
		super(...arguments), this.ay = new Rp((e, t) => this.compareFn(e.value, t.value)), this.ax = /* @__PURE__ */ new Map(), this.aK = /* @__PURE__ */ new Set();
	}
	add(e, t) {
		let n = this.evaluateAddedValue(e, t), r = Fi(n);
		this.dF(e, n, r), this.addRangeValue(n), this.aK.add(e);
	}
	dF(e, t, n) {
		let r = this.ax.get(n);
		if (r) {
			r.keys.set(e, t), r.buckets?.get(n).add(e);
			return;
		}
		let i = this.ay.get({ value: t });
		if (i) i.buckets ??= /* @__PURE__ */ new Map([[Fi(i.value), new Set(i.keys.keys())]]), i.buckets.set(n, /* @__PURE__ */ new Set([e])), i.keys.set(e, t), this.ax.set(n, i);
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
			yc(e, t);
			return;
		}
		let r = Fi(n);
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
		let a = Fi(r), o = Fi(i), s = this.ax.get(o), c = s?.buckets ? s.buckets.get(o)?.has(e) : s?.keys.has(e);
		Ii(a, o) && c ? (s.keys.set(e, i), s.representativeKey === e && (s.value = i), this.removeRangeValue(r), this.addRangeValue(i)) : (this.cf(e, a), this.removeRangeValue(r), this.dF(e, i, o), this.addRangeValue(i), this.aK.add(e));
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
		let t = Fi(e), n = this.ax.get(t);
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
			for (let t of [...a[1].keys.keys()].sort(r ? Lp : ce)) if ((n?.(t) ?? !0) && i.push(t), i.length >= e) break;
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
hc.set(Vp, "BTreeIndex");
// ../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/timeoutManager.js
var Hp = {
	setTimeout: (e, t) => setTimeout(e, t),
	clearTimeout: (e) => clearTimeout(e),
	setInterval: (e, t) => setInterval(e, t),
	clearInterval: (e) => clearInterval(e)
}, Up = new class {
	#e = Hp;
	setTimeoutProvider(e) {
		this.#e = e;
	}
	setTimeout(e, t) {
		return this.#e.setTimeout(e, t);
	}
	clearTimeout(e) {
		this.#e.clearTimeout(e);
	}
	setInterval(e, t) {
		return this.#e.setInterval(e, t);
	}
	clearInterval(e) {
		this.#e.clearInterval(e);
	}
}();
function Wp(e) {
	setTimeout(e, 0);
}
// ../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/utils.js
var Gp = typeof window > "u" || "Deno" in globalThis;
function Kp() {}
function qp(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function Jp(e) {
	return typeof e == "number" && e >= 0 && e !== Infinity;
}
function Yp(e, t) {
	return Math.max(e + (t || 0) - Date.now(), 0);
}
function $(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function Xp(e, t) {
	let { type: n = "all", exact: r, fetchStatus: i, predicate: a, queryKey: o, stale: s } = e;
	if (o) {
		if (r) {
			if (t.queryHash !== Qp(o, t.options)) return !1;
		} else if (!em(t.queryKey, o)) return !1;
	}
	if (n !== "all") {
		let e = t.isActive();
		if (n === "active" && !e || n === "inactive" && e) return !1;
	}
	return !(typeof s == "boolean" && t.isStale() !== s || i && i !== t.state.fetchStatus || a && !a(t));
}
function Zp(e, t) {
	let { exact: n, status: r, predicate: i, mutationKey: a } = e;
	if (a) {
		if (!t.options.mutationKey) return !1;
		if (n) {
			if ($p(t.options.mutationKey) !== $p(a)) return !1;
		} else if (!em(t.options.mutationKey, a)) return !1;
	}
	return !(r && t.state.status !== r || i && !i(t));
}
function Qp(e, t) {
	return (t?.queryKeyHashFn || $p)(e);
}
function $p(e) {
	return JSON.stringify(e, (e, t) => am(t) ? Object.keys(t).sort().reduce((e, n) => (e[n] = t[n], e), {}) : t);
}
function em(e, t) {
	if (e === t) return !0;
	if (typeof e != typeof t) return !1;
	if (e && t && typeof e == "object" && typeof t == "object") {
		if (Array.isArray(e) && Array.isArray(t)) {
			if (t.length > e.length) return !1;
			for (let n = 0; n < t.length; n++) if (!em(e[n], t[n])) return !1;
			return !0;
		}
		let n = Object.keys(t);
		for (let r of n) if (!em(e[r], t[r])) return !1;
		return !0;
	}
	return !1;
}
var tm = Object.prototype.hasOwnProperty;
function nm(e, t, n = 0) {
	if (e === t) return e;
	if (n > 500) return t;
	let r = im(e) && im(t);
	if (!r && !(am(e) && am(t))) return t;
	let i = (r ? e : Object.keys(e)).length, a = r ? t : Object.keys(t), o = a.length, s = r ? Array(o) : {}, c = 0;
	for (let l = 0; l < o; l++) {
		let o = r ? l : a[l], u = e[o], d = t[o];
		if (u === d) {
			s[o] = u, (r ? l < i : tm.call(e, o)) && c++;
			continue;
		}
		if (u === null || d === null || typeof u != "object" || typeof d != "object") {
			s[o] = d;
			continue;
		}
		let f = nm(u, d, n + 1);
		s[o] = f, f === u && c++;
	}
	return i === o && c === i ? e : s;
}
function rm(e, t) {
	if (!t || Object.keys(e).length !== Object.keys(t).length) return !1;
	for (let n in e) if (e[n] !== t[n]) return !1;
	return !0;
}
function im(e) {
	return Array.isArray(e) && e.length === Object.keys(e).length;
}
function am(e) {
	if (!om(e)) return !1;
	let t = Object.getPrototypeOf(e), n = t?.constructor;
	if (n === void 0) return !0;
	if (typeof n != "function") return !1;
	let r = n.prototype;
	return !(!om(r) || !r.hasOwnProperty("isPrototypeOf") || t !== Object.prototype);
}
function om(e) {
	return Object.prototype.toString.call(e) === "[object Object]";
}
function sm(e) {
	return new Promise((t) => {
		Up.setTimeout(t, e);
	});
}
function cm(e, t, n) {
	return typeof n.structuralSharing == "function" ? n.structuralSharing(e, t) : n.structuralSharing === !1 ? t : nm(e, t);
}
function lm(e, t, n = 0) {
	let r = [...e, t];
	return n && r.length > n ? r.slice(1) : r;
}
function um(e, t, n = 0) {
	let r = [t, ...e];
	return n && r.length > n ? r.slice(0, -1) : r;
}
var dm = Symbol();
function fm(e, t) {
	return !e.queryFn && t?.initialPromise ? () => t.initialPromise : !e.queryFn || e.queryFn === dm ? () => Promise.reject(/* @__PURE__ */ Error(`Missing queryFn: '${e.queryHash}'`)) : e.queryFn;
}
function pm(e, t, n) {
	let r = !1, i;
	return Object.defineProperty(e, "signal", {
		enumerable: !0,
		get: () => (i ??= t(), r || (r = !0, i.aborted ? n() : i.addEventListener("abort", n, { once: !0 })), i)
	}), e;
}
// ../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/environmentManager.js
var mm = () => Gp, hm = () => mm(), gm = class {
	constructor() {
		this.listeners = /* @__PURE__ */ new Set(), this.subscribe = this.subscribe.bind(this);
	}
	subscribe(e) {
		return this.listeners.add(e), this.onSubscribe(), () => {
			this.listeners.delete(e), this.onUnsubscribe();
		};
	}
	hasListeners() {
		return this.listeners.size > 0;
	}
	onSubscribe() {}
	onUnsubscribe() {}
}, _m = new class extends gm {
	#e;
	#t;
	#n;
	constructor() {
		super(), this.#n = (e) => {
			if (typeof window < "u" && window.addEventListener) {
				let t = () => e();
				return window.addEventListener("visibilitychange", t, !1), () => {
					window.removeEventListener("visibilitychange", t);
				};
			}
		};
	}
	onSubscribe() {
		this.#t || this.setEventListener(this.#n);
	}
	onUnsubscribe() {
		this.hasListeners() || (this.#t?.(), this.#t = void 0);
	}
	setEventListener(e) {
		this.#n = e, this.#t?.(), this.#t = e((e) => {
			typeof e == "boolean" ? this.setFocused(e) : this.onFocus();
		});
	}
	setFocused(e) {
		this.#e !== e && (this.#e = e, this.onFocus());
	}
	onFocus() {
		let e = this.isFocused();
		this.listeners.forEach((t) => {
			t(e);
		});
	}
	isFocused() {
		return typeof this.#e == "boolean" ? this.#e : globalThis.document?.visibilityState !== "hidden";
	}
}(), vm = Wp;
function ym() {
	let e = [], t = 0, n = (e) => {
		e();
	}, r = (e) => {
		e();
	}, i = vm, a = (r) => {
		t ? e.push(r) : i(() => {
			n(r);
		});
	}, o = () => {
		let t = e;
		e = [], t.length && i(() => {
			r(() => {
				t.forEach((e) => {
					n(e);
				});
			});
		});
	};
	return {
		batch: (e) => {
			let n;
			t++;
			try {
				n = e();
			} finally {
				t--, t || o();
			}
			return n;
		},
		batchCalls: (e) => (...t) => {
			a(() => {
				e(...t);
			});
		},
		schedule: a,
		setNotifyFunction: (e) => {
			n = e;
		},
		setBatchNotifyFunction: (e) => {
			r = e;
		},
		setScheduler: (e) => {
			i = e;
		}
	};
}
var bm = ym(), xm = new class extends gm {
	#e = !0;
	#t;
	#n;
	constructor() {
		super(), this.#n = (e) => {
			if (typeof window < "u" && window.addEventListener) {
				let t = () => e(!0), n = () => e(!1);
				return window.addEventListener("online", t, !1), window.addEventListener("offline", n, !1), () => {
					window.removeEventListener("online", t), window.removeEventListener("offline", n);
				};
			}
		};
	}
	onSubscribe() {
		this.#t || this.setEventListener(this.#n);
	}
	onUnsubscribe() {
		this.hasListeners() || (this.#t?.(), this.#t = void 0);
	}
	setEventListener(e) {
		this.#n = e, this.#t?.(), this.#t = e(this.setOnline.bind(this));
	}
	setOnline(e) {
		this.#e !== e && (this.#e = e, this.listeners.forEach((t) => {
			t(e);
		}));
	}
	isOnline() {
		return this.#e;
	}
}();
// ../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/retryer.js
function Sm(e) {
	return Math.min(1e3 * 2 ** e, 3e4);
}
function Cm(e) {
	return (e ?? "online") !== "online" || xm.isOnline();
}
var wm = class extends Error {
	constructor(e) {
		super("CancelledError"), this.revert = e?.revert, this.silent = e?.silent;
	}
};
function Tm(e) {
	let t = !1, n = 0, r, i = "pending", a, o, s = new Promise((e, t) => {
		a = e, o = t;
	});
	s.catch(Kp);
	let c = () => i !== "pending", l = (t) => {
		if (!c()) {
			let n = new wm(t);
			h(n), e.onCancel?.(n);
		}
	}, u = () => {
		t = !0;
	}, d = () => {
		t = !1;
	}, f = () => _m.isFocused() && (e.networkMode === "always" || xm.isOnline()) && e.canRun(), p = () => Cm(e.networkMode) && e.canRun(), m = (e) => {
		c() || (r?.(), i = "resolved", a(e));
	}, h = (e) => {
		c() || (r?.(), i = "rejected", o(e));
	}, g = (t) => new Promise((n) => {
		r = (e) => {
			(c() || t()) && n(e);
		}, e.onPause?.();
	}).then(() => {
		r = void 0, c() || e.onContinue?.();
	}), _ = () => {
		if (c()) return;
		let r, i = n === 0 ? e.initialPromise : void 0;
		try {
			r = i ?? e.fn();
		} catch (e) {
			r = Promise.reject(e);
		}
		Promise.resolve(r).then(m).catch((r) => {
			if (c()) return;
			let i = e.retry ?? (hm() ? 0 : 3), a = e.retryDelay ?? Sm, o = typeof a == "function" ? a(n, r) : a, s = i === !0 || typeof i == "number" && n < i || typeof i == "function" && i(n, r);
			t || !s ? h(r) : (n++, e.onFail?.(n, r), sm(o).then(() => f() ? void 0 : g(f)).then(() => {
				t ? h(r) : _();
			}));
		});
	};
	return {
		promise: s,
		status: () => i,
		cancel: l,
		continue: () => (r?.(), s),
		cancelRetry: u,
		continueRetry: d,
		canStart: p,
		start: () => (p() ? _() : g(p).then(_), s)
	};
}
// ../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/removable.js
var Em = class {
	#e;
	destroy() {
		this.clearGcTimeout();
	}
	scheduleGc() {
		this.clearGcTimeout(), Jp(this.gcTime) && (this.#e = Up.setTimeout(() => {
			this.optionalRemove();
		}, this.gcTime));
	}
	updateGcTime(e) {
		this.gcTime = Math.max(this.gcTime || 0, e ?? (hm() ? Infinity : 3e5));
	}
	clearGcTimeout() {
		this.#e !== void 0 && (Up.clearTimeout(this.#e), this.#e = void 0);
	}
};
// ../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/infiniteQueryBehavior.js
function Dm(e) {
	return { onFetch: (t, n) => {
		let r = t.options, i = t.fetchOptions?.meta?.fetchMore?.direction, a = t.state.data?.pages || [], o = t.state.data?.pageParams || [], s = {
			pages: [],
			pageParams: []
		}, c = 0, l = async () => {
			let n = !1, l = (e) => {
				pm(e, () => t.signal, () => n = !0);
			}, u = fm(t.options, t.fetchOptions), d = async (e, r, i) => {
				if (n) return Promise.reject(t.signal.reason);
				if (r == null && e.pages.length) return Promise.resolve(e);
				let a = (() => {
					let e = {
						client: t.client,
						queryKey: t.queryKey,
						pageParam: r,
						direction: i ? "backward" : "forward",
						meta: t.options.meta
					};
					return l(e), e;
				})(), o = await u(a), { maxPages: s } = t.options, c = i ? um : lm;
				return {
					pages: c(e.pages, o, s),
					pageParams: c(e.pageParams, r, s)
				};
			};
			if (i && a.length) {
				let e = i === "backward", t = e ? km : Om, n = {
					pages: a,
					pageParams: o
				};
				s = await d(n, t(r, n), e);
			} else {
				let t = e ?? a.length;
				do {
					let e = c === 0 ? o[0] === void 0 ? r.initialPageParam : o[0] : Om(r, s);
					if (c > 0 && e == null) break;
					s = await d(s, e), c++;
				} while (c < t);
			}
			return s;
		};
		t.fetchFn = t.options.persister ? () => t.options.persister?.(l, {
			client: t.client,
			queryKey: t.queryKey,
			meta: t.options.meta,
			signal: t.signal
		}, n) : l;
	} };
}
function Om(e, { pages: t, pageParams: n }) {
	let r = t.length - 1;
	return t.length > 0 ? e.getNextPageParam(t[r], t, n[r], n) : void 0;
}
function km(e, { pages: t, pageParams: n }) {
	return t.length > 0 ? e.getPreviousPageParam?.(t[0], t, n[0], n) : void 0;
}
// ../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/query.js
var Am = class extends Em {
	#e;
	#t;
	#n;
	#r;
	#i;
	#a;
	#o;
	#s;
	constructor(e) {
		super(), this.#s = !1, this.#o = e.defaultOptions, this.setOptions(e.options), this.observers = [], this.#i = e.client, this.#r = this.#i.getQueryCache(), this.queryKey = e.queryKey, this.queryHash = e.queryHash, this.#t = Nm(this.options), this.state = e.state ?? this.#t, this.scheduleGc();
	}
	get meta() {
		return this.options.meta;
	}
	get queryType() {
		return this.#e;
	}
	get promise() {
		return this.#a?.promise;
	}
	setOptions(e) {
		if (this.options = {
			...this.#o,
			...e
		}, e?._type && (this.#e = e._type), this.updateGcTime(this.options.gcTime), this.state && this.state.data === void 0) {
			let e = Nm(this.options);
			e.data !== void 0 && (this.setState(Mm(e.data, e.dataUpdatedAt)), this.#t = e);
		}
	}
	optionalRemove() {
		!this.observers.length && this.state.fetchStatus === "idle" && this.#r.remove(this);
	}
	setData(e, t) {
		let n = cm(this.state.data, e, this.options);
		return this.#c({
			data: n,
			type: "success",
			dataUpdatedAt: t?.updatedAt,
			manual: t?.manual
		}), n;
	}
	setState(e) {
		this.#c({
			type: "setState",
			state: e
		});
	}
	cancel(e) {
		let t = this.#a?.promise;
		return this.#a?.cancel(e), t ? t.then(Kp).catch(Kp) : Promise.resolve();
	}
	destroy() {
		super.destroy(), this.cancel({ silent: !0 });
	}
	get resetState() {
		return this.#t;
	}
	reset() {
		this.destroy(), this.setState(this.resetState);
	}
	isActive() {
		return this.observers.some((e) => $(e.options.enabled, this) !== !1);
	}
	isDisabled() {
		return this.getObserversCount() > 0 ? !this.isActive() : this.options.queryFn === dm || !this.isFetched();
	}
	isFetched() {
		return this.state.dataUpdateCount + this.state.errorUpdateCount > 0;
	}
	isStatic() {
		return this.getObserversCount() > 0 && this.observers.some((e) => $(e.options.staleTime, this) === "static");
	}
	isStale() {
		return this.getObserversCount() > 0 ? this.observers.some((e) => e.getCurrentResult().isStale) : this.state.data === void 0 || this.state.isInvalidated;
	}
	isStaleByTime(e = 0) {
		return this.state.data === void 0 ? !0 : e === "static" ? !1 : this.state.isInvalidated ? !0 : !Yp(this.state.dataUpdatedAt, e);
	}
	onFocus() {
		this.observers.find((e) => e.shouldFetchOnWindowFocus())?.refetch({ cancelRefetch: !1 }), this.#a?.continue();
	}
	onOnline() {
		this.observers.find((e) => e.shouldFetchOnReconnect())?.refetch({ cancelRefetch: !1 }), this.#a?.continue();
	}
	addObserver(e) {
		this.observers.includes(e) || (this.observers.push(e), this.clearGcTimeout(), this.#r.notify({
			type: "observerAdded",
			query: this,
			observer: e
		}));
	}
	removeObserver(e) {
		let t = this.observers.indexOf(e);
		t !== -1 && (this.observers.splice(t, 1), this.observers.length || (this.#a && (this.#s || this.state.fetchStatus === "paused" && this.state.status === "pending" ? this.#a.cancel({ revert: !0 }) : this.#a.cancelRetry()), this.scheduleGc()), this.#r.notify({
			type: "observerRemoved",
			query: this,
			observer: e
		}));
	}
	getObserversCount() {
		return this.observers.length;
	}
	invalidate() {
		this.state.isInvalidated || this.#c({ type: "invalidate" });
	}
	async fetch(e, t) {
		if (this.state.fetchStatus !== "idle" && this.#a?.status() !== "rejected") {
			if (this.state.data !== void 0 && t?.cancelRefetch) this.cancel({ silent: !0 });
			else if (this.#a) return this.#a.continueRetry(), this.#a.promise;
		}
		if (e && this.setOptions(e), !this.options.queryFn) {
			let e = this.observers.find((e) => e.options.queryFn);
			e && this.setOptions(e.options);
		}
		let n = new AbortController(), r = (e) => {
			Object.defineProperty(e, "signal", {
				enumerable: !0,
				get: () => (this.#s = !0, n.signal)
			});
		}, i = () => {
			let e = fm(this.options, t), n = (() => {
				let e = {
					client: this.#i,
					queryKey: this.queryKey,
					meta: this.meta
				};
				return r(e), e;
			})();
			return this.#s = !1, this.options.persister ? this.options.persister(e, n, this) : e(n);
		}, a = (() => {
			let e = {
				fetchOptions: t,
				options: this.options,
				queryKey: this.queryKey,
				client: this.#i,
				state: this.state,
				fetchFn: i
			};
			return r(e), e;
		})();
		(this.#e === "infinite" ? Dm(this.options.pages) : this.options.behavior)?.onFetch(a, this), this.#n = this.state, (this.state.fetchStatus === "idle" || this.state.fetchMeta !== a.fetchOptions?.meta) && this.#c({
			type: "fetch",
			meta: a.fetchOptions?.meta
		});
		let o = this.#a = Tm({
			initialPromise: t?.initialPromise,
			fn: a.fetchFn,
			onCancel: (e) => {
				e instanceof wm && e.revert && this.setState({
					...this.#n,
					fetchStatus: "idle"
				}), n.abort();
			},
			onFail: (e, t) => {
				this.#c({
					type: "failed",
					failureCount: e,
					error: t
				});
			},
			onPause: () => {
				this.#c({ type: "pause" });
			},
			onContinue: () => {
				this.#c({ type: "continue" });
			},
			retry: a.options.retry,
			retryDelay: a.options.retryDelay,
			networkMode: a.options.networkMode,
			canRun: () => !0
		});
		try {
			let e = await o.start();
			if (e === void 0) throw Error(`${this.queryHash} data is undefined`);
			return this.setData(e), this.#r.config.onSuccess?.(e, this), this.#r.config.onSettled?.(e, this.state.error, this), e;
		} catch (e) {
			if (e instanceof wm) {
				if (e.silent) return this.#a.promise;
				if (e.revert) {
					if (this.state.data === void 0) throw e;
					return this.state.data;
				}
			}
			throw this.#c({
				type: "error",
				error: e
			}), this.#r.config.onError?.(e, this), this.#r.config.onSettled?.(this.state.data, e, this), e;
		} finally {
			this.#a === o && (this.#a = void 0), this.scheduleGc();
		}
	}
	#c(e) {
		let t = (t) => {
			switch (e.type) {
				case "failed": return {
					...t,
					fetchFailureCount: e.failureCount,
					fetchFailureReason: e.error
				};
				case "pause": return {
					...t,
					fetchStatus: "paused"
				};
				case "continue": return {
					...t,
					fetchStatus: "fetching"
				};
				case "fetch": return {
					...t,
					...jm(t.data, this.options),
					fetchMeta: e.meta ?? null
				};
				case "success":
					let n = {
						...t,
						...Mm(e.data, e.dataUpdatedAt),
						dataUpdateCount: t.dataUpdateCount + 1,
						...!e.manual && {
							fetchStatus: "idle",
							fetchFailureCount: 0,
							fetchFailureReason: null
						}
					};
					return this.#n = e.manual ? n : void 0, n;
				case "error":
					let r = e.error;
					return {
						...t,
						error: r,
						errorUpdateCount: t.errorUpdateCount + 1,
						errorUpdatedAt: Date.now(),
						fetchFailureCount: t.fetchFailureCount + 1,
						fetchFailureReason: r,
						fetchStatus: "idle",
						status: "error",
						isInvalidated: !0
					};
				case "invalidate": return {
					...t,
					isInvalidated: !0
				};
				case "setState": return {
					...t,
					...e.state
				};
			}
		};
		this.state = t(this.state), bm.batch(() => {
			this.observers.slice().forEach((e) => {
				e.onQueryUpdate();
			}), this.#r.notify({
				query: this,
				type: "updated",
				action: e
			});
		});
	}
};
function jm(e, t) {
	return {
		fetchFailureCount: 0,
		fetchFailureReason: null,
		fetchStatus: Cm(t.networkMode) ? "fetching" : "paused",
		...e === void 0 && {
			error: null,
			status: "pending"
		}
	};
}
function Mm(e, t) {
	return {
		data: e,
		dataUpdatedAt: t ?? Date.now(),
		error: null,
		isInvalidated: !1,
		status: "success"
	};
}
function Nm(e) {
	let t = typeof e.initialData == "function" ? e.initialData() : e.initialData, n = t !== void 0, r = n ? typeof e.initialDataUpdatedAt == "function" ? e.initialDataUpdatedAt() : e.initialDataUpdatedAt : 0;
	return {
		data: t,
		dataUpdateCount: 0,
		dataUpdatedAt: n ? r ?? Date.now() : 0,
		error: null,
		errorUpdateCount: 0,
		errorUpdatedAt: 0,
		fetchFailureCount: 0,
		fetchFailureReason: null,
		fetchMeta: null,
		isInvalidated: !1,
		status: n ? "success" : "pending",
		fetchStatus: "idle"
	};
}
// ../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/queryObserver.js
var Pm = class extends gm {
	#e;
	#t = void 0;
	#n = void 0;
	#r = void 0;
	#i;
	#a;
	#o;
	#s;
	#c;
	#l;
	#u;
	#d;
	#f;
	#p = /* @__PURE__ */ new Set();
	constructor(e, t) {
		super(), this.options = t, this.#e = e, this.#o = null, this.bindMethods(), this.setOptions(t);
	}
	bindMethods() {
		this.refetch = this.refetch.bind(this);
	}
	onSubscribe() {
		this.listeners.size === 1 && (this.#t.addObserver(this), Im(this.#t, this.options) ? this.#m() : this.updateResult(), this.#y());
	}
	onUnsubscribe() {
		this.hasListeners() || this.destroy();
	}
	shouldFetchOnReconnect() {
		return Lm(this.#t, this.options, this.options.refetchOnReconnect);
	}
	shouldFetchOnWindowFocus() {
		return Lm(this.#t, this.options, this.options.refetchOnWindowFocus);
	}
	destroy() {
		this.listeners = /* @__PURE__ */ new Set(), this.#b(), this.#x(), this.#t.removeObserver(this);
	}
	setOptions(e) {
		let t = this.options, n = this.#t;
		if (this.options = this.#e.defaultQueryOptions(e), this.options.enabled !== void 0 && typeof this.options.enabled != "boolean" && typeof this.options.enabled != "function" && typeof $(this.options.enabled, this.#t) != "boolean") throw Error("Expected enabled to be a boolean or a callback that returns a boolean");
		this.#S(), this.#t.setOptions(this.options), t._defaulted && !rm(this.options, t) && this.#e.getQueryCache().notify({
			type: "observerOptionsUpdated",
			query: this.#t,
			observer: this
		});
		let r = this.hasListeners();
		r && Rm(this.#t, n, this.options, t) && this.#m(), this.updateResult(), r && (this.#t !== n || $(this.options.enabled, this.#t) !== $(t.enabled, this.#t) || $(this.options.staleTime, this.#t) !== $(t.staleTime, this.#t)) && this.#g();
		let i = this.#_();
		r && (this.#t !== n || $(this.options.enabled, this.#t) !== $(t.enabled, this.#t) || i !== this.#f) && this.#v(i);
	}
	getOptimisticResult(e) {
		let t = this.#e.getQueryCache().build(this.#e, e), n = this.createResult(t, e);
		return rm(this.getCurrentResult(), n) || (this.#r = n, this.#a = this.options, this.#i = this.#t.state), n;
	}
	getCurrentResult() {
		return this.#r;
	}
	trackResult(e, t) {
		return new Proxy(e, { get: (e, n) => (this.trackProp(n), t?.(n), Reflect.get(e, n)) });
	}
	trackProp(e) {
		this.#p.add(e);
	}
	getCurrentQuery() {
		return this.#t;
	}
	refetch({ ...e } = {}) {
		return this.fetch({ ...e });
	}
	fetchOptimistic(e) {
		let t = this.#e.defaultQueryOptions(e), n = this.#e.getQueryCache().build(this.#e, t), r = () => {}, i, a = new Promise((e) => {
			i = e, r = this.#e.getQueryCache().subscribe((i) => {
				i.type === "updated" && i.query.queryHash === n.queryHash && n.state.data !== void 0 && (r(), e(this.createResult(n, t)));
			});
		});
		return Promise.race([n.fetch(t).then(() => {
			let e = this.createResult(n, t);
			return i?.(e), e;
		}).finally(() => {
			r();
		}), a]);
	}
	fetch(e) {
		return this.#m({
			...e,
			cancelRefetch: e.cancelRefetch ?? !0
		}).then(() => (this.updateResult(), this.#r));
	}
	#m(e) {
		this.#S();
		let t = this.#t.fetch(this.options, e);
		return e?.throwOnError || (t = t.catch(Kp)), t;
	}
	#h(e) {
		return !hm() && $(this.options.enabled, this.#t) !== !1 && Jp(e);
	}
	#g() {
		this.#b();
		let e = $(this.options.staleTime, this.#t);
		if (this.#r.isStale || !this.#h(e)) return;
		let t = Yp(this.#r.dataUpdatedAt, e) + 1;
		this.#u = Up.setTimeout(() => {
			this.#r.isStale || this.updateResult();
		}, t);
	}
	#_() {
		return $(this.options.refetchInterval, this.#t) ?? !1;
	}
	#v(e) {
		this.#x(), this.#f = e, this.#f !== 0 && this.#h(this.#f) && (this.#d = Up.setInterval(() => {
			(this.options.refetchIntervalInBackground || _m.isFocused()) && this.#m();
		}, this.#f));
	}
	#y() {
		this.#g(), this.#v(this.#_());
	}
	#b() {
		this.#u !== void 0 && (Up.clearTimeout(this.#u), this.#u = void 0);
	}
	#x() {
		this.#d !== void 0 && (Up.clearInterval(this.#d), this.#d = void 0);
	}
	createResult(e, t) {
		let n = this.#t, r = this.options, i = this.#r, a = this.#i, o = this.#a, s = e === n ? this.#n : e.state, { state: c } = e, l = { ...c }, u = !1, d;
		if (t._optimisticResults) {
			let i = this.hasListeners(), a = !i && Im(e, t), o = i && Rm(e, n, t, r);
			(a || o) && (l = {
				...l,
				...jm(c.data, e.options)
			}), t._optimisticResults === "isRestoring" && (l.fetchStatus = "idle");
		}
		let { error: f, errorUpdatedAt: p, status: m } = l;
		d = l.data;
		let h = !1;
		if (t.placeholderData !== void 0 && d === void 0 && m === "pending") {
			let e;
			i?.isPlaceholderData && t.placeholderData === o?.placeholderData ? (e = i.data, h = !0) : e = typeof t.placeholderData == "function" ? t.placeholderData(this.#l?.state.data, this.#l) : t.placeholderData, e !== void 0 && (m = "success", d = cm(i?.data, e, t), u = !0);
		}
		if (t.select && d !== void 0 && !h) {
			if (i && d === a?.data && t.select === this.#s) d = this.#c;
			else try {
				this.#s = t.select, d = t.select(d), d = cm(i?.data, d, t), this.#c = d, this.#o = null;
			} catch (e) {
				this.#o = e;
			}
		} else d === void 0 && (this.#o = null);
		this.#o && (f = this.#o, d = this.#c, p = Date.now(), m = "error", u = !1);
		let g = l.fetchStatus === "fetching", _ = m === "pending", v = m === "error", y = _ && g, b = d !== void 0;
		return {
			status: m,
			fetchStatus: l.fetchStatus,
			isPending: _,
			isSuccess: m === "success",
			isError: v,
			isInitialLoading: y,
			isLoading: y,
			data: d,
			dataUpdatedAt: l.dataUpdatedAt,
			error: f,
			errorUpdatedAt: p,
			failureCount: l.fetchFailureCount,
			failureReason: l.fetchFailureReason,
			errorUpdateCount: l.errorUpdateCount,
			isFetched: e.isFetched(),
			isFetchedAfterMount: l.dataUpdateCount > s.dataUpdateCount || l.errorUpdateCount > s.errorUpdateCount,
			isFetching: g,
			isRefetching: g && !_,
			isLoadingError: v && !b,
			isPaused: l.fetchStatus === "paused",
			isPlaceholderData: u,
			isRefetchError: v && b,
			isStale: zm(e, t),
			refetch: this.refetch,
			isEnabled: $(t.enabled, e) !== !1
		};
	}
	updateResult() {
		let e = this.#r, t = this.createResult(this.#t, this.options);
		if (this.#i = this.#t.state, this.#a = this.options, this.#i.data !== void 0 && (this.#l = this.#t), rm(t, e)) return;
		this.#r = t;
		let n = (() => {
			if (!e) return !0;
			let { notifyOnChangeProps: t } = this.options, n = typeof t == "function" ? t() : t;
			if (n === "all" || !n && !this.#p.size) return !0;
			let r = new Set(n ?? this.#p);
			return this.options.throwOnError && r.add("error"), Object.keys(this.#r).some((t) => {
				let n = t;
				return this.#r[n] !== e[n] && r.has(n);
			});
		})();
		bm.batch(() => {
			n && this.listeners.forEach((e) => {
				e(this.#r);
			}), this.#e.getQueryCache().notify({
				query: this.#t,
				type: "observerResultsUpdated"
			});
		});
	}
	#S() {
		let e = this.#e.getQueryCache().build(this.#e, this.options);
		if (e === this.#t) return;
		let t = this.#t;
		this.#t = e, this.#n = e.state, this.hasListeners() && (t?.removeObserver(this), e.addObserver(this));
	}
	onQueryUpdate() {
		this.updateResult(), this.hasListeners() && this.#y();
	}
};
function Fm(e, t) {
	return $(t.enabled, e) !== !1 && e.state.data === void 0 && (e.state.status !== "error" || $(t.retryOnMount, e) !== !1);
}
function Im(e, t) {
	return Fm(e, t) || e.state.data !== void 0 && Lm(e, t, t.refetchOnMount);
}
function Lm(e, t, n) {
	if ($(t.enabled, e) !== !1 && $(t.staleTime, e) !== "static") {
		let r = $(n, e);
		return r === "always" || r !== !1 && zm(e, t);
	}
	return !1;
}
function Rm(e, t, n, r) {
	return (e !== t || $(r.enabled, e) === !1) && (!n.suspense || e.state.status !== "error") && zm(e, n);
}
function zm(e, t) {
	return $(t.enabled, e) !== !1 && e.isStaleByTime($(t.staleTime, e));
}
// ../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/mutation.js
var Bm = class extends Em {
	#e;
	#t;
	#n;
	#r;
	constructor(e) {
		super(), this.#e = e.client, this.mutationId = e.mutationId, this.#n = e.mutationCache, this.#t = [], this.state = e.state || Vm(), this.setOptions(e.options), this.scheduleGc();
	}
	setOptions(e) {
		this.options = e, this.updateGcTime(this.options.gcTime);
	}
	get meta() {
		return this.options.meta;
	}
	addObserver(e) {
		this.#t.includes(e) || (this.#t.push(e), this.clearGcTimeout(), this.#n.notify({
			type: "observerAdded",
			mutation: this,
			observer: e
		}));
	}
	removeObserver(e) {
		this.#t = this.#t.filter((t) => t !== e), this.scheduleGc(), this.#n.notify({
			type: "observerRemoved",
			mutation: this,
			observer: e
		});
	}
	optionalRemove() {
		this.#t.length || (this.state.status === "pending" ? this.scheduleGc() : this.#n.remove(this));
	}
	continue() {
		return this.#r?.continue() ?? (this.state.status === "pending" ? this.execute(this.state.variables) : Promise.resolve());
	}
	async execute(e) {
		let t = () => {
			this.#i({ type: "continue" });
		}, n = {
			client: this.#e,
			meta: this.options.meta,
			mutationKey: this.options.mutationKey
		}, r = this.#r = Tm({
			fn: () => this.options.mutationFn ? this.options.mutationFn(e, n) : Promise.reject(/* @__PURE__ */ Error("No mutationFn found")),
			onFail: (e, t) => {
				this.#i({
					type: "failed",
					failureCount: e,
					error: t
				});
			},
			onPause: () => {
				this.#i({ type: "pause" });
			},
			onContinue: t,
			retry: this.options.retry ?? 0,
			retryDelay: this.options.retryDelay,
			networkMode: this.options.networkMode,
			canRun: () => this.#n.canRun(this)
		}), i = this.state.status === "pending", a = !r.canStart();
		try {
			if (i) t();
			else {
				this.#i({
					type: "pending",
					variables: e,
					isPaused: a
				}), this.#n.config.onMutate && await this.#n.config.onMutate(e, this, n);
				let t = await this.options.onMutate?.(e, n);
				t !== this.state.context && this.#i({
					type: "pending",
					context: t,
					variables: e,
					isPaused: a
				});
			}
			let o = await r.start();
			return await this.#n.config.onSuccess?.(o, e, this.state.context, this, n), await this.options.onSuccess?.(o, e, this.state.context, n), await this.#n.config.onSettled?.(o, null, this.state.variables, this.state.context, this, n), await this.options.onSettled?.(o, null, e, this.state.context, n), this.#i({
				type: "success",
				data: o
			}), o;
		} catch (t) {
			try {
				await this.#n.config.onError?.(t, e, this.state.context, this, n);
			} catch (e) {
				Promise.reject(e);
			}
			try {
				await this.options.onError?.(t, e, this.state.context, n);
			} catch (e) {
				Promise.reject(e);
			}
			try {
				await this.#n.config.onSettled?.(void 0, t, this.state.variables, this.state.context, this, n);
			} catch (e) {
				Promise.reject(e);
			}
			try {
				await this.options.onSettled?.(void 0, t, e, this.state.context, n);
			} catch (e) {
				Promise.reject(e);
			}
			throw this.#i({
				type: "error",
				error: t
			}), t;
		} finally {
			this.#r === r && (this.#r = void 0), this.#n.runNext(this);
		}
	}
	#i(e) {
		let t = (t) => {
			switch (e.type) {
				case "failed": return {
					...t,
					failureCount: e.failureCount,
					failureReason: e.error
				};
				case "pause": return {
					...t,
					isPaused: !0
				};
				case "continue": return {
					...t,
					isPaused: !1
				};
				case "pending": return {
					...t,
					context: e.context,
					data: void 0,
					failureCount: 0,
					failureReason: null,
					error: null,
					isPaused: e.isPaused,
					status: "pending",
					variables: e.variables,
					submittedAt: Date.now()
				};
				case "success": return {
					...t,
					data: e.data,
					failureCount: 0,
					failureReason: null,
					error: null,
					status: "success",
					isPaused: !1
				};
				case "error": return {
					...t,
					data: void 0,
					error: e.error,
					failureCount: t.failureCount + 1,
					failureReason: e.error,
					isPaused: !1,
					status: "error"
				};
			}
		};
		this.state = t(this.state), bm.batch(() => {
			this.#t.forEach((t) => {
				t.onMutationUpdate(e);
			}), this.#n.notify({
				mutation: this,
				type: "updated",
				action: e
			});
		});
	}
};
function Vm() {
	return {
		context: void 0,
		data: void 0,
		error: null,
		failureCount: 0,
		failureReason: null,
		isPaused: !1,
		status: "idle",
		variables: void 0,
		submittedAt: 0
	};
}
// ../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/mutationCache.js
var Hm = class extends gm {
	#e;
	#t;
	#n;
	constructor(e = {}) {
		super(), this.config = e, this.#e = /* @__PURE__ */ new Set(), this.#t = /* @__PURE__ */ new Map(), this.#n = 0;
	}
	build(e, t, n) {
		let r = new Bm({
			client: e,
			mutationCache: this,
			mutationId: ++this.#n,
			options: e.defaultMutationOptions(t),
			state: n
		});
		return this.add(r), r;
	}
	add(e) {
		this.#e.add(e);
		let t = Um(e);
		if (typeof t == "string") {
			let n = this.#t.get(t);
			n ? n.push(e) : this.#t.set(t, [e]);
		}
		this.notify({
			type: "added",
			mutation: e
		});
	}
	remove(e) {
		if (this.#e.delete(e)) {
			let t = Um(e);
			if (typeof t == "string") {
				let n = this.#t.get(t);
				if (n) {
					if (n.length > 1) {
						let t = n.indexOf(e);
						t !== -1 && n.splice(t, 1);
					} else n[0] === e && this.#t.delete(t);
				}
			}
		}
		this.notify({
			type: "removed",
			mutation: e
		});
	}
	canRun(e) {
		let t = Um(e);
		if (typeof t == "string") {
			let n = this.#t.get(t)?.find((e) => e.state.status === "pending");
			return !n || n === e;
		}
		return !0;
	}
	runNext(e) {
		let t = Um(e);
		return typeof t == "string" ? (this.#t.get(t)?.find((t) => t !== e && t.state.isPaused))?.continue() ?? Promise.resolve() : Promise.resolve();
	}
	clear() {
		bm.batch(() => {
			let e = this.getAll();
			this.#e.clear(), this.#t.clear(), e.forEach((e) => {
				this.notify({
					type: "removed",
					mutation: e
				});
			});
		});
	}
	getAll() {
		return Array.from(this.#e);
	}
	find(e) {
		let t = {
			exact: !0,
			...e
		};
		return this.getAll().find((e) => Zp(t, e));
	}
	findAll(e = {}) {
		return this.getAll().filter((t) => Zp(e, t));
	}
	notify(e) {
		bm.batch(() => {
			this.listeners.forEach((t) => {
				t(e);
			});
		});
	}
	resumePausedMutations() {
		let e = this.getAll().filter((e) => e.state.isPaused);
		return bm.batch(() => Promise.all(e.map((e) => e.continue().catch(Kp))));
	}
};
function Um(e) {
	return e.options.scope?.id;
}
// ../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/queryCache.js
var Wm = class extends gm {
	#e;
	constructor(e = {}) {
		super(), this.config = e, this.#e = /* @__PURE__ */ new Map();
	}
	build(e, t, n) {
		let r = t.queryKey, i = t.queryHash ?? Qp(r, t), a = this.get(i);
		return a || (a = new Am({
			client: e,
			queryKey: r,
			queryHash: i,
			options: e.defaultQueryOptions(t),
			state: n,
			defaultOptions: e.getQueryDefaults(r)
		}), this.add(a)), a;
	}
	add(e) {
		this.#e.has(e.queryHash) || (this.#e.set(e.queryHash, e), this.notify({
			type: "added",
			query: e
		}));
	}
	remove(e) {
		this.#e.get(e.queryHash) === e && (e.destroy(), this.#e.delete(e.queryHash), this.notify({
			type: "removed",
			query: e
		}));
	}
	clear() {
		bm.batch(() => {
			this.getAll().forEach((e) => {
				this.remove(e);
			});
		});
	}
	get(e) {
		return this.#e.get(e);
	}
	getAll() {
		return [...this.#e.values()];
	}
	find(e) {
		let t = {
			exact: !0,
			...e
		};
		return this.getAll().find((e) => Xp(t, e));
	}
	findAll(e = {}) {
		let t = this.getAll();
		return Object.keys(e).length > 0 ? t.filter((t) => Xp(e, t)) : t;
	}
	notify(e) {
		bm.batch(() => {
			this.listeners.forEach((t) => {
				t(e);
			});
		});
	}
	onFocus() {
		bm.batch(() => {
			this.getAll().forEach((e) => {
				e.onFocus();
			});
		});
	}
	onOnline() {
		bm.batch(() => {
			this.getAll().forEach((e) => {
				e.onOnline();
			});
		});
	}
}, Gm = class {
	#e;
	#t;
	#n;
	#r;
	#i;
	#a;
	#o;
	#s;
	constructor(e = {}) {
		this.#e = e.queryCache || new Wm(), this.#t = e.mutationCache || new Hm(), this.#n = e.defaultOptions || {}, this.#r = /* @__PURE__ */ new Map(), this.#i = /* @__PURE__ */ new Map(), this.#a = 0;
	}
	mount() {
		this.#a++, this.#a === 1 && (this.#o = _m.subscribe(async (e) => {
			e && (await this.resumePausedMutations(), this.#e.onFocus());
		}), this.#s = xm.subscribe(async (e) => {
			e && (await this.resumePausedMutations(), this.#e.onOnline());
		}));
	}
	unmount() {
		this.#a--, this.#a === 0 && (this.#o?.(), this.#o = void 0, this.#s?.(), this.#s = void 0);
	}
	isFetching(e) {
		return this.#e.findAll({
			...e,
			fetchStatus: "fetching"
		}).length;
	}
	isMutating(e) {
		return this.#t.findAll({
			...e,
			status: "pending"
		}).length;
	}
	getQueryData(e) {
		let t = this.defaultQueryOptions({ queryKey: e });
		return this.#e.get(t.queryHash)?.state.data;
	}
	ensureQueryData(e) {
		let t = this.defaultQueryOptions(e), n = this.#e.build(this, t), r = n.state.data;
		return r === void 0 ? this.fetchQuery(e) : (e.revalidateIfStale && n.isStaleByTime($(t.staleTime, n)) && this.prefetchQuery(t), Promise.resolve(r));
	}
	getQueriesData(e) {
		return this.#e.findAll(e).map(({ queryKey: e, state: t }) => [e, t.data]);
	}
	setQueryData(e, t, n) {
		let r = this.defaultQueryOptions({ queryKey: e }), i = this.#e.get(r.queryHash)?.state.data, a = qp(t, i);
		if (a !== void 0) return this.#e.build(this, r).setData(a, {
			...n,
			manual: !0
		});
	}
	setQueriesData(e, t, n) {
		return bm.batch(() => this.#e.findAll(e).map(({ queryKey: e }) => [e, this.setQueryData(e, t, n)]));
	}
	getQueryState(e) {
		let t = this.defaultQueryOptions({ queryKey: e });
		return this.#e.get(t.queryHash)?.state;
	}
	removeQueries(e) {
		let t = this.#e;
		bm.batch(() => {
			t.findAll(e).forEach((e) => {
				t.remove(e);
			});
		});
	}
	resetQueries(e, t) {
		let n = this.#e;
		return bm.batch(() => {
			let r = n.findAll(e), i = new Set(r);
			return r.forEach((e) => {
				e.reset();
			}), this.refetchQueries({
				type: "active",
				predicate: (e) => i.has(e)
			}, t);
		});
	}
	cancelQueries(e, t = {}) {
		let n = {
			revert: !0,
			...t
		}, r = bm.batch(() => this.#e.findAll(e).map((e) => e.cancel(n)));
		return Promise.all(r).then(Kp).catch(Kp);
	}
	invalidateQueries(e, t = {}) {
		return bm.batch(() => (this.#e.findAll(e).forEach((e) => {
			e.invalidate();
		}), e?.refetchType === "none" ? Promise.resolve() : this.refetchQueries({
			...e,
			type: e?.refetchType ?? e?.type ?? "active"
		}, t)));
	}
	refetchQueries(e, t = {}) {
		let n = {
			...t,
			cancelRefetch: t.cancelRefetch ?? !0
		}, r = bm.batch(() => this.#e.findAll(e).filter((e) => !e.isDisabled() && !e.isStatic()).map((e) => {
			let t = e.fetch(void 0, n);
			return n.throwOnError || (t = t.catch(Kp)), e.state.fetchStatus === "paused" ? Promise.resolve() : t;
		}));
		return Promise.all(r).then(Kp);
	}
	async query(e) {
		let t = this.defaultQueryOptions(e);
		t.retry === void 0 && (t.retry = !1);
		let n = this.#e.build(this, t), r = n.isStaleByTime($(t.staleTime, n)) ? await n.fetch(t) : n.state.data, i = t.select;
		return i ? i(r) : r;
	}
	fetchQuery(e) {
		let t = this.defaultQueryOptions(e);
		t.retry === void 0 && (t.retry = !1);
		let n = this.#e.build(this, t);
		return n.isStaleByTime($(t.staleTime, n)) ? n.fetch(t) : Promise.resolve(n.state.data);
	}
	prefetchQuery(e) {
		return this.fetchQuery(e).then(Kp).catch(Kp);
	}
	infiniteQuery(e) {
		return e._type = "infinite", this.query(e);
	}
	fetchInfiniteQuery(e) {
		return e._type = "infinite", this.fetchQuery(e);
	}
	prefetchInfiniteQuery(e) {
		return this.fetchInfiniteQuery(e).then(Kp).catch(Kp);
	}
	ensureInfiniteQueryData(e) {
		return e._type = "infinite", this.ensureQueryData(e);
	}
	resumePausedMutations() {
		return xm.isOnline() ? this.#t.resumePausedMutations() : Promise.resolve();
	}
	getQueryCache() {
		return this.#e;
	}
	getMutationCache() {
		return this.#t;
	}
	getDefaultOptions() {
		return this.#n;
	}
	setDefaultOptions(e) {
		this.#n = e;
	}
	setQueryDefaults(e, t) {
		this.#r.set($p(e), {
			queryKey: e,
			defaultOptions: t
		});
	}
	getQueryDefaults(e) {
		let t = [...this.#r.values()], n = {};
		return t.forEach((t) => {
			em(e, t.queryKey) && Object.assign(n, t.defaultOptions);
		}), n;
	}
	setMutationDefaults(e, t) {
		this.#i.set($p(e), {
			mutationKey: e,
			defaultOptions: t
		});
	}
	getMutationDefaults(e) {
		let t = [...this.#i.values()], n = {};
		return t.forEach((t) => {
			em(e, t.mutationKey) && Object.assign(n, t.defaultOptions);
		}), n;
	}
	defaultQueryOptions(e) {
		if (e._defaulted) return e;
		let t = {
			...this.#n.queries,
			...this.getQueryDefaults(e.queryKey),
			...e,
			_defaulted: !0
		};
		return t.queryHash ||= Qp(t.queryKey, t), t.refetchOnReconnect === void 0 && (t.refetchOnReconnect = t.networkMode !== "always"), t.throwOnError === void 0 && (t.throwOnError = !!t.suspense), !t.networkMode && t.persister && (t.networkMode = "offlineFirst"), t.queryFn === dm && (t.enabled = !1), t;
	}
	defaultMutationOptions(e) {
		return e?._defaulted ? e : {
			...this.#n.mutations,
			...e?.mutationKey && this.getMutationDefaults(e.mutationKey),
			...e,
			_defaulted: !0
		};
	}
	clear() {
		this.#e.clear(), this.#t.clear();
	}
}, Km = class extends An {
	constructor(e) {
		super(e), this.name = "QueryCollectionError";
	}
}, qm = class extends Km {
	constructor() {
		super("[QueryCollection] queryKey must be provided."), this.name = "QueryKeyRequiredError";
	}
}, Jm = class extends Km {
	constructor() {
		super("[QueryCollection] queryFn must be provided."), this.name = "QueryFnRequiredError";
	}
}, Ym = class extends Km {
	constructor() {
		super("[QueryCollection] queryClient must be provided."), this.name = "QueryClientRequiredError";
	}
}, Xm = class extends Km {
	constructor() {
		super("[QueryCollection] getKey must be provided."), this.name = "GetKeyRequiredError";
	}
}, Zm = class extends Km {
	constructor() {
		super("[QueryCollection] initialData and initialDataUpdatedAt are only supported when syncMode is 'eager'. Seed or hydrate the exact Query cache key for on-demand subsets instead."), this.name = "InitialDataInOnDemandModeError";
	}
}, Qm = class extends Km {
	constructor(e) {
		super(e), this.name = "InvalidQueryResultError";
	}
}, $m = class extends Km {
	constructor() {
		super("Collection must be in 'ready' state for manual sync operations. Sync not initialized yet."), this.name = "SyncNotInitializedError";
	}
}, eh = class extends Km {
	constructor(e) {
		super(`Duplicate key '${e}' found within batch operations`), this.name = "DuplicateKeyInBatchError";
	}
}, th = class extends Km {
	constructor(e) {
		super(`Update operation: Item with key '${e}' does not exist`), this.name = "UpdateOperationItemNotFoundError";
	}
}, nh = class extends Km {
	constructor(e) {
		super(`Delete operation: Item with key '${e}' does not exist`), this.name = "DeleteOperationItemNotFoundError";
	}
}, rh = /* @__PURE__ */ new WeakMap(), ih = /* @__PURE__ */ new WeakSet();
function ah(e, t) {
	let n = Array.isArray(e) ? e : [e], r = [];
	for (let e of n) if (e.type === "delete") {
		let t = Array.isArray(e.key) ? e.key : [e.key];
		for (let e of t) r.push({
			type: "delete",
			key: e
		});
	} else {
		let n = Array.isArray(e.data) ? e.data : [e.data];
		for (let i of n) {
			let n;
			if (e.type === "update") n = t.getKey(i);
			else {
				let r = t.collection.validateData(i, e.type === "upsert" ? "insert" : e.type);
				n = t.getKey(r);
			}
			r.push({
				type: e.type,
				key: n,
				data: i
			});
		}
	}
	return r;
}
function oh(e, t) {
	let n = /* @__PURE__ */ new Set();
	for (let r of e) {
		if (n.has(r.key)) throw new eh(r.key);
		if (n.add(r.key), r.type === "insert") {
			if (t.collection._state.getAcceptedSyncedRow(r.key)) throw new qn(r.key, t.collection.id);
		} else if (r.type === "update") {
			if (!t.collection._state.getAcceptedSyncedRow(r.key)) throw new th(r.key);
		} else if (r.type === "delete" && !t.collection._state.getAcceptedSyncedRow(r.key)) throw new nh(r.key);
	}
}
function sh(e, t, n) {
	let r;
	try {
		r = ah(e, t);
	} catch (e) {
		return Promise.reject(e);
	}
	let i = t.reserveDirectWrite?.() ?? 0, a = t.earlierCommits?.();
	if (!a) try {
		return ch(r, t, i);
	} catch (e) {
		return Promise.reject(e);
	}
	let o = a.then(() => {
		if (!n()) throw new Qr();
		return ch(r, t, i);
	});
	return t.noteWaitingDirectWrite?.(o.then(() => void 0, () => void 0)), o;
}
function ch(e, t, n) {
	oh(e, t), t.claimDirectWriteKeys?.(e.map((e) => e.key), n), t.begin();
	for (let n of e) switch (n.type) {
		case "insert": {
			let e = t.collection.validateData(n.data, "insert");
			t.write({
				type: "insert",
				value: e
			});
			break;
		}
		case "update": {
			let e = {
				...t.collection._state.getAcceptedSyncedRow(n.key),
				...n.data
			}, r = t.collection.validateData(e, "update", n.key);
			t.write({
				type: "update",
				value: r
			});
			break;
		}
		case "delete": {
			let e = t.collection._state.getAcceptedSyncedRow(n.key);
			t.write({
				type: "delete",
				value: e
			});
			break;
		}
		case "upsert": {
			let e = t.collection._state.getAcceptedSyncedRow(n.key) !== void 0, r = t.collection.validateData(n.data, e ? "update" : "insert", n.key);
			e ? t.write({
				type: "update",
				value: r
			}) : t.write({
				type: "insert",
				value: r
			});
			break;
		}
	}
	let r = cc(t.commit()), i = () => {
		let r = (e) => e ? e.map((e) => t.collection._state.getAcceptedSyncedRow(e)).filter((e) => e !== void 0) : Array.from(t.collection._state.acceptedSyncedEntries(), ([, e]) => e);
		t.updateCacheData ? t.updateCacheData(r, e.map((e) => e.key), n) : t.queryClient.setQueryData(t.queryKey, r());
	};
	r === !0 && i();
	let a = Promise.resolve(r).then(() => {
		r !== !0 && i();
	});
	return a.catch(() => void 0), a;
}
function lh(e) {
	function t() {
		let t = e();
		if (!t) throw new $m();
		return t;
	}
	function n(n) {
		let r = t(), i = rh.get(r);
		if (i) return i.operations.push(n), i.completion;
		let a = sh(n, r, () => e() === r);
		return ih.add(a), a;
	}
	return {
		writeInsert(e) {
			return n({
				type: "insert",
				data: e
			});
		},
		writeUpdate(e) {
			return n({
				type: "update",
				data: e
			});
		},
		writeDelete(e) {
			return n({
				type: "delete",
				key: e
			});
		},
		writeUpsert(e) {
			return n({
				type: "upsert",
				data: e
			});
		},
		writeBatch(n) {
			let r = t();
			if (rh.get(r)) throw Error("Cannot nest writeBatch calls. Complete the current batch before starting a new one.");
			let i, a, o = new Promise((e, t) => {
				i = e, a = t;
			});
			ih.add(o), o.catch(() => void 0);
			let s = {
				operations: [],
				completion: o
			};
			rh.set(r, s);
			try {
				let t = n();
				if (typeof t == "object" && t && "then" in t && typeof t.then == "function" && !ih.has(t)) throw Promise.resolve(t).catch(() => void 0), Error("writeBatch does not support async callbacks. The callback must be synchronous.");
				return rh.delete(r), i(s.operations.length > 0 ? sh(s.operations, r, () => e() === r) : Promise.resolve()), o;
			} catch (e) {
				throw a(e), e;
			} finally {
				rh.get(r) === s && rh.delete(r);
			}
		}
	};
}
// ../node_modules/.pnpm/@tanstack+query-db-collection@1.4.8_@tanstack+query-core@5.104.5_typescript@6.0.3/node_modules/@tanstack/query-db-collection/dist/esm/cleanup.js
function uh(e, t) {
	let n;
	try {
		n = e?.();
	} catch (e) {
		try {
			t();
		} catch (t) {
			throw fh(e, t);
		}
		throw e;
	}
	try {
		t();
	} catch (e) {
		if (!dh(n)) throw e;
		return Promise.resolve(n).then(() => {
			throw e;
		}, (t) => {
			throw fh(t, e);
		});
	}
	return dh(n) ? Promise.resolve(n) : void 0;
}
function dh(e) {
	return !!e && (typeof e == "object" || typeof e == "function") && typeof e.then == "function";
}
function fh(e, t) {
	return AggregateError([e, t], "Adapter cleanup and local teardown both failed", { cause: e });
}
// ../node_modules/.pnpm/@tanstack+query-db-collection@1.4.8_@tanstack+query-core@5.104.5_typescript@6.0.3/node_modules/@tanstack/query-db-collection/dist/esm/query.js
function ph(e) {
	return typeof e == "object" && !!e;
}
var mh = [
	"enabled",
	"refetchInterval",
	"retry",
	"retryDelay",
	"staleTime",
	"gcTime",
	"refetchOnWindowFocus",
	"refetchOnReconnect",
	"refetchOnMount",
	"networkMode"
];
function hh(e) {
	let t = {};
	for (let n of mh) e[n] !== void 0 && (t[n] = e[n]);
	return t;
}
var gh = "queryCollection:gc:", _h = 0, vh = /* @__PURE__ */ new WeakMap(), yh = /* @__PURE__ */ new WeakMap(), bh = /* @__PURE__ */ new WeakMap(), xh = /* @__PURE__ */ new WeakMap(), Sh = /* @__PURE__ */ new WeakMap(), Ch = /* @__PURE__ */ new WeakMap(), wh = /* @__PURE__ */ new WeakMap(), Th = class {
	constructor(e, t, n) {
		this.state = e, this.refetch = t, this.writeInsert = n.writeInsert, this.writeUpdate = n.writeUpdate, this.writeDelete = n.writeDelete, this.writeUpsert = n.writeUpsert, this.writeBatch = n.writeBatch;
	}
	async clearError() {
		await this.refetch({ throwOnError: !0 });
	}
	get lastError() {
		return this.state.lastError;
	}
	get isError() {
		return !!this.state.lastError;
	}
	get errorCount() {
		return this.state.errorCount;
	}
	get isFetching() {
		return Array.from(this.state.observers.values()).some((e) => e.getCurrentResult().isFetching);
	}
	get isRefetching() {
		return Array.from(this.state.observers.values()).some((e) => e.getCurrentResult().isRefetching);
	}
	get isLoading() {
		return Array.from(this.state.observers.values()).some((e) => e.getCurrentResult().isLoading);
	}
	get dataUpdatedAt() {
		return Math.max(0, ...Array.from(this.state.observers.values()).map((e) => e.getCurrentResult().dataUpdatedAt));
	}
	get fetchStatus() {
		let e = "idle";
		for (let t of this.state.observers.values()) {
			let n = t.getCurrentResult().fetchStatus;
			if (n === "fetching") return "fetching";
			n === "paused" && (e = "paused");
		}
		return e;
	}
};
function Eh(e) {
	let { queryKey: t, queryFn: n, select: r, queryClient: i, enabled: a, refetchInterval: o, retry: s, retryDelay: c, staleTime: l, gcTime: u, refetchOnWindowFocus: d, refetchOnReconnect: f, refetchOnMount: p, networkMode: m, initialData: h, initialDataUpdatedAt: g, persistedGcTime: _, getKey: v, onInsert: y, onUpdate: b, onDelete: x, meta: S, ...C } = e, w = C.syncMode ?? "eager";
	if (w === "on-demand" && (h !== void 0 || g !== void 0)) throw new Zm();
	let T = w === "eager" ? {
		...h !== void 0 && { initialData: h },
		...g !== void 0 && { initialDataUpdatedAt: g },
		placeholderData: void 0
	} : {
		initialData: () => void 0,
		initialDataUpdatedAt: void 0,
		placeholderData: void 0
	}, E = typeof t == "function" ? t({}) : t, D = w === "on-demand" && typeof t != "function" ? E : void 0, O = D && $p(D), ee = (e) => {
		typeof t == "function" && (e.length >= E.length && E.every((t, n) => q(t, e[n])) || console.warn(`[QueryCollection] queryKey function must return keys that extend the base key prefix. Base: ${JSON.stringify(E)}, Got: ${JSON.stringify(e)}. This can cause stale cache issues.`));
	};
	if (!t) throw new qm();
	if (!n) throw new Jm();
	if (!i) throw new Ym();
	if (!v) throw new Xm();
	let k = {
		lastError: void 0,
		errorCount: 0,
		observers: /* @__PURE__ */ new Map()
	}, te = 0, A = /* @__PURE__ */ new WeakMap(), ne = /* @__PURE__ */ new WeakMap(), j = /* @__PURE__ */ new WeakSet(), re = {}, M, N = /* @__PURE__ */ new WeakMap(), ie, P = 0, F = !1, ae = (e, t) => {
		if (M.add(e), t !== void 0) {
			let n = N.get(e) ?? /* @__PURE__ */ new Set();
			n.add(t), N.set(e, n);
		}
	}, oe = (e, t) => {
		j.add(e), ae(e, t);
		let n = Ch.get(e) ?? /* @__PURE__ */ new Set();
		n.add(re), Ch.set(e, n);
	}, se = (e) => N.get(e) ?? /* @__PURE__ */ new Set([$p(e.queryKey)]), I = (e, t, n) => {
		let r = ne.get(e) ?? /* @__PURE__ */ new Map();
		ne.set(e, r);
		let i = r.get(t) ?? /* @__PURE__ */ new Map();
		r.set(t, i);
		let a = i.get(n) ?? {};
		return i.set(n, a), a;
	}, ce = (e, t) => A.get(t)?.get(e), L = (e, t, n) => {
		let r = A.get(t) ?? /* @__PURE__ */ new Map();
		r.set(e, n), A.set(t, r);
	}, le = (e, t) => {
		for (let n of se(e)) {
			let r = k.observers.get(n);
			if (!r || r.getCurrentQuery() !== e) continue;
			let i = r.getCurrentResult(), a = I(e, t, n);
			a.result = i;
			let o = ce(n, i);
			o && (a.settlement = o);
		}
	}, ue = (e, t) => {
		let n = ne.get(e)?.get(t);
		if (n) for (let [e, t] of n) {
			if (!t.result) continue;
			let n = ce(e, t.result);
			n && (t.settlement = n);
		}
	}, R = (e, t) => {
		let n = ne.get(e);
		if (n) {
			for (let e of t) n.delete(e);
			n.size === 0 && ne.delete(e);
		}
	}, de = (e) => ie === void 0 || (bh.get(e) ?? 0) > ie, fe = /* @__PURE__ */ new Map(), z = /* @__PURE__ */ new Map(), pe = /* @__PURE__ */ new WeakSet(), me = (e) => {
		let t = z.get(e);
		return t !== void 0 && !pe.has(t);
	}, B = /* @__PURE__ */ new Map(), he = /* @__PURE__ */ new Map(), ge = /* @__PURE__ */ new Map(), V = 0, _e = /* @__PURE__ */ new Map(), ve = /* @__PURE__ */ new Map(), ye = 0, H = /* @__PURE__ */ new WeakSet(), be = /* @__PURE__ */ new WeakMap(), U = /* @__PURE__ */ new Map(), xe = (e, t) => {
		let n = yh.get(e) ?? U.get(t);
		e.state.fetchStatus === "fetching" && (n ?? V) < V && e.cancel({ silent: !0 });
	}, Se = /* @__PURE__ */ new Map(), Ce = /* @__PURE__ */ new Map(), we, Te = !1, Ee = /* @__PURE__ */ new WeakMap(), De = 0, Oe = /* @__PURE__ */ new Map(), ke = /* @__PURE__ */ new Map(), Ae = () => {}, je = (e, t) => !1, Me = (e) => void 0, Ne, Pe = (e, t) => {
		let n = B.get(e) || /* @__PURE__ */ new Set();
		n.add(t), B.set(e, n);
		let r = z.get(t) || /* @__PURE__ */ new Set();
		r.add(e), z.set(t, r);
	}, Fe = (e, t) => {
		t.size === 0 ? B.delete(e) : (B.set(e, new Set(t)), t.forEach((t) => {
			let n = z.get(t) || /* @__PURE__ */ new Set();
			n.add(e), z.set(t, n);
		}));
	}, Ie = (e, t) => {
		let n = B.get(e);
		return n?.delete(t), n?.size || B.delete(e), z.get(t)?.delete(e), !n?.size;
	}, Le = (e) => {
		let t = /* @__PURE__ */ new Map();
		z.get(e)?.forEach((n) => {
			let r = new Set(B.get(n));
			r.delete(e), t.set(n, r), r.size === 0 ? B.delete(n) : B.set(n, r);
		});
		let n = /* @__PURE__ */ new Set();
		return pe.add(n), z.set(e, n), t;
	}, Re = (e) => {
		let h = {};
		Ne = h, Se.clear(), ie = void 0, F = !1, M = new Set(i.getQueryCache().findAll({ queryKey: E }));
		for (let e of M) e.state.fetchStatus === "fetching" && U.set($p(e.queryKey), yh.get(e) ?? U.get($p(e.queryKey)) ?? V);
		let { begin: g, write: y, commit: b, markReady: x, markError: C, invalidateLoadedSubsets: te, collection: A, metadata: N } = e, I = /* @__PURE__ */ new WeakMap(), pe = /* @__PURE__ */ new Map(), Re, ze = (e, t, n) => {
			let r = e.meta?.loadSubsetOptions;
			if (w !== "on-demand" || !ph(r) || !r.orderBy?.length) return;
			let i = I.get(e), { where: a, orderBy: o } = r, s = {
				readKey: i?.readKey ?? Zu({
					where: a,
					orderBy: o
				}),
				leadingValue: i?.leadingValue ?? xa(o[0].expression),
				compare: i?.compare ?? Ei(o[0].compareOptions),
				keys: JSON.stringify(n.map((e) => JSON.stringify(v(e))).sort()),
				last: void 0
			};
			for (let e of n) {
				let t = s.leadingValue(e);
				(s.last === void 0 || s.compare(t, s.last.value) > 0) && (s.last = { value: t });
			}
			if (I.set(e, s), Re !== void 0 || pe.has(t) || i?.last === void 0 || i.keys === s.keys) return;
			let c = i.last.value;
			(s.last === void 0 || s.compare(s.last.value, c) < 0 || [...k.observers.values()].some((e) => {
				let t = I.get(e.getCurrentQuery());
				return t !== void 0 && t !== s && t.readKey === s.readKey && (t.last === void 0 || s.compare(t.last.value, c) > 0);
			})) && (Re = setTimeout(() => {
				Re = void 0, Ne === h && te();
			}, 0));
		}, W = N === void 0 ? null : Ip(N.persistence);
		if (W?.startupCacheGenerationRotated === !0) {
			ie = _h;
			for (let e of M) e.state.fetchStatus !== "idle" && yh.get(e) === void 0 && yh.set(e, ie);
		}
		let Ve = !1, Ue = !1, We = /* @__PURE__ */ new Map(), Ge = /* @__PURE__ */ new Set(), Ke = /* @__PURE__ */ new WeakMap(), qe = 0, Je = /* @__PURE__ */ new Map(), Ye = /* @__PURE__ */ new WeakMap(), Xe = /* @__PURE__ */ new Set(), Ze = /* @__PURE__ */ new Map(), Qe = (e) => Ye.get(e), $e = (e, t) => {
			Ye.set(e, t);
		};
		Me = Qe;
		let et = /* @__PURE__ */ new Map(), tt = /* @__PURE__ */ new Map(), G = /* @__PURE__ */ new Map(), nt = Promise.resolve(), rt = (e) => {
			let t = et.get(e);
			t?.rollback?.(), Se.delete(e), Je.delete(e), et.delete(e), t?.abort();
		}, it = async (e) => {
			for (;;) {
				let t = Se.get(e);
				if (!t) return;
				try {
					await t;
				} catch (n) {
					if (Se.get(e) === t || Je.has(e) && Je.get(e) === n) throw n;
				}
			}
		}, at = (e, t, n, r = () => !0) => new Promise((i, a) => {
			let o = !0, s = () => {}, c = ge.get(t) ?? /* @__PURE__ */ new Set(), l = (e) => {
				o && (o = !1, s(), c.delete(u), c.size === 0 && ge.delete(t), e());
			}, u = () => {
				l(() => a(n()));
			};
			c.add(u), ge.set(t, c), s = e.subscribe((e) => {
				queueMicrotask(() => {
					(e.isSuccess && !A.deferDataRefresh || e.isError && !e.isFetching) && r(e) && l(() => i(e));
				});
			});
		}), ot = (e, t) => {
			let n = Ze.get(t) ?? /* @__PURE__ */ new Map(), r = n.get(e);
			if (r) return r;
			let i = t.then(async () => {
				let t = k.observers.get(e);
				if (!t) throw new wm();
				let n = await t.refetch();
				for (;;) {
					if (!n.isSuccess) return n;
					if (await new Promise((e) => queueMicrotask(e)), A.deferDataRefresh) {
						n = await at(t, e, () => new wm());
						continue;
					}
					let r = Qe(n);
					if (r?.type === "rejected") throw r.error;
					if (r?.type === "pending") return r.promise;
					let i = ct(e);
					return i !== !0 && await i, n;
				}
			});
			n.set(e, i), Ze.set(t, n);
			let a = () => {
				n.get(e) === i && (n.delete(e), n.size === 0 && Ze.delete(t));
			};
			return i.then(a, a), i;
		}, st = (e, t, n) => {
			let r = Qe(t);
			if (r?.type === "pending") return r;
			let i, a = new Promise((e, t) => {
				i = t, n.then(e, t);
			});
			a.catch(() => {});
			let o = {
				type: "pending",
				promise: a,
				reject: i
			};
			return $e(t, o), Xe.add(o), a.then(() => {
				Xe.delete(o);
			}, () => {
				Xe.delete(o);
			}), o;
		}, ct = (e) => Se.get(e) ? it(e) : !Je.has(e) || Promise.reject(Je.get(e)), lt = (e) => N?.row.get(e) ?? A._state.syncedMetadata.get(e), ut = (e, t) => {
			if (!e || typeof e != "object") return /* @__PURE__ */ new Set();
			let n = e.queryCollection;
			if (!n || typeof n != "object") return /* @__PURE__ */ new Set();
			let r = n.owners;
			if (!r || typeof r != "object") return /* @__PURE__ */ new Set();
			let i = new Set(Object.keys(r));
			return t === void 0 || (i.forEach((e) => {
				let n = z.get(e);
				n && !n.has(t) && i.delete(e);
			}), B.get(t)?.forEach((e) => i.add(e))), i;
		}, dt = (e) => ut(lt(e), e), ft = (e, t) => {
			if (!N) return;
			let n = { ...lt(e) ?? {} };
			t.size === 0 ? (delete n.queryCollection, Object.keys(n).length === 0 ? N.row.delete(e) : N.row.set(e, n)) : N.row.set(e, {
				...n,
				queryCollection: { owners: Object.fromEntries(Array.from(t.values()).map((e) => [e, !0])) }
			});
		}, pt = (e, t) => {
			if (!e || typeof e != "object") return;
			let n = e;
			if (n.queryHash === t) {
				if (n.mode === "until-revalidated") return {
					queryHash: t,
					mode: "until-revalidated"
				};
				if (n.mode === "ttl" && typeof n.expiresAt == "number" && Number.isFinite(n.expiresAt)) return {
					queryHash: t,
					mode: "ttl",
					expiresAt: n.expiresAt
				};
			}
		}, mt = (e) => (nt = nt.then(e, e), nt), ht = (e) => {
			let t = G.get(e);
			t && (clearTimeout(t), G.delete(e));
		}, gt = (e) => {
			let t = z.get(e);
			if (t) return new Set(t);
			let n = /* @__PURE__ */ new Set(), r = Array.from(A._state.syncedData.keys(), (e) => [e, dt(e)]);
			for (let [t, i] of r) i.size !== 0 && (Fe(t, i), i.has(e) && n.add(t));
			return n;
		}, _t = async (e, t = !1) => {
			let n = P, r = z.get(e);
			if (r && (r.size > 0 || t) && Array.from(r).every((e) => A.has(e))) {
				let e = /* @__PURE__ */ new Map();
				return r.forEach((t) => {
					let n = A.get(t), r = B.get(t);
					n && r && e.set(t, {
						value: n,
						owners: new Set(r)
					});
				}), e;
			}
			let i = W?.scanPersistedRows;
			if (!i) {
				let t = /* @__PURE__ */ new Map();
				return gt(e).forEach((e) => {
					let n = A.get(e), r = B.get(e);
					n && r && t.set(e, {
						value: n,
						owners: new Set(r)
					});
				}), t;
			}
			let a = /* @__PURE__ */ new Map(), o = await i();
			if (n !== P || F) return a;
			let s = o.map((e) => ut(e.metadata, e.key));
			return o.forEach((t, n) => {
				let r = s[n];
				r.size !== 0 && (Fe(t.key, r), r.has(e) && a.set(t.key, {
					value: t.value,
					owners: r
				}));
			}), a;
		}, vt = async (e) => {
			if (!N) return;
			let t = P, n = await _t(e);
			if (t !== P || F) return;
			let r = [];
			g(), n.forEach(({ value: t, owners: n }, i) => {
				n.delete(e), ft(i, n), Ie(i, e) && r.push(t);
			}), r.forEach((e) => {
				y({
					type: "delete",
					value: e
				});
			}), N.collection.delete(`${gh}${e}`), b(), z.delete(e);
		}, yt = (e) => {
			if (e.mode !== "ttl") return;
			ht(e.queryHash);
			let t = Math.max(0, e.expiresAt - Date.now()), n = setTimeout(() => {
				G.delete(e.queryHash), mt(async () => {
					let t = N?.collection.get(`${gh}${e.queryHash}`), n = pt(t, e.queryHash);
					!n || n.mode !== "ttl" || n.expiresAt > Date.now() || await vt(e.queryHash);
				});
			}, t);
			G.set(e.queryHash, n);
		}, bt = async () => {
			if (!N) return;
			let e = N.collection.list(gh), t = Date.now();
			for (let { key: n, value: r } of e) {
				let e = n.slice(gh.length), i = pt(r, e);
				i && (i.mode === "ttl" && i.expiresAt <= t ? await vt(i.queryHash) : i.mode === "ttl" && yt(i));
			}
		}, xt = (e) => {
			if (typeof t == "function") {
				let { refetch: n, ...r } = e;
				return t(r);
			}
			if (w === "on-demand") {
				let n = Zu(e);
				return n === void 0 ? t : [...t, n];
			}
			return t;
		}, St = N?.collection.list(gh), Ct = !St || St.length === 0 ? (Ue = !0, Promise.resolve()) : mt(async () => {
			try {
				await bt();
			} finally {
				Ue = !0;
			}
		}), wt = (e, t, n) => at(e, t, () => new ei(), n).then((e) => {
			if (e.isError) throw e.error;
		}), Tt = (e, t, n) => wt(e, t, n).then(() => {
			let e = ct(t);
			return e === !0 ? void 0 : e;
		}), Et = async (e, t) => new Promise((n, r) => {
			let i = !0, a = ge.get(t) ?? /* @__PURE__ */ new Set(), o = (e) => {
				if (!i) return;
				i = !1;
				let n = pe.get(t) - 1;
				n === 0 ? pe.delete(t) : pe.set(t, n), a.delete(s), a.size === 0 && ge.delete(t), e();
			}, s = () => {
				o(() => r(new ei()));
			};
			a.add(s), ge.set(t, a), pe.set(t, (pe.get(t) ?? 0) + 1), (async () => {
				let n = !!A.deferDataRefresh;
				for (xe(e.getCurrentQuery(), t);;) {
					if (!i) return;
					try {
						await e.refetch({ throwOnError: !0 });
					} catch (t) {
						let n = yh.get(e.getCurrentQuery());
						if (ie === void 0 || n === void 0 || n > ie) throw t;
						continue;
					}
					if (await new Promise((e) => queueMicrotask(e)), !i) return;
					if (de(e.getCurrentQuery())) break;
				}
				if (n || !de(e.getCurrentQuery())) {
					await Tt(e, t);
					return;
				}
				let r = ct(t);
				r !== !0 && await r;
			})().then(() => o(n), (e) => o(() => r(e)));
		}), Dt = (e, t) => {
			let n = e.getCurrentQuery();
			if (typeof a == "function" ? a(n) : a !== !1) return Et(e, t);
			let r = n.state.dataUpdateCount;
			return Tt(e, t, (t) => {
				if (t.isError) return !0;
				let n = e.getCurrentQuery();
				return n.state.dataUpdateCount > r && Sh.get(n) === n.state.dataUpdateCount && de(n);
			});
		}, Ot = (e = {}, t = n) => {
			if (!Ue) {
				let n = {}, r = We.get(e) ?? /* @__PURE__ */ new Set();
				return r.add(n), We.set(e, r), Ct.then(() => {
					if (!We.get(e)?.delete(n)) throw new ei();
					r.size === 0 && We.delete(e);
					let i = Ot(e, t);
					return i === !0 ? void 0 : i;
				});
			}
			let g = xt(e), y = $p(g), b = O === void 0 ? void 0 : k.observers.get(O), x = ke.has(y);
			if (x && b === void 0) throw Error("A full-source dependent lost its Query observer");
			let C = b?.getCurrentQuery(), E = b?.getCurrentResult(), te = E !== void 0 && ce(O, E) !== void 0, ne = N?.collection.get(`${gh}${y}`), j = pt(ne, y) !== void 0, M = !e.refetch && D !== void 0 && O !== y && (x || !j && !k.observers.has(y) && (Oe.get(O) ?? 0) > 0 && E?.isSuccess === !0 && C?.state.fetchStatus === "idle" && de(C) && !Se.has(O) && !Je.has(O) && te), P = M ? D : g, F = M ? O : y, { subscription: ae, refetch: se, ...I } = e, L = { ...S };
			Object.defineProperty(L, "loadSubsetOptions", {
				value: I,
				enumerable: !1,
				configurable: !0,
				writable: !0
			});
			let le = F === y ? ne : N?.collection.get(`${gh}${F}`);
			if (pt(le, F) !== void 0 && Ge.add(F), ht(F), ee(P), k.observers.has(F)) {
				Oe.set(F, (Oe.get(F) || 0) + 1), M && ke.set(y, (ke.get(y) ?? 0) + 1);
				let t = k.observers.get(F), n = t.getCurrentResult();
				if (e.refetch) return Et(t, F);
				let r = t.getCurrentQuery(), i = wh.get(r);
				return Ee.has(r) || w === "on-demand" && i !== void 0 && (i.owner !== re || i.session !== h) || V > 0 && r.state.dataUpdateCount > (Sh.get(r) ?? 0) || !de(t.getCurrentQuery()) ? Dt(t, F) : n.isSuccess ? A.deferDataRefresh ? Tt(t, F) : ct(F) : n.isError && !n.isFetching ? Promise.reject(n.error) : Tt(t, F);
			}
			let ue = {
				...hh({
					enabled: a,
					refetchInterval: o,
					retry: s,
					retryDelay: c,
					staleTime: l,
					gcTime: u,
					refetchOnWindowFocus: d,
					refetchOnReconnect: f,
					refetchOnMount: p,
					networkMode: m
				}),
				...T,
				queryKey: P,
				queryFn: (e) => {
					let n = $p(e.queryKey), r = i.getQueryCache().find({
						queryKey: e.queryKey,
						exact: !0
					});
					U.set(n, Math.max(U.get(n) ?? 0, V));
					let a = () => {
						let n = Object.defineProperties({}, Object.getOwnPropertyDescriptors(e));
						return n.meta = {
							...e.meta,
							loadSubsetOptions: {
								...I,
								get signal() {
									return e.signal;
								}
							}
						}, t(n);
					};
					if ((Oe.get(n) ?? 0) > 1 || (r?.getObserversCount() ?? 0) > 1 || F === O && ke.size || I.signal?.aborted) return a();
					let o = (t) => {
						let n = typeof t == "object" && !!t && "name" in t && t.name === "AbortError";
						if (!I.signal?.aborted || t !== I.signal.reason && !n || !r || r.getObserversCount() === 0 || i.getQueryCache().find({
							queryKey: e.queryKey,
							exact: !0
						}) !== r || r.state.fetchStatus !== "fetching") throw t;
						return a();
					};
					try {
						return Promise.resolve(t(e)).catch(o);
					} catch (e) {
						return o(e);
					}
				},
				meta: L,
				structuralSharing: !0,
				notifyOnChangeProps: "all"
			}, R = new Pm(i, ue), z = R.getCurrentQuery();
			oe(z, F);
			let pe = i.getQueryCache().find({
				queryKey: P,
				exact: !0
			})?.gcTime, me = _ ?? pe;
			fe.set(F, P), k.observers.set(F, R);
			let he = yh.get(z);
			he !== void 0 && (z.state.fetchStatus === "fetching" || xh.get(z) === z.state.data) && U.set(F, he), me === void 0 ? tt.delete(F) : tt.set(F, me), Oe.set(F, (Oe.get(F) || 0) + 1);
			let ge = i.getQueryData(P);
			if (ge !== void 0) {
				let t = wh.get(z), n = w === "on-demand" && t !== void 0 && (t.owner !== re || t.session !== h), i = V > 0 && z.state.dataUpdateCount > (Sh.get(z) ?? 0), a = W?.scanPersistedRows === void 0 ? void 0 : r ? r(ge) : ge, o = W?.scanPersistedRows !== void 0 && Array.isArray(a) && a.some((e) => {
					let t = v(e);
					return A._state.getAcceptedSyncedRow(t) !== void 0 && !_e.has(t) && !B.has(t);
				});
				(Ve || A.subscriberCount > 0) && zt(R, F, n || i || o ? {
					data: z.state.data,
					version: z.state.dataUpdateCount,
					fetchStart: yh.get(z)
				} : void 0);
				let s = R.getCurrentResult();
				return e.refetch || Ee.has(z) || n || i || o ? e.refetch ? Et(R, F) : Dt(R, F) : de(R.getCurrentQuery()) ? s.isError && !s.isFetching ? Promise.reject(s.error) : !s.isSuccess || A.deferDataRefresh ? Tt(R, F) : ct(F) : Dt(R, F);
			}
			if (ie !== void 0) return (Ve || A.subscriberCount > 0) && zt(R, F), Dt(R, F);
			let ve = Tt(R, F);
			return (Ve || A.subscriberCount > 0) && zt(R, F), ve;
		}, kt = (e, t) => {
			let n = t.data, i = r ? r(n) : n, a = r ? "select()" : "queryFn";
			if (!Array.isArray(i)) return { error: new Qm(`@tanstack/query-db-collection: ${a} must return an array of objects. Got: ${typeof i} for queryKey ${JSON.stringify(e)}`) };
			let o = i.findIndex((e) => typeof e != "object" || !e);
			if (o !== -1) {
				let t = i[o];
				return { error: new Qm(`@tanstack/query-db-collection: ${a} must return an array of objects. Invalid item at index ${o}: ${t === null ? "null" : typeof t} for queryKey ${JSON.stringify(e)}`) };
			}
			return { items: i };
		}, At = (e, t, n) => {
			let r = new Map(e.map((e) => [v(e), e]));
			for (let [e, i] of Ce) {
				if (i <= t || w === "on-demand" && !r.has(e) && !z.get(n)?.has(e)) continue;
				let a = A._state.getAcceptedSyncedRow(e);
				a === void 0 ? r.delete(e) : r.set(e, a);
			}
			return Array.from(r.values());
		}, jt = async () => {
			for (; we;) await we;
		}, Mt = (e, t) => {
			let n = kt(e, t);
			if ("error" in n) throw $e(t, {
				type: "rejected",
				error: n.error
			}), n.error;
			return n.items;
		}, Nt = (e, t, n, r, a, o) => {
			let s = $p(e);
			if (A.status === "cleaned-up" || a?.aborted) throw new ei();
			Be() && n.settleRefetchAtFetchBoundary?.();
			let c = o ?? Mt(e, t), l = new Map(A._state.acceptedSyncedEntries()), u = r !== void 0, d = u ? new Set(r.keys()) : gt(s), f = i.getQueryCache().find({
				queryKey: e,
				exact: !0
			}), p = f !== void 0 && xh.get(f) === f.state.data ? bh.get(f) : void 0;
			if (w === "eager") _e.forEach((e, t) => {
				l.has(t) && p !== void 0 && p > e && d.add(t);
			});
			else if (p !== void 0 && (_e.size > 0 || W?.scanPersistedRows !== void 0)) {
				let e = k.observers.get(s)?.options.meta?.loadSubsetOptions;
				if (ph(e) && e.limit === void 0 && e.offset === void 0 && e.cursor === void 0) {
					let t = e.where ? xa(e.where) : void 0;
					l.forEach((e, n) => {
						let r = _e.get(n);
						if (!(r === void 0 ? !W?.scanPersistedRows || dt(n).size > 0 : p <= r)) {
							try {
								if (t && !ba(t(e))) return;
							} catch {
								return;
							}
							d.add(n);
						}
					});
				}
			}
			let m = /* @__PURE__ */ new Map();
			c.forEach((e) => {
				let t = v(e), n = ve.get(t);
				m.set(t, p !== void 0 && n !== void 0 && n > p && l.has(t) ? l.get(t) : e);
			});
			let h = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new Set(), S = z.get(s), C = /* @__PURE__ */ new Set([...d, ...m.keys()]), T = /* @__PURE__ */ new Map();
			C.forEach((e) => {
				let t = B.get(e);
				T.set(e, t ? new Set(t) : void 0);
			});
			let E = !1, D, O = () => {
				D?.applicationStarted || D === void 0 && Array.from(C).every((e) => {
					let t = B.get(e) ?? /* @__PURE__ */ new Set(), n = ut(A._state.syncedMetadata.get(e));
					return t.size === n.size && Array.from(t).every((e) => n.has(e));
				}) || k.observers.has(s) && et.get(s) === n && (S === void 0 ? z.delete(s) : z.set(s, S), T.forEach((e, t) => {
					e === void 0 ? B.delete(t) : B.set(t, e);
				}));
			};
			n.rollback = O;
			let ee = (e) => {
				if (O(), E) {
					let e = new AbortController();
					e.abort();
					try {
						b(e.signal);
					} catch {}
				}
				throw e;
			};
			try {
				z.set(s, new Set(d)), g(), E = !0, N && N.collection.delete(`${gh}${s}`), d.forEach((e) => {
					let t = u ? r.get(e)?.value : l.get(e), n = m.get(e);
					if (n) t && !q(t, n) && y({
						type: "update",
						value: n
					});
					else {
						let t = _e.get(e);
						t !== void 0 && h.set(e, t);
						let n = dt(e);
						n.delete(s), ft(e, n), Ie(e, s) && (y({
							type: "delete",
							key: e
						}), _.add(e));
					}
				}), m.forEach((e, n) => {
					let r = _e.get(n);
					if (!d.has(n) && r !== void 0 && (p ?? 0) <= r) return;
					r !== void 0 && p !== void 0 && p > r && h.set(n, r);
					let i = dt(n), a = !i.has(s), o = !l.has(n);
					a && i.add(s), Pe(n, s), o ? y({
						type: "insert",
						value: e
					}) : !d.has(n) && (t.isFetchedAfterMount || r !== void 0 && p !== void 0 && p > r) && !q(l.get(n), e) && y({
						type: "update",
						value: e
					}), (a || o) && ft(n, i);
				}), D = A._state.pendingSyncedTransactions.at(-1), Be() && n.settleRefetchAtFetchBoundary?.();
				let e = b();
				n.rollback = void 0, E = !1, Ge.delete(s), ht(s);
				let i = () => {
					f && ze(f, s, c), _.forEach((e) => {
						A._state.getAcceptedSyncedRow(e) === void 0 && ve.delete(e);
					});
					let e = (e) => {
						m.forEach((t, n) => {
							A._state.getAcceptedSyncedRow(n) !== void 0 && e > (ve.get(n) ?? 0) && ve.set(n, e);
						}), ye = Math.max(ye, e);
					};
					if (p !== void 0) e(p);
					else if (f) {
						let t = f.state.data;
						queueMicrotask(() => {
							if (xh.get(f) === t) {
								let t = bh.get(f);
								t !== void 0 && e(t);
							}
						});
					}
					h.forEach((e, t) => {
						_e.get(t) === e && _e.delete(t);
					}), a?.aborted || x();
				}, o = cc(e);
				return o === !0 ? i() : o.then(i, () => void 0), e === !0 || e.then(() => void 0, ee);
			} catch (e) {
				return ee(e);
			}
		}, Pt = async (e, t, n, r, a, o) => {
			let s = $p(e), c = a ?? Mt(e, t), l = await _t(s, c.length === 0);
			if (A.status === "cleaned-up" || et.get(s) !== n) throw new ei();
			let u = V, d = i.getQueryCache().find({
				queryKey: e,
				exact: !0
			}), f = d ? yh.get(d) : void 0, p = o !== void 0 && o < u ? At(c, o, s) : c;
			await Nt(e, t, n, l, r, p), o !== void 0 && o < u && U.get(s) === o && d && yh.get(d) === f && U.set(s, u);
		}, Ft = (e, t, n, r) => {
			Se.set(e, t);
			let i = () => Se.get(e) === t && (Se.delete(e), !0);
			t.then(() => {
				i() && (Je.delete(e), !n && r === qe && (k.lastError = void 0, k.errorCount = 0));
			}, (t) => {
				i() && (Je.set(e, t), k.lastError = t, k.errorCount++, qe++, console.error(`[QueryCollection] Error applying query ${String(fe.get(e))}:`, t), A.status === "loading" && C(t));
			});
		}, It = (e, t, n) => {
			rt(e);
			let r = qe, i = new AbortController(), a = () => {}, o = new Promise((e) => {
				a = e;
			});
			i.settleRefetchAtFetchBoundary = a, et.set(e, i);
			let s;
			try {
				s = n(i.signal, i);
			} catch (e) {
				s = Promise.reject(e);
			}
			if (s === !0) {
				et.get(e) === i && (L(e, t, Promise.resolve()), et.delete(e), Je.delete(e), !t.isFetching && r === qe && (k.lastError = void 0, k.errorCount = 0));
				return;
			}
			let c = Promise.race([s, o]);
			c.catch(() => void 0), L(e, t, c);
			let l = () => {
				et.get(e) === i && et.delete(e);
			};
			s.then(l, l), et.get(e) === i && Ft(e, s, t.isFetching, r);
		}, Lt = (e) => {
			let t = $p(e), n = P, r = (a) => {
				if (Ne !== h || F || n !== P) return;
				let o = k.observers.get(t), s = o?.getCurrentQuery();
				if (o && s && oe(s, t), !Te) {
					if (s) {
						let e = yh.get(s);
						if (a.isError && ie !== void 0 && e !== void 0 && e <= ie) return;
						if (a.isSuccess) {
							if (a.isFetching && !A.deferDataRefresh && me(t) && xh.get(s) === s.state.data) return;
							if (!de(s)) {
								queueMicrotask(() => {
									let e = k.observers.get(t);
									e && e === o && de(e.getCurrentQuery()) && r(e.getCurrentResult());
								});
								return;
							}
							if ((V > 0 || ye > (yh.get(s) ?? ye)) && s.state.dataUpdateCount > (Sh.get(s) ?? 0)) {
								let e = s.state.dataUpdateCount;
								if (be.get(s) !== e) {
									be.set(s, e), queueMicrotask(() => {
										k.observers.get(t) === o && s.state.data === a.data && s.state.dataUpdateCount === e && r(a);
									});
									return;
								}
								if (V > 0 && xh.get(s) !== s.state.data) return;
							}
							let e = yh.get(s);
							if (!a.isFetching && (_e.size > 0 || W?.scanPersistedRows !== void 0) && e !== void 0 && e !== bh.get(s) && !H.has(a)) {
								H.add(a), queueMicrotask(() => {
									k.observers.get(t)?.getCurrentResult() === a && r(a);
								});
								return;
							}
							let n = Ee.get(s);
							if (n !== void 0) {
								if (s.state.dataUpdateCount <= n) return;
								Ee.delete(s);
							}
						}
					}
					if (a.isSuccess && A.deferDataRefresh) {
						if (a.isFetching) {
							ot(t, A.deferDataRefresh);
							return;
						}
						st(t, a, ot(t, A.deferDataRefresh));
					} else {
						if (a.isSuccess && !a.isFetching && (we !== void 0 || (U.get(t) ?? V) < V)) {
							let n = o?.getCurrentQuery(), i = U.get(t) ?? 0;
							if (Qe(a)?.type === "pending") return;
							let s = kt(e, a);
							if (n && "items" in s) {
								De++;
								let o = (async () => {
									await jt();
									let o = k.observers.get(t);
									if (o?.getCurrentQuery() !== n) throw new wm();
									let c = At(s.items, i, t), l = () => {}, u = new Promise((e) => {
										l = o.subscribe(() => e());
									}), d = o.getCurrentResult();
									try {
										if (U.set(t, V), !He(e, c)) {
											It(t, a, (n, r) => Ge.has(t) ? Pt(e, a, r, n, c, i) : Nt(e, a, r, void 0, n, c));
											let n = ct(t);
											return n !== !0 && await n, o.getCurrentResult();
										}
										o.getCurrentResult() === d ? r(d) : await u;
									} finally {
										l();
									}
									await new Promise((e) => queueMicrotask(e));
									let f = ct(t);
									return f !== !0 && await f, o.getCurrentResult();
								})(), c = () => {
									De--;
								};
								o.then(c, c), st(t, a, o);
								return;
							}
						}
						if (a.isSuccess) {
							if (Ge.has(t)) {
								if (i.getQueryCache().find({
									queryKey: e,
									exact: !0
								})?.state.dataUpdateCount === 0) {
									a.isFetching || k.observers.get(t)?.refetch().catch(() => {});
									return;
								}
								if (a.isFetching) return;
								It(t, a, (n, r) => Pt(e, a, r, n, void 0, U.get(t) ?? V));
							} else It(t, a, (t, n) => Nt(e, a, n, void 0, t));
						}
						s && a.errorUpdateCount < (Ke.get(s) ?? 0) && Ke.delete(s), a.isError && a.fetchStatus === "idle" && (s && a.errorUpdateCount === Ke.get(s) || (s && Ke.set(s, a.errorUpdateCount), k.lastError = a.error, k.errorCount++, qe++), console.error(`[QueryCollection] Error observing query ${String(e)}:`, a.error), A.status === "loading" && C(a.error));
					}
				}
			};
			return r;
		}, Rt = (e) => he.has(e);
		je = (e, t) => {
			if (Rt(e)) return !1;
			let n = fe.get(e);
			return n ? (Lt(n)(t), !0) : !1;
		};
		let zt = (e, t, n) => {
			if (!Rt(t)) {
				w === "eager" && e.setOptions(e.options);
				let r = fe.get(t), i = Lt(r), a = (t) => {
					if (n && t.isSuccess) {
						let t = e.getCurrentQuery();
						if (t.state.data === n.data && t.state.dataUpdateCount === n.version && (t.state.fetchStatus !== "idle" || yh.get(t) === n.fetchStart)) return;
					}
					i(t);
				}, o = e.subscribe(a);
				he.set(t, o);
				let s = e.getCurrentResult();
				(s.isSuccess || s.isError) && a(s);
			}
		}, Bt = () => {
			k.observers.forEach((e, t) => zt(e, t));
		}, Vt = () => {
			he.forEach((e) => {
				e();
			}), he.clear();
		};
		Ae = () => {
			w === "eager" && k.observers.forEach((e, t) => {
				let n = e.getCurrentQuery();
				i.getQueryCache().get(n.queryHash) !== n && zt(e, t);
			});
		}, Ve = !0;
		let Ht = A.on("subscribers:change", ({ subscriberCount: e }) => {
			e > 0 ? Bt() : e === 0 && Vt();
		});
		if (w === "eager") {
			let e = Ot({});
			e instanceof Promise && e.catch(() => {});
		} else Ue ? x() : Ct.then(() => {
			A.status === "loading" && x();
		});
		Bt(), k.observers.forEach((e, t) => {
			let n = e.getCurrentQuery(), r = wh.get(n);
			if (w === "on-demand" && r && (r.owner !== re || r.session !== h)) return;
			let i = fe.get(t);
			Lt(i)(e.getCurrentResult());
		});
		let Ut = (e) => {
			ge.get(e)?.forEach((e) => {
				e();
			}), ge.delete(e);
		}, Wt = (e) => {
			let t = k.observers.get(e)?.getCurrentQuery();
			he.get(e)?.(), he.delete(e), Ut(e), ht(e), Ge.delete(e), rt(e);
			let n = Le(e), r = z.get(e), i = () => {
				z.get(e) === r && z.delete(e);
			}, a = [];
			n.forEach((e, t) => {
				let n = A._state.getAcceptedSyncedRow(t);
				e.size === 0 && n && a.push(n);
			});
			let o = N !== void 0 && n.size > 0, s = `${gh}${e}`, c = N?.collection.get(s) !== void 0, l = o || a.length > 0 || c;
			l && g(), n.forEach((e, t) => {
				o && ft(t, e);
			}), a.length > 0 && a.forEach((e) => {
				y({
					type: "delete",
					value: e
				});
			}), c && N.collection.delete(s);
			let u = !l || b(), d = () => {
				a.forEach((e) => {
					let t = v(e);
					A._state.getAcceptedSyncedRow(t) === void 0 && ve.delete(t);
				});
			}, f = cc(u);
			f === !0 ? d() : f.then(d, () => void 0), u === !0 ? i() : u.then(i, () => void 0), k.observers.delete(e), t?.state.fetchStatus !== "fetching" && U.delete(e), fe.delete(e), Oe.delete(e), tt.delete(e);
		}, Gt = (e) => {
			let t = Oe.get(e) || 0, n = k.observers.get(e), r = tt.get(e);
			t <= 0 && (he.get(e)?.(), he.delete(e), Ut(e)), !(t > 0) && (n?.hasListeners() ?? !1 ? Oe.set(e, 0) : r !== void 0 && N && W?.scanPersistedRows ? (rt(e), g(), N.collection.set(`${gh}${e}`, {
				queryHash: e,
				mode: r === Infinity ? "until-revalidated" : "ttl",
				...r === Infinity ? {} : { expiresAt: Date.now() + r }
			}), b(), r !== Infinity && yt({
				queryHash: e,
				mode: "ttl",
				expiresAt: Date.now() + r
			}), he.get(e)?.(), he.delete(e), k.observers.delete(e), n?.getCurrentQuery().state.fetchStatus !== "fetching" && U.delete(e), fe.delete(e), Oe.set(e, 0)) : Wt(e));
		}, Kt = (e) => {
			Wt(e);
		}, qt = i.getQueryCache().subscribe((e) => {
			if (e.type === "added" && em(e.query.queryKey, E) && ae(e.query), !M.has(e.query)) return;
			if (e.type === "updated") {
				if (e.action.type === "fetch") {
					let t = vh.get(e.action);
					t === void 0 && (t = ++_h, vh.set(e.action, t)), U.set($p(e.query.queryKey), t), k.observers.forEach((n, r) => {
						n.getCurrentQuery() === e.query && U.set(r, t);
					}), yh.set(e.query, t);
					let n = [...ne.get(e.query)?.keys() ?? []].filter((e) => e !== t);
					n.length > 0 && queueMicrotask(() => R(e.query, n)), le(e.query, t);
				} else if (e.action.type === "success" && !e.action.manual) {
					e.query.state.data === e.action.data && wh.delete(e.query), xh.set(e.query, e.action.data), Sh.set(e.query, e.query.state.dataUpdateCount);
					let t = yh.get(e.query);
					t !== void 0 && (bh.set(e.query, t), le(e.query, t), queueMicrotask(() => {
						ue(e.query, t), R(e.query, [t]);
					}));
				} else if (e.action.type === "error") {
					let t = yh.get(e.query);
					t !== void 0 && (le(e.query, t), queueMicrotask(() => R(e.query, [t])));
				} else if (e.action.type === "setState" && e.action.state.fetchStatus === "idle") {
					let t = yh.get(e.query);
					t !== void 0 && queueMicrotask(() => R(e.query, [t]));
				}
			}
			let t = $p(e.query.queryKey);
			if (k.observers.has(t) || e.type !== "removed" && e.query.state.fetchStatus === "fetching" || U.delete(t), e.type === "removed" && (M.delete(e.query), fe.has(t))) {
				if (w === "eager") {
					he.get(t)?.(), he.delete(t), Ut(t), A.subscriberCount > 0 && Ae();
					return;
				}
				Gt(t);
			}
		});
		return {
			loadSubset: w === "eager" ? void 0 : Ot,
			unloadSubset: w === "eager" ? void 0 : (e) => {
				let t = We.get(e);
				if (t) {
					t.delete(t.values().next().value), t.size === 0 && We.delete(e);
					return;
				}
				let n = $p(xt(e)), r = e.refetch ? void 0 : ke.get(n);
				r !== void 0 && (r === 1 ? ke.delete(n) : ke.set(n, r - 1));
				let i = r === void 0 ? n : O, a = (Oe.get(i) || 0) - 1;
				a <= 0 ? (Oe.set(i, 0), Gt(i)) : Oe.set(i, a);
			},
			restartAfterScopedRecovery: w === "on-demand" ? async (e) => {
				let t = ++P;
				F = !0, Vt();
				for (let e of k.observers.keys()) Ut(e), rt(e);
				if (await e, Ne !== h) throw new wm();
				t === P && (z.clear(), B.clear(), Ge.clear(), Ce.clear(), _e.clear(), ve.clear(), ye = 0, G.forEach((e) => clearTimeout(e)), G.clear(), ie = _h, F = !1, k.observers.forEach((e, t) => {
					(Oe.get(t) ?? 0) > 0 && zt(e, t);
				}));
			} : void 0,
			cleanup: () => {
				Ne === h && (Ne = void 0), clearTimeout(Re), Re = void 0, We.clear(), ke.clear(), Ae = () => {}, je = () => !1, Ht(), Vt(), G.forEach((e) => {
					clearTimeout(e);
				}), G.clear(), Xe.forEach((e) => {
					e.reject(new wm());
				}), Xe.clear(), Ze.clear(), Me === Qe && (Me = () => void 0);
				let e = /* @__PURE__ */ new Set([...k.observers.keys(), ...z.keys()]);
				for (let t of e) Kt(t);
				U.clear(), _e.clear(), ve.clear(), ye = 0, qt();
				for (let t of [...M]) [...se(t)].some((t) => e.has(t)) && (w === "eager" || j.has(t) && t.getObserversCount() === 0) && i.getQueryCache().remove(t);
				for (let e of M) Ch.get(e)?.delete(re);
				M.clear(), j = /* @__PURE__ */ new WeakSet();
			}
		};
	}, ze = async (e, t) => {
		let n = [...fe.values()];
		Ae();
		let r = Ne, i = P, a = n.map(async (n) => {
			if (F) throw new wm();
			let a = $p(n), o = k.observers.get(a);
			if (!o) return;
			let s = Me, c = o.getCurrentQuery(), l, u, d;
			try {
				xe(c, a);
				let t = o.refetch({ throwOnError: e?.throwOnError });
				c = o.getCurrentQuery(), l = o.getCurrentResult();
				let n = yh.get(c);
				if (n !== void 0 && (u = I(c, n, a)), d = await t, F || i !== P) throw new wm();
			} catch (e) {
				if (F || i !== P) throw new wm();
				let t = o.getCurrentResult(), n = je(a, t) ? t : u?.result ?? t;
				throw u && (u.result = n, u.settlement ??= ce(a, n)), e;
			}
			let f = je(a, d) ? d : u?.result ?? d;
			u && (u.result = f, u.settlement ??= ce(a, f)), await new Promise((e) => queueMicrotask(e));
			let p = s(f) ?? s(d), m = u?.settlement ?? ce(a, d) ?? ce(a, l);
			if (Ne !== r && p === void 0 && m === void 0) throw new wm();
			if (t) {
				if (p?.type === "rejected") throw p.error;
				if (p?.type === "pending") {
					let t = await p.promise;
					if (i !== P) throw new wm();
					if (!t.isSuccess && e?.throwOnError) throw t.error;
					return t;
				}
			}
			if (t && !Be() && m && (e?.throwOnError ? await m : await m.catch(() => void 0)), i !== P) throw new wm();
			return f;
		});
		return await Promise.all(a);
	}, Be = () => {
		if (te > 0) return !0;
		for (let e of Je?.collection._state.transactions.values() ?? []) if (e.state === "persisting") return !0;
		return !1;
	}, W = (e) => ze(e, !Be()), Ve = (e) => {
		for (let t of Ch.get(e) ?? []) if (t !== re) return !0;
		return !1;
	}, He = (e, t, n) => {
		let a = i.getQueryCache().find({
			queryKey: e,
			exact: !0
		}), o = () => {
			a && Ee.set(a, a.state.dataUpdateCount);
		};
		if (w === "on-demand" && a && Ve(a) || a?.state.status === "pending" && a.state.fetchStatus !== "idle") return o(), !1;
		let s = (t) => {
			if (a) wh.set(a, {
				owner: re,
				session: Ne
			}), a.setState(a.state.status === "pending" ? {
				data: t,
				status: "success"
			} : { data: t }), Ee.delete(a);
			else {
				i.setQueryData(e, t);
				let n = i.getQueryCache().find({
					queryKey: e,
					exact: !0
				});
				n && wh.set(n, {
					owner: re,
					session: Ne
				});
			}
		};
		if (r) {
			let e = a?.state.data;
			if (!e || typeof e != "object") return o(), !1;
			if (Array.isArray(e)) return s(t), !0;
			let i = n ?? r(e);
			if (!Array.isArray(i)) return o(), !1;
			let c = Object.keys(e).find((t) => e[t] === i);
			return c === void 0 ? (o(), !1) : (s({
				...e,
				[c]: t
			}), !0);
		}
		{
			let e = a?.state.data;
			return e === void 0 || Array.isArray(e) ? (s(t), !0) : !1;
		}
	}, Ue = () => {
		V = ++_h;
		for (let [e, t] of k.observers) t.getCurrentQuery().state.fetchStatus !== "fetching" && !Se.has(e) && U.set(e, V);
		return V;
	}, We = (e, t) => {
		let n = De > 0 || we !== void 0 || Se.size > 0;
		if (!n) {
			for (let e of M) if (e.state.fetchStatus === "fetching") {
				n = !0;
				break;
			}
		}
		if (!n) Ce.clear();
		else for (let n of e) Ce.set(n, t);
	}, Ge = (e) => {
		let t = Promise.all([we, e]).then(() => {
			we === t && (we = void 0);
		}, () => {
			we === t && (we = void 0);
		});
		we = t;
	}, Ke = (e, t, n) => {
		Te = !0;
		try {
			let r = e(t), i = new Map(r.map((e) => [v(e), e]));
			qe(e, t, i);
			for (let e of t) if (i.has(e)) ve.set(e, n), ye = Math.max(ye, n), (B.get(e)?.size ?? 0) === 0 ? _e.set(e, n) : _e.delete(e);
			else {
				_e.delete(e), ve.delete(e);
				for (let t of [...B.get(e) ?? []]) Ie(e, t);
			}
		} finally {
			Te = !1;
		}
	}, qe = (e, t, n) => {
		let a = new Set(t), o = (e) => {
			let t = /* @__PURE__ */ new Set(), r = !1;
			return {
				patched: e.flatMap((e) => {
					let i = v(e);
					if (t.add(i), !a.has(i)) return [e];
					r = !0;
					let o = n.get(i);
					return o === void 0 ? [] : [o];
				}),
				present: t,
				touched: r
			};
		};
		if (w === "on-demand") {
			let e = new Set(t.flatMap((e) => [...B.get(e) ?? []])), n = /* @__PURE__ */ new Set();
			for (let [t, i] of k.observers) {
				let a = i.getCurrentQuery();
				if (n.has(a) || !e.has(t) && me(t) && a.state.fetchStatus !== "fetching" && !Se.has(t)) continue;
				n.add(a);
				let s = a.state.data, c = r && s !== void 0 ? r(s) : s;
				if (!Array.isArray(c)) continue;
				let { patched: l, touched: u } = o(c);
				u && He(a.queryKey, l, c);
			}
			for (let e of [...M]) n.has(e) || Ve(e) || e.getObserversCount() > 0 || i.getQueryCache().remove(e);
			return;
		}
		let s = [...M];
		if (s.length > 0) for (let i of s) {
			let a = i.state.data, s = r && a !== void 0 ? r(a) : a;
			if (!Array.isArray(s)) {
				He(i.queryKey, e());
				continue;
			}
			let { patched: c, present: l } = o(s);
			for (let e of t) {
				let t = n.get(e);
				!l.has(e) && t !== void 0 && c.push(t);
			}
			He(i.queryKey, c, s);
		}
		else He(E, e());
	}, Je = null, Ye = (e) => {
		let n, r = (t) => {
			let r = e.commit(t), i = cc(r);
			if (i !== !0) {
				let e = i.then(() => {
					n === e && (n = void 0);
				}, () => {
					n === e && (n = void 0);
				});
				n = e;
			}
			return r;
		}, a = {
			...e,
			commit: r
		}, { begin: o, write: s, collection: c } = a, l = !1, u = () => {
			l ||= (i.mount(), !0);
		}, d = () => {
			l &&= (i.unmount(), !1);
		};
		u();
		let f = typeof t == "function" ? t({}) : t, p = {
			collection: c,
			queryClient: i,
			queryKey: f,
			getKey: v,
			begin: o,
			write: s,
			commit: r,
			updateCacheData: Ke,
			reserveDirectWrite: Ue,
			claimDirectWriteKeys: We,
			noteWaitingDirectWrite: Ge,
			earlierCommits: () => n
		};
		Je = p;
		let m = Re(a), h = typeof m == "function" ? { cleanup: m } : typeof m == "object" ? m : {};
		return {
			...h,
			cleanup: () => (Je === p && (Je = null), uh(h.cleanup, d))
		};
	}, Xe = lh(() => Je);
	async function Ze(e) {
		(typeof e == "object" && e || typeof e == "function") && "refetch" in e && e.refetch === !1 || (gi("query-collection-auto-refetch", "[TanStack DB] DEPRECATED: QueryCollection handlers currently auto-refetch after completion. This behavior will be removed in v1.0. To prepare: (1) Add `await collection.utils.refetch()` and temporarily return `{ refetch: false }` to avoid a second refetch, or (2) Return `{ refetch: false }` to opt out now if you don't need it. See: https://tanstack.com/db/latest/docs/collections/query-collection#controlling-refetch-behavior"), await ze(void 0, !1));
	}
	let Qe = async (e, t) => {
		te++;
		try {
			return await e(t);
		} finally {
			te--;
		}
	}, $e = y ? async (e) => {
		await Ze(await Qe(y, e) ?? {});
	} : void 0, et = b ? async (e) => {
		await Ze(await Qe(b, e) ?? {});
	} : void 0, tt = x ? async (e) => {
		await Ze(await Qe(x, e) ?? {});
	} : void 0, G = new Th(k, W, Xe), nt = dl({ sync: Ye }, (e, t, n) => {
		let r = t;
		for (let e of Object.keys(Xe)) {
			let t = r[e];
			r[e] = (...e) => (n(), t(...e));
		}
		return e;
	}), rt = {
		...C,
		getKey: v,
		syncMode: w,
		sync: nt,
		onInsert: $e,
		onUpdate: et,
		onDelete: tt,
		utils: G
	};
	return Mp(rt, (t) => Eh({
		...e,
		queryClient: t.getDependency("queryClient") ?? e.queryClient,
		id: rt.id
	}));
}
// src/collections.ts
async function Dh(e) {
	let t = await fetch(e, { headers: { accept: "application/json" } });
	if (t.redirected || t.status === 401 || t.status === 403) throw location.href = "/login", Error("signed out");
	if (!t.ok) throw Error(`${e}: ${t.status}`);
	return t.json();
}
async function Oh(e, t) {
	let n = await fetch(e, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(t)
	});
	if (!n.ok) throw Error(`${e}: ${n.status} ${await n.text()}`);
	return n.json();
}
function kh(e) {
	let t = new Gm({ defaultOptions: { queries: {
		staleTime: 3e4,
		refetchOnWindowFocus: !0
	} } }), n = e.snapshot, r = (e) => e ? {
		initialData: e,
		initialDataUpdatedAt: Date.now()
	} : {}, i = (t) => [e.scope, t], a = ml(Eh({
		id: "issues",
		queryKey: i("issues"),
		queryClient: t,
		getKey: (e) => e.id,
		queryFn: () => Dh("/api/issues"),
		...r(n?.issues),
		onUpdate: async ({ transaction: e }) => {
			let t = await Promise.all(e.mutations.map((e) => {
				let { changes: t } = e;
				return Oh("/api/issues/update", {
					id: e.key,
					...t
				});
			}));
			return a.utils.writeUpsert(t), { refetch: !1 };
		}
	})), o = ml(Eh({
		id: "users",
		queryKey: i("users"),
		queryClient: t,
		getKey: (e) => e.id,
		queryFn: () => Dh("/api/users"),
		...r(n?.users)
	})), s = ml(Eh({
		id: "labels",
		queryKey: i("labels"),
		queryClient: t,
		getKey: (e) => e.id,
		queryFn: () => Dh("/api/labels"),
		...r(n?.labels)
	})), c = ml(Eh({
		id: "issue-labels",
		queryKey: i("issue-labels"),
		queryClient: t,
		getKey: (e) => e.id,
		queryFn: () => Dh("/api/issue-labels"),
		...r(n?.issue_labels)
	}));
	return a.createIndex((e) => e.modified, { indexType: Vp }), a.createIndex((e) => e.created, { indexType: Vp }), a.createIndex((e) => e.open, { indexType: Vp }), a.createIndex((e) => e.creatorId, { indexType: Vp }), a.createIndex((e) => e.assigneeId, { indexType: Vp }), o.createIndex((e) => e.id, { indexType: Vp }), c.createIndex((e) => e.issueId, { indexType: Vp }), c.createIndex((e) => e.labelId, { indexType: Vp }), {
		queryClient: t,
		issues: a,
		users: o,
		labels: s,
		issueLabels: c
	};
}
// src/list.ts
function Ah(e, t, n, r) {
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
var jh = 200;
function Mh(e, t) {
	return kp({
		startSync: !0,
		query: (n) => {
			let r = n.from({ issue: e.issues }).leftJoin({ creator: e.users }, ({ issue: e, creator: t }) => no(e.creatorId, t.id)).leftJoin({ assignee: e.users }, ({ issue: e, assignee: t }) => no(e.assigneeId, t.id));
			return t.label && (r = r.innerJoin({ il: e.issueLabels }, ({ issue: e, il: t }) => no(e.id, t.issueId))), r.where((e) => {
				let { issue: n } = e, r = [];
				return t.open !== "all" && r.push(no(n.open, t.open === "open")), t.creator && r.push(no(n.creatorId, t.creator)), t.assignee && r.push(no(n.assigneeId, t.assignee)), t.label && r.push(no(e.il.labelId, t.label)), t.text && r.push(po(n.title, `%${t.text}%`)), r.length === 0 ? no(1, 1) : r.length === 1 ? r[0] : oo(r[0], r[1], ...r.slice(2));
			}).orderBy(({ issue: e }) => t.sort === "created" ? e.created : e.modified, "desc").limit(jh).select(({ issue: e, creator: t, assignee: n }) => ({
				id: e.id,
				shortId: e.shortId,
				title: e.title,
				open: e.open,
				modified: e.modified,
				created: e.created,
				creator: t.login,
				assignee: n.login
			}));
		}
	});
}
function Nh(e) {
	let t = /* @__PURE__ */ new Map(), n = (e, n) => {
		let r = t.get(e);
		r || t.set(e, r = /* @__PURE__ */ new Set()), r.add(n);
	};
	return e.issueLabels.subscribeChanges((e) => {
		for (let r of e) r.type === "insert" ? n(r.value.issueId, r.value.labelId) : r.type === "delete" && t.get(r.value.issueId)?.delete(r.value.labelId);
	}, { includeInitialState: !0 }), (n) => {
		let r = t.get(n);
		if (!r) return [];
		let i = [];
		for (let t of r) {
			let n = e.labels.get(t);
			n && i.push(n.name);
		}
		return i;
	};
}
function Ph(e, t) {
	let n = document.getElementById("issues"), r = document.getElementById("count"), i = document.getElementById("timing"), a = (e) => document.getElementById(e), o = Nh(e), s = {
		open: "open",
		creator: "",
		assignee: "",
		label: "",
		text: "",
		sort: "modified"
	}, c = (e, t) => {
		let n = e.value, r = e.options[0];
		e.replaceChildren(r, ...t.map((e) => new Option(e.name, e.id))), e.value = n;
	}, l = () => {
		let t = e.users.toArray.map((e) => ({
			id: e.id,
			name: e.login
		})).sort((e, t) => e.name.localeCompare(t.name));
		c(a("f-creator"), t), c(a("f-assignee"), t);
	}, u = () => c(a("f-label"), e.labels.toArray.map((e) => ({
		id: e.id,
		name: e.name
	})).sort((e, t) => e.name.localeCompare(t.name)));
	e.users.subscribeChanges(l), e.labels.subscribeChanges(u), l(), u();
	let d = null, f = null, p = 0, m = () => {
		f?.(), d?.cleanup(), p = performance.now(), d = Mh(e, s);
		let t = !0;
		f = Ah(n, d, {
			key: (e) => e.id,
			create: () => {
				let e = document.createElement("li");
				return e.innerHTML = "<button class=\"toggle\" data-action=\"toggle\"></button><span class=\"sid mono\"></span><span class=\"title\"></span><span class=\"labels\"></span><span class=\"who muted\"></span>", e;
			},
			update: (t, n) => {
				let [r, i, a, s, c] = t.children;
				r.textContent = n.open ? "○" : "●", i.textContent = String(n.shortId), a.textContent = n.title, s.replaceChildren(...o(n.id).map((e) => Object.assign(document.createElement("span"), { textContent: e }))), c.textContent = n.assignee ? `${n.creator ?? "?"} → ${n.assignee}` : n.creator ?? "?", t.classList.toggle("pending", !!(e.issues.get(n.id) && e.issues._state?.optimisticUpserts?.has?.(n.id)));
			}
		}, ({ rows: n, ms: a, changed: o }) => {
			if (r.textContent = `${n}${n === jh ? "+" : ""} of ${e.issues.size} issues`, t || o > 0) {
				let e = t ? "filter→dom" : "update dom", n = t ? ` ${(performance.now() - p).toFixed(1)}ms ·` : "";
				i.textContent = `${e}${n} dom ${a.toFixed(1)}ms · ${o} ops`;
			}
			t = !1;
		});
	}, h = (e, t, n = "change") => a(e).addEventListener(n, (e) => {
		s[t] = e.target.value, m();
	});
	h("f-open", "open"), h("f-creator", "creator"), h("f-assignee", "assignee"), h("f-label", "label"), h("f-sort", "sort"), h("f-text", "text", "input"), n.addEventListener("click", (t) => {
		let n = t.target.closest("[data-action=toggle]");
		if (!n) return;
		let r = n.closest("li").dataset.key;
		e.issues.update(r, (e) => {
			e.open = !e.open;
		}).isPersisted.promise.catch((e) => Fh(`Rolled back: ${e.message}`));
	}), m(), window.__fastcoat = {
		collections: e,
		filters: s,
		boot: t,
		remount: m
	};
}
function Fh(e) {
	let t = Object.assign(document.createElement("div"), {
		id: "toast",
		textContent: e
	});
	document.body.append(t), setTimeout(() => t.remove(), 3e3);
}
// src/index.ts
var Ih = performance.now(), Lh = document.getElementById("fastcoat-boot");
if (Lh) {
	let e = JSON.parse(Lh.textContent), t = kh(e), n = { parsed: performance.now() - Ih };
	Promise.all([
		t.issues.preload(),
		t.users.preload(),
		t.labels.preload(),
		t.issueLabels.preload()
	]).then(() => {
		n.ready = performance.now() - Ih, window.__fastcoatMarks = {
			...n,
			navToReady: performance.now()
		};
	}), document.getElementById("issues") && Ph(t, e);
}

//# sourceMappingURL=fastcoat.js.map