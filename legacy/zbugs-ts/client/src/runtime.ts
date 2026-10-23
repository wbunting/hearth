// Generic runtime: builds TanStack DB collections + indexes from the
// Rust-emitted ClientSchema (apps/zbugs/src/client_schema.rs). No
// app-specific code here; this is what P1's `collection!` targets.
//
// Sync is a ~80-line adapter (replacing @tanstack/query-db-collection +
// query-core): load = GET full scoped table; refresh = refetch + diff;
// writes = POST the change and apply the server's returned row.

import { BTreeIndex, createCollection, type Collection } from "@tanstack/db";

export type CollectionDesc = {
  name: string;
  key: string;
  load: string;
  update?: string;
  insert?: string;
  delete?: string;
  indexes: string[];
};

export type ClientSchema = { version: string; collections: CollectionDesc[] };

type Row = Record<string, unknown>;
type SyncWriter = {
  begin: () => void;
  write: (m: { type: "insert" | "update" | "delete"; value: Row }) => void;
  commit: () => void;
};

export class AuthError extends Error {}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(path, {
    ...init,
    headers: { accept: "application/json", ...(init?.body ? { "content-type": "application/json" } : {}) },
  });
  if (res.redirected && new URL(res.url).pathname === "/login") throw new AuthError("signed out");
  if (res.status === 401) throw new AuthError("signed out");
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export type Synced = {
  collection: Collection<Row, string>;
  desc: CollectionDesc;
  /** Refetch and apply the diff (insert/update/delete) in one transaction. */
  refresh: () => Promise<void>;
  /** Apply server-confirmed rows/deletes without a refetch. */
  applyServer: (rows: Row[], deletedKeys?: string[]) => void;
};

function syncedCollection(desc: CollectionDesc, scope: string, initial: Row[] | undefined): Synced {
  const keyOf = (r: Row) => String(r[desc.key]);
  let writer: SyncWriter | null = null;
  // Last server state per key, to diff refetches against.
  const server = new Map<string, Row>();

  const apply = (rows: Row[], full: boolean, deleted: string[] = []) => {
    if (!writer) return;
    writer.begin();
    const seen = new Set<string>();
    for (const row of rows) {
      const k = keyOf(row);
      seen.add(k);
      const prev = server.get(k);
      if (!prev) writer.write({ type: "insert", value: row });
      else if (!shallowEqual(prev, row)) writer.write({ type: "update", value: row });
      server.set(k, row);
    }
    const gone = full ? [...server.keys()].filter((k) => !seen.has(k)) : deleted;
    for (const k of gone) {
      const prev = server.get(k);
      if (prev) writer.write({ type: "delete", value: prev });
      server.delete(k);
    }
    writer.commit();
  };

  const load = () => request(desc.load) as Promise<Row[]>;

  const mutate = (url: string | undefined, kind: string) =>
    url
      ? async ({ transaction }: { transaction: { mutations: Array<{ key: unknown; modified: Row; changes: Row; original: Row }> } }) => {
          const confirmed: Row[] = [];
          const deleted: string[] = [];
          for (const m of transaction.mutations) {
            if (kind === "update") confirmed.push((await request(url, { method: "POST", body: JSON.stringify({ [desc.key]: m.key, ...m.changes }) })) as Row);
            else if (kind === "insert") confirmed.push((await request(url, { method: "POST", body: JSON.stringify(m.modified) })) as Row);
            else {
              await request(url, { method: "POST", body: JSON.stringify(m.original) });
              deleted.push(String(m.key));
            }
          }
          // Applied while the optimistic tx is still persisting; TanStack
          // swaps optimistic→synced state atomically when it settles.
          apply(confirmed, false, deleted);
        }
      : undefined;

  const collection = createCollection<Row, string>({
    id: `${scope}/${desc.name}`,
    getKey: keyOf,
    startSync: true,
    gcTime: 0,
    sync: {
      rowUpdateMode: "full",
      sync: (params) => {
        writer = params as unknown as SyncWriter;
        if (initial) {
          apply(initial, true);
          params.markReady();
        } else {
          load()
            .then((rows) => {
              apply(rows, true);
              params.markReady();
            })
            .catch((e) => params.markError(e));
        }
        return () => {
          writer = null;
        };
      },
    },
    onUpdate: mutate(desc.update, "update") as never,
    onInsert: mutate(desc.insert, "insert") as never,
    onDelete: mutate(desc.delete, "delete") as never,
  });

  // Rust decides which columns to index (from Toasty #[index] + extras).
  for (const field of desc.indexes) {
    collection.createIndex((row: any) => row[field], { indexType: BTreeIndex });
  }

  return {
    collection,
    desc,
    refresh: async () => apply(await load(), true),
    applyServer: (rows, deleted) => apply(rows, false, deleted),
  };
}

function shallowEqual(a: Row, b: Row) {
  for (const k in a) if (a[k] !== b[k]) return false;
  for (const k in b) if (!(k in a)) return false;
  return true;
}

export function createStore(schema: ClientSchema, scope: string, snapshot: Record<string, Row[]> = {}) {
  const synced: Record<string, Synced> = {};
  for (const desc of schema.collections) {
    synced[desc.name] = syncedCollection(desc, scope, snapshot[desc.name]);
  }
  const refreshAll = () => Promise.all(Object.values(synced).map((s) => s.refresh()));
  // Cheap freshness until P6 push invalidation: refetch on focus/online.
  let last = Date.now();
  const onFocus = () => {
    if (Date.now() - last < 10_000) return;
    last = Date.now();
    refreshAll().catch((e) => {
      if (e instanceof AuthError) location.href = "/login";
    });
  };
  window.addEventListener("focus", onFocus);
  window.addEventListener("online", onFocus);
  return { synced, refreshAll, get: (name: string) => synced[name]!.collection };
}

export type Store = ReturnType<typeof createStore>;
