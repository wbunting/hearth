// Drives the planner UI once hydration is ready and reports the outcome to
// the embedded server's /_local/diag log. Runs only with HEARTH_TAURI_SMOKE=1.
addEventListener("load", () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const report = (o) =>
    fetch("/_local/diag", { method: "POST", body: JSON.stringify({ smoke: o }) });
  (async () => {
    for (let i = 0; i < 100 && !performance.getEntriesByName("hearth:ready").length; i++) await wait(20);
    await wait(300);
    const titles = () => [...document.querySelectorAll(".task .title")].map((e) => e.textContent.trim());
    const before = titles();
    const input = document.querySelector("input[aria-label='New task']");
    const title = "Written in the desktop app " + new Date().toISOString().slice(11, 19);
    input.value = title;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const t0 = performance.now();
    input.form.requestSubmit();
    await new Promise((r) => requestAnimationFrame(() => r()));
    const optimistic = titles().includes(title);
    const optimisticMs = Math.round(performance.now() - t0);
    const review = [...document.querySelectorAll(".task")].find((li) => li.textContent.includes("Review the sync design"));
    review?.querySelector(".check").click();
    await wait(800);
    report({ before, after: titles(), optimistic, optimisticMs, csp: window.__cspViolations, errors: window.__hearthErrors || [] });
  })();
});
