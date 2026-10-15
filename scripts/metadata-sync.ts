/**
 * [INPUT]: 依赖既有目录保护、身份批读与只读 GitHub 客户端
 * [OUTPUT]: 提供独立统计、按本站 ID 隔离的失败观察、地址迁移与受控快照应用
 * [POS]: scripts 的无模型同步入口；身份续点兼容旧 URL，恢复只清除对应记录的失败
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { applySnapshot, readCatalog, renderReadme, repoKey } from './catalog.ts'
import { refreshMetadata, probeMetadata, updateMetadataTop } from './github-metadata.ts'
import { reconcileCatalogLifecycle, validateLifecycleObservations, massUnavailable, type LifecycleObservations, type LifecycleReport } from './catalog-lifecycle.ts'
import { migrateCoreState } from './candidate-queue.ts'
import { validateState } from './radar.ts'
import { createGitHubClient } from './github-client.ts'
import type { MetadataReport } from './github-metadata.ts'
import type { Catalog, GitHubApi } from './model-types.ts'
export interface MetadataState { version: 1; metadataCursor: number; metadataNext?: string; metadataNextId?: string; observations?: LifecycleObservations }
export interface MetadataRunReport { status: 'complete' | 'partial' | 'diagnostic'; baselineSha: string; at: string; totalProjects: number; metadata: MetadataReport; receipts: { id?: string; repo: string; reason: string }[]; lifecycle?: LifecycleReport; deferred?: { phase: string; reason: string } }
export const METADATA_FILES = ['data/github.json', 'README.md', 'radar/metadata-state.json', 'radar/metadata-latest.json']
export function migrateMetadataState(legacy: { metadataCursor?: number; metadataNext?: string }): MetadataState {
  const state: MetadataState = { version: 1, metadataCursor: legacy.metadataCursor ?? 0, ...(legacy.metadataNext ? { metadataNext: legacy.metadataNext } : {}) }
  validateMetadataState(state)
  return state
}
export function validateMetadataState(state: MetadataState): void {
  if (state?.version !== 1 || !Number.isSafeInteger(state.metadataCursor) || state.metadataCursor < 0 ||
    state.metadataNext !== undefined && !/^[\w.-]+\/[\w.-]+$/.test(state.metadataNext) ||
    state.metadataNextId !== undefined && (typeof state.metadataNextId !== 'string' || !state.metadataNextId.trim())) throw new Error('metadata-invalid-state')
  if (state.observations !== undefined) validateLifecycleObservations(state.observations)
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
export async function runMetadata({ catalog, state, api, baselineSha, now = new Date(), runId }: { catalog: Catalog; state: MetadataState; api: GitHubApi; baselineSha: string; now?: Date; runId?: string }) {
  validateMetadataState(state)
  if (!/^[a-f0-9]{40}$/.test(baselineSha)) throw new Error('metadata-invalid-baseline')
  const files = new Map([...catalog.files].map(([file, rows]) => [file, structuredClone(rows)]))
  const rows = [...files.values()].flat(), next = structuredClone(state)
  const result = await refreshMetadata(rows, next, api)
  const unsafe = result.deferred?.reason === 'github-invalid-response'
  const report: MetadataRunReport = { status: unsafe ? 'diagnostic' : result.deferred || result.report.remaining ? 'partial' : 'complete',
    baselineSha, at: now.toISOString(), totalProjects: rows.length, metadata: result.report, receipts: result.failures,
    ...(result.deferred ? { deferred: result.deferred } : {}) }
  if (!unsafe) {
    const unavailableIds = result.failures.filter(failure => failure.reason === 'github-unavailable-repository').map(failure => failure.id)
    // 旧代墓碑保留统计；它们不再接受恢复，不能污染当前对象的异常比例。
    const observable = rows.filter(row => row.sourceMeta.lifecycle?.state !== 'replaced')
    const missingObservable = observable.filter(row => unavailableIds.includes(row.id))
    let observationSkipped: LifecycleReport['observationSkipped']
    if (result.deferred || result.report.attempted !== rows.length) observationSkipped = 'incomplete-round'
    else if (!runId || !/^[1-9]\d*$/.test(runId)) observationSkipped = 'missing-run-id'
    else if (missingObservable.length) {
      try {
        const probe = await probeMetadata(api)
        result.report.batches++
        result.report.cost = result.report.cost === null || probe.cost === null ? null : result.report.cost + probe.cost
        if (massUnavailable(observable.length, missingObservable.length)) observationSkipped = 'mass-unavailable'
      } catch { observationSkipped = 'control-probe-failed'; result.report.cost = null }
    }
    const unavailableKeys = new Map(rows.filter(row => unavailableIds.includes(row.id)).map(row => [row.id, repoKey(row.url)!]))
    const lifecycle = await reconcileCatalogLifecycle({ rows, observed: result.observed, unavailableIds, observations: next.observations ?? {}, api, now, runId, observationSkipped })
    if (Object.keys(lifecycle.observations).length) next.observations = lifecycle.observations
    else delete next.observations
    const recovered = unavailableIds.filter(id => result.observed.has(id))
    if (recovered.length) {
      report.receipts = report.receipts.filter(failure => !failure.id || !recovered.includes(failure.id))
      result.report.ok += recovered.length; result.report.fresh += recovered.length
      result.report.failed -= recovered.length; result.report.unavailable -= recovered.length
      for (const id of recovered) {
        const old = unavailableKeys.get(id)!, current = repoKey(result.observed.get(id)!.html_url)!
        if (old !== current) result.report.resolved.push({ from: old, to: current, databaseId: result.observed.get(id)!.id! })
      }
    }
    updateMetadataTop(rows, new Set(result.observed.keys()), result.report)
    report.lifecycle = lifecycle.report
    report.status = result.deferred || lifecycle.report.deferred || result.report.remaining ? 'partial' : 'complete'
  }
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
  applySnapshot(root, snapshot, METADATA_FILES, 'metadata')
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
    api: createGitHubClient(process.env.GITHUB_TOKEN, { deadline }), baselineSha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), runId: process.env.GITHUB_RUN_ID })
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
