/**
 * [INPUT]: 依赖 Node test 与替代实现审计的离线请求桩
 * [OUTPUT]: 对外提供初筛与暂停保留检查点的回归断言
 * [POS]: scripts 的本地审计验收，不调用真实 GitHub 或付费模型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { auditAlternatives, possibleAlternative } from './alternative-audit.ts'

test('existing alternatives and Jev-like implementation summaries enter the full audit', () => {
  assert.equal(possibleAlternative({ title: 'kev', summary: 'tiny Jev-like family of decision models built on Qwen3.5' }), true)
  assert.equal(possibleAlternative({ title: 'Laya', summary: 'a local inference runtime', category: 'alternatives' }), true)
  assert.equal(possibleAlternative({ title: 'unknown', summary: 'no matching label' }, 'alternatives'), true)
})

test('ordinary open-source integrations are not mistaken for alternatives by the broad text lead', () => {
  assert.equal(possibleAlternative({ title: 'agent skill', summary: 'Open-source TypeSafe Jev SDK client for an agent' }), false)
  assert.equal(possibleAlternative({ title: 'guide', summary: 'A tutorial and resource list for Jev' }), false)
})

for (const reason of ['github-deadline', 'github-rate-limited', 'github-request-budget']) {
  test(`audit pauses on ${reason} without marking remaining candidates reviewed`, async () => {
    const rows = ['done', 'current', 'next'].map((name) => ({ id: name, type: 'github' as const, title: name,
      summary: '', url: `https://github.com/example/${name}`, category: 'alternatives' as const,
      sourceMeta: { repo: `example/${name}`, stars: name === 'done' ? 3 : name === 'current' ? 2 : 1 } }))
    const state = { version: 1 as const, fingerprint: 'test', screened: Object.fromEntries(rows.map((row) => [row.id, 'alternatives' as const])),
      reviewed: { done: { decision: 'keep' as const, checkedAt: '2026-10-01T00:00:00Z' } } }
    const previous = structuredClone(state)
    const requests: string[] = []; let writes = 0
    await assert.rejects(auditAlternatives(rows, 'offline-test', 'offline-test', state, () => { writes++ }, {
      api: async (path) => { requests.push(path); throw new Error(reason) },
    }), new RegExp(reason))
    assert.deepEqual(state, previous)
    assert.equal(writes, 0)
    assert.deepEqual(requests, ['/repos/example/current'])
  })
}
