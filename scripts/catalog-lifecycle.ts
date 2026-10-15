/**
 * [INPUT]: 依赖同轮 GitHub 身份读数、固定版本来源与元数据失败观察
 * [OUTPUT]: 提供有限失效确认、同身份迁址和审核隔离；异常回滚保留已证实恢复
 * [POS]: 无模型生命周期边界；保留本站身份与编辑内容，不授予新仓库收录资格
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createHash } from 'node:crypto'
import { repoKey, refreshRow } from './catalog.ts'
import { readGitHubIdentity, repositoryIdentity } from './github-identity.ts'
import { isPinnedEvidenceUrl, pinnedSource } from '../src/lib/inclusion.ts'
import { isRecord, type CatalogLifecycleTarget, type DirectoryItem, type GitHubApi, type GitHubRepository } from './model-types.ts'

export const LIFECYCLE_CYCLE_MS = 6 * 3600000
export const LIFECYCLE_CONFIRM_MS = 72 * 3600000
export const LIFECYCLE_CONFIRM_COUNT = 3
export const LIFECYCLE_LOOKUP_LIMIT = 50
const MAX_OBSERVATION_RUNS = 14
const MAX_SOURCE_BYTES = 512 * 1024
export interface UnavailableObservation { first: string; last: string; count: number; runId: string; cycle: number; runIds: string[] }
export type LifecycleObservations = Record<string, UnavailableObservation>
export interface LifecycleReport {
  migrated: number; review: number; unavailable: number; restored: number; checked: number
  observationSkipped?: 'incomplete-round' | 'control-probe-failed' | 'mass-unavailable' | 'missing-run-id'
  deferred?: string
}
const iso = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
export function validateLifecycleObservations(value: unknown): asserts value is LifecycleObservations {
  if (!isRecord(value)) throw new Error('metadata-invalid-observations')
  for (const [id, item] of Object.entries(value)) {
    if (!id || !isRecord(item) || !iso(item.first) || !iso(item.last) || item.first > item.last ||
      !Number.isSafeInteger(item.count) || Number(item.count) < 1 || Number(item.count) > LIFECYCLE_CONFIRM_COUNT ||
      typeof item.runId !== 'string' || !/^[1-9]\d*$/.test(item.runId) || !Number.isSafeInteger(item.cycle) ||
      item.cycle !== Math.floor(Date.parse(item.last) / LIFECYCLE_CYCLE_MS) ||
      !Array.isArray(item.runIds) || item.runIds.length < Number(item.count) || item.runIds.length > MAX_OBSERVATION_RUNS ||
      item.runIds.some(id => typeof id !== 'string' || !/^[1-9]\d*$/.test(id)) || new Set(item.runIds).size !== item.runIds.length ||
      item.runIds.at(-1) !== item.runId) throw new Error('metadata-invalid-observations')
  }
}
export function massUnavailable(total: number, unavailable: number): boolean { return unavailable >= 10 && unavailable * 2 >= total }

function targetOf(repo: GitHubRepository): CatalogLifecycleTarget {
  const identity = repositoryIdentity(repo)
  if (!identity || repoKey(repo.html_url) !== repo.full_name.toLowerCase()) throw new Error('github-invalid-response')
  return { url: repo.html_url, ...identity }
}
function restRepository(value: unknown): GitHubRepository {
  if (!isRecord(value) || typeof value.html_url !== 'string' || !repoKey(value.html_url) ||
    typeof value.full_name !== 'string' || repoKey(value.html_url) !== value.full_name.toLowerCase() ||
    typeof value.name !== 'string' || !isRecord(value.owner) || typeof value.owner.login !== 'string' ||
    value.full_name !== `${value.owner.login}/${value.name}` || value.private !== false ||
    !readGitHubIdentity({ databaseId: value.id, nodeId: value.node_id }) ||
    !Number.isSafeInteger(value.stargazers_count) || Number(value.stargazers_count) < 0 ||
    !Number.isSafeInteger(value.forks_count) || Number(value.forks_count) < 0 ||
    !(value.language === null || typeof value.language === 'string')) throw new Error('github-invalid-response')
  return value as unknown as GitHubRepository
}
async function optionalRepository(api: GitHubApi, path: string): Promise<GitHubRepository | null> {
  try { return restRepository(await api(path)) } catch (error) {
    if (error instanceof Error && error.message === 'github-http-404') return null
    throw error
  }
}
function markReview(row: DirectoryItem, target: CatalogLifecycleTarget, reason: 'identity-changed' | 'migration-evidence' | 'address-conflict', now: string): void {
  row.sourceMeta.lifecycle = { state: 'review', since: row.sourceMeta.lifecycle?.state === 'review' ? row.sourceMeta.lifecycle.since : now, reason, target }
}

// --- 只迁移同一固定 SHA 的来源；同名路径不构成证据连续性 ---
async function migrateReferences(row: DirectoryItem, target: CatalogLifecycleTarget, api: GitHubApi): Promise<DirectoryItem['sourceMeta']> {
  const meta = structuredClone(row.sourceMeta), key = repoKey(target.url)!
  const cache = new Map<string, Promise<string>>()
  const source = (url: string): { next: string; sha: string; path?: string } => {
    if (!isPinnedEvidenceUrl(url, row.url)) throw new Error('metadata-migration-evidence')
    const parsed = new URL(url), parts = parsed.pathname.split('/'), sha = parts[4]
    const pinned = pinnedSource(url, row.url)
    return { next: `${target.url.replace(/\/$/, '')}/${parts.slice(3).join('/')}${parsed.hash}`, sha, ...(pinned ? { path: pinned.path } : {}) }
  }
  const verify = async (url: string, quote?: string, hash?: string): Promise<string> => {
    const proof = source(url), cacheKey = `${proof.sha}:${proof.path ?? ''}`
    let pending = cache.get(cacheKey)
    if (!pending) {
      pending = (async () => {
        if (!proof.path) {
          const commit = await api(`/repos/${key}/commits/${proof.sha}`)
          if (!isRecord(commit) || commit.sha !== proof.sha) throw new Error('metadata-migration-evidence')
          return ''
        }
        const file = await api(`/repos/${key}/contents/${proof.path.split('/').map(encodeURIComponent).join('/')}?ref=${proof.sha}`)
        if (!isRecord(file) || file.type !== 'file' || file.path !== proof.path || file.encoding !== 'base64' ||
          typeof file.content !== 'string' || file.content.length > Math.ceil(MAX_SOURCE_BYTES * 4 / 3) + 10000 ||
          typeof file.size !== 'number' || file.size > MAX_SOURCE_BYTES || file.size < 0) throw new Error('metadata-migration-evidence')
        const bytes = Buffer.from(file.content, 'base64')
        if (bytes.byteLength > MAX_SOURCE_BYTES || bytes.byteLength !== file.size || typeof file.sha !== 'string' ||
          createHash('sha1').update(`blob ${bytes.byteLength}\0`).update(bytes).digest('hex') !== file.sha) throw new Error('metadata-migration-evidence')
        // BOM 属于原审核文本；保留字符，保持来源哈希一致。
        return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)
      })()
      cache.set(cacheKey, pending)
    }
    const content = await pending
    if (quote !== undefined && !content.replace(/\r\n?/g, '\n').includes(quote.replace(/\r\n?/g, '\n'))) throw new Error('metadata-migration-evidence')
    if (hash !== undefined && createHash('sha256').update(content).digest('hex') !== hash) throw new Error('metadata-migration-evidence')
    return proof.next
  }
  if (meta.inclusion) for (const citation of meta.inclusion.evidence) citation.url = await verify(citation.url, citation.quote)
  if (meta.jevEvidence !== undefined) {
    const evidence = meta.jevEvidence
    if (!isRecord(evidence) || typeof evidence.evidenceUrl !== 'string') throw new Error('metadata-migration-evidence')
    const primary = source(evidence.evidenceUrl)
    if (evidence.sha !== undefined && evidence.sha !== primary.sha) throw new Error('metadata-migration-evidence')
    const originalEvidenceUrl = evidence.evidenceUrl
    evidence.evidenceUrl = await verify(originalEvidenceUrl)
    const textParts: string[] = []
    if (evidence.evidenceLinks !== undefined) {
      if (!Array.isArray(evidence.evidenceLinks)) throw new Error('metadata-migration-evidence')
      for (const link of evidence.evidenceLinks) {
        if (!isRecord(link) || typeof link.url !== 'string' || source(link.url).sha !== primary.sha ||
          typeof link.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(link.sha256) ||
          typeof link.path !== 'string' || source(link.url).path !== link.path) throw new Error('metadata-migration-evidence')
        const proof = source(link.url)
        link.url = await verify(link.url, undefined, link.sha256)
        textParts.push(`\n--- Integration evidence: ${link.path} ---\n${await cache.get(`${proof.sha}:${proof.path ?? ''}`)}`)
      }
    }
    if (evidence.evidenceSha256 !== undefined) {
      const primaryText = await cache.get(`${primary.sha}:${primary.path ?? ''}`)
      if (typeof evidence.evidenceSha256 !== 'string' || createHash('sha256').update((primaryText ?? '') + textParts.join('\n')).digest('hex') !== evidence.evidenceSha256) throw new Error('metadata-migration-evidence')
    }
    if (evidence.repo !== undefined) evidence.repo = key
  }
  return meta
}

export async function reconcileCatalogLifecycle({ rows, observed, unavailableIds, observations, api, now, runId, observationSkipped }: {
  rows: DirectoryItem[]; observed: Map<string, GitHubRepository>; unavailableIds: string[]; observations: LifecycleObservations
  api: GitHubApi; now: Date; runId?: string; observationSkipped?: LifecycleReport['observationSkipped']
}): Promise<{ observations: LifecycleObservations; report: LifecycleReport }> {
  validateLifecycleObservations(observations)
  const at = now.toISOString(), cycle = Math.floor(now.getTime() / LIFECYCLE_CYCLE_MS)
  const next: LifecycleObservations = Object.assign(Object.create(null), structuredClone(observations))
  const clearedObservations = new Set<string>()
  const clearObservation = (id: string) => { delete next[id]; clearedObservations.add(id) }
  const byId = new Map(rows.map(row => [row.id, row]))
  const report: LifecycleReport = { migrated: 0, review: 0, unavailable: 0, restored: 0, checked: 0, ...(observationSkipped ? { observationSkipped } : {}) }
  // 人工移除记录不复活；过期观察不在目录之外独立增长。
  for (const id of Object.keys(next)) if (!byId.has(id)) delete next[id]
  const present = async (row: DirectoryItem, repo: GitHubRepository) => {
    if (row.sourceMeta.lifecycle?.state === 'replaced') return
    const target = targetOf(repo), identity = readGitHubIdentity(row.sourceMeta.githubIdentity)
    clearObservation(row.id)
    if (identity && target.databaseId !== identity.databaseId) { markReview(row, target, 'identity-changed', at); report.review++; return }
    // 待审核隔离只能由审核器解除；统计成功不是准入许可。
    if (row.sourceMeta.lifecycle?.state === 'review') return
    if (repoKey(row.url) !== repoKey(target.url)) {
      const collision = rows.some(other => other.id !== row.id && [other.url, ...(other.sourceMeta.previousUrls ?? [])].some(url => repoKey(url) === repoKey(target.url)))
      if (collision) { markReview(row, target, 'address-conflict', at); report.review++; return }
      let meta: DirectoryItem['sourceMeta']
      try { meta = await migrateReferences(row, target, api) } catch (error) {
        const reason = error instanceof Error ? error.message : 'metadata-migration-evidence'
        if (reason === 'github-http-401' || reason.startsWith('github-') && reason !== 'github-http-404') { report.deferred = reason; return }
        markReview(row, target, 'migration-evidence', at); report.review++; return
      }
      const [oldOwner, oldName] = new URL(row.url).pathname.slice(1).replace(/\/$/, '').split('/')
      const previous = [...new Set([...(meta.previousUrls ?? []), row.url])].filter(url => repoKey(url) !== repoKey(target.url))
      if (row.title === oldName) row.title = repo.name
      if (meta.author === oldOwner) meta.author = repo.owner.login
      row.url = target.url
      row.sourceMeta = { ...meta, repo: repo.full_name, previousUrls: previous, githubIdentity: { databaseId: target.databaseId, nodeId: target.nodeId } }
      report.migrated++
    }
    if (row.sourceMeta.lifecycle?.state === 'unavailable') { delete row.sourceMeta.lifecycle; report.restored++ }
  }
  for (const [id, repo] of observed) { const row = byId.get(id); if (row) await present(row, repo); if (report.deferred) break }
  if (report.deferred || observationSkipped && observationSkipped !== 'mass-unavailable' || !runId) return { observations: { ...next }, report }
  const beforeMissing = structuredClone(next)
  const newlyUnavailable: DirectoryItem[] = []
  const missing = unavailableIds.filter(id => byId.get(id)?.sourceMeta.lifecycle?.state !== 'replaced')
  // 每轮最多 100 次 REST 复核；按周期轮转，避免尾部永久饿死。
  const start = missing.length ? (cycle * LIFECYCLE_LOOKUP_LIMIT) % missing.length : 0
  for (let offset = 0; offset < Math.min(missing.length, LIFECYCLE_LOOKUP_LIMIT); offset++) {
    const row = byId.get(missing[(start + offset) % missing.length])!
    const identity = readGitHubIdentity(row.sourceMeta.githubIdentity)
    if (!identity) continue
    try {
      report.checked++
      const restored = await optionalRepository(api, `/repositories/${identity.databaseId}`)
      if (restored) {
        if (restored.id !== identity.databaseId) throw new Error('github-invalid-response')
        Object.assign(row, refreshRow(row, { ...restored, html_url: row.url }))
        observed.set(row.id, restored)
        await present(row, restored)
        if (report.deferred) break
        continue
      }
      const current = await optionalRepository(api, `/repos/${repoKey(row.url)}`)
      if (current) {
        if (current.id === identity.databaseId) { Object.assign(row, refreshRow(row, current)); observed.set(row.id, current); await present(row, current) }
        else { markReview(row, targetOf(current), 'identity-changed', at); clearObservation(row.id); report.review++ }
        continue
      }
      if (row.sourceMeta.lifecycle || observationSkipped) continue
      const old = next[row.id]
      if (old && (old.runIds.includes(runId) || cycle <= old.cycle || at < old.last)) continue
      const runIds = [...(old?.runIds ?? []), runId]
      if (runIds.length > MAX_OBSERVATION_RUNS) throw new Error('metadata-observation-window-exceeded')
      const observation: UnavailableObservation = { first: old?.first ?? at, last: at, count: Math.min(LIFECYCLE_CONFIRM_COUNT, (old?.count ?? 0) + 1), runId, cycle, runIds }
      next[row.id] = observation
      if (observation.count >= LIFECYCLE_CONFIRM_COUNT && now.getTime() - Date.parse(observation.first) >= LIFECYCLE_CONFIRM_MS) {
        row.sourceMeta.lifecycle = { state: 'unavailable', since: observation.first }; newlyUnavailable.push(row); report.unavailable++
      }
    } catch (error) {
      report.deferred = error instanceof Error ? error.message : 'github-invalid-response'
      break
    }
  }
  if (report.deferred) {
    for (const row of newlyUnavailable) delete row.sourceMeta.lifecycle
    report.unavailable = 0
    // 撤回新增失效，不复活已被成功读数或身份隔离中断的失败串。
    for (const id of clearedObservations) delete beforeMissing[id]
    return { observations: { ...beforeMissing }, report }
  }
  return { observations: { ...next }, report }
}
