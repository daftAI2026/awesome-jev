/**
 * [INPUT]: 依赖 TanStack Start 服务端函数、规范快照、项目/新闻身份与确定性相关性规则
 * [OUTPUT]: 对外提供 getProject、getNewsItem、getNewsIndex 的同源只读数据边界
 * [POS]: lib 的路由数据适配器；项目详情只交付当前记录和最多三条相关摘要或旧地址重定向，完整快照不进入全站启动包
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createServerFn } from '@tanstack/react-start'
import { findGitHubProject, projectRedirectPath } from './project-routes'
import { findNewsItem, type NewsItem } from './news'
import type { DirectoryItem } from './types'
import { relatedProjects, type CategorizedProject } from './related-projects'

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
    if (item) return { item, related: relatedProjects(projects as CategorizedProject[], item) }
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
