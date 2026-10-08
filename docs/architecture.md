<!--
[INPUT]: 现有路由、公开投影与 Workers 交付边界
[OUTPUT]: 模块依赖、同版本部署、分页 SSR 与静态详情契约
[POS]: docs 的交付地图；目录交互归 directory-ui.md
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# Architecture

## Theme

Searchable directory of curated **GitHub projects** with a separate, source-attributed Jev news view about TypeSafe AI’s System One model **[Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)** — typed decisions, SDKs, demos, and integrations.

## Stack

| Layer | Choice |
| --- | --- |
| UI | TanStack Start/Router + Vite + React 19 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn **base-nova** (Base UI primitives under `@/components/ui/*`) |
| Icons | Phosphor (`@phosphor-icons/react`) |
| Search | Fuse.js over `data/github.json` |
| Deploy | TanStack Start prerendered HTML via `@cloudflare/vite-plugin` and Cloudflare Workers Static Assets; Worker handles non-prerendered routes |

Visual tokens and restraint are defined in [design.md](design.md); current page behavior is specified in [directory-ui.md](directory-ui.md).

## Information architecture

```
Sticky header (full viewport, no divider)
  └── Title + GitHub + Submit a project + theme + language
Hero
  └── Full-width ASCII wordmark + tagline under it
Body
  ├── Aside (lg+): project-use categories + separate Jev news entry
  └── Main
        ├── GitHub search (full-width underline, / to focus)
        ├── Sort controls (Stars / Date / Name)
        ├── View toggle (cards / list)
        ├── Filtered GitHub projects or Jev news cards
        └── Footer notice
Mobile
  └── Category nav in a left Sheet (not a floating chip)
```

- **Search** is a full-width underline field over GitHub projects. Category filtering narrows the search results without changing the stored order.
- **Rank** sits under search as a shadcn `ToggleGroup`, not custom underline tabs.
- **Category filter** is a left rail on large screens; below `lg` it opens a shadcn Sheet from the left. The Saved shortcut follows Jev news and reads browser-local bookmarks without a server account.
- **Filtered GitHub projects** remain the primary result set. Jev news has its own static store and card view. Empty results use a localized message.
- An ordinary card or list-row click opens one shared project preview while the URL becomes the project's stable `/projects/:owner/:repo` address. A direct visit or modified click renders a standalone project page; the GitHub URL remains the explicit outbound action.

## Workers auto-deploy

[`wrangler.toml`](../wrangler.toml) targets the existing `awesome-jev-project` Worker. TanStack Start prerenders English, Chinese, and Japanese variants of the homepage, Top 100, ten categories and every valid GitHub project detail into route-specific HTML; Cloudflare keeps detail HTML and static assets asset-first. Directory head loaders receive only total/category counts from getDirectoryCounts, not the browser projection; standalone startup must stay snapshot-free. The homepage, Top 100, category indexes and aggregate news paths use selective Worker-first routing to SSR their validated `page` query. Their build-time first-page HTML remains available for build verification; Static Assets must not override a second-page request with first-page HTML. The Worker handles non-prerendered routes and returns real 404 responses for unknown addresses, invalid categories, missing projects, and missing news IDs. These states reuse `src/components/NotFoundPage.tsx` with route-localized recovery links and noindex metadata. This is not an SPA fallback. Directory indexes use request-specific SSR for pagination; independent detail routes retain static delivery.

The root [`.node-version`](../.node-version) selects Node 24 LTS for GitHub Actions and local builds; `package.json` declares the same supported major. English, Chinese, and Japanese news-item HTML pages are prerendered for stable `/news/{id}` URLs; the aggregate `/news` page prerenders its initial news cards, while browser-local `/saved` remains `noindex` and outside the sitemap.

Trusted GitHub Actions deployment flow (see [deployment.md](deployment.md) for the cutover and recovery procedure):

1. A human push or explicit robot dispatch validates the exact `main` commit.
2. `verify` runs the full existing checks, `npm run build` and zero-skip `test:delivery`, then packages `dist` with its commit SHA.
3. The isolated `production` job restores that run's artifact ID, checks the Worker config and current main SHA, then runs `npx --no-install wrangler deploy --config dist/server/wrangler.json` without rebuilding.
4. After the first verified production deployment, back up non-secret build settings and disconnect this Worker's Cloudflare Git build connection. The Worker, domain and existing deployment remain intact; do not disconnect the account-wide GitHub App.

This reuses a verified build, not incremental compilation. Cloudflare asset upload skips unchanged files. Production HTML, RPC and Worker code remain one artifact. The repository deployment flag stages the migration; a green validation alone does not authorize disabling the old path.

Local:

```bash
npm install
npm run dev      # Vite
npm run build
npm run deploy   # build + wrangler deploy
```

## Key source paths

| Path | Role |
| --- | --- |
| `data/github.json` | Curated GitHub projects, validated before publication |
| `data/news.json` | Separate AIHOT-sourced Jev news snapshot, maintained by the opt-in scheduled Action |
| `src/lib/types.ts` | `DirectoryItem` / `SourceMeta` |
| `src/components/ItemCard.tsx` | GitHub project cards and saved controls |
| `src/components/SavedPanel.tsx` + `src/hooks/useSaved.ts` | Source-grouped local bookmarks and storage lifecycle |
| `src/App.tsx` | Header, GitHub search and category/news/saved navigation |
| `src/routes/*` + `src/router.tsx` | TanStack Start routes, head metadata, directory shell, and direct project/news HTML |
| `src/lib/project-routes.ts` + `src/lib/news.ts` + `src/lib/locale-routes.ts` + `scripts/generate-sitemap.ts` | Stable item identities, language-specific URL variants, and deterministic sitemap generation |

## Route data delivery

TanStack Start owns the generated client/document entry. The root icon link serves `public/favicon.svg`: the user-provided black J path on a transparent background, with its original 9 × 11 viewBox and no font dependency. The obsolete root `index.html` and `src/main.tsx` SPA bootstrap are removed: Vite otherwise serves their stale homepage metadata ahead of the Start runtime during development. Local workbench probes and built delivery therefore inspect the same routing/head pipeline.

`src/lib/catalog.functions.ts` uses the installed TanStack Start `createServerFn` GET boundary. JSON imports remain inside handlers, so the compiler removes them from browser RPC stubs. Project detail loaders return the requested record and at most three related summaries; news detail loaders return only the requested record, and the news index returns the existing news snapshot. During SSR/prerender these functions execute locally; browser navigation calls the same-origin Worker endpoint, without a custom fetch wrapper, external API, or new database. Missing records still become route-level HTTP 404s. The preview loader dynamically imports the GitHub module already loaded by the directory, returning only its title/summary to head metadata without adding an RPC to an otherwise local preview.

`App` and the masked preview share `virtual:directory-catalog`, a Vite build-time whitelist projection of the canonical GitHub snapshot. It preserves every current search/sort/card/preview field, complete inclusion rationale and pinned evidence URL; unused machine scores and audit hashes/links remain in canonical JSON but are not sent to the directory. There is no generated second source of truth, new RPC or preview loading state. Development invalidates both projected and canonical modules across Vite environments when the catalog changes. Standalone server detail reads and prerender path enumeration still use canonical data. Related summaries are selected server-side by same category and shared non-generic topics; no additional full snapshot enters the detail client. That dataset belongs to the directory chunk, not every route's entry. Saved news remains a deferred import on demand. This change reduces unrelated data on detail pages and removes news data from homepage startup; it does **not** remove the GitHub catalog from a fully interactive homepage. Keep RPC deployment and static HTML from the same build. See [performance.md](performance.md) for the report baseline, decisions and verification boundaries.

## Search discoverability

TanStack Start prerenders each finite catalog route in English at its original path, Chinese at `/zh`, and Japanese at `/ja`. A project has one lower-case identity, with one self-canonical URL per language and reciprocal `hreflang` alternates; the original repository title and summary remain untranslated source data. In-app card clicks use TanStack route masking: the browser shows the language-matched public URL while retaining the directory beneath the preview; Back or backdrop dismissal returns to the prior filter, and Forward reopens the preview. A reload or copied URL resolves to that language's standalone HTML. News previews use the same behavior with a stable AIHOT-ID-based `/news/{id}` path; the item page contains the API summary and outbound source links, not the original article. Saved source and category filters stay in validated search state. A synchronous head script redirects unprefixed HTML requests to the stored locale, or, without a saved choice, to `/zh` or `/ja` according to the browser's primary language; an explicit English choice wins over browser language. IP geolocation is not used. The URL determines the server-rendered locale, so the static HTML and first React render match without a language flash. Language switching performs a full navigation to the equivalent static path; it intentionally keeps category/project identity and query state, but does not preserve an open preview's transient background. Three variants triple prerendered page count relative to English alone and should be watched in the main validation job.

`public/robots.txt` permits crawling and points to the generated `public/sitemap.xml`. The generator lists all three language variants of the homepage, Top 100, the prerendered News index, populated categories, projects with non-empty summaries, and source-attributed news items whose stored summaries have at least 60 characters, with reciprocal `hreflang` entries; it rejects invalid/duplicate identities and invents no `lastmod`. Short news notes keep direct HTML but are `noindex`. Search/sort state, browser-local Saved, and transient preview state are not sitemap entries. `public/llms.txt` is a short agent-facing guide, not an indexing directive.

Search Console's 2026-09-20 export is only one day of evidence, not a basis for keyword stuffing or mass-generated thin pages. Verify the rendered homepage with URL Inspection and measure multi-week query trends before changing titles or information architecture.

## Scroll restoration

Scroll restoration uses the installed Router's public callback option. The first client render of the unchanged, non-hash URL preserves a nonzero position already reached while JavaScript was loading; the position is read at render time, not router creation time. This one-shot exception is consumed even if navigation intervened. Subsequent navigation, history restoration and hash behavior retain Router defaults; no second scroll cache or private Router field is introduced.

## Scheduled collection

GitHub Actions runs the server-side ecosystem radar through read-only collection, secret-free validation, and data-only publishing jobs. A second workflow applies a distinct open-source-alternative admission policy with its own candidate state, while sharing the GitHub catalog, README renderer and Jev client. Jev credentials never reach Vite or the browser. Each resulting commit contains directory data, generated README, refreshed sitemap together; deployed runtime OG endpoints read that same snapshot. See [collector.md](collector.md) for setup, admission thresholds, retry behavior, concurrency safety and the disabled-by-default schedules.

The independent [news integration](news.md) uses AIHOT's public API in a separate hourly Action and commits `data/news.json` and the regenerated sitemap when `AIHOT_NEWS_ENABLED=true`. It never spends Jev review quota.

The production build runs `data:check`, including catalog capacity and README validation. The deployment job reuses that verified artifact rather than running a separate build. This is not a branch-protection rule or a semantic/security admission certificate. Validation success proves the snapshot passed checks, not that production deployment completed. Check the deployment job and actual production HTTP separately.

## Search Console report triage (2026-10-01)

The Coverage Drilldown export dated 2026-10-01 contains one example, `http://awesomejev.cc/`, last crawled on 2026-09-22, under “Alternate page with proper canonical tag”. This is not a 404 or an unexpected canonical selection. Both live protocol variants declare `https://awesomejev.cc/` as canonical; the sitemap contains only HTTPS URLs. Leave that canonical and the HTTP exclusion intact. Google's [Page indexing report guidance](https://support.google.com/webmasters/answer/7440203?hl=en) says this classification needs no action. Inspect the HTTPS URL if checking the primary page's indexing status, not the HTTP duplicate.

At the time of the check, HTTP still serves 200. Optional transport hardening belongs at the Cloudflare zone edge via SSL/TLS → Edge Certificates → Always Use HTTPS, not a client-side redirect or a Worker-only guard that static assets can bypass. Enabling it is separate from resolving this non-error report; do not claim it has been enabled without an actual 301 check.

Runtime error-page regression: with a running local or preview server, `TEST_SITE_ORIGIN=http://127.0.0.1:5173 node --test scripts/not-found.test.ts` checks unknown URLs, invalid categories, missing projects and missing news in all three locales, plus healthy homepages. `npm test` skips these HTTP checks unless the origin is supplied.

Core metadata scheduling remains offline in scripts: scalar GraphQL batches first refresh the final Top 100, then up to 1,000 other projects using the published identity cursor. It automatically captures numeric/opaque Node ID baselines and then queries objects by ID, so normal renames require no new manual mapping. Before discovery, both collectors use the same batch reader to anchor remaining legacy rows without changing statistics/cursors; the initial GH CLI cleanup removed duplicate rows, and known IDs exclude new candidates before paid review; this audit identity stays out of the directory browser projection. This does not change browser data flow or author descriptions. All collectors share a latest-main three-way incremental publisher with bounded ordinary-push retries and merged build/delivery validation; core merged publication rechecks the final Top100, never replays paid review. Details and incomplete-Top publication guards are in [collector.md](collector.md).

## Onsite navigation and measurement

Category page names and short purpose descriptions come from the same `CATEGORY_LABEL` / `CATEGORY_DESCRIPTION` message keys as their metadata. A category has one descriptive H1 in its results area; the header brand is not a second H1. Homepage layout and source-authored project titles/summaries are unchanged. Homepage descriptions name Awesome JEV explicitly without stuffing alternate spellings.

Standalone project pages link their recorded category and render at most three same-category projects with at least one shared specific topic. Jev/AI/model/demo and programming-language tags alone do not qualify; Other, missing categories and no-match projects have no recommendation block. A weak-keyed classification/topic index is built once per immutable snapshot; HMR replacements get new indexes. Candidates exclude self/ambiguous duplicate/invalid routes and empty summaries, are ordered by shared-topic count then canonical path, and show the matching topics without implying endorsement or equivalent functionality. Removed duplicate project addresses redirect permanently through the existing detail route; sourceMeta.previousUrls is address history, not another identity registry. The existing modal history/focus contract is not changed by adding these standalone-only links.

`catalog.functions.getProject` returns `{ item, related }`, a canonical redirect target for a recorded old address, or null. `related` contains only title, summary, canonical path and matched topics. The selection remains offline/deterministic, requires no model, service or schema migration and does not expose the full snapshot through the browser RPC stub.

Production Umami records only `github-open`, `project-category-open` and `related-project-open`, with bounded locale/placement/category properties. The tracker is optional and never awaited for navigation; errors do not block actions. Development does not load the Umami script or send these events, so workbench previews cannot pollute production measurements. Searches and local bookmarks are not event payloads.

The supplied brand query sample is `awesome jev` 288, `awesome-jev` 113 and `jev awesome` 28, provisionally interpreted as impressions. Its date range, clicks and average positions were not supplied; it is not a time series, CTR baseline or forecast. The workbench presents the sample with that caveat, not a fabricated trend chart. Use a comparable multi-week GSC/Bing report and production action events to assess outcomes; a successful GitHub exit is not a failed directory visit.

## Unified local workbench

Keep `/{locale?}/og-workbench` as the only tool route. Its URL search state selects `tool=og|seo|preview`, a finite page preset, category, catalog project URL and desktop/mobile width. Unknown tools/presets reset to safe defaults; project selection must resolve in the catalog. There is no arbitrary remote host, production enable flag or second workbench route. One shell supplies navigation, shared project search, language and theme; OG retains its prior HTML/PNG checks and news exclusion.

SEO checks read the actual same-origin server HTML, sitemap and robots.txt through the same cancellable, stream-limited boundary as OG. They report status, content type, title/description/canonical, language alternates, indexing directives, H1 and returned internal links. Saved/noindex and missing/404 are expected exclusions. Unreadable sitemap data is an inspection failure, not a claim that the page is absent. The probe does not execute page scripts, implement a complete robots engine, predict rankings or establish search-engine canonical selection/indexing.

Page preview loads the real same-origin product route in an iframe at 390px or 1280px, with adjacent source-specific change notes and the actual favicon asset linked for inspection. It is a current local preview, not a forged before/after comparison. Desktop overflow is explicit and horizontally scrollable. The workbench does not duplicate product markup or inject preview notes into public pages.

The DEV guard stays in both beforeLoad and loader; production GET/HEAD remain real 404 for every language and tool/query combination. Development-only component references are eliminated from the production route component/head. The workspace has no prerender/sitemap entries and no authentication claims. Tests verify production isolation and public startup boundaries.

Local verification (2026-10-03): real Playwright checks passed all 90 mobile-category geometry cases (three widths, ten categories and three locales), with Grid below 640px and the existing desktop Flex preserved. The actual favicon loaded in the workbench, and canonical-equivalent project URLs selected the correct project. Native CUA was unavailable; browser verification used Playwright instead. Node 24 isolated-candidate typecheck, lint, category/data/news checks and build passed; all 436 tests passed with zero skips against production preview and built client output, plus 38/38 delivery checks, including all 30 same-language old-address redirects. Official GH CLI also refreshed the cleaned catalog's Top100 in memory: 100/100, two GraphQL requests, no canonical writes or paid model calls. No separate manual deployment was performed; local checks do not prove improved impressions, engagement or rankings.

## Open Graph delivery

`/api/og/site` and `/api/og/projects/{owner}/{repo}` generate PNG responses on demand with `@cf-wasm/resvg` 0.4.0 in Workers. There are no per-project PNG files or OG build step. The current published canonical snapshot supplies the full GitHub count and each project's title/summary; this is deployment-snapshot freshness, not a live GitHub lookup. The pure `share-image` identity contract produces version-query URLs shared by route metadata, the workbench and runtime. Count/title/summary changes invalidate the corresponding identity; increment IMAGE_VERSION for template/font/render changes.

`og-service.server` validates catalog membership before cache lookup; arbitrary title, URL and remote image parameters are not accepted. `og-response` normalizes stale/extra query parameters to the current finite version URL, supports HEAD and ETag/304 without rasterization, and keeps unversioned compatibility responses short-lived. Workers Cache stores immutable version keys; PNG rendering executes only on a miss. Missing projects return 404 and render failures return no-store 503 instead of substituting an unrelated or old image. `/og.png` remains a runtime compatibility endpoint. Cache misses still consume Worker CPU/memory; validate the deployed plan and cold-request timing before release.

Licensed fixed Geist/CJK fonts reside in `public/og-fonts` as Static Assets, read through the ASSETS binding rather than external HTTP. CJK fallback is loaded only when SVG text needs it. Neither font bytes nor renderer WASM nor the complete canonical catalog enter browser startup modules; the Worker bundles renderer WASM and releases per-render objects.

Root metadata provides the runtime site image. Standalone and masked project routes override the complete image group together: HTTPS OG image/secure URL/type/dimensions/alt and Twitter large-image card/image/alt, alongside existing canonical, localized title, description and URL fields. Generic pages and news retain the site image; no news-level image generator is introduced. No unverifiable account handles or per-platform metadata are invented.

The three-language `/og-workbench` route is a development-only, non-prerendered tool, excluded from the sitemap. Compile-time `import.meta.env.DEV` gates both beforeLoad and loader; production GET/HEAD requests return real 404s with no workbench data or page head. Query parameters and Host headers cannot enable it. Production preview is intentionally also denied; use `npm run dev -- --host 127.0.0.1` locally. `noindex` is only a local SEO hint, not access control. Public OG PNG endpoints remain available to social crawlers. Its own loader reads only the existing display projection and maps to title/URL/summary; it does not add catalog dependencies to unrelated route entry bundles. The browser-only `og-inspection` boundary reads actual same-origin HTML and PNG bytes on demand, checks required/duplicate tags and current expected image identity, verifies canonical and PNG MIME/dimensions, and exposes raw metadata. It neither executes inspected page scripts nor requests third-party preview services; external social-card caching cannot be guaranteed by these checks.
