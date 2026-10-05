/**
 * [INPUT]: 依赖只读 GitHub API、固定 main SHA 与目录资源大小边界
 * [OUTPUT]: 提供有界分页、严格响应/提交校验、固定版本 UTF-8 文件读取
 * [POS]: scripts 的投稿 GitHub 只读工具；通过与拒收共用同一读取边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { isRecord, type GitHubApi } from './model-types.ts'
import { MAX_CATALOG_FILE_BYTES } from './catalog.ts'
import { REPOSITORY } from './submission-review.ts'
export const PREFIX = `/repos/${REPOSITORY}`
export const SHA = /^[a-f0-9]{40}$/
export const record = (value: unknown): Record<string, any> => {
  if (!isRecord(value)) throw new Error('intake-invalid-response')
  return value
}

export async function pages<T>(api: GitHubApi, path: string): Promise<T[]> {
  const all: T[] = []
  for (let page = 1; page <= 10; page++) {
    const rows = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`)
    if (!Array.isArray(rows)) throw new Error('intake-invalid-response')
    all.push(...rows)
    if (rows.length < 100) return all
  }
  throw new Error('intake-pagination-limit')
}

export async function mainSha(api: GitHubApi): Promise<string> {
  const sha = record(record(await api(`${PREFIX}/git/ref/heads/main`)).object).sha
  if (typeof sha !== 'string' || !SHA.test(sha)) throw new Error('intake-invalid-sha')
  return sha
}

export async function textAt(api: GitHubApi, path: string, sha: string): Promise<string> {
  if (!SHA.test(sha)) throw new Error('intake-invalid-sha')
  let file = record(await api(`${PREFIX}/contents/${path}?ref=${sha}`))
  if (file.encoding === 'none' && SHA.test(file.sha)) file = record(await api(`${PREFIX}/git/blobs/${file.sha}`))
  if (file.encoding !== 'base64' || typeof file.content !== 'string' ||
    !Number.isSafeInteger(file.size) || file.size < 0 || file.size > MAX_CATALOG_FILE_BYTES ||
    file.content.length > MAX_CATALOG_FILE_BYTES * 2) throw new Error('intake-invalid-file')
  const bytes = Buffer.from(file.content, 'base64')
  if (bytes.length !== file.size) throw new Error('intake-invalid-file')
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}
