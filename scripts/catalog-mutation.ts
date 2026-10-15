/**
 * [INPUT]: 依赖规范身份、固定来源格式、Jev 准入阈值与采集器角色
 * [OUTPUT]: 提供按请求时效和分类绑定的差异校验与身份原子叠加
 * [POS]: 目录写权限边界；统计不换身份，复核不继承旧凭据
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { isDeepStrictEqual as equal } from 'node:util'
import { parseGitHubRepositoryUrl } from '../src/lib/project-routes.ts'
import { isPinnedEvidenceUrl } from '../src/lib/inclusion.ts'
import { isProjectCategory, reviewDecision } from './jev-client.ts'
import { isRecord, type DirectoryItem } from './model-types.ts'

export type CatalogWriter = 'radar' | 'alternatives' | 'metadata'
export const STATISTIC_FIELDS = ['stars', 'forks', 'language', 'githubIdentity'] as const
const REVIEW_FIELDS = ['jevAbout', 'jevKeep', 'jevKeepConfidence', 'needsReview', 'conflictingEvidence', 'jevEvidence'] as const
const ATOMIC_FIELDS = ['repo', 'previousUrls', 'inclusion', 'previousInclusion', 'lifecycle', ...REVIEW_FIELDS] as const
const key = (url: string) => parseGitHubRepositoryUrl(url)?.key
const copy = (target: Record<string, unknown>, from: Record<string, unknown>, field: string) => {
  if (Object.hasOwn(from, field)) target[field] = structuredClone(from[field])
  else delete target[field]
}
function history(before: DirectoryItem, url: string): string[] {
  return [...new Set([...(before.sourceMeta.previousUrls ?? []), ...(before.url !== url ? [before.url] : [])])]
    .filter(previous => key(previous) !== key(url))
}
function migrateEvidence(before: DirectoryItem, url: string): Partial<Pick<DirectoryItem['sourceMeta'], 'inclusion' | 'jevEvidence'>> {
  const result: Partial<Pick<DirectoryItem['sourceMeta'], 'inclusion' | 'jevEvidence'>> = {}
  const move = (old: string): string => {
    const source = new URL(old)
    const tail = source.pathname.split('/').slice(3).join('/')
    return `${url.replace(/\/$/, '')}/${tail}${source.hash}`
  }
  if (before.sourceMeta.inclusion) {
    result.inclusion = structuredClone(before.sourceMeta.inclusion)
    for (const item of result.inclusion.evidence) item.url = move(item.url)
  }
  if (before.sourceMeta.jevEvidence !== undefined) {
    const receipt = structuredClone(before.sourceMeta.jevEvidence)
    if (!isRecord(receipt) || typeof receipt.evidenceUrl !== 'string') throw new Error('publication-invalid-migration-evidence')
    receipt.evidenceUrl = move(receipt.evidenceUrl)
    if (Object.hasOwn(receipt, 'repo')) receipt.repo = key(url)
    if (Array.isArray(receipt.evidenceLinks)) for (const item of receipt.evidenceLinks) {
      if (!isRecord(item) || typeof item.url !== 'string') throw new Error('publication-invalid-migration-evidence')
      item.url = move(item.url)
    }
    result.jevEvidence = receipt
  }
  return result
}
function machineNames(expected: DirectoryItem, before: DirectoryItem, incoming: DirectoryItem): void {
  const old = parseGitHubRepositoryUrl(before.url), next = parseGitHubRepositoryUrl(incoming.url)
  if (!old || !next) throw new Error('publication-invalid-migration')
  // 保留手工命名；只有旧地址直接派生的名称允许随地址变化。
  if (before.title === old.repo && incoming.title === next.repo) expected.title = incoming.title
  if (before.sourceMeta.author === old.owner && incoming.sourceMeta.author === next.owner) expected.sourceMeta.author = incoming.sourceMeta.author
}
function reviewed(incoming: DirectoryItem, since: string): boolean {
  const receipt = incoming.sourceMeta.jevEvidence
  const score = isRecord(receipt) && isRecord(receipt.score) ? receipt.score : undefined
  return reviewDecision(incoming.sourceMeta) === 'keep' && isRecord(receipt) && receipt.status === 'keep' &&
    score !== undefined && reviewDecision(score) === 'keep' && typeof receipt.sha === 'string' &&
    /^[a-f0-9]{40}$/.test(receipt.sha) && typeof receipt.evidenceUrl === 'string' &&
    isPinnedEvidenceUrl(receipt.evidenceUrl, incoming.url) && new URL(receipt.evidenceUrl).pathname.split('/')[4] === receipt.sha && typeof receipt.checkedAt === 'string' &&
    Date.parse(receipt.checkedAt) >= Date.parse(since) && receipt.repo === key(incoming.url) &&
    isProjectCategory(score.category) && score.category === incoming.category &&
    ['jevAbout', 'jevKeep', 'jevKeepConfidence'].every(field => score[field] === incoming.sourceMeta[field])
}
export function validateCollectedRow(before: DirectoryItem, incoming: DirectoryItem, mode: CatalogWriter): boolean {
  const expected = structuredClone(before)
  for (const field of STATISTIC_FIELDS) if (Object.hasOwn(incoming.sourceMeta, field)) copy(expected.sourceMeta, incoming.sourceMeta, field)
  if (equal(expected, incoming)) return false
  const oldIdentity = before.sourceMeta.githubIdentity, identity = incoming.sourceMeta.githubIdentity
  if (!oldIdentity || !identity) throw new Error('publication-editorial-change')
  if (oldIdentity.databaseId !== identity.databaseId) throw new Error('publication-github-identity-conflict')
  if (mode === 'metadata') {
    const old = before.sourceMeta.lifecycle, next = incoming.sourceMeta.lifecycle
    if (old?.state === 'replaced' && !equal(old, next) || next?.state === 'replaced' && old?.state !== 'replaced' ||
      old?.state === 'review' && next?.state !== 'review') throw new Error('publication-lifecycle-transition')
    copy(expected.sourceMeta, incoming.sourceMeta, 'lifecycle')
    if (before.url !== incoming.url) {
      if (old?.state === 'review' || old?.state === 'replaced' || next || key(incoming.url) !== key(`https://github.com/${incoming.sourceMeta.repo}`) ||
        !equal(history(before, incoming.url), incoming.sourceMeta.previousUrls)) throw new Error('publication-invalid-migration')
      expected.url = incoming.url
      expected.sourceMeta.repo = incoming.sourceMeta.repo
      expected.sourceMeta.previousUrls = history(before, incoming.url)
      Object.assign(expected.sourceMeta, migrateEvidence(before, incoming.url))
      machineNames(expected, before, incoming)
    }
  } else if (mode === 'radar' && before.sourceMeta.lifecycle?.state === 'review') {
    const request = before.sourceMeta.lifecycle, target = request.target
    if (!target) throw new Error('publication-invalid-review-request')
    if (target.databaseId !== oldIdentity.databaseId) {
      const replaced = { ...request, state: 'replaced' }
      if (!equal(incoming.sourceMeta.lifecycle, replaced)) throw new Error('publication-invalid-replacement')
      expected.sourceMeta.lifecycle = incoming.sourceMeta.lifecycle
    } else {
      if (incoming.sourceMeta.lifecycle || key(incoming.url) !== key(target.url) || !reviewed(incoming, request.since)) throw new Error('publication-unreviewed-migration')
      expected.url = incoming.url
      expected.sourceMeta.repo = incoming.sourceMeta.repo
      const previous = history(before, incoming.url)
      if (previous.length) expected.sourceMeta.previousUrls = previous
      else delete expected.sourceMeta.previousUrls
      const archived = [...(before.sourceMeta.previousInclusion ?? []), ...(before.sourceMeta.inclusion ? [before.sourceMeta.inclusion] : [])]
      if (archived.length) expected.sourceMeta.previousInclusion = archived
      delete expected.sourceMeta.inclusion
      delete expected.sourceMeta.lifecycle
      for (const field of REVIEW_FIELDS) copy(expected.sourceMeta, incoming.sourceMeta, field)
      machineNames(expected, before, incoming)
    }
  }
  if (!equal(expected, incoming)) throw new Error('publication-editorial-change')
  return true
}

export function mergeCollectedRow(before: DirectoryItem, incoming: DirectoryItem, current: DirectoryItem, mode: CatalogWriter): DirectoryItem {
  const structural = validateCollectedRow(before, incoming, mode)
  const result = structuredClone(current)
  if (structural) {
    // 地址、证据、生命周期作为一个原子组；冲突不产生半迁移记录。
    if (current.url !== before.url || current.sourceMeta.githubIdentity?.databaseId !== before.sourceMeta.githubIdentity?.databaseId ||
      ATOMIC_FIELDS.some(field => !equal(current.sourceMeta[field], before.sourceMeta[field])) ||
      mode === 'radar' && current.category !== before.category) throw new Error('publication-lifecycle-conflict')
    result.url = incoming.url
    for (const field of ATOMIC_FIELDS) copy(result.sourceMeta, incoming.sourceMeta, field)
    if (current.title === before.title) result.title = incoming.title
    if (equal(current.sourceMeta.author, before.sourceMeta.author)) copy(result.sourceMeta, incoming.sourceMeta, 'author')
  } else if (current.url !== before.url || current.sourceMeta.repo !== before.sourceMeta.repo ||
    before.sourceMeta.githubIdentity && current.sourceMeta.githubIdentity?.databaseId !== before.sourceMeta.githubIdentity.databaseId) return result
  for (const field of STATISTIC_FIELDS) {
    if (equal(incoming.sourceMeta[field], before.sourceMeta[field])) continue
    if (equal(current.sourceMeta[field], before.sourceMeta[field])) copy(result.sourceMeta, incoming.sourceMeta, field)
    else if (field === 'githubIdentity' && current.sourceMeta.githubIdentity?.databaseId !== incoming.sourceMeta.githubIdentity?.databaseId) {
      throw new Error('publication-github-identity-conflict')
    }
  }
  return result
}
export function validateReplacements(before: DirectoryItem[], incoming: DirectoryItem[], mode: CatalogWriter): void {
  const oldById = new Map(before.map(row => [row.id, row]))
  const additions = incoming.filter(row => !oldById.has(row.id))
  if (mode === 'metadata' && additions.length) throw new Error('publication-metadata-membership-change')
  for (const added of additions) {
    const sameAddress = before.filter(row => key(row.url) === key(added.url))
    const sources = sameAddress.filter(row => row.sourceMeta.lifecycle?.state !== 'replaced')
    const bound = (row: DirectoryItem) => row.sourceMeta.lifecycle?.state === 'review' &&
      row.sourceMeta.lifecycle.target !== undefined && row.sourceMeta.lifecycle.target.databaseId === added.sourceMeta.githubIdentity?.databaseId &&
      key(row.sourceMeta.lifecycle.target.url) === key(added.url) &&
      incoming.find(next => next.id === row.id)?.sourceMeta.lifecycle?.state === 'replaced'
    // 旧代档案不重审；只有档案而没有本次绑定时，仍禁止普通发现接管地址。
    if (sameAddress.length && (sources.some(row => !bound(row)) || !sources.length && !before.some(bound))) {
      throw new Error('publication-unbound-replacement')
    }
  }
  for (const old of before) {
    const next = incoming.find(row => row.id === old.id)
    if (!next || old.sourceMeta.lifecycle?.state === 'replaced' || next.sourceMeta.lifecycle?.state !== 'replaced') continue
    const target = old.sourceMeta.lifecycle?.target
    const added = incoming.find(row => !oldById.has(row.id) && row.sourceMeta.githubIdentity?.databaseId === target?.databaseId)
    if (mode !== 'radar' || !target || !added || added.id !== `gh-repo-${target.databaseId}` || key(added.url) !== key(target.url) ||
      added.sourceMeta.lifecycle || old.category === 'alternatives' && added.category !== 'alternatives' ||
      added.sourceMeta.inclusion !== undefined || added.sourceMeta.previousInclusion !== undefined ||
      !reviewed(added, old.sourceMeta.lifecycle!.since)) throw new Error('publication-unreviewed-replacement')
  }
}
