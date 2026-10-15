/**
 * [INPUT]: 依赖采集候选状态、规范 GitHub 身份与代码导航线索
 * [OUTPUT]: 提供残页回灌、有限背压与审核公平排序；目录复核冷却不被缓存逐出
 * [POS]: scripts 的候选导航边界，不保存源码，不执行网络或模型请求
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { repoKey } from './catalog.ts'
import type { RadarState, RadarReport, Candidate } from './radar.ts'
import type { CodeHint } from './code-discovery.ts'
export interface SearchLead { repo: string; databaseId?: number; stars?: number; codeHints?: CodeHint[] }
export interface PendingSearchPage { query: string; page: number; nextPage: number; sourceStatus: string; items: SearchLead[] }
export const CORE_PENDING_LIMIT = 2000
export const CORE_TOTAL_LIMIT = 2 * CORE_PENDING_LIMIT
export function migrateCoreState(input: RadarState): RadarState {
  const state = structuredClone(input)
  state.version = 2
  delete state.metadataCursor; delete state.metadataNext
  state.nextReviewLane ??= 'pending'
  return state
}
export function candidateQueue(state: RadarState, known: Set<string | null>, knownIds: Set<number>, report: RadarReport,
  started: string, maxTotal: number) {
  const evicted = new Set<string>()
  const pending = () => Object.values(state.candidates).filter(entry => entry.status === 'pending').length
  const total = () => Object.keys(state.candidates).length + (state.pendingSearchPage?.items.length ?? 0)
  const evict = () => {
    const oldest = Object.entries(state.candidates).filter(([, entry]) => entry.status === 'drop' && !entry.catalogReview)
      .sort(([a, x], [b, y]) => (x.checkedAt ?? x.discoveredAt).localeCompare(y.checkedAt ?? y.discoveredAt) || a.localeCompare(b))[0]
    if (!oldest) return false
    delete state.candidates[oldest[0]]; evicted.add(oldest[0]); report.evicted++
    return true
  }
  const ignored = (lead: SearchLead) => known.has(lead.repo) || lead.databaseId !== undefined && knownIds.has(lead.databaseId) ||
    evicted.has(lead.repo) || lead.repo === 'daftai2026/awesome-jev'
  const enqueue = (lead: SearchLead): boolean => {
    if (ignored(lead)) return true
    if (state.candidates[lead.repo]?.catalogReview) return true
    if (!Object.hasOwn(state.candidates, lead.repo)) {
      if (pending() >= CORE_PENDING_LIMIT) return false
      if (total() >= maxTotal && !evict()) return false
      state.candidates[lead.repo] = { status: 'pending', discoveredAt: started, attempts: 0 }
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
    if (state.pendingSearchPage || pending() >= CORE_PENDING_LIMIT) { report.backpressure = (report.backpressure ?? 0) + 1; return false }
    while (maxTotal - total() < 100) if (!evict()) { report.backpressure = (report.backpressure ?? 0) + 1; return false }
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
