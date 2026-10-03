/**
 * [INPUT]: 依赖目录快照字段、分类白名单与规范项目路径
 * [OUTPUT]: 对外提供 relatedProjects，返回最多三条有共同主题的详情投影
 * [POS]: lib 的确定性相关性规则；服务端选择候选，不以星标或通用 Jev 标签冒充相关性
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { CATEGORIES, type Category } from './categories.ts'
import { projectPathFromUrl } from './project-routes.ts'
import type { DirectoryItem } from './types.ts'

export type CategorizedProject = DirectoryItem & { category?: Category }
export interface RelatedProject {
  title: string
  summary: string
  path: string
  topics: string[]
}

const LIMIT = 3
const GENERIC_TOPICS = new Set([
  'jev', 'jev-ai', 'typesafe', 'typesafe-ai', 'system-one', 'ai', 'llm',
  'model', 'demo', 'open-source', 'local', 'typescript', 'javascript', 'python',
  'go', 'rust', 'java', 'c', 'c++', 'c#', 'shell', 'html', 'css', 'swift',
  'ruby', 'kotlin', 'php', 'jupyter-notebook', 'jupyter notebook',
])

function topics(item: DirectoryItem): Set<string> {
  const language = item.sourceMeta.language?.trim().toLowerCase()
  return new Set((item.tags ?? []).map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag && !GENERIC_TOPICS.has(tag) && tag !== language))
}

interface Candidate extends RelatedProject { id: string; category: Category }
// --- 同一不可变快照只建一次分类/主题索引；HMR 新快照使用新弱键，不复用过期内容 ---
const indexes = new WeakMap<readonly CategorizedProject[], Map<Category, Map<string, Candidate[]>>>()

function topicIndex(items: readonly CategorizedProject[]) {
  const cached = indexes.get(items)
  if (cached) return cached
  const unique = new Map<string, Candidate | null>()
  for (const item of items) {
    if (item.type !== 'github' || !item.category || item.category === 'other' || !CATEGORIES.includes(item.category) || !item.summary.trim()) continue
    const path = projectPathFromUrl(item.url)
    if (!path) continue
    // 重复规范身份不依赖输入顺序挑选一条，直接排除歧义候选。
    unique.set(path, unique.has(path) ? null : { id: item.id, category: item.category, path, title: item.title, summary: item.summary, topics: [...topics(item)] })
  }
  const index = new Map<Category, Map<string, Candidate[]>>()
  for (const item of unique.values()) {
    if (!item) continue
    let category = index.get(item.category)
    if (!category) { category = new Map(); index.set(item.category, category) }
    for (const topic of item.topics) category.set(topic, [...(category.get(topic) ?? []), item])
  }
  indexes.set(items, index)
  return index
}

export function relatedProjects(items: readonly CategorizedProject[], current: CategorizedProject): RelatedProject[] {
  if (!current.category || current.category === 'other' || !CATEGORIES.includes(current.category)) return []
  const currentPath = projectPathFromUrl(current.url)
  const currentTopics = topics(current)
  if (!currentPath || !currentTopics.size) return []
  const candidatesByPath = new Map<string, Candidate>()
  const index = topicIndex(items).get(current.category)
  for (const topic of currentTopics) {
    for (const item of index?.get(topic) ?? []) {
      if (item.path !== currentPath && item.id !== current.id) candidatesByPath.set(item.path, item)
    }
  }
  const candidates: RelatedProject[] = []
  for (const item of candidatesByPath.values()) {
    const shared = item.topics.filter((topic) => currentTopics.has(topic)).sort()
    candidates.push({ path: item.path, title: item.title, summary: item.summary, topics: shared })
  }
  return candidates.sort((a, b) => b.topics.length - a.topics.length || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)).slice(0, LIMIT)
}
