/**
 * [INPUT]: 依赖规范项目的可选 sourceMeta.lifecycle 标记
 * [OUTPUT]: 提供 isPublicProject 与保留原记录的 publicProjects
 * [POS]: lib 的唯一公开可见性规则；三态均隐藏，不删除采集与去重所需历史
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// --- 只认标记缺席；未知或损坏的生命周期值也不能公开 ---
export function isPublicProject(row: object): boolean {
  if (!('sourceMeta' in row)) return true
  const meta = row.sourceMeta
  return typeof meta !== 'object' || meta === null || !('lifecycle' in meta)
}

export function publicProjects<T extends object>(rows: readonly T[]): T[] {
  return rows.filter(isPublicProject)
}
