/**
 * [INPUT]: 依赖真实 radar、请求预算、发布合并、公开投影与详情身份查找
 * [OUTPUT]: 验证重审结果从付费请求预约到公开交付的完整离线链路
 * [POS]: 生命周期执行验收；仅替换 GitHub/Jev HTTP 边界，不调用真实模型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test, { type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runRadar } from './radar.ts'
import { createGitHubClient } from './github-client.ts'
import { createRadarBudget } from './radar-budget.ts'
import { evaluateJev } from './jev-client.ts'
import { mergePublishedCatalog } from './publication-merge.ts'
import { renderReadme } from './catalog.ts'
import { projectDirectoryCatalog } from './directory-catalog.ts'
import { findGitHubProject, projectRedirectPath } from '../src/lib/project-routes.ts'
import type { DirectoryItem, GitHubRepository, ReviewKeep } from './model-types.ts'

const at = new Date('2026-10-16T00:00:00.000Z'), sha = 'b'.repeat(40)
const text = 'Useful TypeSafe Jev SDK integration. Documentation: https://typesafe.ai'
const readmeTemplate = '# Offline catalog\n<!-- PROJECT_COUNT:START -->\n<!-- PROJECT_COUNT:END -->\n<!-- PROJECTS:START -->\n<!-- PROJECTS:END -->\n'
const originalUrl = 'https://github.com/old/jev-sdk'
function fixture(sameIdentity: boolean): DirectoryItem[] {
  const target = sameIdentity ? { url: 'https://github.com/new/jev-sdk', databaseId: 1, nodeId: 'node-1' }
    : { url: originalUrl, databaseId: 2, nodeId: 'node-2' }
  return [{ id: 'curated-original', type: 'github', title: 'Original curated title', summary: 'Original curator summary', category: 'sdk', tags: ['curated'], url: originalUrl,
    sourceMeta: { repo: 'old/jev-sdk', githubIdentity: { databaseId: 1, nodeId: 'node-1' }, stars: 99,
      lifecycle: { state: 'review', since: at.toISOString(), reason: sameIdentity ? 'migration-evidence' : 'identity-changed', target } } },
  { id: 'visible-control', type: 'github', title: 'Visible control project', summary: 'This unrelated project stays published.', category: 'sdk', url: 'https://github.com/control/visible',
    sourceMeta: { repo: 'control/visible', githubIdentity: { databaseId: 99, nodeId: 'node-99' }, stars: 3 } }]
}
function publicOutputs(rows: DirectoryItem[]) {
  const projects = projectDirectoryCatalog(rows as Parameters<typeof projectDirectoryCatalog>[0])
  return { projects, readme: renderReadme(readmeTemplate, rows), find: (owner: string, repo: string) => findGitHubProject(rows as Parameters<typeof findGitHubProject>[0], owner, repo) }
}
async function execute(t: TestContext, sameIdentity: boolean, outcome: ReviewKeep | 'error') {
  const root = mkdtempSync(join(tmpdir(), 'jev-lifecycle-flow-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const base = fixture(sameIdentity), target = base[0].sourceMeta.lifecycle!.target!
  const key = target.url.replace('https://github.com/', ''), [owner, name] = key.split('/')
  const repo: GitHubRepository = { id: target.databaseId, node_id: target.nodeId, html_url: target.url, full_name: key, name, owner: { login: owner },
    description: 'A newly reviewed TypeSafe Jev SDK', default_branch: 'main', private: false, archived: false, fork: false,
    topics: ['sdk'], stargazers_count: 5, forks_count: 1, language: 'TypeScript' }
  const githubRequests: string[] = [], jevRequests: unknown[] = []
  const api = createGitHubClient('offline-github-key', { fetchImpl: async input => {
    const url = new URL(String(input)); githubRequests.push(url.pathname + url.search)
    if (url.pathname === `/repos/${key}`) return Response.json(repo)
    if (url.pathname === `/repos/${key}/commits/main`) return Response.json({ sha })
    if (url.pathname === `/repos/${key}/readme` && url.searchParams.get('ref') === sha) return Response.json({ path: 'README.md', encoding: 'base64', size: Buffer.byteLength(text), content: Buffer.from(text).toString('base64') })
    assert.fail(`Unexpected GitHub boundary request: ${url.pathname}${url.search}`)
  } })
  const budget = createRadarBudget(root, { now: () => at })
  const scanned = await runRadar({ catalog: { files: new Map([['github.json', base]]), rows: base }, now: at, queries: [], api,
    beforeRequest: budget.beforeRequest,
    review: (row, evidence, options) => evaluateJev('offline-jev-key', row, evidence, { ...options, wait: async () => {}, fetchImpl: async (_input, init) => {
      const body = JSON.parse(String(init?.body)); jevRequests.push(body)
      assert.equal(body.state.readme, text)
      assert.equal(body.state.url, target.url)
      if (outcome === 'error') return Response.json({ message: 'offline service failure' }, { status: 503 })
      return Response.json({ answers: { about: { type: 'noul', noul: .98 }, keep: { type: 'choice', choice: outcome, confidence: .99 },
        category: { type: 'choice', choice: 'sdk', confidence: .99 } } })
    } }),
  })
  const latest = structuredClone(base)
  latest[0].summary = 'Maintainer summary written on latest main'
  const published = mergePublishedCatalog(base, scanned.rows, latest, 'radar')
  return { base, latest, scanned, published, target, githubRequests, jevRequests, budget: budget.snapshot(), ...publicOutputs(published) }
}
function assertPaidReceipt(result: Awaited<ReturnType<typeof execute>>, status: ReviewKeep | 'error'): void {
  const expectedRequests = status === 'error' ? 3 : 1
  assert.equal(result.jevRequests.length, expectedRequests)
  assert.equal(result.budget.used, expectedRequests, 'every simulated HTTP attempt must traverse the real durable budget')
  assert.equal(result.scanned.report.reviewed, 1)
  assert.equal(result.scanned.report.receipts.length, 1)
  const receipt = result.scanned.report.receipts[0]
  assert.equal(receipt.status, status)
  if (status === 'error') { assert.equal(receipt.reason, 'jev-http-503'); return }
  assert.equal(receipt.sha, sha)
  assert.equal(receipt.checkedAt, at.toISOString())
  assert.equal(receipt.evidenceUrl, `${result.target.url}/blob/${sha}/README.md`)
  assert.equal(receipt.evidenceSha256, createHash('sha256').update(text).digest('hex'))
  assert.equal(receipt.score?.jevKeep, status)
}

test('same-ID keep executes publication and makes the original local identity visible at its reviewed address', async t => {
  const result = await execute(t, true, 'keep')
  assertPaidReceipt(result, 'keep')
  assert.equal(result.published.length, 2)
  const restored = result.published[0]
  assert.equal(restored.id, result.base[0].id)
  assert.equal(restored.sourceMeta.lifecycle, undefined)
  assert.equal(restored.sourceMeta.githubIdentity?.databaseId, 1)
  assert.equal(restored.summary, result.latest[0].summary, 'latest-main editorial changes survive the actual publisher')
  assert.deepEqual(result.projects.map(row => row.id), ['curated-original', 'visible-control'])
  assert.match(result.readme, /Original curated title/)
  assert.match(result.readme, /https:\/\/github\.com\/new\/jev-sdk/)
  assert.equal(result.find('new', 'jev-sdk')?.id, 'curated-original')
  assert.equal(result.find('old', 'jev-sdk'), undefined)
  assert.equal(projectRedirectPath(result.published, 'old', 'jev-sdk'), '/projects/new/jev-sdk')
  assert.equal(result.githubRequests.filter(path => path === '/repos/new/jev-sdk').length, 2, 'the target identity is rechecked after the model result')
})
test('new-ID keep executes an independent addition while preserving the hidden replaced source', async t => {
  const result = await execute(t, false, 'keep')
  assertPaidReceipt(result, 'keep')
  assert.equal(result.published.length, 3)
  const old = result.published.find(row => row.id === 'curated-original')!, added = result.published.find(row => row.id === 'gh-repo-2')!
  assert.equal(old.sourceMeta.lifecycle?.state, 'replaced')
  assert.equal(old.sourceMeta.githubIdentity?.databaseId, 1)
  assert.equal(added.sourceMeta.githubIdentity?.databaseId, 2)
  assert.equal(added.sourceMeta.lifecycle, undefined)
  assert.equal(added.sourceMeta.inclusion, undefined)
  assert.deepEqual(result.projects.map(row => row.id), ['visible-control', 'gh-repo-2'])
  assert.doesNotMatch(result.readme, /Original curated title/)
  assert.match(result.readme, /\[\*\*jev-sdk\*\*\]/)
  assert.equal(result.find('old', 'jev-sdk')?.id, 'gh-repo-2', 'a reclaimed URL displays the new approved identity, never the old record')
  assert.deepEqual(added.sourceMeta.jevEvidence, result.scanned.report.receipts[0])
})
for (const sameIdentity of [true, false]) for (const verdict of ['drop', 'review', 'error'] as const) test(`${sameIdentity ? 'same' : 'new'}-ID ${verdict} stays hidden through publication, README, projection and details`, async t => {
  const result = await execute(t, sameIdentity, verdict)
  assertPaidReceipt(result, verdict)
  assert.equal(result.published.length, 2)
  assert.equal(result.published[0].sourceMeta.lifecycle?.state, 'review')
  assert.equal(result.scanned.report.added, 0)
  assert.equal(result.scanned.state.candidates[sameIdentity ? 'new/jev-sdk' : 'old/jev-sdk']?.status, verdict)
  assert.deepEqual(result.projects.map(row => row.id), ['visible-control'])
  assert.match(result.readme, /Visible control project/, 'the assertion must exercise a nonempty public output')
  assert.doesNotMatch(result.readme, /Original curated title|github\.com\/(?:new|old)\/jev-sdk/)
  assert.equal(result.find('old', 'jev-sdk'), undefined)
  assert.equal(result.find('new', 'jev-sdk'), undefined)
  assert.equal(projectRedirectPath(result.published, 'old', 'jev-sdk'), null)
})
