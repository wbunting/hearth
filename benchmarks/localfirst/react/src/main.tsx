// Comparison app: the same issue tracker as `examples/fastissuetracker`
// (`/issues`), in React 19 + TanStack DB, the typical local-first stack.
//
// Equal work, idiomatic code:
// - same data, endpoints, indexes and Tailwind classes (shared stylesheet);
// - list: open/closed/all + creator + assignee + title search, joined to
//   users twice, newest 200;
// - detail: title, close/reopen, assignee select, label chips + label menu,
//   reactions (all + mine), comments with their own reactions, composer;
// - optimistic writes through TanStack collection handlers;
// - client routing on the same URLs (/issues, /issue/:shortId);
// - `useDeferredValue` keeps typing responsive (React's recommended pattern).
// Not equal by design: React renders on the client (empty server shell),
// fastcoat server-renders the first view.
import { and, BTreeIndex, createCollection, eq, ilike } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { StrictMode, useDeferredValue, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

type Row = Record<string, any>;

async function post(name: string, body: unknown): Promise<Row | null> {
	const r = await fetch(`/_fastcoat/${name}/mutate`, {
		method: "POST",
		headers: { "content-type": "application/json", accept: "application/json" },
		body: JSON.stringify(body),
	});
	if (!r.ok) throw new Error(`${r.status}`);
	const t = await r.text();
	return t ? JSON.parse(t) : null;
}

function synced(name: string, indexes: string[]) {
	let writer: any;
	const apply = (rows: Row[], deleted: string[] = []) => {
		writer.begin();
		for (const r of rows) writer.write({ type: c.has(String(r.id)) ? "update" : "insert", value: r });
		for (const k of deleted) if (c.has(k)) writer.write({ type: "delete", value: c.get(k) });
		writer.commit();
	};
	const c = createCollection<Row, string>({
		id: name,
		getKey: (r) => String(r.id),
		sync: {
			rowUpdateMode: "full",
			sync: (p: any) => {
				writer = p;
				fetch(`/_fastcoat/${name}/load`)
					.then((r) => r.json())
					.then((rows: Row[]) => {
						p.begin();
						for (const r of rows) p.write({ type: "insert", value: r });
						p.commit();
						p.markReady();
					});
			},
		},
		onUpdate: async ({ transaction }) => {
			for (const m of transaction.mutations)
				await post(name, { op: "update", key: m.key, changes: m.changes });
		},
		onInsert: async ({ transaction }) => {
			for (const m of transaction.mutations) {
				const saved = await post(name, { op: "insert", row: m.modified });
				if (saved) queueMicrotask(() => apply([saved], String(saved.id) === String(m.key) ? [] : [String(m.key)]));
			}
		},
		onDelete: async ({ transaction }) => {
			for (const m of transaction.mutations) await post(name, { op: "delete", key: m.key });
		},
	});
	for (const f of indexes) c.createIndex((r: any) => r[f], { indexType: BTreeIndex });
	return c;
}

// Same client indexes as fastcoat's schema (#[key]/#[index] fields).
const issues = synced("issues", ["id", "shortId", "open", "modified", "created", "creatorId", "assigneeId"]);
const users = synced("users", ["id", "login"]);
const labels = synced("labels", ["id"]);
const issueLabels = synced("issue_labels", ["id", "labelId", "issueId"]);
const comments = synced("comments", ["id", "issueId", "created"]);
const emojis = synced("emojis", ["id", "subjectId"]);

const me: { id: string } = (window as any).__me ?? { id: "" };
const toast = (e: Error) => {
	const el = Object.assign(document.createElement("div"), { className: "fastcoat-toast", textContent: `Rolled back: ${e.message}` });
	document.body.append(el);
	setTimeout(() => el.remove(), 3500);
};
const persist = (tx: { isPersisted: { promise: Promise<unknown> } }) => tx.isPersisted.promise.catch(toast);

// ---------------------------------------------------------------- routing

const BASE = "/bench/react";

function usePath(): string {
	const [path, setPath] = useState(location.pathname);
	useEffect(() => {
		const on = () => setPath(location.pathname);
		addEventListener("popstate", on);
		return () => removeEventListener("popstate", on);
	}, []);
	return path;
}
function navigate(to: string) {
	history.pushState(null, "", to);
	dispatchEvent(new PopStateEvent("popstate"));
	scrollTo(0, 0);
}
function Link({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) {
	return (
		<a
			href={to}
			className={className}
			onClick={(e) => {
				if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
				e.preventDefault();
				navigate(to);
			}}
		>
			{children}
		</a>
	);
}

// ---------------------------------------------------------------- list

function People() {
	const { data } = useLiveQuery((q) => q.from({ u: users }).orderBy(({ u }) => u.login).select(({ u }) => ({ id: u.id, login: u.login })));
	return (
		<>
			{(data ?? []).map((u) => (
				<option key={u.id} value={u.id}>
					{u.login}
				</option>
			))}
		</>
	);
}

function List() {
	const [show, setShow] = useState("open");
	const [creator, setCreator] = useState("");
	const [assignee, setAssignee] = useState("");
	const [text, setText] = useState("");
	const q = useDeferredValue(text);
	const { data } = useLiveQuery(
		(b) => {
			const x = b.from({ i: issues }).where(({ i }) => {
				const c: any[] = [];
				if (show !== "all") c.push(eq(i.open, show === "open"));
				if (creator) c.push(eq(i.creatorId, creator));
				if (assignee) c.push(eq(i.assigneeId, assignee));
				if (q) c.push(ilike(i.title, `%${q}%`));
				return c.length === 0 ? eq(1, 1) : c.length === 1 ? c[0] : and(...(c as [any, any]));
			});
			return x
				.orderBy(({ i }) => i.modified, "desc")
				.limit(200)
				.leftJoin({ c: users }, ({ i, c }) => eq(i.creatorId, c.id))
				.leftJoin({ a: users }, ({ i, a }) => eq(i.assigneeId, a.id))
				.select(({ i, c, a }) => ({ id: i.id, shortId: i.shortId, title: i.title, open: i.open, creator: c?.login, assignee: a?.login }));
		},
		[show, creator, assignee, q],
	);
	return (
		<>
			<section className="flex flex-wrap items-center gap-2 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
				<select className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700" value={show} onChange={(e) => setShow(e.target.value)}>
					<option value="open">Open</option>
					<option value="closed">Closed</option>
					<option value="all">All</option>
				</select>
				<select className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700" value={creator} onChange={(e) => setCreator(e.target.value)}>
					<option value="">Any creator</option>
					<People />
				</select>
				<select className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
					<option value="">Any assignee</option>
					<People />
				</select>
				<input
					type="search"
					placeholder="Filter title…"
					className="w-56 rounded-md border border-zinc-300 bg-transparent px-2 py-1 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700"
					value={text}
					onChange={(e) => setText(e.target.value)}
				/>
			</section>
			<ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
				{(data ?? []).map((r) => (
					<li key={r.id} className="grid grid-cols-[1.5rem_4rem_1fr_auto] items-center gap-2 px-4 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
						<button
							type="button"
							title="Close / reopen"
							className={r.open ? "cursor-pointer text-indigo-600 hover:scale-110" : "cursor-pointer text-zinc-400 hover:scale-110"}
							onClick={() => persist(issues.update(r.id, (d) => void (d.open = !d.open)))}
						>
							{r.open ? "○" : "●"}
						</button>
						<Link className="font-mono text-xs text-zinc-500" to={`${BASE}/issue/${r.shortId}`}>
							{r.shortId}
						</Link>
						<Link className="truncate hover:underline" to={`${BASE}/issue/${r.shortId}`}>
							{r.title}
						</Link>
						<span className="truncate text-right text-zinc-500">
							{r.creator ?? "?"}
							{r.assignee ? " → " : ""}
							{r.assignee ?? ""}
						</span>
					</li>
				))}
			</ul>
		</>
	);
}

// ---------------------------------------------------------------- detail

function Detail({ shortId }: { shortId: number }) {
	const { data } = useLiveQuery(
		(b) =>
			b
				.from({ i: issues })
				.where(({ i }) => eq(i.shortId, shortId))
				.leftJoin({ c: users }, ({ i, c }) => eq(i.creatorId, c.id))
				.select(({ i, c }) => ({
					id: i.id,
					shortId: i.shortId,
					title: i.title,
					open: i.open,
					created: i.created,
					creatorId: i.creatorId,
					creator: c?.login,
					assigneeId: i.assigneeId,
					visibility: i.visibility,
				})),
		[shortId],
	);
	const issue = data?.[0];
	return (
		<article className="mx-auto max-w-3xl px-6 pt-4 pb-20">
			{issue && (
				<>
					<nav className="flex items-center gap-2 text-xs">
						<Link className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" to={BASE}>
							← Issues
						</Link>
						<span className="font-mono text-zinc-400"> #{issue.shortId}</span>
					</nav>
					<h1 className="mt-3 mb-2 text-2xl font-semibold tracking-tight">{issue.title}</h1>
					<div className="mb-4 flex flex-wrap items-center gap-2">
						<button
							type="button"
							className="rounded-md bg-indigo-600 px-3 py-1 font-medium text-white hover:bg-indigo-500"
							onClick={() => persist(issues.update(issue.id, (d) => void (d.open = !d.open)))}
						>
							{issue.open ? "Close issue" : "Reopen issue"}
						</button>
						<span className="text-zinc-500">
							{issue.open ? "Open" : "Closed"} · by {issue.creator ?? "?"}
						</span>
						{issue.visibility === "internal" && (
							<span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">internal</span>
						)}
						<label className="ml-auto text-zinc-500">
							Assignee{" "}
							<select
								className="ml-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
								value={issue.assigneeId ?? ""}
								onChange={(e) => persist(issues.update(issue.id, (d) => void (d.assigneeId = e.target.value)))}
							>
								<option value="">Unassigned</option>
								<People />
							</select>
						</label>
					</div>
					<IssueLabels issueId={issue.id} />
					<Reactions subject={issue.id} />
					<Comments issueId={issue.id} />
				</>
			)}
		</article>
	);
}

function IssueLabels({ issueId }: { issueId: string }) {
	const { data: all } = useLiveQuery((b) => b.from({ l: labels }).orderBy(({ l }) => l.name).select(({ l }) => ({ id: l.id, name: l.name })));
	const { data: on } = useLiveQuery(
		(b) =>
			b
				.from({ il: issueLabels })
				.where(({ il }) => eq(il.issueId, issueId))
				.innerJoin({ l: labels }, ({ il, l }) => eq(il.labelId, l.id))
				.orderBy(({ l }) => l.name)
				.select(({ l }) => ({ id: l.id, name: l.name })),
		[issueId],
	);
	return (
		<div className="flex flex-wrap items-center gap-1">
			{(on ?? []).map((l) => (
				<button
					key={l.id}
					type="button"
					className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white hover:bg-indigo-500"
					title="Remove label"
					onClick={() => persist(issueLabels.delete(`${l.id}:${issueId}`))}
				>
					{l.name}
				</button>
			))}
			<details className="relative">
				<summary className="cursor-pointer list-none rounded-full border border-dashed border-zinc-300 px-2 py-0.5 text-xs text-zinc-500 hover:border-indigo-400 dark:border-zinc-700">
					+ label
				</summary>
				<div className="absolute z-20 mt-1 flex w-72 flex-wrap gap-1 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
					{(all ?? []).map((l) => (
						<button
							key={l.id}
							type="button"
							className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs hover:border-indigo-400 dark:border-zinc-700"
							onClick={() => {
								if (!issueLabels.has(`${l.id}:${issueId}`)) persist(issueLabels.insert({ id: `${l.id}:${issueId}`, labelId: l.id, issueId }));
							}}
						>
							{l.name}
						</button>
					))}
				</div>
			</details>
		</div>
	);
}

const EMOJI = ["👍", "🎉", "❤️", "👀", "🚀"];

function Reactions({ subject }: { subject: string }) {
	const { data: all } = useLiveQuery(
		(b) => b.from({ e: emojis }).where(({ e }) => eq(e.subjectId, subject)).orderBy(({ e }) => e.created).select(({ e }) => ({ id: e.id, value: e.value })),
		[subject],
	);
	const { data: mine } = useLiveQuery(
		(b) =>
			b
				.from({ e: emojis })
				.where(({ e }) => and(eq(e.subjectId, subject), eq(e.creatorId, me.id)))
				.orderBy(({ e }) => e.value)
				.select(({ e }) => ({ id: e.id, value: e.value })),
		[subject],
	);
	return (
		<div className="mt-2 flex flex-wrap items-center gap-1">
			{(all ?? []).map((e) => (
				<span key={e.id} className="text-base">
					{e.value}
				</span>
			))}
			{EMOJI.map((v) => (
				<button
					key={v}
					type="button"
					className="rounded-full border border-zinc-200 px-1.5 text-sm opacity-60 hover:opacity-100 hover:border-indigo-400 dark:border-zinc-700"
					title="React"
					onClick={() => {
						const id = `${subject}:${me.id}:${v}`;
						if (emojis.has(id)) persist(emojis.delete(id));
						else persist(emojis.insert({ id, value: v, subjectId: subject, creatorId: me.id, created: 0 }));
					}}
				>
					{v}
				</button>
			))}
			<span className="ml-1 text-xs text-zinc-400">{(mine ?? []).map((e) => e.value).join("")}</span>
		</div>
	);
}

function Comments({ issueId }: { issueId: string }) {
	const [draft, setDraft] = useState("");
	const { data } = useLiveQuery(
		(b) =>
			b
				.from({ c: comments })
				.where(({ c }) => eq(c.issueId, issueId))
				.leftJoin({ u: users }, ({ c, u }) => eq(c.creatorId, u.id))
				.orderBy(({ c }) => c.created)
				.select(({ c, u }) => ({ id: c.id, body: c.body, created: c.created, author: u?.login })),
		[issueId],
	);
	return (
		<>
			<h2 className="mt-8 mb-3 text-lg font-semibold">Comments</h2>
			<ul className="grid gap-3">
				{(data ?? []).map((c) => (
					<li key={c.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
						<div className="mb-1 text-xs">
							<strong>{c.author ?? "?"}</strong>
						</div>
						<div className="whitespace-pre-wrap break-words">{c.body}</div>
						<Reactions subject={c.id} />
					</li>
				))}
			</ul>
			<form
				className="mt-4 grid gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					if (!draft.trim()) return;
					persist(comments.insert({ id: crypto.randomUUID(), issueId, body: draft, creatorId: me.id, created: 0 }));
					setDraft("");
				}}
			>
				<textarea
					className="min-h-20 w-full rounded-lg border border-zinc-300 bg-transparent p-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700"
					placeholder="Leave a comment…"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
				/>
				<button type="submit" className="justify-self-start rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500">
					Comment
				</button>
			</form>
		</>
	);
}

// ---------------------------------------------------------------- app

function App() {
	const path = usePath();
	const m = /^\/(?:bench\/react\/)?issue\/(\d+)/.exec(path);
	return (
		<div className="min-h-screen">
			<header className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
				<Link className="mr-auto font-semibold tracking-tight" to={BASE}>
					fastissuetracker
				</Link>
				<span className="text-zinc-500">react + tanstack db</span>
			</header>
			{m ? <Detail shortId={Number(m[1])} /> : <List />}
		</div>
	);
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
