/**
 * [INPUT]: 依赖构建期 MCP 白名单、预排序索引与既有身份和标签规则
 * [OUTPUT]: 提供 McpCatalog、查询类型、searchProjects 与 getProject
 * [POS]: lib 的 MCP 纯查询边界；不建索引、不排序、不调用模型或外部 API
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { CATEGORIES, type Category } from './categories.ts'
import type { InclusionBasis } from './inclusion.ts'
import { parseGitHubRepositoryUrl } from './project-routes.ts'
import { normalizeProjectTag } from './project-tags.ts'
import type { GithubSort } from './types.ts'

export const MCP_QUERY_MAX_LENGTH = 160
export const MCP_QUERY_MAX_WORDS = 8
export const MCP_RESULT_LIMIT = 20
export const MCP_PAGE_LIMIT = 10_000
export const MCP_SUMMARY_LENGTH = 320

export interface McpSnapshot {
  version: string
  count: number
  updatedAt?: string
}

export interface McpProject {
  id: string
  repository: string
  title: string
  summary: string
  category: Category
  tags: string[]
  language: string | null
  stars: number | null
  forks: number | null
  author: string | null
  date: string | null
  url: string
  pageUrl: string
  inclusion?: Pick<InclusionBasis, 'text' | 'evidence' | 'checkedAt'>
}

export interface McpCatalog {
  snapshot: McpSnapshot
  projects: McpProject[]
  searchText: string[]
  languages: string[]
  order: Record<GithubSort, number[]>
  addresses: Record<string, number>
}

export interface McpSearchArgs {
  query?: string
  category?: Category
  tag?: string
  language?: string
  sort?: GithubSort
  page?: number
  limit?: number
}

export type McpSearchItem = Omit<McpProject, 'inclusion'> & { summaryTruncated: boolean }
export interface McpSearchResult {
  snapshot: McpSnapshot
  total: number
  page: number
  limit: number
  nextPage: number | null
  items: McpSearchItem[]
}

// --- 构建和请求共用正规化；关键词始终作为普通文本，而非正则或指令 ---
export function normalizeMcpText(value: string): string {
  return value.normalize('NFKC').toLowerCase()
}

function boundedText(value: unknown, maximum: number, name: string): string {
  if (value === undefined) return ''
  if (typeof value !== 'string' || value.length > maximum) throw new TypeError(`Invalid ${name}`)
  return value.trim()
}

function boundedInteger(value: unknown, fallback: number, maximum: number, name: string): number {
  if (value === undefined) return fallback
  if (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > maximum) throw new RangeError(`Invalid ${name}`)
  return Number(value)
}

function searchItem(project: McpProject): McpSearchItem {
  const { inclusion: _inclusion, ...item } = project
  const summaryTruncated = item.summary.length > MCP_SUMMARY_LENGTH
  return { ...item, summary: summaryTruncated ? `${item.summary.slice(0, MCP_SUMMARY_LENGTH - 1)}…` : item.summary, summaryTruncated }
}

export function searchProjects(catalog: McpCatalog, args: McpSearchArgs = {}): McpSearchResult {
  if (args === null || typeof args !== 'object' || Array.isArray(args)) throw new TypeError('Invalid arguments')
  const query = normalizeMcpText(boundedText(args.query, MCP_QUERY_MAX_LENGTH, 'query'))
  const words = query.split(/\s+/u).filter(Boolean)
  if (words.length > MCP_QUERY_MAX_WORDS) throw new RangeError('Invalid query')
  const category = args.category
  if (category !== undefined && !CATEGORIES.includes(category)) throw new TypeError('Invalid category')
  const sort = args.sort ?? 'stars'
  if (sort !== 'stars' && sort !== 'name' && sort !== 'date') throw new TypeError('Invalid sort')
  const tagInput = boundedText(args.tag, 50, 'tag')
  const tag = normalizeProjectTag(tagInput)
  const language = normalizeMcpText(boundedText(args.language, 80, 'language'))
  const page = boundedInteger(args.page, 1, MCP_PAGE_LIMIT, 'page')
  const limit = boundedInteger(args.limit, 10, MCP_RESULT_LIMIT, 'limit')
  const offset = (page - 1) * limit
  const items: McpSearchItem[] = []
  let total = 0
  // --- 顺序由同版本构建给定；只扫描一次，正文仅投影当前页 ---
  for (const index of catalog.order[sort]) {
    const project = catalog.projects[index]
    if (category && project.category !== category ||
      tagInput && (!tag || !project.tags.includes(tag)) ||
      language && catalog.languages[index] !== language ||
      words.some(word => !catalog.searchText[index].includes(word))) continue
    if (total >= offset && items.length < limit) items.push(searchItem(project))
    total++
  }
  return { snapshot: catalog.snapshot, total, page, limit, nextPage: total > offset + limit ? page + 1 : null, items }
}

export function getProject(catalog: McpCatalog, identity: string): { snapshot: McpSnapshot; project: McpProject | null } {
  const input = boundedText(identity, 500, 'identity')
  const repository = parseGitHubRepositoryUrl(/^https:\/\//i.test(input) ? input : `https://github.com/${input}`)
  const index = repository && Object.hasOwn(catalog.addresses, repository.key) ? catalog.addresses[repository.key] : undefined
  return { snapshot: catalog.snapshot, project: index === undefined ? null : catalog.projects[index] }
}
