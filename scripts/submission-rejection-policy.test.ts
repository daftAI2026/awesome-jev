/**
 * [INPUT]: 依赖与准入共享的真实报告绑定及离线审查样本
 * [OUTPUT]: 验证只有完整最终不匹配结果可以拒收，混合/过期/不确定状态均不误关
 * [POS]: scripts 的负向纯政策回归，与通过流程复用同一报告真实性契约
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { submissionRejections } from './submission-intake-policy.ts'
import { harness, SOURCE, deepReview } from './submission-intake-fixtures.ts'
import { reviewMeta, renderReport, submissionFingerprint, reportLanguage } from './submission-review.ts'
import type { SubmissionResult } from './submission-review.ts'

const drop = (): SubmissionResult => ({ ...deepReview(), status: 'drop', reason: 'unrelated-evidence' })
function setup(results: SubmissionResult[] = [drop()]) {
  const h = harness(); h.setReport(results)
  const comments = h.state.comments.slice(0, 1), meta = reviewMeta(comments[0]!)!
  const input = { keys: results.map((r) => r.repo), version: meta.inputVersion! }, known = new Set<string>()
  meta.fingerprint = submissionFingerprint(input, known, reportLanguage(h.state.issue))
  comments[0]!.body = renderReport(meta, results)
  return { h, comments, input, known, call: () => submissionRejections(h.state.issue, input, comments, known) }
}

test('complete all-candidate whole-project unrelated verdict yields pinned rejections', () => {
  const f = setup()
  assert.deepEqual(f.call()?.map((r) => [r.repo, r.sha, r.reviewCommentId]), [['test/new', SOURCE, 11]])
  const many = setup([drop(), { ...drop(), repo: 'test/second', evidence: `https://github.com/test/second/tree/${SOURCE}`,
    evidenceLinks: [`https://github.com/test/second/blob/${SOURCE}/README.md`] }])
  assert.equal(many.call()?.length, 2)
})

test('no shallow drop, mixed verdict, partial scan, failure, conflicting or injected result auto-rejects', () => {
  for (const change of [{ status: 'review' }, { status: 'keep' }, { status: 'pending' }, { status: 'error' },
    { status: 'included' }, { deep: false }, { deep: undefined }, { reason: 'incomplete-evidence' },
    { reason: 'conflicting-evidence' }, { reason: 'instruction-like-evidence' }, { reason: undefined },
    { progress: { ...deepReview().progress!, checked: 77 } }, { progress: { ...deepReview().progress!, blocked: 1 } },
    { score: { jevAbout: 0.99, jevKeep: 'keep', jevKeepConfidence: 0.99 } },
    { evidence: 'https://github.com/test/new/tree/main' }]) {
    assert.equal(setup([{ ...drop(), ...change } as any]).call(), null, JSON.stringify(change))
  }
  const mixed = setup([drop(), { ...deepReview(), repo: 'test/second' }])
  assert.equal(mixed.call(), null)
})

test('rejection shares positive report freshness, identity, complete membership and finished flags', () => {
  for (const mutate of [
    (f: ReturnType<typeof setup>) => { f.input.version = 'd'.repeat(64) },
    (f: ReturnType<typeof setup>) => { f.known.add('test/new') },
    (f: ReturnType<typeof setup>) => { f.comments[0]!.user.login = 'visitor' },
    (f: ReturnType<typeof setup>) => { f.comments.push({ ...f.comments[0]!, body: '<!-- awesome-jev-submission-review:v1 --> broken' }) },
    (f: ReturnType<typeof setup>) => { const m = reviewMeta(f.comments[0]!)!; m.pending = true; f.comments[0]!.body = renderReport(m, m.completed!) },
    (f: ReturnType<typeof setup>) => { const m = reviewMeta(f.comments[0]!)!; m.retryable = true; f.comments[0]!.body = renderReport(m, m.completed!) },
    (f: ReturnType<typeof setup>) => { f.input.keys.push('test/missing') },
  ]) {
    const f = setup(); mutate(f); assert.equal(f.call(), null)
  }
})
