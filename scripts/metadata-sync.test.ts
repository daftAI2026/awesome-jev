/**
 * [INPUT]: 依赖独立元数据入口、目录夹具与 Node 临时文件系统
 * [OUTPUT]: 验证无模型刷新、编辑保护、迁移和诊断拒收
 * [POS]: scripts 的元数据发布边界离线测试，不连接真实 API
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test, { type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { runMetadata, writeMetadataSnapshot, applyMetadataSnapshot, migrateMetadataState, validateMetadataReport } from './metadata-sync.ts'
import { renderReadme } from './catalog.ts'
import type { DirectoryItem, GitHubApi } from './model-types.ts'
const sha = 'a'.repeat(40)
const row: DirectoryItem = { id: 'fixed', type: 'github', title: '人工标题', summary: '人工摘要', category: 'sdk', tags: ['curated'], url: 'https://github.com/test/sdk', sourceMeta: { repo: 'test/sdk', stars: 5, author: 'editor', githubIdentity: { databaseId: 1, nodeId: 'opaque' } } }
const api: GitHubApi = async () => ({ data: { r0: { databaseId: 1, id: 'opaque', nameWithOwner: 'new/sdk', url: 'https://github.com/new/sdk', stargazerCount: 9, forkCount: 2, primaryLanguage: null }, rateLimit: { cost: 1 } } })
const opts = () => ({ catalog: { rows: [structuredClone(row)], files: new Map([['github.json', [structuredClone(row)]]]) }, state: { version: 1 as const, metadataCursor: 0 }, api, baselineSha: sha })
function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'jev-meta-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  for (const dir of ['data', 'radar']) mkdirSync(join(root, dir))
  writeFileSync(join(root, 'data/github.json'), JSON.stringify([row]))
  writeFileSync(join(root, 'README.md'), renderReadme('<!-- PROJECTS:START -->\n<!-- PROJECTS:END -->\n<!-- PROJECT_COUNT:START -->\n<!-- PROJECT_COUNT:END -->', [row]))
  writeFileSync(join(root, 'radar/metadata-state.json'), JSON.stringify({ version: 1, metadataCursor: 0 }))
  writeFileSync(join(root, 'radar/metadata-latest.json'), JSON.stringify({ status: 'not-run' }))
  return root
}
test('metadata refresh needs no Jev key and only changes permitted machine fields', async () => {
  const input = opts(), before = structuredClone(input.catalog)
  const result = await runMetadata(input)
  assert.deepEqual(input.catalog, before)
  assert.equal(result.report.baselineSha, sha)
  assert.equal(result.report.totalProjects, 1)
  assert.equal(result.report.metadata.fresh, 1)
  assert.deepEqual(result.rows[0], { ...row, sourceMeta: { ...row.sourceMeta, stars: 9, forks: 2, language: null } })
})
test('legacy metadata cursor migrates without owning or changing candidate state', () => {
  const legacy = { version: 1, metadataCursor: 283, metadataNext: 'test/sdk', candidates: { 'test/p': { status: 'review' } } }
  const before = structuredClone(legacy)
  assert.deepEqual(migrateMetadataState(legacy), { version: 1, metadataCursor: 283, metadataNext: 'test/sdk' })
  assert.deepEqual(legacy, before)
})
test('unknown response produces diagnostics and cannot be applied as a snapshot', async (t) => {
  const root = fixture(t), output = join(root, 'out')
  const result = await runMetadata({ ...opts(), api: async () => ({ data: { r0: {}, rateLimit: { cost: 1 } } }) })
  assert.equal(result.report.status, 'diagnostic')
  assert.throws(() => writeMetadataSnapshot(root, output, result), /metadata-invalid-report/)
  assert.throws(() => validateMetadataReport({ ...result.report, status: 'partial' }), /metadata-invalid-report/)
})
test('safe unavailable and partial reports apply while editorial edits and malformed counters are rejected', async (t) => {
  const root = fixture(t), output = join(root, 'out')
  const result = await runMetadata(opts())
  writeMetadataSnapshot(root, output, result)
  const before = readFileSync(join(root, 'data/github.json'), 'utf8')
  const bad = JSON.parse(readFileSync(join(output, 'data/github.json'), 'utf8')); bad[0].summary = 'untrusted edit'
  writeFileSync(join(output, 'data/github.json'), JSON.stringify(bad))
  assert.throws(() => applyMetadataSnapshot(root, output), /Editorial|README/)
  assert.equal(readFileSync(join(root, 'data/github.json'), 'utf8'), before)
  writeMetadataSnapshot(root, output, result)
  applyMetadataSnapshot(root, output)
  assert.equal(JSON.parse(readFileSync(join(root, 'data/github.json'), 'utf8'))[0].sourceMeta.stars, 9)
  assert.throws(() => validateMetadataReport({ ...result.report, metadata: { ...result.report.metadata, fresh: 999 } }), /metadata-invalid-report/)
  const absent = await runMetadata({ ...opts(), api: async () => ({ data: { r0: null, rateLimit: { cost: 1 } } }) })
  assert.equal(absent.report.status, 'partial')
  assert.equal(absent.report.metadata.unavailable, 1)
  validateMetadataReport(absent.report)
})

test('metadata snapshots cannot add even a high-confidence project or disguise invalid reads', async t => {
  const root = fixture(t), output = join(root, 'out'), result = await runMetadata(opts())
  writeMetadataSnapshot(root, output, result)
  const rows: DirectoryItem[] = [result.rows[0], { ...row, id: 'new', url: 'https://github.com/test/new', sourceMeta: { repo: 'test/new', jevAbout: 1, jevKeep: 'keep', jevKeepConfidence: 1 } }]
  writeFileSync(join(output, 'data/github.json'), JSON.stringify(rows))
  writeFileSync(join(output, 'README.md'), renderReadme(readFileSync(join(root, 'README.md'), 'utf8'), rows))
  assert.throws(() => applyMetadataSnapshot(root, output), /metadata-membership/)
  const bad = await runMetadata({ ...opts(), api: async () => ({ data: { r0: {}, rateLimit: { cost: 1 } } }) })
  const forged = { ...bad.report, status: 'partial' as const }; delete forged.deferred
  assert.throws(() => validateMetadataReport(forged), /metadata-invalid-report/)
})

test('migration CLI preserves 2000 candidates and is idempotent without either API credential', async t => {
  const { spawnSync } = await import('node:child_process')
  const root = fixture(t)
  const candidates = Object.fromEntries(Array.from({ length: 2000 }, (_, i) => [`test/q-${i}`, { status: 'review', discoveredAt: '2026-10-01T00:00:00Z', attempts: 2, lastReview: { repo: `test/q-${i}`, status: 'review' } }]))
  writeFileSync(join(root, 'radar/state.json'), JSON.stringify({ version: 1, metadataCursor: 283, metadataNext: 'test/sdk', pages: { query: 3 }, candidates }))
  const run = () => spawnSync(process.execPath, ['--experimental-strip-types', fileURLToPath(new URL('./metadata-sync.ts', import.meta.url)), '--migrate-state'], { cwd: root, encoding: 'utf8', env: { ...process.env, GITHUB_TOKEN: '', TYPESAFE_API_KEY: '' } })
  const first = run(); assert.equal(first.status, 0, first.stderr)
  const next = JSON.parse(readFileSync(join(root, 'radar/state.json'), 'utf8'))
  assert.equal(next.version, 2); assert.deepEqual(next.candidates, candidates); assert.deepEqual(next.pages, { query: 3 })
  assert.equal(Object.hasOwn(next, 'metadataCursor'), false)
  assert.deepEqual(JSON.parse(readFileSync(join(root, 'radar/metadata-state.json'), 'utf8')), { version: 1, metadataCursor: 283, metadataNext: 'test/sdk' })
  assert.deepEqual(JSON.parse(readFileSync(join(root, 'radar/metadata-latest.json'), 'utf8')), { status: 'not-run' })
  writeFileSync(join(root, 'radar/metadata-state.json'), '{"version":1,"metadataCursor":777}')
  assert.equal(run().status, 0)
  assert.equal(JSON.parse(readFileSync(join(root, 'radar/metadata-state.json'), 'utf8')).metadataCursor, 777)
})
