/**
 * [INPUT]: 依赖 目录公共类型与来源星标/日期
 * [OUTPUT]: 提供确定性项目排序与全目录星标排名；星标并列共用标题/ID 次序
 * [POS]: lib 的排序权威，App、列表及收藏共享排名身份
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { DirectoryItem, GithubSort } from './types.ts'

function numOrZero(v: number | null | undefined): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : 0
}

/** Missing / empty dates sort last for both asc and “newest first”. */
function dateKey(item: DirectoryItem): string | null {
  const d = item.sourceMeta.date
  if (d == null || String(d).trim() === '') return null
  return String(d).slice(0, 10)
}

/** 1-based star rank among GitHub rows. Ties break by title, then id. */
export function githubStarRanks(items: DirectoryItem[]): Map<string, number> {
  const github = items.filter((item) => item.type === 'github')
  github.sort(compareStars)
  const ranks = new Map<string, number>()
  github.forEach((item, i) => {
    ranks.set(item.id, i + 1)
  })
  return ranks
}

function compareStars(a: DirectoryItem, b: DirectoryItem): number {
  return numOrZero(b.sourceMeta.stars) - numOrZero(a.sourceMeta.stars)
    || a.title.localeCompare(b.title, 'en', { sensitivity: 'base' })
    || a.id.localeCompare(b.id)
}

export function sortGithubItems(
  items: DirectoryItem[],
  sort: GithubSort,
): DirectoryItem[] {
  const copy = [...items]
  if (sort === 'stars') {
    copy.sort(compareStars)
  } else if (sort === 'name') {
    copy.sort((a, b) =>
      a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }),
    )
  } else {
    // date — newest first; missing last
    copy.sort((a, b) => {
      const da = dateKey(a)
      const db = dateKey(b)
      if (da == null && db == null) return 0
      if (da == null) return 1
      if (db == null) return -1
      return db.localeCompare(da)
    })
  }
  return copy
}
