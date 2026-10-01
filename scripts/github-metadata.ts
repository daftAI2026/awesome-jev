/**
 * [INPUT]: 依赖共享 GitHub 只读客户端、catalog 的身份/人工字段保护、人工复核迁移 ID 清单及 UI 星标排名
 * [OUTPUT]: 对外提供 50 项元数据批读、Top100 优先与其它项续点刷新、无付费凭据探针
 * [POS]: scripts 的元数据调度边界，雷达保持规范顺序并按服务端实际额度暂停；已人工复核迁移只映射统计
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { refreshRow, repoKey } from './catalog.ts'
import { createGitHubClient, isGitHubRunDeferred } from './github-client.ts'
import { METADATA_IDENTITY_ALIASES } from './github-metadata-aliases.ts'
import { githubStarRanks } from '../src/lib/sort.ts'
import type { DirectoryItem, GitHubApi, GitHubRepository } from './model-types.ts'

export const METADATA_BATCH_SIZE = 50
export const METADATA_OTHER_LIMIT = 1000
export interface MetadataReport {
  ok: number; failed: number; batches: number; cost: number | null; other: number; remaining: number
  top100: { ok: number; total: number; complete: boolean; unrefreshed: string[] }
}
interface MetadataCursor { metadataCursor: number; metadataNext?: string }
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const rowKey = (row: DirectoryItem): string => {
  const key = repoKey(row.url)
  if (!key) throw new Error('github-invalid-metadata-identity')
  return key
}
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
export function metadataTop(rows: DirectoryItem[]): DirectoryItem[] {
  const ranks = githubStarRanks(rows)
  return rows.filter((row) => ranks.has(row.id)).sort((a, b) => ranks.get(a.id)! - ranks.get(b.id)!).slice(0, 100)
}
export function updateMetadataTop(rows: DirectoryItem[], fresh: Set<string>, report: MetadataReport): void {
  const top = metadataTop(rows)
  const ok = top.filter((row) => fresh.has(rowKey(row))).length
  report.top100 = { ok, total: top.length, complete: ok === top.length, unrefreshed: top.filter((row) => !fresh.has(rowKey(row))).map(rowKey) }
  report.remaining = rows.filter((row) => row.type === 'github' && !fresh.has(rowKey(row))).length
}

// --- 无连接字段；每个 alias 固定映射原身份，重命名/空值/局部错误不覆盖人工记录 ---
export async function readMetadataBatch(api: GitHubApi, rows: DirectoryItem[]): Promise<{ repositories: (GitHubRepository | null)[]; cost: number | null }> {
  if (!rows.length || rows.length > METADATA_BATCH_SIZE) throw new Error('github-invalid-metadata-batch')
  const fields = rows.map((row, i) => {
    const key = rowKey(row)
    if (!key) throw new Error('github-invalid-metadata-identity')
    const [owner, name] = key.split('/')
    return `r${i}: repository(owner:${JSON.stringify(owner)}, name:${JSON.stringify(name)}) { databaseId nameWithOwner url stargazerCount forkCount primaryLanguage { name } }`
  })
  const payload = await api('/graphql', { query: `query CatalogMetadata { ${fields.join('\n')} rateLimit { cost remaining limit resetAt } }` })
  if (!record(payload) || !record(payload.data) || payload.errors !== undefined && !Array.isArray(payload.errors)) throw new Error('github-invalid-response')
  const data = payload.data
  const errors = (payload.errors ?? []) as unknown[]
  const globalError = errors.some((error) => !record(error) || !Array.isArray(error.path) || typeof error.path[0] !== 'string')
  const repositories = rows.map((row, i): GitHubRepository | null => {
    const alias = `r${i}`
    if (globalError || errors.some((error) => record(error) && Array.isArray(error.path) && error.path[0] === alias)) return null
    const value = data[alias]
    const identity = METADATA_IDENTITY_ALIASES[rowKey(row)]
    const expected = identity?.target ?? rowKey(row)
    if (!record(value) || typeof value.nameWithOwner !== 'string' || typeof value.url !== 'string' ||
      repoKey(value.url) !== expected || repoKey(`https://github.com/${value.nameWithOwner}`) !== expected ||
      identity !== undefined && value.databaseId !== identity.repositoryId ||
      !count(value.stargazerCount) || !count(value.forkCount) ||
      !(value.primaryLanguage === null || record(value.primaryLanguage) && typeof value.primaryLanguage.name === 'string')) return null
    const [owner, name] = value.nameWithOwner.split('/')
    return { html_url: row.url, full_name: value.nameWithOwner, owner: { login: owner }, name,
      stargazers_count: value.stargazerCount, forks_count: value.forkCount,
      language: value.primaryLanguage === null ? null : (value.primaryLanguage as { name: string }).name }
  })
  return { repositories, cost: record(data.rateLimit) && count(data.rateLimit.cost) ? data.rateLimit.cost : null }
}

export async function refreshMetadata(rows: DirectoryItem[], state: MetadataCursor, api: GitHubApi, otherLimit = METADATA_OTHER_LIMIT) {
  if (!count(otherLimit) || otherLimit > METADATA_OTHER_LIMIT) throw new Error('github-invalid-metadata-limit')
  const report: MetadataReport = { ok: 0, failed: 0, batches: 0, cost: 0, other: 0, remaining: rows.length,
    top100: { ok: 0, total: 0, complete: false, unrefreshed: [] } }
  const fresh = new Set<string>()
  const attempted = new Set<string>()
  const failures: { repo: string; reason: string }[] = []
  let deferred: { phase: string; reason: string; metadataRemaining?: number } | undefined
  const read = async (batch: DirectoryItem[]): Promise<boolean> => {
    try {
      const result = await readMetadataBatch(api, batch)
      report.batches++
      report.cost = report.cost === null || result.cost === null ? null : report.cost + result.cost
      batch.forEach((row, i) => {
        const key = rowKey(row)
        attempted.add(key)
        const meta = result.repositories[i]
        if (meta) { Object.assign(row, refreshRow(row, meta)); fresh.add(key); report.ok++ }
        else { report.failed++; failures.push({ repo: key, reason: 'github-invalid-metadata' }) }
      })
      return true
    } catch (error) {
      // 未收到可信 cost 时不能把一次失败查询记成免费。
      report.cost = null
      if (isGitHubRunDeferred(error)) {
        deferred = { phase: 'metadata', reason: (error as Error).message }
        return false
      }
      for (const row of batch) {
        const key = rowKey(row)
        attempted.add(key); report.failed++
        failures.push({ repo: key, reason: error instanceof Error && /^github-[a-z0-9-]+$/.test(error.message) ? error.message : 'github-invalid-response' })
      }
      return true
    }
  }
  const priority = async () => {
    // 每个身份本轮最多尝试一次；星标下降带来的新 Top 必须继续补读，失败不能伪称成功。
    while (!deferred) {
      const pending = metadataTop(rows).filter((row) => !attempted.has(rowKey(row)))
      if (!pending.length) break
      if (!await read(pending.slice(0, METADATA_BATCH_SIZE))) break
    }
    updateMetadataTop(rows, fresh, report)
  }
  await priority()
  if (report.top100.complete && !deferred && rows.length) {
    const anchor = state.metadataNext ? rows.findIndex((row) => rowKey(row) === state.metadataNext) : -1
    let cursor = anchor >= 0 ? anchor : state.metadataCursor % rows.length
    let visited = 0
    while (visited < rows.length && report.other < otherLimit && !deferred) {
      const batch: DirectoryItem[] = []
      let next = cursor
      let scanned = 0
      while (visited + scanned < rows.length && batch.length < Math.min(METADATA_BATCH_SIZE, otherLimit - report.other)) {
        const row = rows[next]
        next = (next + 1) % rows.length; scanned++
        if (row.type === 'github' && !attempted.has(rowKey(row))) batch.push(row)
      }
      if (batch.length && !await read(batch)) break
      report.other += batch.length
      cursor = next; visited += scanned
      state.metadataCursor = cursor
      state.metadataNext = rowKey(rows[cursor])
    }
    await priority()
  }
  updateMetadataTop(rows, fresh, report)
  if (deferred) deferred.metadataRemaining = report.remaining
  return { report, fresh, failures, deferred }
}

// --- 可在可信 Actions 中仅使用内置 token 验证跨公开仓库读取，不加载任何模型密钥 ---
export async function probeMetadata(api: GitHubApi) {
  // 能力探针不能被规范目录中的旧 URL / 迁移记录误伤。
  const selected: DirectoryItem[] = ['nodejs/node', 'vitejs/vite', 'microsoft/typescript'].map((key) => ({
    id: key, type: 'github', title: key, summary: '', url: `https://github.com/${key}`, sourceMeta: {},
  }))
  const result = await readMetadataBatch(api, selected)
  const ok = result.repositories.filter(Boolean).length
  if (ok !== selected.length) throw new Error('github-metadata-probe-incomplete')
  return { repositories: ok, cost: result.cost }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv[2] !== '--probe') throw new Error('Use --probe for a read-only metadata capability check')
  probeMetadata(createGitHubClient(process.env.GITHUB_TOKEN, { deadline: Date.now() + 120000 }))
    .then((result) => process.stdout.write(`GitHub metadata capability: ${JSON.stringify(result)}\n`))
    .catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : 'github-metadata-probe-failed'}\n`); process.exitCode = 1 })
}
