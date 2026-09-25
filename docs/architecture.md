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
  └── Title + GitHub + theme + language
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

[`wrangler.toml`](../wrangler.toml) targets the existing `awesome-jev-project` Worker. TanStack Start prerenders English and Chinese variants of the homepage, Top 100, nine categories and every valid GitHub project detail into route-specific HTML; Cloudflare serves those files as Static Assets before invoking the Worker. The Worker handles non-prerendered routes and returns real 404 responses for unknown projects. This is not an SPA fallback or per-request SSR for the catalog.

The root [`.node-version`](../.node-version) selects Node 24 LTS for GitHub Actions and Cloudflare Workers Builds; `package.json` declares the same supported major. English and Chinese news-item HTML pages are prerendered for stable `/news/{id}` URLs; the aggregate `/news` page prerenders its initial news cards, while browser-local `/saved` remains `noindex` and outside the sitemap.

Typical Git-connected Workers Builds flow:

1. Push to `main`
2. `npm run build` validates news, generates the sitemap/OG image, prerenders catalog HTML and builds the client/server bundles with TypeScript checks → `dist/`
3. `npx wrangler deploy`

Every data commit triggers a full application build; it is not incremental compilation. Cloudflare's asset upload can skip unchanged files. Keep the current finite catalog as static HTML, and measure actual Workers Builds time before adding a more complex incremental publishing system.

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

## Search discoverability

TanStack Start prerenders each finite catalog route in English at its original path and Chinese at `/zh` plus that path. A project has one lower-case identity, with one self-canonical URL per language and reciprocal `hreflang` alternates; the original repository title and summary remain untranslated source data. In-app card clicks use TanStack route masking: the browser shows the language-matched public URL while retaining the directory beneath the preview; Back or backdrop dismissal returns to the prior filter, and Forward reopens the preview. A reload or copied URL resolves to that language's standalone HTML. News previews use the same behavior with a stable AIHOT-ID-based `/news/{id}` path; the item page contains the API summary and outbound source links, not the original article. Saved source and category filters stay in validated search state. A synchronous head script redirects unprefixed HTML requests to `/zh` before body parsing when the reader previously chose Chinese, or when a new visitor's primary browser language is Chinese; an explicit English choice wins over browser language. IP geolocation is not used. The URL determines the server-rendered locale, so the static HTML and first React render match without an English-to-Chinese flash. Language switching performs a full navigation to the equivalent static path; it intentionally keeps category/project identity and query state, but does not preserve an open preview's transient background. This doubles prerendered page count and should be watched in Workers Builds.

`public/robots.txt` permits crawling and points to the generated `public/sitemap.xml`. The generator lists both language variants of the homepage, Top 100, the prerendered News index, populated categories, projects with non-empty summaries, and source-attributed news items whose stored summaries have at least 60 characters, with reciprocal `hreflang` entries; it rejects invalid/duplicate identities and invents no `lastmod`. Short news notes keep direct HTML but are `noindex`. Search/sort state, browser-local Saved, and transient preview state are not sitemap entries. `public/llms.txt` is a short agent-facing guide, not an indexing directive.

Search Console's 2026-09-20 export is only one day of evidence, not a basis for keyword stuffing or mass-generated thin pages. Verify the rendered homepage with URL Inspection and measure multi-week query trends before changing titles or information architecture.

## Scheduled collection

GitHub Actions runs the server-side ecosystem radar through read-only collection, secret-free validation, and data-only publishing jobs. A second workflow applies a distinct open-source-alternative admission policy with its own candidate state, while sharing the GitHub catalog, README renderer and Jev client. Jev credentials never reach Vite or the browser. Each resulting commit contains directory data, generated README, refreshed sitemap and count-aware Open Graph image together. See [collector.md](collector.md) for setup, admission thresholds, retry behavior, concurrency safety and the disabled-by-default schedules.

The independent [news integration](news.md) uses AIHOT's public API in a separate hourly Action and commits `data/news.json` and the regenerated sitemap when `AIHOT_NEWS_ENABLED=true`. It never spends Jev review quota.

An Actions success proves the snapshot passed validation, not that the Cloudflare deployment completed. Check Workers Builds separately after a published data commit.
