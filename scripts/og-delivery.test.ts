/**
 * [INPUT]: 依赖当前规范目录与 TEST_SITE_ORIGIN 指向的真实 Worker
 * [OUTPUT]: 对外提供动态 PNG、缓存/条件请求、项目三语言 head 与工作台生产访问隔离验收
 * [POS]: scripts 的 OG 集成护栏，随 test:delivery 零跳过运行，不调用第三方接口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import catalog from '../data/github.json' with { type: 'json' }
import { projectShareImage, siteShareImage, SITE_ORIGIN } from '../src/lib/share-image.ts'
import { projectPathFromUrl } from '../src/lib/project-routes.ts'

const origin = process.env.TEST_SITE_ORIGIN
const build = process.env.TEST_BUILD_OUTPUT
const count = catalog.filter((item) => item.type === 'github').length
const project = catalog[0]
const cjkProject = catalog.find((item) => /[\u2e80-\u9fff\u3040-\u30ff]/u.test(item.title + item.summary))!
const fetchLocal = (path: string, init?: RequestInit) => fetch(origin + path, { ...init, signal: AbortSignal.timeout(30_000) })

async function png(path: string) {
  const response = await fetchLocal(path)
  assert.equal(response.status, 200, await response.clone().text().then((text) => text.slice(0, 100)))
  assert.match(response.headers.get('Content-Type')!, /^image\/png/)
  const bytes = Buffer.from(await response.arrayBuffer())
  assert.deepEqual(Array.from(bytes.subarray(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10])
  assert.equal(bytes.readUInt32BE(16), 1200)
  assert.equal(bytes.readUInt32BE(20), 630)
  assert.ok(bytes.length > 10_000)
  return { response, bytes }
}

function metadata(html: string): Map<string, string[]> {
  const result = new Map<string, string[]>()
  for (const match of html.matchAll(/<meta\b[^>]*>/g)) {
    const key = match[0].match(/(?:property|name)="((?:og|twitter):[^"]+)"/)?.[1]
    const content = match[0].match(/content="([^"]*)"/)?.[1]
    if (key && content !== undefined) result.set(key, [...(result.get(key) ?? []), content.replaceAll('&amp;', '&')])
  }
  return result
}

for (const locale of ['', '/zh', '/ja']) {
  test(`actual ${locale || 'en'} project HTML emits one complete project-specific OG/Twitter group`, { skip: !origin }, async () => {
    const path = locale + projectPathFromUrl(project.url)
    const response = await fetchLocal(path)
    assert.equal(response.status, 200)
    const html = await response.text()
    const meta = metadata(html)
    for (const key of ['og:title', 'og:type', 'og:description', 'og:url', 'og:site_name', 'og:locale', 'og:image', 'og:image:secure_url', 'og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) {
      assert.equal(meta.get(key)?.length, 1, `${key} missing or duplicated`)
      assert.ok(meta.get(key)![0])
    }
    for (const key of ['og:image', 'og:image:secure_url', 'twitter:image']) assert.deepEqual(meta.get(key), [SITE_ORIGIN + projectShareImage(project).path])
    assert.deepEqual(meta.get('og:url'), [SITE_ORIGIN + path])
    assert.deepEqual(meta.get('twitter:card'), ['summary_large_image'])
    assert.deepEqual(meta.get('og:image:width'), ['1200'])
    assert.deepEqual(meta.get('og:image:height'), ['630'])
    assert.match(meta.get('og:image:alt')![0], /awesomejev\.cc/)
  })
}

test('real Worker returns current site and distinct Latin/CJK project PNGs without static images', { skip: !origin }, async () => {
  const site = await png(siteShareImage(count).path)
  assert.equal(site.response.headers.get('X-OG-Project-Count'), String(count))
  assert.equal(site.response.headers.get('Content-Location'), siteShareImage(count).path)
  const item = await png(projectShareImage(project).path)
  const cjk = await png(projectShareImage(cjkProject).path)
  assert.notDeepEqual(item.bytes, site.bytes)
  assert.notDeepEqual(cjk.bytes, site.bytes)
  const cached = await png(siteShareImage(count).path)
  assert.equal(cached.response.headers.get('X-OG-Cache'), 'HIT')
  assert.deepEqual(cached.bytes, site.bytes)
  assert.match(cached.response.headers.get('Cache-Control')!, /immutable/)
  const compat = await png('/og.png')
  assert.deepEqual(compat.bytes, site.bytes)
  assert.equal(compat.response.headers.get('Cache-Control'), 'public, max-age=60')
  if (build) {
    assert.ok(!existsSync(join(build, 'og.png')))
    assert.ok(!existsSync(join(build, 'og.svg')))
    assert.ok(!existsSync(join(build, 'og')))
    assert.ok(readdirSync(join(build, 'og-fonts')).includes('NotoSansSC.ttf'))
    assert.ok(!readdirSync(join(build, 'assets')).some((name) => /resvg|og-render|og-service|\.wasm$/.test(name)), 'Worker renderer leaked into browser assets')
  }
})

test('runtime HEAD/304, stale versions and missing identities preserve HTTP semantics', { skip: !origin }, async () => {
  const path = projectShareImage(project).path
  const head = await fetchLocal(path, { method: 'HEAD' })
  assert.equal(head.status, 200)
  assert.equal(await head.text(), '')
  const conditional = await fetchLocal(path, { headers: { 'If-None-Match': head.headers.get('ETag')! } })
  assert.equal(conditional.status, 304)
  assert.equal(await conditional.text(), '')
  const stale = await fetchLocal('/api/og/site?v=obsolete', { redirect: 'manual' })
  assert.equal(stale.status, 307)
  assert.equal(stale.headers.get('Location'), siteShareImage(count).path)
  const unsupported = await fetchLocal('/api/og/site', { method: 'POST' })
  assert.equal(unsupported.status, 405)
  const missing = await fetchLocal('/api/og/projects/__not_a_catalog_owner__/__missing__')
  assert.equal(missing.status, 404)
  assert.equal(missing.headers.get('Cache-Control'), 'no-store')
  assert.match(missing.headers.get('Content-Type')!, /^text\/plain/)
})

test('production workbench returns 404 before loading data while public site metadata remains correct', { skip: !origin }, async () => {
  for (const locale of ['', '/zh', '/ja']) {
    const response = await fetchLocal(locale + '/og-workbench')
    assert.equal(response.status, 404)
    const html = await response.text()
    assert.match(html, /<title>404 · Awesome JEV<\/title>/)
    assert.ok(!html.includes('id="og-search"'))
    assert.ok(!html.includes('id="og-project"'))
    assert.ok(!html.includes(project.url))
    const head = await fetchLocal(locale + '/og-workbench', { method: 'HEAD' })
    assert.equal(head.status, 404)
    assert.equal(await head.text(), '')
    const spoofed = await fetchLocal(locale + '/og-workbench?dev=true&enabled=1')
    assert.equal(spoofed.status, 404)
    const home = await fetchLocal(locale || '/')
    const tags = metadata(await home.text())
    assert.deepEqual(tags.get('og:image'), [SITE_ORIGIN + siteShareImage(count).path])
    assert.ok(tags.get('og:image:alt')![0].includes(String(count)))
  }
})
