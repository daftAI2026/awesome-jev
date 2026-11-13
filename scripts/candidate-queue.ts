/**
 * [INPUT]: 依赖采集候选状态、规范 GitHub 身份与代码导航线索
 * [OUTPUT]: 提供活跃任务计数、残页背压、公平审核、有期判断复用与统一状态序列化
 * [POS]: scripts 的候选导航边界，不保存源码，不执行网络或模型请求
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { repoKey } from './catalog.ts'
import { isProjectCategory, reviewDecision } from './jev-client.ts'
import type { JevScore } from './model-types.ts'
import type { RadarState, RadarReport, Candidate } from './radar.ts'
import type { CodeHint } from './code-discovery.ts'
export interface SearchLead { repo: string; databaseId?: number; stars?: number; codeHints?: CodeHint[] }
export interface PendingSearchPage { query: string; page: number; nextPage: number; sourceStatus: string; items: SearchLead[] }
export const CORE_PENDING_LIMIT = 2000
export const SEARCH_PAGE_SIZE = 100
export const CORE_ACTIVE_LIMIT = CORE_PENDING_LIMIT + SEARCH_PAGE_SIZE
export const MAX_RADAR_STATE_BYTES = 16 * 1024 * 1024
const REVIEW_REUSE_MS = 30 * 86400000

export const serializeRadarState = (state: RadarState): string => JSON.stringify(state, null, 2) + '\n'

export function candidateCounts(state: RadarState) {
  const counts = { pending: 0, review: 0, error: 0, drop: 0, buffered: state.pendingSearchPage?.items.length ?? 0 }
  for (const entry of Object.values(state.candidates)) counts[entry.status]++
  return counts
}

export function discoveryStalled(report: RadarReport): boolean {
  return !!report.sources.length && report.sources.every(source => source.status === 'backpressure') && report.discoveryPending === 0
}

export function candidateQueueSummary(report: RadarReport): string {
  const counts = report.queue
  if (!counts) return ''
  return `First review: ${counts.pending}; awaiting recheck: ${counts.review}; error retry: ${counts.error}; rejected history: ${counts.drop}; buffered: ${counts.buffered}.\n` +
    `Search results fetched: ${report.sources.reduce((sum, source) => sum + source.fetched, 0)}; reused model judgments: ${report.reusedReviews ?? 0}.\n`
}

// --- 只复用未收录判断；缓存绝不成为绕过实时准入或身份复核的批准凭据 ---
export function reusableReview(entry: Candidate, fingerprint: string, now: number): JevScore | undefined {
  const score = entry.lastReview?.score
  const checked = Date.parse(entry.modelReviewedAt ?? '')
  if (entry.reviewFingerprint !== fingerprint || !Number.isFinite(checked) || checked > now || now - checked >= REVIEW_REUSE_MS ||
    !score || !isProjectCategory(score.category) || !['review', 'drop'].includes(entry.lastReview?.status ?? '') ||
    ![score.jevAbout, score.jevKeepConfidence].every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1) ||
    !['keep', 'review', 'drop'].includes(score.jevKeep) ||
    reviewDecision(score) === 'keep') return
  return score
}
export function migrateCoreState(input: RadarState): RadarState {
  const state = structuredClone(input)
  state.version = 2
  delete state.metadataCursor; delete state.metadataNext
  state.nextReviewLane ??= 'pending'
  return state
}
export function candidateQueue(state: RadarState, known: Set<string | null>, knownIds: Set<number>, report: RadarReport,
  started: string, maxActive: number) {
  // 历史仍保存在同一 map；只有未执行任务占工作槽位，避免另一套存储和迁移。
  let pending = candidateCounts(state).pending
  const active = () => pending + (state.pendingSearchPage?.items.length ?? 0)
  const ignored = (lead: SearchLead) => known.has(lead.repo) || lead.databaseId !== undefined && knownIds.has(lead.databaseId) ||
    lead.repo === 'daftai2026/awesome-jev'
  const enqueue = (lead: SearchLead): boolean => {
    if (ignored(lead)) return true
    if (state.candidates[lead.repo]?.catalogReview) return true
    if (!Object.hasOwn(state.candidates, lead.repo)) {
      if (pending >= CORE_PENDING_LIMIT || active() >= maxActive) return false
      state.candidates[lead.repo] = { status: 'pending', discoveredAt: started, attempts: 0 }
      pending++
    }
    const entry = state.candidates[lead.repo]
    if (lead.stars !== undefined) entry.stars = lead.stars
    for (const hint of lead.codeHints ?? []) {
      entry.codeHints ??= []
      if (entry.codeHints.length < 3 && !entry.codeHints.some(old => old.path === hint.path)) {
        entry.codeHints.push(hint); delete entry.retryAt
      }
    }
    return true
  }
  const drain = () => {
    const page = state.pendingSearchPage
    if (!page) return true
    // 先移出 buffer 再入队，避免同一条导航记录占两次容量。
    while (page.items.length) {
      const lead = page.items.shift()!
      if (!enqueue(lead)) { page.items.unshift(lead); report.backpressure = (report.backpressure ?? 0) + 1; return false }
    }
    state.pages[page.query] = page.nextPage
    delete state.pendingSearchPage
    return true
  }
  const reserve = () => {
    if (state.pendingSearchPage || pending >= CORE_PENDING_LIMIT || maxActive - active() < SEARCH_PAGE_SIZE) {
      report.backpressure = (report.backpressure ?? 0) + 1
      return false
    }
    return true
  }
  const accept = (page: PendingSearchPage) => {
    state.pendingSearchPage = page
    drain()
  }
  return { drain, reserve, accept }
}
export function fairReviewQueue(state: RadarState, now: number): [string, Candidate][] {
  const eligible = Object.entries(state.candidates).filter(([, entry]) => !entry.retryAt || Date.parse(entry.retryAt) <= now)
  const tie = ([a, x]: [string, Candidate], [b, y]: [string, Candidate]) =>
    Number(Boolean(y.codeHints?.length)) - Number(Boolean(x.codeHints?.length)) || (y.stars ?? 0) - (x.stars ?? 0) || a.localeCompare(b)
  const pending = eligible.filter(([, entry]) => entry.status === 'pending').sort((a, b) => a[1].discoveredAt.localeCompare(b[1].discoveredAt) || tie(a, b))
  const retry = eligible.filter(([, entry]) => entry.status !== 'pending').sort((a, b) => (a[1].retryAt ?? a[1].checkedAt ?? a[1].discoveredAt).localeCompare(b[1].retryAt ?? b[1].checkedAt ?? b[1].discoveredAt) || tie(a, b))
  const result: [string, Candidate][] = []
  let lane = state.nextReviewLane ?? 'pending'
  while (pending.length || retry.length) {
    const group = lane === 'pending' ? pending : retry
    const other = lane === 'pending' ? retry : pending
    result.push((group.length ? group : other).shift()!)
    lane = result.at(-1)![1].status === 'pending' ? 'retry' : 'pending'
  }
  return result
}
export function validatePendingPage(page: PendingSearchPage | undefined): void {
  if (page === undefined) return
  if (!page || Object.keys(page).some(key => !['query', 'page', 'nextPage', 'sourceStatus', 'items'].includes(key)) || typeof page.query !== 'string' || page.query.length > 1000 || typeof page.sourceStatus !== 'string' ||
    ![page.page, page.nextPage].every(n => Number.isSafeInteger(n) && n >= 1 && n <= 10) || !Array.isArray(page.items) || page.items.length > 100 ||
    page.items.some(item => !item || repoKey(`https://github.com/${item.repo}`) !== item.repo ||
      Object.keys(item).some(key => !['repo', 'databaseId', 'stars', 'codeHints'].includes(key)) ||
      item.databaseId !== undefined && (!Number.isSafeInteger(item.databaseId) || item.databaseId <= 0) ||
      item.stars !== undefined && (!Number.isSafeInteger(item.stars) || item.stars < 0) ||
      item.codeHints !== undefined && (!Array.isArray(item.codeHints) || item.codeHints.length > 3 || item.codeHints.some(hint => !hint || typeof hint.path !== 'string' || hint.path.length > 4096 || typeof hint.query !== 'string' || hint.query.length > 500)))) throw new Error('Invalid pending search page')
}
