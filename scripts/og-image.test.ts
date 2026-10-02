/**
 * [INPUT]: 依赖纯 SVG/HTTP 策略、固定字库和真实 Node WASM 渲染器
 * [OUTPUT]: 对外提供动态计数、白底文本 PNG、规范版本与缓存/失败响应的回归
 * [POS]: scripts 的 OG 策略护栏；不创建持久图片，也不请求 GitHub
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { Resvg } from '@cf-wasm/resvg/node'
import { renderProjectSvg, renderSiteSvg, wrapImageText } from '../src/lib/og-template.ts'
import { serveOg, type OgPorts } from '../src/lib/og-response.ts'
import { projectShareImage, siteShareImage, SITE_ORIGIN } from '../src/lib/share-image.ts'

const banner = readFileSync(new URL('./awesome-jev-banner.txt', import.meta.url), 'utf8')
const project = { url: 'https://github.com/Owner/First', title: 'First project', summary: 'A tool for typed decisions' }
const content = { kind: 'site' as const, projectCount: 2199 }
const request = (path: string, init?: RequestInit) => new Request(SITE_ORIGIN + path, init)
const png = new Uint8Array([137, 80, 78, 71])
const ports: OgPorts = { banner, render: async () => png }

test('site SVG uses every supplied complete count, white background and readable domain', () => {
  for (const count of [0, 1999, 2199, 3001]) {
    const svg = renderSiteSvg(count, banner)
    assert.ok(svg.includes(`>${count} GitHub projects</text>`))
    assert.ok(svg.includes('fill="#ffffff"'))
    assert.ok(svg.includes('fill="#171717"'))
    assert.ok(svg.includes('font-size="24">awesomejev.cc'))
  }
})

test('project SVG preserves text but escapes XML injection and canonicalizes identity', () => {
  const svg = renderProjectSvg({ ...project, title: 'A & B <script>', summary: '"quoted" <image href="https://evil.example"/> 判断工具' }, banner)
  assert.ok(svg.includes('A &amp; B &lt;script&gt;'))
  assert.ok(svg.includes('owner/first'))
  assert.ok(svg.includes('&lt;image'))
  assert.ok(!svg.includes('<script>'))
  assert.ok(svg.includes('判断工具'))
  assert.ok(svg.includes('>awesomejev.cc</text>'))
  assert.ok(!svg.includes('GitHub projects</text>'))
  assert.equal(svg, renderProjectSvg({ ...project, url: project.url.toLowerCase(), title: 'A & B <script>', summary: '"quoted" <image href="https://evil.example"/> 判断工具' }, banner))
})

test('bounded wrapping keeps whole words and Unicode codepoints', () => {
  assert.deepEqual(wrapImageText('alpha beta gamma', 10, 3), ['alpha', 'beta gamma'])
  assert.equal(wrapImageText('a'.repeat(47), 32, 2).join(''), 'a'.repeat(47))
  assert.deepEqual(wrapImageText('判断工具测试', 4, 3), ['判断', '工具', '测试'])
  assert.deepEqual(wrapImageText('😀😀😀', 4, 2), ['😀😀', '😀'])
  assert.ok(wrapImageText('W'.repeat(200), 66, 2, true).every((line) => line.length <= 39))
})

test('real WASM rasterizes Latin and CJK to white 1200×630 PNGs with visible text', async () => {
  const fontBuffers = ['Geist-Regular.ttf', 'Geist-SemiBold.ttf', 'GeistMono-Regular.ttf', 'NotoSansSC.ttf']
    .map((name) => new Uint8Array(readFileSync(new URL(`../public/og-fonts/${name}`, import.meta.url))))
  for (const svg of [renderSiteSvg(2199, banner), renderProjectSvg({ ...project, title: '判断工具', summary: '日本語と中文の型付き判断' }, banner)]) {
    const renderer = await Resvg.async(svg, { font: { fontBuffers } })
    try {
      const image = renderer.render()
      try {
        assert.equal(image.width, 1200)
        assert.equal(image.height, 630)
        assert.deepEqual(Array.from(image.pixels.slice(0, 4)), [255, 255, 255, 255])
        assert.ok(image.pixels.some((byte, index) => index % 4 !== 3 && byte < 100))
        const bytes = image.asPng()
        assert.deepEqual(Array.from(bytes.slice(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10])
        assert.ok(bytes.length > 10_000)
      } finally { image.free() }
    } finally { renderer.free() }
  }
})

test('cache stores only current version keys and unversioned responses stay short-lived', async () => {
  const entries = new Map<string, Response>()
  let renders = 0
  const custom: OgPorts = { banner, render: async () => { renders++; return png }, cache: {
    match: async (key) => entries.get(key.url)?.clone(),
    put: async (key, response) => { entries.set(key.url, response) },
  } }
  const first = await serveOg(request(siteShareImage(2199).path), content, custom)
  assert.equal(first.headers.get('X-OG-Cache'), 'MISS')
  assert.match(first.headers.get('Cache-Control')!, /immutable/)
  await first.arrayBuffer()
  const second = await serveOg(request('/api/og/site'), content, custom)
  assert.equal(second.headers.get('X-OG-Cache'), 'HIT')
  assert.equal(second.headers.get('Cache-Control'), 'public, max-age=60')
  assert.equal(second.headers.get('X-OG-Project-Count'), '2199')
  await second.arrayBuffer()
  assert.equal(renders, 1)
  assert.deepEqual([...entries.keys()], [SITE_ORIGIN + siteShareImage(2199).path])
  await (await serveOg(request('/api/og/site'), { ...content, projectCount: 2200 }, custom)).arrayBuffer()
  assert.equal(renders, 2)
})

test('HEAD, 304 and stale/extra query normalization never rasterize', async () => {
  const custom: OgPorts = { banner, render: async () => { throw new Error('must not render') } }
  const path = projectShareImage(project).path
  const data = { kind: 'project' as const, item: project }
  const head = await serveOg(request(path, { method: 'HEAD' }), data, custom)
  assert.equal(head.status, 200)
  assert.equal(await head.text(), '')
  const notModified = await serveOg(request(path, { headers: { 'If-None-Match': `W/${head.headers.get('ETag')}` } }), data, custom)
  assert.equal(notModified.status, 304)
  assert.equal(await notModified.text(), '')
  for (const suffix of ['?v=obsolete', '?title=evil', '?v=obsolete&v=duplicate']) {
    const redirect = await serveOg(request('/api/og/projects/owner/first' + suffix), data, custom)
    assert.equal(redirect.status, 307)
    assert.equal(redirect.headers.get('Location'), path)
    assert.equal(redirect.headers.get('Cache-Control'), 'no-store')
  }
})

test('unknown identities, unsupported methods and failed rasterization do not publish substitute images', async () => {
  assert.equal((await serveOg(request('/api/og/projects/missing/repo'), null, ports)).status, 404)
  assert.equal((await serveOg(request('/api/og/site', { method: 'POST' }), content, ports)).status, 405)
  const failed = await serveOg(request('/api/og/site'), content, { banner, render: async () => { throw new Error('broken font') } })
  assert.equal(failed.status, 503)
  assert.equal(failed.headers.get('Cache-Control'), 'no-store')
  assert.equal(await failed.text(), 'OG image unavailable')
})
