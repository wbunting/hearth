// Evaluate after navigating to /issues. Use a fresh origin per concurrent
// worktree (cookies and browser storage are not isolated by localhost ports).
// Cold: delete indexedDB database hearth-sync-v1, then reload.
// Warm: reload without deleting storage. Keep SIMULATED_RTT_MS=50.
// Marks are navigation-relative; 'restored' is complete local availability,
// 'synced' includes server validation. Long tasks are >=50ms browser tasks.
(async () => {
  const long = [];
  const observer = new PerformanceObserver(list => {
    long.push(...list.getEntries().map(entry => ({ start: entry.startTime, duration: entry.duration })));
  });
  observer.observe({ type: 'longtask', buffered: true });
  const start = performance.now();
  while (!window.__hearthBackfilled && performance.now() - start < 15000) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  await new Promise(resolve => setTimeout(resolve, 20));
  observer.disconnect();
  const loads = performance.getEntriesByType('resource').filter(r => r.name.includes('/load'));
  return {
    fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
    full: window.__hearthBackfilled,
    marks: performance.getEntriesByType('mark').filter(m => m.name.startsWith('hearth:')).map(m => ({ name: m.name, ms: m.startTime })),
    rows: [...window.__hearth.db.tables].map(([name, table]) => ({ name, count: table.size })),
    loads: loads.map(r => ({ path: new URL(r.name).pathname, since: new URL(r.name).searchParams.has('since'), bytes: r.transferSize, decoded: r.decodedBodySize })),
    bytes: loads.reduce((sum, r) => sum + r.transferSize, 0),
    longTasks: long,
    errors: window.__hearthErrors ?? [],
  };
})()
