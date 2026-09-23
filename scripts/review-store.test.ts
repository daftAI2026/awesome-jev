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
const valid = { id: 5, workflow_id: 11, path: '.github/workflows/submission-review.yml', head_branch: 'main', head_repository: { full_name: repo }, event: 'workflow_dispatch', run_attempt: 1, status: 'completed' }
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
    if (path.includes('/runs?')) return { workflow_runs: [valid, { ...valid, workflow_id: 22, path: '.github/workflows/radar.yml' }] }
    return { artifacts: [
      { id: 100, name: 'jev-review-checkpoint-5-1', expired: false, size_in_bytes: 100 },
      { id: 101, name: 'jev-radar-budget-5-1', expired: false, size_in_bytes: 100 },
    ] }
  }
  assert.deepEqual(await latestCheckpoint(api, 20, 'radar'), { runId: 5, artifactId: 101 })
})

test('alternatives budgets restore only their own workflow artifact', async () => {
  const api: ReviewApi = async (path) => {
    if (path.endsWith('alternatives.yml')) return { id: 33 }
    if (path.includes('/runs?')) return { workflow_runs: [
      { ...valid, workflow_id: 22, path: '.github/workflows/radar.yml' },
      { ...valid, workflow_id: 33, path: '.github/workflows/alternatives.yml' },
    ] }
    return { artifacts: [
      { id: 101, name: 'jev-radar-budget-5-1', expired: false, size_in_bytes: 100 },
      { id: 102, name: 'jev-alternatives-budget-5-1', expired: false, size_in_bytes: 100 },
    ] }
  }
  assert.deepEqual(await latestCheckpoint(api, 20, 'alternatives'), { runId: 5, artifactId: 102 })
})
