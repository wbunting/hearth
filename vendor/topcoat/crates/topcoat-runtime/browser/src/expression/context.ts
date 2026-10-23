import type { SignalId, SignalRegistry } from "../signal-registry";
import { Option, Record, Result, Tuple, WriteSignal } from "../surrogate";
import { hydrate } from "./hydrate";
import { type LocalDb, localDb, type RowRef } from "../fastcoat/db";
import { route } from "../fastcoat/router";
import type { DehydratedSurrogate } from "./serialized";

/**
 * The `cx` object passed into every compiled expression: the interface
 * generated code uses to hydrate values and access the runtime's signals.
 * Expressions execute as ordinary JavaScript with access to browser globals.
 */
export class Context {
	constructor(
		private readonly registry: SignalRegistry,
		/** [fastcoat] Row refs of the enclosing client list items, outermost first. */
		readonly rows: readonly RowRef[] = [],
	) {}

	/** [fastcoat] A context for content inside a client list item. */
	withRow(row: RowRef): Context {
		return new Context(this.registry, [...this.rows, row]);
	}

	/**
	 * [fastcoat] The current row of the client list `depth` levels out from
	 * the innermost (0 = innermost). Reading it subscribes the running effect,
	 * so `$(row.title)` re-renders when that row changes.
	 */
	row(depth: number): unknown {
		const ref = this.rows[this.rows.length - 1 - depth];
		if (!ref) throw new Error(`cx.row(${depth}) outside a client list`);
		return ref.read();
	}

	/** [fastcoat] Client router (reactive URL). */
	get route() {
		return route;
	}

	/** [fastcoat] Bridge to the local database (TanStack DB). */
	get db(): LocalDb {
		return localDb();
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
