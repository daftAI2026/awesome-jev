/**
 * [INPUT]: 依赖 Fuse.js 与目录公共类型
 * [OUTPUT]: 对外提供 项目检索、标签提取及来源/标签过滤
 * [POS]: lib 的本地搜索层，目录数据由调用方提供，不读取网络
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import Fuse, { type IFuseOptions } from 'fuse.js'
import type { DirectoryItem, FilterType } from './types'

const fuseOptions: IFuseOptions<DirectoryItem> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'summary', weight: 0.25 },
    { name: 'tags', weight: 0.2 },
    { name: 'sourceMeta.repo', weight: 0.08 },
    { name: 'sourceMeta.author', weight: 0.04 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  includeScore: true,
}

export function createSearcher(items: DirectoryItem[]) {
  return new Fuse(items, fuseOptions)
}

export function searchItems(
  items: DirectoryItem[],
  query: string,
  filter: FilterType,
  activeTags: string[],
): DirectoryItem[] {
  const typed = items.filter((item) => item.type === filter)

  const tagged =
    activeTags.length === 0
      ? typed
      : typed.filter((item) =>
          activeTags.every((tag) => (item.tags ?? []).includes(tag)),
        )

  const q = query.trim()
  if (!q) return tagged

  const fuse = createSearcher(tagged)
  return fuse.search(q).map((r) => r.item)
}

export function collectTags(items: DirectoryItem[]): string[] {
  const set = new Set<string>()
  for (const item of items) {
    for (const tag of item.tags ?? []) set.add(tag)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}
