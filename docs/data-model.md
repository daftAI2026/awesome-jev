# Data model

Canonical public stores:

- [`data/github.json`](../data/github.json) — curated GitHub projects, including independent open-source alternatives
- [`data/news.json`](../data/news.json) — separate AIHOT Jev news records

The project catalog reads only `github.json`. It rejects legacy `items.json` / `part-*.json` shards and the retired `x.json` / `youtube.json` sources rather than silently publishing them. The news view loads `news.json` separately; GitHub radar snapshots cannot edit it. See [news.md](news.md) for the AIHOT sync contract.

## GitHub `DirectoryItem`

Types live in [`src/lib/types.ts`](../src/lib/types.ts) and the collector contract in [`scripts/model-types.ts`](../scripts/model-types.ts).

```ts
interface DirectoryItem {
  id: string
  type: 'github'
  title: string
  summary: string
  tags?: string[]
  category?: 'agents' | 'browser' | 'sdk' | 'developer' | 'research' | 'resources' | 'applications' | 'alternatives' | 'other'
  url: string
  sourceMeta: SourceMeta
}
```

`id` is stable across refreshes; `url` is the canonical HTTPS GitHub repository URL. Titles and summaries retain their source language. `category` is one reviewed primary use case: `alternatives` identifies an independent open-source typed-decision implementation, not a certified drop-in replacement; `other` means the purpose lacks enough evidence. Tags are repository topics, not the primary category.

`sourceMeta` carries `repo`, `author`, optional creation `date`, display `stars` / `forks` / `language`, optional Jev review scores and pinned `jevEvidence.evidenceUrl`. Open-issue counts are neither stored nor displayed. Unknown GitHub values may be null; a failed refresh must not replace known values with fabricated zeroes. Manual README-backed category refinement may retain `categoryEvidenceSha` and `categoryEvidenceUrl`.

## News `NewsItem`

Defined in [`src/lib/news.ts`](../src/lib/news.ts): AIHOT item ID, title, optional original title and summary, source name, publication/discovery times, category, AIHOT score and selection state, original HTTPS URL and AIHOT item HTTPS URL. The public AIHOT API does not contract article body or media URLs, so they are not fabricated in this store. The UI sorts a copy by publication time, falling back to discovery time. The site does not expose a bulk-export API.

## Consumption and write boundaries

The directory imports `data/github.json`, filters by category, searches and sorts it, then renders project cards or rows. News imports `data/news.json` independently. The GitHub radar refreshes every existing project's `stars`, `forks` and `language`; it preserves ID, URL, title, summary, tags, category, Jev scores and pinned evidence. Existing `sourceMeta.repo` display aliases from renames are tolerated; the normalized URL owns deduplication.

New reviewed projects append to `github.json`, never replace or reorder existing rows. Admission requires Jev `keep`, `jevAbout >= 0.9` and `jevKeepConfidence >= 0.9`; a category choice is recorded in the same review. `radar/state.json` holds pending/error candidates and cursors, while `radar/latest.json` holds audit receipts. Neither is imported into the website. README project sections and count badge are generated from the same GitHub store; edit descriptions in JSON rather than inside generated README markers.

Client-side sort uses `awesome-jev-github-sort` (`stars`, `date`, `name`); missing dates sort last. The page's data-update timestamp follows the newest Git commit touching `data/github.json` or `data/news.json`, not a UI-only change.
