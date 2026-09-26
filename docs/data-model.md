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
  category?: 'agents' | 'browser' | 'sdk' | 'developer' | 'research' | 'resources' | 'directories' | 'applications' | 'alternatives' | 'other'
  url: string
  sourceMeta: SourceMeta
}
```

`id` is stable across refreshes; `url` is the canonical HTTPS GitHub repository URL. Titles and summaries retain their source language. `category` is one reviewed primary use case: `directories` identifies collections whose primary purpose is indexing multiple distinct Jev projects or resources; `resources` covers guides, docs and examples; `alternatives` identifies an independent open-source typed-decision implementation, not a certified drop-in replacement; `other` means the purpose lacks enough evidence. Tags are repository topics, not the primary category.

`sourceMeta` carries `repo`, `author`, optional creation `date`, display `stars` / `forks` / `language`, optional Jev review scores and pinned `jevEvidence.evidenceUrl`. Open-issue counts are neither stored nor displayed. Unknown GitHub values may be null; a failed refresh must not replace known values with fabricated zeroes. Manual README-backed category refinement may retain `categoryEvidenceSha` and `categoryEvidenceUrl`.

### Inclusion rationale and review scores

The author-provided `summary` is not rewritten to explain our admission decision. The optional `sourceMeta.inclusion` is a separate, source-reviewed editorial record:

```ts
inclusion?: {
  text: { en: string; zh: string; ja: string }
  evidence: Array<{ url: string; quote: string }>
  checkedAt: string
  reviewer: string
}
```

`text` is one concise, concrete explanation of the project's Jev connection, translated for all three site languages. One or two `evidence` entries bind it to the same repository at a full commit SHA; `quote` retains a short exact passage that supports the explanation (at most 350 characters per excerpt and 25 excerpt units per source file in total). Excerpt units count each unspaced Chinese/Japanese character conservatively as one, plus the remaining whitespace-separated words; punctuation alone does not count. This record describes a source review, not execution testing, an affiliation claim or a security certification. A generic platform with a Jev adapter must be described as an integration, not as a platform powered entirely by Jev. Alternatives must not be presented as compatible Jev API clients without evidence. Public code alone does not confirm an open-source license; unresolved licensing must be stated rather than silently certified.

Missing records are left absent, not populated from category, tags or model confidence. Project details show a localized pending-rationale message and retain the earlier review-source link when available. Card descriptions and README descriptions remain unchanged. The shared project-content component owns the section in both the route-backed modal and standalone HTML; no second, duplicate review-source section is added.

Existing machine decisions keep their present fields: `jevAbout` estimates the configured Jev relevance proposition (independent implementation for alternatives), `jevKeep` is `keep` / `review` / `drop`, and `jevKeepConfidence` is confidence in that choice. None measures the fraction of a repository using Jev, project quality or runtime reliability. `jevEvidence` holds the machine-review receipt, pinned sources, model and review time. Editorial `inclusion` has its own provenance; it does not replace or reinterpret that receipt.

The radar's `jevEvidence.evidenceSha256` fingerprints the complete review material, including appended integration evidence when present; it is not necessarily the hash of the README alone. Editorial citations are verified against the actual file at their pinned commit, without rewriting the older machine receipt.

[`scripts/inclusion.ts`](../scripts/inclusion.ts) imports independent reviewer batches. Preview is explicit, applying requires `--apply`, and a batch is verified completely before writing: each source must be pinned to the same repository, and each quoted passage must actually occur in the fetched source (only CRLF/LF line endings are normalized). Unknown/duplicate IDs, incomplete translations, unsupported URLs or fabricated quotes reject the batch. Import changes only `sourceMeta.inclusion`; unresolved rows retain their current state. The importer refuses to overwrite a catalog that changed during verification.

```sh
npm run inclusion:check
node --experimental-strip-types scripts/inclusion.ts --queue 40 > /tmp/inclusion-review-batch.json
node --experimental-strip-types scripts/inclusion.ts --preview /path/to/review-batch.json
node --experimental-strip-types scripts/inclusion.ts --apply /path/to/review-batch.json
```

The queue prioritizes outstanding projects by stars, including legacy projects without an earlier review receipt. Batch size controls a local reviewer work packet, not an admission or daily quota. Unavailable evidence remains unresolved; it does not generate a rationale from the queue order.

GitHub metadata refreshes preserve `inclusion` alongside the original author description and machine review. Existing Actions can read the extended catalog without another model or API key. Newly admitted rows may have no editorial rationale yet; a separate prose-generating model is not implicitly introduced. Jev can select predefined rationale options in a future structured-review extension, but current reviewer-written text is not fabricated by the collector.

## News `NewsItem`

Defined in [`src/lib/news.ts`](../src/lib/news.ts): AIHOT item ID, title, optional original title and summary, source name, publication/discovery times, category, AIHOT score and selection state, original HTTPS URL and AIHOT item HTTPS URL. The public AIHOT API does not contract article body or media URLs, so they are not fabricated in this store. The UI sorts a copy by publication time, falling back to discovery time. The site does not expose a bulk-export API.

## Consumption and write boundaries

The directory imports `data/github.json`, filters by category, searches and sorts it, then renders project cards or rows. News imports `data/news.json` independently. The GitHub radar refreshes every existing project's `stars`, `forks` and `language`; it preserves ID, URL, title, summary, tags, category, Jev scores and pinned evidence. Existing `sourceMeta.repo` display aliases from renames are tolerated; the normalized URL owns deduplication.

`Project directories` is a primary category shared by the README, website sidebar, category routes and sitemap. The README generator reads the stored category; it does not infer classification from repository names. Listing an external directory does not import its entries into this catalog; each included GitHub repository still needs its own review.

New reviewed projects append to `github.json`, never replace or reorder existing rows. Admission requires Jev `keep`, `jevAbout >= 0.9` and `jevKeepConfidence >= 0.9`; a category choice is recorded in the same review. `radar/state.json` holds pending/error candidates and cursors, while `radar/latest.json` holds audit receipts. Neither is imported into the website. README project sections and count badge are generated from the same GitHub store; edit descriptions in JSON rather than inside generated README markers.

Client-side sort uses `awesome-jev-github-sort` (`stars`, `date`, `name`); missing dates sort last. The page's data-update timestamp follows the newest Git commit touching `data/github.json` or `data/news.json`, not a UI-only change.
