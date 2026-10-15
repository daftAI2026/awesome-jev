/**
 * [INPUT]: 依赖核心雷达、候选公平队列与注入的离线 GitHub / Jev 桩
 * [OUTPUT]: 验证隐藏目录复核的身份绑定、预算继承、替换与持久重试
 * [POS]: scripts 的目录复核验收；不访问网络，不调用付费模型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyState, runRadar, validateState } from './radar.ts'
import { candidateQueue } from './candidate-queue.ts'
import type { Catalog, GitHubApi, GitHubDirectoryItem, GitHubRepository, JevScore } from './model-types.ts'

const now = new Date('2026-10-16T00:00:00Z')
const sha = 'b'.repeat(40)
const keep: JevScore = { jevAbout: 0.97, jevKeep: 'keep', jevKeepConfidence: 0.98, category: 'developer' }
const target = (id = 2, url = 'https://github.com/test/jev-sdk') => ({ url, databaseId: id, nodeId: `R_${id}` })
function source(id = 2, url = 'https://github.com/test/jev-sdk'): GitHubDirectoryItem {
  return { id: 'original-entry', type: 'github', title: 'Curator title', summary: 'Curator summary', tags: ['curated'], category: 'sdk',
    url: 'https://github.com/test/jev-sdk', sourceMeta: { repo: 'test/jev-sdk', githubIdentity: { databaseId: 1, nodeId: 'R_1' },
      stars: 100, forks: 5, language: 'Rust', jevAbout: 0.99, jevKeep: 'keep', jevKeepConfidence: 0.99,
      inclusion: { text: { en: 'Old basis', zh: '旧依据', ja: '旧根拠' }, reviewer: 'curator', checkedAt: now.toISOString(),
        evidence: [{ url: `https://github.com/test/jev-sdk/blob/${'a'.repeat(40)}/README.md`, quote: 'Old TypeSafe Jev evidence' }] },
      lifecycle: { state: 'review', since: now.toISOString(), reason: id === 1 ? 'migration-evidence' : 'identity-changed', target: target(id, url) } } }
}
function catalog(row = source()): Catalog { return { files: new Map([['github.json', [row]]]), rows: [row] } }
function repository(id = 2, key = 'test/jev-sdk'): GitHubRepository {
  const [owner, name] = key.split('/')
  return { id, node_id: `R_${id}`, html_url: `https://github.com/${key}`, full_name: key, name, owner: { login: owner },
    default_branch: 'main', description: 'TypeSafe Jev SDK', stargazers_count: 2, forks_count: 1, language: 'TypeScript',
    private: false, fork: false, archived: false }
}
function evidence(repo = repository()): GitHubApi {
  return async path => {
    if (path.startsWith('/search/')) throw new Error('github-http-403')
    if (path.includes('/commits/')) return { sha }
    if (path.includes('/readme?')) return { encoding: 'base64', size: 60, path: 'README.md', content: Buffer.from('Useful TypeSafe Jev SDK documentation at typesafe.ai').toString('base64') }
    if (path === `/repos/${repo.full_name}`) return repo
    throw new Error(`Unexpected offline request: ${path}`)
  }
}

test('hidden different-ID review bypasses only its bound duplicate and shares budget despite discovery failure', async () => {
  const old = source(), input = catalog(old)
  let requests = 0, paid = 0
  const result = await runRadar({ catalog: input, now, api: evidence(), queries: ['offline'], beforeRequest: async () => { requests++ },
    review: async (_row, _text, options) => { await options?.beforeRequest?.(); paid++; return keep } })
  assert.equal(paid, 1); assert.equal(requests, 1); assert.equal(result.report.added, 1)
  assert.equal(result.rows.length, 2)
  assert.deepEqual(result.rows[0], { ...old, sourceMeta: { ...old.sourceMeta, lifecycle: { ...old.sourceMeta.lifecycle, state: 'replaced' } } })
  const added = result.rows[1]
  assert.equal(added.id, 'gh-repo-2'); assert.equal(added.sourceMeta.githubIdentity?.databaseId, 2)
  assert.equal(added.category, 'developer'); assert.equal(added.sourceMeta.inclusion, undefined)
  assert.equal(added.sourceMeta.jevAbout, keep.jevAbout); assert.equal((added.sourceMeta.jevEvidence as { sha?: string })?.sha, sha)
  assert.deepEqual(result.state.candidates, {}); assert.deepEqual(input.rows, [old])
  const repeated = await runRadar({ catalog: { files: result.files, rows: result.rows }, state: result.state, now, api: evidence(), queries: [], review: async () => assert.fail('A replaced request must not be reviewed again') })
  assert.equal(repeated.report.reviewed, 0)
})

test('same-ID review keeps local identity and editorial text but archives old inclusion before migration', async () => {
  const old = source(1, 'https://github.com/new/jev-sdk')
  const result = await runRadar({ catalog: catalog(old), now, api: evidence(repository(1, 'new/jev-sdk')), queries: [], review: async () => ({ ...keep, category: 'sdk' }) })
  assert.equal(result.rows.length, 1); assert.equal(result.report.added, 0)
  const moved = result.rows[0]
  assert.equal(moved.id, old.id); assert.equal(moved.title, old.title); assert.equal(moved.summary, old.summary)
  assert.deepEqual(moved.tags, old.tags); assert.equal(moved.category, old.category)
  assert.equal(moved.url, 'https://github.com/new/jev-sdk'); assert.equal(moved.sourceMeta.repo, 'new/jev-sdk')
  assert.deepEqual(moved.sourceMeta.previousUrls, [old.url]); assert.equal(moved.sourceMeta.lifecycle, undefined)
  assert.equal(moved.sourceMeta.inclusion, undefined); assert.deepEqual(moved.sourceMeta.previousInclusion, [old.sourceMeta.inclusion])
  assert.equal((moved.sourceMeta.jevEvidence as { evidenceUrl?: string })?.evidenceUrl, `https://github.com/new/jev-sdk/blob/${sha}/README.md`)
})

for (const verdict of ['review', 'drop'] as const) test(`${verdict} keeps the source hidden and preserves cooldown across metadata imports`, async () => {
  const input = catalog(), score = { ...keep, jevKeep: verdict }
  let paid = 0
  const first = await runRadar({ catalog: input, now, queries: [], api: evidence(), review: async () => { paid++; return score } })
  const entry = first.state.candidates['test/jev-sdk']
  assert.equal(entry?.status, verdict); assert.equal(entry?.attempts, 1); assert.ok(entry?.retryAt)
  const second = await runRadar({ catalog: { files: first.files, rows: first.rows }, state: first.state, now: new Date(now.getTime() + 1000), queries: [], api: evidence(), review: async () => { paid++; return keep } })
  assert.equal(paid, 1); assert.deepEqual(second.state.candidates['test/jev-sdk'], entry)
  assert.deepEqual(second.rows, input.rows)
})

for (const timing of ['before', 'after'] as const) test(`target ID changed ${timing} model review cannot inherit an approval`, async () => {
  let paid = 0, reads = 0
  const original = catalog(), fallback = evidence()
  const api: GitHubApi = async (path, request, options) => path === '/repos/test/jev-sdk'
    ? repository(++reads > (timing === 'before' ? 0 : 1) ? 3 : 2) : fallback(path, request, options)
  const result = await runRadar({ catalog: original, now, queries: [], api, review: async () => { paid++; return keep } })
  assert.equal(paid, timing === 'before' ? 0 : 1); assert.deepEqual(result.rows, original.rows)
  assert.equal(result.state.candidates['test/jev-sdk']?.status, 'error')
  assert.equal(result.report.added, 0)
})

test('ordinary known-URL discovery cannot become an implicit replacement request', async () => {
  const old = source(); delete old.sourceMeta.lifecycle
  const api: GitHubApi = async path => path.startsWith('/search/') ? { items: [repository()], total_count: 1 } : assert.fail('Known catalog URL must not reach evidence')
  const result = await runRadar({ catalog: catalog(old), now, api, queries: ['normal'], review: async () => assert.fail('No replacement authority') })
  assert.deepEqual(result.rows, [old]); assert.equal(result.report.reviewed, 0)
})

test('review request obeys the existing candidate limit and budget interruption restores its pending state', async () => {
  const state = emptyState()
  state.candidates['test/ordinary'] = { status: 'review', attempts: 1, discoveredAt: '2026-10-01T00:00:00Z', retryAt: '2026-10-02T00:00:00Z' }
  const result = await runRadar({ catalog: catalog(), state, now, limit: 1, queries: [], api: evidence(),
    review: async (_row, _text, options) => { await options?.beforeRequest?.(); return keep }, beforeRequest: async () => { throw new Error('radar-budget-exhausted') } })
  assert.equal(result.report.deferred?.reason, 'radar-budget-exhausted')
  assert.equal(result.state.candidates['test/jev-sdk']?.attempts, 0)
  assert.equal(result.state.candidates['test/jev-sdk']?.status, 'pending')
  assert.deepEqual(result.state.candidates['test/ordinary'], state.candidates['test/ordinary'])
})

test('ordinary code discovery cannot erase a catalog-review cooldown', async () => {
  const old = source(1, 'https://github.com/new/jev-sdk')
  const first = await runRadar({ catalog: catalog(old), now, queries: [], api: evidence(repository(1, 'new/jev-sdk')), review: async () => ({ ...keep, jevKeep: 'review' }) })
  const before = structuredClone(first.state.candidates['new/jev-sdk'])
  const queue = candidateQueue(first.state, new Set([repoKeyFor(old.url)]), new Set([1]), first.report, now.toISOString(), 4000)
  queue.accept({ query: 'code:new', page: 1, nextPage: 1, sourceStatus: 'complete', items: [{ repo: 'new/jev-sdk', codeHints: [{ path: 'new.ts', query: 'new' }] }] })
  assert.deepEqual(first.state.candidates['new/jev-sdk'], before)
})
function repoKeyFor(url: string) { return url.replace('https://github.com/', '') }

test('same-ID approval cannot retain a stale needsReview flag from the old score', async () => {
  const old = source(1); old.sourceMeta.needsReview = true
  const result = await runRadar({ catalog: catalog(old), now, queries: [], api: evidence(repository(1)), review: async () => ({ ...keep, category: 'sdk' }) })
  assert.equal(result.rows[0].sourceMeta.needsReview, undefined)
  assert.equal(result.rows[0].sourceMeta.lifecycle, undefined)
})

test('alternative catalog review keeps its original license/context/category gates and shared budget', async () => {
  const old = source(); old.category = 'alternatives'
  let paid = 0, budget = 0
  const repo = { ...repository(), license: { spdx_id: 'MIT' } }, baseApi = evidence(repo)
  const api: GitHubApi = async (path, query, options) => path.includes('/readme?')
    ? { encoding: 'base64', path: 'README.md', content: Buffer.from('Independent typed decisions with calibrated probabilities and decision heads').toString('base64') }
    : baseApi(path, query, options)
  const result = await runRadar({ catalog: catalog(old), now, queries: [], api, beforeRequest: async () => { budget++ },
    review: async (_row, _text, options) => { assert.equal(options?.alternative, true); await options?.beforeRequest?.(); paid++; return { ...keep, category: 'alternatives' } } })
  assert.equal(paid, 1); assert.equal(budget, 1); assert.equal(result.rows[1]?.category, 'alternatives')
})
for (const problem of ['license', 'context', 'category'] as const) test(`alternative review with wrong ${problem} remains hidden`, async () => {
  const old = source(); old.category = 'alternatives'
  const repo = { ...repository(), ...(problem !== 'license' ? { license: { spdx_id: 'MIT' } } : {}) }, baseApi = evidence(repo)
  let paid = 0
  const api: GitHubApi = async (path, query, options) => path.includes('/readme?')
    ? { encoding: 'base64', path: 'README.md', content: Buffer.from(problem === 'context' ? 'TypeSafe Jev SDK documentation' : 'Independent typed decisions and calibrated probabilities').toString('base64') }
    : baseApi(path, query, options)
  const result = await runRadar({ catalog: catalog(old), now, queries: [], api, review: async () => { paid++; return keep } })
  assert.equal(paid, problem === 'category' ? 1 : 0); assert.equal(result.report.added, 0)
  assert.deepEqual(result.rows, [old]); assert.equal(result.state.candidates['test/jev-sdk']?.status, 'review')
})

test('a changed canonical target starts a new request without inheriting the prior verdict', async () => {
  const first = await runRadar({ catalog: catalog(), now, queries: [], api: evidence(), review: async () => ({ ...keep, jevKeep: 'drop' }) })
  const changed = source(3); let paid = 0
  const next = await runRadar({ catalog: catalog(changed), state: first.state, now: new Date(now.getTime() + 1000), queries: [], api: evidence(repository(3)),
    review: async () => { paid++; return { ...keep, jevKeep: 'review' } } })
  assert.equal(paid, 1); assert.equal(next.state.candidates['test/jev-sdk']?.attempts, 1)
  assert.equal(next.state.candidates['test/jev-sdk']?.catalogReview?.target.databaseId, 3)
  assert.equal(next.state.candidates['test/jev-sdk']?.lastReview?.status, 'review')
})

test('persisted review authority disappears when its canonical request is removed', async () => {
  const first = await runRadar({ catalog: catalog(), now, queries: [], api: evidence(), review: async () => ({ ...keep, jevKeep: 'review' }) })
  const old = source(); delete old.sourceMeta.lifecycle
  const next = await runRadar({ catalog: catalog(old), state: first.state, now: new Date('2026-11-16T00:00:00Z'), queries: [], api: evidence(), review: async () => assert.fail('Stale candidate is not authority') })
  assert.deepEqual(next.state.candidates, {}); assert.deepEqual(next.rows, [old])
})

test('candidate request validation rejects a changed key or a malformed target', async () => {
  const first = await runRadar({ catalog: catalog(), now, queries: [], api: evidence(), review: async () => ({ ...keep, jevKeep: 'review' }) })
  const bad = structuredClone(first.state)
  bad.candidates['test/jev-sdk'].catalogReview!.target.url = 'https://github.com/elsewhere/jev'
  assert.throws(() => validateState(bad), /catalog review/)
  bad.candidates['test/jev-sdk'].catalogReview!.target.url = 'https://github.com/test/jev-sdk'
  bad.candidates['test/jev-sdk'].catalogReview!.target.databaseId = 0
  assert.throws(() => validateState(bad), /catalog review/)
})

test('catalog drop cooldown is never evicted to make room for ordinary discovery', async () => {
  const result = await runRadar({ catalog: catalog(), now, queries: [], api: evidence(), review: async () => ({ ...keep, jevKeep: 'drop' }) })
  const before = structuredClone(result.state.candidates)
  const queue = candidateQueue(result.state, new Set(), new Set(), result.report, now.toISOString(), 100)
  assert.equal(queue.reserve(), false); assert.deepEqual(result.state.candidates, before)
})

test('a full ordinary pending pool defers importing catalog reviews rather than deleting candidates', async () => {
  const state = emptyState()
  for (let i = 0; i < 2000; i++) state.candidates[`test/pending-${i}`] = { status: 'pending', attempts: 0, discoveredAt: now.toISOString(), retryAt: '2099-01-01T00:00:00Z' }
  const next = await runRadar({ catalog: catalog(), state, now, queries: [], api: evidence(), review: async () => assert.fail('No due capacity') })
  assert.equal(next.report.backpressure, 1); assert.deepEqual(next.state.candidates, state.candidates)
  assert.deepEqual(next.rows, catalog().rows)
})

test('catalog and ordinary requests use the same first-review and retry fairness lanes', async () => {
  const state = emptyState()
  state.candidates['test/ordinary'] = { status: 'review', attempts: 1, discoveredAt: '2026-10-01T00:00:00Z', retryAt: '2026-10-02T00:00:00Z' }
  const fallback = evidence(), ordinary = evidence(repository(9, 'test/ordinary')), seen: string[] = []
  const api: GitHubApi = (path, query, options) => path.startsWith('/repos/test/ordinary') ? ordinary(path, query, options) : fallback(path, query, options)
  const review: Parameters<typeof runRadar>[0]['review'] = async row => { seen.push(String(row.sourceMeta?.repo)); return { ...keep, jevKeep: 'review' } }
  const first = await runRadar({ catalog: catalog(), state, now, limit: 1, queries: [], api, review })
  const second = await runRadar({ catalog: { rows: first.rows, files: first.files }, state: first.state, now, limit: 1, queries: [], api, review })
  assert.deepEqual(seen, ['test/jev-sdk', 'test/ordinary']); assert.equal(second.state.candidates['test/ordinary'].attempts, 2)
})

test('same-ID category disagreement and target public-address conflicts cannot restore a hidden row', async () => {
  const old = source(1, 'https://github.com/new/jev-sdk')
  const category = await runRadar({ catalog: catalog(old), now, queries: [], api: evidence(repository(1, 'new/jev-sdk')), review: async () => keep })
  assert.deepEqual(category.rows, [old]); assert.equal(category.state.candidates['new/jev-sdk']?.status, 'review')
  const other = source(3); other.id = 'different'; other.url = 'https://github.com/new/jev-sdk'; other.sourceMeta.repo = 'new/jev-sdk'; other.sourceMeta.githubIdentity = { databaseId: 3, nodeId: 'R_3' }; delete other.sourceMeta.lifecycle
  const rows = [old, other]
  const conflict = await runRadar({ catalog: { files: new Map([['github.json', rows]]), rows }, now, queries: [], api: evidence(repository(1, 'new/jev-sdk')), review: async () => assert.fail('An address conflict cannot be solved by a model') })
  assert.deepEqual(conflict.rows, rows); assert.equal(conflict.state.candidates['new/jev-sdk']?.status, 'error')
})

test('same-ID migration changes only machine-derived title and author', async () => {
  for (const manual of [false, true]) {
    const old = source(1, 'https://github.com/new/renamed')
    old.title = manual ? 'Curator title' : 'jev-sdk'; old.sourceMeta.author = manual ? 'Curator author' : 'test'
    const result = await runRadar({ catalog: catalog(old), now, queries: [], api: evidence(repository(1, 'new/renamed')), review: async () => ({ ...keep, category: 'sdk' }) })
    assert.equal(result.rows[0].title, manual ? old.title : 'renamed')
    assert.equal(result.rows[0].sourceMeta.author, manual ? old.sourceMeta.author : 'new')
  }
})

for (const identity of [1, 2]) test(`catalog review of ID ${identity} keeps quarantine when a keep score omits category`, async () => {
  const old = source(identity), score = { ...keep }; delete score.category
  let paid = 0
  const result = await runRadar({ catalog: catalog(old), now, queries: [], api: evidence(repository(identity)),
    review: async () => { paid++; return score } })
  assert.equal(paid, 1); assert.deepEqual(result.rows, [old]); assert.equal(result.report.added, 0)
  assert.equal(result.state.candidates['test/jev-sdk']?.status, 'review')
  assert.ok(result.state.candidates['test/jev-sdk']?.retryAt)
})
