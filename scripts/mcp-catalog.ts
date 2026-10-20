/**
 * [INPUT]: 依赖唯一规范快照、公开可见性、分类、标签、排序和项目身份规则
 * [OUTPUT]: 提供 buildMcpCatalog，生成每条至多 4096 字节的 MCP 白名单和查询索引
 * [POS]: scripts 的 MCP 构建边界；超限拒绝发布，审计字段不进入产物
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createHash } from 'node:crypto'
import { publicProjects } from '../src/lib/catalog-visibility.ts'
import { normalizeCatalogUpdatedAt } from '../src/lib/catalog-updated-at.ts'
import { CATEGORIES, type Category } from '../src/lib/categories.ts'
import { normalizeMcpText, type McpCatalog, type McpProject } from '../src/lib/mcp-catalog.ts'
import { parseGitHubRepositoryUrl, projectPathFor } from '../src/lib/project-routes.ts'
import { projectTags } from '../src/lib/project-tags.ts'
import { SITE_ORIGIN } from '../src/lib/share-image.ts'
import { sortGithubItems } from '../src/lib/sort.ts'
import type { DirectoryItem, GithubSort } from '../src/lib/types.ts'

export type McpCatalogSource = DirectoryItem & {
  category?: Category
  sourceMeta: DirectoryItem['sourceMeta'] & { previousUrls?: string[] }
}
export const MCP_CATALOG_ID = 'virtual:mcp-catalog'
const MCP_PROJECT_MAX_BYTES = 4096

function project(row: McpCatalogSource): McpProject {
  const repository = parseGitHubRepositoryUrl(row.url), path = projectPathFor(row)
  if (!repository || !path) throw new Error('Invalid MCP repository')
  const meta = row.sourceMeta, inclusion = meta.inclusion
  const category = row.category ?? 'other'
  if (!CATEGORIES.includes(category)) throw new Error('Invalid MCP category')
  const item: McpProject = {
    id: row.id, repository: repository.key, title: row.title, summary: row.summary,
    category, tags: projectTags(row), language: meta.language ?? null,
    stars: meta.stars ?? null, forks: meta.forks ?? null, author: meta.author ?? null, date: meta.date ?? null,
    url: `https://github.com/${repository.owner}/${repository.repo}`, pageUrl: `${SITE_ORIGIN}${path}`,
    ...(inclusion ? {
      inclusion: {
        text: { en: inclusion.text.en, zh: inclusion.text.zh, ja: inclusion.text.ja },
        evidence: inclusion.evidence.map(({ url, quote }) => ({ url, quote })),
        checkedAt: inclusion.checkedAt,
      },
    } : {}),
  }
  const bytes = Buffer.byteLength(JSON.stringify(item), 'utf8')
  if (bytes > MCP_PROJECT_MAX_BYTES) {
    throw new Error(`MCP project too large: ${item.repository} (${bytes} bytes > ${MCP_PROJECT_MAX_BYTES})`)
  }
  return item
}

export function buildMcpCatalog(rows: readonly McpCatalogSource[], updatedAt?: string): McpCatalog {
  const visible = publicProjects(rows), projects = visible.map(project)
  const addresses: Record<string, number> = {}
  const ids = new Set<string>()
  projects.forEach((item, index) => {
    if (Object.hasOwn(addresses, item.repository) || ids.has(item.id)) throw new Error('Duplicate MCP repository or ID')
    addresses[item.repository] = index
    ids.add(item.id)
  })
  // --- 当前地址优先于历史；多个公开项目争用同一旧地址时不发布该别名 ---
  const aliases = new Map<string, number | null>()
  visible.forEach((row, index) => {
    for (const url of row.sourceMeta.previousUrls ?? []) {
      const repository = parseGitHubRepositoryUrl(url)
      if (!repository || Object.hasOwn(addresses, repository.key)) continue
      const previous = aliases.get(repository.key)
      aliases.set(repository.key, previous === undefined || previous === index ? index : null)
    }
  })
  for (const [key, index] of aliases) if (index !== null) addresses[key] = index
  const indexes = new Map(visible.map((row, index) => [row, index]))
  const order = Object.fromEntries((['stars', 'name', 'date'] as const).map(sort =>
    [sort, sortGithubItems(visible, sort).map(row => indexes.get(row)!)],
  )) as Record<GithubSort, number[]>
  const searchText = projects.map(item => normalizeMcpText([
    item.repository, item.title, item.summary, item.category, item.language ?? '', item.author ?? '', ...item.tags,
  ].join('\n')))
  const languages = projects.map(item => normalizeMcpText(item.language ?? ''))
  const data = { projects, searchText, languages, order, addresses }
  const version = createHash('sha256').update(JSON.stringify(data)).digest('hex')
  const timestamp = normalizeCatalogUpdatedAt(updatedAt)
  return { snapshot: { version, count: projects.length, ...(timestamp ? { updatedAt: timestamp } : {}) }, ...data }
}
