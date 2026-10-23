// Why do filter changes cost ~570ms at 50k issues? Compare query shapes.
// Run: pnpm vitest run test/query-bench.test.ts (prints timings).
import { BTreeIndex, createCollection, createLiveQueryCollection, eq, localOnlyCollectionOptions } from "@tanstack/db";
import { test } from "vitest";

type Issue = { id: string; open: boolean; modified: number; creatorId: string; assigneeId: string | null; title: string };
type User = { id: string; login: string };

const N = Number(process.env.N ?? 50_000);
const users: User[] = Array.from({ length: 14 }, (_, i) => ({ id: `u${i}`, login: `user${i}` }));
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const issues: Issue[] = Array.from({ length: N }, (_, i) => ({
  id: `i${i}`,
  open: rnd() < 0.3,
  modified: Math.floor(rnd() * 1e12),
  creatorId: `u${Math.floor(rnd() * 14)}`,
  assigneeId: rnd() < 0.6 ? `u${Math.floor(rnd() * 14)}` : null,
  title: `issue ${i}`,
}));

async function time(label: string, build: () => any) {
  const t0 = performance.now();
  const live = build();
  await live.preload();
  const rows = live.toArray.length;
  const ms = performance.now() - t0;
  console.log(`${label.padEnd(44)} ${ms.toFixed(0).padStart(6)}ms  rows=${rows}`);
  live.cleanup();
}

test(`query shapes at ${N} issues`, { timeout: 120_000 }, async () => {
  const I = createCollection(localOnlyCollectionOptions<Issue>({ id: "issues", getKey: (i) => i.id, initialData: issues }));
  const U = createCollection(localOnlyCollectionOptions<User>({ id: "users", getKey: (u) => u.id, initialData: users }));
  await I.preload();
  await U.preload();
  if (process.env.INDEX) {
    const t0 = performance.now();
    I.createIndex((i) => i.modified, { indexType: BTreeIndex });
    I.createIndex((i) => i.open, { indexType: BTreeIndex });
    U.createIndex((u) => u.id, { indexType: BTreeIndex });
    console.log(`indexes built ${(performance.now() - t0).toFixed(0)}ms`);
  }

  for (const open of [true, false, undefined] as const) {
    const tag = open === undefined ? "all" : open ? "open" : "closed";
    const where = (i: any) => (open === undefined ? eq(1, 1) : eq(i.open, open));

    await time(`[${tag}] no join, orderBy+limit 200`, () =>
      createLiveQueryCollection({
        startSync: true,
        query: (q) => q.from({ i: I }).where(({ i }) => where(i)).orderBy(({ i }) => i.modified, "desc").limit(200),
      }),
    );

    await time(`[${tag}] 2 left joins, orderBy+limit (current)`, () =>
      createLiveQueryCollection({
        startSync: true,
        query: (q) =>
          q
            .from({ i: I })
            .leftJoin({ c: U }, ({ i, c }) => eq(i.creatorId, c.id))
            .leftJoin({ a: U }, ({ i, a }) => eq(i.assigneeId, a.id))
            .where(({ i }) => where(i))
            .orderBy(({ i }) => i.modified, "desc")
            .limit(200)
            .select(({ i, c, a }) => ({ id: i.id, title: i.title, creator: c.login, assignee: a.login })),
      }),
    );

    await time(`[${tag}] limit in subquery, then joins`, () =>
      createLiveQueryCollection({
        startSync: true,
        query: (q) => {
          const top = q.from({ i: I }).where(({ i }) => where(i)).orderBy(({ i }) => i.modified, "desc").limit(200);
          return q
            .from({ i: top })
            .leftJoin({ c: U }, ({ i, c }) => eq(i.creatorId, c.id))
            .leftJoin({ a: U }, ({ i, a }) => eq(i.assigneeId, a.id))
            .orderBy(({ i }) => i.modified, "desc")
            .select(({ i, c, a }) => ({ id: i.id, title: i.title, creator: c.login, assignee: a.login }));
        },
      }),
    );
  }
});
