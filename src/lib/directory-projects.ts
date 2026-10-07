/**
 * [INPUT]: 依赖构建期公开目录投影、分类白名单与全局星标排名
 * [OUTPUT]: 提供完整展示目录、全局排名及分类计数
 * [POS]: lib 的目录展示身份；只由 App 消费；分页 head 只读取服务端计数，审计仍归规范快照
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import githubData from 'virtual:directory-catalog'
import { CATEGORIES, type Category } from './categories'
import { githubStarRanks } from './sort'
import type { DirectoryItem } from './types'

export const directoryProjects = githubData as (DirectoryItem & { category?: Category })[]
export const directoryRanks = githubStarRanks(directoryProjects)
export const directoryCategoryCounts = Object.fromEntries(CATEGORIES.map((category) =>
  [category, directoryProjects.filter((item) => (item.category ?? 'other') === category).length])) as Record<Category, number>
