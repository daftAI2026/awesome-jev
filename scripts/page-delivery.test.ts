/**
 * [INPUT]: 依赖 Node test、公开可见性、已构建 HTML/模块图及 TEST_SITE_ORIGIN 运行站点
 * [OUTPUT]: 对外提供首页描述真实 HTTP 交付、启动包数据边界、favicon、清洗旧地址 301、详情交付与预渲染内容的回归检查
 * [POS]: scripts 的性能交付护栏；检查总依赖而非仅检查变小的入口文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import snapshot from '../data/github.json' with { type: 'json' }
import newsData from '../data/news.json' with { type: 'json' }
import { projectPathFromUrl, projectRedirectPath } from '../src/lib/project-routes.ts'
import { newsPath } from '../src/lib/news.ts'
import { relatedProjects, type CategorizedProject } from '../src/lib/related-projects.ts'
import { CATEGORY_DESCRIPTION } from '../src/lib/categories.ts'
import { en } from '../src/i18n/locales/en.ts'
import { zh } from '../src/i18n/locales/zh.ts'
import { ja } from '../src/i18n/locales/ja.ts'
import { localizedPath, type Locale } from '../src/lib/locale-routes.ts'
import { isPublicProject, publicProjects } from '../src/lib/catalog-visibility.ts'

const build = process.env.TEST_BUILD_OUTPUT
const origin = process.env.TEST_SITE_ORIGIN
const githubData = publicProjects(snapshot)
const project = githubData[0]
const news = newsData.find((item) => item.summary && item.summary.trim().length >= 60)!
const projectPath = projectPathFromUrl(project.url)!
const newsItemPath = newsPath(news.id)!
const catalogs = { en, zh, ja }

for (const locale of ['en', 'zh', 'ja'] as const) {
  test(`404 ${locale} keeps recovery actions and a local Jev SVG explanation`, { skip: !origin }, async () => {
    const response = await fetch(new URL(localizedPath('/missing-jev-demo', locale), origin))
    assert.equal(response.status, 404)
    const html = await response.text()
    assert.match(html, /data-recovery-status="404"/)
    assert.match(html, /data-jev-figure=""/)
    assert.match(html, /data-packet=""/)
    const figure = html.match(/<figure\b[^>]*data-jev-figure=""[^>]*>[\s\S]*?<\/figure>/)?.[0] ?? ''
    assert.equal([...figure.matchAll(/<button\b/g)].length, 1, 'Only the drawing itself toggles pause; no choice or playback toolbar')
    assert.ok(figure.includes(catalogs[locale].jevDemoRouting))
    assert.doesNotMatch(figure, /role="group"|aria-live=/)
    assert.equal([...html.matchAll(/lg:grid-rows-subgrid/g)].length, 2, 'Recovery and illustration must share desktop rows')
    const routing = figure.match(/<div\b[^>]*data-jev-routing=""[^>]*>/)?.[0] ?? ''
    const recoveryNav = html.match(/<nav\b[^>]*aria-label="[^"]*"[^>]*>/)?.[0] ?? ''
    assert.match(routing, /lg:mt-8/)
    assert.match(recoveryNav, /lg:mt-8/)
    assert.ok(html.includes(catalogs[locale].jevFigureTitle))
    assert.ok(html.includes(catalogs[locale].jevDemoDisclaimer))
    assert.ok(html.includes(`href="${localizedPath('/', locale)}"`))
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1)
    assert.match(html, /<meta name="robots" content="noindex, follow"/)
    assert.doesNotMatch(html, /<link rel="canonical"/)
  })
}

function assertNoSnapshot(source: string, marker: string) {
  assert.ok(!source.includes(marker), `Complete snapshot leaked into startup modules: ${marker}`)
}

function modulesFor(html: string, directory: string): string[] {
  const queue = [...html.matchAll(/(?:src|href)="(\/assets\/[^" ]+\.js)"/g)].map((match) => match[1])
  const visited = new Set<string>()
  const sources: string[] = []
  for (const url of queue) {
    if (visited.has(url)) continue
    visited.add(url)
    const source = readFileSync(path.join(directory, url), 'utf8')
    sources.push(source)
    // --- 同时检查静态 import，避免把数据从入口搬到共享 chunk 后误报成功 ---
    for (const match of source.matchAll(/\b(?:import|export)\s*(?:[^;"'()]*?\bfrom\s*)?["']([^"']+\.js)["']/g)) {
      queue.push(path.posix.resolve(path.posix.dirname(url), match[1]))
    }
  }
  return sources
}

test('snapshot exclusion guards reject an actual full snapshot', () => {
  assert.throws(() => assertNoSnapshot(JSON.stringify(githubData), project.id))
  assert.throws(() => assertNoSnapshot(JSON.stringify(newsData), news.id))
  assert.doesNotThrow(() => assertNoSnapshot('export const title = "Awesome JEV"', project.id))
})

test('root icon serves the supplied transparent J SVG without fonts or a background', { skip: !origin }, async () => {
  const page = await (await fetch(`${origin}/`)).text()
  assert.match(page, /<link\b[^>]*rel="icon"[^>]*href="\/favicon\.svg"/)
  const response = await fetch(`${origin}/favicon.svg`)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type') ?? '', /image\/svg\+xml/)
  const svg = await response.text()
  assert.equal(svg, readFileSync('public/favicon.svg', 'utf8'))
  assert.match(svg, /viewBox="0 0 9 11"/)
  assert.match(svg, /<path d="M3\.6 10\.368/)
  assert.match(svg, /fill="black"/)
  assert.doesNotMatch(svg, /<(?:text|rect|image)\b/)
})

test('shared entry stays below 512 KiB without project/news snapshots', { skip: !build }, () => {
  const html = readFileSync(path.join(build!, 'index.html'), 'utf8')
  const entry = html.match(/<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]+)"/)
  assert.ok(entry)
  const source = readFileSync(path.join(build!, entry[1]), 'utf8')
  assert.ok(Buffer.byteLength(source) < 512 * 1024, 'Shared entry exceeded the 512 KiB budget')
  assertNoSnapshot(source, project.id)
  assertNoSnapshot(source, news.id)
})

test('homepage startup keeps local project search but does not load news data', { skip: !build }, () => {
  const html = readFileSync(path.join(build!, 'index.html'), 'utf8')
  const modules = modulesFor(html, build!).join('\n')
  assert.ok(modules.includes(project.id), 'Directory must still contain the local project catalog')
  assertNoSnapshot(modules, news.id)
  assert.ok(html.includes('data-masonry-ready="false"'))
  assert.ok(html.includes(projectPathFromUrl(githubData.find((item) => item.title === 'composio')!.url)!))
})

for (const [route, title] of [[projectPath, project.title], [newsItemPath, news.title]]) {
  test(`detail ${route} has reading content without either full client snapshot`, { skip: !build }, () => {
    const html = readFileSync(path.join(build!, route, 'index.html'), 'utf8')
    assert.ok(html.includes(title.replaceAll('&', '&amp;').replaceAll('<', '&lt;')))
    const modules = modulesFor(html, build!).join('\n')
    assertNoSnapshot(modules, project.id)
    assertNoSnapshot(modules, news.id)
  })
  test(`HTTP ${route} preserves content, canonical and status`, { skip: !origin }, async () => {
    const response = await fetch(new URL(route, origin), { signal: AbortSignal.timeout(30_000) })
    assert.equal(response.status, 200)
    const html = await response.text()
    assert.ok(html.includes(title.replaceAll('&', '&amp;').replaceAll('<', '&lt;')))
    assert.match(html, /<link rel="canonical"/)
    assert.doesNotMatch(html, /<meta name="robots" content="noindex/)
  })
}


function assertNoDirectoryAudit(source: string) {
  for (const marker of ['jevAbout', 'jevKeepConfidence', 'categoryEvidenceSha', 'categoryEvidenceUrl', 'evidenceSha256', 'evidenceLinks']) {
    assert.ok(!source.includes(marker), `Unused catalog audit data leaked into startup modules: ${marker}`)
  }
}

test('directory audit exclusion guard rejects the canonical rich snapshot', () => {
  assert.throws(() => assertNoDirectoryAudit(JSON.stringify(githubData)))
  assert.doesNotThrow(() => assertNoDirectoryAudit('export default [{sourceMeta:{repo:"example/app",jevEvidence:{evidenceUrl:"https://github.com/example/app"}}}]'))
})

test('homepage startup uses the display projection without catalog audit fields', { skip: !build }, () => {
  const html = readFileSync(path.join(build!, 'index.html'), 'utf8')
  const modules = modulesFor(html, build!).join('\n')
  assert.ok(modules.includes(project.id), 'Projection must retain the complete local directory identity')
  assertNoDirectoryAudit(modules)
  for (const row of snapshot.filter((item) => !isPublicProject(item))) {
    assertNoSnapshot(modules, row.id)
    if (!githubData.some(item => projectPathFromUrl(item.url) === projectPathFromUrl(row.url))) assertNoSnapshot(modules, row.url)
  }
})

test('retired identities stay hidden; reused addresses resolve only their current public owner', { skip: !origin }, async () => {
  for (const row of snapshot.filter((item) => !isPublicProject(item))) {
    for (const url of [row.url, ...(row.sourceMeta.previousUrls ?? [])]) {
      for (const locale of ['en', 'zh', 'ja'] as const) {
        const response = await fetch(`${origin}${localizedPath(projectPathFromUrl(url)!, locale)}`, { redirect: 'manual' })
        const path = projectPathFromUrl(url)!
        const replacement = githubData.find(item => projectPathFromUrl(item.url) === path)
        const [owner, repo] = new URL(url).pathname.slice(1).split('/')
        const redirect = projectRedirectPath(githubData, owner, repo)
        assert.equal(response.status, replacement ? 200 : redirect ? 301 : 404, `${locale}: ${url}`)
        const html = await response.text()
        assert.ok(!html.includes(`\"id\":\"${row.id}\"`))
        if (!replacement && !redirect) assert.ok(!html.includes(row.url))
      }
    }
  }
})

const expectedRelated = relatedProjects(githubData as CategorizedProject[], project as CategorizedProject)
const escapeHtml = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;')

for (const locale of ['en', 'zh', 'ja'] as Locale[]) {
  test(`HTTP ${locale} homepage delivers one bounded localized description`, { skip: !origin }, async () => {
    const response = await fetch(new URL(localizedPath('/', locale), origin), { signal: AbortSignal.timeout(30_000) })
    assert.equal(response.status, 200)
    const html = await response.text()
    const descriptions = [...html.matchAll(/<meta\b[^>]*name="description"[^>]*content="([^"]*)"/g)]
    assert.equal(descriptions.length, 1)
    assert.equal(descriptions[0][1], escapeHtml(catalogs[locale].documentDescription))
    assert.ok([...catalogs[locale].documentDescription].length <= 160)
  })

  test(`built ${locale} project HTML has crawlable category and bounded topic-based recommendations`, { skip: !build }, () => {
    const route = localizedPath(projectPath, locale)
    const html = readFileSync(path.join(build!, route, 'index.html'), 'utf8')
    assert.match(html, /data-project-category/)
    assert.ok(html.includes(`href="${localizedPath(`/category/${project.category}`, locale)}"`))
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1)
    for (const related of expectedRelated) assert.ok(html.includes(`href="${localizedPath(related.path, locale)}"`))
    assert.equal(html.includes('data-related-projects'), expectedRelated.length > 0)
    const modules = modulesFor(html, build!).join('\n')
    assertNoSnapshot(modules, project.id)
    assertNoSnapshot(modules, news.id)
    assert.ok(!modules.includes('Brand query sample'), 'Development workbench leaked into detail startup')
  })

  test(`built ${locale} category uses one visible H1 and the same description as metadata`, { skip: !build }, () => {
    const route = localizedPath('/category/browser', locale)
    const html = readFileSync(path.join(build!, route, 'index.html'), 'utf8')
    const description = escapeHtml(catalogs[locale][CATEGORY_DESCRIPTION.browser])
    assert.match(html, /data-category-intro/)
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1)
    assert.ok(html.includes(`name="description" content="${description}"`))
    assert.ok(html.includes(`>${description}</p>`))
  })
}

test('cleaned duplicate project addresses permanently redirect in every locale', { skip: !origin }, async () => {
  const aliases = githubData.flatMap((row) => (row.sourceMeta.previousUrls ?? []).map((url: string) => ({ url, current: row.url })))
  assert.ok(aliases.length > 0, 'cleanup must preserve the published old addresses')
  for (const { url, current } of aliases) {
    for (const locale of ['en', 'zh', 'ja'] as const) {
      const destination = localizedPath(projectPathFromUrl(current)!, locale)
      const response = await fetch(`${origin}${localizedPath(projectPathFromUrl(url)!, locale)}`, { redirect: 'manual' })
      assert.equal(response.status, 301, `${locale}: ${url}`)
      assert.equal(new URL(response.headers.get('location')!, origin).pathname, destination)
      const target = await fetch(`${origin}${destination}`)
      assert.equal(target.status, 200)
      await response.body?.cancel(); await target.body?.cancel()
    }
  }
})
