# Data model

Canonical public stores:

- [`data/github.json`](../data/github.json) — curated GitHub projects, including independent open-source alternatives
- [`data/news.json`](../data/news.json) — separate AIHOT Jev news records

The project catalog reads only `github.json`. It rejects legacy `items.json` / `part-*.json` shards and the retired `x.json` / `youtube.json` sources rather than silently publishing them. The news view loads `news.json` separately; GitHub radar snapshots cannot edit it. See [news.md](news.md) for the AIHOT sync contract.

## Catalog capacity and migration gate

`MAX_CATALOG_FILE_BYTES` is a **16 MiB local safety bound**, not a deployment quota. The previous 4,500,000-byte PR limit was almost exhausted; raising it gives migration room, not unlimited growth. `data:check` (also required by `build`) warns at 90% and refuses publication from 95%, reserving 5% for maintenance before the read limit can break every PR. The reviewed baseline used 4,480,480 bytes (26.7% of the new bound); later editorial backfills grow this file and remain subject to the same gate. Client transfer is a separate boundary: the display projection removes unused audit fields but does not make canonical storage unbounded.

**Migration trigger:** a 90% warning starts migration; the 95% gate must not be bypassed by repeatedly raising the number. The next format is a versioned `data/github/index.json` manifest plus byte-bounded shards (target 512 KiB, hard 1 MiB each). Assign repositories to stable owner/repo-hash buckets, splitting an overflowing bucket deterministically; never split a record. The manifest binds shard path, hash, byte count and record count, and retains the global ID order. It is not the obsolete unversioned `part-*.json` format. This v2 reader/writer is a planned coordinated migration, **not already supported by today's v1 validator**.

Migration must update the canonical reader, collectors/snapshot protection, PR extraction, timestamp/history paths and build consumers together. The reader assembles one logical catalog; PR review compares only changed base/head shards and verifies the manifest, while full CI still checks cross-shard identity and editorial preservation. Vite derives the same display projection from that logical catalog. Keep one canonical format after migration, not two writable full copies. Source sharding alone is not lazy browser delivery and must not be advertised as a page-speed gain.

Before cutover, round-trip all records byte-for-field, preserving IDs, order, aliases, categories, editorial text and receipts; verify duplicate/missing/corrupt shard rejection, changed-shard PR detection, no-paid snapshot replay and all three-language routes/HTTP tests. Compare generated README/sitemap/counts and every UI/search/sort/preview field; retain a reversible migration commit and original snapshot. No public URL, appearance or new project admission rule changes. A paused publish keeps the old site online and the snapshot recoverable; it must never substitute a truncated catalog.

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

### GitHub object identity

The collector-only optional `sourceMeta.githubIdentity: { databaseId: number; nodeId: string }` binds an entry to the GitHub repository object rather than its mutable owner/name. Successful authenticated metadata reads bootstrap legacy rows; newly admitted API records also carry it. Once established, refresh and snapshot validation cannot remove or change the positive numeric ID. Node IDs are opaque lookup addresses, so a different returned Node ID with the same numeric ID is allowed. Existing IDs, URLs, author text and pinned evidence remain unchanged; current names appear only in the metadata report. A legacy row's first bootstrap has no historical-ID proof beyond any preexisting reviewed seed, so it cannot detect a name reclaimed before that baseline. No fabricated baseline is added to canonical JSON during local testing.

This identity is machine audit, excluded from the build-time browser display projection. It also prevents core/alternatives discovery or queued review from re-admitting the same renamed object. After the 2026-10-03 one-time cleanup, stored numeric IDs must be unique across catalog rows. URL uniqueness still guards the published catalog; baseline identity adds collector object-level deduplication rather than changing public route keys.

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
npm run inclusion:verify -- <base-commit-sha>
node --experimental-strip-types scripts/inclusion.ts --queue 40 > /tmp/inclusion-review-batch.json
node --experimental-strip-types scripts/inclusion.ts --preview /path/to/review-batch.json
node --experimental-strip-types scripts/inclusion.ts --apply /path/to/review-batch.json
```

The queue prioritizes outstanding projects by stars, including legacy projects without an earlier review receipt. Batch size controls a local reviewer work packet, not an admission or daily quota. Unavailable evidence remains unresolved; it does not generate a rationale from the queue order.

GitHub metadata refreshes preserve `inclusion` alongside the original author description and machine review. Existing Actions can read the extended catalog without another model or API key. Newly admitted rows may have no editorial rationale yet; every production build runs the existing offline `inclusion:check` to expose the current completed/pending count, without rejecting an otherwise eligible project or calling a prose-generating model. After a collector publishes additions, use `--queue` to review the new backlog and preserve an explicit unresolved-source list rather than silently forgetting entries. Current reviewer-written text is not fabricated by the collector.

The radar's push/PR verification compares against the event's fixed base commit and fetches sources only for added or edited rationales. Ordinary star/fork refreshes do not refetch unchanged evidence. The submission bot independently runs the same comparison from trusted `main` code, including rationale-only PRs for existing projects. An absent source, invalid record or mismatched quote fails verification; no model call or credential is needed. Matching a quote proves its occurrence, not the correctness of the surrounding prose: maintainers still review the interpretation and translations. Removing a rationale remains a visible, maintainer-reviewed data change rather than a fabricated replacement.

## News `NewsItem`

Defined in [`src/lib/news.ts`](../src/lib/news.ts): AIHOT item ID, title, optional original title and summary, source name, publication/discovery times, category, AIHOT score and selection state, original HTTP/HTTPS URL and AIHOT item HTTPS URL. The public AIHOT API does not contract article body or media URLs, so they are not fabricated in this store. The UI sorts a copy by the API timeline rule documented in news.md. The site does not expose a bulk-export API.

## Consumption and write boundaries

The directory imports the build-time `virtual:directory-catalog` display projection from the sole canonical `data/github.json`, filters by category, searches and sorts it, then renders project cards or rows. Full inclusion records remain available for synchronous previews; unused audit fields do not enter this browser module. News imports `data/news.json` independently. Every published core radar run refreshes the final Top100's `stars`, `forks` and `language`, plus up to 1,000 other projects using the persisted identity cursor; it preserves ID, URL, title, summary, tags, category, Jev scores and pinned evidence. Existing `sourceMeta.repo` display aliases from renames are tolerated only when URL and repo identity remain unchanged from the baseline; newly added or identity-edited rows must match their canonical repository URL. The normalized URL owns public-route uniqueness; known GitHub IDs additionally prevent rename-induced collector duplicates. Optional metadata is runtime-validated too: scores, dates, nested receipt types and same-repository pinned blob/tree links cannot rely on TypeScript assertions.

`Project directories` is a primary category shared by the README, website sidebar, category routes and sitemap. The README generator reads the stored category; it does not infer classification from repository names. Listing an external directory does not import its entries into this catalog; each included GitHub repository still needs its own review.

New reviewed projects append to `github.json`, never replace or reorder existing rows. Admission requires Jev `keep`, `jevAbout >= 0.9` and `jevKeepConfidence >= 0.9`; a category choice is recorded in the same review. `radar/state.json` holds pending/error candidates and cursors, while `radar/latest.json` holds audit receipts. Neither is imported into the website. README project sections and count badge are generated from the same GitHub store; edit descriptions in JSON rather than inside generated README markers.

Client-side sort uses `awesome-jev-github-sort` (`stars`, `date`, `name`); missing dates sort last. The page's data-update timestamp follows the newest Git commit touching `data/github.json` or `data/news.json`, not a UI-only change.

## 2026-10-03 identity cleanup

Official `gh api graphql` checked all 2,199 rows in 44 batches (reported cost 44); an independent read agreed on every returned ID. Ten old/new-name pairs each resolved to one repository and had matching categories. The current canonical-URL record was retained whole, preserving its existing public ID, description, scores, category and pinned evidence; the ten duplicate old records were removed, not field-merged. That initial cleanup left 2,189 rows and 2,159 unique verified GitHub identities. At that stage, the remaining 30 public API 404 rows stayed unchanged/unanchored; a 404 cannot establish deleted versus private, so no ID or deletion was fabricated. These are unresolved source records, not a second identity scheme.

The ten removed public addresses are recorded in the retained row's `sourceMeta.previousUrls`. They are address history only: not collector identity, extra catalog rows or a remote mapping service. The existing project server-function/route returns a same-language permanent 301 to the one current detail page. Neither these addresses nor GitHub identity audit fields enter the directory display projection or sitemap. Catalog validation rejects unsafe/colliding previous addresses and duplicate stored numeric IDs. Removed local bookmark IDs are not rewritten; source review history remains in Git.

### Authorized 404 follow-up

On 2026-10-03 the maintainer explicitly requested another check and removal of still-unavailable sources. Official `gh api repos/{owner}/{repo}` rechecked all 30 unanchored entries; every one again returned HTTP 404, while a known public repository was readable with the same authentication. This establishes public unavailability, not deleted versus private. All 30 were removed under that explicit authorization. The current canonical catalog contains **2,159 records, all with unique verified GitHub identities**; retained records are byte-for-byte equivalent as parsed JSON, and README/sitemap are regenerated from that same snapshot. The seven remaining rationale cases are listed in [inclusion-follow-up.md](inclusion-follow-up.md). Removed records remain recoverable from Git history; no blacklist, archive dataset or automatic-404 deletion mechanism is added.
