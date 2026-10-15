/**
 * [INPUT]: 依赖公开目录投影、详情/标签/相关规则、索引生成器和 Vite 服务端模块加载
 * [OUTPUT]: 验证三态生命周期不进入公开出口，正常项目保持可见
 * [POS]: scripts 的公开生命周期护栏；合成快照隔离真实数据，不请求上游
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createServer } from 'vite'
import { DIRECTORY_CATALOG_ID, directoryCatalogPlugin, projectDirectoryCatalog } from './directory-catalog.ts'
import { buildSitemap } from './generate-sitemap.ts'
import { buildAgentDocuments } from './generate-llms.ts'
import { findGitHubProject, projectRedirectPath } from '../src/lib/project-routes.ts'
import { projectTagIndex, projectTags } from '../src/lib/project-tags.ts'
import { relatedProjects } from '../src/lib/related-projects.ts'
import { projectShareImage } from '../src/lib/share-image.ts'
import { isPublicProject, publicProjects } from '../src/lib/catalog-visibility.ts'

const visible = (name: string) => ({
  id: name, type: 'github' as const, title: name, summary: `Description of ${name}`,
  url: `https://github.com/visibility/${name}`, category: 'agents' as const,
  tags: ['visibility-topic'], sourceMeta: { stars: 5, previousUrls: [`https://github.com/visibility/old-${name}`] },
})
const current = visible('public-one')
const peer = visible('public-two')
const hidden = (['unavailable', 'review', 'replaced'] as const).map((state) => ({
  ...visible(`hidden-${state}`),
  tags: ['visibility-topic', `hidden-tag-${state}`],
  sourceMeta: { ...visible(`hidden-${state}`).sourceMeta, stars: 9999,
    lifecycle: { state, since: '2026-10-15T00:00:00.000Z', reason: 'PRIVATE_LIFECYCLE_REASON',
      ...(state === 'replaced' ? { target: { url: current.url, databaseId: 42, nodeId: 'PRIVATE_TARGET_NODE' } } : {}) } },
}))
const rows = [current, ...hidden, peer]

test('visibility is absence-only and preserves references without changing the source array', () => {
  assert.equal(isPublicProject(current), true)
  assert.equal(publicProjects(rows)[0], current)
  for (const lifecycle of [null, undefined, {}, { state: 'unknown' }]) {
    assert.equal(isPublicProject({ sourceMeta: { lifecycle } }), false)
  }
  assert.deepEqual(publicProjects(rows), [current, peer])
})

test('directory projection excludes all lifecycle states without mutating canonical rows', () => {
  const before = structuredClone(rows)
  assert.deepEqual(projectDirectoryCatalog(rows).map((row) => row.id), [current.id, peer.id])
  assert.deepEqual(rows, before)
  assert.doesNotMatch(JSON.stringify(projectDirectoryCatalog(rows)), /hidden-|lifecycle|PRIVATE_/)
})

test('public detail and alias resolution refuse all hidden identities', () => {
  assert.equal(findGitHubProject(rows, 'visibility', 'public-one'), current)
  assert.equal(projectRedirectPath(rows, 'visibility', 'old-public-one'), '/projects/visibility/public-one')
  for (const row of hidden) {
    assert.equal(findGitHubProject(rows, 'visibility', row.title), undefined)
    assert.equal(projectRedirectPath(rows, 'visibility', `old-${row.title}`), null)
  }
})

test('hidden projects cannot supply tags, tag thresholds or related recommendations', () => {
  assert.deepEqual(projectTagIndex(rows), [{ tag: 'visibility-topic', count: 2, path: '/tags/visibility-topic' }])
  assert.deepEqual(relatedProjects(rows, current).map((row) => row.title), [peer.title])
  for (const row of hidden) {
    assert.deepEqual(projectTags(row), [])
    assert.deepEqual(relatedProjects(rows, row), [])
  }
})

test('sitemap excludes hidden details, category-only populations and hidden tag threshold contributions', () => {
  const result = buildSitemap(rows.map((row) => row.id === 'hidden-review' ? { ...row, category: 'research' } : row))
  assert.equal(result.projectCount, 2)
  assert.deepEqual(result.categories, ['agents'])
  assert.doesNotMatch(result.xml, /hidden-|\/category\/research|\/tags\/visibility-topic/)
  assert.match(result.xml, /\/zh\/projects\/visibility\/public-one/)
})

test('machine documents exclude hidden records from counts, ranks, tags and full text', () => {
  const result = buildAgentDocuments(rows, [])
  assert.match(result.llms, /Snapshot: 2 GitHub projects/)
  assert.match(result.documents['collections.md'], /1\. \[public-one\]/)
  assert.doesNotMatch(result.full, /hidden-|PRIVATE_|9999/)
})

// --- 只替换快照和 Start 注册器；执行真实 handler 与 OG 服务端入口 ---
async function fixtureServer(snapshot = rows) {
  const plugins = ['@cloudflare/vite-plugin', '@tanstack/react-start/plugin/vite', '@vitejs/plugin-react', '@tailwindcss/vite']
  return createServer({ configFile: false, logLevel: 'silent',
    ssr: { noExternal: ['@tanstack/react-start', ...plugins] },
    server: { middlewareMode: true, watch: { ignored: ['**/*'] } },
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [{ name: 'public-visibility-fixture', enforce: 'pre',
      resolveId(id) {
        if (id === '@tanstack/react-start') return '\0visibility-start'
        if (plugins.includes(id)) return `\0visibility-plugin:${id}`
      },
      load(id) {
        if (id === '\0visibility-start') return 'export function createServerFn() { return { validator() { return this }, handler(fn) { return fn } } }'
        if (id.startsWith('\0visibility-plugin:')) return 'export default function plugin() { return { name: "fixture" } }; export const cloudflare = plugin; export function tanstackStart(options) { return { name: "fixture-start", options } }'
        if (id.endsWith('/data/github.json')) return { code: JSON.stringify(snapshot), map: null }
      },
    }],
  })
}

test('real Vite config excludes hidden prerender paths and derives site OG from public count', async () => {
  const server = await fixtureServer()
  try {
    const { default: config } = await server.ssrLoadModule('/vite.config.ts')
    const start = config.plugins.find((plugin: { name: string }) => plugin.name === 'fixture-start')
    const paths: string[] = start.options.pages.map((page: { path: string }) => page.path)
    assert.ok(paths.includes('/zh/projects/visibility/public-one'))
    assert.ok(paths.includes('/ja/projects/visibility/public-two'))
    assert.ok(!paths.some((path) => path.includes('hidden-')))
    assert.match(config.define['import.meta.env.VITE_SITE_OG_ALT'], /2 GitHub projects/)
  } finally { await server.close() }
})

test('installed Vite serves no hidden entry in the actual browser virtual module', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'jev-public-client-')))
  const file = join(root, 'github.json')
  writeFileSync(file, JSON.stringify(rows))
  const server = await createServer({ configFile: false, root, logLevel: 'silent', plugins: [directoryCatalogPlugin(file)],
    server: { middlewareMode: true, watch: { ignored: ['**/*'] } }, optimizeDeps: { noDiscovery: true, include: [] } })
  try {
    const result = await server.environments.client.transformRequest(DIRECTORY_CATALOG_ID)
    assert.ok(result)
    assert.match(result.code, /public-one/)
    assert.match(result.code, /public-two/)
    assert.doesNotMatch(result.code, /hidden-|lifecycle|PRIVATE_/)
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')), rows)
  } finally { await server.close(); rmSync(root, { recursive: true, force: true }) }
})

test('real SSR handlers share public counts, details, aliases and tag counts', async () => {
  const server = await fixtureServer()
  try {
    const handlers = await server.ssrLoadModule('/src/lib/catalog.functions.ts')
    assert.equal((await handlers.getDirectoryCounts()).total, 2)
    assert.equal((await handlers.getDirectoryCounts()).categories.agents, 2)
    assert.equal((await handlers.getProjectTag({ data: { tag: 'visibility-topic' } })).count, 2)
    const result = await handlers.getProject({ data: { owner: 'visibility', repo: current.title } })
    assert.equal(result.item.id, current.id)
    assert.deepEqual(result.related.map((row: { title: string }) => row.title), [peer.title])
    assert.deepEqual(result.tags, [])
    for (const row of hidden) {
      assert.equal(await handlers.getProjectTag({ data: { tag: row.tags[1] } }), null)
      assert.equal(await handlers.getProject({ data: { owner: 'visibility', repo: row.title } }), null)
      assert.equal(await handlers.getProject({ data: { owner: 'visibility', repo: `old-${row.title}` } }), null)
    }
  } finally { await server.close() }
})

test('real OG entry returns no-store 404 before cached PNG lookup for hidden projects', async () => {
  const server = await fixtureServer()
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'caches')
  let cacheReads = 0
  Object.defineProperty(globalThis, 'caches', { configurable: true, value: { open: async () => ({
    match: async () => { cacheReads++; return new Response('old cached PNG') },
  }) } })
  try {
    const { ogResponse } = await server.ssrLoadModule('/src/lib/og-service.server.ts')
    const site = await ogResponse(new Request('https://awesomejev.cc/api/og/site', { method: 'HEAD' }))
    assert.equal(site.status, 200)
    assert.equal(site.headers.get('X-OG-Project-Count'), '2')
    const normal = await ogResponse(new Request(`https://awesomejev.cc${projectShareImage(current).path}`), { owner: 'visibility', repo: current.title })
    assert.equal(normal.status, 200)
    assert.equal(await normal.text(), 'old cached PNG')
    assert.equal(cacheReads, 1)
    for (const row of hidden) for (const method of ['GET', 'HEAD']) {
      const response = await ogResponse(new Request(`https://awesomejev.cc${projectShareImage(row).path}`, { method }), { owner: 'visibility', repo: row.title })
      assert.equal(response.status, 404)
      assert.equal(response.headers.get('Cache-Control'), 'no-store')
    }
    assert.equal(cacheReads, 1)
  } finally {
    if (previous) Object.defineProperty(globalThis, 'caches', previous)
    else Reflect.deleteProperty(globalThis, 'caches')
    await server.close()
  }
})


test('a reviewed new identity may reuse the retired URL without resurrecting its old identity or image', async () => {
  const retired = { ...hidden[2], url: current.url }
  const replacementRows = [retired, current, peer]
  const server = await fixtureServer(replacementRows)
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'caches')
  const reads: string[] = []
  Object.defineProperty(globalThis, 'caches', { configurable: true, value: { open: async () => ({
    match: async (request: Request) => { reads.push(request.url); return new Response('reviewed replacement PNG') },
  }) } })
  try {
    const handlers = await server.ssrLoadModule('/src/lib/catalog.functions.ts')
    const detail = await handlers.getProject({ data: { owner: 'visibility', repo: current.title } })
    assert.equal(detail.item.id, current.id)
    assert.equal((await handlers.getDirectoryCounts()).total, 2)
    const projection = projectDirectoryCatalog(replacementRows)
    assert.deepEqual(projection.map(row => row.id), [current.id, peer.id])
    const { ogResponse } = await server.ssrLoadModule('/src/lib/og-service.server.ts')
    const oldImage = await ogResponse(new Request(`https://awesomejev.cc${projectShareImage(retired).path}`), { owner: 'visibility', repo: current.title })
    assert.equal(oldImage.status, 307)
    assert.equal(oldImage.headers.get('Location'), projectShareImage(current).path)
    assert.deepEqual(reads, [])
    const fresh = await ogResponse(new Request(`https://awesomejev.cc${projectShareImage(current).path}`), { owner: 'visibility', repo: current.title })
    assert.equal(fresh.status, 200)
    assert.equal(await fresh.text(), 'reviewed replacement PNG')
    assert.deepEqual(reads, [`https://awesomejev.cc${projectShareImage(current).path}`])
  } finally {
    if (previous) Object.defineProperty(globalThis, 'caches', previous)
    else Reflect.deleteProperty(globalThis, 'caches')
    await server.close()
  }
})
