// P0 handwritten issue list. Everything here is what P1–P4 must generate
// from Rust: the query (→ live_query!), the row template (→ for_live), and
// the toggle mutation (→ mutate!).

import { createLiveQueryCollection, eq, ilike, and, type Collection } from "@tanstack/db";
import type { Collections } from "../collections";
import { mountKeyedList } from "../list";
import type { Boot } from "../schema";

type Row = {
  id: string;
  shortId: number;
  title: string;
  open: boolean;
  modified: number;
  created: number;
  creator: string | undefined;
  assignee: string | undefined;
};

type Filters = {
  open: "open" | "closed" | "all";
  creator: string;
  assignee: string;
  label: string;
  text: string;
  sort: "modified" | "created";
};

const LIMIT = 200;

function buildQuery(c: Collections, f: Filters) {
  return createLiveQueryCollection({
    startSync: true,
    query: (q) => {
      let base = q
        .from({ issue: c.issues })
        .leftJoin({ creator: c.users }, ({ issue, creator }) => eq(issue.creatorId, creator.id))
        .leftJoin({ assignee: c.users }, ({ issue, assignee }) => eq(issue.assigneeId, assignee.id));
      if (f.label) {
        base = base.innerJoin({ il: c.issueLabels }, ({ issue, il }) => eq(issue.id, il.issueId)) as typeof base;
      }
      return base
        .where((r) => {
          const { issue } = r;
          const conds = [];
          if (f.open !== "all") conds.push(eq(issue.open, f.open === "open"));
          if (f.creator) conds.push(eq(issue.creatorId, f.creator));
          if (f.assignee) conds.push(eq(issue.assigneeId, f.assignee));
          if (f.label) conds.push(eq((r as any).il.labelId, f.label));
          if (f.text) conds.push(ilike(issue.title, `%${f.text}%`));
          if (conds.length === 0) return eq(1, 1);
          return conds.length === 1 ? conds[0]! : and(conds[0]!, conds[1]!, ...conds.slice(2));
        })
        .orderBy(({ issue }) => (f.sort === "created" ? issue.created : issue.modified), "desc")
        .limit(LIMIT)
        .select(({ issue, creator, assignee }) => ({
          id: issue.id,
          shortId: issue.shortId,
          title: issue.title,
          open: issue.open,
          modified: issue.modified,
          created: issue.created,
          creator: creator.login,
          assignee: assignee.login,
        }));
    },
  });
}

// issueId → labelIds, maintained incrementally from issueLabels changes.
// P2 replaces this with a generated grouped live query / `include`.
function labelIndex(c: Collections) {
  const byIssue = new Map<string, Set<string>>();
  const add = (issueId: string, labelId: string) => {
    let s = byIssue.get(issueId);
    if (!s) byIssue.set(issueId, (s = new Set()));
    s.add(labelId);
  };
  c.issueLabels.subscribeChanges(
    (changes) => {
      for (const ch of changes) {
        if (ch.type === "insert") add(ch.value.issueId, ch.value.labelId);
        else if (ch.type === "delete") byIssue.get(ch.value.issueId)?.delete(ch.value.labelId);
      }
    },
    { includeInitialState: true },
  );
  return (issueId: string): string[] => {
    const ids = byIssue.get(issueId);
    if (!ids) return [];
    const out: string[] = [];
    for (const id of ids) {
      const l = c.labels.get(id);
      if (l) out.push(l.name);
    }
    return out;
  };
}

export function mountIssues(c: Collections, boot: Boot) {
  const list = document.getElementById("issues")!;
  const countEl = document.getElementById("count")!;
  const timingEl = document.getElementById("timing")!;
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

  const labelChips = labelIndex(c);
  const filters: Filters = { open: "open", creator: "", assignee: "", label: "", text: "", sort: "modified" };

  // Populate filter dropdowns from local collections, and keep them live.
  const fillSelect = (el: HTMLSelectElement, items: { id: string; name: string }[]) => {
    const keep = el.value;
    const first = el.options[0]!;
    el.replaceChildren(first, ...items.map((i) => new Option(i.name, i.id)));
    el.value = keep;
  };
  const fillPeople = () => {
    const people = c.users.toArray.map((u) => ({ id: u.id, name: u.login })).sort((a, b) => a.name.localeCompare(b.name));
    fillSelect($("f-creator"), people);
    fillSelect($("f-assignee"), people);
  };
  const fillLabels = () =>
    fillSelect($("f-label"), c.labels.toArray.map((l) => ({ id: l.id, name: l.name })).sort((a, b) => a.name.localeCompare(b.name)));
  c.users.subscribeChanges(fillPeople);
  c.labels.subscribeChanges(fillLabels);
  fillPeople();
  fillLabels();

  let live: Collection<Row, string> | null = null;
  let unmount: (() => void) | null = null;
  let tFilter = 0;

  const remount = () => {
    unmount?.();
    live?.cleanup();
    tFilter = performance.now();
    live = buildQuery(c, filters) as unknown as Collection<Row, string>;
    let first = true;
    unmount = mountKeyedList<Row>(
      list,
      live,
      {
        key: (r) => r.id,
        create: () => {
          const li = document.createElement("li");
          li.innerHTML =
            '<button class="toggle" data-action="toggle"></button><span class="sid mono"></span><span class="title"></span><span class="labels"></span><span class="who muted"></span>';
          return li;
        },
        update: (li, r) => {
          const [toggle, sid, title, labels, who] = li.children as unknown as HTMLElement[];
          toggle!.textContent = r.open ? "○" : "●";
          sid!.textContent = String(r.shortId);
          title!.textContent = r.title;
          labels!.replaceChildren(
            ...labelChips(r.id).map((n) => Object.assign(document.createElement("span"), { textContent: n })),
          );
          who!.textContent = r.assignee ? `${r.creator ?? "?"} → ${r.assignee}` : (r.creator ?? "?");
          // A row with an un-persisted optimistic change is dimmed.
          li.classList.toggle("pending", Boolean(c.issues.get(r.id) && (c.issues as any)._state?.optimisticUpserts?.has?.(r.id)));
        },
      },
      ({ rows, ms, changed }) => {
        countEl.textContent = `${rows}${rows === LIMIT ? "+" : ""} of ${c.issues.size} issues`;
        // Report the first ready render after a filter change (query build +
        // initial IVM run + DOM). Later no-op passes don't overwrite it.
        if (first || changed > 0) {
          const label = first ? "filter→dom" : "update dom";
          const total = first ? ` ${(performance.now() - tFilter).toFixed(1)}ms ·` : "";
          timingEl.textContent = `${label}${total} dom ${ms.toFixed(1)}ms · ${changed} ops`;
        }
        first = false;
      },
    );
  };

  const bind = (id: string, key: keyof Filters, ev = "change") =>
    $(id).addEventListener(ev, (e) => {
      (filters as any)[key] = (e.target as HTMLInputElement).value;
      remount();
    });
  bind("f-open", "open");
  bind("f-creator", "creator");
  bind("f-assignee", "assignee");
  bind("f-label", "label");
  bind("f-sort", "sort");
  bind("f-text", "text", "input");

  // Optimistic toggle: local state flips immediately, the Rust route
  // persists it (or rejects → TanStack rolls back).
  list.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-action=toggle]");
    if (!btn) return;
    const id = btn.closest<HTMLElement>("li")!.dataset.key!;
    const tx = c.issues.update(id, (d) => {
      d.open = !d.open;
    });
    tx.isPersisted.promise.catch((err: unknown) => toast(`Rolled back: ${(err as Error).message}`));
  });

  remount();
  (window as any).__fastcoat = { collections: c, filters, boot, remount };
}

function toast(msg: string) {
  const el = Object.assign(document.createElement("div"), { id: "toast", textContent: msg });
  document.body.append(el);
  setTimeout(() => el.remove(), 3000);
}
