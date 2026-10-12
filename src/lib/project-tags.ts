/**
 * [INPUT]: 依赖项目 tags 原始数组，不读取简介或调用模型
 * [OUTPUT]: 提供公开标签、同义名称、规范路径与按项目去重的计数
 * [POS]: lib 的标签投影权威；原始快照不变，详情/目录/索引共用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export const TAG_INDEX_MIN_PROJECTS = 3

// --- 只合并明确同义名称；不合并 C/C++、SDK/MCP 或宽窄用途 ---
const ALIASES: Record<string, string> = {
  agent: 'ai-agents', agents: 'ai-agents', 'ai-agent': 'ai-agents',
  golang: 'go', benchmarks: 'benchmark', evaluations: 'evaluation',
  chatbots: 'chatbot', workflows: 'workflow', 'mcp-servers': 'mcp-server',
  'node.js': 'nodejs', 'node-js': 'nodejs',
  aiagents: 'ai-agents', 'agent-skill': 'agent-skills', 'coding-agent': 'coding-agents',
  'llm-agent': 'llm-agents', 'awesome-lists': 'awesome-list', guardrail: 'guardrails',
  'decision-models': 'decision-model', skill: 'skills', 'github-action': 'github-actions',
  csharp: 'c#', cpp: 'c++', devtools: 'developer-tools', evals: 'evaluation',
  'jupyter notebook': 'jupyter-notebook', 'artificial-intelligence': 'ai',
  systemone: 'system-one', 'system-one-model': 'system-one', 'system-one-models': 'system-one', 'typesafe-jev': 'jev',
}
const GENERIC = new Set(['jev', 'jev-ai', 'jev-model', 'typesafe', 'typesafe-ai', 'typesafeai', 'system-one', 'ai', 'open-source', 'demo'])

export interface TaggedProject { tags?: readonly string[] }
export interface ProjectTag { tag: string; path: string; count: number }

export function normalizeProjectTag(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const tag = value.trim().toLowerCase()
  if (!/^[a-z0-9+# .-]{1,50}$/.test(tag) || tag === '.' || tag === '..') return null
  const normalized = Object.hasOwn(ALIASES, tag) ? ALIASES[tag] : tag
  return GENERIC.has(normalized) ? null : normalized
}

export function projectTags(project: TaggedProject): string[] {
  return [...new Set((project.tags ?? []).map(normalizeProjectTag).filter((tag): tag is string => tag !== null))]
}

export function projectTagPath(tag: string): string {
  return `/tags/${encodeURIComponent(tag)}`
}

export function projectTagFromPath(path: string): string | null {
  const segment = path.match(/^\/tags\/([^/]+)\/?$/)?.[1]
  if (!segment) return null
  try { return normalizeProjectTag(decodeURIComponent(segment)) } catch { return null }
}

const indexes = new WeakMap<readonly TaggedProject[], ProjectTag[]>()
export function projectTagIndex(projects: readonly TaggedProject[]): ProjectTag[] {
  const cached = indexes.get(projects)
  if (cached) return cached
  const counts = new Map<string, number>()
  for (const project of projects) for (const tag of projectTags(project)) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  const index = [...counts].map(([tag, count]) => ({ tag, count, path: projectTagPath(tag) }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'en'))
  indexes.set(projects, index)
  return index
}

export function hasProjectTag(project: TaggedProject, tag: string): boolean {
  return projectTags(project).includes(tag)
}
