import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRadarBudget, RADAR_BUDGET_FILENAME } from './radar-budget.ts'
import { emptyState, runRadar } from './radar.ts'

test('persists every reservation and stops exactly at the daily limit', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'jev-radar-budget-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const budget = createRadarBudget(directory, { limit: 2, now: () => new Date('2026-09-22T12:00:00.000Z') })
  assert.deepEqual(JSON.parse(readFileSync(join(directory, RADAR_BUDGET_FILENAME), 'utf8')), budget.snapshot())
  await budget.beforeRequest()
  await budget.beforeRequest()
  assert.deepEqual(budget.snapshot(), { version: 1, day: '2026-09-22', used: 2, limit: 2 })
  await assert.rejects(budget.beforeRequest(), /radar-budget-exhausted/)
  assert.deepEqual(JSON.parse(readFileSync(join(directory, RADAR_BUDGET_FILENAME), 'utf8')), budget.snapshot())
  await assert.rejects(createRadarBudget(directory, { limit: 2, now: () => new Date('2026-09-22T12:00:00.000Z') }).beforeRequest(), /radar-budget-exhausted/)
})

test('resets by UTC day and rejects malformed persisted state', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'jev-radar-budget-reset-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  let current = new Date('2026-09-22T23:59:00.000Z')
  const budget = createRadarBudget(directory, { limit: 2, now: () => current })
  await budget.beforeRequest()
  current = new Date('2026-09-23T00:01:00.000Z')
  const nextDay = createRadarBudget(directory, { limit: 2, now: () => current })
  assert.deepEqual(nextDay.snapshot(), { version: 1, day: '2026-09-23', used: 0, limit: 2 })
  assert.deepEqual(JSON.parse(readFileSync(join(directory, RADAR_BUDGET_FILENAME), 'utf8')), nextDay.snapshot())
  await nextDay.beforeRequest()
  assert.deepEqual(nextDay.snapshot(), { version: 1, day: '2026-09-23', used: 1, limit: 2 })
  writeFileSync(join(directory, RADAR_BUDGET_FILENAME), JSON.stringify({ version: 1, day: '2026-09-23', used: 99, limit: 2 }))
  assert.throws(() => createRadarBudget(directory, { limit: 2, now: () => current }), /radar-budget-invalid-state/)
})

test('budget exhaustion leaves the current radar candidate pending without counting a review', async () => {
  const state = emptyState()
  state.candidates['example/app'] = { status: 'pending', discoveredAt: '2026-09-22T00:00:00.000Z', attempts: 0 }
  const repository = {
    full_name: 'example/app', html_url: 'https://github.com/example/app', name: 'app', owner: { login: 'example' },
    default_branch: 'main', stargazers_count: 1, forks_count: 0,
  }
  const result = await runRadar({
    catalog: { files: new Map([['github.json', []], ['youtube.json', []]]), rows: [], social: [] },
    state,
    queries: [],
    api: async (path) => path.includes('/commits/') ? { sha: 'a'.repeat(40) } :
      path.includes('/readme?') ? { encoding: 'base64', size: 17, path: 'README.md', content: Buffer.from('TypeSafe AI Jev').toString('base64') } : repository,
    beforeRequest: async () => { throw new Error('radar-budget-exhausted') },
    review: async (_row, _text, options) => { await options?.beforeRequest?.(); throw new Error('unreachable') },
    now: new Date('2026-09-22T00:00:00.000Z'),
  })
  assert.equal(result.report.reviewed, 0)
  assert.equal(result.report.pending, 1)
  assert.deepEqual(result.state.candidates['example/app'], state.candidates['example/app'])
})

test('default radar limit is queue-sized and processes more than sixty candidates', async () => {
  const state = emptyState()
  for (let index = 0; index < 61; index++) {
    state.candidates[`example/app-${index}`] = { status: 'pending', discoveredAt: '2026-09-22T00:00:00.000Z', attempts: 0 }
  }
  const result = await runRadar({
    catalog: { files: new Map([['github.json', []], ['youtube.json', []]]), rows: [], social: [] },
    state,
    queries: [],
    api: async (path) => {
      const key = path.slice('/repos/'.length).split('/commits/')[0]?.split('/readme?')[0] ?? 'example/unknown'
      if (path.includes('/commits/')) return { sha: 'a'.repeat(40) }
      if (path.includes('/readme?')) return { encoding: 'base64', size: 17, path: 'README.md', content: Buffer.from('TypeSafe AI Jev').toString('base64') }
      return { full_name: key, html_url: `https://github.com/${key}`, name: key.split('/')[1], owner: { login: key.split('/')[0] }, default_branch: 'main', stargazers_count: 1, forks_count: 0 }
    },
    review: async () => ({ jevAbout: 0.99, jevKeep: 'keep', jevKeepConfidence: 0.99 }),
    now: new Date('2026-09-22T00:00:00.000Z'),
  })
  assert.equal(result.report.reviewed, 61)
  assert.equal(result.report.added, 61)
})
