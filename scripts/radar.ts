import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { readCatalog, repoKey, refreshRow, candidateRow, renderReadme, applySnapshot } from './catalog.ts'
import { createGitHubClient } from './github-client.ts'
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
export interface RadarState { version: number; pages: Record<string, number>; metadataCursor: number; candidates: Record<string, Candidate> }
interface Source { query: string; fetched: number; total: number; status: string }
export interface Receipt { repo: string | null; status: string; reason?: string; score?: JevScore; sha?: string; evidenceUrl?: string; evidenceSha256?: string; evidenceLinks?: EvidenceLink[]; model?: string; checkedAt?: string }
export interface RadarReport { at: string; model: string; status: string; sources: Source[]; metadata: { ok: number; failed: number }; reviewed: number; added: number; pending: number; overflow: number; evicted: number; receipts: Receipt[]; totalProjects?: number }
export interface RadarOptions { catalog: Catalog; state?: RadarState; api: GitHubApi; review: (row: JevRow, text: string, options?: RadarReviewOptions) => Promise<JevScore>; now?: Date; limit?: number; queries?: string[]; codeQueries?: string[]; deadline?: number; beforeRequest?: () => Promise<void> }
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

const deadlineReached = (deadline: number): boolean => Number.isFinite(deadline) && Date.now() >= deadline
const isDeferredRunError = (error: unknown): boolean => error instanceof Error &&
  (error.message === 'radar-budget-exhausted' || error.message === 'radar-budget-persist-failed' || error.message === 'radar-deadline')

const isTimestamp = (value: unknown) => typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value))

export function validateState(state: RadarState) {
  if (state?.version !== 1 || !state.pages || Array.isArray(state.pages) || typeof state.pages !== 'object' ||
    !state.candidates || typeof state.candidates !== 'object' || Array.isArray(state.candidates) ||
    !Number.isSafeInteger(state.metadataCursor) || state.metadataCursor < 0) throw new Error('Invalid radar state')
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

export async function runRadar({ catalog, state = emptyState(), api, review, now = new Date(), limit = MAX_QUEUE, queries = QUERIES, codeQueries = [], deadline = Infinity, beforeRequest }: RadarOptions) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_QUEUE) throw new Error(`limit must be 1..${MAX_QUEUE}`)
  if (!(deadline === Infinity || Number.isFinite(deadline)) || deadline < 0) throw new Error('radar-invalid-deadline')
  validateState(state)
  state = structuredClone(state)
  const started = now.toISOString()
  const files = new Map([...catalog.files].map(([file, rows]) => [file, structuredClone(rows)]))
  const rows = [...files.values()].flat()
  const known = new Set(rows.filter((r) => r.type === 'github').map((r) => repoKey(r.url)))
  for (const key of Object.keys(state.candidates)) if (known.has(key)) delete state.candidates[key]
  const report: RadarReport = { at: started, model: JEV_MODEL, status: 'partial', sources: [],
    metadata: { ok: 0, failed: 0 }, reviewed: 0, added: 0, pending: 0, overflow: 0, evicted: 0, receipts: [] }

  const rejectedCache = Object.entries(state.candidates).filter(([, e]) => e.status === 'drop')
    .sort(([, a], [, b]) => (a.checkedAt ?? a.discoveredAt).localeCompare(b.checkedAt ?? b.discoveredAt))
    .map(([key]) => key)
  const evicted = new Set()

  // --- 每个查询每轮两页；游标轮转到第十页，显式报告 GitHub 搜索上限 ---
  for (const query of queries) {
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
          if (!key || repo.private || repo.fork || repo.archived || known.has(key) || evicted.has(key) || key === 'daftai2026/awesome-jev') continue
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
    } catch (error) { source.status = safeReason(error) }
    report.sources.push(source)
  }

  // --- 代码搜索补充：SDK / API 端点命中，不要求项目名含 Jev ---
  for (const query of codeQueries) {
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
    } catch (error) { source.status = safeReason(error) }
    report.sources.push(source)
  }

  // --- 全量刷新已有仓库；失败保持旧数据，单个失效仓库不拖垮整轮 ---
  const github = rows.filter((r) => r.type === 'github')
  for (const row of github) {
    try {
      const meta = await api(`/repos/${repoKey(row.url)}`) as GitHubRepository
      Object.assign(row, refreshRow(row, meta))
      report.metadata.ok++
    } catch (error) {
      report.metadata.failed++
      report.receipts.push({ repo: repoKey(row.url), status: 'metadata-error', reason: safeReason(error) })
    }
  }
  // 兼容旧版持久化状态；全量刷新不再使用轮转游标。
  state.metadataCursor = 0

  const batch = Object.entries(state.candidates)
    .filter(([, entry]) => !entry.retryAt || Date.parse(entry.retryAt) <= now.getTime())
    .sort(([a, x], [b, y]) => (x.checkedAt ?? x.discoveredAt).localeCompare(y.checkedAt ?? y.discoveredAt) ||
      Number(Boolean(y.codeHints?.length)) - Number(Boolean(x.codeHints?.length)) ||
      (y.stars ?? 0) - (x.stars ?? 0) || a.localeCompare(b))
    .slice(0, limit)
  for (const [key, entry] of batch) {
    if (deadlineReached(deadline)) break
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
      const integration = await integrationEvidence(api, key, sha, entry.codeHints ?? [])
      const text = readme + integration.text
      if (deadlineReached(deadline)) throw new Error('radar-deadline')
      const candidate = candidateRow(repo)
      const reason = integration.incomplete ? 'github-incomplete-integration-evidence' : evidenceIssue(repo, text)
      const score = reason ? undefined : await review(candidate, text, {
        beforeRequest: async () => {
          if (deadlineReached(deadline)) throw new Error('radar-deadline')
          await beforeRequest?.()
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
        delete state.candidates[key]
        report.added++
      } else {
        entry.status = decision as 'review' | 'drop'
        entry.lastReview = receipt
        entry.retryAt = new Date(now.getTime() + (decision === 'drop' ? 30 : 7) * DAY).toISOString()
      }
    } catch (error) {
      if (isDeferredRunError(error) || deadlineReached(deadline)) {
        entry.status = 'pending'
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
  report.pending = Object.values(state.candidates).filter((e) => e.status !== 'drop').length
  report.totalProjects = known.size
  report.status = report.sources.every((s) => s.status === 'complete') && !report.metadata.failed &&
    !report.pending && !report.overflow && !report.evicted && !report.receipts.some((r) => r.status === 'error') ? 'complete' : 'partial'
  validateState(state)
  return { files, rows, state, report }
}

export function writeSnapshot(root: string, output: string, result: RadarResult) {
  mkdirSync(join(output, 'data'), { recursive: true })
  mkdirSync(join(output, 'radar'), { recursive: true })
  for (const [file, rows] of result.files) {
    const before = readFileSync(join(root, 'data', file), 'utf8')
    const content = JSON.stringify(JSON.parse(before)) === JSON.stringify(rows) ? before : JSON.stringify(rows, null, 2) + '\n'
    writeFileSync(join(output, 'data', file), content)
  }
  copyFileSync(join(root, 'data/x.json'), join(output, 'data/x.json'))
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
    api: createGitHubClient(process.env.GITHUB_TOKEN),
    review: (row, text, options) => evaluateJev(key, row, text, options),
    beforeRequest: budget.beforeRequest,
    deadline,
    limit,
    codeQueries: CODE_QUERIES,
  })
  writeSnapshot(root, resolve(output), result)
  const budgetState = budget.snapshot()
  const summary = `## Jev radar\n\nStatus: ${result.report.status}\n\nAdded: ${result.report.added}; reviewed: ${result.report.reviewed}; pending: ${result.report.pending}; metadata refreshed: ${result.report.metadata.ok}; metadata failed: ${result.report.metadata.failed}.\nJev requests: ${budgetState.used}/${budgetState.limit}.\n`
  process.stdout.write(summary +
    result.report.sources.map((source) => `${source.query}: ${source.status}; fetched ${source.fetched} / ${source.total}\n`).join(''))
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : "radar-failed"}\n`); process.exitCode = 1 })
}
