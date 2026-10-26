// hearth browser entry. Loaded as a module after Hearth's runtime.
import { mountApp } from "./apps/issues";
import { AuthError, createStore } from "./runtime";
import type { Boot } from "./schema";

const t0 = performance.now();
const bootEl = document.getElementById("hearth-boot");
if (bootEl) {
  const boot = JSON.parse(bootEl.textContent!) as Boot;
  // Collections are ready immediately from the first-view snapshot (ssr) or
  // after the first full load (local). Either way, backfill full tables next.
  const store = createStore(boot.schema, boot.scope, boot.snapshot);
  try {
    mountApp(store, boot);
  } catch (e) {
    (window as any).__hearthError = String((e as Error)?.stack ?? e);
    throw e;
  }
  const marks: Record<string, number> = { mounted: performance.now() - t0 };
  const hasSnapshot = Object.keys(boot.snapshot).length > 0;
  const ready = Promise.all(boot.schema.collections.map((c) => store.get(c.name).toArrayWhenReady()));
  ready
    .then(() => {
      marks.firstViewReady = performance.now();
      return hasSnapshot ? store.refreshAll() : undefined;
    })
    .then(() => {
      marks.fullyLoaded = performance.now();
      (window as any).__hearthMarks = { ...marks, navToReady: marks.fullyLoaded };
    })
    .catch((e) => {
      if (e instanceof AuthError) location.href = "/login";
      else console.error("[hearth]", e);
    });
}
