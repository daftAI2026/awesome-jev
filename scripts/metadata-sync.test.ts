/**
 * [INPUT]: 依赖独立元数据入口、目录夹具与 Node 临时文件系统
 * [OUTPUT]: 验证无模型刷新、生命周期阈值、固定证据迁移和诊断拒收
 * [POS]: scripts 的元数据发布边界离线测试，不连接真实 API
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test, { type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { runMetadata, writeMetadataSnapshot, applyMetadataSnapshot, migrateMetadataState, validateMetadataReport, type MetadataState } from './metadata-sync.ts'
import { renderReadme } from './catalog.ts'
import type { DirectoryItem, GitHubApi } from './model-types.ts'
const sha = 'a'.repeat(40)
const row: DirectoryItem = { id: 'fixed', type: 'github', title: '人工标题', summary: '人工摘要', category: 'sdk', tags: ['curated'], url: 'https://github.com/test/sdk', sourceMeta: { repo: 'test/sdk', stars: 5, author: 'editor', githubIdentity: { databaseId: 1, nodeId: 'opaque' } } }
const api: GitHubApi = async () => ({ data: { r0: { databaseId: 1, id: 'opaque', nameWithOwner: 'new/sdk', url: 'https://github.com/new/sdk', stargazerCount: 9, forkCount: 2, primaryLanguage: null }, rateLimit: { cost: 1 } } })
const opts = () => ({ catalog: { rows: [structuredClone(row)], files: new Map([['github.json', [structuredClone(row)]]]) }, state: { version: 1, metadataCursor: 0 } as MetadataState, api, baselineSha: sha })
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
  assert.deepEqual(result.rows[0], { ...row, url: 'https://github.com/new/sdk', sourceMeta: { ...row.sourceMeta, repo: 'new/sdk', previousUrls: [row.url], stars: 9, forks: 2, language: null } })
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

// --- 生命周期先证明失效阈值、身份边界与固定证据迁移，全部使用离线 API ---
const lifecycleNow = (hours: number) => new Date(Date.parse('2026-10-16T00:00:00Z') + hours * 3600000)
const missingApi: GitHubApi = async (path, request) => {
  if (path !== '/graphql') throw new Error('github-http-404')
  if (request!.query.includes('owner:"nodejs"')) {
    const data: Record<string, unknown> = { rateLimit: { cost: 1 } }
    for (const [i, key] of ['nodejs/node', 'vitejs/vite', 'microsoft/typescript'].entries()) data[`r${i}`] = { id: `control-${i}`, databaseId: 100 + i, nameWithOwner: key, url: `https://github.com/${key}`, stargazerCount: 1, forkCount: 0, primaryLanguage: null }
    return { data }
  }
  const data: Record<string, unknown> = { rateLimit: { cost: 1 } }
  for (const alias of request!.query.matchAll(/(r\d+):/g)) data[alias[1]] = null
  return { data }
}
const stableApi: GitHubApi = async () => ({ data: { r0: { databaseId: 1, id: 'opaque', nameWithOwner: 'test/sdk', url: row.url, stargazerCount: 9, forkCount: 2, primaryLanguage: null }, rateLimit: { cost: 1 } } })
test('lifecycle requires three distinct healthy cycles spanning 72 hours, not a single 404', async () => {
  let input = { ...opts(), api: missingApi }
  for (const [i, hours] of [0, 6, 72].entries()) {
    const result = await runMetadata({ ...input, now: lifecycleNow(hours), runId: String(i + 1) })
    assert.equal(result.state.observations?.fixed.count, Math.min(3, i + 1))
    assert.equal(result.rows[0].sourceMeta.lifecycle?.state, i === 2 ? 'unavailable' : undefined)
    input = { ...input, state: result.state, catalog: { rows: result.rows, files: result.files } }
  }
})
test('lifecycle reruns and multiple manual runs in one six-hour cycle do not add observations', async () => {
  let input = { ...opts(), api: missingApi }
  for (const [hours, runId] of [[0, '1'], [1, '2'], [6, '3'], [72, '1']] as const) {
    const result = await runMetadata({ ...input, now: lifecycleNow(hours), runId })
    input = { ...input, state: result.state, catalog: { rows: result.rows, files: result.files } }
  }
  assert.equal(input.state.observations?.fixed.count, 2)
  assert.equal(input.catalog.rows[0].sourceMeta.lifecycle, undefined)
})
test('same numeric identity migrates verified pinned citations without replacing human editorial content', async () => {
  const input = opts(), quote = 'TypeSafe Jev integration', oldUrl = `${row.url}/blob/${sha}/README.md`
  input.catalog.files.get('github.json')![0].sourceMeta.inclusion = { text: { en: 'Basis', zh: '依据', ja: '根拠' }, evidence: [{ url: oldUrl, quote }], checkedAt: '2026-10-01T00:00:00Z', reviewer: 'maintainer' }
  input.catalog.files.get('github.json')![0].sourceMeta.jevEvidence = { repo: 'test/sdk', evidenceUrl: oldUrl }
  const calls: string[] = []
  const result = await runMetadata({ ...input, api: async (path, query) => {
    calls.push(path)
    if (path === '/graphql') return api(path, query)
    assert.equal(path, `/repos/new/sdk/contents/README.md?ref=${sha}`)
    return { type: 'file', path: 'README.md', encoding: 'base64', content: Buffer.from(quote).toString('base64'), size: quote.length, sha: createHash('sha1').update(`blob ${quote.length}\0`).update(quote).digest('hex') }
  } })
  const moved = result.rows[0]
  assert.equal(moved.url, 'https://github.com/new/sdk')
  assert.equal(moved.id, row.id); assert.equal(moved.title, row.title); assert.equal(moved.summary, row.summary)
  assert.equal(moved.sourceMeta.repo, 'new/sdk')
  assert.deepEqual(moved.sourceMeta.previousUrls, [row.url])
  assert.equal(moved.sourceMeta.inclusion?.evidence[0].url, `https://github.com/new/sdk/blob/${sha}/README.md`)
  assert.equal((moved.sourceMeta.jevEvidence as { evidenceUrl: string }).evidenceUrl, `https://github.com/new/sdk/blob/${sha}/README.md`)
  assert.equal(calls.length, 2, 'the shared pinned file is read once, not once per citation')
})
test('missing migration evidence quarantines the old row with a trusted target instead of rewriting citations', async () => {
  const input = opts()
  input.catalog.files.get('github.json')![0].sourceMeta.jevEvidence = { evidenceUrl: `${row.url}/tree/${sha}` }
  const result = await runMetadata({ ...input, now: lifecycleNow(0), api: async (path, query) => {
    if (path === '/graphql') return api(path, query)
    throw new Error('github-http-404')
  } })
  assert.equal(result.rows[0].url, row.url)
  assert.deepEqual(result.rows[0].sourceMeta.lifecycle, { state: 'review', since: lifecycleNow(0).toISOString(), reason: 'migration-evidence', target: { url: 'https://github.com/new/sdk', databaseId: 1, nodeId: 'opaque' } })
  assert.equal(result.rows[0].sourceMeta.stars, 9)
})
test('a recreated repository path is quarantined immediately and never replaces the stored numeric identity', async () => {
  const result = await runMetadata({ ...opts(), now: lifecycleNow(0), runId: '1', api: async (path, query) => {
    if (path === '/repos/test/sdk') return { id: 2, node_id: 'new-node', html_url: row.url, full_name: 'test/sdk', name: 'sdk', owner: { login: 'test' }, private: false, stargazers_count: 3, forks_count: 0, language: null }
    return missingApi(path, query)
  } })
  assert.equal(result.rows[0].sourceMeta.githubIdentity?.databaseId, 1)
  assert.equal(result.rows[0].sourceMeta.lifecycle?.state, 'review')
  assert.equal(result.rows[0].sourceMeta.lifecycle?.reason, 'identity-changed')
  assert.equal(result.rows[0].sourceMeta.lifecycle?.target?.databaseId, 2)
})
test('successful identity reads restore only metadata-owned unavailable, never review or replaced records', async () => {
  for (const state of ['unavailable', 'review', 'replaced'] as const) {
    const input = opts(); input.catalog.files.get('github.json')![0].sourceMeta.lifecycle = { state, since: lifecycleNow(0).toISOString() }
    const result = await runMetadata({ ...input, api: stableApi, now: lifecycleNow(80), runId: '4' })
    assert.equal(result.rows[0].sourceMeta.lifecycle?.state, state === 'unavailable' ? undefined : state)
  }
})
test('a mass absence with a successful control probe does not accumulate removal observations', async () => {
  const data = Array.from({ length: 12 }, (_, i) => ({ ...structuredClone(row), id: `r${i}`, url: `https://github.com/test/r${i}`, sourceMeta: { ...row.sourceMeta, repo: `test/r${i}`, githubIdentity: { databaseId: i + 1, nodeId: `n${i}` } } }))
  const result = await runMetadata({ ...opts(), catalog: { rows: data, files: new Map([['github.json', data]]) }, api: missingApi, now: lifecycleNow(0), runId: '1' })
  assert.equal(Object.keys(result.state.observations ?? {}).length, 0)
  assert.equal(result.report.lifecycle?.observationSkipped, 'mass-unavailable')
})

test('REST identity recovery refreshes the same object and corrects unavailable accounting without a new model call', async () => {
  const calls: string[] = []
  const result = await runMetadata({ ...opts(), now: lifecycleNow(0), runId: '1', api: async (path, query) => {
    calls.push(path)
    if (path === '/repositories/1') return { id: 1, node_id: 'new-node', html_url: row.url, full_name: 'test/sdk', name: 'sdk', owner: { login: 'test' }, private: false, stargazers_count: 15, forks_count: 1, language: null }
    return missingApi(path, query)
  } })
  assert.equal(result.rows[0].sourceMeta.githubIdentity?.nodeId, 'new-node')
  assert.equal(result.rows[0].sourceMeta.stars, 15)
  assert.equal(result.report.metadata.unavailable, 0)
  assert.equal(result.report.metadata.fresh, 1)
  assert.equal(result.report.metadata.top100.complete, true)
  assert.equal(result.report.status, 'complete')
  assert.equal(result.report.receipts.length, 0)
  assert.equal(calls.filter(path => path.startsWith('/repositories/')).length, 1)
  validateMetadataReport(result.report)
})
test('failed control probe preserves safe statistics but creates no disappearance history', async () => {
  const result = await runMetadata({ ...opts(), now: lifecycleNow(0), runId: '1', api: async (path, query) => {
    if (query?.query.includes('owner:"nodejs"')) throw new Error('github-http-503')
    return missingApi(path, query)
  } })
  assert.equal(result.report.lifecycle?.observationSkipped, 'control-probe-failed')
  assert.equal(result.state.observations, undefined)
  assert.equal(result.rows[0].sourceMeta.lifecycle, undefined)
})

for (const recoverCurrent of [false, true]) test(`shared URL isolates old tombstone failures from the current identity (${recoverCurrent ? 'REST recovery' : 'GraphQL success'})`, async () => {
  const old = structuredClone(row), current = structuredClone(row)
  old.sourceMeta.lifecycle = { state: 'replaced', since: lifecycleNow(0).toISOString() }
  current.id = 'current'; current.sourceMeta.githubIdentity = { databaseId: 2, nodeId: 'current-node' }
  const data = [old, current], calls: string[] = []
  const result = await runMetadata({ ...opts(), catalog: { rows: data, files: new Map([['github.json', data]]) }, now: lifecycleNow(72), runId: '4', api: async (path, query) => {
    calls.push(path)
    if (query?.query.includes('owner:"nodejs"')) return missingApi(path, query)
    if (path === '/graphql') {
      const result: Record<string, unknown> = { rateLimit: { cost: 1 } }
      for (const match of query!.query.matchAll(/(r\d+):\s*node\(id:"([^"]+)"\)/g)) {
        result[match[1]] = !recoverCurrent && match[2] === 'current-node' ? { databaseId: 2, id: 'current-node',
          nameWithOwner: 'test/sdk', url: current.url, stargazerCount: 15, forkCount: 1, primaryLanguage: null } : null
      }
      return { data: result }
    }
    if (path === '/repositories/2') return { id: 2, node_id: 'current-node', html_url: current.url, full_name: 'test/sdk',
      name: 'sdk', owner: { login: 'test' }, private: false, stargazers_count: 15, forks_count: 1, language: null }
    throw new Error(`Unexpected request: ${path}`)
  } })
  assert.equal(result.report.metadata.attempted, 2)
  assert.equal(result.report.metadata.fresh, 1)
  assert.equal(result.report.metadata.unavailable, 1)
  assert.equal(result.report.metadata.top100.ok, 1)
  assert.deepEqual(result.report.receipts, [{ id: old.id, repo: 'test/sdk', reason: 'github-unavailable-repository' }])
  assert.equal(result.state.observations, undefined)
  assert.equal(result.rows[0].sourceMeta.lifecycle?.state, 'replaced')
  assert.equal(result.rows[1].sourceMeta.lifecycle, undefined)
  assert.equal(result.rows[1].sourceMeta.stars, 15)
  assert.equal(calls.filter(path => path.startsWith('/repositories/')).length, recoverCurrent ? 1 : 0)
  validateMetadataReport(result.report)
  // 旧报告没有 local id，读取和验证形状仍然兼容。
  validateMetadataReport({ ...result.report, receipts: result.report.receipts.map(({ repo, reason }) => ({ repo, reason })) })
})

for (const currentMissing of [false, true]) test(`retired tombstones do not trigger control probes or mass-outage suppression (${currentMissing ? 'one current missing' : 'current healthy'})`, async () => {
  const retired: DirectoryItem[] = Array.from({ length: 12 }, (_, i) => ({ ...structuredClone(row), id: `retired-${i}`,
    url: `https://github.com/test/retired-${i}`, sourceMeta: { ...structuredClone(row.sourceMeta),
      githubIdentity: { databaseId: i + 10, nodeId: `retired-${i}` }, lifecycle: { state: 'replaced', since: lifecycleNow(0).toISOString() } } }))
  const data = [...retired, structuredClone(row)], calls: string[] = []
  const result = await runMetadata({ ...opts(), catalog: { rows: data, files: new Map([['github.json', data]]) }, now: lifecycleNow(0), runId: '1', api: async (path, query) => {
    calls.push(query?.query.includes('owner:"nodejs"') ? 'probe' : path)
    if (query?.query.includes('owner:"nodejs"')) return missingApi(path, query)
    if (path === '/graphql') {
      const result: Record<string, unknown> = { rateLimit: { cost: 1 } }
      for (const match of query!.query.matchAll(/(r\d+):\s*node\(id:"([^"]+)"\)/g)) {
        result[match[1]] = !currentMissing && match[2] === 'opaque' ? { databaseId: 1, id: 'opaque',
          nameWithOwner: 'test/sdk', url: row.url, stargazerCount: 15, forkCount: 1, primaryLanguage: null } : null
      }
      return { data: result }
    }
    assert.ok(path === '/repositories/1' || path === '/repos/test/sdk', 'replaced objects must never cause REST probes')
    throw new Error('github-http-404')
  } })
  assert.equal(calls.filter(path => path === 'probe').length, currentMissing ? 1 : 0)
  assert.equal(result.report.lifecycle?.observationSkipped, undefined)
  assert.equal(result.state.observations?.fixed?.count, currentMissing ? 1 : undefined)
  assert.equal(result.report.metadata.attempted, 13, 'raw history remains in accounting')
  assert.equal(result.report.metadata.unavailable, currentMissing ? 13 : 12)
  validateMetadataReport(result.report)
})
