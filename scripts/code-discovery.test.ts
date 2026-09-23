import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { searchCodePage, integrationEvidence } from './code-discovery.ts'

test('code discovery finds integrations regardless of project name and excludes secrets', async () => {
  const result = await searchCodePage(async () => ({ total_count: 3, items: [
    { path: 'src/provider.ts', repository: { full_name: 'Example/LargeApp' } },
    { path: '.env.local', repository: { full_name: 'example/secrets' } },
    { path: 'src/a.ts', repository: { full_name: 'example/fork', fork: true } },
  ] }), '"api.typesafe.ai" in:file', 1)
  assert.deepEqual(result.hits.map((hit) => hit.repo), ['example/largeapp'])
})
test('integration evidence uses pinned commit, complete text and verified blob hash', async () => {
  const text = 'import sdk from "@typesafe-ai/sdk"\n', bytes = Buffer.from(text), sha = 'a'.repeat(40)
  const result = await integrationEvidence(async (path) => {
    assert.ok(path.endsWith(`?ref=${sha}`))
    return { type: 'file', encoding: 'base64', size: bytes.length, sha: createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), content: bytes.toString('base64') }
  }, 'example/app', sha, [{ path: 'src/a.ts', query: 'sdk' }])
  assert.ok(result.text.includes(text)); assert.equal(result.incomplete, false)
  assert.equal(result.links[0].url, `https://github.com/example/app/blob/${sha}/src/a.ts`)
  const missing = await integrationEvidence(async () => { throw new Error('github-http-404') }, 'example/app', sha, [{ path: 'src/a.ts', query: 'sdk' }])
  assert.equal(missing.incomplete, true); assert.equal(missing.links.length, 0)
})

test('radar reviews unnamed integration evidence and persists its admission basis', async () => {
  const { runRadar } = await import('./radar.ts')
  const key = 'example/application', sha = 'b'.repeat(40)
  const bytes = Buffer.from('const model = "jev-latest"; const endpoint = "https://api.typesafe.ai/v1/systemone"')
  const result = await runRadar({
    catalog: { files: new Map([['github.json', []], ['youtube.json', []]]), rows: [], social: [] },
    queries: [], codeQueries: ['"api.typesafe.ai" in:file'],
    api: async (path) => {
      if (path.startsWith('/search/code?')) return { total_count: 1, items: [{ path: 'src/provider.ts', repository: { full_name: key } }] }
      if (path.includes('/commits/')) return { sha }
      if (path.includes('/readme?')) return { path: 'README.md', encoding: 'base64', content: Buffer.from('A general purpose application.').toString('base64') }
      if (path.includes('/contents/')) return { type: 'file', size: bytes.length, encoding: 'base64', content: bytes.toString('base64'), sha: createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') }
      return { full_name: key, html_url: `https://github.com/${key}`, name: 'application', owner: { login: 'example' }, default_branch: 'main', stargazers_count: 1, forks_count: 0 }
    },
    review: async (_, text) => { assert.ok(text.includes('api.typesafe.ai')); return { jevAbout: 0.99, jevKeep: 'keep', jevKeepConfidence: 0.99 } },
  })
  assert.equal(result.report.added, 1)
  assert.equal(result.report.receipts[0].evidenceLinks?.[0].path, 'src/provider.ts')
  assert.ok(result.rows[0].sourceMeta.jevEvidence)
})
