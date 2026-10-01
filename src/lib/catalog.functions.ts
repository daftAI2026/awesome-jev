/**
 * [INPUT]: 依赖 TanStack Start 服务端函数、现有 JSON 快照与项目/新闻身份工具
 * [OUTPUT]: 对外提供 getProject、getNewsItem、getNewsIndex 的同源只读数据边界
 * [POS]: lib 的路由数据适配器；详情只交付当前记录，完整快照不进入全站启动包
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createServerFn } from '@tanstack/react-start'
import { findGitHubProject } from './project-routes'
import { findNewsItem, type NewsItem } from './news'
import type { DirectoryItem } from './types'
import type { Category } from './categories'

export const getProject = createServerFn({ method: 'GET' })
  .validator((input: { owner: string; repo: string }) => {
    if (!input || typeof input.owner !== 'string' || typeof input.repo !== 'string') {
      throw new TypeError('Invalid project identity')
    }
    return { owner: input.owner, repo: input.repo }
  })
  .handler(async ({ data }) => {
    const { default: projects } = await import('../../data/github.json')
    return (findGitHubProject(projects as DirectoryItem[], data.owner, data.repo) ?? null) as
      (DirectoryItem & { category?: Category }) | null
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
