/**
 * [INPUT]: 依赖目录排序类型、结果数量与不可信 URL 页码
 * [OUTPUT]: 提供每页 50 条、搜索参数校验、分页范围与有界页码清单
 * [POS]: lib 的分页纯规则；界面与路由 head 共用，不拆分规范快照
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { GithubSort } from './types.ts'

export const DIRECTORY_PAGE_SIZE = 50
export interface DirectorySearch { page?: number; sort?: GithubSort }

export function directorySearch(search: Record<string, unknown>): DirectorySearch {
  const value = search.page
  const page = typeof value === 'number' ? value : typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : NaN
  return {
    page: Number.isSafeInteger(page) && page > 1 ? page : undefined,
    sort: search.sort === 'stars' || search.sort === 'date' || search.sort === 'name' ? search.sort : undefined,
  }
}

export function paginationRange(total: number, requested: unknown = 1) {
  const pages = Math.max(1, Math.ceil(total / DIRECTORY_PAGE_SIZE))
  const page = Math.min(pages, directorySearch({ page: requested }).page ?? 1)
  const start = (page - 1) * DIRECTORY_PAGE_SIZE
  return { page, pages, start, end: Math.min(start + DIRECTORY_PAGE_SIZE, total), total }
}

export function paginate<T>(items: readonly T[], requested: unknown = 1) {
  const range = paginationRange(items.length, requested)
  return { ...range, items: items.slice(range.start, range.end) }
}

export function paginationNumbers(page: number, pages: number, compact = false): (number | 'ellipsis')[] {
  if (compact && pages > 5) {
    if (page <= 3) return [1, 2, 3, 'ellipsis', pages]
    if (page >= pages - 2) return [1, 'ellipsis', pages - 2, pages - 1, pages]
    return [1, 'ellipsis', page, 'ellipsis', pages]
  }
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1)
  const first = page <= 4 ? 2 : page >= pages - 3 ? pages - 4 : page - 1
  const last = page <= 4 ? 5 : page >= pages - 3 ? pages - 1 : page + 1
  return [1, ...(first > 2 ? ['ellipsis' as const] : []),
    ...Array.from({ length: last - first + 1 }, (_, index) => first + index),
    ...(last < pages - 1 ? ['ellipsis' as const] : []), pages]
}
