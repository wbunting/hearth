// Diagnostics for the experiment. Loaded before the runtime; reports to the
// embedded server, which logs to stderr. Not part of the app's behavior.
window.__cspViolations = [];
document.addEventListener("securitypolicyviolation", (e) => {
  window.__cspViolations.push({ directive: e.violatedDirective, blocked: e.blockedURI });
});

async function report() {
  const marks = {};
  for (const m of performance.getEntriesByType("mark")) marks[m.name] = Math.round(m.startTime);
  const nav = performance.getEntriesByType("navigation")[0];
  let idb = "unknown";
  try {
    const dbs = indexedDB.databases ? await indexedDB.databases() : [];
    idb = "ok:" + dbs.map((d) => d.name).join(",");
  } catch (e) {
    idb = "error:" + e;
  }
  const body = JSON.stringify({
    origin: location.origin,
    href: location.href,
    ua: navigator.userAgent,
    marks,
    domInteractive: nav ? Math.round(nav.domInteractive) : null,
    loadEnd: nav ? Math.round(nav.loadEventEnd) : null,
    csp: window.__cspViolations,
    errors: window.__hearthErrors || [],
    tasks: document.querySelectorAll(".task").length,
    idb,
  });
  try {
    await fetch("/_local/diag", { method: "POST", body, headers: { "content-type": "application/json" } });
  } catch (e) {
    console.error("diag", e);
  }
}

addEventListener("load", () => setTimeout(report, 1500));
