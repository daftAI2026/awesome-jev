/**
 * [INPUT]: 依赖共享队列、两条采集器与离线 GitHub/模型替身
 * [OUTPUT]: 验证历史不占新发现槽位、真实任务背压和未变证据的付费复用
 * [POS]: scripts 的候选生命周期回归；不访问网络，不调用付费模型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { candidateCounts, candidateQueue, candidateQueueSummary, discoveryStalled, reusableReview, CORE_ACTIVE_LIMIT, MAX_RADAR_STATE_BYTES } from './candidate-queue.ts'
import { reviewFingerprint } from './jev-client.ts'
import { emptyState, runRadar, validateState, type RadarReport } from './radar.ts'
import { emptyAlternativesState, runAlternatives, validateAlternativesState } from './alternatives-radar.ts'
import type { Catalog, GitHubApi, GitHubRepository, JevScore } from './model-types.ts'

const now = new Date('2026-11-14T00:00:00.000Z')
const later = (days: number) => new Date(now.getTime() + days * 86400000)
const report = (): RadarReport => ({ at: now.toISOString(), model: 'jev-latest', status: 'partial',
  sources: [], metadata: { ok: 0, failed: 0 }, reviewed: 0, added: 0, pending: 0, overflow: 0, evicted: 0, receipts: [] })
const catalog = (): Catalog => ({ rows: [], files: new Map([['github.json', []]]) })
const repo: GitHubRepository = { id: 42, node_id: 'fixture:42', html_url: 'https://github.com/test/jev-model',
  full_name: 'test/jev-model', name: 'jev-model', owner: { login: 'test' }, default_branch: 'main',
  description: 'TypeSafe Jev SDK and independent typed System One decisions', topics: ['jev'],
  stargazers_count: 1, forks_count: 0, language: 'TypeScript', created_at: now.toISOString(),
  private: false, fork: false, archived: false, license: { spdx_id: 'MIT' } }
const text = 'TypeSafe Jev at https://typesafe.ai: independent System One typed decisions with calibrated probabilities.'
const api = (readme = text): GitHubApi => async path => path.startsWith('/search/') ? { items: [repo], total_count: 1 }
  : path.includes('/commits/') ? { sha: 'a'.repeat(40) }
    : path.includes('/readme?') ? { path: 'README.md', encoding: 'base64', size: Buffer.byteLength(readme), content: Buffer.from(readme).toString('base64') }
      : repo
const uncertain: JevScore = { jevAbout: 0.8, jevKeep: 'review', jevKeepConfidence: 0.8, category: 'sdk' }

for (const [name, create, limit] of [['core', emptyState, 4000], ['alternatives', emptyAlternativesState, 2000]] as const) {
  test(`${name}: processed history cannot block an empty first-review queue`, () => {
    const state = create()
    for (let i = 0; i < limit - 69; i++) state.candidates[`old/repo-${i}`] = {
      status: i % 2 ? 'review' : 'error', discoveredAt: now.toISOString(), retryAt: later(7).toISOString(), attempts: 1,
    }
    const before = structuredClone(state.candidates)
    const result = report()
    const queue = candidateQueue(state, new Set(), new Set(), result, now.toISOString(), CORE_ACTIVE_LIMIT)
    assert.equal(queue.reserve(), true, '复现：只有 69 个历史槽位，但首次待审为零，仍应发现')
    assert.deepEqual(state.candidates, before, '不得通过删除历史证据腾位')
    queue.accept({ query: 'query', page: 1, nextPage: 2, sourceStatus: 'bounded', items: [{ repo: 'new/project' }] })
    assert.equal(state.candidates['new/project'].status, 'pending')
    assert.equal(state.pages.query, 2)
    assert.equal(result.evicted, 0)
  })
}

test('real first-review saturation retains the page and never advances its cursor', () => {
  const state = emptyState()
  for (let i = 0; i < 2000; i++) state.candidates[`new/repo-${i}`] = { status: 'pending', discoveredAt: now.toISOString(), attempts: 0 }
  const queue = candidateQueue(state, new Set(), new Set(), report(), now.toISOString(), 4000)
  assert.equal(queue.reserve(), false)
  queue.accept({ query: 'query', page: 1, nextPage: 2, sourceStatus: 'bounded', items: [{ repo: 'new/overflow' }] })
  assert.equal(state.pages.query, undefined)
  assert.equal(state.pendingSearchPage?.items[0].repo, 'new/overflow')
})

test('validators bound unfinished work, not the number of historical decisions', () => {
  const state = emptyState()
  for (let i = 0; i < 4100; i++) state.candidates[`old/repo-${i}`] = { status: 'review', discoveredAt: now.toISOString(), attempts: 1 }
  assert.doesNotThrow(() => validateState(state))
  const alternatives = { ...state, version: 1, metadataCursor: 0 }
  assert.doesNotThrow(() => validateAlternativesState(alternatives))
  for (const entry of Object.values(state.candidates)) entry.status = 'pending'
  assert.throws(() => validateState(state), /overflow/)
})

for (const mode of ['core', 'alternatives'] as const) {
  test(`${mode}: unchanged uncertain evidence is rechecked without another paid call`, async () => {
    let calls = 0
    const score = { ...uncertain, category: mode === 'core' ? 'sdk' : 'alternatives' } as JevScore
    const run = mode === 'core' ? runRadar : runAlternatives
    const first = await run({ catalog: catalog(), now, queries: ['query'], api: api(), review: async () => { calls++; return score } })
    assert.equal(calls, 1, JSON.stringify(first.report.receipts))
    const next = await run({ catalog: catalog(), state: first.state, now: later(7), queries: [], api: api(),
      review: async () => { calls++; return score } })
    assert.equal(next.report.added, 0)
    assert.equal(next.report.reusedReviews, 1)
    assert.equal(next.state.candidates['test/jev-model'].modelReviewedAt, now.toISOString(), '复用不能伪造新的模型调用时间')
    assert.equal(calls, 1, '相同模型输入不应每七天重新付费')
    const changed = await run({ catalog: catalog(), state: next.state, now: later(14), queries: [], api: api(text + ' New implementation.'),
      review: async () => { calls++; return score } })
    assert.equal(calls, 2, '证据改变后必须重新审核')
    const expired = await run({ catalog: catalog(), state: changed.state, now: later(45), queries: [], api: api(text + ' New implementation.'),
      review: async () => { calls++; return score } })
    assert.equal(calls, 3, 'jev-latest 会更新，不能永久复用旧判断')
    assert.equal(expired.report.added, 0)
  })
}

test('history remains subject to a real byte-size guard and cache metadata is validated', () => {
  const state = emptyState()
  state.candidates['old/project'] = { status: 'review', discoveredAt: now.toISOString(), attempts: 1,
    reviewFingerprint: 'not-a-digest', modelReviewedAt: now.toISOString() }
  assert.throws(() => validateState(state), /candidate state/)
  state.candidates['old/project'].reviewFingerprint = 'a'.repeat(64)
  delete state.candidates['old/project'].modelReviewedAt
  assert.throws(() => validateState(state), /candidate state/)
  delete state.candidates['old/project'].reviewFingerprint
  state.candidates['old/project'].lastReview = { repo: 'old/project', status: 'review', reason: 'x'.repeat(MAX_RADAR_STATE_BYTES) }
  assert.throws(() => validateState(state), /storage capacity/)
})

test('cached keep and malformed scores are never reusable approval credentials', () => {
  const candidate = { status: 'review' as const, discoveredAt: now.toISOString(), attempts: 1,
    reviewFingerprint: 'a'.repeat(64), modelReviewedAt: now.toISOString(),
    lastReview: { repo: 'test/jev-model', status: 'review', score: { ...uncertain, jevAbout: 0.99, jevKeep: 'keep' as const, jevKeepConfidence: 0.99 } } }
  assert.equal(reusableReview(candidate, candidate.reviewFingerprint, later(7).getTime()), undefined)
  candidate.lastReview.score = { ...candidate.lastReview.score, jevAbout: NaN }
  assert.equal(reusableReview(candidate, candidate.reviewFingerprint, later(7).getTime()), undefined)
})

test('storage capacity counts persisted indentation and the trailing newline', () => {
  const state = emptyState()
  state.candidates['old/project'] = { status: 'review', discoveredAt: now.toISOString(), attempts: 1,
    lastReview: { repo: 'old/project', status: 'review', reason: '' } }
  const overhead = Buffer.byteLength(JSON.stringify(state))
  state.candidates['old/project'].lastReview!.reason = 'x'.repeat(MAX_RADAR_STATE_BYTES - overhead - 1)
  assert.ok(Buffer.byteLength(JSON.stringify(state)) < MAX_RADAR_STATE_BYTES)
  assert.ok(Buffer.byteLength(JSON.stringify(state, null, 2) + '\n') > MAX_RADAR_STATE_BYTES)
  assert.throws(() => validateState(state), /storage capacity/)
})

test('live published backlog accepts new work without a migration or deleting evidence', () => {
  // 只用本轮真实规模，不把运行时线上状态作为离线测试的固定数据依赖。
  const state = emptyState()
  for (let i = 0; i < 3931; i++) state.candidates[`old/repo-${i}`] = {
    status: i < 3368 ? 'review' : 'error', discoveredAt: now.toISOString(), attempts: 1, retryAt: later(7).toISOString(),
  }
  const result = report()
  const queue = candidateQueue(state, new Set(), new Set(), result, now.toISOString(), CORE_ACTIVE_LIMIT)
  assert.equal(queue.reserve(), true)
  queue.accept({ query: 'query', page: 1, nextPage: 2, sourceStatus: 'bounded',
    items: Array.from({ length: 100 }, (_, i) => ({ repo: `new/repo-${i}` })) })
  assert.equal(Object.keys(state.candidates).length, 4031)
  assert.equal(state.pages.query, 2)
  assert.doesNotThrow(() => validateState(state))
})

test('queue health distinguishes a stalled discovery from real saturation and zero admissions', () => {
  const state = emptyState(), result = report()
  state.candidates['old/project'] = { status: 'review', discoveredAt: now.toISOString(), attempts: 1 }
  result.queue = candidateCounts(state)
  result.discoveryPending = 0
  result.sources = [{ query: 'query', fetched: 0, total: 0, status: 'backpressure' }]
  assert.equal(discoveryStalled(result), true)
  assert.match(candidateQueueSummary(result), /First review: 0; awaiting recheck: 1/)
  state.candidates['new/project'] = { status: 'pending', discoveredAt: now.toISOString(), attempts: 0 }
  result.queue = candidateCounts(state)
  result.discoveryPending = 1
  assert.equal(discoveryStalled(result), false)
  result.sources[0].status = 'complete'
  result.sources[0].fetched = 100
  assert.equal(discoveryStalled(result), false, '没有合格新增不是故障')
})

for (const mode of ['core', 'alternatives'] as const) {
  test(`${mode}: draining a saturated first-review batch is progress, not stalled discovery`, async () => {
    const state = mode === 'core' ? emptyState() : emptyAlternativesState()
    for (let i = 0; i < 2000; i++) state.candidates[`new/repo-${i}`] = { status: 'pending', discoveredAt: now.toISOString(), attempts: 0 }
    const run = mode === 'core' ? runRadar : runAlternatives
    let attempts = 0
    const result = await run({ catalog: catalog(), state, now, queries: ['query'],
      api: async path => {
        assert.ok(!path.startsWith('/search/'), '发现阶段满载时不应读取新页面')
        attempts++
        throw new Error('github-http-404')
      }, review: async () => assert.fail('404 不调用模型') })
    assert.equal(attempts, 2000)
    assert.equal(result.report.queue?.pending, 0)
    assert.equal(result.report.queue?.error, 2000)
    assert.equal(discoveryStalled(result.report), false, '本轮处理了整批任务，必须允许保存状态')
  })
}

test('review fingerprints cover actual model inputs rather than incidental repository statistics', () => {
  const row = { type: 'github', title: 'SDK', summary: 'TypeSafe Jev', url: repo.html_url, tags: ['jev'], sourceMeta: { repo: repo.full_name, stars: 1 } }
  const fingerprint = reviewFingerprint(row, text)
  assert.equal(reviewFingerprint({ ...row, sourceMeta: { ...row.sourceMeta, stars: 999 } }, text), fingerprint)
  assert.notEqual(reviewFingerprint({ ...row, summary: 'Changed evidence summary' }, text), fingerprint)
  assert.notEqual(reviewFingerprint(row, text, true), fingerprint)
  assert.notEqual(reviewFingerprint(row, text + 'x'), fingerprint)
})

for (const mode of ['core', 'alternatives'] as const) {
  test(`${mode}: a new qualified candidate is admitted through a full historical pool`, async () => {
    const state = mode === 'core' ? emptyState() : emptyAlternativesState()
    for (let i = 0; i < 4100; i++) state.candidates[`old/repo-${i}`] = { status: 'review', discoveredAt: now.toISOString(), retryAt: later(7).toISOString(), attempts: 1 }
    const run = mode === 'core' ? runRadar : runAlternatives
    const result = await run({ catalog: catalog(), state, now, queries: ['query'], api: api(),
      review: async () => ({ jevAbout: 0.99, jevKeep: 'keep', jevKeepConfidence: 0.99, category: mode === 'core' ? 'sdk' : 'alternatives' }) })
    assert.equal(result.report.sources[0].fetched, 1)
    assert.equal(result.report.added, 1)
    assert.equal(result.report.queue?.pending, 0)
    assert.equal(Object.keys(result.state.candidates).length, 4100)
    assert.deepEqual(result.state.candidates, state.candidates, '收录新项目不得删除历史')
  })
}
