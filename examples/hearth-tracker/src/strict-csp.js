// Loaded synchronously before the runtime when HEARTH_STRICT_CSP=1.
window.__cspViolations = [];
document.addEventListener("securitypolicyviolation", (event) => {
  window.__cspViolations.push({ directive: event.violatedDirective, blocked: event.blockedURI });
});
