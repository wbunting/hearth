// In-page probes for the local-first comparison. Each is an expression to
// evaluate on the app's list page after navigation. All three apps (hearth,
// plain Topcoat, React + TanStack DB) are served by the same server against the
// same 50,516-issue database. Run in a *visible* tab (rAF is throttled otherwise).
//
// LOAD: navigation timing + "first rows visible" + "interactive" (rows present
//       and handlers bound) + JS transferred.
// FILTER: change open→closed→open; time from change event to rows updated + next frame.
// TYPE: per-keystroke input→next-paint and keystroke→results-correct while typing.
// NAV: list → detail → list, click to next frame with the right content.

const LOAD = `(async () => {
  const w = ms => new Promise(r => setTimeout(r, ms));
  const rows = () => document.querySelectorAll('ul > li').length;
  const t0 = performance.now(); while (rows() < 50 && performance.now() - t0 < 15000) await w(5);
  const rowsAt = performance.now();
  const nav = performance.getEntriesByType('navigation')[0];
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  const js = performance.getEntriesByType('resource').filter(r => r.name.endsWith('.js')).reduce((a, r) => a + r.transferSize, 0);
  return { ttfb: Math.round(nav.responseStart), fcp: fcp ? Math.round(fcp.startTime) : null, rowsVisible: Math.round(rowsAt), jsKB: Math.round(js / 1024), htmlKB: Math.round(nav.transferSize / 1024), heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null };
})()`;

const FILTER = `(async () => {
  const w = ms => new Promise(r => setTimeout(r, ms)); const fr = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const sel = document.querySelector('select');
  const first = () => document.querySelector('ul > li')?.textContent;
  const out = [];
  for (const v of ['closed', 'open', 'closed', 'open', 'closed', 'open']) {
    const before = first(); const t0 = performance.now();
    sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true }));
    while (first() === before && performance.now() - t0 < 5000) await w(1);
    await fr(); out.push(+(performance.now() - t0).toFixed(1));
    await w(150);
  }
  return out;
})()`;

const NAV = (detailSel = "article h1", samples = 16) => `(async () => {
  const w = ms => new Promise(r => setTimeout(r, ms)); const fr = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const out = [], back = [], ready = [];
  for (let n = 0; n < ${samples}; n++) {
    const links = [...document.querySelectorAll('ul > li a')].filter(x => x.textContent.trim().length > 12 && x.getAttribute('href')?.includes('issue'));
    const a = links[(n * 2 + 1) % links.length];
    const title = a.textContent.trim(); const t0 = performance.now(); a.click();
    while ((document.querySelector('${detailSel}')?.textContent.trim() !== title || document.querySelectorAll('article details button').length !== 30 || !document.querySelector('article button[title="React"]')) && performance.now() - t0 < 5000) await w(1);
    if (performance.now() - t0 >= 5000) throw new Error("detail readiness timed out");
    ready.push(+(performance.now() - t0).toFixed(1));
    await fr(); out.push(+(performance.now() - t0).toFixed(1));
    const t1 = performance.now(); const back_ = document.querySelector('a[href$="issues"], a[href="/bench/react"]'); back_ ? back_.click() : history.back();
    while ((!document.querySelector('ul > li a') || document.querySelector('hearth-when:has(> ul)')?.style.display === "none") && performance.now() - t1 < 5000) await w(1);
    await fr(); back.push(+(performance.now() - t1).toFixed(1));
    await w(100);
  }
  return { toDetail: out, toList: back, ready, firstNavigation: out[0] };
})()`;

if (typeof module !== 'undefined') module.exports = { LOAD, FILTER, NAV };
