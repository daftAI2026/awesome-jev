/**
 * [INPUT]: 依赖真实构建 Worker、有限分页清单与 Node HTTP 测试器
 * [OUTPUT]: 验证冷页面/图片走静态路径，分页和排序保留正确首屏
 * [POS]: scripts 的免费交付验收；HTTP 标记证明未进入 SSR 或 WASM
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { staticCatalog, staticPrerenderPages } from './static-catalog.ts'
import { assertFreeAssetCount } from './generate-og.ts'
import { sortGithubItems } from '../src/lib/sort.ts'
import { publicProjects } from '../src/lib/catalog-visibility.ts'
import { hasProjectTag, projectTagPath } from '../src/lib/project-tags.ts'
import { projectPathFromUrl } from '../src/lib/project-routes.ts'
import { localizedPath, LOCALES } from '../src/lib/locale-routes.ts'
import snapshot from '../data/github.json' with { type: 'json' }
import news from '../data/news.json' with { type: 'json' }

const origin = process.env.TEST_SITE_ORIGIN
const build = process.env.TEST_BUILD_OUTPUT
const catalog = staticCatalog(snapshot, news.length)
const projects = publicProjects(snapshot)

for (const locale of LOCALES) {
  test(`${locale} cold finite pages preserve query identity without SSR`, { skip: !origin }, async () => {
    for (const sort of ['stars', 'name', 'date'] as const) {
      const response = await fetch(`${origin}${localizedPath('/', locale)}?page=2&sort=${sort}`)
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('X-Jev-Delivery'), 'static', '必须读取预渲染产物，不能只优化 SSR')
      const html = await response.text()
      const main = html.match(/<main\b[^>]*id="main"[^>]*>[\s\S]*?<\/main>/)?.[0]
      assert.ok(main)
      const first = sortGithubItems(projects, sort)[50]
      const firstLink = main.match(/href="([^"]*\/projects\/[^"?]+)"/)?.[1]
      assert.equal(firstLink, localizedPath(projectPathFromUrl(first.url)!, locale))
      assert.ok(html.includes(`rel="canonical" href="https://awesomejev.cc${localizedPath('/', locale)}?page=2"`))
      assert.ok(!html.includes('rel="canonical" href="https://awesomejev.cc/_pages/'))
    }
    const tag = await fetch(`${origin}${localizedPath('/tags/ai-agents', locale)}?page=2&sort=name`)
    assert.equal(tag.headers.get('X-Jev-Delivery'), 'static')
    await tag.body?.cancel()
    const jsonSearch = await fetch(`${origin}${localizedPath('/', locale)}?page=2e0&sort=%22name%22`)
    assert.equal(jsonSearch.headers.get('X-Jev-Delivery'), 'static')
    assert.match(await jsonSearch.text(), /data-page="2"/)
    for (const tag of ['c', 'c#', 'c++']) for (const sort of ['stars', 'name', 'date'] as const) {
      const publicPath = localizedPath(projectTagPath(tag), locale)
      const response = await fetch(`${origin}${publicPath}?sort=${sort}`)
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('X-Jev-Delivery'), 'static', publicPath)
      const html = await response.text()
      const main = html.match(/<main\b[^>]*id="main"[^>]*>[\s\S]*?<\/main>/)?.[0]
      assert.ok(main)
      const first = sortGithubItems(projects.filter((p) => hasProjectTag(p, tag)), sort)[0]
      assert.equal(main.match(/href="([^"]*\/projects\/[^"?]+)"/)?.[1], localizedPath(projectPathFromUrl(first.url)!, locale))
      assert.ok(html.includes(`rel="canonical" href="https://awesomejev.cc${publicPath}"`), publicPath)
    }
  })
}

test('all planned finite pages and public PNGs exist inside the free asset allowance', { skip: !build }, async () => {
  const root = build!
  const files = await readdir(root, { recursive: true, withFileTypes: true })
  assertFreeAssetCount(files.filter((file) => file.isFile()).length)
  for (const page of staticPrerenderPages(catalog)) {
    const filename = path.join(root, page.prerender.outputPath, 'index.html')
    assert.ok((await readFile(filename)).length > 1000, page.path)
  }
  for (const image of Object.values(catalog.images)) {
    const png = await readFile(path.join(root, image.asset))
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
  }
})
