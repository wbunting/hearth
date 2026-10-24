// Lazy-loaded after the SSR view. IndexedDB stores bounded row batches, not
// optimistic state. Rows and their cursor always commit in one transaction.
import type { Row } from "./store";

export type Delta = {
	rows: Row[];
	deleted: string[];
	cursor: string;
	full: boolean;
};
type Bucket = { namespace: string; table: string; bucket: number; rows: Row[] };
const BUCKETS = 128;
const DATABASE = "hearth-sync-v1";

function request<T>(req: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
function complete(tx: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onabort = () =>
			reject(tx.error ?? new Error("cache transaction aborted"));
		tx.onerror = () => reject(tx.error);
	});
}
function bucket(key: string): number {
	let h = 0;
	for (let i = 0; i < key.length; i++)
		h = (Math.imul(h, 31) + key.charCodeAt(i)) | 0;
	return (h >>> 0) % BUCKETS;
}

export class LocalPersistence {
	private constructor(
		private db: IDBDatabase,
		private namespace: string,
	) {}
	static async open(namespace: string): Promise<LocalPersistence> {
		const req = indexedDB.open(DATABASE, 2);
		req.onupgradeneeded = () => {
			if (req.result.objectStoreNames.contains("rows"))
				req.result.deleteObjectStore("rows");
			if (req.result.objectStoreNames.contains("meta"))
				req.result.deleteObjectStore("meta");
			req.result.createObjectStore("rows", {
				keyPath: ["namespace", "table", "bucket"],
			});
			req.result.createObjectStore("meta");
		};
		const db = await request(req);
		db.onversionchange = () => db.close();
		return new LocalPersistence(db, namespace);
	}

	/** Read one bucket per request, letting input run between clone tasks. */
	async restore(
		table: string,
		apply: (rows: Row[]) => void,
	): Promise<string | undefined> {
		const tx = this.db.transaction(["rows", "meta"], "readonly");
		const done = complete(tx);
		const meta = tx.objectStore("meta");
		const cursor = (await request(meta.get([this.namespace, table]))) as
			| string
			| undefined;
		if (cursor) {
			await new Promise<void>((resolve, reject) => {
				const req = tx
					.objectStore("rows")
					.openCursor(
						IDBKeyRange.bound(
							[this.namespace, table, 0],
							[this.namespace, table, BUCKETS],
						),
					);
				req.onerror = () => reject(req.error);
				req.onsuccess = () => {
					const c = req.result;
					if (!c) {
						resolve();
						return;
					}
					try {
						apply((c.value as Bucket).rows);
						c.continue();
					} catch (error) {
						reject(error);
					}
				};
			});
		}
		await done;
		return cursor;
	}

	/** Atomic server-only checkpoint. Failed/quota writes leave the old cursor. */
	async save(
		table: string,
		key: string,
		delta: Delta,
		base?: string,
	): Promise<void> {
		const changes = new Map<number, { rows: Row[]; deleted: Set<string> }>();
		const part = (id: string) => {
			const b = bucket(id);
			let p = changes.get(b);
			if (!p) {
				p = { rows: [], deleted: new Set() };
				changes.set(b, p);
			}
			return p;
		};
		for (const row of delta.rows) part(String(row[key])).rows.push(row);
		for (const id of delta.deleted) part(id).deleted.add(id);
		const tx = this.db.transaction(["rows", "meta"], "readwrite");
		const done = complete(tx);
		const meta = tx.objectStore("meta");
		// Other tabs may have committed a different checkpoint. Never attach a
		// delta cursor to rows from a different base. Invalidate instead.
		if (
			!delta.full &&
			(await request(meta.get([this.namespace, table]))) !== base
		) {
			meta.delete([this.namespace, table]);
			await done;
			return;
		}
		const store = tx.objectStore("rows");
		if (delta.full)
			store.delete(
				IDBKeyRange.bound(
					[this.namespace, table, 0],
					[this.namespace, table, BUCKETS],
				),
			);
		try {
			await Promise.all(
				[...changes].map(async ([b, change]) => {
					const old = delta.full
						? undefined
						: ((await request(store.get([this.namespace, table, b]))) as
								| Bucket
								| undefined);
					const rows = new Map(
						(old?.rows ?? []).map((r) => [String(r[key]), r]),
					);
					for (const id of change.deleted) rows.delete(id);
					for (const row of change.rows) rows.set(String(row[key]), row);
					store.put({
						namespace: this.namespace,
						table,
						bucket: b,
						rows: [...rows.values()],
					} satisfies Bucket);
				}),
			);
			meta.put(delta.cursor, [this.namespace, table]);
		} catch (error) {
			tx.abort();
			await done.catch(() => {});
			throw error;
		}
		await done;
	}
	close() {
		this.db.close();
	}
}

// This same module is the worker entry. A hashed asset URL works with Topcoat's
// bundler without shipping a second dependency graph or a Blob/CSP exception.
type Reply = { id: number; rows?: Row[]; result?: unknown; error?: string };
if (typeof document === "undefined" && typeof self !== "undefined") {
	const caches = new Map<string, LocalPersistence>();
	const staged = new Map<string, Row[]>();
	self.onmessage = async (event: MessageEvent) => {
		const { id, op, namespace, table, key, delta, base, rows } = event.data;
		const stage = JSON.stringify([namespace, table]);
		try {
			let p = caches.get(namespace);
			if (!p) {
				p = await LocalPersistence.open(namespace);
				caches.set(namespace, p);
			}
			let result: unknown;
			if (op === "restore")
				result = await p.restore(table, (rows) =>
					self.postMessage({ id, rows }),
				);
			else if (op === "stage") {
				const list = staged.get(stage) ?? [];
				list.push(...rows);
				staged.set(stage, list);
			} else if (op === "save") {
				const rows = staged.get(stage) ?? [];
				staged.delete(stage);
				await p.save(table, key, { ...delta, rows }, base);
			}
			self.postMessage({ id, result });
		} catch (error) {
			self.postMessage({ id, error: String(error) });
		}
	};
}

/** Lazy worker facade. PostMessage and restore payloads are bounded batches. */
export class Persistence {
	private worker: Worker;
	private seq = 0;
	private failed = false;
	private calls = new Map<
		number,
		{
			resolve: (v: unknown) => void;
			reject: (e: Error) => void;
			rows?: (r: Row[]) => void;
		}
	>();
	private constructor(private namespace: string) {
		this.worker = new Worker(import.meta.url, {
			type: "module",
			name: "hearth-persistence",
		});
		this.worker.onmessage = (event: MessageEvent<Reply>) => {
			const m = event.data;
			const call = this.calls.get(m.id);
			if (!call) return;
			if (m.rows) {
				try {
					call.rows?.(m.rows);
				} catch (error) {
					this.calls.delete(m.id);
					call.reject(error as Error);
				}
				return;
			}
			this.calls.delete(m.id);
			if (m.error) call.reject(new Error(m.error));
			else call.resolve(m.result);
		};
		this.worker.onerror = () => {
			this.failed = true;
			for (const c of this.calls.values())
				c.reject(new Error("persistence worker failed"));
			this.calls.clear();
		};
	}
	static async open(namespace: string): Promise<Persistence> {
		return new Persistence(namespace);
	}
	private call(
		op: string,
		data: object,
		rows?: (r: Row[]) => void,
	): Promise<unknown> {
		if (this.failed)
			return Promise.reject(new Error("persistence worker unavailable"));
		return new Promise((resolve, reject) => {
			const id = ++this.seq;
			this.calls.set(id, { resolve, reject, ...(rows ? { rows } : {}) });
			try {
				this.worker.postMessage({ id, op, namespace: this.namespace, ...data });
			} catch (error) {
				this.calls.delete(id);
				reject(error);
			}
		});
	}
	async restore(
		table: string,
		apply: (r: Row[]) => void,
	): Promise<string | undefined> {
		return (await this.call("restore", { table }, apply)) as string | undefined;
	}
	async save(
		table: string,
		key: string,
		delta: Delta,
		base?: string,
	): Promise<void> {
		// Transfer small slices first; accumulating/hashing/IDB cloning happens
		// in the worker. Nothing visible or optimistic is read from the store.
		for (let i = 0; i < delta.rows.length; i += 1000) {
			await this.call("stage", { table, rows: delta.rows.slice(i, i + 1000) });
			await new Promise<void>((r) => setTimeout(r, 0));
		}
		await this.call("save", {
			table,
			key,
			delta: { ...delta, rows: [] },
			base,
		});
	}
	close() {
		this.failed = true;
		this.worker.terminate();
		for (const c of this.calls.values())
			c.reject(new Error("persistence closed"));
		this.calls.clear();
	}
}
