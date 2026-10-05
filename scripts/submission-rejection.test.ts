/**
 * [INPUT]: 依赖拒收控制器、共享固定 Git 夹具与 CAS/关闭事件的离线状态机
 * [OUTPUT]: 验证明确不匹配才关闭、fork/共享/保护分支保留、版本竞争与未知写入恢复
 * [POS]: scripts 的负向生命周期验收；不关闭真实 PR 或删除真实分支
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { harness, SOURCE, PREFIX, BOT, REPOSITORY_ID, deepReview, type Comment } from './submission-intake-fixtures.ts'
import { processIntake, recentClosedTargets } from './submission-intake.ts'
import { REPOSITORY } from './submission-review.ts'
import type { BranchDeletion } from './github-ref-cleanup.ts'

function rejectedFixture(fork = false) {
  const h = harness(); h.contributor()
  if (!fork) h.state.pr!.head.repo = { id: REPOSITORY_ID, full_name: REPOSITORY }
  h.setReport([{ ...deepReview(), status: 'drop', reason: 'unrelated-evidence' }])
  h.state.comments = h.state.comments.slice(0, 1)
  h.state.ref = h.state.pr!.head.sha
  const state = { protected: false, siblings: [] as any[], events: [] as any[], deletes: [] as BranchDeletion[],
    failComment: false, failClose: false, failDelete: false, raceClose: false, raceDelete: false,
    failedEnumeration: false, afterReceipt: undefined as (() => void) | undefined }
  const refPath = `${PREFIX}/git/ref/heads/${h.state.pr!.head.ref}`
  const api = h.options.api, write = h.options.write
  h.options.api = async (path, request) => {
    if (path === PREFIX) return { id: REPOSITORY_ID, node_id: 'R_current', full_name: REPOSITORY, default_branch: 'main' }
    if (path.startsWith(`${PREFIX}/branches/`)) return { name: h.state.pr!.head.ref, protected: state.protected, commit: { sha: h.state.ref } }
    if (path.startsWith(`${PREFIX}/issues/${h.state.pr!.number}/events?`)) return structuredClone(state.events)
    if (path.startsWith(`${PREFIX}/pulls?state=open`)) {
      if (state.failedEnumeration) throw new Error('github-http-503')
      return [...(h.state.pr!.state === 'open' ? [structuredClone(h.state.pr!)] : []), ...state.siblings]
    }
    if (path === refPath) {
      if (!h.state.ref) throw new Error('github-http-404')
      return { ref: `refs/heads/${h.state.pr!.head.ref}`, object: { type: 'commit', sha: h.state.ref } }
    }
    return api(path, request)
  }
  h.options.write = async (path, method, body) => {
    if (method === 'PATCH' && path === `${PREFIX}/pulls/${h.state.pr!.number}` && body.state === 'closed') {
      h.state.writes.push({ path, method, body })
      if (state.raceClose) { h.state.pr!.head.sha = 'd'.repeat(40); h.state.ref = h.state.pr!.head.sha }
      h.state.pr!.state = h.state.issue.state = 'closed'
      state.events.push({ event: 'closed', actor: { ...BOT }, created_at: '2026-10-04T10:06:00Z' })
      if (state.failClose) { state.failClose = false; throw new Error('github-write-outcome-unknown') }
      return structuredClone(h.state.pr)
    }
    if (method === 'POST' && path.endsWith('/comments')) {
      const result = await write(path, method, body)
      state.afterReceipt?.(); state.afterReceipt = undefined
      if (state.failComment) { state.failComment = false; throw new Error('github-write-outcome-unknown') }
      return result
    }
    return write(path, method, body)
  }
  const options = { ...h.options, deleteBranch: async (input: BranchDeletion) => {
    state.deletes.push(input)
    if (state.raceDelete) h.state.ref = 'd'.repeat(40)
    if (input.beforeOid !== h.state.ref) throw new Error('github-ref-delete-unconfirmed')
    h.state.ref = undefined
    if (state.failDelete) { state.failDelete = false; throw new Error('github-write-outcome-unknown') }
  } }
  return { h, state, options, process: () => processIntake(options, h.state.issue.number),
    receipt: () => h.state.comments.filter((c) => c.body.startsWith('<!-- awesome-jev-rejection:v1 -->')) }
}

test('current whole-project unrelated catalog PR closes before same-repo expected-SHA deletion', async () => {
  const f = rejectedFixture(), oldReport = structuredClone(f.h.state.comments[0]), head = f.h.state.pr!.head.sha
  assert.equal(await f.process(), 'rejected-and-cleaned')
  assert.equal(f.h.state.pr!.state, 'closed'); assert.equal(f.h.state.pr!.merged, false)
  assert.deepEqual(f.state.deletes, [{ repositoryId: 'R_current', ref: 'refs/heads/contributor-branch', beforeOid: head }])
  assert.equal(f.h.state.ref, undefined)
  assert.equal(f.receipt().length, 1); assert.deepEqual(f.h.state.comments[0], oldReport)
  assert.equal(await f.process(), 'rejected-and-cleaned')
  assert.equal(f.state.deletes.length, 1)
})

test('fork head is never deleted; default/protected/shared/newer ref branches are retained', async () => {
  const fork = rejectedFixture(true)
  assert.equal(await fork.process(), 'rejected-fork-branch-retained'); assert.equal(fork.state.deletes.length, 0)
  for (const mutate of [
    (f: ReturnType<typeof rejectedFixture>) => { f.h.state.pr!.head.ref = 'main' },
    (f: ReturnType<typeof rejectedFixture>) => { f.state.protected = true },
    (f: ReturnType<typeof rejectedFixture>) => { f.state.siblings = [{ number: 92, head: structuredClone(f.h.state.pr!.head), base: f.h.state.pr!.base }] },
    (f: ReturnType<typeof rejectedFixture>) => { f.state.siblings = [{ number: 92, head: { ref: 'other', repo: { id: 42 } }, base: { ref: f.h.state.pr!.head.ref, repo: { id: 42 } } }] },
    (f: ReturnType<typeof rejectedFixture>) => { f.state.failedEnumeration = true },
  ]) {
    const f = rejectedFixture(); mutate(f)
    await f.process().catch(() => {})
    assert.equal(f.state.deletes.length, 0)
    assert.ok(f.h.state.ref)
  }
})

test('unrelated verdict cannot close a code PR, edited old catalog row, draft or stale source', async () => {
  for (const mutate of [
    (f: ReturnType<typeof rejectedFixture>) => { f.h.rewrite((files) => { files['src/product.ts'] = 'new work' }); f.h.setReport([{ ...deepReview(), status: 'drop', reason: 'unrelated-evidence' }]) },
    (f: ReturnType<typeof rejectedFixture>) => { f.h.rewrite((files) => { const rows = JSON.parse(files['data/github.json']!); rows[0].summary = 'Human edit'; files['data/github.json'] = JSON.stringify(rows) }); f.h.setReport([{ ...deepReview(), status: 'drop', reason: 'unrelated-evidence' }]) },
    (f: ReturnType<typeof rejectedFixture>) => { f.h.state.pr!.draft = true },
    (f: ReturnType<typeof rejectedFixture>) => { f.h.state.sourceHead = 'b'.repeat(40) },
    (f: ReturnType<typeof rejectedFixture>) => { f.h.state.pr!.base.ref = 'release' },
  ]) {
    const f = rejectedFixture(); mutate(f)
    await f.process().catch(() => {})
    assert.equal(f.h.state.pr!.state, 'open'); assert.equal(f.state.deletes.length, 0)
  }
})

test('receipt/comment, close and deletion unknown outcomes recover without duplicate mutation', async () => {
  for (const fault of ['failComment', 'failClose', 'failDelete'] as const) {
    const f = rejectedFixture(); f.state[fault] = true
    await f.process().catch(() => {})
    assert.equal(await f.process(), 'rejected-and-cleaned', fault)
    assert.equal(f.receipt().length, 1)
    assert.equal(f.h.state.writes.filter((w) => w.path.endsWith(`/pulls/${f.h.state.pr!.number}`) && w.body.state === 'closed').length, 1)
    assert.equal(f.state.deletes.length, 1)
  }
})

test('changed head after intent or close, and CAS race never delete newly pushed work', async () => {
  const intent = rejectedFixture()
  intent.state.afterReceipt = () => { intent.h.state.pr!.head.sha = 'd'.repeat(40); intent.h.state.ref = intent.h.state.pr!.head.sha }
  await intent.process().catch(() => {})
  assert.equal(intent.h.state.pr!.state, 'open'); assert.equal(intent.state.deletes.length, 0)
  const closed = rejectedFixture(); closed.state.raceClose = true
  await closed.process().catch(() => {})
  assert.equal(closed.state.deletes.length, 0); assert.equal(closed.h.state.ref, 'd'.repeat(40))
  const cas = rejectedFixture(); cas.state.raceDelete = true
  await cas.process().catch(() => {})
  assert.equal(cas.h.state.ref, 'd'.repeat(40)); assert.equal(cas.state.deletes[0]!.beforeOid === 'd'.repeat(40), false)
})

test('a pre-close intent is not permission to delete a branch after a human closes the PR', async () => {
  const f = rejectedFixture(); f.state.afterReceipt = () => {
    f.h.state.pr!.state = f.h.state.issue.state = 'closed'
    f.state.events.push({ event: 'closed', actor: { login: 'maintainer', type: 'User' }, created_at: '2026-10-04T10:06:00Z' })
  }
  await f.process().catch(() => {})
  await f.process().catch(() => {})
  assert.equal(f.state.deletes.length, 0)
})

test('closed recovery includes recent unmerged PR navigation without giving it rejection authority', () => {
  const now = new Date('2026-10-05T00:00:00Z').getTime()
  assert.deepEqual(recentClosedTargets([
    { number: 8, merged_at: null, updated_at: '2026-10-04T23:00:00Z' },
    { number: 9, merged_at: '2026-10-04T12:00:00Z', updated_at: '2026-10-04T12:00:00Z' },
    { number: 10, merged_at: null, updated_at: '2026-10-01T00:00:00Z' },
  ], now), [8, 9])
})
