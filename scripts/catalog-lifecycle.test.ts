/**
 * [INPUT]: 依赖生命周期协调器、稳定身份夹具与离线 GitHub API
 * [OUTPUT]: 验证异常回滚不复活失效串、地址冲突与含 BOM 的固定证据完整性
 * [POS]: 生命周期的攻击面回归，不连接远端或调用模型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { reconcileCatalogLifecycle, type LifecycleObservations } from './catalog-lifecycle.ts'
import type { DirectoryItem, GitHubApi, GitHubRepository } from './model-types.ts'
const sha = 'a'.repeat(40), now = new Date('2026-10-16T00:00:00.000Z')
const row = (id = 'a'): DirectoryItem => ({ id, type: 'github', title: 'sdk', summary: '人工摘要', url: `https://github.com/test/${id}`, sourceMeta: { repo: `test/${id}`, author: 'test', githubIdentity: { databaseId: id === 'a' ? 1 : 2, nodeId: id } } })
const moved: GitHubRepository = { id: 1, node_id: 'a', html_url: 'https://github.com/new/sdk-next', full_name: 'new/sdk-next', name: 'sdk-next', owner: { login: 'new' }, private: false, stargazers_count: 9, forks_count: 0, language: null }
const options = (rows: DirectoryItem[], api: GitHubApi = async () => { throw new Error('github-http-404') }) => ({ rows, observed: new Map<string, GitHubRepository>(), unavailableIds: rows.map(r => r.id), observations: {} as LifecycleObservations, api, now, runId: '1' })
for (const reason of ['github-http-401', 'github-http-503', 'github-resource-deferred', 'github-invalid-response']) test(`later ${reason} leaves all failure observation counters unchanged`, async () => {
  const rows = [row('a'), row('b')]
  const result = await reconcileCatalogLifecycle(options(rows, async path => {
    if (path === '/repositories/2') throw new Error(reason)
    throw new Error('github-http-404')
  }))
  assert.equal(result.report.deferred, reason)
  assert.deepEqual(result.observations, {})
  assert.equal(rows.some(r => r.sourceMeta.lifecycle), false)
})
test('mass-absence protection still isolates a proven replacement identity without counting disappearance', async () => {
  const rows = [row()]
  const result = await reconcileCatalogLifecycle({ ...options(rows, async path => {
    if (path === '/repositories/1') throw new Error('github-http-404')
    return { ...moved, id: 9, html_url: rows[0].url, full_name: 'test/a', name: 'a', owner: { login: 'test' } }
  }), observationSkipped: 'mass-unavailable' })
  assert.equal(rows[0].sourceMeta.lifecycle?.reason, 'identity-changed')
  assert.equal(rows[0].sourceMeta.githubIdentity?.databaseId, 1)
  assert.deepEqual(result.observations, {})
})
for (const defect of ['blob-sha', 'receipt-sha256']) test(`migration rejects ${defect} mismatch instead of rebinding old evidence`, async () => {
  const rows = [row()], text = 'TypeSafe Jev integration'
  rows[0].sourceMeta.jevEvidence = { repo: 'test/a', evidenceUrl: `${rows[0].url}/blob/${sha}/README.md`, sha, evidenceSha256: defect === 'receipt-sha256' ? '0'.repeat(64) : createHash('sha256').update(text).digest('hex') }
  const result = await reconcileCatalogLifecycle({ ...options(rows, async () => ({ type: 'file', path: 'README.md', encoding: 'base64', size: text.length, content: Buffer.from(text).toString('base64'), sha: defect === 'blob-sha' ? '0'.repeat(40) : createHash('sha1').update(`blob ${text.length}\0`).update(text).digest('hex') })), observed: new Map([['a', moved]]), unavailableIds: [] })
  assert.equal(rows[0].url, 'https://github.com/test/a')
  assert.equal(rows[0].sourceMeta.lifecycle?.reason, 'migration-evidence')
  assert.equal(result.report.review, 1)
})
test('machine title and owner follow an identity move while custom editorial names remain untouched', async () => {
  for (const custom of [false, true]) {
    const rows = [row()]; rows[0].title = custom ? '人工标题' : 'a'; rows[0].sourceMeta.author = custom ? '编辑' : 'test'
    await reconcileCatalogLifecycle({ ...options(rows), observed: new Map([['a', moved]]), unavailableIds: [] })
    assert.equal(rows[0].title, custom ? '人工标题' : 'sdk-next')
    assert.equal(rows[0].sourceMeta.author, custom ? '编辑' : 'new')
    assert.equal(rows[0].summary, '人工摘要')
  }
})
test('a target occupied by another row or historical alias stays review-only', async () => {
  for (const alias of [false, true]) {
    const rows = [row(), row('b')]
    if (alias) rows[1].sourceMeta.previousUrls = [moved.html_url]
    else rows[1].url = moved.html_url
    await reconcileCatalogLifecycle({ ...options(rows), observed: new Map([['a', moved]]), unavailableIds: [] })
    assert.equal(rows[0].sourceMeta.lifecycle?.reason, 'address-conflict')
    assert.equal(rows[0].url, 'https://github.com/test/a')
  }
})

test('a later global error rolls back a newly eligible unavailable transition as well as its counter', async () => {
  const rows = [row('a'), row('b')]
  const first = '2026-10-12T00:00:00.000Z', last = '2026-10-12T06:00:00.000Z'
  const observations: LifecycleObservations = { a: { first, last, count: 2, runId: '2', runIds: ['1', '2'], cycle: Math.floor(Date.parse(last) / (6 * 3600000)) } }
  const result = await reconcileCatalogLifecycle({ ...options(rows, async path => {
    if (path === '/repositories/2') throw new Error('github-http-401')
    throw new Error('github-http-404')
  }), observations, runId: '3' })
  assert.deepEqual(result.observations, observations)
  assert.equal(rows[0].sourceMeta.lifecycle, undefined)
  assert.equal(result.report.unavailable, 0)
})
test('a later service error cannot revive failure history cleared by a verified recovery', async () => {
  const rows = [row('a'), row('b')]
  const first = '2026-10-12T00:00:00.000Z', last = '2026-10-12T06:00:00.000Z'
  const observations: LifecycleObservations = { a: { first, last, count: 2, runId: '2', runIds: ['1', '2'], cycle: Math.floor(Date.parse(last) / (6 * 3600000)) } }
  const recovered = { ...moved, html_url: rows[0].url, full_name: 'test/a', name: 'a', owner: { login: 'test' } }
  const interrupted = await reconcileCatalogLifecycle({ ...options(rows, async path => {
    if (path === '/repositories/1') return recovered
    throw new Error('github-http-503')
  }), observations, runId: '3' })
  assert.equal(interrupted.report.deferred, 'github-http-503')
  assert.equal(interrupted.observations.a, undefined, 'verified public availability breaks the previous failure streak despite a later error')
  const next = await reconcileCatalogLifecycle({ ...options(rows), observations: interrupted.observations, now: new Date(now.getTime() + 6 * 3600000), runId: '4' })
  assert.equal(next.observations.a.count, 1)
  assert.equal(next.observations.a.first, '2026-10-16T06:00:00.000Z')
  assert.equal(rows[0].sourceMeta.lifecycle, undefined, 'one failure after verified recovery cannot satisfy the 72-hour policy')
})
test('a later service error cannot restore counters cleared by a proven replacement identity', async () => {
  const rows = [row('a'), row('b')]
  const first = '2026-10-12T00:00:00.000Z', last = '2026-10-12T06:00:00.000Z'
  const observations: LifecycleObservations = { a: { first, last, count: 2, runId: '2', runIds: ['1', '2'], cycle: Math.floor(Date.parse(last) / (6 * 3600000)) } }
  const result = await reconcileCatalogLifecycle({ ...options(rows, async path => {
    if (path === '/repositories/1') throw new Error('github-http-404')
    if (path === '/repos/test/a') return { ...moved, id: 9, node_id: 'new-a', html_url: rows[0].url, full_name: 'test/a', name: 'a', owner: { login: 'test' } }
    throw new Error('github-http-503')
  }), observations, runId: '3' })
  assert.equal(result.report.deferred, 'github-http-503')
  assert.equal(result.observations.a, undefined)
  assert.equal(rows[0].sourceMeta.lifecycle?.reason, 'identity-changed')
})
test('fixed-source migration preserves a UTF-8 BOM when validating the original receipt hash', async () => {
  const rows = [row()], text = '\uFEFFTypeSafe Jev integration', bytes = Buffer.from(text)
  const evidenceSha256 = createHash('sha256').update(text).digest('hex')
  rows[0].sourceMeta.jevEvidence = { repo: 'test/a', evidenceUrl: `${rows[0].url}/blob/${sha}/README.md`, sha, evidenceSha256 }
  const result = await reconcileCatalogLifecycle({ ...options(rows, async () => ({
    type: 'file', path: 'README.md', encoding: 'base64', size: bytes.byteLength, content: bytes.toString('base64'),
    sha: createHash('sha1').update(`blob ${bytes.byteLength}\0`).update(bytes).digest('hex'),
  })), observed: new Map([['a', moved]]), unavailableIds: [] })
  assert.equal(result.report.migrated, 1)
  assert.equal(result.report.review, 0)
  assert.equal(rows[0].url, moved.html_url)
  assert.equal(rows[0].sourceMeta.lifecycle, undefined)
  assert.deepEqual(rows[0].sourceMeta.jevEvidence, { repo: 'new/sdk-next', evidenceUrl: `${moved.html_url}/blob/${sha}/README.md`, sha, evidenceSha256 })
})
test('bounded REST recovery rotates through missing identities rather than starving the tail', async () => {
  const rows = Array.from({ length: 80 }, (_, i) => ({ ...row(String(i)), sourceMeta: { repo: `test/${i}`, githubIdentity: { databaseId: i + 1, nodeId: `node-${i}` } } }))
  const seen = new Set<string>()
  for (let round = 0; round < 2; round++) {
    let calls = 0
    const result = await reconcileCatalogLifecycle({ ...options(structuredClone(rows), async path => { calls++; if (path.startsWith('/repositories/')) seen.add(path); throw new Error('github-http-404') }), now: new Date(now.getTime() + round * 6 * 3600000), runId: String(round + 1) })
    assert.equal(calls, 100)
    assert.equal(result.report.checked, 50)
  }
  assert.equal(seen.size, 80)
})
