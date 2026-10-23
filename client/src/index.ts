// fastcoat browser entry. Loaded as a module after Topcoat's runtime.
import { createCollections } from "./collections";
import { mountIssues } from "./apps/issues";
import type { Boot } from "./schema";

const t0 = performance.now();
const bootEl = document.getElementById("fastcoat-boot");
if (bootEl) {
  const boot = JSON.parse(bootEl.textContent!) as Boot;
  const collections = createCollections(boot);
  const marks: Record<string, number> = { parsed: performance.now() - t0 };
  Promise.all([
    collections.issues.preload(),
    collections.users.preload(),
    collections.labels.preload(),
    collections.issueLabels.preload(),
  ]).then(() => {
    marks.ready = performance.now() - t0;
    (window as any).__fastcoatMarks = { ...marks, navToReady: performance.now() };
  });
  if (document.getElementById("issues")) mountIssues(collections, boot);
}
