/**
 * [INPUT]: 依赖 Node test、已构建静态 HTML/模块图及 TEST_SITE_ORIGIN 运行站点
 * [OUTPUT]: 对外提供启动包数据边界、详情交付与预渲染内容的回归检查
 * [POS]: scripts 的性能交付护栏；检查总依赖而非仅检查变小的入口文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import githubData from '../data/github.json' with { type: 'json' }
import newsData from '../data/news.json' with { type: 'json' }
import { projectPathFromUrl } from '../src/lib/project-routes.ts'
import { newsPath } from '../src/lib/news.ts'

const build = process.env.TEST_BUILD_OUTPUT
const origin = process.env.TEST_SITE_ORIGIN
const project = githubData[0]
const news = newsData.find((item) => item.summary && item.summary.trim().length >= 60)!
const projectPath = projectPathFromUrl(project.url)!
const newsItemPath = newsPath(news.id)!

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
})
