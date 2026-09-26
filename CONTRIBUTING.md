# Contributing

Thanks for helping curate **Awesome JEV** — a GitHub-first directory of **Jev ecosystem projects** about **TypeSafe AI’s System One model [Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)** (typed decisions, SDKs, demos, integrations).

## Add items via JSON

- GitHub projects: [`data/github.json`](data/github.json)

Prefer editing that file (or letting the collector merge into it) over hand-editing the README list alone.

### Schema (`DirectoryItem`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Stable unique id, e.g. `gh-<owner-length>-owner-repo` |
| `type` | `"github"` | GitHub project |
| `title` | `string` | Repository name |
| `summary` | `string` | One–two sentence repository description |
| `tags` | `string[]` | Repository topics. |
| `category` | `string` | Required for GitHub: `agents`, `browser`, `sdk`, `developer`, `research`, `resources`, `directories`, `applications`, `alternatives`, or `other`. One primary use case. |
| `url` | `string` | Canonical GitHub repository link |
| `sourceMeta` | `object` | See [`docs/data-model.md`](docs/data-model.md) |

### `sourceMeta` (common)

- **GitHub:** `stars`, `forks`, `language`, `author`, `repo`, optional `date` and pinned review evidence.

Use a real canonical repository URL. Never commit `PLACEHOLDER` entries.

New radar-admitted GitHub projects receive a Jev category in the same review call. For manual JSON additions, choose one primary category from the project evidence and run `npm run categories:check`; use `other` only when the purpose is unclear.

To score harvested rows with Jev, create a gitignored `.env.local` and set `TYPESAFE_API_KEY`, and run `npm run score:sources`. Never commit the key or put it in client code. See [`docs/collector.md`](docs/collector.md).

## Theme

**In scope:** TypeSafe AI, System One models, **Jev**, official/community SDKs, agent skills, browser & computer-use demos, MCP connectors, routers, awesome-lists, and source-backed resources with outbound links (e.g. typesafe.ai, GitHub, docs). The separate `alternatives` category is for independent, licensed open-source typed-decision implementations; it does not imply TypeSafe affiliation or Jev API compatibility.

**Out of scope:** Unrelated projects or anything that does not clearly connect to TypeSafe / System One / Jev.

## PR hygiene

- One project (or one coherent batch of related links) per PR when possible.
- Include a short summary and useful tags.
- Prefer **real, maintained** open-source projects.
- Run `npm run readme:sync` after adding GitHub projects; README categories follow the stored category.
- Run `npm run categories:check` and `npm run data:check`.
- Keep the author's `summary` unchanged when explaining admission. Optional `sourceMeta.inclusion` needs English, Chinese and Japanese reasons with short, exact quotes at fixed commits in the same repository. See [the data contract](docs/data-model.md#inclusion-rationale-and-review-scores). Run `npm run inclusion:verify -- <base-commit-sha>` when adding or editing a rationale; CI verifies only changed rationales, including edits to already-listed projects. Missing reasons remain explicitly unavailable rather than being invented from review scores.
- Run `npm run build` locally if you touch TypeScript / UI.

## Not allowed

- Invented or PLACEHOLDER repository URLs.
- Hosting third-party media files in this repo.
- Scraped credentials, paywalled dumps, or clearly abusive ToS violations.

## Docs

- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Data model: [`docs/data-model.md`](docs/data-model.md)
- Collector: [`docs/collector.md`](docs/collector.md)
