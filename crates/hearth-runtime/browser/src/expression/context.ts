import { compile } from "./compile";
import type { SignalId, SignalRegistry } from "../signal-registry";
import { Option, Record, Result, Tuple, WriteSignal } from "../surrogate";
import { hydrate } from "./hydrate";
import { type LocalDb, localDb, type RowRef } from "../hearth/db";
import { route } from "../hearth/router";
import type { DehydratedSurrogate } from "./serialized";

/**
 * The `cx` object passed into every compiled expression: the interface
 * generated code uses to hydrate values and access the runtime's signals.
 * Expressions execute as ordinary JavaScript with access to browser globals.
 */
export class Context {
	constructor(
		private readonly registry: SignalRegistry,
		/** [hearth] Current row of each enclosing client list, by list id. */
		readonly rows: ReadonlyMap<string, RowRef> = new Map(),
	) {}

	/** [hearth] A context for content inside a list item. */
	withRow(list: string, row: RowRef): Context {
		const rows = new Map(this.rows);
		rows.set(list, row);
		return new Context(this.registry, rows);
	}

	/**
	 * [hearth] The current row of client list `list` for this item (works
	 * for nested lists and outer rows captured by inner bodies). Reading it
	 * subscribes the running effect, so `$(row.title)` updates with the row.
	 */
	row(list: string): unknown {
		const ref = this.rows.get(list);
		if (!ref) throw new Error(`cx.row(${list}) outside its client list`);
		return ref.read();
	}

	/** [hearth] Client router (reactive URL). */
	get route() {
		return route;
	}

	/** [hearth] Bridge to the local database (TanStack DB). */
	get db(): LocalDb {
		return localDb();
	}

	/** Evaluates a captured expression without flattening its code into its caller. */
	expression(ref: string): unknown {
		return compile(ref, "captured expression")(this);
	}

	hydrate(s: unknown) {
		return hydrate(s as DehydratedSurrogate, this);
	}

	signal(id: SignalId): WriteSignal<unknown> {
		return new WriteSignal(id, this.registry.handle(id));
	}

	some<T>(v: T): Option<T> {
		return Option.some(v);
	}

	none<T>(): Option<T> {
		return Option.none<T>();
	}

	ok<T, E = never>(v: T): Result<T, E> {
		return Result.from_ok(v);
	}

	err<T = never, E = unknown>(v: E): Result<T, E> {
		return Result.from_err(v);
	}

	record(fields: { [field: string]: unknown }): Record {
		return new Record(Object.entries(fields));
	}

	tuple(items: readonly unknown[]): Tuple {
		return new Tuple(items);
	}
}
