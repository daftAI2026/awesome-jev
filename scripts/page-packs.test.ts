/**
 * [INPUT]: 依赖临时预渲染 HTML、打包器与真实静态交付函数
 * [OUTPUT]: 验证逐页字节、条件请求、容量与构建失败保留原件
 * [POS]: scripts 的免费文件数回归；离线执行，不运行全站构建
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { packStaticPages } from './pack-static-pages.ts'
import { staticPrerenderPages } from './static-catalog.ts'
import { staticDelivery, type StaticCatalog } from '../src/lib/static-delivery.ts'
import { pagePackLocation, PAGE_PACK_MAX_BYTES, PAGE_PACK_HEADER_BYTES, PAGE_PACK_RECORD_BYTES } from '../src/lib/page-packs.ts'

const catalog: StaticCatalog = { pages: { '/': 251, '/zh/tags/c%23': 51, '/ja/news': 101 }, images: {} }
const plan = staticPrerenderPages(catalog)
const contents = (identity: string) => `<html lang="zh"><head><title>${identity}</title></head><body>中文 C# ${identity}</body></html>`
async function fixture(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(path.join(tmpdir(), 'jev-page-packs-'))
  try {
    for (const page of plan) {
      const filename = path.join(root, page.prerender.outputPath, 'index.html')
      await mkdir(path.dirname(filename), { recursive: true })
      await writeFile(filename, contents(page.path))
    }
    await writeFile(path.join(root, 'unrelated.txt'), 'keep')
    await run(root)
  } finally { await rm(root, { recursive: true, force: true }) }
}

test('packing reduces physical files while every public query returns identical HTML bytes', async () => {
  await fixture(async (root) => {
    const result = await packStaticPages(root, catalog)
    assert.ok(result.pages > result.packs)
    assert.equal(result.pages, plan.filter((p) => p.prerender.outputPath.startsWith('/_pages/')).length)
    assert.equal(await readFile(path.join(root, 'index.html'), 'utf8'), contents(plan[0].path))
    assert.equal(await readFile(path.join(root, 'unrelated.txt'), 'utf8'), 'keep')
    for (const page of plan) {
      const calls: string[] = []
      const url = page.path.replaceAll('%2525', '%')
      const response = await staticDelivery(new Request('https://example.test' + url), catalog, async (request) => {
        calls.push(new URL(request.url).pathname)
        assert.equal(request.method, 'GET')
        const file = new URL(request.url).pathname
        const bytes = await readFile(path.join(root, file, file.endsWith('.bin') ? '' : 'index.html'))
        return new Response(bytes, { headers: { 'Content-Type': file.endsWith('.bin') ? 'application/octet-stream' : 'text/html; charset=utf-8', 'Last-Modified': 'Fri, 13 Nov 2026 12:00:00 GMT' } })
      })
      assert.equal(response?.status, 200)
      assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8')
      assert.equal(response.headers.get('X-Jev-Delivery'), 'static')
      assert.equal(await response.text(), contents(page.path))
      assert.equal(calls.length, 1, '一次请求只读一个资产，不增加网络往返')
      if (pagePackLocation(page.prerender.outputPath)) {
        await assert.rejects(readFile(path.join(root, page.prerender.outputPath, 'index.html')), { code: 'ENOENT' })
      }
    }
    const files = (await readdir(root, { recursive: true, withFileTypes: true })).filter((f) => f.isFile())
    assert.equal(files.length, plan.length - result.pages + result.packs + 1)
  })
})

test('packed HEAD, ETag lists, wildcard and modification time preserve per-page HTTP identity', async () => {
  await fixture(async (root) => {
    await packStaticPages(root, catalog)
    const deliver = (query: string, init?: RequestInit) => staticDelivery(new Request('https://example.test' + query, init), catalog,
      async (request) => new Response(await readFile(path.join(root, new URL(request.url).pathname)), {
        headers: { 'Last-Modified': 'Fri, 13 Nov 2026 12:00:00 GMT', 'X-Robots-Tag': 'noindex', 'ETag': '"pack-etag"' },
      }))
    const head = await deliver('/?page=2&sort=name', { method: 'HEAD' })
    assert.equal(head?.status, 200)
    assert.equal(await head.text(), '')
    assert.equal(head.headers.get('X-Robots-Tag'), null, '内部包的索引策略不能泄漏到公开页')
    const etag = head.headers.get('ETag')!
    assert.notEqual(etag, '"pack-etag"')
    for (const value of [etag, `"another", ${etag.replace('W/', '')}`, '*']) {
      const response = await deliver('/?page=2&sort=name', { headers: { 'If-None-Match': value } })
      assert.equal(response?.status, 304)
      assert.equal(await response.text(), '')
    }
    assert.equal((await deliver('/?page=2&sort=name', { headers: { 'If-Modified-Since': 'Sat, 14 Nov 2026 12:00:00 GMT' } }))?.status, 304)
    assert.equal((await deliver('/?page=2&sort=date', { method: 'HEAD' }))?.headers.get('ETag') === etag, false)
    assert.equal((await deliver('/?page=2&sort=name', { headers: { 'If-None-Match': '"miss"', 'If-Modified-Since': 'Sat, 14 Nov 2026 12:00:00 GMT' } }))?.status, 200)
  })
})

test('invalid and oversized packs fail closed; missing packs retain prerender fallback', async () => {
  for (const bytes of [new Uint8Array(10), new Uint8Array(PAGE_PACK_MAX_BYTES + 1)]) {
    let calls = 0
    const response = await staticDelivery(new Request('https://example.test/?page=2'), catalog, async () => {
      calls++
      return new Response(bytes)
    })
    assert.equal(response?.status, 503)
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
    assert.equal(calls, 1, '损坏产物不能偷偷回落 SSR')
  }
  let calls = 0
  const response = await staticDelivery(new Request('https://example.test/?page=2'), catalog, async () => {
    calls++
    return calls === 1 ? new Response(null, { status: 404 }) : new Response('prerender original')
  })
  assert.equal(await response?.text(), 'prerender original')
  assert.equal(calls, 2)
})

test('missing input aborts packing before deleting any original HTML', async () => {
  await fixture(async (root) => {
    const packed = plan.filter((p) => p.prerender.outputPath.startsWith('/_pages/'))
    await rm(path.join(root, packed.at(-1)!.prerender.outputPath, 'index.html'))
    await assert.rejects(packStaticPages(root, catalog))
    assert.equal(await readFile(path.join(root, packed[0].prerender.outputPath, 'index.html'), 'utf8'), contents(packed[0].path))
  })
})

test('corrupt gzip and mismatched decoded length return 503 before publishing a successful response', async () => {
  await fixture(async (root) => {
    await packStaticPages(root, catalog)
    const source = plan.find((p) => p.prerender.outputPath.endsWith('/name/2'))!
    const actual = pagePackLocation(source.prerender.outputPath)!
    const original = await readFile(path.join(root, actual.path))
    for (const corrupt of ['gzip', 'length']) {
      const bytes = Buffer.from(original)
      const start = 8 + actual.slot * PAGE_PACK_RECORD_BYTES
      if (corrupt === 'gzip') bytes.fill(0, bytes.readUInt32BE(start), bytes.readUInt32BE(start) + 10)
      else bytes.writeUInt32BE(1, start + 8)
      assert.ok(bytes.length > PAGE_PACK_HEADER_BYTES)
      const response = await staticDelivery(new Request('https://example.test/?page=2&sort=name'), catalog, async () => new Response(bytes))
      assert.equal(response?.status, 503)
      assert.equal(response.headers.get('Cache-Control'), 'no-store')
    }
  })
})
