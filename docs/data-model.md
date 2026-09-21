# Data model

Canonical stores:

- [`data/github.json`](../data/github.json) — GitHub projects only
- [`data/youtube.json`](../data/youtube.json) — YouTube videos only
- [`data/x.json`](../data/x.json) — X posts only (no tags)

The site imports these three files explicitly. The shared catalog validates source placement and globally unique IDs; legacy `items.json` and `part-*.json` files are rejected. Migration preserves all fields and the relative order within each source. The GitHub radar may update only GitHub metadata and append reviewed GitHub entries; YouTube and X remain immutable to the GitHub radar. Separate verified YouTube refreshes may update existing videos’ publication dates and public statistics without changing IDs, editorial text or review scores.

Types live in [`src/lib/types.ts`](../src/lib/types.ts).

## `DirectoryItem`

```ts
interface DirectoryItem {
  id: string
  type: 'github' | 'x' | 'youtube'
  title: string
  summary: string
  tags?: string[]
  url: string
  sourceMeta: SourceMeta
}
```

| Field | Meaning |
| --- | --- |
| `id` | Stable unique key for React lists and collector upserts |
| `type` | Board + card style |
| `title` | Display title (repo name / short headline) — **not** translated by the UI |
| `summary` | Description; for X this is the post text — **not** translated by the UI |
| `tags` | GitHub / YouTube only. X posts omit tags. |
| `url` | Outbound link (repo page or original tweet) |
| `sourceMeta` | Type-specific metadata |

## `SourceMeta`

```ts
interface SourceMeta {
  // GitHub
  stars?: number | null
  forks?: number | null
  openIssues?: number | null
  language?: string | null
  author?: string | null       // GitHub owner, or X display name
  repo?: string | null

  // X
  handle?: string | null
  likes?: number | null
  replies?: number | null
  retweets?: number | null
  bookmarks?: number | null
  date?: string | null
  mediaUrls?: string[] | null  // first URL used as tweet card image / video poster
  videoUrls?: string[] | null  // remote mp4 URLs; first plays in the card
  avatarUrl?: string | null    // profile image on the X card
}
```

### GitHub fields

- `repo` — `owner/name`
- `stars`, `forks`, `openIssues`, `language`, `author` — display meta on restrained cards (Phosphor Star / GitFork / Bug)
- Prefer populating from the public GitHub repo API: `stargazers_count` → `stars`, `forks_count` → `forks`, `open_issues_count` → `openIssues`
- Collectors may emit `null` when unknown
- Optional `date` (YYYY-MM-DD) supports the section “Date” sort

### X / YouTube / media

- `handle` — `@user` or `user` (UI normalizes `@`)
- `date` — ISO or short display string (YYYY-MM-DD preferred for sorting)
- `likes`, `replies`, `retweets`, `bookmarks` — X card bottom row (no view counts)
- `author` — display name next to the avatar on X cards
- **`mediaUrls`** — remote image URLs from the post; the UI shows the **first** image inside the social card (or as the `<video poster>`). Never commit binary media into this repo.
- **`videoUrls`** — remote mp4 URLs from the post; the UI plays the **first** with native `<video controls playsInline preload="metadata">`. No autoplay.
- **`avatarUrl`** — X profile image in the card header
- YouTube rows use `type: "youtube"`, `sourceMeta.videoId`, `sourceMeta.views`, and a watch URL. Thumbnail is the first `mediaUrls` entry or `https://i.ytimg.com/vi/{videoId}/hqdefault.jpg`.
- **`jevAbout` / `jevKeep` / `jevKeepConfidence`** — optional collector scores from TypeSafe Jev. Written by `npm run score:sources`, never invented by hand. Not shown on cards until a later pass.

### Collector note

When upserting GitHub rows, include `forks` and `openIssues` alongside `stars` whenever the API provides them. Upsert X posts into `data/x.json` (never the other source files), without `tags`. URLs and `@mentions` in `summary` are parsed into links in the tweet card.

## UI sort (client-only)

Persisted in `localStorage`:

| Section | Key | Default | Options |
| --- | --- | --- | --- |
| GitHub | `awesome-jev-github-sort` | `stars` | `stars` \| `date` \| `name` |
| X | `awesome-jev-x-sort` | `date` (newest first) | `date` \| `likes` |
| YouTube | `awesome-jev-youtube-sort` | `date` (newest first) | `date` \| `views` |

Missing numeric fields sort as `0`; missing dates sort last.

## Consumption

`App.tsx` imports `data/github.json`, `data/youtube.json` and `data/x.json`, concatenates them, filters by `type` into section boards, applies user sort after search, and passes each item to `ItemCard`.

## GitHub radar write contract

- Existing records keep their ID, URL, title, summary, tags and Jev scores. Only GitHub display metadata (`stars`, `forks`, `openIssues`, `language`) refreshes.
- Existing `sourceMeta.repo` aliases from repository renames are tolerated. The normalized GitHub URL, not the display alias, owns deduplication and metadata requests.
- New records use the same `DirectoryItem` schema, with real Jev `jevAbout`, `jevKeep` and `jevKeepConfidence` scores. Admission requires `keep` and both numeric thresholds at least 0.9. IDs include the owner length to disambiguate hyphenated owner/name combinations.
- New GitHub records append to `github.json`; no existing record is deleted or reordered. `youtube.json` and `x.json` are immutable to the radar.
- README categories are computed from titles, tags and owner. Manual prose belongs outside generated markers; edit directory summaries at their source, not in the generated README list.
- Review SHA, README evidence URL and content hash live in `radar/latest.json`, not in the browser-facing schema. Pending/error candidates live in `radar/state.json`, never in the public directory until accepted.

YouTube `sourceMeta.date` stores the video publication time, preferably a full ISO timestamp with timezone; legacy `YYYY-MM-DD` remains supported. The UI compares full instants and retains the masonry layout. Unknown statistics must not overwrite known values with zero.
