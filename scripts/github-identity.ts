/**
 * [INPUT]: 依赖 model-types 的 GitHubIdentity 契约和 GitHub 返回的身份字段
 * [OUTPUT]: 对外提供 readGitHubIdentity、repositoryIdentity、knownGitHubIds，统一基线校验与发现去重
 * [POS]: scripts 的仓库身份边界；数字 ID 认定对象，Node ID 仅作为不透明查询地址
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { isRecord, type DirectoryItem, type GitHubIdentity, type GitHubRepository } from './model-types.ts'

export function readGitHubIdentity(value: unknown): GitHubIdentity | null {
  if (!isRecord(value) || typeof value.databaseId !== 'number' || !Number.isSafeInteger(value.databaseId) || value.databaseId <= 0 ||
    typeof value.nodeId !== 'string' || !value.nodeId.trim() || value.nodeId !== value.nodeId.trim() || value.nodeId.length > 200) return null
  return { databaseId: value.databaseId, nodeId: value.nodeId }
}

export function repositoryIdentity(repo: GitHubRepository): GitHubIdentity | null {
  if (repo.id === undefined && repo.node_id === undefined) return null
  const identity = readGitHubIdentity({ databaseId: repo.id, nodeId: repo.node_id })
  if (!identity) throw new Error('github-invalid-identity')
  return identity
}

export function knownGitHubIds(rows: readonly DirectoryItem[]): Set<number> {
  return new Set(rows.flatMap((row) => {
    const identity = readGitHubIdentity(row.sourceMeta.githubIdentity)
    return identity ? [identity.databaseId] : []
  }))
}
