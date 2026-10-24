// Comparison app: the same issue list + detail in React 19 + TanStack DB
// (the "typical" local-first stack). Same data, same `/_fastcoat` endpoints,
// same indexes, same planner tricks (none; idiomatic useLiveQuery).
// Client-rendered SPA: empty shell from the server, data fetched on boot.
import { BTreeIndex, createCollection, eq, ilike, and } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { StrictMode, useDeferredValue, useState } from "react";
import { createRoot } from "react-dom/client";

type Row = Record<string, any>;

function synced(name: string, key: string, indexes: string[]) {
  const c = createCollection<Row, string>({
    id: name,
    getKey: (r) => String(r[key]),
    sync: {
      rowUpdateMode: "full",
      sync: ({ begin, write, commit, markReady }) => {
        fetch(`/_fastcoat/${name}/load`)
          .then((r) => r.json())
          .then((rows: Row[]) => {
            begin();
            for (const r of rows) write({ type: "insert", value: r });
            commit();
            markReady();
            (window as any).__readyAt ??= {};
            (window as any).__readyAt[name] = performance.now();
          });
      },
    },
    onUpdate: async ({ transaction }) => {
      for (const m of transaction.mutations)
        await fetch(`/_fastcoat/${name}/mutate`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ op: "update", key: m.key, changes: m.changes }),
        });
    },
  });
  for (const f of indexes) c.createIndex((r: any) => r[f], { indexType: BTreeIndex });
  return c;
}

const issues = synced("issues", "id", ["id", "shortId", "open", "modified", "creatorId", "assigneeId"]);
const users = synced("users", "id", ["id"]);

function List({ onOpen }: { onOpen: (sid: number) => void }) {
  const [open, setOpen] = useState(true);
  const [text, setText] = useState("");
  // Idiomatic React: keep the input responsive with useDeferredValue.
  const q = useDeferredValue(text);
  const { data } = useLiveQuery(
    (b) =>
      b
        .from({ i: issues })
        .where(({ i }) => (q ? and(eq(i.open, open), ilike(i.title, `%${q}%`)) : eq(i.open, open)))
        .orderBy(({ i }) => i.modified, "desc")
        .limit(200)
        .leftJoin({ c: users }, ({ i, c }) => eq(i.creatorId, c.id))
        .select(({ i, c }) => ({ id: i.id, shortId: i.shortId, title: i.title, open: i.open, creator: c.login })),
    [open, q],
  );
  return (
    <>
      <section className="filters">
        <select onChange={(e) => setOpen(e.target.value === "open")}>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <input type="search" placeholder="Filter title…" value={text} onChange={(e) => setText(e.target.value)} />
      </section>
      <ul className="issues">
        {(data ?? []).map((r) => (
          <li key={r.id}>
            <button onClick={() => issues.update(r.id, (d) => void (d.open = !d.open))}>{r.open ? "○" : "●"}</button>
            <span className="sid">{r.shortId}</span>
            <a
              className="title"
              href={`/bench/react/issue/${r.shortId}`}
              onClick={(e) => {
                e.preventDefault();
                onOpen(r.shortId);
              }}
            >
              {r.title}
            </a>
            <span className="who">{r.creator}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Detail({ sid, onBack }: { sid: number; onBack: () => void }) {
  const { data } = useLiveQuery(
    (b) =>
      b
        .from({ i: issues })
        .where(({ i }) => eq(i.shortId, sid))
        .leftJoin({ c: users }, ({ i, c }) => eq(i.creatorId, c.id))
        .select(({ i, c }) => ({ id: i.id, title: i.title, open: i.open, creator: c.login })),
    [sid],
  );
  const i = data?.[0];
  return (
    <article className="detail">
      <a href="/bench/react" onClick={(e) => (e.preventDefault(), onBack())}>
        ← Issues
      </a>
      <h1>{i?.title}</h1>
      <p>
        {i?.open ? "Open" : "Closed"} · by {i?.creator}
      </p>
    </article>
  );
}

function App() {
  const [sid, setSid] = useState<number | null>(null);
  return sid == null ? <List onOpen={(s) => setSid(s)} /> : <Detail sid={sid} onBack={() => setSid(null)} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
