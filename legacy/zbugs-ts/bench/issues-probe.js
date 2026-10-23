// Two probes, eval'd on /issues?mode=… (preview evaluate has a 15s cap, so
// they're split). LOAD waits for collections; INTERACT drives filters/toggle.
const LOAD = `(async () => {
  const t = performance.now();
  while (!window.__fastcoatMarks && performance.now() - t < 12000) await new Promise(r => setTimeout(r, 25));
  const c = window.__fastcoat.collections;
  const nav = performance.getEntriesByType('navigation')[0];
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  return {
    mode: window.__fastcoat.boot.mode, issues: c.issues.size,
    ttfb: Math.round(nav.responseStart), htmlDone: Math.round(nav.responseEnd),
    fcp: fcp ? Math.round(fcp.startTime) : null, dcl: Math.round(nav.domContentLoadedEventEnd),
    collectionsReady: Math.round(window.__fastcoatMarks.navToReady),
    firstRender: document.getElementById('timing').textContent,
    api: performance.getEntriesByType('resource').filter(r => r.name.includes('/api/')).map(r => r.name.split('/').pop() + ' ' + Math.round(r.duration) + 'ms ' + Math.round(r.encodedBodySize / 1024) + 'KB'),
    heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null,
  };
})()`;

const INTERACT = `(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));
  const c = window.__fastcoat.collections;
  const set = async (id, v, ev = 'change') => {
    const el = document.getElementById(id); const t0 = performance.now();
    el.value = v; el.dispatchEvent(new Event(ev)); await wait(0); await frame();
    return +(performance.now() - t0).toFixed(1);
  };
  const bug = c.labels.toArray.find(l => l.name === 'bug');
  const f = {
    closed: await set('f-open', 'closed'), all: await set('f-open', 'all'), open: await set('f-open', 'open'),
    creator: await set('f-creator', c.users.toArray[3].id), clearCreator: await set('f-creator', ''),
    label: await set('f-label', bug.id), clearLabel: await set('f-label', ''),
    text: await set('f-text', 'join', 'input'), clearText: await set('f-text', '', 'input'),
    sortCreated: await set('f-sort', 'created'), sortModified: await set('f-sort', 'modified'),
  };
  const li = document.querySelector('#issues li'); const id = li.dataset.key;
  const t0 = performance.now();
  li.querySelector('[data-action=toggle]').click(); await wait(0); await frame();
  const toggle = { clickToFrameMs: +(performance.now() - t0).toFixed(1), left: !document.querySelector('#issues li[data-key="' + CSS.escape(id) + '"]') };
  const tx = c.issues.update(id, d => { d.open = true; });
  await tx.isPersisted.promise;
  toggle.restoreRoundTripMs = +(performance.now() - t0).toFixed(1);
  return { filtersMs: f, toggle };
})()`;

if (typeof module !== 'undefined') module.exports = { LOAD, INTERACT };
