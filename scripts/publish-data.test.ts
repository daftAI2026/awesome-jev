/**
 * [INPUT]: 依赖三方合并、真实 Git 本地 bare remote、临时仓库与注入验证器
 * [OUTPUT]: 对外提供三采集器增量保护、发布竞争重试及失败不推送的离线回归
 * [POS]: scripts 的发布验收；制造真实 non-fast-forward，不接触 GitHub 或付费模型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test, { type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mergePublishedCatalog, mergePublishedNews } from './publication-merge.ts'
import { publishData } from './publish-data.ts'
import { renderReadme } from './catalog.ts'
import { parseNewsItem } from './news-sync.ts'
import { generateSitemap } from './generate-sitemap.ts'
import { emptyState } from './radar.ts'
import type { DirectoryItem } from './model-types.ts'

const news = (id: string) => parseNewsItem({ id, title: id, originalTitle: id, summary: `Summary of Jev ${id}`,
  source: { name: 'Example' }, links: { original: `http://example.com/${id}`, aihot: `https://aihot.news/items/${id}` },
  publishedAt: '2026-10-03T00:00:00.000Z', discoveredAt: '2026-10-03T00:00:00.000Z', category: 'ai-products', score: 1, selected: false, reason: null })
const row = (id: string): DirectoryItem => ({ id, type: 'github', title: id, summary: 'Editorial', tags: ['Jev'], category: 'alternatives',
  url: `https://github.com/test/${id}`, sourceMeta: { repo: `test/${id}`, stars: 1, jevAbout: 0.99, jevKeep: 'keep', jevKeepConfidence: 0.99 } })
const run = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const save = (cwd: string, file: string, value: unknown) => writeFileSync(join(cwd, file), `${JSON.stringify(value, null, 2)}\n`)
const load = (cwd: string, file: string) => JSON.parse(readFileSync(join(cwd, file), 'utf8'))

test('catalog overlay keeps main order, manual edits and new rows while applying only collected scalar changes', () => {
  const base = [row('one')], incoming = structuredClone(base), latest = structuredClone(base)
  incoming[0].sourceMeta.stars = 4
  incoming[0].sourceMeta.githubIdentity = { databaseId: 42, nodeId: 'opaque' }
  incoming.push(row('local'))
  latest[0].summary = 'New human correction'; latest.push(row('remote'))
  const result = mergePublishedCatalog(base, incoming, latest)
  assert.deepEqual(result.map((item) => item.id), ['one', 'remote', 'local'])
  assert.equal(result[0].summary, latest[0].summary)
  assert.equal(result[0].sourceMeta.stars, 4)
  assert.deepEqual(result[0].sourceMeta.githubIdentity, incoming[0].sourceMeta.githubIdentity)
  assert.equal(latest[0].sourceMeta.stars, 1)
  latest[0].sourceMeta.stars = 9
  assert.equal(mergePublishedCatalog(base, incoming, latest)[0].sourceMeta.stars, 9)
  incoming[0].summary = 'Illegal collector rewrite'
  assert.throws(() => mergePublishedCatalog(base, incoming, latest), /editorial-change/)
})
test('catalog overlay does not resurrect removals or admit duplicates/unreviewed objects', () => {
  const base = [row('one')], incoming = [...base, row('local')]
  assert.deepEqual(mergePublishedCatalog(base, incoming, []).map((item) => item.id), ['local'])
  assert.throws(() => mergePublishedCatalog(base, [row('local')], base), /catalog-deletion/)
  assert.throws(() => mergePublishedCatalog([], [{ ...row('one'), sourceMeta: { repo: 'test/one' } }], []), /unreviewed-addition/)
  const listed = row('one'), duplicate = row('renamed')
  listed.sourceMeta.githubIdentity = duplicate.sourceMeta.githubIdentity = { databaseId: 42, nodeId: 'opaque' }
  assert.equal(mergePublishedCatalog([], [duplicate], [listed]).length, 1)
  assert.throws(() => mergePublishedCatalog([], [row('one')], [{ ...row('one'), url: 'https://github.com/other/object' }]), /id-collision/)
})

test('identity conflicts cannot reintroduce duplicate rows after cleanup', () => {
  const original = row('old'), anchored = structuredClone(original), renamed = row('renamed')
  anchored.sourceMeta.githubIdentity = renamed.sourceMeta.githubIdentity = { databaseId: 42, nodeId: 'opaque' }
  assert.throws(() => mergePublishedCatalog([original], [anchored], [original, renamed]), /Duplicate GitHub identity/)
  assert.equal(original.sourceMeta.githubIdentity, undefined)
})
test('news overlay keeps concurrent main corrections atomically and retains both sets of additions', () => {
  const base = [news('base')]
  const incoming = [{ ...base[0], title: 'Collected title' }, news('local')]
  const latest = [{ ...base[0], title: 'Main correction', summary: 'Corrected summary' }, news('remote')]
  const result = mergePublishedNews(base, incoming, latest)
  assert.deepEqual(result, [...latest, incoming[1]])
  assert.deepEqual(mergePublishedNews(base, incoming, base), incoming)
  assert.deepEqual(mergePublishedNews(base, incoming, []), [incoming[1]])
  assert.throws(() => mergePublishedNews(base, [], base), /news-deletion/)
})

function repositories(t: TestContext) {
  const parent = mkdtempSync(join(tmpdir(), 'jev-publication-test-'))
  t.after(() => rmSync(parent, { recursive: true, force: true }))
  const remote = join(parent, 'remote.git'), local = join(parent, 'local'), other = join(parent, 'other')
  run(parent, ['init', '--bare', '--initial-branch=main', remote])
  run(parent, ['clone', remote, local])
  for (const directory of ['data', 'public', 'radar']) mkdirSync(join(local, directory))
  save(local, 'data/github.json', [row('one')]); save(local, 'data/news.json', [news('base')])
  const readme = '<!-- PROJECT_COUNT:START -->\nold\n<!-- PROJECT_COUNT:END -->\n<!-- PROJECTS:START -->\nold\n<!-- PROJECTS:END -->\n'
  writeFileSync(join(local, 'README.md'), renderReadme(readme, [row('one')]))
  generateSitemap(local)
  for (const mode of ['', 'alternatives-']) {
    save(local, `radar/${mode}state.json`, emptyState())
    save(local, `radar/${mode}latest.json`, { status: 'complete', receipts: [], metadata: { top100: { complete: true } } })
  }
  const commit = (cwd: string, message: string) => {
    run(cwd, ['add', '.'])
    run(cwd, ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', message])
  }
  commit(local, 'base'); run(local, ['push', 'origin', 'main'])
  run(parent, ['clone', remote, other])
  const advance = (id: string) => {
    run(other, ['pull', '--ff-only'])
    save(other, 'data/news.json', [...load(other, 'data/news.json'), news(id)])
    commit(other, `remote ${id}`); run(other, ['push', 'origin', 'main'])
  }
  return { parent, remote, local, other, advance, head: () => run(parent, ['--git-dir', remote, 'rev-parse', 'main']) }
}
test('normal validated publication uses a normal fast-forward push without a redundant build', async (t) => {
  const fixture = repositories(t)
  save(fixture.local, 'data/news.json', [news('base'), news('local')])
  const result = await publishData({ root: fixture.local, mode: 'news', validate: () => assert.fail('No merge needs no second build') })
  assert.deepEqual(result, { status: 'published', attempts: 1, rebased: false })
  assert.equal(fixture.head(), run(fixture.local, ['rev-parse', 'HEAD']))
})
for (const mode of ['news', 'radar', 'alternatives'] as const) test(`${mode} publication overlays onto new main and validates the merged state`, async (t) => {
  const fixture = repositories(t)
  fixture.advance('remote')
  if (mode === 'news') save(fixture.local, 'data/news.json', [news('base'), news('local')])
  else save(fixture.local, 'data/github.json', [row('one'), row('local')])
  let validations = 0, metadataCalls = 0
  const result = await publishData({ root: fixture.local, mode,
    githubApi: async () => { metadataCalls++; return { data: {
      r0: { id: 'one', databaseId: 1, nameWithOwner: 'test/one', url: 'https://github.com/test/one', stargazerCount: 2, forkCount: 1, primaryLanguage: null },
      r1: { id: 'local', databaseId: 2, nameWithOwner: 'test/local', url: 'https://github.com/test/local', stargazerCount: 1, forkCount: 1, primaryLanguage: null }, rateLimit: { cost: 1 },
    } } },
    validate: (cwd) => {
      validations++
      assert.equal(load(cwd, 'data/news.json').some((item: { id: string }) => item.id === 'remote'), true)
      assert.equal(load(cwd, mode === 'news' ? 'data/news.json' : 'data/github.json').at(-1).id, 'local')
      assert.ok(readFileSync(join(cwd, 'public/sitemap.xml'), 'utf8').includes('urlset'))
    },
  })
  assert.deepEqual(result, { status: 'published', attempts: 1, rebased: true })
  assert.equal(validations, 1); assert.equal(metadataCalls, mode === 'radar' ? 1 : 0)
  run(fixture.other, ['pull', '--ff-only'])
  assert.equal(load(fixture.other, 'data/news.json').some((item: { id: string }) => item.id === 'remote'), true)
  assert.equal(run(fixture.local, ['worktree', 'list', '--porcelain']).match(/^worktree /gm)?.length, 1)
})
test('a real push race retries against main, regenerates sitemap and preserves both arrivals', async (t) => {
  const fixture = repositories(t)
  save(fixture.local, 'data/news.json', [news('base'), news('local')])
  let validations = 0
  const result = await publishData({ root: fixture.local, mode: 'news', validate: () => { validations++ },
    beforePush: (_root, attempt) => { if (attempt === 1) fixture.advance('remote') } })
  assert.deepEqual(result, { status: 'published', attempts: 2, rebased: true })
  assert.equal(validations, 1)
  run(fixture.other, ['pull', '--ff-only'])
  assert.deepEqual(load(fixture.other, 'data/news.json').map((item: { id: string }) => item.id), ['base', 'remote', 'local'])
})
test('merged validation failure leaves remote untouched and cleans only its owned worktree', async (t) => {
  const fixture = repositories(t)
  fixture.advance('remote')
  const before = fixture.head(), localBefore = run(fixture.local, ['rev-parse', 'HEAD'])
  save(fixture.local, 'data/news.json', [news('base'), news('local')])
  await assert.rejects(publishData({ root: fixture.local, mode: 'news', validate: () => { throw new Error('delivery-failed') } }), /delivery-failed/)
  assert.equal(fixture.head(), before)
  assert.equal(run(fixture.local, ['rev-parse', 'HEAD']), localBefore)
  assert.deepEqual(load(fixture.local, 'data/news.json').map((item: { id: string }) => item.id), ['base', 'local'])
  assert.equal(run(fixture.local, ['worktree', 'list', '--porcelain']).match(/^worktree /gm)?.length, 1)
})
test('unchanged data is not committed; repeated races are bounded to three attempts', async (t) => {
  const fixture = repositories(t)
  assert.equal((await publishData({ root: fixture.local, mode: 'news' })).status, 'unchanged')
  save(fixture.local, 'data/news.json', [news('base'), news('local')])
  let pushes = 0
  await assert.rejects(publishData({ root: fixture.local, mode: 'news', validate: () => {},
    beforePush: (_root, attempt) => { pushes++; fixture.advance(`remote${attempt}`) } }), /three-attempts/)
  assert.equal(pushes, 3)
  assert.equal(load(fixture.other, 'data/news.json').some((item: { id: string }) => item.id === 'local'), false)
})

test('all publication workflows use the same Actions-only publisher without model credentials or direct pushes', () => {
  for (const [workflow, mode] of [['news-sync', 'news'], ['radar', 'radar'], ['alternatives', 'alternatives']]) {
    const source = readFileSync(`.github/workflows/${workflow}.yml`, 'utf8')
    const publication = mode === 'news' ? source.slice(source.indexOf('      - name: Publish news')) : source.slice(source.indexOf('\n  publish:'))
    assert.match(publication, new RegExp(`scripts/publish-data\\.ts ${mode}`))
    assert.match(publication, /GH_TOKEN: \$\{\{ github\.token \}\}/)
    assert.doesNotMatch(publication, /TYPESAFE_API_KEY|git push|git.*reset|git.*rebase/)
  }
})
