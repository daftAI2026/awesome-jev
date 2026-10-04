/**
 * [INPUT]: 依赖收录纯安全门、真实报告编码和规范目录的离线样本
 * [OUTPUT]: 对外提供机器人身份、授权失效、覆盖/评分、证据与仅追加写入的回归验证
 * [POS]: scripts 的自动收录信任边界测试，不执行第三方仓库或访问网络
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { PROJECT_CATEGORIES } from './jev-client.ts'
import { MARKER, REPOSITORY, reportLanguage, renderReport, reviewMeta, submissionFingerprint, type SubmissionResult } from './submission-review.ts'
import { assertIntakeFiles, intakeAdditions, intakeApprovals, parseIncludeCommand } from './submission-intake-policy.ts'
import type { DirectoryItem, JevScore } from './model-types.ts'

type Comment = Parameters<typeof intakeApprovals>[2][number]
type Input = Parameters<typeof intakeApprovals>[1]
type Issue = Parameters<typeof intakeApprovals>[0]
type Manual = NonNullable<Parameters<typeof intakeApprovals>[4]>
const sha = 'a'.repeat(40), secondSha = 'b'.repeat(40)
const input: Input = { keys: ['test/new'], version: 'c'.repeat(64) }
const issue: Issue = { title: '[Submission] Jev library', body: 'A useful TypeSafe Jev resource. https://github.com/test/new' }
const known = new Set<string>()
const score: JevScore = { jevAbout: 0.95, jevKeep: 'keep', jevKeepConfidence: 0.96, category: 'sdk' }
const complete = { inventoryComplete: true, checked: 5, total: 5, excluded: 2, blocked: 0 }
const initial = (repo = 'test/new'): SubmissionResult => ({ repo, status: 'keep', score: { ...score }, evidence: `https://github.com/${repo}/blob/${sha}/README.md` })
const deep = (repo = 'test/new'): SubmissionResult => ({ repo, status: 'keep', deep: true, progress: { ...complete },
  evidence: `https://github.com/${repo}/tree/${sha}`, evidenceLinks: [`https://github.com/${repo}/blob/${sha}/src/main.ts#L1-L9`] })
const manual: Manual = { category: 'alternatives', login: 'maintainer', commentId: 23 }

function report(results: unknown[] = [initial()], overrides: Record<string, unknown> = {}, context: { input?: Input; issue?: Issue; known?: Set<string> } = {}): Comment {
  const targetInput = context.input ?? input
  const targetIssue = context.issue ?? issue
  const targetKnown = context.known ?? known
  const meta = { version: 1, inputVersion: targetInput.version, fingerprint: submissionFingerprint(targetInput, targetKnown, reportLanguage(targetIssue)),
    at: '2026-10-04T10:00:00.000Z', day: '2026-10-04', used: 1, requests: 1, pending: false, retryable: false, completed: results, ...overrides }
  return { id: 11, user: { login: 'github-actions[bot]', type: 'Bot' },
    body: `${MARKER}\n<!-- jev-meta:${Buffer.from(JSON.stringify(meta)).toString('base64')} -->\nReview report` }
}

const approvals = (result: unknown = initial(), overrides: Record<string, unknown> = {}, authorization?: Manual) =>
  intakeApprovals(issue, input, [report([result], overrides)], known, authorization)
const row = (name: string, databaseId?: number): DirectoryItem => ({ id: `gh-${name}`, type: 'github', title: name, summary: 'A useful Jev resource',
  url: `https://github.com/test/${name}`, sourceMeta: { repo: `test/${name}`, ...(databaseId ? { githubIdentity: { databaseId, nodeId: `R_${databaseId}` } } : {}) } })

test('include commands require one exact category token, never conversational approval', () => {
  for (const category of PROJECT_CATEGORIES) assert.equal(parseIncludeCommand(`/jev include ${category}`), category)
  for (const body of [null, undefined, 42, {}, '通过', 'OK，可以收录', '@github-actions 可以了，通过', '/jev include', '/jev review',
    '/jev include sdk ', ' /jev include sdk', '/jev  include sdk', '/jev include  sdk', '/jev include SDK', '/jev include unknown',
    '/jev include sdk\n', '/jev include sdk\r\n', '/jev include sdk\n批准', '> /jev include sdk', '`/jev include sdk`', '/jev include sdk; echo stolen']) {
    assert.equal(parseIncludeCommand(body), null, String(body))
  }
})

test('genuine current initial keep uses its raw score and pinned SHA', () => {
  const comment = report()
  const meta = reviewMeta(comment)!
  comment.body = renderReport(meta, meta.completed!)
  assert.deepEqual(intakeApprovals(issue, input, [comment], known), [{ repo: 'test/new', sha, category: 'sdk', reviewCommentId: 11,
    review: initial(), checkedAt: '2026-10-04T10:00:00.000Z' }])
})

test('full deep keep without a score stays scoreless and uses other classification', () => {
  const result = approvals(deep())
  assert.ok(result)
  assert.equal(result[0]!.sha, sha)
  assert.equal(result[0]!.category, 'other')
  assert.equal(result[0]!.review.score, undefined)
  assert.deepEqual(result[0]!.review.progress, complete)
})

test('only the last genuine bot report may authorize, never a human or another bot', () => {
  for (const user of [{ login: 'attacker', type: 'User' }, { login: 'github-actions[bot]', type: 'User' },
    { login: 'some-other[bot]', type: 'Bot' }, { login: 'github-actions', type: 'Bot' }, {}]) {
    const spoof = { ...report(), user }
    assert.equal(intakeApprovals(issue, input, [spoof], known), null)
    assert.ok(intakeApprovals(issue, input, [report(), spoof], known))
  }
  assert.equal(intakeApprovals(issue, input, [{ ...report(), body: `prefix\n${report().body}` }], known), null)
  assert.equal(intakeApprovals(issue, input, [report(), { ...report(), body: `${MARKER}\n<!-- jev-meta:e30= -->` }], known), null)
  assert.equal(intakeApprovals(issue, input, [report(), report([deep()], { pending: true })], known), null)
  for (const id of [undefined, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(intakeApprovals(issue, input, [{ ...report(), id }], known), null)
  }
})

test('report requires explicit finished flags and valid canonical UTC day/timestamp', () => {
  for (const change of [{ pending: true }, { pending: undefined }, { pending: 'false' }, { retryable: true }, { retryable: undefined },
    { retryable: 0 }, { at: '2026-02-30T10:00:00.000Z', day: '2026-02-30' }, { at: '2026-10-04T10:00:00+00:00' },
    { at: '2026-10-04' }, { day: '2026-10-05' }, { day: '2026-99-04' }, { at: 42 }, { inputVersion: undefined }]) {
    assert.equal(approvals(initial(), change), null, JSON.stringify(change))
  }
  assert.ok(approvals(initial(), { at: '2026-10-04T10:00:00Z' }))
})

test('input version, known inventory, order, language and withdrawal invalidate approval', () => {
  assert.equal(approvals(initial(), { inputVersion: 'd'.repeat(64) }), null)
  assert.equal(approvals(initial(), { fingerprint: 'f'.repeat(64) }), null)
  assert.equal(intakeApprovals(issue, { ...input, version: 'd'.repeat(64) }, [report()], known), null)
  assert.equal(intakeApprovals(issue, input, [report()], new Set(input.keys)), null)
  assert.equal(intakeApprovals({ ...issue, title: '投稿项目审核', body: '这是一个可以使用的项目，提供明确的审核实现。' }, input, [report()], known), null)
  assert.equal(intakeApprovals(issue, { ...input, keys: [] }, [report()], known), null)
  for (const keys of [['test/new', 'test/new'], ['Test/New'], ['test/new?x=1'], [`${REPOSITORY.toLowerCase()}`]]) {
    assert.equal(intakeApprovals(issue, { ...input, keys }, [report()], known), null)
  }
  const many: Input = { ...input, keys: ['test/new', 'test/second'] }
  const manyReport = report([initial(), initial('test/second')], {}, { input: many })
  assert.equal(intakeApprovals(issue, { ...many, keys: [...many.keys].reverse() }, [manyReport], known), null)
})

test('each candidate must appear exactly once, with no omitted or unrelated completed entry', () => {
  for (const results of [[], [initial(), initial()], [initial('test/stranger')], [null], [42], ['test/new'],
    [{ ...initial(), repo: 'Test/New' }], [{ ...initial(), repo: undefined }]]) {
    assert.equal(intakeApprovals(issue, input, [report(results)], known), null, JSON.stringify(results))
  }
  const many: Input = { ...input, keys: ['test/new', 'test/second'] }
  for (const results of [[initial()], [initial(), initial()], [initial(), initial('test/stranger')]]) {
    assert.equal(intakeApprovals(issue, many, [report(results, {}, { input: many })], known), null)
  }
})

test('automatic batches are all-or-nothing; known included rows are skipped', () => {
  const many: Input = { ...input, keys: ['test/old', 'test/new', 'test/second'] }
  const inventory = new Set(['test/old'])
  const results: SubmissionResult[] = [{ repo: 'test/old', status: 'included' }, initial('test/new'), deep('test/second')]
  const call = (values: SubmissionResult[]) => intakeApprovals(issue, many, [report(values, {}, { input: many, known: inventory })], inventory)
  assert.deepEqual(call([...results].reverse())?.map((approval) => approval.repo), ['test/new', 'test/second'])
  for (const status of ['review', 'drop', 'error', 'pending', 'included'] as const) {
    assert.equal(call([results[0]!, results[1]!, { ...results[2]!, status }]), null)
  }
  assert.equal(call([{ ...results[0]!, status: 'keep' }, results[1]!, results[2]!]), null)
  const listed: Input = { ...input, keys: ['test/old'] }
  assert.equal(intakeApprovals(issue, listed, [report([{ repo: 'test/old', status: 'included' }], {}, { input: listed, known: inventory })], inventory), null)
})

test('keep labels cannot replace initial scores or launder altered model probabilities', () => {
  for (const changed of [undefined, null, {}, { ...score, jevAbout: 0.89 }, { ...score, jevKeepConfidence: 0.89 },
    { ...score, jevAbout: '0.99' }, { ...score, jevKeepConfidence: 1.1 }, { ...score, jevKeep: 'review' },
    { ...score, jevKeep: 'drop' }, { ...score, needsReview: true }, { ...score, needsReview: 'false' },
    { ...score, conflictingEvidence: true }, { ...score, category: 'invented' }]) {
    assert.equal(approvals({ ...initial(), score: changed }), null, JSON.stringify(changed))
    assert.equal(approvals({ ...initial(), score: changed }, {}, manual), null, JSON.stringify(changed))
  }
  assert.equal(approvals({ ...initial(), score: undefined, deep: false }), null)
  assert.equal(approvals({ ...initial(), score: undefined, deep: 'true' }), null)
  assert.equal(approvals({ ...initial(), score: { ...score, category: undefined } })?.[0]?.category, 'other')
})

test('every claimed coverage must be complete, even when a raw score is keep', () => {
  for (const progress of [undefined, null, {}, { ...complete, inventoryComplete: false }, { ...complete, inventoryComplete: 'true' },
    { ...complete, checked: 4 }, { ...complete, checked: 6 }, { ...complete, checked: 0, total: 0 },
    { ...complete, blocked: 1 }, { ...complete, blocked: '0' }, { ...complete, checked: '5' }, { ...complete, excluded: -1 },
    { ...complete, total: 5.5, checked: 5.5 }]) {
    for (const result of [{ ...deep(), progress }, { ...initial(), deep: true, progress }]) {
      assert.equal(approvals(result), null, JSON.stringify(progress))
      assert.equal(approvals(result, {}, manual), null, JSON.stringify(progress))
    }
  }
  assert.equal(approvals({ ...initial(), progress: { ...complete } }), null)
  assert.equal(approvals({ ...deep(), deep: false }), null)
})

test('manual category override permits only one new complete review or genuine keep', () => {
  const reviewed = { ...deep(), status: 'review' as const, reason: 'insufficient-usage-evidence' }
  const result = approvals(reviewed, {}, manual)
  assert.ok(result)
  assert.deepEqual(result[0], { repo: 'test/new', sha, category: 'alternatives', reviewCommentId: 11,
    approvalCommentId: 23, approvedBy: 'maintainer', review: reviewed, checkedAt: '2026-10-04T10:00:00.000Z' })
  assert.equal(approvals(initial(), {}, manual)?.[0]?.category, 'alternatives')
  assert.ok(approvals({ ...reviewed, reason: 'insufficient-provider-context' }, {}, manual))
  assert.equal(approvals({ ...initial(), status: 'review' }, {}, manual), null)
  assert.equal(approvals({ ...reviewed, score: { ...score, jevKeep: 'drop' } }, {}, manual), null)
  for (const authorization of [{ ...manual, login: 'attacker[bot]' }, { ...manual, login: '' }, { ...manual, commentId: 0 },
    { ...manual, commentId: 1.5 }, { ...manual, category: 'fake' as Manual['category'] }]) {
    assert.equal(approvals(reviewed, {}, authorization), null)
  }
  const many: Input = { ...input, keys: ['test/new', 'test/second'] }
  assert.equal(intakeApprovals(issue, many, [report([initial(), initial('test/second')], {}, { input: many })], known, manual), null)
  const inventory = new Set(input.keys)
  assert.equal(intakeApprovals(issue, input, [report([{ repo: 'test/new', status: 'included' }], {}, { known: inventory })], inventory, manual), null)
})

test('manual approval never overrides pending, rejection, incomplete coverage or dangerous reasons', () => {
  for (const status of ['pending', 'drop', 'error', 'included', 'approved']) {
    assert.equal(approvals({ ...deep(), status }, {}, manual), null)
  }
  for (const reason of ['incomplete-evidence', 'instruction-like-evidence', 'conflicting-evidence', 'unconfirmed-request', 'scan-pending',
    'submission-daily-requests', 'submission-day-changed', 'jev-http-500', 'unknown-new-reason', '', false]) {
    assert.equal(approvals({ ...deep(), status: 'review', reason }, {}, manual), null, String(reason))
    assert.equal(approvals({ ...deep(), reason }), null, String(reason))
  }
  for (const overrides of [{ pending: true }, { retryable: true }, { fingerprint: 'f'.repeat(64) }]) {
    assert.equal(approvals({ ...deep(), status: 'review' }, overrides, manual), null)
  }
})

test('primary and supporting evidence stay on the same repository and full commit', () => {
  for (const evidence of [undefined, null, 'https://github.com/test/new', `http://github.com/test/new/blob/${sha}/README.md`,
    `https://github.com/test/other/blob/${sha}/README.md`, `https://evil.test/test/new/blob/${sha}/README.md`,
    `https://github.com/test/new/blob/${sha.slice(0, 12)}/README.md`, 'https://github.com/test/new/blob/main/README.md',
    `https://github.com/test/new/tree/${sha}/src`, `https://github.com/test/new/blob/${sha}/../secret`,
    `https://github.com/test/new/blob/${sha}/%2e%2e/secret`, `https://github.com/test/new/blob/${sha}/src%2fsecret`,
    `https://github.com/test/new/blob/${sha}/README.md?raw=1`, `https://github.com/test/new/tree/${sha}#README`,
    `https://user@github.com/test/new/blob/${sha}/README.md`]) {
    assert.equal(approvals({ ...initial(), evidence }), null, String(evidence))
    assert.equal(approvals({ ...deep(), status: 'review', evidence }, {}, manual), null, String(evidence))
  }
  for (const evidenceLinks of [null, 'not-an-array', [null], [`https://github.com/test/other/blob/${sha}/README.md`],
    [`https://github.com/test/new/blob/${secondSha}/README.md`], ['https://github.com/test/new/blob/main/README.md']]) {
    assert.equal(approvals({ ...deep(), evidenceLinks }), null, JSON.stringify(evidenceLinks))
    assert.equal(approvals({ ...deep(), status: 'review', evidenceLinks }, {}, manual), null, JSON.stringify(evidenceLinks))
  }
  assert.equal(approvals({ ...initial(), evidence: `https://github.com/TEST/NEW/blob/${sha}/README.md#L1-L5` })?.[0]?.sha, sha)
  assert.ok(approvals({ ...deep(), evidence: `https://github.com/test/new/tree/${sha}/` }))
})

test('intake may touch only canonical data and the two generated assets', () => {
  assert.doesNotThrow(() => assertIntakeFiles(['data/github.json']))
  assert.doesNotThrow(() => assertIntakeFiles(['README.md', 'data/github.json', 'public/sitemap.xml']))
  for (const files of [[], ['README.md'], ['public/sitemap.xml'], ['data/github.json', 'data/github.json'],
    ['data/github.json', '.github/workflows/ci.yml'], ['data/github.json', 'src/App.tsx'], ['data/github.json', 'package.json'],
    ['data/github.json', 'data/items.json'], ['data/github.json', 'README.md/../package.json'], ['data/github.json', '/README.md']]) {
    assert.throws(() => assertIntakeFiles(files), /submission-intake-unexpected-files/, JSON.stringify(files))
  }
})

test('catalog intake appends valid new rows without changing or reordering any existing row', () => {
  const base = [row('old', 101), row('second', 102)]
  const before = structuredClone(base)
  const additions = [row('new', 103), row('fourth', 104)]
  const head = [...structuredClone(base), ...additions]
  assert.deepEqual(intakeAdditions(base, head), additions)
  assert.deepEqual(base, before)
  assert.deepEqual(head, [...before, ...additions])
  for (const change of [{ summary: 'Overwritten by automation' }, { title: 'changed' }, { tags: ['changed'] },
    { sourceMeta: { ...base[0]!.sourceMeta, stars: 200 } }, { sourceMeta: { ...base[0]!.sourceMeta, jevAbout: 0.99 } },
    { url: 'https://github.com/test/renamed', sourceMeta: { ...base[0]!.sourceMeta, repo: 'test/renamed' } }]) {
    assert.throws(() => intakeAdditions(base, [{ ...base[0]!, ...change }, base[1]!, row('new', 103)]), /submission-intake-not-append-only/)
  }
  for (const changed of [base, [base[0]!], [base[1]!, base[0]!, row('new', 103)], [row('new', 103), ...base],
    [base[0]!, row('new', 103), base[1]!]]) {
    assert.throws(() => intakeAdditions(base, changed), /submission-intake-not-append-only/)
  }
  assert.throws(() => intakeAdditions(base, [...base, { ...row('new', 103), sourceMeta: { repo: 'test/other' } }]), /Invalid repository identity/)
  assert.throws(() => intakeAdditions(base, [...base, row('renamed', 101)]), /Duplicate GitHub identity/)
  assert.throws(() => intakeAdditions(base, [...base, row('old', 105)]), /Duplicate id|Duplicate repository/)
  assert.throws(() => intakeAdditions(base, [...base, { ...row('new'), sourceMeta: { repo: 'test/new', stars: -1 } }]), /Invalid stars/)
  assert.throws(() => intakeAdditions([{ ...row('old'), summary: '' }], [row('old'), row('new')]), /Invalid DirectoryItem/)
})
