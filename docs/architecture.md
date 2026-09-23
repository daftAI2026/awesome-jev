# Architecture

## Theme

Searchable directory of curated **GitHub projects**, **X posts**, and **YouTube videos** about TypeSafe AI’s System One model **[Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)** — typed decisions, SDKs, demos, and integrations.

## Stack

| Layer | Choice |
| --- | --- |
| UI | Vite + React 19 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn **base-nova** (Base UI primitives under `@/components/ui/*`) |
| Icons | Phosphor (`@phosphor-icons/react`) |
| Search | Fuse.js over `data/github.json` + `data/youtube.json` + `data/x.json` |
| Deploy | Cloudflare Workers static assets (`wrangler.toml` → `./dist`, SPA `not_found_handling`) |

Design stays monochrome / restrained: no decorative gradients. See [design.md](design.md).

## Information architecture

```
Sticky header (full viewport, no divider)
  └── Title + GitHub + language
Hero
  └── Full-width ASCII wordmark + tagline under it
Body
  ├── Aside (lg+): source nav — GitHub / X / YouTube
  └── Main
        ├── Search (GitHub only; full-width underline, / to focus)
        ├── Rank tabs (Stars / Date / Name, or Date / Likes / Views)
        ├── GitHub view toggle (cards / list)
        ├── Section boards
        └── Footer notice
Mobile
  └── Source nav in a left Sheet (not a floating chip)
```

- **Search** is a full-width underline field on the GitHub board only. Fuse.js (`src/lib/search.ts`) does not filter X or YouTube.
- **Rank** sits under search as a shadcn `ToggleGroup`, not custom underline tabs.
- **Source filter** is a left rail on large screens; below `lg` it opens a shadcn Sheet from the left.
- **Section boards** are type-scoped lists (`github` / `x` / `youtube`). YouTube only appears when the directory has videos. Empty sections show “No items yet.”
- Cards link out (`target="_blank"`) to the original GitHub repo or X post — this site does not host media.

## Workers auto-deploy

[`wrangler.toml`](../wrangler.toml) serves the Vite build as Workers **assets** with SPA fallback.

Typical Git-connected Workers Builds flow:

1. Push to `main`
2. `npm run build` (`tsc -b && vite build`) → `dist/`
3. `npx wrangler deploy`

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
| `data/github.json` + `data/youtube.json` | Separate GitHub and YouTube stores, type-checked at validation |
| `data/x.json` | X posts (no tags; links parsed in the card) |
| `src/lib/types.ts` | `DirectoryItem` / `SourceMeta` |
| `src/components/ItemCard.tsx` | GitHub + X card UIs |
| `src/App.tsx` | Header, search, section boards |

## Search discoverability

The Vite build renders the existing React homepage into `dist/index.html` after bundling. Google and other crawlers receive the real directory HTML immediately instead of an empty `#root`; React hydrates the same markup for visitors. The server snapshot starts in English, then the browser restores a saved or preferred Chinese locale after hydration. Locale-dependent number formatting and title ordering use explicit locales so the first browser render agrees with the static HTML. This does **not** manufacture separate pages for each listing: the site's only canonical URL and sitemap entry remain the homepage.

Search Console's 2026-09-20 export is only one day of evidence, not a basis for keyword stuffing or mass-generated thin pages. Verify the rendered homepage with URL Inspection and measure multi-week query trends before changing titles or information architecture.

## Scheduled collection

GitHub Actions runs the server-side radar through read-only collection, secret-free validation, and data-only publishing jobs. Jev credentials never reach Vite or the browser. The resulting commit contains directory data and generated README together. See [collector.md](collector.md) for setup, admission thresholds, retry behavior, concurrency safety and the disabled-by-default schedule.

An Actions success proves the snapshot passed validation, not that the Cloudflare deployment completed. Check Workers Builds separately after a published data commit.
