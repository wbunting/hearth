// P0: handwritten collections over the Rust JSON routes. P1 builds these
// from descriptors the `collection!` macro emits.

import { BTreeIndex, createCollection } from "@tanstack/db";
import { QueryClient } from "@tanstack/query-core";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import type { Boot, Issue, IssueLabel, Label, User } from "./schema";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { accept: "application/json" } });
  if (res.redirected || res.status === 401 || res.status === 403) {
    // Session gone: drop local state and go to login.
    location.href = "/login";
    throw new Error("signed out");
  }
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export function createCollections(boot: Boot) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: true } },
  });
  const snap = boot.snapshot;
  // The SSR snapshot is as fresh as the HTML, so it counts as fetched now.
  const seeded = <T>(rows: T[] | undefined) =>
    rows ? { initialData: rows, initialDataUpdatedAt: Date.now() } : {};
  // Scope fingerprint in the key: a different user/role never sees cached rows.
  const key = (name: string) => [boot.scope, name];

  const issues = createCollection(
    queryCollectionOptions<Issue>({
      id: "issues",
      queryKey: key("issues"),
      queryClient,
      getKey: (i) => i.id,
      queryFn: () => getJson<Issue[]>("/api/issues"),
      ...seeded(snap?.issues),
      onUpdate: async ({ transaction }) => {
        const confirmed = await Promise.all(
          transaction.mutations.map((m) => {
            const { changes } = m;
            return postJson<Issue>("/api/issues/update", { id: m.key, ...changes });
          }),
        );
        // Apply the server's version of each row instead of refetching all 50k.
        issues.utils.writeUpsert(confirmed);
        return { refetch: false };
      },
    }),
  );

  const users = createCollection(
    queryCollectionOptions<User>({
      id: "users",
      queryKey: key("users"),
      queryClient,
      getKey: (u) => u.id,
      queryFn: () => getJson<User[]>("/api/users"),
      ...seeded(snap?.users),
    }),
  );

  const labels = createCollection(
    queryCollectionOptions<Label>({
      id: "labels",
      queryKey: key("labels"),
      queryClient,
      getKey: (l) => l.id,
      queryFn: () => getJson<Label[]>("/api/labels"),
      ...seeded(snap?.labels),
    }),
  );

  const issueLabels = createCollection(
    queryCollectionOptions<IssueLabel>({
      id: "issue-labels",
      queryKey: key("issue-labels"),
      queryClient,
      getKey: (il) => il.id,
      queryFn: () => getJson<IssueLabel[]>("/api/issue-labels"),
      ...seeded(snap?.issue_labels),
    }),
  );

  // Indexes are opt-in in TanStack DB. Without them every filter change is a
  // full scan + sort: 0.6–4.4s at 50k issues vs 3–24ms with them
  // (client/test/query-bench.test.ts). P1 derives these from Toasty #[index].
  issues.createIndex((i) => i.modified, { indexType: BTreeIndex });
  issues.createIndex((i) => i.created, { indexType: BTreeIndex });
  issues.createIndex((i) => i.open, { indexType: BTreeIndex });
  issues.createIndex((i) => i.creatorId, { indexType: BTreeIndex });
  issues.createIndex((i) => i.assigneeId, { indexType: BTreeIndex });
  users.createIndex((u) => u.id, { indexType: BTreeIndex });
  issueLabels.createIndex((il) => il.issueId, { indexType: BTreeIndex });
  issueLabels.createIndex((il) => il.labelId, { indexType: BTreeIndex });

  return { queryClient, issues, users, labels, issueLabels };
}

export type Collections = ReturnType<typeof createCollections>;
