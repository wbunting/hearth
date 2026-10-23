// Keyed list renderer driven by an ordered TanStack DB live query.
//
// This is the piece Topcoat lacks (its `for` is server-only). It's
// deliberately small and generic: P3 will drive it from a Rust `for_live`
// template instead of handwritten `create`/`update` callbacks.
//
// Strategy: the live query collection maintains order incrementally; on each
// change batch we read its ordered array (`toArray`, already sorted and
// limited) and reconcile DOM by key, reusing nodes and moving only those
// out of place. Rows already rendered by the server (`data-key`) are adopted.

export type RowRenderer<T> = {
  key: (row: T) => string;
  create: (row: T) => HTMLElement;
  update: (el: HTMLElement, row: T, prev: T | undefined) => void;
};

type Source<T> = {
  readonly toArray: T[];
  subscribeChanges: (cb: () => void) => { unsubscribe: () => void };
  isReady: () => boolean;
  onFirstReady: (cb: () => void) => void;
};

export function mountKeyedList<T>(
  container: HTMLElement,
  source: Source<T>,
  renderer: RowRenderer<T>,
  onRender?: (info: { rows: number; ms: number; changed: number }) => void,
): () => void {
  const nodes = new Map<string, { el: HTMLElement; row: T | undefined }>();
  for (const el of Array.from(container.children) as HTMLElement[]) {
    const k = el.dataset.key;
    if (k) nodes.set(k, { el, row: undefined });
    else el.remove();
  }

  let scheduled = false;
  const reconcile = () => {
    scheduled = false;
    // Never replace server-rendered rows with a not-yet-loaded empty result.
    if (!source.isReady()) return;
    const t0 = performance.now();
    const rows = source.toArray;
    const seen = new Set<string>();
    let changed = 0;
    let cursor: ChildNode | null = container.firstChild;
    for (const row of rows) {
      const k = renderer.key(row);
      seen.add(k);
      let entry = nodes.get(k);
      if (!entry) {
        entry = { el: renderer.create(row), row: undefined };
        entry.el.dataset.key = k;
        nodes.set(k, entry);
      }
      if (entry.row !== row) {
        renderer.update(entry.el, row, entry.row);
        entry.row = row;
        changed++;
      }
      if (entry.el !== cursor) {
        container.insertBefore(entry.el, cursor);
        changed++;
      } else cursor = cursor.nextSibling;
    }
    for (const [k, entry] of nodes) {
      if (!seen.has(k)) {
        entry.el.remove();
        nodes.delete(k);
        changed++;
      }
    }
    onRender?.({ rows: rows.length, ms: performance.now() - t0, changed });
  };

  // Coalesce change bursts (e.g. a refetch writing 50k rows) into one pass
  // per microtask; TanStack emits synchronously per transaction.
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(reconcile);
  };

  const sub = source.subscribeChanges(schedule);
  source.onFirstReady(schedule);
  reconcile();
  return () => sub.unsubscribe();
}
