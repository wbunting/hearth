// zbugs UI, handwritten (P0/P1). Everything here is what P2–P4 generate
// from Rust: queries (live_query!), row templates (for_live), mutations.

import {
  and,
  createLiveQueryCollection,
  eq,
  ilike,
  inArray,
  type Collection,
} from "@tanstack/db";
import { mountKeyedList } from "../list";
import type { Store } from "../runtime";
import type { Boot, Comment, Emoji, Issue, IssueLabel, Label, User } from "../schema";

type ListRow = Pick<Issue, "id" | "shortId" | "title" | "open" | "modified" | "created"> & {
  creator: string | undefined;
  assignee: string | undefined;
};
type Filters = { open: "open" | "closed" | "all"; creator: string; assignee: string; label: string; text: string; sort: "modified" | "created" };

const LIMIT = 200;
const EMOJIS = ["👍", "🎉", "❤️", "👀", "🚀"];

export function mountApp(store: Store, boot: Boot) {
  const issues = store.get("issues") as unknown as Collection<Issue, string>;
  const users = store.get("users") as unknown as Collection<User, string>;
  const labels = store.get("labels") as unknown as Collection<Label, string>;
  const issueLabels = store.get("issueLabels") as unknown as Collection<IssueLabel, string>;
  const comments = store.get("comments") as unknown as Collection<Comment, string>;
  const emojis = store.get("emojis") as unknown as Collection<Emoji, string>;
  const descriptions = new Map(Object.entries(boot.descriptions));
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const app = $("app");
  const login = (id: string | null | undefined) => (id ? users.get(id)?.login : undefined) ?? "?";
  const canEdit = (i: Issue) => boot.user.crew || i.creatorId === boot.user.id;
  const modeQ = boot.mode === "local" ? "?mode=local" : "";

  const filters: Filters = { open: "open", creator: "", assignee: "", label: "", text: "", sort: "modified" };
  let booted = false;

  // ---- label lookup: issueId -> labelIds, incremental ----
  const labelsByIssue = new Map<string, Set<string>>();
  const issuesByLabel = new Map<string, Set<string>>();
  const link = (m: Map<string, Set<string>>, a: string, b: string, on: boolean) => {
    let s = m.get(a);
    if (!s) m.set(a, (s = new Set()));
    on ? s.add(b) : s.delete(b);
  };
  issueLabels.subscribeChanges(
    (changes) => {
      for (const ch of changes) {
        const on = ch.type !== "delete";
        link(labelsByIssue, ch.value.issueId, ch.value.labelId, on);
        link(issuesByLabel, ch.value.labelId, ch.value.issueId, on);
      }
      if (booted && filters.label) remount();
    },
    { includeInitialState: true },
  );
  const labelNames = (issueId: string) =>
    [...(labelsByIssue.get(issueId) ?? [])].map((id) => labels.get(id)?.name).filter(Boolean) as string[];

  // ================= list =================

  function buildListQuery(f: Filters) {
    // Label filter = indexed lookup + `inArray` (indexable), instead of a
    // join through issueLabels (P0: ~413ms → see RESULTS.md).
    const labelIds = f.label ? [...(issuesByLabel.get(f.label) ?? [])] : null;
    return createLiveQueryCollection({
      startSync: true,
      query: (q) =>
        q
          .from({ issue: issues })
          .where(({ issue }) => {
            const c: any[] = [];
            if (f.open !== "all") c.push(eq(issue.open, f.open === "open"));
            if (f.creator) c.push(eq(issue.creatorId, f.creator));
            if (f.assignee) c.push(eq(issue.assigneeId, f.assignee));
            if (labelIds) c.push(inArray(issue.id, labelIds));
            if (f.text) c.push(ilike(issue.title, `%${f.text}%`));
            return c.length === 0 ? eq(1, 1) : c.length === 1 ? c[0] : and(c[0], c[1], ...c.slice(2));
          })
          .orderBy(({ issue }) => (f.sort === "created" ? issue.created : issue.modified), "desc")
          .limit(LIMIT)
          // Joins after the limit: users is tiny, so join cost is ~200 rows.
          .leftJoin({ creator: users }, ({ issue, creator }) => eq(issue.creatorId, creator.id))
          .leftJoin({ assignee: users }, ({ issue, assignee }) => eq(issue.assigneeId, assignee.id))
          .select(({ issue, creator, assignee }) => ({
            id: issue.id,
            shortId: issue.shortId,
            title: issue.title,
            open: issue.open,
            modified: issue.modified,
            created: issue.created,
            creator: creator.login,
            assignee: assignee.login,
          })),
    });
  }

  const list = $("issues");
  let live: Collection<ListRow, string> | null = null;
  let unmountList: (() => void) | null = null;
  let tFilter = 0;
  let listRows: ListRow[] = [];

  function remount() {
    unmountList?.();
    live?.cleanup();
    tFilter = performance.now();
    live = buildListQuery(filters) as unknown as Collection<ListRow, string>;
    let first = true;
    unmountList = mountKeyedList<ListRow>(
      list,
      live,
      {
        key: (r) => r.id,
        create: () => {
          const li = document.createElement("li");
          li.innerHTML =
            '<button class="toggle" data-action="toggle"></button><a class="sid mono" data-nav="issue"></a><a class="title" data-nav="issue"></a><span class="labels"></span><span class="who muted"></span>';
          return li;
        },
        update: (li, r) => {
          const [toggle, sid, title, lbls, who] = li.children as unknown as HTMLElement[];
          toggle!.textContent = r.open ? "○" : "●";
          const href = `/issue/${r.shortId}${modeQ}`;
          (sid as HTMLAnchorElement).href = href;
          (title as HTMLAnchorElement).href = href;
          sid!.textContent = String(r.shortId);
          title!.textContent = r.title;
          lbls!.replaceChildren(...labelNames(r.id).map((n) => Object.assign(document.createElement("span"), { textContent: n })));
          who!.textContent = r.assignee ? `${r.creator ?? "?"} → ${r.assignee}` : (r.creator ?? "?");
        },
      },
      ({ rows, ms, changed }) => {
        listRows = live!.toArray;
        $("count").textContent = `${rows}${rows === LIMIT ? "+" : ""} of ${issues.size} issues`;
        if (first || changed > 0) {
          const total = first ? ` ${(performance.now() - tFilter).toFixed(1)}ms ·` : "";
          $("timing").textContent = `${first ? "filter→dom" : "update"}${total} dom ${ms.toFixed(1)}ms`;
        }
        first = false;
      },
    );
  }

  const fillSelect = (el: HTMLSelectElement, items: { id: string; name: string }[]) => {
    const keep = el.value;
    el.replaceChildren(el.options[0]!, ...items.map((i) => new Option(i.name, i.id)));
    el.value = keep;
  };
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  const fillPeople = () => {
    const people = users.toArray.map((u) => ({ id: u.id, name: u.login })).sort(byName);
    fillSelect($("f-creator"), people);
    fillSelect($("f-assignee"), people);
  };
  const fillLabels = () => fillSelect($("f-label"), labels.toArray.map((l) => ({ id: l.id, name: l.name })).sort(byName));
  users.subscribeChanges(fillPeople, { includeInitialState: true });
  labels.subscribeChanges(fillLabels, { includeInitialState: true });

  const bindFilter = (id: string, key: keyof Filters, ev = "change") =>
    $(id).addEventListener(ev, (e) => {
      (filters as any)[key] = (e.target as HTMLInputElement).value;
      remount();
    });
  bindFilter("f-open", "open");
  bindFilter("f-creator", "creator");
  bindFilter("f-assignee", "assignee");
  bindFilter("f-label", "label");
  bindFilter("f-sort", "sort");
  bindFilter("f-text", "text", "input");

  list.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-action=toggle]");
    if (!btn) return;
    toggleOpen(btn.closest<HTMLElement>("li")!.dataset.key!);
  });

  function toggleOpen(id: string) {
    const issue = issues.get(id);
    if (!issue) return;
    if (!canEdit(issue)) return toast("Only crew or the creator can edit");
    report(issues.update(id, (d) => void (d.open = !d.open)));
  }

  // ================= detail =================
  const detail = $("detail-view");
  let detailCleanup: (() => void) | null = null;

  function showDetail(id: string) {
    detailCleanup?.();
    const subs: Array<{ unsubscribe(): void } | (() => void)> = [];
    detailCleanup = () => subs.forEach((s) => (typeof s === "function" ? s() : s.unsubscribe()));

    detail.innerHTML = `
      <nav class="crumbs">
        <a href="/issues${modeQ}" data-nav="list">← Issues</a>
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
    const f = (n: string) => detail.querySelector<HTMLElement>(`[data-f="${n}"]`)!;
    const a = <T extends HTMLElement>(n: string) => detail.querySelector<T>(`[data-a="${n}"]`)!;

    const assignSel = a<HTMLSelectElement>("assignee");
    for (const u of users.toArray.slice().sort((x, y) => x.login.localeCompare(y.login))) assignSel.add(new Option(u.login, u.id));

    const renderIssue = () => {
      const i = issues.get(id);
      if (!i) {
        f("title").textContent = "Issue not found (or not visible to you)";
        return;
      }
      document.title = `#${i.shortId} ${i.title} · zbugs`;
      f("sid").textContent = `#${i.shortId}`;
      const t = f("title");
      if (document.activeElement !== t) t.textContent = i.title;
      t.contentEditable = String(canEdit(i));
      a("toggle").textContent = i.open ? "Close issue" : "Reopen issue";
      f("by").textContent = `${i.open ? "Open" : "Closed"} · by ${login(i.creatorId)} · ${new Date(i.created).toLocaleDateString()}`;
      assignSel.value = i.assigneeId ?? "";
      assignSel.disabled = !canEdit(i);
      f("vis").textContent = i.visibility === "internal" ? "internal" : "";
      const on = labelsByIssue.get(id) ?? new Set();
      f("labels").replaceChildren(
        ...labels.toArray
          .slice()
          .sort(byName)
          .filter((l) => on.has(l.id) || canEdit(i))
          .map((l) => {
            const b = Object.assign(document.createElement("button"), { className: `chip${on.has(l.id) ? " on" : ""}`, textContent: l.name });
            b.dataset.label = l.id;
            b.disabled = !canEdit(i);
            return b;
          }),
      );
      const desc = descriptions.get(id);
      f("desc").textContent = desc ?? "Loading description…";
      if (desc === undefined) loadDescription(id).then(() => renderIssue());
    };

    // Comments: a live query per open issue; keyed list renderer again.
    const commentsLive = createLiveQueryCollection({
      startSync: true,
      query: (q) =>
        q
          .from({ c: comments })
          .where(({ c }) => eq(c.issueId, id))
          .orderBy(({ c }) => c.created, "asc"),
    }) as unknown as Collection<Comment, string>;
    subs.push(() => commentsLive.cleanup());
    subs.push(
      mountKeyedList<Comment>(
        f("comments"),
        commentsLive,
        {
          key: (c) => c.id,
          create: () => {
            const li = document.createElement("li");
            li.innerHTML = `<div class="c-head"><strong></strong><span class="muted"></span></div><div class="c-body"></div><div class="reactions"></div>`;
            return li;
          },
          update: (li, c) => {
            li.querySelector("strong")!.textContent = login(c.creatorId);
            li.querySelector(".c-head .muted")!.textContent = new Date(c.created).toLocaleString();
            li.querySelector(".c-body")!.textContent = c.body;
            li.classList.toggle("pending", c.created === 0);
            renderReactions(li.querySelector(".reactions")!, c.id);
          },
        },
        ({ rows }) => (f("ccount").textContent = `(${rows})`),
      ),
    );

    function renderReactions(el: HTMLElement, subjectId: string) {
      const mine = new Map<string, string>();
      const counts = new Map<string, number>();
      for (const e of emojis.toArray) {
        if (e.subjectId !== subjectId) continue;
        counts.set(e.value, (counts.get(e.value) ?? 0) + 1);
        if (e.creatorId === boot.user.id) mine.set(e.value, e.id);
      }
      el.replaceChildren(
        ...EMOJIS.map((v) => {
          const b = document.createElement("button");
          b.textContent = counts.get(v) ? `${v} ${counts.get(v)}` : v;
          b.className = mine.has(v) ? "mine" : "";
          b.dataset.emoji = v;
          b.dataset.subject = subjectId;
          return b;
        }),
      );
    }
    const renderAllReactions = () => {
      renderReactions(f("issue-emojis"), id);
      for (const li of f("comments").children as unknown as HTMLElement[]) renderReactions(li.querySelector(".reactions")!, li.dataset.key!);
    };

    subs.push(issues.subscribeChanges((ch) => ch.some((c) => c.key === id) && renderIssue()));
    subs.push(issueLabels.subscribeChanges((ch) => ch.some((c) => c.value.issueId === id) && renderIssue()));
    subs.push(emojis.subscribeChanges(renderAllReactions));
    subs.push(users.subscribeChanges(renderIssue));
    renderIssue();
    renderAllReactions();

    // ---- detail interactions ----
    a("toggle").onclick = () => toggleOpen(id);
    assignSel.onchange = () => report(issues.update(id, (d) => void (d.assigneeId = assignSel.value || null)));
    f("title").onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
      e.stopPropagation();
    };
    f("title").onblur = () => {
      const t = f("title").textContent!.trim();
      const i = issues.get(id);
      if (i && t && t !== i.title) report(issues.update(id, (d) => void (d.title = t.slice(0, 128))));
      else renderIssue();
    };
    f("labels").onclick = (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-label]");
      if (!b) return;
      const labelId = b.dataset.label!;
      const key = `${labelId}:${id}`;
      report(issueLabels.has(key) ? issueLabels.delete(key) : issueLabels.insert({ id: key, labelId, issueId: id }));
    };
    detail.addEventListener("click", onReact);
    subs.push(() => detail.removeEventListener("click", onReact));
    function onReact(e: Event) {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-emoji]");
      if (!b) return;
      const mine = emojis.toArray.find((x) => x.subjectId === b.dataset.subject && x.value === b.dataset.emoji && x.creatorId === boot.user.id);
      report(
        mine
          ? emojis.delete(mine.id)
          : emojis.insert({ id: crypto.randomUUID(), value: b.dataset.emoji!, subjectId: b.dataset.subject!, creatorId: boot.user.id, created: Date.now() }),
      );
    }
    const form = a<HTMLFormElement>("comment");
    const ta = form.querySelector("textarea")!;
    ta.onkeydown = (e) => {
      e.stopPropagation();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) form.requestSubmit();
    };
    form.onsubmit = (e) => {
      e.preventDefault();
      const body = ta.value.trim();
      if (!body) return;
      ta.value = "";
      // Optimistic: shows immediately; server fills creator/created.
      report(comments.insert({ id: crypto.randomUUID(), issueId: id, created: Date.now(), body, creatorId: boot.user.id }));
    };
  }

  async function loadDescription(id: string) {
    if (descriptions.has(id)) return;
    const res = await fetch(`/api/issues/${encodeURIComponent(id)}/description`);
    descriptions.set(id, res.ok ? await res.text() : "");
  }

  // ================= client routing =================
  // Topcoat's navigation only intercepts `data-topcoat-link` anchors, so
  // these plain anchors are ours. Server routes exist for every URL, so
  // reload/deep links render via SSR.
  type Route = { view: "list" } | { view: "detail"; shortId: number };
  const parse = (url: URL): Route | null => {
    if (url.pathname === "/issues") return { view: "list" };
    const m = url.pathname.match(/^\/issue\/(\d+)$/);
    return m ? { view: "detail", shortId: Number(m[1]) } : null;
  };
  const byShortId = (sid: number) => issues.toArray.find((i) => i.shortId === sid);
  let selectedId: string | null = null;

  function render(route: Route) {
    const t0 = performance.now();
    if (route.view === "list") {
      app.dataset.view = "list";
      document.title = "zbugs · hearth";
      detailCleanup?.();
      detailCleanup = null;
      if (!live) remount();
      if (selectedId) list.querySelector(`li[data-key="${CSS.escape(selectedId)}"]`)?.scrollIntoView({ block: "nearest" });
    } else {
      const issue = byShortId(route.shortId);
      if (!issue) {
        // Not local yet (cold local mode): fall back to a server render.
        location.reload();
        return;
      }
      selectedId = issue.id;
      app.dataset.view = "detail";
      showDetail(issue.id);
      scrollTo(0, 0);
    }
    (window as any).__hearthNav = performance.now() - t0;
  }

  function navigate(href: string, push = true) {
    const url = new URL(href, location.href);
    const route = parse(url);
    if (!route) return (location.href = href);
    if (push) history.pushState({ hearth: true }, "", url);
    render(route);
  }

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const aEl = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-nav]");
    if (!aEl) return;
    e.preventDefault();
    navigate(aEl.href);
  });
  addEventListener("popstate", (e) => {
    if (e.state?.hearth || parse(new URL(location.href))) navigate(location.href, false);
  });
  history.replaceState({ hearth: true }, "");

  // Keyboard: j/k next/prev issue in the current list order, esc back.
  document.addEventListener("keydown", (e) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement).isContentEditable) return;
    if (e.key === "Escape" && app.dataset.view === "detail") return navigate(`/issues${modeQ}`);
    if (e.key !== "j" && e.key !== "k") return;
    const idx = listRows.findIndex((r) => r.id === selectedId);
    const next = listRows[Math.max(0, Math.min(listRows.length - 1, idx + (e.key === "j" ? 1 : -1)))];
    if (!next) return;
    selectedId = next.id;
    if (app.dataset.view === "detail") navigate(`/issue/${next.shortId}${modeQ}`);
    for (const li of list.children as unknown as HTMLElement[]) li.classList.toggle("selected", li.dataset.key === selectedId);
  });

  // Boot.
  booted = true;
  remount();
  const initial = parse(new URL(location.href));
  if (initial?.view === "detail") {
    issues.onFirstReady(() => render(initial));
  }

  (window as any).__hearth = { store, boot, filters, remount, navigate };
}

function report(tx: { isPersisted: { promise: Promise<unknown> } }) {
  tx.isPersisted.promise.catch((err: unknown) => toast(`Rolled back: ${(err as Error).message}`));
}

function toast(msg: string) {
  const el = Object.assign(document.createElement("div"), { id: "toast", textContent: msg });
  document.body.append(el);
  setTimeout(() => el.remove(), 3500);
}
