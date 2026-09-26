import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { isInclusionBasis, pinnedSource, type InclusionBasis } from '../src/lib/inclusion.ts'
import { readCatalog, validateRows } from './catalog.ts'
import { isRecord, type DirectoryItem, type FetchImpl } from './model-types.ts'

export interface ReviewedInclusion {
  id: string
  inclusion?: InclusionBasis
  unresolved?: string
}

// --- 导入独立审查结果，不修改作者简介、分类或 Jev 的评分 ---
export function parseReviewedInclusions(value: unknown, rows: DirectoryItem[]): ReviewedInclusion[] {
  if (!Array.isArray(value)) throw new Error('inclusion-invalid-batch')
  const byId = new Map(rows.map((row) => [row.id, row]))
  const seen = new Set<string>()
  return value.map((entry) => {
    if (!isRecord(entry) || typeof entry.id !== 'string' || seen.has(entry.id) || !byId.has(entry.id)) {
      throw new Error('inclusion-invalid-id')
    }
    seen.add(entry.id)
    if (entry.inclusion !== undefined) {
      if (entry.unresolved !== undefined || !isInclusionBasis(entry.inclusion, byId.get(entry.id)!.url)) {
        throw new Error(`inclusion-invalid-basis:${entry.id}`)
      }
      return { id: entry.id, inclusion: entry.inclusion }
    }
    if (typeof entry.unresolved !== 'string' || !entry.unresolved.trim() || entry.unresolved.length > 600) {
      throw new Error(`inclusion-missing-result:${entry.id}`)
    }
    return { id: entry.id, unresolved: entry.unresolved }
  })
}

export type SourceReader = (rawUrl: string) => Promise<string>

export function pendingInclusions(rows: DirectoryItem[], count: number): DirectoryItem[] {
  if (!Number.isSafeInteger(count) || count < 1) throw new Error('inclusion-invalid-batch-size')
  return rows.filter((row) => !row.sourceMeta.inclusion)
    .sort((a, b) => (b.sourceMeta.stars ?? 0) - (a.sourceMeta.stars ?? 0) || a.id.localeCompare(b.id))
    .slice(0, count)
}

export function sourceReader(fetchImpl: FetchImpl = fetch): SourceReader {
  const cache = new Map<string, Promise<string>>()
  return (url) => {
    const cached = cache.get(url)
    if (cached) return cached
    const result = (async () => {
      const response = await fetchImpl(url, { redirect: 'error', signal: AbortSignal.timeout(20000) })
      if (!response.ok || !response.body) throw new Error(`inclusion-source-http-${response.status}`)
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8', { fatal: true })
      let bytes = 0
      let text = ''
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          bytes += value.byteLength
          if (bytes > 512 * 1024) throw new Error('inclusion-source-too-large')
          text += decoder.decode(value, { stream: true })
        }
        return text + decoder.decode()
      } finally {
        await reader.cancel()
        reader.releaseLock()
      }
    })()
    cache.set(url, result)
    return result
  }
}

export async function mergeReviewedInclusions(
  rows: DirectoryItem[], value: unknown, readSource: SourceReader,
): Promise<{ rows: DirectoryItem[]; reviewed: number; unresolved: number }> {
  const entries = parseReviewedInclusions(value, rows)
  const byId = new Map(rows.map((row) => [row.id, row]))
  const completed = entries.filter((entry) => entry.inclusion)
  // --- 整批先校验证据，失败不留下半批写入；并发保持有界 ---
  for (let offset = 0; offset < completed.length; offset += 4) {
    await Promise.all(completed.slice(offset, offset + 4).map(async (entry) => {
      for (const source of entry.inclusion!.evidence) {
        const rawUrl = pinnedSource(source.url, byId.get(entry.id)!.url)!.rawUrl
        const content = await readSource(rawUrl)
        if (!content.replace(/\r\n?/g, '\n').includes(source.quote.replace(/\r\n?/g, '\n'))) {
          throw new Error(`inclusion-quote-not-found:${entry.id}`)
        }
      }
    }))
  }
  const basisById = new Map(completed.map((entry) => [entry.id, entry.inclusion!]))
  const merged = rows.map((row) => basisById.has(row.id)
    ? { ...row, sourceMeta: { ...row.sourceMeta, inclusion: basisById.get(row.id)! } }
    : row)
  validateRows(merged)
  return { rows: merged, reviewed: completed.length, unresolved: entries.length - completed.length }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const apply = args[0] === '--apply'
  if (!['--preview', '--apply', '--check', '--queue'].includes(args[0] ?? '')) throw new Error('inclusion-use-preview-apply-check-or-queue')
  const root = process.cwd()
  const catalog = readCatalog(root)
  if (args[0] === '--queue') {
    if (args.length !== 2) throw new Error('inclusion-invalid-arguments')
    process.stdout.write(JSON.stringify(pendingInclusions(catalog.rows, Number(args[1])), null, 2) + '\n')
    return
  }
  if (args[0] === '--check') {
    if (args.length !== 1) throw new Error('inclusion-invalid-arguments')
    const completed = catalog.rows.filter((row) => row.sourceMeta.inclusion).length
    process.stdout.write(`Inclusion rationale: ${completed}/${catalog.rows.length}; pending: ${catalog.rows.length - completed}\n`)
    return
  }
  if (args.length < 2) throw new Error('inclusion-missing-review-files')
  const records: unknown[] = []
  for (const path of args.slice(1)) {
    const value: unknown = JSON.parse(readFileSync(resolve(path), 'utf8'))
    if (!Array.isArray(value)) throw new Error('inclusion-invalid-batch')
    records.push(...value)
  }
  const before = JSON.stringify(catalog.rows)
  const result = await mergeReviewedInclusions(catalog.rows, records, sourceReader())
  // 审核期间若目录被其他进程更新，拒绝覆盖；重新基于最新目录导入。
  if (JSON.stringify(readCatalog(root).rows) !== before) throw new Error('inclusion-catalog-changed')
  if (apply) writeFileSync(join(root, 'data/github.json'), JSON.stringify(result.rows, null, 2) + '\n')
  process.stdout.write(`${apply ? 'Applied' : 'Preview'}: ${result.reviewed} verified; ${result.unresolved} unresolved; original summaries unchanged\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'inclusion-failed'}\n`)
    process.exitCode = 1
  })
}
