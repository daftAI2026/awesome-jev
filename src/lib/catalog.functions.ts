/**
 * [INPUT]: 依赖 TanStack Start 服务端函数、规范快照、项目/新闻身份与确定性相关性规则
 * [OUTPUT]: 提供 getProjectTag 标签计数；详情携带十二条页脚标签；提供 getProject、getNewsItem、getNewsIndex 与 getDirectoryCounts 同源只读边界
 * [POS]: lib 的路由数据适配器；项目详情只交付当前记录和最多三条相关摘要或旧地址重定向，完整快照不进入全站启动包
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createServerFn } from '@tanstack/react-start'
import { findGitHubProject, projectRedirectPath } from './project-routes'
import { findNewsItem, type NewsItem } from './news'
import type { DirectoryItem } from './types'
import { relatedProjects, type CategorizedProject } from './related-projects'
import { projectTagIndex, normalizeProjectTag, TAG_INDEX_MIN_PROJECTS } from './project-tags'
import { CATEGORIES } from './categories'

export const getDirectoryCounts = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { default: projects } = await import('../../data/github.json')
    return {
      total: projects.length,
      categories: Object.fromEntries(CATEGORIES.map((category) => [category,
        projects.filter((item) => (item.category ?? 'other') === category).length])),
    }
  })

export const getProjectTag = createServerFn({ method: 'GET' })
  .validator((input: { tag: string }) => {
    const tag = normalizeProjectTag(input?.tag)
    if (!tag) throw new TypeError('Invalid project tag')
    return { tag }
  })
  .handler(async ({ data }) => {
    const { default: projects } = await import('../../data/github.json')
    return projectTagIndex(projects).find((entry) => entry.tag === data.tag) ?? null
  })

export const getProject = createServerFn({ method: 'GET' })
  .validator((input: { owner: string; repo: string }) => {
    if (!input || typeof input.owner !== 'string' || typeof input.repo !== 'string') {
      throw new TypeError('Invalid project identity')
    }
    return { owner: input.owner, repo: input.repo }
  })
  .handler(async ({ data }) => {
    const { default: projects } = await import('../../data/github.json')
    const item = findGitHubProject(projects as DirectoryItem[], data.owner, data.repo) as CategorizedProject | undefined
    if (item) return { item, related: relatedProjects(projects as CategorizedProject[], item), tags: projectTagIndex(projects).filter((entry) => entry.count >= TAG_INDEX_MIN_PROJECTS).slice(0, 12) }
    const redirectTo = projectRedirectPath(projects, data.owner, data.repo)
    return redirectTo ? { redirectTo } : null
  })

export const getNewsItem = createServerFn({ method: 'GET' })
  .validator((input: { id: string }) => {
    if (!input || typeof input.id !== 'string') throw new TypeError('Invalid news identity')
    return { id: input.id }
  })
  .handler(async ({ data }) => {
    const { default: news } = await import('../../data/news.json')
    return findNewsItem(news as NewsItem[], data.id) ?? null
  })

export const getNewsIndex = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { default: news } = await import('../../data/news.json')
    return news as NewsItem[]
  })
