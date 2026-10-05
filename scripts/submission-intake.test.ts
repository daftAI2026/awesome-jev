/**
 * [INPUT]: 依赖公开收录控制器、真实目录生成器与 GitHub REST 形状的离线状态机
 * [OUTPUT]: 验证 Issue 到 PR/CI/合并/关闭、批准失效、篡改拒绝及交接/写入中断后的恢复
 * [POS]: scripts 的条件收录集成测试；读写替身保留 Git 对象不可变性，不调用模型或执行外部代码
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { repoKey } from './catalog.ts'
import { verifiedRun, parseIntakeMeta } from './submission-intake.ts'
import type { DirectoryItem } from './model-types.ts'
import { harness, PREFIX, BOT, BRANCH, ISSUE_NUMBER, PR_NUMBER, MAIN, SOURCE, SOURCE_ID, REPOSITORY_ID,
  WORKFLOW_ID, STEPS, original, score, initialKeep, sha, catalogFiles, successCI, type Pull, type Run, type Job,
} from './submission-intake-fixtures.ts'

type Harness = ReturnType<typeof harness>
const writesTo = (h: Harness, suffix: string) => h.state.writes.filter((call) => call.path === `${PREFIX}${suffix}`)
const noMergeOrClose = (h: Harness) => {
  assert.equal(writesTo(h, `/pulls/${PR_NUMBER}/merge`).length, 0)
  assert.equal(writesTo(h, `/issues/${ISSUE_NUMBER}`).length, 0)
}

test('approved complete Issue creates one data PR, waits for exact CI, then merges and closes without Jev or budget edits', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => assert.fail('Intake must not call Jev or any unmocked network endpoint'))
  const h = harness(), budget = structuredClone(h.state.comments[0])
  assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
  assert.equal(writesTo(h, '/pulls').length, 1)
  assert.deepEqual(h.state.dispatches, [BRANCH])
  noMergeOrClose(h)
  assert.deepEqual(h.rows()[0], original)
  const addition = h.rows()[1]!
  assert.equal(addition.category, 'alternatives')
  assert.equal(addition.sourceMeta.githubIdentity?.databaseId, SOURCE_ID)
  assert.equal(addition.sourceMeta.jevAbout, undefined)
  assert.equal(addition.sourceMeta.jevKeep, undefined)
  assert.equal(addition.sourceMeta.jevEvidence && (addition.sourceMeta.jevEvidence as Record<string, unknown>).status, 'review')
  assert.equal(parseIntakeMeta(h.state.pr!.body)?.approvals[0]?.approvedBy, 'maintainer')
  const head = h.state.pr!.head.sha
  h.ready()
  assert.equal(await h.process(), 'merged-and-closed')
  assert.equal(writesTo(h, `/pulls/${PR_NUMBER}/merge`)[0]?.body.sha, head)
  assert.deepEqual(h.state.dispatches, [BRANCH, 'main'])
  assert.equal(h.state.issue.state, 'closed')
  assert.equal(h.state.comments.length, 3)
  assert.match(h.state.comments.at(-1)!.body, /@submitter/)
  assert.deepEqual(h.state.comments[0], budget)
  assert.ok(h.state.writes.every((call) => !call.path.includes('/issues/comments/11')))
  assert.equal(await h.process(), 'not-open')
  assert.equal(writesTo(h, `/pulls/${PR_NUMBER}/merge`).length, 1)
})

test('no command or revoked maintainer permission cannot approve a complete needs-review Issue', async () => {
  for (const configure of [(h: Harness) => { h.state.comments.pop() }, (h: Harness) => { h.state.permission = 'read' },
    (h: Harness) => { h.state.comments[1]!.body = 'OK 可以收录' },
    (h: Harness) => { h.state.comments[1]!.created_at = '2026-10-04T09:59:00Z' }]) {
    const h = harness()
    configure(h)
    assert.equal(await h.process(), 'awaiting-approval')
    assert.equal(h.state.writes.length, 0)
  }
  const h = harness()
  await h.process()
  h.ready()
  h.state.permission = 'read'
  assert.equal(await h.process(), 'awaiting-approval')
  noMergeOrClose(h)
})

test('fresh consent after CI refuses permission, command, report, body and source HEAD changes', async () => {
  const mutations: Array<{ name: string; mutate: (h: Harness) => void }> = [
    { name: 'permission revoked', mutate: (h) => { h.state.permission = 'read' } },
    { name: 'approval changed', mutate: (h) => { h.state.comments[1]!.body = '/jev include sdk' } },
    { name: 'approval edited', mutate: (h) => { h.state.comments[1]!.updated_at = '2026-10-04T10:04:00Z' } },
    { name: 'report edited', mutate: (h) => { h.state.comments[0]!.body += '\nChanged report text.' } },
    { name: 'new report after old command', mutate: (h) => { h.state.comments[0]!.updated_at = '2026-10-04T10:03:00Z' } },
    { name: 'Issue body changed', mutate: (h) => { h.state.issue.body += '\nChanged eligibility claim.' } },
    { name: 'Issue withdrawn', mutate: (h) => { h.state.issue.state = 'closed' } },
    { name: 'source HEAD changed', mutate: (h) => { h.state.sourceHead = 'b'.repeat(40) } },
  ]
  for (const { name, mutate } of mutations) {
    const h = harness()
    await h.process()
    h.ready()
    h.state.afterJobs = () => mutate(h)
    if (name === 'source HEAD changed') await assert.rejects(h.process(), /intake-source-changed/)
    else assert.equal(await h.process(), 'approval-changed', name)
    noMergeOrClose(h)
  }
})

test('a source repository move, missing alternative license or duplicate numeric identity fails before PR creation', async () => {
  for (const [mutate, error] of [
    [(h: Harness) => { h.state.sourceHead = 'b'.repeat(40) }, /intake-source-changed/],
    [(h: Harness) => { h.state.source.license = { spdx_id: 'NOASSERTION' } }, /intake-missing-license/],
    [(h: Harness) => { h.state.source.id = 41 }, /intake-already-listed/],
    [(h: Harness) => { h.state.source.private = true }, /Ineligible repository/],
  ] as const) {
    const h = harness()
    mutate(h)
    await assert.rejects(h.process(), error)
    assert.equal(h.state.writes.length, 0)
  }
})

test('PR code or workflow files cannot be sanitized away by intake regeneration', async () => {
  for (const path of ['src/App.tsx', '.github/workflows/radar.yml', 'package.json', 'data/news.json']) {
    const h = harness()
    await h.process()
    h.rewrite((files) => { files[path] = 'untrusted change' })
    h.ready()
    const before = h.state.writes.length
    await assert.rejects(h.process(), /submission-intake-unexpected-files/)
    assert.equal(h.state.writes.length, before, path)
    noMergeOrClose(h)
  }
})

test('PR additions cannot fabricate machine scores, alter the receipt or change old editorial rows', async () => {
  const mutations: Array<(rows: DirectoryItem[]) => void> = [
    (rows) => { Object.assign(rows[1]!.sourceMeta, { jevAbout: 0.99, jevKeep: 'keep', jevKeepConfidence: 0.99 }) },
    (rows) => { (rows[1]!.sourceMeta.jevEvidence as Record<string, unknown>).status = 'keep' },
    (rows) => { (rows[1]!.sourceMeta.jevEvidence as Record<string, unknown>).sha = 'b'.repeat(40) },
    (rows) => { rows[1]!.sourceMeta.githubIdentity!.nodeId = 'R_forged'; rows[1]!.sourceMeta.stars = Number.MAX_SAFE_INTEGER },
    (rows) => { rows[1]!.id = 'manually-invented-id' },
    (rows) => { rows[0]!.summary = 'Overwrite concurrent human data.' },
  ]
  for (const mutate of mutations) {
    const h = harness()
    await h.process()
    h.rewrite((files) => {
      const rows = JSON.parse(files['data/github.json']) as DirectoryItem[]
      mutate(rows)
      Object.assign(files, catalogFiles(rows))
    })
    h.ready()
    await assert.rejects(h.process(), /intake-review-receipt-changed|intake-identity-mismatch|intake-id-changed|submission-intake-not-append-only/)
    noMergeOrClose(h)
  }
})

test('real-shaped Actions responses with no verify job, wrong attempt or skipped step cannot merge', async () => {
  const mutations: Array<(run: Run, jobs: Job[]) => void> = [
    (_run, jobs) => { jobs.length = 0 },
    (run) => { run.run_attempt = 2 },
    (_run, jobs) => { jobs[0]!.name = 'scan' },
    (_run, jobs) => { jobs[0]!.conclusion = 'skipped' },
    (_run, jobs) => { jobs[0]!.steps.find((step) => step.name === STEPS[1])!.conclusion = 'skipped' },
    (run) => { run.path = '.github/workflows/fake.yml' },
    (run) => { run.workflow_id = 100 },
    (run) => { run.conclusion = 'failure' },
  ]
  for (const mutate of mutations) {
    const h = harness()
    await h.process()
    const { run, jobs } = h.ready()
    mutate(run, jobs)
    assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
    noMergeOrClose(h)
  }
  for (const key of ['runCount', 'jobCount'] as const) {
    const h = harness()
    await h.process()
    h.ready()
    h.state[key] = 101
    assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
    noMergeOrClose(h)
  }
})

test('verifiedRun checks workflow identity, exact SHA, source repository, attempt and each stable successful step', () => {
  const { run, jobs } = successCI(SOURCE)
  const verify = (r: unknown = run, j: unknown = jobs) => verifiedRun(r, WORKFLOW_ID, REPOSITORY_ID, SOURCE, BRANCH, j)
  assert.equal(verify(), true)
  for (const change of [{ workflow_id: 100 }, { path: '.github/workflows/evil.yml' }, { event: 'push' }, { head_sha: MAIN },
    { head_branch: 'main' }, { head_repository: { id: 7 } }, { status: 'in_progress' }, { conclusion: 'failure' }, { run_attempt: 0 }]) {
    assert.equal(verify({ ...run, ...change }), false)
  }
  for (const change of [{ run_attempt: 2 }, { status: 'queued' }, { conclusion: 'skipped' }, { name: 'validate' }, { steps: [] }]) {
    assert.equal(verify(run, [{ ...jobs[0], ...change }]), false)
  }
  assert.equal(verify(run, []), false)
  assert.equal(verify(run, [jobs[0], jobs[0]]), false)
  for (const name of STEPS) {
    for (const conclusion of ['skipped', 'failure', null]) {
      const altered = structuredClone(jobs)
      altered[0]!.steps.find((step) => step.name === name)!.conclusion = conclusion
      assert.equal(verify(run, altered), false)
    }
    const altered = structuredClone(jobs)
    altered[0]!.steps.push({ ...altered[0]!.steps.find((step) => step.name === name)! })
    assert.equal(verify(run, altered), false)
  }
  const fork = successCI(SOURCE, 'contributor-branch', 'pull_request', 52, PR_NUMBER)
  assert.equal(verifiedRun(fork.run, WORKFLOW_ID, 52, SOURCE, 'contributor-branch', fork.jobs, PR_NUMBER), true)
  assert.equal(verifiedRun({ ...fork.run, pull_requests: [] }, WORKFLOW_ID, 52, SOURCE, 'contributor-branch', fork.jobs, PR_NUMBER), true)
  assert.equal(verifiedRun({ ...fork.run, pull_requests: [{ number: 2 }] }, WORKFLOW_ID, 52, SOURCE, 'contributor-branch', fork.jobs, PR_NUMBER), false)
  assert.equal(verifiedRun({ ...fork.run, event: 'workflow_dispatch' }, WORKFLOW_ID, 52, SOURCE, 'contributor-branch', fork.jobs, PR_NUMBER), false)
})

test('latest failed rerun cannot fall back to an older successful run at the same head', async () => {
  const h = harness()
  await h.process()
  const { run, jobs } = h.ready()
  const failed: Run = { ...structuredClone(run), id: 502, run_attempt: 2, conclusion: 'failure' }
  h.state.runs = [run, failed]
  h.state.jobs.set(failed.id, [{ ...structuredClone(jobs[0]!), run_id: failed.id, run_attempt: 2, conclusion: 'failure' }])
  assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
  noMergeOrClose(h)
})

test('updated ref plus failed PR body patch recovers by proving exact generated data and preserves latest main', async () => {
  const h = harness()
  await h.process()
  const priorBody = h.state.pr!.body, priorHead = h.state.pr!.head.sha
  const concurrentRows = h.advanceMain(), currentMain = h.state.main
  h.state.failBodyPatch = 1
  await assert.rejects(h.process(), /github-write-outcome-unknown/)
  assert.notEqual(h.state.pr!.head.sha, priorHead)
  assert.equal(h.state.pr!.body, priorBody)
  assert.equal(parseIntakeMeta(h.state.pr!.body)?.baseSha, MAIN)
  assert.deepEqual(h.rows().slice(0, concurrentRows.length), concurrentRows)
  noMergeOrClose(h)
  const recoveredHead = h.state.pr!.head.sha
  h.ready()
  assert.equal(await h.process(), 'merged-and-closed')
  assert.equal(parseIntakeMeta(h.state.pr!.body)?.baseSha, currentMain)
  assert.equal(writesTo(h, `/git/refs/heads/${BRANCH}`).length, 1)
  assert.equal(writesTo(h, `/pulls/${PR_NUMBER}/merge`)[0]!.body.sha, recoveredHead)
  assert.deepEqual(h.rows(h.state.main).slice(0, concurrentRows.length), concurrentRows)
})

test('an orphan ref after uncertain PR creation is reused only when its entire generated contents match', async () => {
  const h = harness()
  h.state.failPrCreate = 1
  await assert.rejects(h.process(), /github-write-outcome-unknown/)
  assert.ok(h.state.ref)
  assert.equal(h.state.pr, undefined)
  const orphan = h.state.ref
  assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
  assert.equal(h.state.pr!.head.sha, orphan)
  assert.equal(writesTo(h, '/git/refs').length, 1)
  h.ready()
  assert.equal(await h.process(), 'merged-and-closed')
})

test('code-only main advancement regenerates an ancestry-preserving head and requires new CI despite identical data assets', async () => {
  const h = harness()
  await h.process()
  h.ready()
  const priorHead = h.state.pr!.head.sha, latestMain = h.advanceCode()
  assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
  assert.notEqual(h.state.pr!.head.sha, priorHead)
  assert.equal(parseIntakeMeta(h.state.pr!.body)?.baseSha, latestMain)
  assert.equal(h.commits.get(h.state.pr!.head.sha)!['src/trusted-main.ts'], h.commits.get(latestMain)!['src/trusted-main.ts'])
  assert.deepEqual(h.rows()[0], original)
  noMergeOrClose(h)
  h.ready()
  assert.equal(await h.process(), 'merged-and-closed')
  assert.equal(h.commits.get(h.state.main)!['src/trusted-main.ts'], 'export const trustedMain = true\n')
})

for (const failure of ['failMainDispatch', 'failClose'] as const) {
  test(`a successful merge followed by ${failure} resumes without a duplicate merge/comment`, async () => {
    const h = harness(), budget = structuredClone(h.state.comments[0])
    await h.process()
    h.ready()
    h.state[failure] = 1
    await assert.rejects(h.process(), /github-write-outcome-unknown/)
    assert.equal(h.state.pr!.merged, true)
    assert.equal(h.state.issue.state, 'open')
    assert.equal(await h.process(), 'merged-and-closed', failure)
    assert.equal(h.state.issue.state, 'closed')
    assert.equal(writesTo(h, `/pulls/${PR_NUMBER}/merge`).length, 1)
    assert.equal(writesTo(h, `/issues/${ISSUE_NUMBER}/comments`).length, 1)
    assert.ok(h.state.dispatches.includes('main'), 'Recovery must not silently omit the post-merge main validation')
    assert.deepEqual(h.state.comments[0], budget)
  })
}

test('main advancement or a changed PR head during CI never merges stale validated content', async () => {
  for (const change of ['main', 'head', 'draft'] as const) {
    const h = harness()
    await h.process()
    h.ready()
    h.state.afterJobs = () => {
      if (change === 'main') h.advanceMain()
      else if (change === 'head') h.rewrite((files) => { files['src/new.ts'] = 'late untrusted code' })
      else h.state.pr!.draft = true
    }
    assert.equal(await h.process(), change === 'main' ? 'main-advanced-retry' : 'pr-not-mergeable')
    noMergeOrClose(h)
  }
})

test('known included plus one new automatic keep closes only after all source Issue candidates exist at the merge commit', async () => {
  const h = harness()
  h.state.issue.body = 'https://github.com/test/old\nhttps://github.com/test/new'
  h.setReport([{ repo: 'test/old', status: 'included' }, initialKeep()])
  h.state.comments.pop()
  const budget = structuredClone(h.state.comments[0])
  assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
  const meta = parseIntakeMeta(h.state.pr!.body)!
  assert.deepEqual(meta.approvals.map((approval) => approval.repo), ['test/new'])
  const addition = h.rows()[1]!
  assert.equal(addition.category, 'sdk')
  assert.equal(addition.sourceMeta.jevAbout, score.jevAbout)
  assert.equal(addition.sourceMeta.jevKeepConfidence, score.jevKeepConfidence)
  h.ready()
  assert.equal(await h.process(), 'merged-and-closed')
  assert.deepEqual(h.rows(h.state.main).map((row) => repoKey(row.url)), ['test/old', 'test/new'])
  assert.deepEqual(h.state.comments[0], budget)
})

test('a direct contributor PR consumes exact fork pull_request CI and never dispatches validation on the fork head', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => assert.fail('Contributor intake may not execute third-party code or call Jev'))
  const h = harness()
  h.contributor()
  const budget = structuredClone(h.state.comments[0])
  assert.equal(await h.process(), 'awaiting-exact-ci')
  assert.equal(h.state.writes.length, 0)
  const { run } = h.ready()
  assert.equal(run.event, 'pull_request')
  assert.equal(run.head_repository.id, 52)
  assert.deepEqual(run.pull_requests, [{ number: ISSUE_NUMBER }])
  run.pull_requests = []
  const head = h.state.pr!.head.sha
  assert.equal(await h.process(), 'merged-catalog-pr')
  assert.equal(writesTo(h, `/pulls/${ISSUE_NUMBER}/merge`)[0]!.body.sha, head)
  assert.deepEqual(h.state.dispatches, ['main'])
  assert.equal(writesTo(h, `/issues/${ISSUE_NUMBER}`).length, 0)
  assert.deepEqual(h.state.comments[0], budget)
})

test('a direct contributor PR rechecks the source commit after CI and rejects a changed source HEAD', async () => {
  const h = harness()
  h.contributor()
  h.ready()
  h.state.afterJobs = () => { h.state.sourceHead = 'b'.repeat(40) }
  await assert.rejects(h.process(), /intake-source-changed/)
  assert.equal(writesTo(h, `/pulls/${ISSUE_NUMBER}/merge`).length, 0)
  assert.equal(writesTo(h, `/issues/${ISSUE_NUMBER}`).length, 0)
  assert.equal(h.state.writes.length, 0)
})

test('an unprivileged later include command never replaces or cancels the earlier valid maintainer consent', async () => {
  const h = harness()
  await h.process()
  h.state.comments.push({ id: 24, body: '/jev include alternatives', created_at: '2026-10-04T10:02:00Z',
    updated_at: '2026-10-04T10:02:00Z', user: { login: 'visitor', type: 'User' } })
  h.ready()
  assert.equal(await h.process(), 'merged-and-closed')
  assert.equal(parseIntakeMeta(h.state.pr!.body)?.approvals[0]?.approvalCommentId, 23)
  assert.equal(parseIntakeMeta(h.state.pr!.body)?.approvals[0]?.approvedBy, 'maintainer')
})

test('post-merge validation ignores sync/skipped or wrong-origin main runs and reuses only the exact validate dispatch', async () => {
  for (const change of [{ display_title: 'Jev sync: main' }, { workflow_id: 100 }, { path: '.github/workflows/unrelated.yml' },
    { head_repository: { id: 52, full_name: 'contributor/awesome-jev' } }, {}]) {
    const h = harness()
    await h.process()
    h.ready()
    const head = sha([h.state.main, h.state.pr!.head.sha, 'squash'])
    const { run, jobs } = successCI(head, 'main')
    Object.assign(run, { id: 801, ...change })
    if (Object.keys(change).length) jobs[0]!.conclusion = 'skipped'
    h.state.runs.push(run)
    h.state.jobs.set(run.id, jobs)
    assert.equal(await h.process(), 'merged-and-closed')
    assert.equal(h.state.dispatches.filter((ref) => ref === 'main').length, Object.keys(change).length ? 1 : 0)
  }
})

test('contributor CI with a wrong PR association or a late non-main retarget cannot authorize merge', async () => {
  for (const wrongAssociation of [true, false]) {
    const h = harness()
    h.contributor()
    const { run } = h.ready()
    if (wrongAssociation) run.pull_requests = [{ number: 2 }]
    else h.state.afterJobs = () => { h.state.pr!.base.ref = 'release' }
    assert.equal(await h.process(), wrongAssociation ? 'awaiting-exact-ci' : 'pr-not-mergeable')
    assert.equal(h.state.writes.length, 0)
  }
  const h = harness()
  h.state.issue.title = 'A project request without a submission prefix'
  h.setReport()
  await h.process()
  h.ready()
  h.state.afterJobs = () => { h.state.issue.labels = [] }
  assert.equal(await h.process(), 'approval-changed')
  noMergeOrClose(h)
})

test('a genuine contributor review and CI cannot authorize forged previous repository redirects', async () => {
  const h = harness()
  h.contributor()
  h.rewrite((files) => {
    const rows = JSON.parse(files['data/github.json']) as DirectoryItem[]
    rows[1]!.sourceMeta.previousUrls = ['https://github.com/someone/innocent']
    Object.assign(files, catalogFiles(rows))
  })
  h.setReport()
  h.ready()
  await assert.rejects(h.process(), /intake-review-receipt-changed/)
  assert.equal(h.state.writes.length, 0)
})

test('a closed merged native contributor PR resumes an uncertain main dispatch without another merge', async () => {
  const h = harness()
  h.contributor()
  h.ready()
  h.state.failMainDispatch = 1
  await assert.rejects(h.process(), /github-write-outcome-unknown/)
  assert.equal(h.state.issue.state, 'closed')
  assert.equal(h.state.pr!.merged, true)
  assert.equal(await h.process(), 'recovered-main-validation')
  assert.equal(writesTo(h, `/pulls/${ISSUE_NUMBER}/merge`).length, 1)
  assert.deepEqual(h.state.dispatches, ['main'])
  await h.process()
  assert.deepEqual(h.state.dispatches, ['main'])
})

test('closed native recovery trusts only an actual bot merge into this repository main', async () => {
  for (const change of [(pr: Pull) => { pr.merged_by = { login: 'maintainer', type: 'User' } },
    (pr: Pull) => { pr.merged_by = { login: BOT.login, type: 'User' } }, (pr: Pull) => { pr.base.ref = 'release' },
    (pr: Pull) => { pr.base.repo.full_name = 'contributor/awesome-jev' }, (pr: Pull) => { pr.merge_commit_sha = 'invalid' }]) {
    const h = harness()
    h.contributor()
    h.ready()
    h.state.failMainDispatch = 1
    await assert.rejects(h.process(), /github-write-outcome-unknown/)
    change(h.state.pr!)
    const attempts = h.state.writes.length
    assert.equal(await h.process(), 'not-open-catalog-pr')
    assert.equal(h.state.writes.length, attempts)
  }
})

test('an optional notification failure preserves exact successful CI for a later intake sweep', async () => {
  const h = harness()
  assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
  const { run, jobs } = h.ready()
  jobs.push({ id: 602, name: 'resume-intake', run_id: run.id, run_attempt: run.run_attempt,
    status: 'completed', conclusion: 'failure', steps: [] })
  run.status = 'in_progress'; run.conclusion = null
  assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
  noMergeOrClose(h)
  run.status = 'completed'; run.conclusion = 'success'
  assert.equal(await h.process(), 'merged-and-closed')
  assert.equal(writesTo(h, `/pulls/${PR_NUMBER}/merge`).length, 1)
})
