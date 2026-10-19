/**
 * [INPUT]: 依赖免费交付策略、伪 ASSETS、安装框架与临时文件
 * [OUTPUT]: 验证冷请求不渲染、查询页身份和图片 HTTP 语义
 * [POS]: scripts 的交付路径回归；不依赖缓存命中或付费额度
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { staticDelivery, staticPagePath, type StaticCatalog } from '../src/lib/static-delivery.ts'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { staticPrerenderPages } from './static-catalog.ts'
import { withTrailingSlash } from 'ufo'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

test('the installed prerender pipeline sends exact public URLs with no synthetic search keys', async () => {
  const require = createRequire(import.meta.url)
  const entry = join(dirname(require.resolve('@tanstack/start-plugin-core/package.json')), 'dist/esm/prerender.js')
  const { prerender } = await import(pathToFileURL(entry).href)
  const output = await mkdtemp(join(tmpdir(), 'jev-prerender-contract-'))
  const requests: string[] = []
  try {
    await prerender({
      startConfig: { router: {}, pages: staticPrerenderPages({ pages: { '/tags/c%23': 51 }, images: {} }),
        prerender: { enabled: true, concurrency: 1, crawlLinks: false, autoStaticPathsDiscovery: false } },
      handler: { getClientOutputDirectory: () => output, request: async (path: string) => {
        requests.push(path)
        return new Response('<html>fixture</html>', { headers: { 'Content-Type': 'text/html' } })
      } },
    })
    assert.ok(requests.includes('/tags/c%23?page=2&sort=name'))
    for (const request of requests) {
      const url = new URL(request, 'https://prerender.local')
      assert.equal(url.hash, '')
      assert.equal(url.pathname, '/tags/c%23')
      assert.ok([...url.searchParams.keys()].every((key) => key === 'page' || key === 'sort'))
    }
  } finally { await rm(output, { recursive: true, force: true }) }
})

test('prerender trailing slash cannot become part of the page or sort value', () => {
  const plan = staticPrerenderPages({ pages: { '/': 101, '/zh/news': 101 }, images: {} })
  for (const page of plan) {
    const planned = new URL(page.path, 'https://prerender.local')
    const requested = new URL(withTrailingSlash(page.path), 'https://prerender.local')
    for (const key of ['page', 'sort']) assert.equal(requested.searchParams.get(key), planned.searchParams.get(key))
  }
})

test('encoded tag filenames and prerender requests preserve their public identity', async () => {
  const require = createRequire(import.meta.url)
  const entry = join(dirname(require.resolve('@tanstack/start-plugin-core/package.json')), 'dist/esm/prerender.js')
  const { validateAndNormalizePrerenderPages: normalize } = await import(pathToFileURL(entry).href)
  const base = new URL('https://prerender.local')
  for (const path of ['/tags/c%23', '/zh/tags/c%2B%2B', '/ja/tags/space%20tag']) {
    const plan = staticPrerenderPages({ pages: { [path]: 51 }, images: {} })
    const requests = normalize(normalize(plan, base), base)
    for (const page of requests) {
      const url = new URL(page.path, base)
      assert.equal(url.pathname, path, '框架两次归一不能把 # 变成片段')
      assert.equal(url.hash, '#/')
    }
    assert.match(staticPagePath(path, 1, 'stars'), /^\/_pages\//, '编码路径不能直接作为资产文件名')
    assert.ok(requests.some((p: { path: string }) => {
      const url = new URL(withTrailingSlash(p.path), base)
      return url.pathname === path && url.searchParams.get('page') === '2' && url.searchParams.get('sort') === 'name'
    }))
  }
})

const catalog: StaticCatalog = {
  pages: { '/': 101, '/zh': 101, '/zh/category/sdk': 51, '/ja/tags/ai-agents': 75, '/news': 103, '/tags': 0 },
  images: {
    '/api/og/site': { path: '/api/og/site?v=version', asset: '/_og/version.png', count: 101 },
    '/api/og/projects/owner/repo': { path: '/api/og/projects/owner/repo?v=project', asset: '/_og/project.png' },
  },
}
const request = (path: string, init?: RequestInit) => new Request(`https://awesomejev.cc${path}`, init)

test('a cold directory request reads its exact built page instead of invoking SSR', async () => {
  const calls: string[] = []
  for (const [path, asset] of [
    ['/', '/'], ['/zh/category/sdk?page=2&sort=name', staticPagePath('/zh/category/sdk', 2, 'name')],
    ['/ja/tags/ai-agents?page=999999&sort=date', staticPagePath('/ja/tags/ai-agents', 2, 'date')],
    ['/?page=invalid', '/'], ['/news?page=3', staticPagePath('/news', 3, 'stars')],
  ]) {
    const response = await staticDelivery(request(path), catalog, async (r) => {
      calls.push(new URL(r.url).pathname)
      assert.equal(new URL(r.url).pathname, asset)
      return new Response('correct page', { headers: { 'Content-Type': 'text/html' } })
    })
    assert.ok(response, '必须命中构建产物，不能回落到现场 SSR')
    assert.equal(response.headers.get('X-Jev-Delivery'), 'static')
    assert.equal(await response.text(), 'correct page')
  }
  assert.equal(calls.length, 5)
})

test('preview, unknown routes, duplicate search parameters and writes retain existing routing', async () => {
  for (const path of ['/news?preview=newsid', '/tags/unknown', '/preview/owner/repo', '/?page=2&page=3', '/?sort=name&sort=date']) {
    assert.equal(await staticDelivery(request(path), catalog, async () => assert.fail('不应读错静态页')), undefined)
  }
  assert.equal(await staticDelivery(request('/', { method: 'POST' }), catalog, async () => assert.fail()), undefined)
})

test('asset absence remains visible to the fallback rather than serving the wrong page', async () => {
  assert.equal(await staticDelivery(request('/?page=2'), catalog, async () => new Response(null, { status: 404 })), undefined)
})

test('asset transport errors return a non-cacheable failure rather than an uncaught Worker exception', async () => {
  const response = await staticDelivery(request('/'), catalog, async () => { throw new Error('asset transport failed') })
  assert.equal(response?.status, 503)
  assert.equal(response?.headers.get('Cache-Control'), 'no-store')
})

test('cold OG GET streams a prepared PNG; HEAD and validators do not read PNG bytes', async () => {
  let reads = 0
  const assets = async (r: Request) => {
    reads++
    assert.equal(new URL(r.url).pathname, '/_og/version.png')
    return new Response(new Uint8Array([137, 80, 78, 71]), { headers: { 'Content-Type': 'image/png' } })
  }
  const response = await staticDelivery(request('/api/og/site?v=version'), catalog, assets)
  assert.ok(response)
  assert.equal(response.headers.get('Content-Location'), '/api/og/site?v=version')
  assert.equal(response.headers.get('X-OG-Project-Count'), '101')
  assert.equal(response.headers.get('X-OG-Cache'), 'STATIC')
  assert.match(response.headers.get('Cache-Control')!, /immutable/)
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [137, 80, 78, 71])
  const head = await staticDelivery(request('/api/og/site', { method: 'HEAD' }), catalog, assets)
  assert.ok(head)
  assert.equal(await head.text(), '')
  const conditional = await staticDelivery(request('/api/og/site', { headers: { 'If-None-Match': head.headers.get('ETag')! } }), catalog, assets)
  assert.equal(conditional?.status, 304)
  assert.equal(reads, 1)
})

test('OG aliases, versions, missing membership and missing artifacts fail closed', async () => {
  const asset = async () => new Response('png')
  const compat = await staticDelivery(request('/og.png'), catalog, asset)
  assert.equal(compat?.status, 200)
  assert.equal(compat?.headers.get('Cache-Control'), 'public, max-age=60')
  const stale = await staticDelivery(request('/api/og/site?v=old'), catalog, asset)
  assert.equal(stale?.status, 307)
  assert.equal(stale?.headers.get('Location'), '/api/og/site?v=version')
  const missing = await staticDelivery(request('/api/og/projects/hidden/repo'), catalog, async () => assert.fail('先验证成员'))
  assert.equal(missing?.status, 404)
  assert.equal(missing?.headers.get('Cache-Control'), 'no-store')
  assert.equal((await staticDelivery(request('/api/og/site', { method: 'POST' }), catalog, asset))?.status, 405)
  assert.equal((await staticDelivery(request('/api/og/site'), catalog, async () => new Response(null, { status: 404 })))?.status, 503)
})

test('JSON-form search values retain TanStack page and sort interpretation', async () => {
  for (const query of ['?page=2e0&sort=name', '?page=%222%22&sort=%22name%22', '?page=2.0&sort=name']) {
    const result = await staticDelivery(request('/' + query), catalog, async (asset) => {
      assert.equal(new URL(asset.url).pathname, staticPagePath('/', 2, 'name'))
      return new Response('page two by name')
    })
    assert.equal(await result?.text(), 'page two by name')
  }
})

test('OG repository parts decode independently without allowing encoded separators', async () => {
  const response = await staticDelivery(request('/api/og/projects/owner/%72epo'), catalog, async () => new Response('png'))
  assert.equal(response?.status, 200)
  for (const value of ['%2Frepo', '%5Crepo', '%ZZ', '%252Frepo']) {
    const bad = await staticDelivery(request('/api/og/projects/owner/' + value), catalog, async () => assert.fail('非法仓库不得读取资产'))
    assert.ok(!bad || bad.status === 400 || bad.status === 404)
  }
})
