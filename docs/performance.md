# PageSpeed delivery audit

This document records the decisions from the [2026-10-01 PageSpeed report](https://pagespeed.web.dev/analysis/https-awesomejev-cc/egl9ige48i). The report contains 159 audits for each device profile, including passed, informative, manual and not-applicable checks. A displayed warning is not automatically a reason to change the architecture or presentation.

## Separate device evidence

| Laboratory metric | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 59 | 99 |
| FCP | 7.4 s | 0.5 s |
| LCP | 7.6 s | 0.5 s |
| TBT | 20 ms | 70 ms |
| CLS | 0 | 0 |
| Speed Index | 7.4 s | 1.0 s |
| `index-dw8DokCM.js` transfer size | 934,831 bytes | 934,469 bytes |
| Same entry's decoded size | 3,829,627 bytes | 3,829,627 bytes |

Accessibility, best practices and SEO score 100 on both profiles. CrUX has insufficient real-user data. The mobile metrics are simulated under slow-4G conditions; do not compare their timings to local unthrottled browser loads, or confuse observed trace LCP with simulated LCP. Both profiles download the same entry, but the transfer measurements and scoring environments remain distinct.

## Cause and changes

The initial HTML contains 21 real project cards and 18 decorative skeletons. CSS previously hid real cards whenever scripting was enabled until `CardMasonry` finished hydration and measurement. One-column screens do not need JavaScript to establish that initial reading layout. Below 40rem, pre-hydration cards now use the same natural single-column flow already used by the no-script fallback. The existing measured virtual window takes over afterward; desktop skeletons, card contents, final styles, ordering, overscan, animations and interactions are retained.

The entry also depended on complete project/news snapshots through eager route loaders. Standalone project/news loaders now use TanStack Start's existing `createServerFn` GET boundary and return only the requested record. The news index uses the same boundary for its existing snapshot. The preview loader dynamically imports the project module already available to the directory, rather than adding a network call to a local preview. See [architecture.md](architecture.md#route-data-delivery). This follows the [server-function documentation](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions) and the installed 1.168.58 exports; no framework upgrade or custom request layer is introduced.

Mounted card heights are read into a batch before virtual-size updates, instead of alternating each read with an update. Pre-ready rendering pins the SSR prefix and preserves actual scrolling; Virtualizer size compensation is disabled only during that natural-flow stage and restored in the same ready handoff. Router's public restoration callback also skips its first top reset only for an unchanged, non-hash URL that has already been scrolled; all later navigation uses the default restoration behavior. Both boundaries are needed to preserve reading begun before hydration. The category Sheet trigger's accessible name now includes its visible localized filter label. Neither changes final visual content.

## Warning disposition

| Report finding | Evidence and decision |
| --- | --- |
| Render-blocking CSS | Mobile estimates 450 ms; the two CSS requests transfer about 28 KiB. Retain the render-critical theme/layout CSS: loading it asynchronously risks unstyled content and shifts. [Google cautions that CSS inlining is an advanced technique with bug risk](https://developer.chrome.com/docs/performance/insights/render-blocking). No duplicate critical-CSS system is added. |
| Unused JS: 99 KiB | Entry, `useSaved` and `ThemeMenu` contain unused-at-load code. Remove unrelated snapshot dependencies, not functionality: initial coverage does not prove menu, saved or preview code is dead. Framework/component code splitting already exists. |
| Forced reflow: about 33.5 ms on mobile | Sources include the directory measurement loop and ThemeMenu/Base UI. Batch our height reads; leave third-party focus/menu behavior intact. The change is not a claim that all reflow disappears. |
| Main-thread work: 2.0 s mobile / 1.0 s desktop | Snapshot isolation reduces unnecessary parsing on detail routes; the interactive directory still needs its full local display/search data. Reprofile before further tuning. |
| Long tasks: 9 mobile / 3 desktop | Diagnostic, not a distinct proven bug. Do not remove required interactions merely to reduce a count. TBT is already low. |
| Non-composited animations: 81 mobile / 127 desktop | The supplied rows identify `visibility` transitions on descendants when cards are exposed. Keeping narrow cards visible removes that initial hidden-to-visible transition there. Badge, Button and Toggle also replace `transition-all` with the installed Tailwind standard `transition` utility, which excludes inherited `visibility` while preserving color, focus-ring, opacity and press translation feedback. Existing decorative border/brand animations are not redesigned or removed. Recheck the count after deployment. |
| Network dependency tree | Longest reported chain includes Umami's `api/send`; estimated LCP savings are zero and no preconnect candidate is recommended. Do not add speculative preconnects or attribute LCP to that request without trace evidence. Fonts are same-origin; `font-display` passes. |
| Cache lifetime: 4 KiB | The flagged file is the Cloudflare Insights beacon with a third-party one-day TTL. First-party cache headers are not the offender; do not invent a broad caching fix. |
| Legacy JS: 11 KiB | Also the Cloudflare Insights beacon (`Array.at`/`findLast` polyfill signals), not our Vite build target. Do not reduce browser support or patch vendor code for it. |
| Label/name mismatch, experimental | Category trigger was a real mismatch and is corrected according to [WCAG label-in-name guidance](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html). The brand has a matching fixed accessible label and hidden upstream animated copies; it remains unchanged rather than redesigning the brand to satisfy an experimental check. |
| Missing source map | Diagnostic on the large first-party entry, not a page-speed saving. Public source-map publication is not added to eliminate a warning; debugging artifacts can be considered separately. |
| CSP, HSTS, COOP, XFO, Trusted Types | Informative security guidance rather than measured performance failures. Do not introduce headers that can break Start's inline bootstrap or change origin behavior as part of this optimization. |
| DOM, payload, compression/minification, images, fonts, status/canonical/hreflang, crawlability, console errors and regular accessibility checks | Passing or not applicable. Preserve the existing bounded DOM, source data, SEO and visual design. |
| Manual accessibility/structured-data checks | Manual checks are not proof of compliance. Preview open/close and focus restoration, narrow navigation and news navigation are checked in the local browser; a full assistive-technology audit remains separate. |

## Verification and measurement boundaries

`scripts/page-delivery.test.ts` follows the HTML's preloaded JS and static module imports. It checks that the shared entry and standalone detail startup cannot carry either full snapshot, while the homepage still carries projects for local search and does not preload news data. It also checks detail reading content, canonical/status and initial card HTML. The exclusion assertion is tested against real snapshots, not only an always-passing negative case. Against the original build, all four build-dependent tests fail; against the optimized build they pass.

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:delivery
```

`test:delivery` runs after the build, owns an ephemeral-port Vite preview, supplies both verification variables and rejects failed, empty or skipped test runs. It cleans up its own service/test process groups on success, failure, timeout, SIGINT and SIGTERM without stopping another local preview. CI runs this same command in both radar verification jobs, both alternatives verification jobs and news verification. The existing `not-found.test.ts` covers all three languages and healthy homepages. Lint currently reports existing warnings, not errors; these are not swept into unrelated refactoring.

The previous delivery change retained in baseline `2d292cc` completed local verification with 222 tests passing and none skipped when both verification environment variables were set, successful typechecking and 7,290 prerendered pages. The subsequent reliability review's final verification is recorded in [reliability-review.md](reliability-review.md#session-verification). The masonry regression tests also exercise the installed Virtualizer's internal offset, not just DOM scroll requests. These validate delivery and behavior, not production performance scores.

Native Safari verification at a 402px responsive viewport confirms that removing only the app module script (not disabling browser scripting) exposes cards in the optimized HTML but only skeletons in the original HTML. The actual preview site displays the regular one-column cards and opens/closes project previews with focus returning to the trigger. Wider views keep the three-column layout. Browser navigation to the news index exercises the Start data endpoint successfully. A temporary fixture delays only the app module for 25 seconds: reading begun before hydration stays on the same card after the natural-flow/virtual-window handoff. These are functional checks, not new Lighthouse scores or a quantitative CLS trace.

Separately, narrow category-Sheet navigation followed by Back returns to the page top in both immediate-startup and delayed-startup checks. This audit does not claim to fix that existing Sheet/history interaction, and does not introduce a second restoration cache for it.

The following table is the previous delivery change retained in baseline `2d292cc`, not the new display-projection measurement.

| Built first-party JS scope | Before, gzip estimate | After, gzip estimate |
| --- | ---: | ---: |
| Homepage preloaded module set | 1,235,087 bytes | 1,178,744 bytes |
| `/projects/browser-use/jev-ultrafast` preloaded module set | 1,197,540 bytes | 234,757 bytes |
| `/news/cmue78fh50prkrogh123f0smh` preloaded module set | 1,190,712 bytes | 227,945 bytes |
| Shared entry only | 1,011,047 bytes | 109,892 bytes |

Local gzip comparisons measure build bytes, **not Cloudflare's actual on-wire compression or either device's elapsed time**. Compare complete preloaded module sets, not just the much smaller entry. In that previous change the homepage still downloaded the rich project snapshot, while standalone detail pages stopped downloading all projects. The subsequent display projection removes unused directory audit data without changing synchronous local interactions. Deploy static HTML and Worker RPC handlers from the same build, then rerun both PageSpeed profiles to measure FCP/LCP, CLS and reflow. Local validation alone does not prove deployment or a new production score.

## Subsequent directory projection (external review R5)

After all 506 verified rationale additions and integration of upstream statistics from `65f2131`, the 2,199-record canonical JSON is 5,047,586 bytes on disk. Its minified payload measures 3,963,970 bytes / 1,073,038 bytes gzip level 9; the build-time display projection is 3,113,216 / 892,497 bytes, a 180,541-byte (16.8%) gzip reduction for this same final dataset. These are combined payload measurements, not a sum of independently compressed field savings. Full localized inclusion records, their validation inputs and every current card/search/sort/preview field remain. Rich hashes/scores/receipts remain in the sole canonical store and server detail reads.

The final built homepage preloaded/static-import closure measures 3,838,585 decoded bytes / 1,161,580 bytes gzip level 9; project and news detail closures measure 235,753 and 228,811 bytes gzip respectively. Closure gzip totals sum individually compressed modules. The additional rationale text grows the directory payload; comparing its gross bytes with a smaller historical dataset would not isolate an optimization benefit. The startup audit exclusion test fails against the retained pre-projection build and passes against the projected build. Exact per-field/search/sort tests and cross-environment Vite invalidation checks complement the built-module guard. This is not a new production transfer measurement, mobile/desktop PageSpeed result or claim that the homepage no longer loads its local project dataset.
