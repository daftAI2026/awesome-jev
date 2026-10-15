/**
 * [INPUT]: 依赖规范目录的复核请求、GitHub 对象身份与核心候选契约
 * [OUTPUT]: 提供请求导入、身份复核、同对象迁移和新对象独立收录
 * [POS]: 核心雷达的目录复核边界；复用原审核队列，不拥有网络预算或模型调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { isDeepStrictEqual as equal } from 'node:util'
import { repoKey } from './catalog.ts'
import { readGitHubIdentity, repositoryIdentity } from './github-identity.ts'
import type { RadarState } from './radar.ts'
import type { CatalogLifecycleTarget, DirectoryItem, GitHubRepository } from './model-types.ts'

export interface CatalogReviewRequest {
  sourceId: string
  sourceDatabaseId: number
  sourceUrl: string
  since: string
  target: CatalogLifecycleTarget
}
const timestamp = (value: unknown): value is string => typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value))
export function validateCatalogReviewRequest(value: CatalogReviewRequest | undefined, key: string): void {
  if (value === undefined) return
  if (!value || Object.keys(value).some(field => !['sourceId', 'sourceDatabaseId', 'sourceUrl', 'since', 'target'].includes(field)) ||
    typeof value.sourceId !== 'string' || !value.sourceId || value.sourceId.length > 200 ||
    !Number.isSafeInteger(value.sourceDatabaseId) || value.sourceDatabaseId <= 0 ||
    typeof value.sourceUrl !== 'string' || !repoKey(value.sourceUrl) || !timestamp(value.since) ||
    !value.target || Object.keys(value.target).some(field => !['url', 'databaseId', 'nodeId'].includes(field)) ||
    !readGitHubIdentity(value.target) || typeof value.target.url !== 'string' || repoKey(value.target.url) !== key) {
    throw new Error('Invalid catalog review request')
  }
}
function requestFor(row: DirectoryItem): CatalogReviewRequest | undefined {
  const lifecycle = row.sourceMeta.lifecycle, identity = readGitHubIdentity(row.sourceMeta.githubIdentity)
  if (lifecycle?.state !== 'review' || !lifecycle.target || !identity) return
  const request = { sourceId: row.id, sourceDatabaseId: identity.databaseId, sourceUrl: row.url,
    since: lifecycle.since, target: structuredClone(lifecycle.target) }
  validateCatalogReviewRequest(request, repoKey(lifecycle.target.url) ?? '')
  return request
}
export function catalogReviewSource(rows: readonly DirectoryItem[], request: CatalogReviewRequest): DirectoryItem | undefined {
  const row = rows.find(item => item.id === request.sourceId)
  return row && equal(requestFor(row), request) ? row : undefined
}

// --- 只导入规范目录的显式请求；同一请求不能因轮次推进而清空冷却与账本 ---
export function importCatalogReviews(rows: readonly DirectoryItem[], state: RadarState, pendingLimit: number, totalLimit: number): number {
  for (const [key, entry] of Object.entries(state.candidates)) {
    if (entry.catalogReview && !catalogReviewSource(rows, entry.catalogReview)) delete state.candidates[key]
  }
  let blocked = 0
  for (const row of rows) {
    const request = requestFor(row)
    if (!request) continue
    const key = repoKey(request.target.url)!
    const existing = state.candidates[key]
    if (existing?.catalogReview) { if (!equal(existing.catalogReview, request)) blocked++; continue }
    const pending = Object.values(state.candidates).filter(candidate => candidate.status === 'pending').length
    const total = Object.keys(state.candidates).length + (state.pendingSearchPage?.items.length ?? 0)
    if ((!existing || existing.status !== 'pending') && pending >= pendingLimit || !existing && total >= totalLimit) { blocked++; continue }
    state.candidates[key] = { status: 'pending', discoveredAt: request.since, attempts: 0, catalogReview: request }
  }
  return blocked
}

export function assertCatalogReviewTarget(rows: readonly DirectoryItem[], request: CatalogReviewRequest, repo: GitHubRepository): DirectoryItem {
  const source = catalogReviewSource(rows, request)
  const identity = repositoryIdentity(repo)
  if (!source || !identity || identity.databaseId !== request.target.databaseId ||
    repoKey(repo.html_url) !== repoKey(request.target.url) || repoKey(`https://github.com/${repo.full_name}`) !== repoKey(request.target.url) ||
    repo.private || repo.fork || repo.archived) throw new Error('github-catalog-review-target-changed')
  const targetKey = repoKey(request.target.url)
  if (rows.some(row => row.id !== source.id && (row.sourceMeta.githubIdentity?.databaseId === identity.databaseId ||
    !row.sourceMeta.lifecycle && (repoKey(row.url) === targetKey || row.sourceMeta.previousUrls?.some(url => repoKey(url) === targetKey))))) {
    throw new Error('github-catalog-review-address-conflict')
  }
  if (identity.databaseId === request.sourceDatabaseId && rows.some(row => row.id !== source.id && !row.sourceMeta.lifecycle &&
    [source.url, ...(source.sourceMeta.previousUrls ?? [])].some(url => repoKey(url) === repoKey(row.url) ||
      row.sourceMeta.previousUrls?.some(previous => repoKey(previous) === repoKey(url))))) {
    throw new Error('github-catalog-review-address-conflict')
  }
  return source
}

// --- 新对象获得独立本站 ID；同对象只更新已授权字段，旧引文进入不公开历史 ---
export function applyCatalogReview(rows: readonly DirectoryItem[], request: CatalogReviewRequest, candidate: DirectoryItem): DirectoryItem | undefined {
  const source = catalogReviewSource(rows, request)
  if (!source || candidate.sourceMeta.githubIdentity?.databaseId !== request.target.databaseId ||
    repoKey(candidate.url) !== repoKey(request.target.url)) throw new Error('github-catalog-review-target-changed')
  if (request.target.databaseId !== request.sourceDatabaseId) {
    candidate.id = `gh-repo-${request.target.databaseId}`
    if (rows.some(row => row.id === candidate.id)) throw new Error('github-id-collision')
    source.sourceMeta.lifecycle = { ...source.sourceMeta.lifecycle!, state: 'replaced' }
    return candidate
  }
  const previousUrls = [...new Set([...(source.sourceMeta.previousUrls ?? []), ...(source.url !== candidate.url ? [source.url] : [])])]
    .filter(url => repoKey(url) !== repoKey(candidate.url))
  const previousInclusion = [...(source.sourceMeta.previousInclusion ?? []), ...(source.sourceMeta.inclusion ? [source.sourceMeta.inclusion] : [])]
  const [oldOwner, oldName] = new URL(source.url).pathname.slice(1).replace(/\/$/, '').split('/')
  if (source.title === oldName) source.title = candidate.title
  if (source.sourceMeta.author === oldOwner) source.sourceMeta.author = candidate.sourceMeta.author
  source.url = candidate.url
  source.sourceMeta = { ...source.sourceMeta, ...Object.fromEntries(
    ['repo', 'stars', 'forks', 'language', 'githubIdentity', 'jevAbout', 'jevKeep', 'jevKeepConfidence', 'needsReview', 'conflictingEvidence', 'jevEvidence']
      .filter(field => Object.hasOwn(candidate.sourceMeta, field)).map(field => [field, candidate.sourceMeta[field as keyof typeof candidate.sourceMeta]])),
    ...(previousUrls.length ? { previousUrls } : {}), ...(previousInclusion.length ? { previousInclusion } : {}) }
  delete source.sourceMeta.lifecycle
  delete source.sourceMeta.inclusion
  if (!previousUrls.length) delete source.sourceMeta.previousUrls
  for (const field of ['needsReview', 'conflictingEvidence'] as const) {
    if (!Object.hasOwn(candidate.sourceMeta, field)) delete source.sourceMeta[field]
  }
  return undefined
}
