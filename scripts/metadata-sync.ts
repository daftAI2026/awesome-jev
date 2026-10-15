/**
 * [INPUT]: 依赖既有目录保护、身份批读与只读 GitHub 客户端
 * [OUTPUT]: 提供独立统计运行、状态迁移、快照校验与应用入口
 * [POS]: scripts 的无模型同步入口，只拥有元数据检查点和允许字段
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { applySnapshot, readCatalog, renderReadme } from './catalog.ts'
import { refreshMetadata } from './github-metadata.ts'
import { migrateCoreState } from './candidate-queue.ts'
import { validateState } from './radar.ts'
import { createGitHubClient } from './github-client.ts'
import type { MetadataReport } from './github-metadata.ts'
import type { Catalog, GitHubApi } from './model-types.ts'
export interface MetadataState { version: 1; metadataCursor: number; metadataNext?: string }
export interface MetadataRunReport { status: 'complete' | 'partial' | 'diagnostic'; baselineSha: string; at: string; totalProjects: number; metadata: MetadataReport; receipts: { repo: string; reason: string }[]; deferred?: { phase: string; reason: string } }
export const METADATA_FILES = ['data/github.json', 'README.md', 'radar/metadata-state.json', 'radar/metadata-latest.json']
export function migrateMetadataState(legacy: { metadataCursor?: number; metadataNext?: string }): MetadataState {
  const state: MetadataState = { version: 1, metadataCursor: legacy.metadataCursor ?? 0, ...(legacy.metadataNext ? { metadataNext: legacy.metadataNext } : {}) }
  validateMetadataState(state)
  return state
}
export function validateMetadataState(state: MetadataState): void {
  if (state?.version !== 1 || !Number.isSafeInteger(state.metadataCursor) || state.metadataCursor < 0 ||
    state.metadataNext !== undefined && !/^[\w.-]+\/[\w.-]+$/.test(state.metadataNext)) throw new Error('metadata-invalid-state')
}
export function validateMetadataReport(report: MetadataRunReport): void {
  const m = report?.metadata
  const count = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0
  if (!report || !['complete', 'partial'].includes(report.status) || !/^[a-f0-9]{40}$/.test(report.baselineSha) ||
    typeof report.at !== 'string' || !Number.isFinite(Date.parse(report.at)) || !count(report.totalProjects) || !Array.isArray(report.receipts) ||
    !m || !['ok', 'failed', 'attempted', 'fresh', 'unavailable', 'deferredRemaining', 'batches', 'other', 'remaining'].every(key => count(m[key as keyof MetadataReport])) ||
    m.ok !== m.fresh || m.fresh > m.attempted || m.attempted > report.totalProjects || m.unavailable > m.failed ||
    m.fresh + m.unavailable !== m.attempted || m.failed !== m.unavailable || m.remaining !== report.totalProjects - m.fresh ||
    m.deferredRemaining !== report.totalProjects - m.attempted || m.cost !== null && !count(m.cost) ||
    report.deferred?.reason === 'github-invalid-response' || !m.top100 || !count(m.top100.ok) || !count(m.top100.total) ||
    m.top100.total !== Math.min(100, report.totalProjects) || m.top100.ok > m.top100.total ||
    m.top100.complete !== (m.top100.ok === m.top100.total) || !Array.isArray(m.top100.unrefreshed) ||
    m.top100.unrefreshed.length !== m.top100.total - m.top100.ok ||
    report.status === 'complete' && (m.remaining !== 0 || report.deferred)) throw new Error('metadata-invalid-report')
}
export async function runMetadata({ catalog, state, api, baselineSha, now = new Date() }: { catalog: Catalog; state: MetadataState; api: GitHubApi; baselineSha: string; now?: Date }) {
  validateMetadataState(state)
  if (!/^[a-f0-9]{40}$/.test(baselineSha)) throw new Error('metadata-invalid-baseline')
  const files = new Map([...catalog.files].map(([file, rows]) => [file, structuredClone(rows)]))
  const rows = [...files.values()].flat(), next = structuredClone(state)
  const result = await refreshMetadata(rows, next, api)
  const unsafe = result.deferred?.reason === 'github-invalid-response'
  const report: MetadataRunReport = { status: unsafe ? 'diagnostic' : result.deferred || result.report.remaining ? 'partial' : 'complete',
    baselineSha, at: now.toISOString(), totalProjects: rows.length, metadata: result.report, receipts: result.failures,
    ...(result.deferred ? { deferred: result.deferred } : {}) }
  return { files, rows, state: next, report }
}
export function writeMetadataSnapshot(root: string, output: string, result: Awaited<ReturnType<typeof runMetadata>>): void {
  validateMetadataReport(result.report)
  mkdirSync(join(output, 'data'), { recursive: true }); mkdirSync(join(output, 'radar'), { recursive: true })
  for (const [file, rows] of result.files) {
    const before = readFileSync(join(root, 'data', file), 'utf8')
    writeFileSync(join(output, 'data', file), JSON.stringify(JSON.parse(before)) === JSON.stringify(rows) ? before : `${JSON.stringify(rows, null, 2)}\n`)
  }
  writeFileSync(join(output, 'README.md'), renderReadme(readFileSync(join(root, 'README.md'), 'utf8'), result.rows))
  writeFileSync(join(output, METADATA_FILES[2]), `${JSON.stringify(result.state, null, 2)}\n`)
  writeFileSync(join(output, METADATA_FILES[3]), `${JSON.stringify(result.report, null, 2)}\n`)
}
export function applyMetadataSnapshot(root: string, snapshot: string): void {
  validateMetadataState(JSON.parse(readFileSync(join(snapshot, METADATA_FILES[2]), 'utf8')))
  validateMetadataReport(JSON.parse(readFileSync(join(snapshot, METADATA_FILES[3]), 'utf8')))
  const report = JSON.parse(readFileSync(join(snapshot, METADATA_FILES[3]), 'utf8')) as MetadataRunReport
  if (readCatalog(snapshot).rows.length !== readCatalog(root).rows.length || report.totalProjects !== readCatalog(snapshot).rows.length) throw new Error('metadata-membership-change')
  applySnapshot(root, snapshot, METADATA_FILES)
}
export function migrateWorkflowState(root: string): void {
  const original = JSON.parse(readFileSync(join(root, 'radar/state.json'), 'utf8'))
  validateState(original)
  if (original.version === 2) return
  const reportFile = join(root, METADATA_FILES[3])
  if (existsSync(reportFile) && JSON.parse(readFileSync(reportFile, 'utf8')).status !== 'not-run') throw new Error('metadata-migration-already-started')
  const metadata = migrateMetadataState(original), core = migrateCoreState(original)
  validateState(core)
  writeFileSync(join(root, METADATA_FILES[2]), `${JSON.stringify(metadata, null, 2)}\n`)
  writeFileSync(reportFile, `${JSON.stringify({ status: 'not-run' }, null, 2)}\n`)
  writeFileSync(join(root, 'radar/state.json'), `${JSON.stringify(core, null, 2)}\n`)
}
async function main() {
  const root = process.cwd(), arg = process.argv[2]
  if (arg === '--migrate-state') { migrateWorkflowState(root); return }
  if (arg === '--apply') { applyMetadataSnapshot(root, resolve(process.argv[3] ?? '')); return }
  if (!arg || resolve(arg) === root) throw new Error('Provide a separate snapshot output directory')
  const deadline = Date.now() + 25 * 60 * 1000
  const result = await runMetadata({ catalog: readCatalog(root), state: JSON.parse(readFileSync(join(root, METADATA_FILES[2]), 'utf8')),
    api: createGitHubClient(process.env.GITHUB_TOKEN, { deadline }), baselineSha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() })
  if (result.report.status === 'diagnostic') {
    mkdirSync(join(resolve(arg), 'radar'), { recursive: true })
    writeFileSync(join(resolve(arg), METADATA_FILES[3]), `${JSON.stringify(result.report, null, 2)}\n`)
    throw new Error('metadata-invalid-response')
  }
  writeMetadataSnapshot(root, resolve(arg), result)
  process.stdout.write(`${JSON.stringify(result.report)}\n`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'metadata-failed'}\n`); process.exitCode = 1
})
