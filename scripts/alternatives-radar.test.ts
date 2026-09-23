import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runAlternatives, emptyAlternativesState, validateAlternativesState, writeAlternativesSnapshot } from './alternatives-radar.ts'
import { candidateRow } from './catalog.ts'
import { reviewBody } from './jev-client.ts'
import type { Catalog, DirectoryItem, GitHubRepository, JevScore } from './model-types.ts'

const now = new Date('2026-09-24T00:00:00.000Z')
const alternatives: GitHubRepository[] = [
  {
    html_url: 'https://github.com/mizorewww/laya-mlx', full_name: 'mizorewww/laya-mlx', name: 'laya-mlx',
    owner: { login: 'mizorewww' }, description: 'An independent typed-decision model with calibrated probabilities.',
    default_branch: 'main', topics: ['system-one', 'decision-model'], language: 'Python',
    created_at: '2026-09-20T00:00:00Z', stargazers_count: 5869, forks_count: 400,
    license: { spdx_id: 'MIT' }, private: false, fork: false, archived: false,
  },
  {
    html_url: 'https://github.com/nokia-applied-research/AnyJev', full_name: 'nokia-applied-research/AnyJev', name: 'AnyJev',
    owner: { login: 'nokia-applied-research' }, description: 'An independent System One typed-decision model with probabilities.',
    default_branch: 'main', topics: ['system-one', 'decision-model'], language: 'Python',
    created_at: '2026-09-21T00:00:00Z', stargazers_count: 342, forks_count: 30,
    license: { spdx_id: 'Apache-2.0' }, private: false, fork: false, archived: false,
  },
]

const evidence = 'This independent implementation explores typed decisions, System One, calibrated probability estimates, and decision heads.'
const keep: JevScore = { jevAbout: 0.98, jevKeep: 'keep', jevKeepConfidence: 0.99, category: 'alternatives' }
const catalog = (rows: DirectoryItem[] = []): Catalog => ({
  files: new Map<string, DirectoryItem[]>([['github.json', rows.filter((row) => row.type === 'github')], ['youtube.json', []]]),
  rows,
  social: [],
})

test('alternative reviews use an implementation-specific prompt rather than the ecosystem client prompt', () => {
  const body = reviewBody(candidateRow(alternatives[0], {}, { alternative: true }), evidence, false, true)
  assert.match(body.questions.about.instructions, /independent implementation/i)
  assert.match(body.questions.keep.instructions, /not merely a proposal/i)
  assert.deepEqual(Object.keys(body.questions.category?.criteria ?? {}), ['alternatives', 'other'])
})

function githubApi(repos: GitHubRepository[], searchCalls: string[] = []) {
  return async (path: string): Promise<unknown> => {
    if (path.startsWith('/search/repositories?')) {
      const query = new URL(`https://api.github.com${path}`).searchParams.get('q') ?? ''
      searchCalls.push(query)
      return { items: repos, total_count: repos.length }
    }
    const repo = repos.find((entry) => {
      const key = entry.full_name.toLowerCase()
      return path === `/repos/${key}` || path.startsWith(`/repos/${key}/`)
    })
    if (!repo) throw new Error('github-http-404')
    const normalizedPath = path.toLowerCase()
    const normalizedKey = repo.full_name.toLowerCase()
    if (normalizedPath === `/repos/${normalizedKey}`) return repo
    if (normalizedPath.startsWith(`/repos/${normalizedKey}/commits/`)) return { sha: 'a'.repeat(40) }
    if (normalizedPath.startsWith(`/repos/${normalizedKey}/readme?`)) return {
      path: 'README.md', encoding: 'base64', size: Buffer.byteLength(evidence),
      content: Buffer.from(evidence).toString('base64'),
    }
    throw new Error('github-http-404')
  }
}

test('dedicated discovery finds both independent implementations and classifies accepted rows as alternatives', async () => {
  const queries: string[] = []
  const reviewOrder: string[] = []
  const result = await runAlternatives({
    catalog: catalog(), api: githubApi(alternatives, queries), now,
    review: async (row) => { reviewOrder.push(row.sourceMeta?.repo ?? ''); return keep },
  })

  assert.ok(queries.length > 0)
  assert.ok(queries.some((query) => /topic:system-one/.test(query) && /topic:decision-model/.test(query) && /fork:false/.test(query)))
  assert.equal(result.report.added, 2, JSON.stringify({ report: result.report, state: result.state }))
  assert.deepEqual(result.rows.map((row) => row.url).sort(), alternatives.map((repo) => repo.html_url).sort())
  assert.ok(result.rows.every((row) => row.type === 'github' && row.category === 'alternatives'))
  assert.ok(result.rows.every((row) => row.type !== 'github' || !row.tags?.includes('jev')),
    'independent alternatives should not receive the core ecosystem tag by default')
  assert.equal(reviewOrder[0], 'mizorewww/laya-mlx', 'same-day leads should prioritize high-signal repositories')
})

test('catalogued repository is deduplicated before evidence fetch or model review', async () => {
  const knownRepo = alternatives[1]
  const known = candidateRow(knownRepo, keep)
  const reviewed: string[] = []
  const paths: string[] = []
  const api = async (path: string): Promise<unknown> => {
    paths.push(path)
    return githubApi([knownRepo])(path)
  }
  const result = await runAlternatives({
    catalog: catalog([known]), api, now,
    review: async (row) => { reviewed.push(row.url ?? ''); return keep },
  })

  assert.equal(result.report.added, 0)
  assert.equal(result.rows.length, 1)
  assert.deepEqual(reviewed, [])
  assert.ok(paths.every((path) => path.startsWith('/search/')), 'a known repository should be filtered at search ingestion, not fetched again')
})

test('low-confidence keep remains in review state and cannot enter the public catalog', async () => {
  const repo = alternatives[1]
  const uncertain: JevScore = { jevAbout: 0.96, jevKeep: 'keep', jevKeepConfidence: 0.55, category: 'alternatives' }
  const result = await runAlternatives({
    catalog: catalog(), api: githubApi([repo]), now,
    review: async () => uncertain,
  })
  const key = repo.full_name.toLowerCase()

  assert.equal(result.report.added, 0)
  assert.equal(result.rows.length, 0)
  assert.equal(result.state.candidates[key]?.status, 'review', JSON.stringify(result.report))
  assert.equal(result.state.candidates[key]?.lastReview?.score?.jevKeepConfidence, 0.55)
})

test('candidate retry state survives discovery and a separate snapshot without touching core radar state', async (t) => {
  const state = emptyAlternativesState()
  const pendingKey = 'owner/under-review'
  const preserved = {
    status: 'review' as const,
    discoveredAt: '2026-09-20T00:00:00.000Z',
    checkedAt: '2026-09-21T00:00:00.000Z',
    retryAt: '2026-09-30T00:00:00.000Z',
    attempts: 1,
  }
  state.candidates[pendingKey] = preserved
  const outputResult = await runAlternatives({
    catalog: catalog(), state, api: githubApi([alternatives[0]]), now,
    review: async () => keep,
  })
  assert.deepEqual(outputResult.state.candidates[pendingKey], preserved)
  assert.equal(outputResult.report.added, 1)

  const root = mkdtempSync(join(tmpdir(), 'jev-alternatives-snapshot-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const output = join(root, 'output')
  mkdirSync(join(root, 'data'), { recursive: true })
  mkdirSync(join(root, 'radar'), { recursive: true })
  const x = '[{"id":"x-1","type":"x","title":"Post","summary":"Keep exact text","url":"https://x.com/test/status/1","sourceMeta":{}}]\n'
  const coreState = '{"core":"do not replace"}\n'
  const coreReport = '{"coreReport":"do not replace"}\n'
  writeFileSync(join(root, 'data/github.json'), '[]\n')
  writeFileSync(join(root, 'data/youtube.json'), '[]\n')
  writeFileSync(join(root, 'data/x.json'), x)
  writeFileSync(join(root, 'radar/state.json'), coreState)
  writeFileSync(join(root, 'radar/latest.json'), coreReport)
  writeFileSync(join(root, 'README.md'), '# Directory\n<!-- PROJECT_COUNT:START -->old<!-- PROJECT_COUNT:END -->\n<!-- PROJECTS:START -->old<!-- PROJECTS:END -->\n')

  writeAlternativesSnapshot(root, output, outputResult)

  const writtenProjects = JSON.parse(readFileSync(join(output, 'data/github.json'), 'utf8')) as DirectoryItem[]
  assert.equal(writtenProjects.length, 1)
  const writtenAlternative = writtenProjects[0]
  if (!writtenAlternative || writtenAlternative.type !== 'github') throw new Error('Expected a written GitHub alternative')
  assert.equal(writtenAlternative.category, 'alternatives')
  assert.match(readFileSync(join(output, 'README.md'), 'utf8'), /Open-source alternatives/)
  assert.deepEqual(JSON.parse(readFileSync(join(output, 'radar/alternatives-state.json'), 'utf8')).candidates[pendingKey], preserved)
  assert.ok(existsSync(join(output, 'radar/alternatives-latest.json')))
  assert.equal(readFileSync(join(root, 'data/x.json'), 'utf8'), x)
  assert.equal(readFileSync(join(root, 'radar/state.json'), 'utf8'), coreState)
  assert.equal(readFileSync(join(root, 'radar/latest.json'), 'utf8'), coreReport)
  if (existsSync(join(output, 'data/x.json'))) assert.equal(readFileSync(join(output, 'data/x.json'), 'utf8'), x)
  if (existsSync(join(output, 'radar/state.json'))) assert.equal(readFileSync(join(output, 'radar/state.json'), 'utf8'), coreState)
  if (existsSync(join(output, 'radar/latest.json'))) assert.equal(readFileSync(join(output, 'radar/latest.json'), 'utf8'), coreReport)
})

test('invalid alternatives state is rejected before a scan can run', async () => {
  const invalid = emptyAlternativesState()
  invalid.candidates['not/a/valid/owner/repo'] = {
    status: 'pending', discoveredAt: now.toISOString(), attempts: 0,
  }
  assert.throws(() => validateAlternativesState(invalid), /state/i)
  await assert.rejects(() => runAlternatives({
    catalog: catalog(), api: async () => { throw new Error('should not call') }, review: async () => keep, state: invalid,
  }), /state/i)
})
