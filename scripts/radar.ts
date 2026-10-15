/**
 * [INPUT]: 依赖目录复核请求、GitHub 取证、模型审核和 radar-budget 的可信采集能力
 * [OUTPUT]: 提供共享预算的发现/目录复核；身份或分类未定则保持隐藏
 * [POS]: 核心发现与审核编排；两条队列共用来源隔离，统计由独立入口负责
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
import { bootstrapIdentities } from './github-metadata.ts'
import type { IdentityBootstrapReport, MetadataReport } from './github-metadata.ts'
import { githubEvidence, evidenceIssue, alternativeEvidenceIssue } from './github-evidence.ts'
import { evaluateJev, reviewDecision, JEV_MODEL } from './jev-client.ts'

import { candidateQueue, fairReviewQueue, migrateCoreState, validatePendingPage, CORE_TOTAL_LIMIT } from './candidate-queue.ts'
import type { PendingSearchPage, SearchLead } from './candidate-queue.ts'
import { CODE_QUERIES, searchCodePage, integrationEvidence } from './code-discovery.ts'
import type { CodeHint, EvidenceLink } from './code-discovery.ts'
import type { Catalog, DirectoryItem, GitHubApi, GitHubRepository, JevRow, JevScore } from './model-types.ts'
import { createRadarBudget } from './radar-budget.ts'
import { importCatalogReviews, validateCatalogReviewRequest, assertCatalogReviewTarget, applyCatalogReview } from './catalog-review.ts'
import type { CatalogReviewRequest } from './catalog-review.ts'

export interface RadarReviewOptions {
  beforeRequest?: () => Promise<void>
  attempts?: number
  alternative?: boolean
}

export interface Candidate { status: 'pending' | 'review' | 'error' | 'drop'; discoveredAt: string; checkedAt?: string; retryAt?: string; attempts: number; stars?: number; codeHints?: CodeHint[]; lastReview?: Receipt; catalogReview?: CatalogReviewRequest }
export interface RadarState { version: number; pages: Record<string, number>; metadataCursor?: number; metadataNext?: string; nextReviewLane?: 'pending' | 'retry'; pendingSearchPage?: PendingSearchPage; candidates: Record<string, Candidate> }
interface Source { query: string; fetched: number; total: number; status: string }
export interface Receipt { repo: string | null; status: string; reason?: string; score?: JevScore; sha?: string; evidenceUrl?: string; evidenceSha256?: string; evidenceLinks?: EvidenceLink[]; model?: string; checkedAt?: string }
export interface RadarReport { at: string; model: string; status: string; sources: Source[]; metadata: { ok: number; failed: number } & Partial<Omit<MetadataReport, 'ok' | 'failed'>>; identity?: IdentityBootstrapReport; reviewed: number; added: number; pending: number; overflow: number; evicted: number; backpressure?: number; buffered?: number; receipts: Receipt[]; totalProjects?: number; deferred?: { phase: string; reason: string; metadataRemaining?: number } }
export interface RadarOptions { catalog: Catalog; state?: RadarState; api: GitHubApi; review: (row: JevRow, text: string, options?: RadarReviewOptions) => Promise<JevScore>; now?: Date; limit?: number; queries?: string[]; codeQueries?: string[]; deadline?: number; clock?: () => number; beforeRequest?: () => Promise<void> }
interface RadarResult { files: Map<string, DirectoryItem[]>; rows: DirectoryItem[]; state: RadarState; report: RadarReport }

export const QUERIES = [
  'topic:jev fork:false', '"typesafe.ai" in:readme fork:false',
  '"Jev" "System One" in:readme fork:false', 'topic:typesafe-ai fork:false',
  '"@typesafe-ai/sdk" in:readme fork:false', '"TypeSafe" "Jev" fork:false',
]
export const MAX_QUEUE = 2000
export const RADAR_EXECUTION_MS = 25 * 60 * 1000
const DAY = 86400000
export const emptyState = (): RadarState => ({ version: 2, pages: {}, nextReviewLane: 'pending', candidates: {} })

const isDeferredRunError = (error: unknown): boolean => error instanceof Error &&
  (isGitHubRunDeferred(error) || error.message === 'radar-budget-exhausted' || error.message === 'radar-budget-persist-failed' || error.message === 'radar-deadline')

const isTimestamp = (value: unknown) => typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value))

export function validateState(state: RadarState, maxTotal = state?.version === 2 ? CORE_TOTAL_LIMIT : MAX_QUEUE) {
  if (![1, 2].includes(state?.version) || !state.pages || Array.isArray(state.pages) || typeof state.pages !== 'object' ||
    !state.candidates || typeof state.candidates !== 'object' || Array.isArray(state.candidates) ||
    state.version === 1 && (!Number.isSafeInteger(state.metadataCursor) || state.metadataCursor! < 0) ||
    state.nextReviewLane !== undefined && !['pending', 'retry'].includes(state.nextReviewLane) ||
    state.version === 2 && (state.metadataCursor !== undefined || state.metadataNext !== undefined || !['pending', 'retry'].includes(state.nextReviewLane!)) ||
    state.metadataNext !== undefined && (typeof state.metadataNext !== 'string' || !repoKey(`https://github.com/${state.metadataNext}`))) throw new Error('Invalid radar state')
  validatePendingPage(state.pendingSearchPage)
  if (Object.keys(state.candidates).length + (state.pendingSearchPage?.items.length ?? 0) > maxTotal || Object.values(state.candidates).filter(entry => entry.status === 'pending').length > MAX_QUEUE) throw new Error('Radar queue overflow')
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
    validateCatalogReviewRequest(entry.catalogReview, repo)
  }
}

const safeReason = (error: unknown) => error instanceof Error && /^(github|jev)-[a-z0-9-]+$/.test(error.message) ? error.message : 'candidate-invalid-evidence'

// --- 来源局部失败不阻断已有取证；其它错误保留整轮失败关闭 ---
export const isDiscoverySourceFailure = (error: unknown): boolean => error instanceof Error &&
  (['github-resource-deferred', 'github-phase-deadline', 'github-http-403', 'github-http-422', 'github-network-or-timeout'].includes(error.message) ||
    /^github-http-5\d\d$/.test(error.message))

export async function runRadar({ catalog, state = emptyState(), api, review, now = new Date(), limit = MAX_QUEUE, queries = QUERIES, codeQueries = [], deadline = Infinity, clock = Date.now, beforeRequest }: RadarOptions) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_QUEUE) throw new Error(`limit must be 1..${MAX_QUEUE}`)
  if (!(deadline === Infinity || Number.isFinite(deadline)) || deadline < 0) throw new Error('radar-invalid-deadline')
  const deadlineReached = () => Number.isFinite(deadline) && clock() >= deadline
  const upstream = api
  api = async (path, request, scope) => {
    if (deadlineReached()) throw new Error('github-deadline')
    return upstream(path, request, scope)
  }
  validateState(state)
  state = migrateCoreState(state)
  const started = now.toISOString()
  const files = new Map([...catalog.files].map(([file, rows]) => [file, structuredClone(rows)]))
  const rows = [...files.values()].flat()
  const known = new Set(rows.filter((r) => r.type === 'github').map((r) => repoKey(r.url)))
  for (const key of Object.keys(state.candidates)) if (known.has(key) && !state.candidates[key].catalogReview) delete state.candidates[key]
  const report: RadarReport = { at: started, model: JEV_MODEL, status: 'partial', sources: [],
    metadata: { ok: 0, failed: 0 }, reviewed: 0, added: 0, pending: 0, overflow: 0, evicted: 0, receipts: [] }
  report.identity = await bootstrapIdentities(rows, api)
  if (report.identity.deferred) report.deferred = { phase: 'identity', reason: report.identity.deferred }
  const discoveryDeadline = Math.min(deadline, clock() + 5 * 60 * 1000)
  const discoveryApi: GitHubApi = async (path, request) => {
    if (clock() >= discoveryDeadline) throw new Error('github-phase-deadline')
    return api(path, request, { deadline: discoveryDeadline })
  }
  const defer = (error: unknown, phase: string) => {
    if (isDiscoverySourceFailure(error)) return
    report.deferred = { phase, reason: safeReason(error) }
  }
  const knownIds = knownGitHubIds(rows)
  report.backpressure = importCatalogReviews(rows, state, MAX_QUEUE, CORE_TOTAL_LIMIT) || undefined
  const queue = candidateQueue(state, known, knownIds, report, started, CORE_TOTAL_LIMIT)
  queue.drain()

  // --- 每个查询每轮两页；游标轮转到第十页，显式报告 GitHub 搜索上限 ---
  for (const query of queries) {
    if (report.deferred) break
    let page = state.pages[query] ?? 1
    const source = { query, fetched: 0, total: 0, status: 'bounded' }
    try {
      for (let n = 0; n < 2; n++) {
        if (!queue.reserve()) { source.status = 'backpressure'; break }
        const data = await discoveryApi(`/search/repositories?q=${encodeURIComponent(query + ' is:public')}&per_page=100&page=${page}&sort=updated&order=desc`) as { items: GitHubRepository[]; total_count: number; incomplete_results?: boolean }
        if (!Array.isArray(data.items) || !Number.isSafeInteger(data.total_count) || data.total_count < 0) throw new Error('github-invalid-response')
        source.total = data.total_count
        source.fetched += data.items.length
        const leads: SearchLead[] = data.items.filter(repo => !repo.private && !repo.fork && !repo.archived).flatMap(repo => {
          const key = repoKey(repo.html_url)
          return key ? [{ repo: key, ...(Number.isSafeInteger(repo.id) && repo.id! > 0 ? { databaseId: repo.id } : {}),
            ...(Number.isSafeInteger(repo.stargazers_count) && repo.stargazers_count! >= 0 ? { stars: repo.stargazers_count } : {}) }] : []
        })
        if (data.items.length > 100) throw new Error('github-invalid-response')
        const lastPage = Math.max(1, Math.min(10, Math.ceil(data.total_count / 100)))
        source.status = data.incomplete_results ? 'partial' : data.total_count > 1000 ? 'search-cap' :
          page === 1 && data.items.length >= data.total_count ? 'complete' : 'bounded'
        queue.accept({ query, page, nextPage: page >= lastPage ? 1 : page + 1, sourceStatus: source.status, items: leads })
        if (state.pendingSearchPage || page >= lastPage || data.items.length < 100) break
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
        if (!queue.reserve()) { source.status = 'backpressure'; break }
        const data = await searchCodePage(discoveryApi, query, page)
        source.total = data.total; source.fetched += data.count
        const leads = new Map<string, SearchLead>()
        for (const hit of data.hits) {
          const lead = leads.get(hit.repo) ?? { repo: hit.repo, codeHints: [] }
          if (lead.codeHints!.length < 3 && !lead.codeHints!.some(hint => hint.path === hit.hint.path)) lead.codeHints!.push(hit.hint)
          leads.set(hit.repo, lead)
        }
        const lastPage = Math.max(1, Math.min(10, Math.ceil(data.total / 100)))
        source.status = data.incomplete ? 'partial' : data.total > 1000 ? 'search-cap' : page === 1 && data.count >= data.total ? 'complete' : 'bounded'
        queue.accept({ query: cursor, page, nextPage: page >= lastPage ? 1 : page + 1, sourceStatus: source.status, items: [...leads.values()] })
        if (state.pendingSearchPage || page >= lastPage || data.count < 100) break
        page++
      }
    } catch (error) {
      source.status = safeReason(error)
      defer(error, 'discovery')
    }
    report.sources.push(source)
  }

  const batch = fairReviewQueue(state, now.getTime()).slice(0, limit)
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
      const source = entry.catalogReview ? assertCatalogReviewTarget(rows, entry.catalogReview, repo) : undefined
      if (!entry.catalogReview && repo.id !== undefined && knownIds.has(repo.id)) {
        delete state.candidates[key]; report.reviewed--; continue
      }
      const integration = await integrationEvidence(api, key, sha, entry.codeHints ?? [])
      const text = readme + integration.text
      if (deadlineReached()) throw new Error('radar-deadline')
      const alternative = source?.category === 'alternatives'
      const candidate = candidateRow(repo, {}, { alternative })
      const license = repo.license?.spdx_id
      const reason = integration.incomplete ? 'github-incomplete-integration-evidence' : alternative
        ? !license || license === 'NOASSERTION' ? 'missing-open-source-license' : alternativeEvidenceIssue(repo, text)
        : evidenceIssue(repo, text)
      const score = reason ? undefined : await review(candidate, text, {
        ...(alternative ? { alternative: true } : {}),
        beforeRequest: async () => {
          if (deadlineReached()) throw new Error('radar-deadline')
          await beforeRequest?.()
          if (deadlineReached()) throw new Error('radar-deadline')
        },
      })
      const rawDecision = reason ? 'review' : reviewDecision(score)
      const categoryChanged = source && (score?.category === undefined || (alternative ? score.category !== 'alternatives' :
        entry.catalogReview?.sourceDatabaseId === repo.id && score.category !== source.category))
      const decision = rawDecision === 'keep' && categoryChanged ? 'review' : rawDecision
      const receipt: Receipt = { repo: key, status: decision, score, reason: reason ?? (rawDecision === 'keep' && categoryChanged ? 'catalog-review-category-changed' : undefined), sha, evidenceUrl,
        evidenceSha256: createHash('sha256').update(text).digest('hex'), evidenceLinks: integration.links, model: JEV_MODEL, checkedAt: started }
      if (decision === 'keep') {
        if (!score) throw new Error('jev-invalid-response')
        const { category, ...reviewScore } = score
        candidate.category = category ?? 'other'
        Object.assign(candidate.sourceMeta, reviewScore, { jevEvidence: receipt })
        let addition: DirectoryItem | undefined = candidate
        if (entry.catalogReview) {
          assertCatalogReviewTarget(rows, entry.catalogReview, await api(`/repos/${key}`) as GitHubRepository)
          addition = applyCatalogReview(rows, entry.catalogReview, candidate)
        } else if (rows.some((r) => r.id === candidate.id)) throw new Error('github-id-collision')
        if (addition) { files.get('github.json')!.push(addition); rows.push(addition); report.added++ }
        known.add(key)
        if (candidate.sourceMeta.githubIdentity) knownIds.add(candidate.sourceMeta.githubIdentity.databaseId)
        delete state.candidates[key]
      } else {
        entry.status = decision as 'review' | 'drop'
        entry.lastReview = receipt
        entry.retryAt = new Date(now.getTime() + (decision === 'drop' ? 30 : 7) * DAY).toISOString()
      }
      report.receipts.push(receipt)
      state.nextReviewLane = previous.status === 'pending' ? 'retry' : 'pending'
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
      state.nextReviewLane = previous.status === 'pending' ? 'retry' : 'pending'
      if (reason.startsWith('jev-') || reason === 'github-http-401') break
    }
  }
  report.buffered = state.pendingSearchPage?.items.length ?? 0
  report.pending = Object.values(state.candidates).filter((e) => e.status !== 'drop').length
  report.totalProjects = rows.length
  report.status = !report.deferred && report.sources.every((s) => s.status === 'complete') && !report.buffered && !report.backpressure && !report.pending && !report.overflow && !report.evicted && !report.receipts.some((r) => r.status === 'error') ? 'complete' : 'partial'
  validateState(state)
  return { files, rows, state, report }
}

export function writeSnapshot(root: string, output: string, result: RadarResult) {
  if (!['complete', 'partial'].includes(result.report.status) || result.report.deferred?.phase === 'identity') throw new Error('Invalid report')
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
    if (report.deferred?.phase === 'identity') throw new Error('Invalid report')
    const nextState = migrateCoreState(JSON.parse(readFileSync(join(snapshot, 'radar/state.json'), 'utf8')))
    validateState(nextState)
    applySnapshot(root, snapshot)
    writeFileSync(join(root, 'radar/state.json'), `${JSON.stringify(nextState, null, 2)}\n`)
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
  if (result.report.deferred?.phase === 'identity') {
    const diagnostics = join(resolve(output), 'radar')
    mkdirSync(diagnostics, { recursive: true })
    writeFileSync(join(diagnostics, 'latest.json'), `${JSON.stringify({ ...result.report, status: 'diagnostic' }, null, 2)}\n`)
    throw new Error('github-identity-bootstrap-incomplete')
  }
  writeSnapshot(root, resolve(output), result)
  const budgetState = budget.snapshot()
  const summary = `## Jev radar\n\nAdded: ${result.report.added}; reviewed: ${result.report.reviewed}; pending: ${result.report.pending}; buffered: ${result.report.buffered ?? 0}; backpressure: ${result.report.backpressure ?? 0}.\nJev requests: ${budgetState.used}/${budgetState.limit}.\n`
  process.stdout.write(summary +
    result.report.sources.map((source) => `${source.query}: ${source.status}; fetched ${source.fetched} / ${source.total}\n`).join(''))
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : "radar-failed"}\n`); process.exitCode = 1 })
}
