/**
 * [INPUT]: 依赖 catalog、GitHub 取证、模型审核和 radar-budget 的可信采集能力
 * [OUTPUT]: 对外提供核心雷达状态校验、运行和快照写入
 * [POS]: scripts 的核心生态采集编排，Top100 优先、其它元数据续点刷新；仓库数字 ID 防止改名重复入队
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { readCatalog, repoKey, candidateRow, renderReadme, applySnapshot } from './catalog.ts'
import { createGitHubClient, isGitHubRunDeferred } from './github-client.ts'
import { knownGitHubIds } from './github-identity.ts'
import { bootstrapIdentities, refreshMetadata, updateMetadataTop } from './github-metadata.ts'
import type { IdentityBootstrapReport, MetadataReport } from './github-metadata.ts'
import { githubEvidence, evidenceIssue } from './github-evidence.ts'
import { evaluateJev, reviewDecision, JEV_MODEL } from './jev-client.ts'

import { CODE_QUERIES, searchCodePage, integrationEvidence } from './code-discovery.ts'
import type { CodeHint, EvidenceLink } from './code-discovery.ts'
import type { Catalog, DirectoryItem, GitHubApi, GitHubRepository, JevRow, JevScore } from './model-types.ts'
import { createRadarBudget } from './radar-budget.ts'

export interface RadarReviewOptions {
  beforeRequest?: () => Promise<void>
  attempts?: number
}

export interface Candidate { status: 'pending' | 'review' | 'error' | 'drop'; discoveredAt: string; checkedAt?: string; retryAt?: string; attempts: number; stars?: number; codeHints?: CodeHint[]; lastReview?: Receipt }
export interface RadarState { version: number; pages: Record<string, number>; metadataCursor: number; metadataNext?: string; candidates: Record<string, Candidate> }
interface Source { query: string; fetched: number; total: number; status: string }
export interface Receipt { repo: string | null; status: string; reason?: string; score?: JevScore; sha?: string; evidenceUrl?: string; evidenceSha256?: string; evidenceLinks?: EvidenceLink[]; model?: string; checkedAt?: string }
export interface RadarReport { at: string; model: string; status: string; sources: Source[]; metadata: { ok: number; failed: number } & Partial<Omit<MetadataReport, 'ok' | 'failed'>>; identity?: IdentityBootstrapReport; reviewed: number; added: number; pending: number; overflow: number; evicted: number; receipts: Receipt[]; totalProjects?: number; deferred?: { phase: string; reason: string; metadataRemaining?: number } }
export interface RadarOptions { catalog: Catalog; state?: RadarState; api: GitHubApi; review: (row: JevRow, text: string, options?: RadarReviewOptions) => Promise<JevScore>; now?: Date; limit?: number; queries?: string[]; codeQueries?: string[]; deadline?: number; clock?: () => number; metadataLimit?: number; beforeRequest?: () => Promise<void> }
interface RadarResult { files: Map<string, DirectoryItem[]>; rows: DirectoryItem[]; state: RadarState; report: RadarReport }

export const QUERIES = [
  'topic:jev fork:false', '"typesafe.ai" in:readme fork:false',
  '"Jev" "System One" in:readme fork:false', 'topic:typesafe-ai fork:false',
  '"@typesafe-ai/sdk" in:readme fork:false', '"TypeSafe" "Jev" fork:false',
]
export const MAX_QUEUE = 2000
export const RADAR_EXECUTION_MS = 25 * 60 * 1000
const DAY = 86400000
export const emptyState = (): RadarState => ({ version: 1, pages: {}, metadataCursor: 0, candidates: {} })

const isDeferredRunError = (error: unknown): boolean => error instanceof Error &&
  (isGitHubRunDeferred(error) || error.message === 'radar-budget-exhausted' || error.message === 'radar-budget-persist-failed' || error.message === 'radar-deadline')

const isTimestamp = (value: unknown) => typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value))

export function validateState(state: RadarState) {
  if (state?.version !== 1 || !state.pages || Array.isArray(state.pages) || typeof state.pages !== 'object' ||
    !state.candidates || typeof state.candidates !== 'object' || Array.isArray(state.candidates) ||
    !Number.isSafeInteger(state.metadataCursor) || state.metadataCursor < 0 ||
    state.metadataNext !== undefined && (typeof state.metadataNext !== 'string' || !repoKey(`https://github.com/${state.metadataNext}`))) throw new Error('Invalid radar state')
  if (Object.keys(state.candidates).length > MAX_QUEUE) throw new Error('Radar queue overflow')
  for (const page of Object.values(state.pages)) {
    if (!Number.isSafeInteger(page) || page < 1 || page > 10) throw new Error('Invalid search cursor')
  }
  for (const [repo, entry] of Object.entries(state.candidates)) {
    if (repoKey(`https://github.com/${repo}`) !== repo || !entry ||
      !['pending', 'review', 'error', 'drop'].includes(entry.status) ||
      !isTimestamp(entry.discoveredAt) ||
      (entry.checkedAt != null && !isTimestamp(entry.checkedAt)) ||
      (entry.retryAt != null && !isTimestamp(entry.retryAt)) ||
      !Number.isSafeInteger(entry.attempts) || entry.attempts < 0 ||
      (entry.stars != null && (!Number.isSafeInteger(entry.stars) || entry.stars < 0)) ||
      (entry.codeHints != null && (!Array.isArray(entry.codeHints) || entry.codeHints.length > 3 || entry.codeHints.some((hint) => !hint || typeof hint.path !== 'string' || hint.path.length > 4096 || typeof hint.query !== 'string' || hint.query.length > 500)))) throw new Error('Invalid candidate state')
  }
}

const safeReason = (error: unknown) => error instanceof Error && /^(github|jev)-[a-z0-9-]+$/.test(error.message) ? error.message : 'candidate-invalid-evidence'

export async function runRadar({ catalog, state = emptyState(), api, review, now = new Date(), limit = MAX_QUEUE, queries = QUERIES, codeQueries = [], deadline = Infinity, clock = Date.now, metadataLimit, beforeRequest }: RadarOptions) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_QUEUE) throw new Error(`limit must be 1..${MAX_QUEUE}`)
  if (!(deadline === Infinity || Number.isFinite(deadline)) || deadline < 0) throw new Error('radar-invalid-deadline')
  const deadlineReached = () => Number.isFinite(deadline) && clock() >= deadline
  const upstream = api
  api = async (path, request) => {
    if (deadlineReached()) throw new Error('github-deadline')
    return upstream(path, request)
  }
  validateState(state)
  state = structuredClone(state)
  const started = now.toISOString()
  const files = new Map([...catalog.files].map(([file, rows]) => [file, structuredClone(rows)]))
  const rows = [...files.values()].flat()
  const known = new Set(rows.filter((r) => r.type === 'github').map((r) => repoKey(r.url)))
  for (const key of Object.keys(state.candidates)) if (known.has(key)) delete state.candidates[key]
  const report: RadarReport & { metadata: MetadataReport } = { at: started, model: JEV_MODEL, status: 'partial', sources: [],
    metadata: { ok: 0, failed: 0, cost: 0, batches: 0, other: 0, remaining: 0, top100: { ok: 0, total: 0, complete: true, unrefreshed: [] }, resolved: [] }, reviewed: 0, added: 0, pending: 0, overflow: 0, evicted: 0, receipts: [] }
  const defer = (error: unknown, phase: string) => {
    if (!isGitHubRunDeferred(error)) return
    report.deferred = { phase, reason: (error as Error).message }
  }

  // --- Top100 在发现之前读取；其它项按规范位置续点，不改变人工排序 ---
  const metadata = await refreshMetadata(rows, state, api, metadataLimit)
  report.metadata = metadata.report
  report.receipts.push(...metadata.failures.map((failure) => ({ ...failure, status: 'metadata-error' })))
  if (metadata.deferred) report.deferred = metadata.deferred
  else if (!report.metadata.top100.complete) report.deferred = { phase: 'metadata', reason: 'github-top100-incomplete', metadataRemaining: report.metadata.remaining }
  if (!report.deferred) {
    report.identity = await bootstrapIdentities(rows, api)
    if (report.identity.deferred) report.deferred = { phase: 'identity', reason: report.identity.deferred }
  }

  const knownIds = knownGitHubIds(rows)
  const rejectedCache = Object.entries(state.candidates).filter(([, e]) => e.status === 'drop')
    .sort(([, a], [, b]) => (a.checkedAt ?? a.discoveredAt).localeCompare(b.checkedAt ?? b.discoveredAt))
    .map(([key]) => key)
  const evicted = new Set()

  // --- 每个查询每轮两页；游标轮转到第十页，显式报告 GitHub 搜索上限 ---
  for (const query of queries) {
    if (report.deferred) break
    let page = state.pages[query] ?? 1
    const source = { query, fetched: 0, total: 0, status: 'bounded' }
    try {
      for (let n = 0; n < 2; n++) {
        const data = await api(`/search/repositories?q=${encodeURIComponent(query + ' is:public')}&per_page=100&page=${page}&sort=updated&order=desc`) as { items: GitHubRepository[]; total_count: number; incomplete_results?: boolean }
        if (!Array.isArray(data.items) || !Number.isSafeInteger(data.total_count) || data.total_count < 0) throw new Error('github-invalid-response')
        source.total = data.total_count
        source.fetched += data.items.length
        for (const repo of data.items) {
          const key = repoKey(repo.html_url)
          if (!key || repo.private || repo.fork || repo.archived || known.has(key) || repo.id !== undefined && knownIds.has(repo.id) || evicted.has(key) || key === 'daftai2026/awesome-jev') continue
          if (!Object.hasOwn(state.candidates, key)) {
            if (Object.keys(state.candidates).length >= MAX_QUEUE) {
              const oldestDrop = rejectedCache.shift()
              if (!oldestDrop) { report.overflow++; continue }
              delete state.candidates[oldestDrop]
              evicted.add(oldestDrop)
              report.evicted++
            }
            state.candidates[key] = { status: 'pending', discoveredAt: started, attempts: 0 }
          }
          if (Number.isSafeInteger(repo.stargazers_count) && (repo.stargazers_count ?? -1) >= 0) {
            state.candidates[key].stars = repo.stargazers_count
          }
        }
        const lastPage = Math.max(1, Math.min(10, Math.ceil(data.total_count / 100)))
        state.pages[query] = page >= lastPage ? 1 : page + 1
        source.status = data.incomplete_results ? 'partial' : data.total_count > 1000 ? 'search-cap' :
          page === 1 && data.items.length >= data.total_count ? 'complete' : 'bounded'
        if (page >= lastPage || data.items.length < 100) break
        page++
      }
    } catch (error) {
      source.status = safeReason(error)
      defer(error, 'discovery')
    }
    report.sources.push(source)
  }

  // --- 代码搜索补充：SDK / API 端点命中，不要求项目名含 Jev ---
  for (const query of codeQueries) {
    if (report.deferred) break
    const cursor = `code:${query}`
    let page = state.pages[cursor] ?? 1
    const source: Source = { query: cursor, fetched: 0, total: 0, status: 'bounded' }
    try {
      for (let n = 0; n < 2; n++) {
        const data = await searchCodePage(api, query, page)
        source.total = data.total; source.fetched += data.count
        for (const hit of data.hits) {
          if (known.has(hit.repo) || evicted.has(hit.repo) || hit.repo === 'daftai2026/awesome-jev') continue
          if (!Object.hasOwn(state.candidates, hit.repo)) {
            if (Object.keys(state.candidates).length >= MAX_QUEUE) { report.overflow++; continue }
            state.candidates[hit.repo] = { status: 'pending', discoveredAt: started, attempts: 0 }
          }
          const entry = state.candidates[hit.repo]
          entry.codeHints ??= []
          if (!entry.codeHints.some((hint) => hint.path === hit.hint.path) && entry.codeHints.length < 3) {
            entry.codeHints.push(hit.hint)
            // 新集成证据允许提前复查旧结论；相同索引命中不会不断触发复查。
            entry.retryAt = undefined
          }
        }
        const lastPage = Math.max(1, Math.min(10, Math.ceil(data.total / 100)))
        state.pages[cursor] = page >= lastPage ? 1 : page + 1
        source.status = data.incomplete ? 'partial' : data.total > 1000 ? 'search-cap' : page === 1 && data.count >= data.total ? 'complete' : 'bounded'
        if (page >= lastPage || data.count < 100) break
        page++
      }
    } catch (error) {
      source.status = safeReason(error)
      defer(error, 'discovery')
    }
    report.sources.push(source)
  }

  const batch = Object.entries(state.candidates)
    .filter(([, entry]) => !entry.retryAt || Date.parse(entry.retryAt) <= now.getTime())
    .sort(([a, x], [b, y]) => (x.checkedAt ?? x.discoveredAt).localeCompare(y.checkedAt ?? y.discoveredAt) ||
      Number(Boolean(y.codeHints?.length)) - Number(Boolean(x.codeHints?.length)) ||
      (y.stars ?? 0) - (x.stars ?? 0) || a.localeCompare(b))
    .slice(0, limit)
  for (const [key, entry] of batch) {
    if (report.deferred) break
    if (deadlineReached()) { report.deferred = { phase: 'review', reason: 'github-deadline' }; break }
    const previous = {
      status: entry.status,
      checkedAt: entry.checkedAt,
      retryAt: entry.retryAt,
      attempts: entry.attempts,
      lastReview: entry.lastReview,
    }
    entry.checkedAt = started
    entry.attempts++
    report.reviewed++
    try {
      const { repo, sha, text: readme, evidenceUrl } = await githubEvidence(api, key, { allowFullScan: !!entry.codeHints?.length })
      if (repo.id !== undefined && knownIds.has(repo.id)) {
        delete state.candidates[key]; report.reviewed--; continue
      }
      const integration = await integrationEvidence(api, key, sha, entry.codeHints ?? [])
      const text = readme + integration.text
      if (deadlineReached()) throw new Error('radar-deadline')
      const candidate = candidateRow(repo)
      const reason = integration.incomplete ? 'github-incomplete-integration-evidence' : evidenceIssue(repo, text)
      const score = reason ? undefined : await review(candidate, text, {
        beforeRequest: async () => {
          if (deadlineReached()) throw new Error('radar-deadline')
          await beforeRequest?.()
          if (deadlineReached()) throw new Error('radar-deadline')
        },
      })
      const decision = reason ? 'review' : reviewDecision(score)
      const receipt: Receipt = { repo: key, status: decision, score, reason: reason ?? undefined, sha, evidenceUrl,
        evidenceSha256: createHash('sha256').update(text).digest('hex'), evidenceLinks: integration.links, model: JEV_MODEL, checkedAt: started }
      report.receipts.push(receipt)
      if (decision === 'keep') {
        if (rows.some((r) => r.id === candidate.id)) throw new Error('github-id-collision')
        if (!score) throw new Error('jev-invalid-response')
        const { category, ...reviewScore } = score
        candidate.category = category ?? 'other'
        Object.assign(candidate.sourceMeta, reviewScore, { jevEvidence: receipt })
        files.get('github.json')!.push(candidate)
        rows.push(candidate)
        known.add(key)
        if (candidate.sourceMeta.githubIdentity) knownIds.add(candidate.sourceMeta.githubIdentity.databaseId)
        metadata.fresh.add(key)
        delete state.candidates[key]
        report.added++
      } else {
        entry.status = decision as 'review' | 'drop'
        entry.lastReview = receipt
        entry.retryAt = new Date(now.getTime() + (decision === 'drop' ? 30 : 7) * DAY).toISOString()
      }
    } catch (error) {
      if (isDeferredRunError(error) || deadlineReached()) {
        report.deferred = { phase: 'review', reason: error instanceof Error ? error.message : 'github-deadline' }
        entry.status = previous.status
        entry.attempts = previous.attempts
        if (previous.checkedAt === undefined) delete entry.checkedAt
        else entry.checkedAt = previous.checkedAt
        if (previous.retryAt === undefined) delete entry.retryAt
        else entry.retryAt = previous.retryAt
        if (previous.lastReview === undefined) delete entry.lastReview
        else entry.lastReview = previous.lastReview
        report.reviewed--
        break
      }
      const reason = safeReason(error)
      entry.status = 'error'
      entry.retryAt = new Date(now.getTime() + Math.min(7, 2 ** Math.min(entry.attempts - 1, 3)) * DAY).toISOString()
      report.receipts.push({ repo: key, status: 'error', reason })
      // 鉴权/服务异常不继续耗用额度；其余未尝试候选仍保留在队列。
      if (reason.startsWith('jev-')) break
    }
  }
  updateMetadataTop(rows, metadata.fresh, report.metadata)
  report.pending = Object.values(state.candidates).filter((e) => e.status !== 'drop').length
  report.totalProjects = known.size
  report.status = !report.deferred && report.sources.every((s) => s.status === 'complete') && !report.metadata.failed &&
    !report.metadata.remaining && !report.pending && !report.overflow && !report.evicted && !report.receipts.some((r) => r.status === 'error') ? 'complete' : 'partial'
  validateState(state)
  return { files, rows, state, report }
}

// --- 旧报告兼容；新 Top100 诊断绝不能借残留快照文件进入发布路径 ---
function validatePublishMetadata(metadata: unknown): void {
  if (!metadata || typeof metadata !== 'object' || !('top100' in metadata)) return
  const top = metadata.top100
  if (top && typeof top === 'object' && 'complete' in top && top.complete === false) throw new Error('github-top100-incomplete')
  if (!top || typeof top !== 'object' || !('complete' in top) || top.complete !== true ||
    !('ok' in top) || !('total' in top) || typeof top.ok !== 'number' || typeof top.total !== 'number' ||
    !Number.isSafeInteger(top.ok) || !Number.isSafeInteger(top.total) || top.ok < 0 || top.total > 100 || top.ok !== top.total ||
    !('unrefreshed' in top) || !Array.isArray(top.unrefreshed) || top.unrefreshed.length !== 0) throw new Error('github-invalid-top100-report')
}

export function writeSnapshot(root: string, output: string, result: RadarResult) {
  validatePublishMetadata(result.report.metadata)
  mkdirSync(join(output, 'data'), { recursive: true })
  mkdirSync(join(output, 'radar'), { recursive: true })
  for (const [file, rows] of result.files) {
    const before = readFileSync(join(root, 'data', file), 'utf8')
    const content = JSON.stringify(JSON.parse(before)) === JSON.stringify(rows) ? before : JSON.stringify(rows, null, 2) + '\n'
    writeFileSync(join(output, 'data', file), content)
  }
  writeFileSync(join(output, 'README.md'), renderReadme(readFileSync(join(root, 'README.md'), 'utf8'), result.rows))
  writeFileSync(join(output, 'radar/state.json'), JSON.stringify(result.state, null, 2) + '\n')
  writeFileSync(join(output, 'radar/latest.json'), JSON.stringify(result.report, null, 2) + '\n')
}

async function main() {
  const root = process.cwd()
  if (process.argv[2] === '--apply') {
    const snapshot = resolve(process.argv[3] ?? '')
    validateState(JSON.parse(readFileSync(join(snapshot, 'radar/state.json'), 'utf8')))
    const report = JSON.parse(readFileSync(join(snapshot, 'radar/latest.json'), 'utf8'))
    if (!['complete', 'partial'].includes(report.status) || !Array.isArray(report.receipts)) throw new Error('Invalid report')
    validatePublishMetadata(report.metadata)
    applySnapshot(root, snapshot)
    return
  }
  // Action 显式传入 Secrets；绝不自动读取开发者的 .env.local。
  const key = process.env.TYPESAFE_API_KEY
  if (!key?.trim()) throw new Error('Configure repository Actions secret TYPESAFE_API_KEY first')
  const output = process.argv[2]
  if (!output || resolve(output) === root) throw new Error('Provide a separate snapshot output directory')
  const budgetDirectory = process.env.JEV_RADAR_BUDGET_DIR ?? join(process.env.RUNNER_TEMP ?? tmpdir(), 'jev-radar-budget')
  const budget = createRadarBudget(budgetDirectory)
  const deadline = Date.now() + RADAR_EXECUTION_MS
  // 定时任务不继承工作流旧的 20 候选默认；RADAR_LIMIT 仅保留给手动/测试运行。
  const limit = process.env.GITHUB_EVENT_NAME === 'schedule' ? MAX_QUEUE : Number(process.env.RADAR_LIMIT ?? MAX_QUEUE)
  const result = await runRadar({ catalog: readCatalog(root),
    state: JSON.parse(readFileSync(join(root, 'radar/state.json'), 'utf8')),
    api: createGitHubClient(process.env.GITHUB_TOKEN, { deadline }),
    review: (row, text, options) => evaluateJev(key, row, text, options),
    beforeRequest: budget.beforeRequest,
    deadline,
    limit,
    codeQueries: CODE_QUERIES,
  })
  if (!result.report.metadata.top100.complete) {
    const checkpoint = join(resolve(output), 'radar')
    mkdirSync(checkpoint, { recursive: true })
    writeFileSync(join(checkpoint, 'state.json'), JSON.stringify(result.state, null, 2) + '\n')
    writeFileSync(join(checkpoint, 'latest.json'), JSON.stringify(result.report, null, 2) + '\n')
  } else writeSnapshot(root, resolve(output), result)
  const budgetState = budget.snapshot()
  const summary = `## Jev radar\n\nStatus: ${result.report.status}\n\nAdded: ${result.report.added}; reviewed: ${result.report.reviewed}; pending: ${result.report.pending}; metadata refreshed: ${result.report.metadata.ok}; metadata failed: ${result.report.metadata.failed}; Top100: ${result.report.metadata.top100.ok}/${result.report.metadata.top100.total}; other: ${result.report.metadata.other}; remaining: ${result.report.metadata.remaining}; GraphQL cost: ${result.report.metadata.cost ?? 'unknown'}.\n${!result.report.metadata.top100.complete ? `Top100 incomplete repositories: ${result.report.metadata.top100.unrefreshed.join(', ')}.\n` : ''}${result.report.metadata.resolved.length ? `Resolved repository names: ${result.report.metadata.resolved.map(({ from, to, databaseId }) => `${from} → ${to} (ID ${databaseId})`).join('; ')}.\n` : ''}${result.report.identity ? `Identity baseline: ${result.report.identity.ok} added; ${result.report.identity.failed} unavailable; GraphQL cost: ${result.report.identity.cost ?? 'unknown'}.\n` : ''}${result.report.deferred ? `Deferred: ${result.report.deferred.phase} / ${result.report.deferred.reason}; metadata remaining: ${result.report.deferred.metadataRemaining ?? 0}.\n` : ''}\nJev requests: ${budgetState.used}/${budgetState.limit}.\n`
  process.stdout.write(summary +
    result.report.sources.map((source) => `${source.query}: ${source.status}; fetched ${source.fetched} / ${source.total}\n`).join(''))
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' })
  if (!result.report.metadata.top100.complete) throw new Error('github-top100-incomplete')
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : "radar-failed"}\n`); process.exitCode = 1 })
}
