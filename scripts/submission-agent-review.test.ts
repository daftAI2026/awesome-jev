/**
 * [INPUT]: 依赖 Agent 分类收据、真实报告编码与共享离线收录状态机
 * [OUTPUT]: 验证短口令、分类与版本绑定、访客拒绝、完整复核及原有 CI/许可证门
 * [POS]: scripts 的 Agent 到维护者授权回归；只生成离线评论，不使用真实账号
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createAgentReviewComment, parseAgentReviewComment, AGENT_REVIEW_MARKER } from './submission-agent-review.ts'
import { harness, SOURCE, PR_NUMBER, ISSUE_NUMBER, initialKeep, deepReview } from './submission-intake-fixtures.ts'

const assessment = () => ({ repo: 'test/new', sha: SOURCE, category: 'alternatives' as const,
  evidence: [`https://github.com/test/new/blob/${SOURCE}/src/head.py#L1-L9`],
  summary: 'Independent typed probabilistic decisions; implementation and Apache-2.0 license checked.' })
function approve(h: ReturnType<typeof harness>) {
  h.state.comments[1]!.body = createAgentReviewComment(h.state.comments[0]!, assessment())
}

test('Agent draft is /ok plus a legal category and independent immutable review receipt', () => {
  const h = harness(), body = createAgentReviewComment(h.state.comments[0]!, assessment())
  assert.ok(body.startsWith('/ok\n'))
  const parsed = parseAgentReviewComment(body)!
  assert.equal(parsed.category, 'alternatives')
  assert.equal(parsed.decision, 'OK')
  assert.equal(parsed.reviewCommentId, 11)
  assert.equal(parsed.reviewBodySha256, createHash('sha256').update(h.state.comments[0]!.body).digest('hex'))
  assert.deepEqual(parsed.evidence, assessment().evidence)
  assert.deepEqual(parseAgentReviewComment(body.replace('/ok\n', '')), parsed)
})

test('complete Agent review under write/maintain/admin can intake; CI and real review remain mandatory', async () => {
  for (const permission of ['write', 'maintain', 'admin']) {
    const h = harness(), original = structuredClone(h.state.comments[0])
    h.state.permission = permission; approve(h)
    assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
    assert.equal(h.rows()[1]!.category, 'alternatives')
    assert.equal(h.state.pr!.merged, false)
    h.ready()
    assert.equal(await h.process(), 'merged-and-closed')
    assert.deepEqual(h.state.comments[0], original, 'Agent acceptance never rewrites Jev scores or budget')
    assert.match(h.state.pr!.body, /human approval by @maintainer/)
  }
})

test('bare /ok consumes the bound Agent category without category memorization', async () => {
  const h = harness(); approve(h)
  h.state.comments[1]!.body = h.state.comments[1]!.body.slice('/ok\n'.length)
  h.state.comments.push({ ...h.state.comments[1]!, id: 24, body: '/ok', created_at: '2026-10-04T10:02:00Z' })
  assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
  assert.equal(h.rows()[1]!.category, 'alternatives')
  const missing = harness(); missing.state.comments[1]!.body = '/ok'
  assert.equal(await missing.process(), 'awaiting-approval', 'No silent Other fallback for a missing review category')
})

test('visitor text, copied receipt and a maintainer /ok cannot launder an untrusted assessment', async () => {
  for (const permission of ['read', 'triage', 'none']) {
    const h = harness(); h.state.permission = permission; approve(h)
    assert.equal(await h.process(), 'awaiting-approval')
    assert.equal(h.state.writes.length, 0)
  }
  const h = harness(); approve(h)
  h.state.comments[1]!.body = h.state.comments[1]!.body.slice('/ok\n'.length)
  h.state.comments[1]!.user.login = 'visitor'
  h.state.comments.push({ ...h.state.comments[1]!, id: 24, user: { login: 'maintainer', type: 'User' }, body: '/ok' })
  assert.equal(await h.process(), 'awaiting-approval')
})

test('stale report edits, input/source changes, missing license and permission revocation stop acceptance', async () => {
  for (const change of [
    (h: ReturnType<typeof harness>) => { h.state.comments[0]!.body += '\nUpdated report' },
    (h: ReturnType<typeof harness>) => { h.state.issue.body += '\nNew material' },
    (h: ReturnType<typeof harness>) => { h.state.sourceHead = 'b'.repeat(40) },
    (h: ReturnType<typeof harness>) => { h.state.source.license = null },
  ]) {
    const h = harness(); approve(h); change(h)
    await h.process().catch(() => {})
    assert.equal(h.state.pr?.merged ?? false, false)
    assert.ok(!h.state.writes.some((w) => w.path.endsWith('/merge')))
  }
  const h = harness(); approve(h); await h.process(); h.ready()
  h.state.afterJobs = () => { h.state.permission = 'read' }
  assert.equal(await h.process(), 'approval-changed')
  assert.equal(h.state.pr!.merged, false)
})

test('Agent OK cannot override unfinished, injected, conflicting, failed or unrelated evidence', async () => {
  for (const change of [{ status: 'pending' }, { status: 'error' }, { status: 'drop', reason: 'unrelated-evidence' },
    { reason: 'instruction-like-evidence' }, { reason: 'conflicting-evidence' },
    { progress: { checked: 77, total: 78, excluded: 4, blocked: 0, inventoryComplete: true } }]) {
    const h = harness()
    h.setReport([{ ...deepReview(), ...change } as any])
    approve(h)
    assert.equal(await h.process(), 'awaiting-approval')
    assert.equal(h.state.writes.length, 0)
  }
})

test('receipt syntax is bounded, exact and never quoted or inferred from prose', () => {
  const h = harness(), body = createAgentReviewComment(h.state.comments[0]!, assessment())
  for (const bad of ['OK', '> ' + body, '`' + body + '`', ' ' + body, body + '\n',
    body.replace('alternatives', 'invented'), body.replace('"OK"', '"DROP"'),
    body.replace(SOURCE, 'bad'), body.replace('"category"', '"classification"'), 'x'.repeat(65001)]) {
    assert.equal(parseAgentReviewComment(bad), null)
  }
  assert.ok(body.includes(AGENT_REVIEW_MARKER))
  assert.throws(() => createAgentReviewComment(h.state.comments[0]!, { ...assessment(), category: 'invented' as any }))
})

test('native PR Agent receipt binds the current PR head, not just its candidate repository', async () => {
  const h = harness(); h.contributor(); approve(h); h.ready()
  assert.equal(await h.process(), 'merged-catalog-pr')
  assert.equal(h.state.writes.find((w) => w.path.endsWith(`/pulls/${ISSUE_NUMBER}/merge`))?.body.sha, h.state.pr!.head.sha)
  const changed = harness(); changed.contributor(); approve(changed)
  changed.rewrite((files) => { files['README.md'] += '\nNew work' })
  assert.equal(await changed.process(), 'awaiting-approval')
  assert.equal(changed.state.writes.length, 0)
})

test('automatic genuine keep and exact legacy command remain unchanged', async () => {
  const h = harness(); h.setReport([initialKeep()]); h.state.comments = h.state.comments.slice(0, 1)
  assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
  assert.equal(h.rows()[1]!.category, 'sdk')
  assert.equal(await harness().process(), `validating-pr-${PR_NUMBER}`)
})
