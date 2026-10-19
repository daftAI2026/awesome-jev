/**
 * [INPUT]: 依赖规范快照、公开身份、标签与共享分页/分享图规则
 * [OUTPUT]: 提供构建期静态路由清单与有限查询页预渲染计划
 * [POS]: scripts 的免费计算迁移边界；隔离框架编码，不复制项目数据
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { publicProjects } from '../src/lib/catalog-visibility.ts'
import { CATEGORIES } from '../src/lib/categories.ts'
import { projectTagIndex, TAG_INDEX_MIN_PROJECTS } from '../src/lib/project-tags.ts'
import { LOCALES, localizedPath } from '../src/lib/locale-routes.ts'
import { parseGitHubRepositoryUrl } from '../src/lib/project-routes.ts'
import { projectShareImage, siteShareImage } from '../src/lib/share-image.ts'
import { paginationRange } from '../src/lib/pagination.ts'
import { staticPagePath, type StaticCatalog } from '../src/lib/static-delivery.ts'
import type { DirectoryItem } from '../src/lib/types.ts'

export const STATIC_CATALOG_ID = 'virtual:static-catalog'
export function staticCatalog(rows: readonly (DirectoryItem & { category?: string })[], newsCount: number): StaticCatalog {
  const projects = publicProjects(rows)
  const counts: Record<string, number> = { '/': projects.length, '/top100': Math.min(100, projects.length), '/news': newsCount, '/tags': 0 }
  for (const category of CATEGORIES) counts[`/category/${category}`] = projects.filter((p) => (p.category ?? 'other') === category).length
  for (const tag of projectTagIndex(projects)) if (tag.count >= TAG_INDEX_MIN_PROJECTS) counts[tag.path] = tag.count
  const pages: Record<string, number> = {}
  for (const locale of LOCALES) for (const [path, count] of Object.entries(counts)) pages[localizedPath(path, locale)] = count
  const imageEntry = (path: string, count?: number) => ({ path, asset: `/_og/${new URL(path, 'https://assets.local').searchParams.get('v')}.png`, ...(count !== undefined ? { count } : {}) })
  const images: StaticCatalog['images'] = { '/api/og/site': imageEntry(siteShareImage(projects.length).path, projects.length) }
  for (const project of projects) {
    const repo = parseGitHubRepositoryUrl(project.url)
    if (repo) images[`/api/og/projects/${repo.key}`] = imageEntry(projectShareImage(project).path)
  }
  return { pages, images }
}

export function staticPrerenderPages(catalog: StaticCatalog) {
  const pages: { path: string; prerender: { outputPath: string } }[] = []
  const owners = new Map<string, string>()
  for (const [path, total] of Object.entries(catalog.pages)) {
    const sorts = /\/(news|tags)$/.test(path) ? ['stars'] : ['stars', 'name', 'date']
    for (const sort of sorts) for (let page = 1; page <= paginationRange(total).pages; page++) {
      const outputPath = staticPagePath(path, page, sort)
      const owner = owners.get(outputPath)
      if (owner && owner !== path) throw new Error(`Static route collision: ${path}`)
      owners.set(outputPath, path)
      const query = new URLSearchParams()
      if (page > 1) query.set('page', String(page))
      if (sort !== 'stars') query.set('sort', sort)
      // --- Start 1.171.52 连续解码路径两次；保护百分号，防止 C# 变成 C ---
      // 公开 URL 与资产身份不变；框架升级由真实归一函数回归检查。
      const requestPath = path.replaceAll('%', '%2525')
      // 框架对整串补 /；构建片段阻止污染查询，HTTP 层会移除片段。
      pages.push({ path: requestPath + (query.size ? `?${query}` : '') + '#/', prerender: { outputPath } })
    }
  }
  return pages
}
