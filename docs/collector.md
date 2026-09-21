# Collector (JEV 资讯收集)

## Scope and data contract

Collect TypeSafe AI **Jev / System One** ecosystem resources: official and community SDKs, curated lists, research, demos, integrations and useful educational material. A direct API call is not required for inclusion. This is a relevance review, not a runtime or performance certification.

The website reads exactly `data/github.json`, `data/youtube.json`, and `data/x.json`. Each file contains only its matching source type. All collectors must deduplicate across the complete catalog, preserve stable IDs and every existing field, and never replace a file with a partial subset. Old `items.json` and `part-*.json` files are rejected by validation; do not recreate them.

The GitHub radar only discovers **public, non-fork, non-archived GitHub repositories**. It does not collect X or YouTube and cannot change their files. New GitHub entries append to `data/github.json`. Other collectors must update the matching source file and regenerate README before committing:

```bash
npm run readme:sync
npm run data:check
```

## GitHub Actions

Workflow: **Jev ecosystem radar**, `.github/workflows/radar.yml`.

- Pushes and pull requests run offline tests, catalog/README validation, lint and a production build.
- Manual `mode=validate` runs those same checks without a Jev key or paid API calls.
- Manual `mode=sync` searches GitHub, refreshes a rotating batch of existing metadata, reviews candidates and creates a snapshot. `publish=false` is the default: the snapshot is validated but not committed.
- `publish=true` commits a validated sync snapshot to `main`.
- Scheduled runs require repository variable **`RADAR_ENABLED=true`**. Until explicitly enabled, no scheduled scan runs and no Jev credits are spent.
- Cron `17 */6 * * *`: planned Beijing times **02:17, 08:17, 14:17, 20:17**; GitHub scheduling can be delayed.

### First-time setup

1. Generate a TypeSafe key at [TypeSafe Console → API keys](https://console.typesafe.ai/settings/keys).
2. Open [this repository's Actions secrets](https://github.com/daftAI2026/awesome-jev/settings/secrets/actions).
3. Choose **New repository secret**. Name: **`TYPESAFE_API_KEY`**. Value: the key. Never put it in a variable, source file, issue, chat, or a `VITE_*` setting.
4. Open **Actions → Jev ecosystem radar → Run workflow** on `main`. Choose `mode=sync`, `limit=5`, leave `publish` unchecked.
5. Inspect the run summary and the `radar-<run-id>-<attempt>` artifact: `radar/latest.json` includes review outcomes and immutable README evidence URLs/hashes. Confirm intended additions in the candidate `data/github.json` and README.
6. Run `mode=sync`, `limit=5`, `publish=true` to publish. This performs a **fresh review**, not promotion of the previous preview snapshot; results may differ. Check the published commit and deployment.
7. Finally add repository **Actions variable** `RADAR_ENABLED` with value `true`. Set it to `false` to pause schedules. Scheduled runs review at most 20 candidates each.

No personal GitHub token is needed: repository and README search use the workflow's built-in `GITHUB_TOKEN`. There is no authenticated code-search dependency. The local env file is not uploaded or read by the Action. A local TypeSafe key does not automatically configure GitHub Secrets.

### Processing and budgets

1. Search six focused GitHub repository queries; at most two pages of 100 results per query and per run. Persist each query's next page; GitHub search exposes at most the first 1,000 results per query. This is bounded discovery, not a full GitHub crawl.
2. Deduplicate by normalized GitHub URL against **all shards**. Do not rename existing IDs or overwrite editorial content.
3. Refresh up to **150 existing GitHub entries** per run, rotating a persisted cursor. Only `stars`, `forks`, `openIssues`, and `language` change. Missing, moved, inaccessible or rate-limited repositories retain their old data.
4. For at most **20 candidates** by default (manual choices: 5, 20, 60), read the repository metadata and a README pinned to the current commit SHA. Limit README input to 12,000 characters; oversized/missing README goes to the retry queue. Repository code is never executed.
5. Require an explicit TypeSafe provider marker and Jev/System One context; defer missing evidence or obvious instruction-override patterns to `review` without a paid call. Then ask `jev-latest` via [TypeSafe's evaluation API](https://docs.typesafe.ai/api) for `about` (Noul) and `keep` (Choice). Treat README contents as untrusted evidence, not instructions.
6. Accept only `jevKeep=keep`, **`jevAbout >= 0.9`**, and **`jevKeepConfidence >= 0.9`**. These are conservative initial routing thresholds, not calibrated accuracy guarantees. The text-pattern guard is not complete prompt-injection protection: a crafted repository can still mislead a relevance model. Preview additions before enabling automatic publishing; never interpret admission as a security endorsement. Jev does not write prose: new summaries use the GitHub description or a neutral fallback.
7. Low-confidence and `review` outcomes remain queued for seven days; high-confidence `drop` outcomes are retried after 30 days while their cache entries are retained. Errors use 1/2/4/7-day backoff. A Jev service/authentication failure ends further reviews in the current run; remaining candidates stay queued.
8. Generate README project sections and project-count badge from the same data. Existing prose outside `PROJECTS` and `PROJECT_COUNT` markers is protected. Categories are deterministic tag/title rules; ordering is by stars and repository name.
9. Validate the snapshot against the original checkout, run tests, catalog checks, lint and build, then publish data, README and radar state in **one commit**. A failed validation cannot publish.

Candidate state is bounded to 2,000 entries. When full, the oldest terminal `drop` cache entries may be evicted to admit new discoveries; pending/review/error entries are never evicted. Evicted rejections can be rediscovered and reviewed before 30 days; the per-run review budget still applies, and eviction marks the report partial. Oldest discovery/check timestamps are reviewed first to prevent alphabetical starvation. An overflow or capped/partial search is visible in the report; do not interpret a green workflow as complete discovery.

### Permission and failure boundaries

- **scan**: read-only GitHub permissions; TypeSafe secret exists only in the collection step. No dependency installation and no remote repository execution.
- **validate**: read-only permissions, no TypeSafe secret. Dependencies install with `--ignore-scripts`; tests and build run against the exact collected snapshot.
- **publish**: sole job with `contents: write`; no TypeSafe key or package installation. Revalidates the data-only snapshot before committing.
- Actions are pinned to commit SHAs. A concurrent Grok/maintainer commit causes a safe non-fast-forward push rejection; never force-push or overwrite it. Re-run against the new `main`.
- Snapshots are retained as Actions artifacts for **14 days**. `radar/state.json` stores cursors and pending/rejected candidates; `radar/latest.json` stores the latest run's outcomes. These files are not imported into the website.
- A missing key fails the scan before discovery or file changes. Mid-run Jev errors cannot admit candidates; metadata updates and queued outcomes can still publish with `status=partial`.
- Roll back an unwanted published update by reverting that bot commit, not resetting branch history. Disable `RADAR_ENABLED` before investigating repeated bad additions.

## Local commands

```bash
npm test                 # No network or real keys
npm run data:check       # Full catalog validity and README freshness
npm run readme:sync      # Regenerate only README's marked regions
npm run build            # Includes full-catalog OG image count
```

For an explicit local network scan, export `GITHUB_TOKEN` and `TYPESAFE_API_KEY` in the shell, then run `npm run radar:scan -- /absolute/path/to/snapshot`. The scanner does **not** load `.env.local`. Inspect the snapshot before applying it with `node scripts/radar.mjs --apply /absolute/path/to/snapshot`; do not apply over unrelated uncommitted data changes.

The older `npm run score:sources` command remains an **explicit manual scoring tool**. It can read the developer's gitignored `.env.local` or `.env`; the Action does not invoke it. `--limit=20` now bounds reviews across all selected files together; `--only=github`, `--only=youtube`, and `--only=x` select one source; `--only=all` selects all three. The legacy `--only=items` alias selects GitHub and YouTube. Flags `--dry-run` (still makes paid API calls) and `--force` are supported. It writes scores, never deletes records; it is not the radar's admission gate.
