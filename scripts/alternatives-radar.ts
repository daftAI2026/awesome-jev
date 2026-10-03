/**
 * [INPUT]: 依赖共享目录、GitHub 取证、模型审核与核心雷达状态契约
 * [OUTPUT]: 对外提供替代实现采集、状态校验和快照写入
 * [POS]: scripts 的独立替代实现队列，复用请求及付费边界，用数字 ID 排除改名后的已收录对象
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { applySnapshot, candidateRow, readCatalog, renderReadme, repoKey, validateSnapshot } from './catalog.ts'
import { createGitHubClient, isGitHubRunDeferred } from './github-client.ts'
import { knownGitHubIds } from './github-identity.ts'
import { bootstrapIdentities } from './github-metadata.ts'
import { alternativeEvidenceIssue, githubEvidence } from './github-evidence.ts'
import { evaluateJev, JEV_MODEL, reviewDecision } from './jev-client.ts'
import { createRadarBudget } from './radar-budget.ts'
import { emptyState, RADAR_EXECUTION_MS, validateState } from './radar.ts'
import type { Candidate, RadarReviewOptions, RadarReport, RadarState, Receipt } from './radar.ts'
import type { Catalog, DirectoryItem, GitHubApi, GitHubRepository, JevRow, JevScore } from './model-types.ts'

export const ALTERNATIVE_QUERIES = [
  'topic:system-one topic:decision-model fork:false',
  'topic:typed-decisions fork:false',
]
const DAY = 86400000
const MAX_QUEUE = 2000
const stateFile = 'radar/alternatives-state.json'
const reportFile = 'radar/alternatives-latest.json'
const deferred = (error: unknown): boolean => error instanceof Error &&
  (isGitHubRunDeferred(error) || ['radar-budget-exhausted', 'radar-budget-persist-failed', 'radar-deadline'].includes(error.message))
const safeReason = (error: unknown): string => error instanceof Error && /^(github|jev)-[a-z0-9-]+$/.test(error.message)
  ? error.message : 'candidate-invalid-evidence'

export const emptyAlternativesState = emptyState
export const validateAlternativesState = validateState

export interface AlternativesOptions {
  catalog: Catalog
  state?: RadarState
  api: GitHubApi
  review: (row: JevRow, text: string, options?: RadarReviewOptions) => Promise<JevScore>
  now?: Date
  deadline?: number
  clock?: () => number
  beforeRequest?: () => Promise<void>
  queries?: string[]
}

export interface AlternativesResult {
  files: Map<string, DirectoryItem[]>
  rows: DirectoryItem[]
  state: RadarState
  report: RadarReport
}

// --- 独立候选队列：核心雷达负责 TypeSafe 生态与旧条目元数据，此处只审替代实现 ---
export async function runAlternatives({ catalog, state = emptyState(), api, review, now = new Date(),
  deadline = Infinity, clock = Date.now, beforeRequest, queries = ALTERNATIVE_QUERIES }: AlternativesOptions): Promise<AlternativesResult> {
  validateState(state)
  if (!(deadline === Infinity || Number.isFinite(deadline)) || deadline < 0) throw new Error('radar-invalid-deadline')
  const expired = () => Number.isFinite(deadline) && clock() >= deadline
  const upstream = api
  api = async (path, request) => {
    if (expired()) throw new Error('github-deadline')
    return upstream(path, request)
  }
  state = structuredClone(state)
  const started = now.toISOString()
  const files = new Map([...catalog.files].map(([file, entries]) => [file, structuredClone(entries)]))
  const rows = [...files.values()].flat()
  const known = new Set(rows.filter((row) => row.type === 'github').map((row) => repoKey(row.url)))
  const stars = new Map<string, number>()
  for (const key of Object.keys(state.candidates)) if (known.has(key)) delete state.candidates[key]
  const report: RadarReport = { at: started, model: JEV_MODEL, status: 'partial', sources: [],
    metadata: { ok: 0, failed: 0 }, reviewed: 0, added: 0, pending: 0, overflow: 0, evicted: 0, receipts: [] }
  report.identity = await bootstrapIdentities(rows, api)
  if (report.identity.deferred) report.deferred = { phase: 'identity', reason: report.identity.deferred }
  const knownIds = knownGitHubIds(rows)

  for (const query of queries) {
    if (report.deferred) break
    let page = state.pages[query] ?? 1
    const source = { query, fetched: 0, total: 0, status: 'bounded' }
    try {
      for (let index = 0; index < 2; index++) {
        const result = await api(`/search/repositories?q=${encodeURIComponent(query + ' is:public')}&per_page=100&page=${page}&sort=updated&order=desc`) as
          { items: GitHubRepository[]; total_count: number; incomplete_results?: boolean }
        if (!Array.isArray(result.items) || !Number.isSafeInteger(result.total_count) || result.total_count < 0) throw new Error('github-invalid-response')
        source.total = result.total_count
        source.fetched += result.items.length
        for (const repo of result.items) {
          const key = repoKey(repo.html_url)
          if (!key || repo.private || repo.fork || repo.archived || known.has(key) || repo.id !== undefined && knownIds.has(repo.id) || key === 'daftai2026/awesome-jev') continue
          if (Number.isSafeInteger(repo.stargazers_count) && (repo.stargazers_count ?? -1) >= 0) {
            stars.set(key, Math.max(stars.get(key) ?? 0, repo.stargazers_count ?? 0))
          }
          if (!Object.hasOwn(state.candidates, key)) {
            if (Object.keys(state.candidates).length >= MAX_QUEUE) { report.overflow++; continue }
            state.candidates[key] = { status: 'pending', discoveredAt: started, attempts: 0 }
          }
        }
        const lastPage = Math.max(1, Math.min(10, Math.ceil(result.total_count / 100)))
        state.pages[query] = page >= lastPage ? 1 : page + 1
        source.status = result.incomplete_results ? 'partial' : result.total_count > 1000 ? 'search-cap' :
          page === 1 && result.items.length >= result.total_count ? 'complete' : 'bounded'
        if (page >= lastPage || result.items.length < 100) break
        page++
      }
    } catch (error) {
      source.status = safeReason(error)
      if (isGitHubRunDeferred(error)) report.deferred = { phase: 'discovery', reason: (error as Error).message }
    }
    report.sources.push(source)
  }

  const queue = Object.entries(state.candidates)
    .filter(([, entry]) => !entry.retryAt || Date.parse(entry.retryAt) <= now.getTime())
    .sort(([a, x], [b, y]) => (x.checkedAt ?? x.discoveredAt).localeCompare(y.checkedAt ?? y.discoveredAt) ||
      (stars.get(b) ?? 0) - (stars.get(a) ?? 0) || a.localeCompare(b))
  for (const [key, entry] of queue) {
    if (report.deferred) break
    if (expired()) { report.deferred = { phase: 'review', reason: 'github-deadline' }; break }
    const previous: Candidate = structuredClone(entry)
    entry.checkedAt = started
    entry.attempts++
    report.reviewed++
    try {
      const { repo, sha, text, evidenceUrl } = await githubEvidence(api, key)
      if (repo.id !== undefined && knownIds.has(repo.id)) {
        delete state.candidates[key]; report.reviewed--; continue
      }
      if (expired()) throw new Error('radar-deadline')
      const candidate = candidateRow(repo, {}, { alternative: true })
      const license = repo.license?.spdx_id
      const reason = !license || license === 'NOASSERTION' ? 'missing-open-source-license' : alternativeEvidenceIssue(repo, text)
      const score = reason ? undefined : await review(candidate, text, {
        beforeRequest: async () => {
          if (expired()) throw new Error('radar-deadline')
          await beforeRequest?.()
          if (expired()) throw new Error('radar-deadline')
        },
      })
      const rawDecision = reason ? 'review' : reviewDecision(score)
      const decision = rawDecision === 'keep' && score?.category !== 'alternatives' ? 'review' : rawDecision
      const receipt: Receipt = { repo: key, status: decision,
        reason: reason ?? (rawDecision === 'keep' && decision === 'review' ? 'category-not-alternative' : undefined), score, sha, evidenceUrl,
        evidenceSha256: createHash('sha256').update(text).digest('hex'), model: JEV_MODEL, checkedAt: started }
      report.receipts.push(receipt)
      if (decision === 'keep' && score?.category === 'alternatives') {
        if (rows.some((row) => row.id === candidate.id)) throw new Error('github-id-collision')
        const { category, ...reviewScore } = score
        candidate.category = category
        Object.assign(candidate.sourceMeta, reviewScore, { jevEvidence: receipt })
        files.get('github.json')!.push(candidate)
        rows.push(candidate)
        known.add(key)
        if (candidate.sourceMeta.githubIdentity) knownIds.add(candidate.sourceMeta.githubIdentity.databaseId)
        delete state.candidates[key]
        report.added++
      } else {
        entry.status = decision === 'drop' ? 'drop' : 'review'
        entry.lastReview = receipt
        entry.retryAt = new Date(now.getTime() + (entry.status === 'drop' ? 30 : 7) * DAY).toISOString()
      }
    } catch (error) {
      if (deferred(error) || expired()) {
        report.deferred = { phase: 'review', reason: error instanceof Error ? error.message : 'github-deadline' }
        state.candidates[key] = previous
        report.reviewed--
        break
      }
      const reason = safeReason(error)
      entry.status = 'error'
      entry.retryAt = new Date(now.getTime() + Math.min(7, 2 ** Math.min(entry.attempts - 1, 3)) * DAY).toISOString()
      report.receipts.push({ repo: key, status: 'error', reason })
      if (reason.startsWith('jev-')) break
    }
  }
  report.pending = Object.values(state.candidates).filter((entry) => entry.status !== 'drop').length
  report.totalProjects = known.size
  report.status = !report.deferred && report.sources.every((source) => source.status === 'complete') && !report.pending &&
    !report.overflow && !report.receipts.some((receipt) => receipt.status === 'error') ? 'complete' : 'partial'
  validateState(state)
  return { files, rows, state, report }
}

export function writeAlternativesSnapshot(root: string, output: string, result: AlternativesResult): void {
  mkdirSync(join(output, 'data'), { recursive: true })
  mkdirSync(join(output, 'radar'), { recursive: true })
  for (const [file, rows] of result.files) {
    const before = readFileSync(join(root, 'data', file), 'utf8')
    const content = JSON.stringify(JSON.parse(before)) === JSON.stringify(rows) ? before : `${JSON.stringify(rows, null, 2)}\n`
    writeFileSync(join(output, 'data', file), content)
  }
  writeFileSync(join(output, 'README.md'), renderReadme(readFileSync(join(root, 'README.md'), 'utf8'), result.rows))
  writeFileSync(join(output, stateFile), `${JSON.stringify(result.state, null, 2)}\n`)
  writeFileSync(join(output, reportFile), `${JSON.stringify(result.report, null, 2)}\n`)
}

async function main(): Promise<void> {
  const root = process.cwd()
  if (process.argv[2] === '--apply') {
    const snapshot = resolve(process.argv[3] ?? '')
    validateState(JSON.parse(readFileSync(join(snapshot, stateFile), 'utf8')))
    const report = JSON.parse(readFileSync(join(snapshot, reportFile), 'utf8')) as RadarReport
    if (!['complete', 'partial'].includes(report.status) || !Array.isArray(report.receipts)) throw new Error('Invalid report')
    const oldIds = new Set(readCatalog(root).rows.map((row) => row.id))
    const next = validateSnapshot(root, snapshot)
    if (next.rows.some((row) => !oldIds.has(row.id) && (row.type !== 'github' || row.category !== 'alternatives'))) {
      throw new Error('Non-alternative addition')
    }
    applySnapshot(root, snapshot, ['data/github.json', 'README.md', stateFile, reportFile])
    return
  }
  const key = process.env.TYPESAFE_API_KEY
  if (!key?.trim()) throw new Error('Configure repository Actions secret TYPESAFE_API_KEY first')
  const output = process.argv[2]
  if (!output || resolve(output) === root) throw new Error('Provide a separate snapshot output directory')
  const budgetDirectory = process.env.JEV_ALTERNATIVES_BUDGET_DIR ?? join(process.env.RUNNER_TEMP ?? tmpdir(), 'jev-alternatives-budget')
  const budget = createRadarBudget(budgetDirectory)
  const deadline = Date.now() + RADAR_EXECUTION_MS
  const result = await runAlternatives({ catalog: readCatalog(root),
    state: JSON.parse(readFileSync(join(root, stateFile), 'utf8')) as RadarState,
    api: createGitHubClient(process.env.GITHUB_TOKEN, { deadline }),
    review: (row, text, options) => evaluateJev(key, row, text, { ...options, alternative: true }),
    beforeRequest: budget.beforeRequest,
    deadline,
  })
  writeAlternativesSnapshot(root, resolve(output), result)
  const budgetState = budget.snapshot()
  const summary = `## Open-source alternatives\n\nAdded: ${result.report.added}; reviewed: ${result.report.reviewed}; pending: ${result.report.pending}.\n${result.report.identity ? `Identity baseline: ${result.report.identity.ok} added; ${result.report.identity.failed} unavailable; GraphQL cost: ${result.report.identity.cost ?? 'unknown'}.\n` : ''}${result.report.deferred ? `Deferred: ${result.report.deferred.phase} / ${result.report.deferred.reason}.\n` : ''}\nJev requests: ${budgetState.used}/${budgetState.limit}.\n`
  process.stdout.write(summary)
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : 'alternatives-failed'}\n`); process.exitCode = 1 })
}
