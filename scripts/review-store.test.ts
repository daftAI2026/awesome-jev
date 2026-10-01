/**
 * [INPUT]: 依赖 真实 review-store 与 review-checkpoint 模块
 * [OUTPUT]: 对外提供 状态持久化和可信恢复的离线回归
 * [POS]: scripts 的恢复边界测试，不调用外部服务
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test, { type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync, symlinkSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createReviewStore } from './review-store.ts'
import { latestCheckpoint } from './review-checkpoint.ts'
import type { ReviewApi, ReviewTask } from './review-types.ts'
const repo = 'daftAI2026/awesome-jev'
const task = (overrides: Partial<ReviewTask> = {}): ReviewTask => ({
  policy: 'whole-project-v1', context: 'test-context', repo: 'test/jev', sha: 'a'.repeat(40),
  row: { id: 'gh-4-test-jev', type: 'github', title: 'jev', summary: 'Jev', url: 'https://github.com/test/jev', sourceMeta: {} },
  initialDone: false, queue: [], files: [], inFlight: null, ...overrides,
})
function directory(t: TestContext): string { const dir = mkdtempSync(join(tmpdir(), 'jev-state-test-')); t.after(() => rmSync(dir, { recursive: true, force: true })); return dir }
test('checkpoint files survive a new store instance without Git writes', async (t) => {
  const dir = directory(t), id = 'a'.repeat(64)
  const first = createReviewStore(dir)
  assert.equal(await first.load(id), null)
  await first.save(id, task({ queue: [{ path: 'src/main.ts', sha: 'b'.repeat(40) }] }))
  assert.equal((await createReviewStore(dir).load(id))?.queue[0].path, 'src/main.ts')
  assert.ok(existsSync(join(dir, 'manifest.json')))
  await assert.rejects(first.save('../../escape', task()), /invalid-state-id/)
})
test('state rejects symlinks and malformed JSON instead of silently restarting paid work', async (t) => {
  const dir = directory(t), id = 'b'.repeat(64), store = createReviewStore(dir)
  writeFileSync(join(dir, `${id}.json`), '{broken')
  await assert.rejects(store.load(id), /invalid-state-file/)
  rmSync(join(dir, `${id}.json`))
  symlinkSync(join(dir, 'manifest.json'), join(dir, `${id}.json`))
  await assert.rejects(store.load(id), /invalid-state-file/)
})
test('old completed receipts and abandoned progress expire; recent active checkpoints survive', async (t) => {
  const dir = directory(t), now = Date.parse('2026-09-22T00:00:00Z')
  const old = new Date(now - 31 * 86400000).toISOString(), recent = new Date(now - 86400000).toISOString()
  writeFileSync(join(dir, `${'a'.repeat(64)}.json`), JSON.stringify({ result: {}, completedAt: old }))
  writeFileSync(join(dir, `${'b'.repeat(64)}.json`), JSON.stringify({ updatedAt: old }))
  writeFileSync(join(dir, `${'c'.repeat(64)}.json`), JSON.stringify({ updatedAt: recent }))
  const store = createReviewStore(dir, { now })
  assert.equal(await store.load('a'.repeat(64)), null)
  assert.equal(await store.load('b'.repeat(64)), null)
  assert.ok(await store.load('c'.repeat(64)))
})
const valid = { id: 5, workflow_id: 11, path: '.github/workflows/submission-review.yml', head_branch: 'main', head_repository: { full_name: repo }, event: 'workflow_dispatch', run_attempt: 1, status: 'completed', head_sha: 'a'.repeat(40), updated_at: '2026-10-01T10:00:00Z' }
test('checkpoint restore accepts only the fixed trusted workflow on own main, never PR artifacts', async () => {
  const calls: string[] = []
  const api: ReviewApi = async (path: string) => {
    calls.push(path)
    if (path.endsWith('submission-review.yml')) return { id: 11 }
    if (path.includes('/runs?')) return { workflow_runs: [
      { ...valid, id: 1, event: 'pull_request' }, { ...valid, id: 2, head_branch: 'attacker' },
      { ...valid, id: 3, head_repository: { full_name: 'attacker/fork' } },
      { ...valid, id: 4, workflow_id: 99 }, valid,
    ] }
    assert.ok(path.includes('/runs/5/artifacts'))
    return { artifacts: [{ id: 123, name: 'jev-review-checkpoint-5-1', expired: false, size_in_bytes: 100 }] }
  }
  const result = await latestCheckpoint(api, 20)
  assert.deepEqual(result, { runId: 5, artifactId: 123 })
  assert.equal(calls.filter((p) => p.includes('/artifacts')).length, 1)
})
test('expired or unrelated artifacts are not used as a checkpoint', async () => {
  const api: ReviewApi = async (path: string) => path.endsWith('submission-review.yml') ? { id: 11 } :
    path.includes('/runs?') ? { workflow_runs: [valid] } : { artifacts: [
      { id: 1, name: 'jev-review-checkpoint-5-1', expired: true }, { id: 2, name: 'radar-5-1', expired: false },
    ] }
  const result = await latestCheckpoint(api, 20)
  assert.equal(result, null)
})

test('radar budgets restore only radar artifacts, never the submission reviewer state', async () => {
  const api: ReviewApi = async (path) => {
    if (path.endsWith('radar.yml')) return { id: 22 }
    if (path.includes('/jobs?')) return budgetJobs(5)
    if (path.includes('/runs?')) return { workflow_runs: [valid, { ...valid, workflow_id: 22, path: '.github/workflows/radar.yml' }] }
    return { artifacts: [
      { id: 100, name: 'jev-review-checkpoint-5-1', expired: false, size_in_bytes: 100 },
      { id: 101, name: 'jev-radar-budget-5-1', expired: false, size_in_bytes: 100 },
    ] }
  }
  assert.deepEqual(await latestCheckpoint(api, 20, 'radar', recoveryOptions), { runId: 5, artifactId: 101 })
})

test('alternatives budgets restore only their own workflow artifact', async () => {
  const api: ReviewApi = async (path) => {
    if (path.endsWith('alternatives.yml')) return { id: 33 }
    if (path.includes('/jobs?')) return budgetJobs(5)
    if (path.includes('/runs?')) return { workflow_runs: [
      { ...valid, workflow_id: 22, path: '.github/workflows/radar.yml' },
      { ...valid, workflow_id: 33, path: '.github/workflows/alternatives.yml' },
    ] }
    return { artifacts: [
      { id: 101, name: 'jev-radar-budget-5-1', expired: false, size_in_bytes: 100 },
      { id: 102, name: 'jev-alternatives-budget-5-1', expired: false, size_in_bytes: 100 },
    ] }
  }
  assert.deepEqual(await latestCheckpoint(api, 20, 'alternatives', recoveryOptions), { runId: 5, artifactId: 102 })
})


const budgetRun = (id: number, attempt = 1, updated = '2026-10-01T10:00:00Z') => ({
  ...valid, id, workflow_id: 22, path: '.github/workflows/radar.yml', run_attempt: attempt,
  head_sha: 'a'.repeat(40), updated_at: updated,
})
const budgetJobs = (id: number, completed = '2026-10-01T10:00:00Z', skipped = false) => ({ jobs: [{
  run_id: id, head_sha: 'a'.repeat(40), name: 'scan', status: 'completed', conclusion: skipped ? 'skipped' : 'success',
  steps: [{ name: 'Collect and review (no dependency installation)', status: 'completed',
    conclusion: skipped ? 'skipped' : 'success', started_at: skipped ? null : completed, completed_at: skipped ? null : completed }],
}] })
function checkpointApi(runs: ReturnType<typeof budgetRun>[], artifacts: Record<number, unknown[]>, jobs: Record<string, unknown>, current?: ReturnType<typeof budgetRun>): ReviewApi {
  return async (path) => {
    if (path.endsWith('radar.yml')) return { id: 22 }
    if (path.includes('/runs?')) return { workflow_runs: runs }
    if (path === `/repos/${repo}/actions/runs/20`) return current
    const runId = Number(path.match(/\/runs\/(\d+)/)?.[1])
    if (path.includes('/artifacts')) return { artifacts: artifacts[runId] ?? [] }
    const attempt = Number(path.match(/\/attempts\/(\d+)/)?.[1])
    if (path.includes('/jobs?')) return jobs[`${runId}-${attempt}`]
    if (path.includes('/attempts/')) return budgetRun(runId, attempt)
    assert.fail(`Unexpected path ${path}`)
  }
}
const budgetArtifact = (id: number, attempt: number, artifactId = id * 10 + attempt) => ({
  id: artifactId, name: `jev-radar-budget-${id}-${attempt}`, expired: false, size_in_bytes: 100,
})
const recoveryOptions = { currentAttempt: 1, now: new Date('2026-10-01T12:00:00Z') }
test('budget restore includes previous attempts of the current run', async () => {
  const api = checkpointApi([budgetRun(5)], { 5: [budgetArtifact(5, 1)], 20: [budgetArtifact(20, 1), budgetArtifact(20, 2)] },
    { '5-1': budgetJobs(5, '2026-10-01T08:00:00Z'), '20-1': budgetJobs(20, '2026-10-01T09:00:00Z'), '20-2': budgetJobs(20) }, budgetRun(20, 3))
  assert.deepEqual(await latestCheckpoint(api, 20, 'radar', { ...recoveryOptions, currentAttempt: 3 }), { runId: 20, artifactId: 202 })
})
test('budget restore refuses an executed attempt whose artifact is missing or expired', async () => {
  for (const newerArtifacts of [[], [{ ...budgetArtifact(6, 1), expired: true }]]) {
    const api = checkpointApi([budgetRun(6), budgetRun(5)], { 5: [budgetArtifact(5, 1)], 6: newerArtifacts },
      { '6-1': budgetJobs(6), '5-1': budgetJobs(5, '2026-10-01T08:00:00Z') })
    await assert.rejects(latestCheckpoint(api, 20, 'radar', recoveryOptions), /budget-checkpoint-missing/)
  }
})
test('budget restore ignores proven skipped collection but not unknown jobs', async () => {
  const api = checkpointApi([budgetRun(6), budgetRun(5)], { 5: [budgetArtifact(5, 1)] },
    { '6-1': budgetJobs(6, undefined, true), '5-1': budgetJobs(5) })
  assert.deepEqual(await latestCheckpoint(api, 20, 'radar', recoveryOptions), { runId: 5, artifactId: 51 })
  const unknown = checkpointApi([budgetRun(6)], {}, { '6-1': {} })
  await assert.rejects(latestCheckpoint(unknown, 20, 'radar', recoveryOptions), /invalid-jobs/)
})
test('budget restore orders reruns by collection time, not run ID or creation order', async () => {
  const api = checkpointApi([budgetRun(6), budgetRun(5, 2)], { 5: [budgetArtifact(5, 1), budgetArtifact(5, 2)], 6: [budgetArtifact(6, 1)] },
    { '6-1': budgetJobs(6, '2026-10-01T08:00:00Z'), '5-1': budgetJobs(5, '2026-10-01T07:00:00Z'), '5-2': budgetJobs(5) })
  assert.deepEqual(await latestCheckpoint(api, 20, 'radar', recoveryOptions), { runId: 5, artifactId: 52 })
})
test('a missing artifact from a previous UTC day does not lock the new day', async () => {
  const api = checkpointApi([budgetRun(6, 1, '2026-09-30T23:00:00Z')], {}, {})
  assert.equal(await latestCheckpoint(api, 20, 'radar', recoveryOptions), null)
})

test('previous attempts cannot silently consume missing or mismatched-SHA budget evidence', async () => {
  const current = budgetRun(20, 2)
  const missing = checkpointApi([], {}, { '20-1': budgetJobs(20) }, current)
  await assert.rejects(latestCheckpoint(missing, 20, 'radar', { ...recoveryOptions, currentAttempt: 2 }), /budget-checkpoint-missing/)
  const wrong = budgetJobs(20)
  wrong.jobs[0].head_sha = 'b'.repeat(40)
  const mismatched = checkpointApi([], { 20: [budgetArtifact(20, 1)] }, { '20-1': wrong }, current)
  await assert.rejects(latestCheckpoint(mismatched, 20, 'radar', { ...recoveryOptions, currentAttempt: 2 }), /invalid-jobs/)
})
test('verify-only jobs and ordinary push runs do not create a budget gap', async () => {
  const verify = { jobs: [{ run_id: 6, head_sha: 'a'.repeat(40), name: 'verify', status: 'completed', conclusion: 'success', steps: [] }] }
  const api = checkpointApi([{ ...budgetRun(7), event: 'push' }, budgetRun(6), budgetRun(5)], { 5: [budgetArtifact(5, 1)] },
    { '6-1': verify, '5-1': budgetJobs(5) })
  assert.deepEqual(await latestCheckpoint(api, 20, 'radar', recoveryOptions), { runId: 5, artifactId: 51 })
})
test('missing earlier execution also blocks recovery even when a later artifact exists', async () => {
  const api = checkpointApi([budgetRun(6), budgetRun(5)], { 6: [budgetArtifact(6, 1)] },
    { '6-1': budgetJobs(6), '5-1': budgetJobs(5, '2026-10-01T08:00:00Z') })
  await assert.rejects(latestCheckpoint(api, 20, 'radar', recoveryOptions), /budget-checkpoint-missing/)
})

test('budget recovery reaches an old run rerun today beyond 1000 verify-only runs', async () => {
  const calls: string[] = []
  const api: ReviewApi = async (path) => {
    calls.push(path)
    if (path.endsWith('radar.yml')) return { id: 22 }
    if (path.includes('/runs?')) {
      const page = Number(new URL(path, 'https://api.github.com').searchParams.get('page'))
      return { workflow_runs: page <= 10 ? Array.from({ length: 100 }, (_, index) => ({
        ...budgetRun(1000 + (page - 1) * 100 + index), event: 'push',
      })) : [budgetRun(5, 2)] }
    }
    if (path.includes('/artifacts?')) return { artifacts: [budgetArtifact(5, 1), budgetArtifact(5, 2)] }
    if (path.includes('/attempts/1/jobs?')) return budgetJobs(5, '2026-10-01T08:00:00Z')
    if (path.includes('/jobs?')) return budgetJobs(5)
    if (path.endsWith('/attempts/1')) return budgetRun(5, 1)
    assert.fail(`Unexpected path ${path}`)
  }
  assert.deepEqual(await latestCheckpoint(api, 20, 'radar', recoveryOptions), { runId: 5, artifactId: 52 })
  const pages = calls.filter((path) => path.includes('/runs?'))
  assert.equal(pages.length, 11)
  assert.ok(pages.every((path) => !/[?&](?:branch|status|created)=/.test(path)), 'Unfiltered pagination must not inherit GitHub 1000-result search limits')
})

test('exactly 1000 verify-only historical runs do not permanently lock an unused UTC budget', async () => {
  const api: ReviewApi = async (path) => {
    if (path.endsWith('radar.yml')) return { id: 22 }
    assert.ok(path.includes('/runs?'))
    const page = Number(new URL(path, 'https://api.github.com').searchParams.get('page'))
    return { workflow_runs: page <= 10 ? Array.from({ length: 100 }, (_, index) => ({
      ...budgetRun(1000 + (page - 1) * 100 + index), event: 'push',
    })) : [] }
  }
  assert.equal(await latestCheckpoint(api, 20, 'radar', recoveryOptions), null)
})

test('an unknown job cannot prove a missing collection phase was never executed', async () => {
  const unknown = { jobs: [{ run_id: 6, head_sha: 'a'.repeat(40), name: 'renamed-collect-job', status: 'completed', conclusion: 'success', steps: [] }] }
  const api = checkpointApi([budgetRun(6), budgetRun(5)], { 5: [budgetArtifact(5, 1)] },
    { '6-1': unknown, '5-1': budgetJobs(5, '2026-10-01T08:00:00Z') })
  await assert.rejects(latestCheckpoint(api, 20, 'radar', recoveryOptions), /budget-execution-unknown/)
})

test('a renamed job containing executed collection cannot hide its missing budget artifact', async () => {
  const renamed = budgetJobs(6)
  renamed.jobs[0].name = 'renamed-collect-job'
  const api = checkpointApi([budgetRun(6), budgetRun(5)], { 5: [budgetArtifact(5, 1)] },
    { '6-1': renamed, '5-1': budgetJobs(5, '2026-10-01T08:00:00Z') })
  await assert.rejects(latestCheckpoint(api, 20, 'radar', recoveryOptions), /budget-checkpoint-missing/)
  const restored = checkpointApi([budgetRun(6), budgetRun(5)], { 5: [budgetArtifact(5, 1)], 6: [budgetArtifact(6, 1)] },
    { '6-1': renamed, '5-1': budgetJobs(5, '2026-10-01T08:00:00Z') })
  assert.deepEqual(await latestCheckpoint(restored, 20, 'radar', recoveryOptions), { runId: 6, artifactId: 61 })
})
