/**
 * [INPUT]: 依赖采集基线、本轮结果、最新 main 的规范数据与既有目录/新闻校验
 * [OUTPUT]: 对外提供 mergePublishedCatalog、mergePublishedNews 的三方增量叠加
 * [POS]: scripts 的纯发布合并边界；远端顺序/人工内容优先，采集器只更新有权限的字段
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { isDeepStrictEqual as equal } from 'node:util'
import { repoKey, validateRepositoryIdentityChanges, validateRows } from './catalog.ts'
import { isPublicProject } from '../src/lib/catalog-visibility.ts'
import { mergeCollectedRow, validateCollectedRow, validateReplacements, type CatalogWriter } from './catalog-mutation.ts'
import { knownGitHubIds } from './github-identity.ts'
import { reviewDecision } from './jev-client.ts'
import { validateNews } from './news-sync.ts'
import type { DirectoryItem } from './model-types.ts'
import type { NewsItem } from '../src/lib/news.ts'

export function mergePublishedCatalog(base: DirectoryItem[], collected: DirectoryItem[], latest: DirectoryItem[], mode: CatalogWriter = 'radar'): DirectoryItem[] {
  validateRows(base); validateRows(collected); validateRows(latest)
  validateRepositoryIdentityChanges(collected, base)
  validateReplacements(base, collected, mode)
  const collectedIds = new Set(collected.map(row => row.id))
  if (base.some(row => !collectedIds.has(row.id))) throw new Error('publication-catalog-deletion')
  const baseById = new Map(base.map(row => [row.id, row]))
  const result = structuredClone(latest)
  const positions = new Map(result.map((row, index) => [row.id, index]))
  // 先叠加旧身份，再收录新身份；隐藏旧记录不占用公开地址。
  for (const [index, incoming] of collected.entries()) {
    const before = baseById.get(incoming.id)
    if (!before) continue
    if (base[index]?.id !== incoming.id) throw new Error('publication-catalog-reordered')
    validateCollectedRow(before, incoming, mode)
    const position = positions.get(incoming.id)
    if (position === undefined) {
      if (incoming.sourceMeta.lifecycle?.state === 'replaced' && before.sourceMeta.lifecycle?.state !== 'replaced') throw new Error('publication-withdrawn-replacement')
      continue // 不用旧采集结果复活维护者撤回的记录。
    }
    result[position] = mergeCollectedRow(before, incoming, result[position], mode)
  }
  const urls = new Set(result.filter(isPublicProject).map(row => repoKey(row.url)))
  const identities = knownGitHubIds(result)
  for (const incoming of collected.filter(row => !baseById.has(row.id))) {
    if (reviewDecision(incoming.sourceMeta) !== 'keep') throw new Error('publication-unreviewed-addition')
    const currentIndex = positions.get(incoming.id)
    const identity = incoming.sourceMeta.githubIdentity?.databaseId
    if (currentIndex !== undefined) {
      const current = result[currentIndex]
      if (current.url !== incoming.url || current.sourceMeta.githubIdentity?.databaseId !== identity) throw new Error('publication-id-collision')
      continue
    }
    if (urls.has(repoKey(incoming.url)) || identity !== undefined && identities.has(identity)) {
      if (result.some(row => row.sourceMeta.lifecycle?.state === 'replaced' && row.sourceMeta.lifecycle.target?.databaseId === identity)) throw new Error('publication-replacement-conflict')
      continue
    }
    const added = structuredClone(incoming)
    positions.set(added.id, result.length); result.push(added)
    if (isPublicProject(added)) urls.add(repoKey(added.url))
    if (identity !== undefined) identities.add(identity)
  }
  validateRows(result)
  validateRepositoryIdentityChanges(result, latest)
  return result
}

export function mergePublishedNews(base: NewsItem[], collected: NewsItem[], latest: NewsItem[]): NewsItem[] {
  validateNews(base); validateNews(collected); validateNews(latest)
  const before = new Map(base.map((row) => [row.id, row]))
  const collectedIds = new Set(collected.map((row) => row.id))
  if (base.some((row) => !collectedIds.has(row.id))) throw new Error('publication-news-deletion')
  const result = structuredClone(latest)
  const positions = new Map(result.map((row, index) => [row.id, index]))
  for (const row of collected) {
    const original = before.get(row.id)
    if (equal(original, row)) continue
    const index = positions.get(row.id)
    if (index === undefined) {
      if (original) continue // 不复活远端已删除/撤回的新闻。
      positions.set(row.id, result.length); result.push(structuredClone(row))
    } else if (equal(result[index], original)) result[index] = structuredClone(row)
    // 同一条新闻有并发修改时保留 main 整条记录，不拼出不存在的混合文章。
  }
  return validateNews(result)
}
