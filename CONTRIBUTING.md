# Contributing

Thanks for helping curate **Awesome JEV** — a directory of **GitHub projects and X posts** about **TypeSafe AI’s System One model [Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)** (typed decisions, SDKs, demos, integrations).

## Add items via JSON

- GitHub projects: [`data/github.json`](data/github.json)
- YouTube explainers: [`data/youtube.json`](data/youtube.json)
- X posts: [`data/x.json`](data/x.json) — **no `tags` field**; URLs and `@mentions` in the post body are parsed into links on the card

Prefer editing those files (or letting the collector merge into them) over hand-editing the README list alone.

### Schema (`DirectoryItem`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Stable unique id, e.g. `gh-owner-repo` or `x-<tweetId>` |
| `type` | `"github"` \| `"x"` \| `"youtube"` | Controls which board / card style |
| `title` | `string` | Repo name or short post title |
| `summary` | `string` | One–two sentence description (X: post body, with real URLs) |
| `tags` | `string[]` | GitHub / YouTube only. Omit on X posts. |
| `url` | `string` | Canonical link (repo or original tweet) |
| `sourceMeta` | `object` | See [`docs/data-model.md`](docs/data-model.md) |

### `sourceMeta` (common)

- **GitHub:** `stars`, `forks`, `openIssues`, `language`, `author`, `repo`, optional `avatarUrl`
- **X:** `handle`, `date`, `likes`, `replies`, `retweets`, `bookmarks`, optional `author`, optional `mediaUrls` / `videoUrls` / `avatarUrl`. No view counts.

Do not invent fake tweet URLs. If you lack a real `url`, skip the item. Never commit `PLACEHOLDER` entries.

To score harvested rows with Jev, create a gitignored `.env.local` and set `TYPESAFE_API_KEY`, and run `npm run score:sources`. Never commit the key or put it in client code. See [`docs/collector.md`](docs/collector.md).

## Theme

**In scope:** TypeSafe AI, System One models, **Jev**, official/community SDKs, agent skills, browser & computer-use demos, MCP connectors, routers, awesome-lists, and high-signal discussion with outbound links (e.g. typesafe.ai, GitHub, docs).

**Out of scope:** Unrelated projects or anything that does not clearly connect to TypeSafe / System One / Jev.

## PR hygiene

- One project (or one coherent batch of related links) per PR when possible.
- Include a short summary and useful tags.
- Prefer **real, maintained** open-source projects (or high-signal X posts via the collector).
- Keep the README awesome-list section in sync when adding notable GitHub projects.
- Run `npm run build` locally if you touch TypeScript / UI.

## Not allowed

- Invented or PLACEHOLDER URLs / tweet IDs.
- Hosting or embedding media files in this repo (thumbnails must be remote URLs only, e.g. X CDN).
- Scraped credentials, paywalled dumps, or clearly abusive ToS violations.

## Docs

- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Data model: [`docs/data-model.md`](docs/data-model.md)
- Collector: [`docs/collector.md`](docs/collector.md)
