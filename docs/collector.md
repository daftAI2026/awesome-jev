<!--
[INPUT]: 依赖采集/审核契约、GitHub Actions、执行交接与离线测试
[OUTPUT]: 提供采集发布规则、权限边界与 Workflow 解耦 TDD 证据
[POS]: docs 的自动化运维契约，连接工作流权限隔离与目录数据发布，不作为运行时代码依赖
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# Collector (JEV 资讯收集)

## Scope and data contract

Collect TypeSafe AI **Jev / System One** ecosystem resources: official and community SDKs, curated lists, research, demos, integrations and useful educational material. A direct API call is not required for inclusion. This is a relevance review, not a runtime or performance certification.

Admission scores are not prose explanations. Source-reviewed, localized rationales live separately in `sourceMeta.inclusion`; see [the data-model contract](data-model.md#inclusion-rationale-and-review-scores). Metadata refresh and snapshot validation preserve this editorial field. The existing radar/submission review continues using Jev alone, and newly admitted projects without a rationale show the pending state instead of a score-derived explanation. Local reviewer batches can be previewed and imported with `scripts/inclusion.ts` without adding an Actions secret or another model endpoint.

The project catalog reads `data/github.json`; the separate AIHOT collector owns `data/news.json`. GitHub collectors must deduplicate by canonical repository URL, preserve stable IDs and editorial fields, and never replace the catalog with a partial subset. Old `items.json` / `part-*.json` shards and retired `x.json` / `youtube.json` sources are rejected by validation; do not recreate them.

The GitHub radar only discovers **public, non-fork, non-archived GitHub repositories**. New entries append to `data/github.json`. A second, separate Action discovers independent open-source typed-decision implementations under `alternatives`; it shares the catalog and reviewer but not the core radar queue. After a manual project edit, regenerate README before committing:

```bash
npm run readme:sync
npm run data:check
```

## GitHub Actions

### Workflow 职责与交接

职责分为七条 Workflow。
上线证据与迁移基线见 workflow-verification.md。

| Workflow | 职责 | 模型凭据 |
| --- | --- | --- |
| Jev ecosystem radar | 核心发现、审核与目录发布 | 原核心预算 |
| Jev metadata sync | 全目录统计与身份刷新 | 无 |
| Jev site delivery | PR/main 校验、产物部署与收录通知 | 无 |
| Open-source alternatives radar | 独立替代实现发现与审核 | 原替代预算 |
| Jev submission review | 投稿建议性审核 | 原投稿预算 |
| Jev submission intake | 精确 site CI 后收录或恢复 | 无 |
| Jev news sync | 新闻同步，只更新站点派发交接 | 无 |

四个采集来源共用 `scripts/publish-data.ts`。
发布器是共享代码，不是第八条 Workflow。
统计失败不阻断发现，搜索暂停不自动阻断已有候选。
发现不以前置 GraphQL 探针作门禁。
仅缺失身份时执行严格身份补齐。
发现与审核仍在同一个核心 Workflow 内。

`radar.yml` 保留原身份、scan job 与付费步骤名。
手动 `mode=sync` 会调用 Jev，即使 `publish=false`。
手动 publish 默认 false；limit 只限制候选审核数。
定时核心采集仍为 UTC `17 */6 * * *`。

`metadata-sync.yml` 使用同一 `RADAR_ENABLED` 启动门。
定时为 UTC `11 1,7,13,19 * * *`。
北京时间为 03:11、09:11、15:11、21:11。
手动 publish 默认 false，不提供 limit 或模型密钥。
每轮读取窗口为 25 分钟，scan job 为 35 分钟。

`site.yml` 接收 main push、PR 和手动 validate。
它保留精确 head、完整校验与 production 隔离。
数据快照验证与最终 main 交付暂各构建一次。
快照中的 dirty-data dist 不是最终 main 产物。
部署只使用本次 site 校验封装的 artifact ID。

### First-time setup

1. Generate a TypeSafe key at [TypeSafe Console → API keys](https://console.typesafe.ai/settings/keys).
2. Open [this repository's Actions secrets](https://github.com/daftAI2026/awesome-jev/settings/secrets/actions).
3. Choose **New repository secret**. Name: **`TYPESAFE_API_KEY`**. Value: the key. Never put it in a variable, source file, issue, chat, or a `VITE_*` setting.
4. Open **Actions → Jev ecosystem radar → Run workflow** on `main`. Choose `mode=sync`, `limit=5`, leave `publish` unchecked.
5. Inspect the run summary and the `radar-<run-id>-<attempt>` artifact: `radar/latest.json` includes review outcomes and immutable README evidence URLs/hashes. Confirm intended additions in the candidate `data/github.json` and README.
6. Run `mode=sync`, `limit=5`, `publish=true` to publish. This performs a **fresh review**, not promotion of the previous preview snapshot; results may differ. Check the published commit and deployment.
7. Finally add repository **Actions variable** `RADAR_ENABLED` with value `true`. Set it to `false` to pause schedules. Scheduled runs process the pending queue within the runtime and daily request budgets below.

Repository, README and code search use the workflow's built-in `GITHUB_TOKEN`. Code-search access failures are reported as a partial source; they never mean there are no integrations. The local env file is not uploaded or read by the Action. A local TypeSafe key does not automatically configure GitHub Secrets.

### Processing and budgets

1. Metadata refresh runs independently. Discovery only fills missing legacy identities before URL/numeric-ID deduplication; it does not refresh statistics or require a fresh Top100.
2. Search six focused GitHub repository/README queries and four code queries for the API endpoint, SDK package, API-key variable and model identifier; at most two pages of 100 results per query and per run. Persist each query's next page; GitHub search exposes at most the first 1,000 results per query. This is bounded discovery, not a full GitHub crawl.
3. Deduplicate by normalized GitHub URL against the GitHub project store. Do not rename existing IDs or overwrite editorial content.
4. Process eligible queued candidates without a 20/60-project cap (manual preview limits: 5, 60, or 2,000 attempted candidates, also bounded by runtime and request budgets). First-time candidates and due rechecks alternate 1:1. First-time candidates use discovery time; rechecks use retry time. Ties use code evidence, stars and stable repository name. An empty lane yields its capacity to the other lane. Stars only affect review order, not admission, and saved candidate stars carry that priority across runs. The CLI allows 25 minutes per run; unfinished candidates remain pending. Read the repository metadata and a README pinned to the current commit SHA. README and up to three code-search-hit files are read at that pinned commit and sent in lossless bounded segments. Code evidence is limited to 128 KB per file, excludes dependency/generated/secret paths and verifies the Git blob hash. Missing/oversized/inaccessible matched code is explicitly incomplete, never automatic approval. A missing README can use integration evidence instead. Repository code is never executed.
5. Require an explicit TypeSafe provider marker and Jev/System One context; defer missing evidence or obvious instruction-override patterns to `review` without a paid call. Then ask `jev-latest` via [TypeSafe's evaluation API](https://docs.typesafe.ai/api) for `about` (Noul), `keep` (Choice), and the GitHub project’s primary `category` (Choice) in the same request. Use the model's category choice, including an explicit `other`; do not apply the stricter admission confidence thresholds to navigation labels. Treat README and code contents as untrusted evidence, not instructions. Code search does not require Jev in the repository name; indexed default-branch matches are discovery hints, not proof of quality.
6. Accept only `jevKeep=keep`, **`jevAbout >= 0.9`**, and **`jevKeepConfidence >= 0.9`**. These are conservative initial routing thresholds, not calibrated accuracy guarantees. The text-pattern guard is not complete prompt-injection protection: a crafted repository can still mislead a relevance model. Preview additions before enabling automatic publishing; never interpret admission as a security endorsement. Jev does not write prose: new summaries use the GitHub description or a neutral fallback.
7. Low-confidence and `review` outcomes remain queued for seven days; high-confidence `drop` outcomes are retried after 30 days while their cache entries are retained. Errors use 1/2/4/7-day backoff. A Jev service/authentication failure ends further reviews in the current run; remaining candidates stay queued.
8. Generate README project sections and project-count badge from the same data. Existing prose outside `PROJECTS` and `PROJECT_COUNT` markers is protected. Categories use the stored Jev choice shared with the website; `directories` is a distinct primary choice for repositories indexing multiple projects or resources, while `resources` holds guides and examples; `other` explicitly marks insufficient classification evidence. Listing an external directory never imports its entries automatically. Ordering is by stars and repository name.
9. Validate the snapshot against the original checkout, run tests, catalog checks, lint and build, then publish data, README and radar state in **one commit**. A failed validation cannot publish.

核心状态使用 version 2，兼容读取 version 1。
候选仍保留一个 map，不另建生命周期数据库。
pending 最多 2000，候选与残页合计最多 4000。
4000 是有限存储保护，不是永远不会满的保证。
review 保留七天，drop 保留三十天。
error 继续采用 1/2/4/7 天退避。
只淘汰原规则允许的终态 drop 缓存。
不删除 pending/review/error 来制造空位。

每次搜索前预留 100 个总容量槽。
pending 已满时停止发现，已有审核继续。
已观察页面的剩余导航保存为 pendingSearchPage。
缓冲只保存仓库、数字 ID、星数与最多三条代码线索。
不保存 README、源码、响应正文或密钥。
先回灌残页，再发起新搜索。
整页已入队或身份去重后才推进页码。
池满、缓冲剩余与 GitHub 搜索上限分别报告。

nextReviewLane 保存下一审核组。
候选实际尝试结束才切换组。
预算或期限中断恢复原状态，不虚记审核次数。
核心整轮 25 分钟，发现阶段最多五分钟。
两个阶段复用同一个 GitHub client。
替代实现显式保持独立的 2000 总容量。

Radar permits **2,000 actual Jev HTTP attempts per UTC day**, including retries; requests are reserved before sending. Its counter is restored from a trusted same-workflow Actions artifact and uploaded even for previews, with seven-day retention. PR/Issue review and alternatives discovery each have a **separate 2,000-attempt daily budget**: three domains permit up to **6,000 attempts per UTC day**, not a shared 2,000. This counts HTTP attempts including retries, not successful reviews, tokens or money; explicit local audit/backfill commands are outside these scheduled counters. Exhausting radar time or requests defers remaining candidates rather than rejecting them. Abrupt runner loss before artifact upload can lose the latest counter checkpoint; this is not a provider-enforced billing cap. No additional version-fingerprint cache is used: reviewed versions and evidence are audit records, while the existing 30/7-day delays prevent routine repeat review.

### Permission and failure boundaries

- **scan**: read-only GitHub permissions; TypeSafe secret exists only in the collection step. No dependency installation and no remote repository execution.
- **validate**: read-only permissions, no TypeSafe secret. Dependencies install with `--ignore-scripts`; tests and build run against the exact collected snapshot.
- **publish**: sole job with `contents: write`; `actions: write` only dispatches main validation after a published snapshot; no TypeSafe key or Cloudflare deployment token. Revalidates the data-only snapshot before committing; if main advanced, installs dependencies in an isolated worktree and fully verifies the merged result before a normal push.
- Actions are pinned to commit SHAs. A concurrent maintainer/collector commit causes a safe non-fast-forward push rejection; never force-push or overwrite it. Try the retained snapshot on current `main` using the no-paid-call recovery below before starting another scan.
- Snapshots are retained as Actions artifacts for **14 days**. `radar/state.json` stores cursors and pending/rejected candidates; `radar/latest.json` stores the latest run's outcomes. These files are not imported into the website.
- A missing key fails the scan before discovery or file changes. Mid-run Jev errors cannot admit candidates; metadata updates and queued outcomes can still publish with `status=partial`.
- Roll back an unwanted published update by reverting that bot commit, not resetting branch history. Disable `RADAR_ENABLED` before investigating repeated bad additions.

### Rate limits and budget recovery

共享 GitHub client 按响应资源维护 primary 配额。
search/code_search 暂停不封死可用的 core。
GraphQL primary 暂停只约束 GraphQL 资源。
阶段期限不重置共享请求预算或 secondary 状态。
secondary 等待、整轮期限和认证失败不能绕过。
完整遵守 Retry-After/reset，不缩短服务端等待。
搜索网络故障与 5xx 记录来源失败，已有审核继续。
已知 401 与 JSON 格式错误不降级为阶段截止。
坏响应与认证失败保留严格停止边界。
Retry-After 或未知限流正文采用全局暂停。
primary/secondary 不单凭 403 或 429 区分。
响应体读取也受阶段与整轮截止约束。
未知错误不解释为“没有结果”。

独立统计以 checkout 的基线 SHA 和目录集合为范围。
每批最多 50，每个身份每轮最多尝试一次。
默认遍历全目录，不再截断其它 1000 项。
这是请求批次选择，不是 GitHub 的项目数量限制。
GITHUB_TOKEN GraphQL 基础额度是每仓库每小时 1000 点。
实际响应头决定本轮剩余额度。

明确不可访问的对象保留旧行与旧统计。
不删除、清零或标记为 fresh。
身份错配、坏字段与未知响应撤销本轮统计增量。
只上传 diagnostic，校验器拒绝将其应用为快照。
限流或期限保留已完成批次，允许安全 partial 发布。
报告区分 attempted/fresh/unavailable/deferredRemaining。
成本缺失记为 unknown，不制造零成本。
Top100 新鲜度仅作报告，不再阻断其它安全数据。
这明确替换旧的“Top100 全成功才可继续”规则。

`radar/metadata-state.json` 独占统计续点。
`radar/metadata-latest.json` 独占本轮统计报告。
初始报告为 not-run，不编造时间或刷新成功。
核心 v2 不继续写 metadataCursor/metadataNext。
迁移命令从排空后的最新 v1 状态复制统计续点。
并发 main 新增项目保留，但不冒称已被本轮刷新。

数字 ID 认定仓库对象，Node ID 仅作查询地址。
旧行由 API 建身份基线，之后不按旧名称认定对象。
返回 URL 与名称必须一致，数字 ID 不得替换。
28 条历史种子只服务旧行，不扩展人工改名白名单。
首次基线不能追溯此前已被重占的名称。
发现端的 legacy bootstrap 只补身份，不改统计。
改名后的已收录仓库不再次入队或付费审核。

依据：[GraphQL limits](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api)。

Radar/alternatives recovery checks trusted attempts and their jobs, including previous attempts of the current run. It orders by actual collect completion, not the run's creation order. An executed same-UTC-day collect with a missing/expired budget artifact blocks further paid work instead of falling back to an older counter; a skipped scan or verify-only run does not. The next UTC day resets the daily accounting. Unfiltered workflow history is bounded to 10,000 runs, attempts to 100, and jobs/artifacts to 1,000 per queried endpoint; exceeding a bound fails closed. This uses the workflow's serial execution order, not a transactional or exactly-once ledger. Runner loss before upload remains an unknown outcome requiring investigation, not permission to reset today's allowance.

### Recover a validated snapshot without another model call

1. Download the retained `radar-<run-id>-<attempt>` or `alternatives-<run-id>-<attempt>` snapshot (14-day retention), noting its source SHA. Use a clean checkout of current `main`; do not overwrite unrelated local data.
2. Run `node --experimental-strip-types scripts/radar.ts --apply /absolute/path/to/snapshot` (or `alternatives-radar.ts`). This path runs before key checks and makes no model call. It protects existing row identity/editorial content and README's outside-marker prose; unrelated code changes can be compatible, conflicting catalog changes safely reject application.
3. Re-run typecheck, offline tests, categories/data checks, lint, build and `npm run test:delivery`, then review the diff before normal publication. Never bypass a conflict, force-push, or call a replay an already-approved new source revision. Automatic conflict-aware receipt promotion is not implemented.

### Latest-main publication

All three collectors call `scripts/publish-data.ts` after their original validation. It fetches current main before committing. With no new upstream commit, it regenerates sitemap and uses the already-validated fast path. When main advanced, a detached temporary worktree starts at that latest commit and `publication-merge.ts` overlays only the difference between the collection baseline and this run's result. Latest-main order, unrelated additions, human descriptions/README prose and source withdrawals are retained; catalogs only update permitted scalar/identity fields and add reviewed projects. Concurrent differing news edits retain the entire main record. Conflicting established GitHub identities or an independently advanced same-collector checkpoint are real conflicts, not silently overwritten.

README and sitemap are regenerated from the combined snapshots, rather than text-merging generated files. Discovery publication never re-reads Top100. Metadata publication keeps the original baseline coverage report; no paid model review is repeated. The merged worktree runs typecheck, tests, catalog/news/category checks, lint, build and zero-skip delivery checks. Only that collector's owned paths are committed. A normal push racing with another main commit restarts overlay/validation, up to three attempts. Permission/network failures with unchanged main and validation failures stop without publishing. No force-push, blanket old-snapshot copy, or reset/rebase of the caller's checkout is used. Temporary worktrees are owned and removed by the publisher; the CLI allows real publication only in Actions.

Collectors retain independent workflow groups. Radar, alternatives and metadata publish jobs share jev-data-publish with cancel-in-progress=false and queue:max. Only publication is locked; scanning and paid review are not. News sync, intake merge and human pushes remain outside this lock. The common publisher supplies conflict recovery. Publication jobs allow 45 minutes for bounded rebuilding; continuous contention can still fail safely and leave the original radar artifact available for diagnosis. Offline local Git tests cover all collector modes, including a real push rejection and retry; they are not a claim that the new code has already run in remote Actions.

## Independent open-source alternatives

Workflow: **Open-source alternatives radar**, `.github/workflows/alternatives.yml`. It uses the existing `TYPESAFE_API_KEY` secret and GitHub's built-in `GITHUB_TOKEN`; no second key is required. Its schedule is `41 3,9,15,21 * * *` UTC (planned Beijing times 05:41, 11:41, 17:41, 23:41, subject to GitHub delays), staggered from the core radar, and is gated by repository variable `ALTERNATIVES_ENABLED=true`. A manual `mode=validate` makes no paid calls; `mode=sync` creates a preview unless `publish=true` is selected. Keep the variable disabled until a preview snapshot is reviewed.

The Action searches GitHub topics `system-one` + `decision-model` and `typed-decisions`, using persisted page cursors. This discovers projects such as [AnyJev](https://github.com/nokia-applied-research/AnyJev) and [laya-mlx](https://github.com/mizorewww/laya-mlx) without requiring `jev` in their names. Topic matches are only leads, not approvals. For each new public, non-fork, non-archived repository it fetches metadata and a complete README pinned to a commit, requires a declared open-source license and typed/probabilistic decision context, then asks Jev whether the repository itself implements a useful independent alternative. The same conservative 0.9/0.9 admission thresholds apply, **and** Jev must choose `alternatives`. A positive decision does not certify API compatibility, benchmark claims, license compliance or runtime behavior. Missing/ambiguous evidence stays in review rather than appearing publicly.

Its state and receipts live in `radar/alternatives-state.json` and `radar/alternatives-latest.json`; it never writes the core `radar/state.json` or `radar/latest.json`. It does **not** refresh all catalog metadata; the independent metadata workflow owns that work. It writes append-only additions to `data/github.json` and regenerates README in the same validated commit. Known catalog URLs are skipped, even when previously listed in another category; reclassifying an existing entry is an explicit curator edit. A concurrent commit from another collector causes a safe non-fast-forward failure, not a forced merge. The Action has its own 2,000-HTTP-attempt-per-UTC-day budget artifact, independent of the core radar and submission bot budgets; this is a local safety cap, not a TypeSafe billing allowance.

To enable after inspecting a preview: open **Actions → Open-source alternatives radar → Run workflow**, select `mode=sync`, leave `publish=false`, and inspect the `alternatives-<run-id>-<attempt>` artifact plus run summary. Then repeat with `publish=true` for a fresh reviewed snapshot, verify the resulting commit/deployment, and set repository Actions variable `ALTERNATIVES_ENABLED=true`. Set the variable to `false` to pause scheduled collection. The local equivalent is `node --experimental-strip-types scripts/alternatives-radar.ts /absolute/path/to/snapshot`; it requires exported `GITHUB_TOKEN` and `TYPESAFE_API_KEY` and never loads `.env.local` automatically.

The separate local **existing-catalog audit** is `npm run alternatives:audit`. It screens every stored GitHub project in eight-item Jev metadata batches, then fetches pinned README evidence for the broad shortlist and reuses the Action's license gate, alternative-evidence guard, full-evidence Jev review and conservative decision threshold. Metadata screening can miss a genuine alternative; `review` means uncertain or unavailable, not rejected. This is not a generic “open-source project” label: only an independently implemented Jev-like typed probabilistic decision system can qualify. There is no arbitrary per-run item cap; the paid Jev API and GitHub API still impose real availability, rate and cost limits. Progress and evidence receipts are atomically saved in gitignored `alternatives-audit.json.local`, without keys or source text. The script reads a local `.env.local` key and a `GITHUB_TOKEN` environment variable or authenticated `gh` CLI; unlike Actions, it never writes catalog data automatically. Changing project identity/title/summary invalidates the local checkpoint; move it aside before a fresh scan. Review the report, make explicit category edits, then run `npm run readme:sync` and `npm run data:check`.

## Local commands

```bash
npm test                 # No network or real keys
npm run categories:check # Every GitHub entry has a valid stored category
npm run categories:classify # Explicit local Jev backfill; reads gitignored .env.local
npm run data:check       # Full catalog validity and README freshness
npm run readme:sync      # Regenerate only README's marked regions
npm run build            # Includes full-catalog OG image count
```

For an explicit local network scan, export `GITHUB_TOKEN` and `TYPESAFE_API_KEY` in the shell, then run `npm run radar:scan -- /absolute/path/to/snapshot`. The scanner does **not** load `.env.local`. Inspect the snapshot before applying it with `node --experimental-strip-types scripts/radar.ts --apply /absolute/path/to/snapshot`; do not apply over unrelated uncommitted data changes.

The category backfill uses `npm run categories:classify -- --limit=8` to process at most eight missing GitHub rows per explicit local run; `--force` reclassifies existing values and `--dry-run` still makes paid calls. The first pass uses only title, summary and stored GitHub topics. For a second pass over `other`, use `GITHUB_TOKEN=... npm run categories:classify -- --only-other --with-readme`: this reads the full README at a fixed commit through the same GitHub evidence reader as radar, uses current repository topics ahead of stored tags, evaluates all bounded segments, and records the pinned evidence SHA/URL. If GitHub README evidence is unavailable, it falls back to title, summary and stored topics; this does not claim the README was checked. Jev 403 responses keep the previous category, and three consecutive 403s stop the pass. Each successful eight-item batch is saved atomically, so an interrupted run resumes without repeating projects whose README was already reviewed. Curators may correct clear misclassifications from actual repository metadata and README; do not fabricate a model score or lower admission thresholds to force a category. The scheduled radar does not run this backfill: new candidates receive their category in the existing Jev review request, and verification rejects a missing/invalid category.

The older `npm run score:sources` command remains an **explicit GitHub-only manual scoring tool**. It can read the developer's gitignored `.env.local` or `.env`; the Action does not invoke it. `--limit=20` bounds paid reviews; `--only=github` and `--only=all` address the same GitHub store. Flags `--dry-run` (still makes paid API calls) and `--force` are supported. It writes scores, never deletes records; it is not the radar's admission gate.


## Submission review bot (Issues and pull requests)

Workflow: **Jev submission review**, `.github/workflows/submission-review.yml`. It posts one updatable `github-actions[bot]` comment titled **Jev 收录审查**. It does not merge PRs, close requests, or write catalog data.

Website submissions open `.github/ISSUE_TEMPLATE/submit-project.yml` directly. The form requests one repository, purpose and same-repository evidence, and preserves the `[Submission]` prefix; no new label or workflow permission is required. The Issue parser considers every GitHub repository link in the submitted body a candidate, so do not add unrelated repository URLs to template instructions or evidence. Contributors who make actual catalog changes use the PR template and existing checks in `CONTRIBUTING.md`; neither template changes the admission policy or publishes data. GitHub loads these templates from the default branch, so the website link and template must be published together.

`scripts/submission-entry.test.ts` verifies the header's selected template, localized names, automatic Issue recognition and same-repository deduplication without creating an Issue or calling Jev. The YAML was parsed locally; the production-built header was checked in native Safari at 320px and 1280px in light and dark themes. The hosted GitHub form itself can only be checked after the template reaches the default branch.

- **Automatic Issue review:** open/edit/reopen a `[Submission]` issue, or apply the `submission` label; include canonical GitHub repository URLs. Ordinary bug reports are ignored.
- **Automatic PR review:** after the existing `Jev site delivery` PR checks finish, inspect the current open PR through the API, even when those checks found a formatting problem. Draft PRs and PRs without GitHub catalog changes are ignored. Forks may need GitHub's first-contributor workflow approval before that initial CI runs. An hourly sweep at minute 43 catches missed events and interrupted reviews; GitHub schedules may be delayed.
- **Manual review:** maintainers with repository write/maintain/admin permissions comment exactly `/jev review`, or use **Actions → Jev submission review → Run workflow → number**. No separate bot account, Copilot subscription or new secret is needed.
- **PR extraction:** compare submitted JSON against its merge base, not the latest catalog, so only the actual added projects are considered. GitHub's Contents API omits the body of JSON files over 1 MB; the bot reads the Git blob by the SHA returned for that same revision instead. This avoids the Contents response limit, but the reviewer still caps each catalog JSON revision at the shared **16 MiB decoded-byte** bound in `catalog.ts`. `data:check` also runs inside every production build; it warns at 90% and blocks publication from 95%, preserving migration headroom; oversized input reports a maintainer-required error instead of automatic retries or "no new projects." This is our resource bound, not a GitHub or Workers file-size limit. Base64 is size-bounded, GitHub line-wrapped content is accepted, and the decoded byte count must match the API metadata. Do not restore the rejected `items.json` / `part-*.json` shards as a workaround. Old `items.json` / `part-*.json` submissions can still be reviewed for their repository URLs (ignoring the obsolete `openIssues` field only during extraction) but receive a migration notice; the official catalog validator remains strict. Already listed projects are reported without another Jev call.
- **Reports:** show the UTC date, project, recommendation, necessary next step, pinned evidence link, input fingerprint and submission version. The visible binding distinguishes a new PR head from an older recommendation. Maintainer commands, cooldown rules, model scores and operational details stay in this guide rather than the public reply. Missing context is distinct from a low model score; HTTP failures are not rejections. Do not invent detailed defect explanations from confidence alone. Human assessment can consider other evidence; this bot is not a runtime or security certification.
- **Budget:** at most 10 submitted projects per request run, 100 project-review admission slots per UTC day across this bot, and a 10-minute per-request cooldown. Oversized requests are asked to split; exhausted global budget is visible in the Actions summary and retried by later sweeps. Slots are reserved before paid calls, so failures also consume the reservation. Every HTTP attempt (including retries) is also reserved in the same bot comment before sending it; the PR/Issue reviewer shares a daily ceiling of 2,000 Jev HTTP attempts across all submissions (UTC reset, 08:00 Asia/Shanghai), with no per-project HTTP-count ceiling. Every attempted request, including failed attempts, consumes a reserved slot; exhausted reviews resume on a later UTC day. A ten-minute execution deadline saves unfinished work for a later run; the project-admission guard and command cooldown remain to limit submission abuse. Whole-project batches make one HTTP attempt at a time; confirmed HTTP failures can be retried by later runs, while unknown outcomes require maintainer authorization. Splitting increases Jev usage, not just Actions runtime. This is separate from the discovery radar budget, not a limit on refreshing existing GitHub statistics.
- **Cache:** unchanged submissions reuse the report; existing-catalog membership, reply language and review-policy changes invalidate that cache. Withdrawing all candidates invalidates the old report immediately without resetting its daily reservations or making a paid call. Maintainer commands can request a fresh check after cooldown. Interrupted/API-error reports retry after cooldown; automatic retries reuse completed project results from the same submission fingerprint. A low-confidence result is not repeatedly sent to the model until it passes: it waits for changed submission evidence or an explicit maintainer request.
- **Security:** every review run checks out trusted `main`, never a PR head; no PR artifacts, remote build scripts or dependencies are executed. Repository content is untrusted text. TypeSafe credentials are scoped to the review step. Reviewer permissions remain `contents: read`, `pull-requests: write`, `issues: write` for comments and `actions: read` for checkpoints. The separate intake workflow is the only submission writer; neither workflow submits GitHub approving reviews. The command handler checks the comment author's repository permission. Only genuine `github-actions[bot]` reports are accepted as cache/budget records.
- **State/concurrency:** the bot stores its cache and daily reservations in its own comments and serializes runs globally. GitHub can replace pending concurrency runs; the hourly sweep recovers skipped submissions. Do not delete bot reports during the current day: deletion also removes their budget ledger. Disable this workflow in Actions to pause submission review; `RADAR_ENABLED` controls the separate discovery radar only.

All external project fetching and model calls run on GitHub-hosted Ubuntu runners, not on the maintainer's local computer. Tests use simulated clients and never load `.env.local`.

Public review replies default to English. A deterministic heuristic uses the PR/Issue title and body to select Chinese when Chinese prose predominates; code blocks, URLs, HTML comments and Markdown headings are ignored. Ambiguous or other-language submissions fall back to English. Maintainer commands do not select the reply language. All result labels and action notes follow the selected language; no additional model call is used for language detection.

### Admission policy and score limitations

The current automatic threshold (`MIN_ABOUT = 0.90`, `MIN_KEEP_CONFIDENCE = 0.90` in `scripts/jev-client.ts`) is a conservative implementation choice, not an empirically calibrated quality standard or a measured probability of correctness. Relevance asks whether the resource substantially concerns TypeSafe Jev/System One; the separate keep judgment asks whether the supplied evidence supports useful directory inclusion. High relevance alone does not establish the latter.

- Initial README recommendations and discovery radar require `keep` and both thresholds; their `drop` needs confidence at least 0.90. Whole-project follow-up uses the separate atomic-evidence policy below, only after complete coverage. API failures are not rejection decisions.
- SDKs, curated directories, research, demos, integrations and educational resources are eligible. There is no minimum Star count and no mandatory direct API call or runtime certification.
- A maintainer may accept a relevant, useful resource after checking concrete evidence even when the automatic threshold was not met. Low confidence alone is not a reason to reject it. The review bot only advises; the separate intake controller enforces explicit approval before writing catalog entries.
- Before changing thresholds, compare decisions against a human-reviewed sample. Do not lower them merely to make individual submissions pass.

### Whole-project cloud review and checkpoints

**No review-state Git branch is used.** The workflow keeps atomic JSON checkpoints in `$RUNNER_TEMP/jev-review-state` and uploads them as a GitHub Actions Artifact, including after handled failures. Only checkpoints from this repository's same review workflow on `main` are eligible for restoration. Fork/PR artifacts and other workflows are never restored. A failed restore stops the run rather than silently discarding paid progress.

1. The initial check still handles clear short README cases. Missing, oversized or uncertain README evidence falls through to whole-project scanning rather than being rejected. Completed initial decisions are cached too.
2. The scanner pins a commit and walks non-recursive Git trees directory by directory. It does not assume a truncated recursive tree is complete. All project-owned text files, including uncommon source extensions, tests, fixtures, docs and configuration, are eligible. There is **no eight-file selection or total file-count cutoff**. Dependency/build directories, common binary formats, credentials, symlinks and submodules have explicit exclusion reasons. No external links, dependencies or LFS objects are downloaded; repository code is never run.
3. Text is split without loss into segments bounded by 8,000 serialized UTF-8 bytes. Requests batch up to eight segments, with at most 24,000 bytes of serialized state, leaving context room for questions. Eight is a request-packing limit, not a project coverage limit. These conservative byte bounds are not claimed to be exact token counts.
4. Each segment gets separate typed questions about Jev relevance, concrete usefulness, mock-only behavior, contradictory evidence and reviewer-directed instructions. These are evidence questions, not independent whole-project acceptance votes. Returned values are validated and stored with file offsets, line ranges and model version. Atomic checks pin `jev-1.13.0` rather than allowing a moving alias to mix model versions across resumed batches; its ID is part of the task identity.
5. No deep-review verdict is emitted before the eligible inventory is fully processed. An unfinished scan is `pending`, not rejection. With full coverage, a segment meeting relevance/usefulness >= 0.90 and mock-only < 0.50 supports inclusion; conflict or injection >= 0.50 blocks it. Absence of confident support means review; only uniformly very low relevance (<= 0.10) permits an unrelated result. These thresholds are provisional policy choices, not an empirically calibrated quality guarantee. SDKs, integrations, directories, demos and educational material are eligible without a mandatory direct API call.
6. Oversized single blobs (over 8 MiB), unsupported encodings, LFS pointers or unsupported entries are recorded as coverage limitations, never silently counted as checked. Explicit incomplete-tree/API errors cannot produce approval. This is an inclusion-evidence check, not a runtime/security certification.

**Resume and lifecycle:** the task identifies the repository, pinned commit, policy and project context. Completed segment results are reused; unfinished tasks continue on their pinned version even if upstream advances. A completed receipt is invalidated by a new commit or changed project description/context. Manual review does not resample an unchanged completed task merely to obtain a higher confidence value.

- Per-project request allowance, daily HTTP allowance, a ten-minute run work deadline and a per-project API-operation slice yield unfinished tasks for later hourly runs. These are scheduling limits, not permanent file exclusions.
- Every Jev HTTP attempt is reserved in the bot's daily ledger before sending. An in-flight marker is written before the request and results are checkpointed afterward. Unknown outcomes (network loss or invalid success response) pause for explicit maintainer retry instead of automatically charging again. A successful remote response followed by abrupt runner loss before Artifact upload can still lose the latest local progress: **exactly-once billing is not guaranteed**.
- Completion compacts working progress into a receipt: verdict, pinned evidence links, coverage counts, manifest fingerprint, limitations and model versions. No downloaded source text or secrets are stored in the Artifact.
- Artifacts expire automatically after seven days. Each run carries forward live checkpoints; receipts and abandoned tasks untouched for thirty days are pruned locally before the next snapshot. Disabling the workflow beyond Artifact retention can lose resumable progress. There is no branch to merge, delete or accumulate in Git history.

The workflow keeps `contents: read`; `actions: read` is for restoring verified checkpoint Artifacts. It never writes catalog data or merges PRs. Standard public-repository runner minutes are free, but Artifact storage and Jev API usage are separate resources ([GitHub billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)). The 2,000-attempt daily limit applies independently to the PR/Issue reviewer, core radar and alternatives radar (6,000 combined). The core radar has a 25-minute work boundary. Comment writes are serialized at least one second apart; a successful pre-request budget write remains mandatory. A dynamic UTC-day check before and after persistence stops paid work across midnight without rewriting the old ledger; a later run resumes under the new day. GitHub content-write limits can stop review before the Jev daily allowance is reached; this is not a promise to complete 2,000 calls per run. See [TypeSafe model context limits](https://docs.typesafe.ai/models) and [typed API questions](https://docs.typesafe.ai/api).

### TypeScript scripts and tests

All collector/reviewer scripts and offline tests use `.ts`. Run `npm run typecheck` for strict TypeScript checks and `npm test` for offline regression tests. CI runs both. Node 24 executes erasable TypeScript directly with `--experimental-strip-types`; no emitted JavaScript or new runtime dependency is needed. Runtime execution does not replace static type checking ([Node documentation](https://nodejs.org/api/typescript.html)). The root `.node-version` selects the same LTS major for GitHub Actions and local builds.

Discovery receipts retain the reviewed commit, model, timestamp, typed scores and evidence hash. Code-match evidence also records pinned file links and per-file hashes. Accepted entries keep their receipt under `sourceMeta.jevEvidence`; unaccepted candidates keep `lastReview` in `radar/state.json`, so the next `radar/latest.json` does not erase the last basis. No secret values or downloaded source text are persisted. Code search is bounded and subject to GitHub indexing and API limits, not exhaustive coverage ([GitHub search API](https://docs.github.com/en/rest/search/search#search-code)).

### Homepage data timestamp

The homepage uses the newest Git commit touching `data/github.json` or `data/news.json`, shown on one line in Asia/Shanghai time. Either source advances it; UI-only commits do not. Production builds first restore shallow Git history using `npm run build:history`; failure stops the build instead of publishing a fabricated time. Dirty local data or unavailable history hides the label.

## Conditional submission intake

**Jev submission intake** runs `scripts/submission-intake.ts` from trusted `main`. It has no TypeSafe key, calls no model and never executes a submitted repository or PR head. Review/site completion and an hourly sweep trigger processing; workflow dispatch selects a request but does not approve it.

- **Automatic:** the latest genuine reviewer report must match the current submission version, membership-sensitive fingerprint and policy. All new candidates must be `keep`: shallow decisions need their original passing score; whole-project decisions need non-empty complete coverage with no blocked files. Pending, failed, conflicting or instruction-like evidence does not publish. Older shallow reports without scores stay pending; `/jev review` can restore a completed task's genuine receipt without inventing scores.
- **Agent-assisted approval:** use the project [Awesome JEV review skill](../.agents/skills/awesome-jev-review/SKILL.md) for a complete `Needs review` result. The Agent checks the pinned source and selects an existing primary category, then the trusted, local-only `scripts/submission-agent-review.ts report.json assessment.json` emits a comment draft. Its first line is `/ok`; the independent JSON receipt carries `OK`, category, candidate/commit, concrete evidence, a short assessment, input version, reviewer comment ID and SHA-256 of the exact report body. It is not a fabricated Jev `keep`. A skill is guidance for an available Agent, not a newly deployed cloud service. It defaults to a draft; posting it requires explicit authorization because it can start the entire intake chain.
- **Human authority:** only current write/maintain/admin collaborators can authorize intake. A full `/ok` draft from such an account supplies both category and explicit approval. A bare `/ok` may consume the latest prior, authorized Agent receipt; an absent, invalid or stale receipt does not silently select `other`. Both receipt and approval must postdate the report; an independent receipt edited after a bare approval requires a new approval. Receipt identity/content/time/publisher are also bound in the intake signature and PR audit; report/input/source changes invalidate consent. The historical exact `/jev include <category>` command remains compatible. Manual intake still applies only to one new, fully scanned candidate with `insufficient-provider-context` or `insufficient-usage-evidence` (or genuine keep), never incomplete, conflicting, instruction-like, failed or explicitly rejected results. The controller rechecks actual repository permission before merging; labels, association, @-mentions, quoted commands, conversational OK and visitor-written receipts grant no authority.
- **Sources:** evidence pins a commit that must still be the repository's default-branch HEAD. API-derived GitHub identity is required; alternatives also need an identified open-source license. New rows retain GitHub metadata and the genuine review receipt. Human acceptance never changes `review` into a fabricated `keep` score. Approval/report IDs remain in the PR audit. Missing localized editorial rationales retain the pending-rationale UI.
- **Issue:** create one `jev-intake/issue-N` data branch and PR, append to `data/github.json`, and regenerate README/sitemap. Existing rows, source, dependencies and workflows cannot be changed. Unexpected branch edits stop processing.
- **Existing PR:** only append-only data and exact generated assets qualify. Receipts and full GitHub identity must match the accepted review; new submissions cannot invent previous repository URLs. Non-catalog changes, outdated main ancestry, absent receipts/assets or changed sources wait for maintainer/contributor revision. Fork CI must be the site `pull_request` run for the current PR's source repository, branch and head SHA; when GitHub supplies PR associations, they must include the current PR number. The intake does not copy a contributor's PR into main or rewrite their branch.
- **CI:** site's PR trigger targets `main`, and its checkout pins the source head rather than an implicit synthetic merge ref. Bot-created PR event runs can require approval under current `GITHUB_TOKEN` behavior. The intake explicitly dispatches site `mode=validate` on its own data branch. After successful verification, a separate Actions-only job checks the exact `jev-intake/issue-N` ref and dispatches the existing intake number input on `main`; it checks out no code and grants no approval. Implicit completion events are not the only handoff. Only this notification job uses job-level `continue-on-error`: a failed dispatch remains visible but cannot invalidate successful verification and permanently block later sweeps. The controller still requires a completed successful run with the correct workflow ID/path/event, source repository/branch, exact head SHA, current attempt, and a successful non-skipped `verify` job: locked dependencies, quote verification and full catalog/delivery validation. Zero checks or an unrelated green run never qualify. Hourly sweeps recover incomplete handoffs, including a callback that arrives before the whole run completes.
- **Merge/recovery:** recheck consent, source HEAD, main and PR head after CI. Ordinary squash merge receives the exact PR SHA; never force push. If main advances, regenerate the bot data branch on latest main and rerun CI. The API locks PR head, not main atomically: the final read/merge race still relies on GitHub's ordinary conflict rejection and merge behavior. Do not claim atomic final-base validation. Unknown writes are not automatically retried; later runs inspect branch/PR/merged state. Ref-success/body-failure recovery requires proof of the complete generated snapshot. A failed request does not stop the remaining queue. Native PRs already merged by this repository's Actions bot may recover only the main validation dispatch, never another merge or data write. Sweeps inspect at most 20 recently updated closed PRs from the past 24 hours for merged-main validation or authenticated rejection recovery; selection is navigation, never authorization. Older or displaced cases can be selected by workflow number. Only a same-version `Jev validate: main` run counts as a requested main validation; sync-mode runs with skipped verification do not.
- **Closure/deployment:** after confirming a merged PR contains the unchanged submission, comment and close its Issue. A later sweep resumes incomplete closure. Never alter reviewer budget comments. Token-authored merges do not trigger ordinary push Actions, so main validation is explicitly dispatched. Cloudflare deployment is separate evidence, not implied by branch CI.

### Explicit mismatch and unmerged-branch cleanup

The negative path reuses the positive path's **latest genuine report/current version/fingerprint** binding. Only a completed, non-empty, fully covered whole-project `drop` with `reason=unrelated-evidence`, zero blocked files and unchanged upstream source HEAD qualifies. Every candidate must meet that condition; mixed keep/review, existing listed projects, shallow drop, missing coverage, errors, unknown outcomes and pending scans do not close a PR. The current shallow `drop` contract can mean “not useful enough,” not necessarily “unrelated,” so it is intentionally excluded.

- Only non-draft PRs into this repository's `main`, with append-only `data/github.json` and exact generated README/sitemap, qualify. Source edits, old-row edits or unrelated README changes stop automatic rejection. A source Issue can reject its existing, unchanged-version bot-created data PR; rejection does not invent a PR just to close it, and does not close the source Issue. An Issue without a PR keeps its report for follow-up.
- Before closure, the controller persists an independent bot rejection receipt binding source request, report signature, PR head/repository/ref and decision. It rechecks current report/source/head before closing. Recovery requires an actual last `closed` event by `github-actions[bot]`, after that receipt; a human closure or mere pre-close intent is not deletion permission. Reviewer budget comments are never changed.
- Fork branches are not managed. A same-repository branch is eligible only if it is neither `main` nor the default/protected branch, still points to the original rejected head, and complete bounded enumeration finds no other open PR using it as head or base. Errors/incomplete enumeration preserve the branch. The isolated deletion capability emits only GraphQL `updateRefs` with that immutable `beforeOid`, zero `afterOid` and `force=false`; the general GraphQL client remains read-only. Before the single deletion attempt, an attempt marker is persisted. Unknown writes are read back, not blindly repeated or retried with a newer SHA. If an attempt was recorded but the ref is still present, automatic deletion stops for maintainer confirmation: OID alone cannot distinguish an unchanged ref from a deleted-and-restored ref at the same SHA. A crash after recording the attempt but before sending it can therefore leave cleanup pending; this favors preservation over a second destructive request. See [GitHub expected-OID ref updates](https://docs.github.com/en/graphql/reference/git#updaterefs).
- Confirmed cleanup is marked terminal on the bot's own rejection comment. A later manual restoration of the same branch/SHA is not repeatedly deleted. The hourly sweep can recover recent interrupted closures/deletions; older cases need a targeted dispatch. Completed rejected PRs are not automatically reopened or recycled into a new intake PR.

**Race boundary:** GitHub's [PR close API](https://docs.github.com/en/rest/pulls/pulls#update-a-pull-request) does not accept an expected head. A push between the final read and closure can therefore leave a newly changed PR closed; the subsequent checks retain its branch for maintainer recovery. The ref deletion CAS protects OID changes, not atomic membership of other PRs: a new PR can reuse a branch between enumeration and deletion. Do not claim closure, shared-use checks and deletion form one atomic transaction.

### Intake configuration

Use built-in `github-actions[bot]` and `GITHUB_TOKEN`; no new bot account, GitHub App, PAT, service or Jev subscription is needed. Enable **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests** for PR creation. Default permissions remain read-only; only the isolated intake job has `contents: write`, `pull-requests: write`, `issues: write` and `actions: write` (validation dispatch). Site's separate handoff job has only `actions: write`, never a catalog-writing token. Although the setting permits approving reviews, this implementation never submits them. Native auto-merge remains disabled; the controller performs an ordinary squash merge after its own gates pass.

Protect only `main` against force pushes and deletion, including administrators (`enforce_admins=true`, `allow_force_pushes=false`, `allow_deletions=false`). Keep the branch unlocked, push restrictions unset, and required PR reviews/status checks unset. This preserves normal fast-forward data publishing and intake PR merges without granting the bot a bypass. Basic protection does not enforce review or CI for every writer; intake's exact-version CI gate remains independent. Before adding required PR/CI rules, adapt the direct-to-main collectors and bot-created PR validation: GitHub does not count `workflow_dispatch` job checks toward a ruleset's required PR checks. See [branch protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) and [required-check event eligibility](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks).

An owning organization can prohibit this setting. A repository update returning HTTP 409 does not enable intake: an organization administrator must explicitly authorize and enable the corresponding organization policy first, while retaining read-only defaults, then enable PR creation for this repository. Organization API management needs `admin:org` or the appropriate Actions-policy permission; the intake token itself never needs organization administration. Do not copy a maintainer's credential into workflow secrets to bypass this policy.

Enable **Settings → General → Pull Requests → Automatically delete head branches** (`delete_branch_on_merge=true`) for this repository. GitHub owns branch cleanup after every eligible merged PR, whether merged by a maintainer or the bot; the merged path needs no separate deletion job or credentials. This setting does not reclaim closed-but-unmerged branches; the strict negative path above handles eligible rejected submissions with the same isolated built-in token. This does not delete `main`, contributors' fork branches, local copies, or the PR record. Branch protection and repository rules can prevent deletion. When clearing older merged branches, verify repository ownership, no remaining open PR use, and an unchanged merged head; use an atomic expected-SHA deletion rather than an unconditional delete. This setting is separate from Actions PR creation permission and native auto-merge. See [GitHub automatic branch deletion](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-the-automatic-deletion-of-branches).

Disable **Jev submission intake** in Actions to stop this writer while preserving review/discovery and pending PRs. Revert an unwanted inclusion instead of rewriting history. See [GitHub token events](https://docs.github.com/en/actions/concepts/security/github_token) and [the Actions PR creation setting](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository).

### Production deployment handoff

Four collectors consume the publisher's final status, site_changed and published_sha. Only published plus site_changed=true and the existing deployment switch dispatches site.yml on trusted main. State-only commits persist without dispatch. Dispatch failure remains visible and does not roll back published data. Intake keeps explicit main dispatch after a real catalog merge.

发布和部署共用六条精确状态白名单。
只允许 core/alternatives/metadata 的 state/latest JSON。
不放行 radar/**、文档、脚本或工作流。
站点变化按最终合并、生成并暂存后的真实差异计算。

已验 D 可部署，当且仅当它仍是 main，或为 main 祖先。
后者还要求 D..main 每个提交只触及白名单。
完整 Git 历史、逐提交 NUL 路径、合并父差异都须检查。
禁止 rename 折叠；数据改动再 revert 仍使旧产物过期。
Git 失败、分叉或历史不足均拒绝旧产物。
.build-sha 始终记录 D，不篡改成状态提交 R。
部署锁不构成与 main 更新的原子事务。

原生 queue:max 最多保留 100 个 pending。
它不是无限持久队列，也不保证 dispatch 时间顺序。
不得取消正在付费或部署的运行。
依据：[GitHub concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)。

## TDD 与上线边界

元数据、候选与站点交接均采用先红后绿验证。
额外复核覆盖探针、搜索故障与限流交叉组合。
部署使用真实临时 Git 验证 revert、合并与竞态。
详细证据见 [验收记录](workflow-verification.md)。

上线先阻止旧 writer 的新任务进入。
等待所有非终态旧运行完成整条发布链。
不取消付费任务；预算上传不等于 writer 已排空。
排空后读取最新状态，再运行 --migrate-state。
迁移不得覆盖等待期间新增的候选或新闻。
七条 Workflow 与全部 site 调用方原子切换。
分别验证 metadata、预算继承与 site 制品部署。
状态优化与部署新鲜度门必须同时上线或同时回滚。
site 回滚须整体恢复所有调用方和精确 CI 绑定。
v2 超过 2000 或有残页时，旧 reader 不能直接承接。
保留状态与预算，暂停 writer，优先前向修复。
不得裁剪记录或回退旧状态来恢复绿灯。
