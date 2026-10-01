# Contributing

Thanks for helping curate **Awesome JEV** — a GitHub-first directory of **Jev ecosystem projects** about **TypeSafe AI’s System One model [Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)** (typed decisions, SDKs, demos, integrations).

## Suggest a project (no code changes required)

Open the [Submit a project Issue form](https://github.com/daftAI2026/awesome-jev/issues/new?template=submit-project.yml), also linked beside the source-repository button in the website header. Sign in to GitHub and provide one repository URL, its purpose, and concrete Jev / System One evidence in that repository. Independent typed-decision alternatives should include their license evidence. Check existing entries and open submissions first; do not post credentials or private material.

The form keeps the `[Submission]` title prefix so the existing review bot recognizes the request without requiring a label. The bot reads repository sources and posts advisory findings; it does not add entries, merge PRs or certify security. Maintainers make the final inclusion decision. Keep evidence links within the submitted repository: the current Issue parser treats other GitHub repository links in the body as additional candidates. See [the review boundary](docs/collector.md#submission-review-bot-issues-and-pull-requests).

无需修改代码：点击网站页头“提交项目”，登录 GitHub 后填写仓库地址、项目用途及同仓库内的关联证据。每个申请推荐一个项目，维护者最终确认收录；机器人不会自动上架。

## Add items via pull request

Prefer a PR when you want to make the actual catalog change yourself. Fork the repository, edit the JSON below, regenerate README, then open a PR using the supplied template. A PR template describes changes; it does not create a catalog entry by itself.

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
