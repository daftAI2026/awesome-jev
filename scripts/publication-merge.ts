/**
 * [INPUT]: 依赖采集基线、本轮结果、最新 main 的规范数据与既有目录/新闻校验
 * [OUTPUT]: 对外提供 mergePublishedCatalog、mergePublishedNews 的三方增量叠加
 * [POS]: scripts 的纯发布合并边界；远端顺序/人工内容优先，采集器只更新有权限的字段
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { isDeepStrictEqual as equal } from 'node:util'
import { repoKey, validateRepositoryIdentityChanges, validateRows } from './catalog.ts'
import { knownGitHubIds } from './github-identity.ts'
import { reviewDecision } from './jev-client.ts'
import { validateNews } from './news-sync.ts'
import type { DirectoryItem } from './model-types.ts'
import type { NewsItem } from '../src/lib/news.ts'

const AUTOMATIC_FIELDS = ['stars', 'forks', 'language', 'githubIdentity'] as const

export function mergePublishedCatalog(base: DirectoryItem[], collected: DirectoryItem[], latest: DirectoryItem[]): DirectoryItem[] {
  validateRows(base); validateRows(collected); validateRows(latest)
  validateRepositoryIdentityChanges(collected, base)
  const collectedIds = new Set(collected.map((row) => row.id))
  if (base.some((row) => !collectedIds.has(row.id))) throw new Error('publication-catalog-deletion')
  const baseById = new Map(base.map((row) => [row.id, row]))
  const result = structuredClone(latest)
  const latestById = new Map(result.map((row) => [row.id, row]))
  const urls = new Set(result.map((row) => repoKey(row.url)))
  const identities = knownGitHubIds(result)
  for (const [index, incoming] of collected.entries()) {
    const before = baseById.get(incoming.id)
    const current = latestById.get(incoming.id)
    if (before) {
      if (base[index]?.id !== incoming.id) throw new Error('publication-catalog-reordered')
      const expected = structuredClone(before)
      for (const field of AUTOMATIC_FIELDS) {
        if (Object.hasOwn(incoming.sourceMeta, field)) Object.assign(expected.sourceMeta, { [field]: incoming.sourceMeta[field] })
      }
      if (!equal(expected, incoming)) throw new Error('publication-editorial-change')
      // 远端删除/身份变更由维护者掌控，不用旧采集结果复活或改写它。
      if (!current || current.url !== before.url || current.sourceMeta.repo !== before.sourceMeta.repo) continue
      for (const field of AUTOMATIC_FIELDS) {
        if (equal(incoming.sourceMeta[field], before.sourceMeta[field])) continue
        if (equal(current.sourceMeta[field], before.sourceMeta[field])) {
          Object.assign(current.sourceMeta, { [field]: incoming.sourceMeta[field] })
        } else if (field === 'githubIdentity') {
          const oldId = current.sourceMeta.githubIdentity?.databaseId
          const nextId = incoming.sourceMeta.githubIdentity?.databaseId
          if (oldId !== nextId) throw new Error('publication-github-identity-conflict')
        }
        // 同时变动的统计保留最新 main；核心发布随后重新刷新最终 Top100。
      }
      if (current.sourceMeta.githubIdentity) identities.add(current.sourceMeta.githubIdentity.databaseId)
    } else {
      if (reviewDecision(incoming.sourceMeta) !== 'keep') throw new Error('publication-unreviewed-addition')
      const identity = incoming.sourceMeta.githubIdentity?.databaseId
      if (current) {
        if (current.url !== incoming.url) throw new Error('publication-id-collision')
        continue
      }
      if (urls.has(repoKey(incoming.url)) || identity !== undefined && identities.has(identity)) continue
      const added = structuredClone(incoming)
      result.push(added); latestById.set(added.id, added); urls.add(repoKey(added.url))
      if (identity !== undefined) identities.add(identity)
    }
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
