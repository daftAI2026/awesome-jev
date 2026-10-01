/**
 * [INPUT]: 依赖 Node test 与批量元数据的身份、续点及只读探针接口
 * [OUTPUT]: 对外提供局部响应、排名更替、追加和真实客户端额度暂停的离线验收
 * [POS]: scripts 元数据调度契约，不连接 GitHub 或付费模型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readMetadataBatch, refreshMetadata, probeMetadata, metadataTop } from './github-metadata.ts'
import { METADATA_IDENTITY_ALIASES } from './github-metadata-aliases.ts'
import { repoKey } from './catalog.ts'
import { createGitHubClient } from './github-client.ts'
import { emptyState } from './radar.ts'
import { githubStarRanks } from '../src/lib/sort.ts'
import type { DirectoryItem, GitHubApi } from './model-types.ts'
const rows = (n: number): DirectoryItem[] => Array.from({ length: n }, (_, i) => ({ id: `r-${i}`, type: 'github', title: `Repo ${i}`,
  summary: '人工摘要', tags: ['curated'], url: `https://github.com/test/r-${i}`, sourceMeta: { repo: `test/r-${i}`, stars: n - i, author: '编辑' } }))
const response = (query: string, stars = (i: number) => 10000 - i) => {
  const data: Record<string, unknown> = { rateLimit: { cost: 1 } }
  for (const match of query.matchAll(/(r\d+):\s*repository\(owner:"test", name:"r-(\d+)"\)/g)) {
    const key = `test/r-${match[2]}`
    data[match[1]] = { nameWithOwner: key, url: `https://github.com/${key}`, stargazerCount: stars(Number(match[2])), forkCount: 2, primaryLanguage: null }
  }
  return { data }
}
const api: GitHubApi = async (_path, request) => response(request!.query)

test('batch aliases validate identity/scalars/partial errors and preserve complete curated metadata', async () => {
  const source = rows(6)
  const original = structuredClone(source)
  const batch = await readMetadataBatch(async (_path, request) => {
    const payload = response(request!.query)
    ;(payload.data.r1 as Record<string, unknown>).url = 'https://github.com/test/renamed'
    ;(payload.data.r2 as Record<string, unknown>).stargazerCount = -1
    ;(payload.data.r3 as Record<string, unknown>).primaryLanguage = {}
    payload.data.r4 = null
    return { ...payload, errors: [{ type: 'FORBIDDEN', path: ['r5', 'forkCount'] }] }
  }, source)
  assert.deepEqual(batch.repositories.map(Boolean), [true, false, false, false, false, false])
  assert.equal(batch.repositories[0]?.language, null)
  assert.equal(batch.cost, 1)
  assert.deepEqual(source, original)
  await assert.rejects(readMetadataBatch(api, []), /github-invalid-metadata-batch/)
  await assert.rejects(readMetadataBatch(api, rows(51)), /github-invalid-metadata-batch/)
})
test('UI rank comparator remains authoritative for ties and missing stars', () => {
  const source = rows(120)
  source.forEach((row, i) => { row.sourceMeta.stars = i % 2 ? 0 : undefined; row.title = i % 3 ? 'alpha' : 'Alpha' })
  const rank = githubStarRanks(source)
  assert.deepEqual(metadataTop(source).map((row) => row.id), [...rank].slice(0, 100).map(([id]) => id))
})
test('append and canonical insertion preserve identity anchor and wrap without starving appended records', async () => {
  const source = rows(150)
  const state = emptyState()
  const seen = new Set<string>()
  const tracked: GitHubApi = async (_path, request) => {
    for (const match of request!.query.matchAll(/name:"r-(\d+)"/g)) seen.add(match[1])
    return response(request!.query)
  }
  await refreshMetadata(source, state, tracked, 20)
  assert.equal(state.metadataCursor, 120)
  assert.equal(state.metadataNext, 'test/r-120')
  const appended = rows(155).slice(150)
  source.push(...appended)
  const inserted = rows(156)[155]
  source.unshift(inserted)
  const next = await refreshMetadata(source, state, tracked, 20)
  assert.equal(next.report.top100.complete, true)
  assert.equal(state.metadataCursor, 141)
  await refreshMetadata(source, state, tracked, 20)
  assert.equal(seen.size, 156)
  assert.equal(source[0].id, 'r-155')
})
test('real client quota on second other page keeps last completed batch cursor; next round resumes it', async () => {
  const source = rows(400)
  const state = emptyState()
  let calls = 0
  const shared = createGitHubClient('test', { now: () => 0, deadline: 1000, wait: async () => { assert.fail('Cannot fit reset before deadline') },
    fetchImpl: async (_url, init) => {
      calls++
      if (calls === 4) return Response.json({ errors: [{ type: 'RATE_LIMITED' }] }, { headers: { 'x-ratelimit-resource': 'graphql', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '10' } })
      return Response.json(response(JSON.parse(init!.body as string).query))
    } })
  const first = await refreshMetadata(source, state, shared)
  assert.equal(first.report.top100.complete, true)
  assert.equal(first.report.ok, 150)
  assert.equal(first.deferred?.reason, 'github-deadline')
  assert.equal(state.metadataNext, 'test/r-150')
  assert.equal(state.metadataCursor, 150)
  const secondPages: string[] = []
  await refreshMetadata(source, state, async (_path, request) => {
    secondPages.push(request!.query)
    return response(request!.query)
  }, 50)
  assert.match(secondPages[2], /r0: repository\(owner:"test", name:"r-150"\)/)
  assert.equal(state.metadataCursor, 200)
})
test('probe uses one fixed cross-public sentinel batch, never mutable canonical identities', async () => {
  let calls = 0
  const sentinels: string[] = []
  const reply: GitHubApi = async (path, request) => {
    calls++; assert.equal(path, '/graphql')
    const data: Record<string, unknown> = { rateLimit: { cost: 1 } }
    for (const match of request!.query.matchAll(/(r\d+):\s*repository\(owner:"([^"]+)", name:"([^"]+)"\)/g)) {
      const key = `${match[2]}/${match[3]}`; sentinels.push(key)
      data[match[1]] = { nameWithOwner: key, url: `https://github.com/${key}`, stargazerCount: 1, forkCount: 1, primaryLanguage: null }
    }
    return { data }
  }
  assert.deepEqual(await probeMetadata(reply), { repositories: 3, cost: 1 })
  assert.deepEqual(sentinels, ['nodejs/node', 'vitejs/vite', 'microsoft/typescript'])
  assert.equal(calls, 1)
  await assert.rejects(probeMetadata(async () => ({ data: { r0: null, r1: null, r2: null, rateLimit: { cost: 1 } } })), /github-metadata-probe-incomplete/)
})
test('unknown server cost is reported unknown rather than manufactured zero after a failed batch', async () => {
  const result = await refreshMetadata(rows(1), emptyState(), async () => { throw new Error('github-http-403') })
  assert.equal(result.report.cost, null)
  assert.equal(result.report.top100.complete, false)
})

test('top membership change does not reset the other cursor or reorder the canonical catalog', async () => {
  const source = rows(350)
  const state = emptyState()
  await refreshMetadata(source, state, api, 50)
  assert.equal(state.metadataCursor, 150)
  source[200].sourceMeta.stars = 99999
  const beforeOrder = source.map((row) => row.id)
  const pages: string[] = []
  const result = await refreshMetadata(source, state, async (_path, request) => {
    pages.push(request!.query)
    return response(request!.query, (i) => i === 200 ? 99999 : 10000 - i)
  }, 100)
  assert.match(pages[0], /r0: repository\(owner:"test", name:"r-200"\)/)
  assert.match(pages[2], /r0: repository\(owner:"test", name:"r-150"\)/)
  assert.doesNotMatch(pages.slice(2).join('\n'), /name:"r-200"/)
  assert.equal(state.metadataCursor, 251)
  assert.equal(state.metadataNext, 'test/r-251')
  assert.equal(result.report.top100.complete, true)
  assert.deepEqual(source.map((row) => row.id), beforeOrder)
})

const reviewedMoves = Object.entries(METADATA_IDENTITY_ALIASES)
for (const [old, { target, repositoryId }] of reviewedMoves) test(`reviewed stats alias ${old} keeps all canonical/editorial/audit identity fields unchanged`, async () => {
  const source: DirectoryItem[] = [{ ...rows(1)[0], url: `https://github.com/${old}`, sourceMeta: {
    repo: old, author: '原作者', stars: 5, forks: 8, language: 'Old', date: '2026-09-01',
    jevAbout: 0.95, jevKeep: 'keep', jevKeepConfidence: 0.99, jevEvidence: { repo: old, evidenceUrl: `https://github.com/${old}/tree/${'a'.repeat(40)}` },
  } }]
  const before = structuredClone(source[0])
  const result = await refreshMetadata(source, emptyState(), async (_path, request) => {
    assert.match(request!.query, /\bdatabaseId\b/)
    assert.ok(request!.query.includes(`owner:${JSON.stringify(old.split('/')[0])}, name:${JSON.stringify(old.split('/')[1])}`))
    return { data: { r0: { databaseId: repositoryId, nameWithOwner: target, url: `https://github.com/${target}`, stargazerCount: 9, forkCount: 10, primaryLanguage: null }, rateLimit: { cost: 1 } } }
  })
  assert.equal(result.report.top100.complete, true)
  assert.equal(result.report.ok, 1)
  assert.deepEqual(source[0], { ...before, sourceMeta: { ...before.sourceMeta, stars: 9, forks: 10, language: null } })
})
test('reviewed alias rejects mismatched URL/name, unknown second move and reclaimed old identity', async () => {
  const [old, { target, repositoryId }] = reviewedMoves[0]
  const source = [{ ...rows(1)[0], url: `https://github.com/${old}` }]
  for (const [name, url] of [[target, 'attacker/wrong'], [`${target}-v2`, `${target}-v2`], [old, old]]) {
    const result = await readMetadataBatch(async () => ({ data: { r0: { databaseId: repositoryId, nameWithOwner: name, url: `https://github.com/${url}`, stargazerCount: 9, forkCount: 10, primaryLanguage: null }, rateLimit: { cost: 1 } } }), source)
    assert.equal(result.repositories[0], null)
  }
})

// --- 显式例外须既匹配名字又匹配 immutable ID，防目标路径删除后被重新占用 ---
test('all 28 manual mappings have complete bounded proof metadata', () => {
  assert.equal(reviewedMoves.length, 28)
  const targets = new Set<string>()
  const ids = new Set<number>()
  for (const [old, alias] of reviewedMoves) {
    assert.equal(repoKey(`https://github.com/${old}`), old)
    assert.equal(repoKey(`https://github.com/${alias.target}`), alias.target)
    assert.notEqual(old, alias.target)
    assert.ok(Number.isSafeInteger(alias.repositoryId) && alias.repositoryId > 0)
    assert.equal(alias.checkedAt, '2026-10-01')
    const evidence = new URL(alias.evidenceUrl)
    assert.equal(evidence.origin, 'https://github.com')
    assert.match(evidence.pathname, /\/tree\/[a-f0-9]{40}$/)
    assert.equal(repoKey(`https://github.com/${evidence.pathname.split('/').slice(1, 3).join('/')}`), alias.target)
    assert.ok(!targets.has(alias.target)); targets.add(alias.target)
    assert.ok(!ids.has(alias.repositoryId)); ids.add(alias.repositoryId)
  }
})
test('all 28 reviewed targets reject wrong, missing or invalid immutable IDs', async () => {
  for (const [old, { target, repositoryId }] of reviewedMoves) {
    const source = [{ ...rows(1)[0], url: `https://github.com/${old}` }]
    for (const databaseId of [repositoryId + 1, undefined, null, String(repositoryId), -1]) {
      const result = await readMetadataBatch(async () => ({ data: { r0: { databaseId, nameWithOwner: target, url: `https://github.com/${target}`, stargazerCount: 9, forkCount: 10, primaryLanguage: null }, rateLimit: { cost: 1 } } }), source)
      assert.equal(result.repositories[0], null, `${old}: mismatched immutable ID accepted`)
    }
  }
})
