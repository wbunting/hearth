# Strict CSP

Hearth pages can use `default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'`. They do not need an eval exception, an inline style exception, or a script nonce. Set `HEARTH_STRICT_CSP=1` on the tracker to send this policy and load a small external violation recorder before the runtime. Inspect `window.__cspViolations` after using the page. The runtime records `topcoat:ready` when initial hydration and navigation listeners are installed.

## Expression delivery

The Rust expression compiler still produces JavaScript. `Js::to_client()` separates the trusted source from every `JsBuilder::surrogate` capture. A capture becomes a positional read from the function's capture array. The server registers the source under its SHA-256 digest and embeds `#<digest>:<JSON captures>` in the escaped comment or attribute. Captured values are not part of the module, its URL, or its cache key. Two users with the same expression code share code but not capture data.

The runtime router installs `/_topcoat/expressions.js?ids=<digests>`. It serves an ES module containing ordinary functions for up to 32 registered digests. Unknown digests and malformed requests return 404. The endpoint accepts no source or capture data and sets JavaScript content type, nosniff, and an immutable cache policy. Generated source is application code, not a sandbox. Never interpolate user input through `Js::source` or `JsBuilder::source`. Use surrogate captures instead.

The browser scans runtime metadata in the initial document, including nested template contents. It imports missing functions before synchronous hydration. It ignores reference-shaped user text and strings inside captured data. Per-list `@N` entries still resolve through the owning list's table; the table now contains function references and captures rather than executable source. No eval fallback exists in the production runtime.

Navigation, HTTP shard snapshots, and live swap frames load their missing functions before applying content. They recheck cancellation after loading. Connected renders queue imports and frames per run so a later swap cannot overtake its snapshot. Independent shards remain independent. Idle-prebuilt details import all their functions during initial loading, so local navigation does not wait for code requests.

This is render-time registration, not a build-time manifest. It handles dynamic shards without changing the asset bundler or procedural expression compiler. The tradeoff is one or more same-origin module requests on cold boot. The registry is process-local and retains distinct trusted function sources for the process lifetime. Deployments with several server processes need sticky routing for document/shard and module requests, or must warm the same expression set in every process. A deployment must not reuse cached HTML referencing modules absent from its running process. Tracker HTML is no-store. A build-time source manifest is a possible follow-up for stateless multi-process deployment.

## Styles and scope

The tracker and baseline have no style attributes in server HTML and no inline style elements. The two `hearth-when` display writes use `wrapper.style.display`. These property writes are allowed under CSP, even though DevTools serializes them as a style attribute. They stay CSSOM property writes. There are no `setAttribute("style", ...)` or `cssText` writes in these flows. Application-authored `style=` and `:style=` attributes are not made CSP-safe by this feature; use classes or individual CSSOM properties.

The policy is tested on the tracker and `/bench/topcoat`. The React comparison page has an application-owned inline bootstrap script and is not covered. Upstream Topcoat's raw HTML streaming delivery also emits inline swap and redirect scripts. These pages do not use that delivery path for updates: runtime requests use JSON frames. Strict CSP for arbitrary raw HTML live streams and the development refresh client is separate work.

## Verification

The browser checks used the release tracker with 50,000 synthetic issues at `http://t3402.localhost:3402`. The synchronous external recorder observed **zero securitypolicyviolation events** from document load through tracker filters, search, detail navigation, and through baseline shard filters and page navigation. List status, creator and assignee filters, labels, reactions, comments, and persisted writes were exercised. A delayed mutation showed the optimistic issue state before release; a forced 500 restored the prior state and showed the rollback toast. Saved issue, label, reaction and comment rows were read back through the real load endpoints. Idle warming created both region wrappers; repeated detail navigation reused the prepared content.

Rust tests cover capture separation, stable code identity, registry-only serving, and malformed requests. Browser tests exercise production reference loading with Function disabled, context/capture independence, list references, nested templates, reference-shaped user text, and new response/swap hydration. Older hand-written source fixtures use a test-only mock compiler. The coherence runner also compiles source for testing; neither compiler is in the production browser entry point.

### Local benchmark

The measurements below use `benchmarks/localfirst/probe.js` FILTER (six transitions) and NAV (four list/detail cycles). Values are medians in milliseconds. These are small local samples in the preview browser, not a claim of a statistically significant speedup. Cache and scheduling differ across runs.

| Page | Metric | Before | Strict CSP |
| --- | --- | ---: | ---: |
| Tracker | filter to paint | 33.5 | 31.8 |
| Tracker | detail to paint | 30.0 | 31.4 |
| Tracker | list to paint | 42.4 | 33.2 |
| Baseline | filter to paint | 52.7 | 39.3 |
| Baseline | detail to paint | 32.1 | 31.3 |
| Baseline | list to paint | 50.2 | 50.5 |
| Tracker | TTFB / FCP | 56 / 108 | 15 / 68 |
| Baseline | TTFB / FCP | 21 / 96 | 8 / 48 |

The baseline LOAD probe was invoked after navigation, so its rowsVisible value measured the observer's start time, not boot time. It is not reported as a boot benchmark. Initial DOMContentLoaded on the tracker was 68 ms before and 34 ms after. The added ready mark measured 77 ms for tracker hydration/listener setup and 31 ms for the baseline. There is no equivalent ready mark in the before build, so a direct before/after hydration-time comparison is not available.

Before rebasing other parallel changes, decoded runtime size was 80,553 bytes before and 82,618 bytes after (+2,065). Tracker expression modules added 9,510 decoded bytes (3,635 transferred with response headers in the observed cold request); the initial baseline module added 656 decoded bytes. The baseline loads further expressions on detail navigation. Module requests are cached and deduplicated in the page. The shared persistence module is unchanged at 4,221 bytes. The probe's original jsKB predicate excludes query-string module URLs, so module bytes were counted separately from Resource Timing rather than silently omitted.
