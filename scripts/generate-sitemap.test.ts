import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildSitemap, generateSitemap } from './generate-sitemap.ts'

const row = (owner: string, repo: string, summary = 'A useful project', category = 'agents') => ({
  type: 'github',
  url: `https://github.com/${owner}/${repo}`,
  summary,
  category,
})

test('sitemap contains the home page, populated category pages, and only described projects', () => {
  const result = buildSitemap([
    row('z-owner', 'zed'),
    row('a-owner', 'alpha', 'Useful research project', 'research'),
    row('no-summary', 'thin', '  '),
    { type: 'x', url: 'https://x.com/someone/status/1', summary: 'post' },
    row('no-category', 'uncategorized', 'Useful project', 'unknown'),
  ])

  assert.equal(result.projectCount, 3)
  assert.equal(result.newsCount, 0)
  assert.deepEqual(result.categories, ['agents', 'research'])
  assert.equal(result.urlCount, 16)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\//)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\/top100/)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\/news/)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\/category\/agents/)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\/category\/research/)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\/projects\/a-owner\/alpha/)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\/zh\/projects\/a-owner\/alpha/)
  assert.match(result.xml, /hreflang="zh-CN"/)
  assert.doesNotMatch(result.xml, /\/projects\/no-summary\/thin/)
  assert.doesNotMatch(result.xml, /\/category\/unknown/)
})

test('directory category has a crawlable route in both languages', () => {
  const result = buildSitemap([row('owner', 'awesome-jev', 'A curated project index', 'directories')])
  assert.deepEqual(result.categories, ['directories'])
  assert.match(result.xml, /https:\/\/awesomejev\.cc\/category\/directories/)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\/zh\/category\/directories/)
})

test('sitemap adds only news with a stable ID and summary in both locales', () => {
  const news = [
    { id: 'cmu123', title: 'Jev release', summary: 'A source-attributed summary that explains the Jev release and gives readers enough context to decide whether to visit the original source.' },
    { id: 'cmu456', title: 'No summary', summary: null },
    { id: 'cmu789', title: 'Tiny note', summary: 'Jev is here.' },
  ]
  const result = buildSitemap([], 'https://awesomejev.cc', news)
  assert.equal(result.newsCount, 1)
  assert.equal(result.urlCount, 8)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\/news\/cmu123/)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\/zh\/news\/cmu123/)
  assert.doesNotMatch(result.xml, /\/news\/cmu456/)
  assert.doesNotMatch(result.xml, /\/news\/cmu789/)
  assert.throws(() => buildSitemap([], 'https://awesomejev.cc', [...news, news[0]]), /Duplicate news route/)
  assert.throws(() => buildSitemap([], 'https://awesomejev.cc', [{ id: '../bad', title: 'Bad', summary: news[0].summary }]), /Invalid news sitemap identity/)
})

test('sitemap project entries are stable and sorted independently of source order', () => {
  const first = buildSitemap([row('z', 'last'), row('a', 'first')]).xml
  const second = buildSitemap([row('a', 'first'), row('z', 'last')]).xml
  assert.equal(first, second)
  assert.ok(first.indexOf('/projects/a/first') < first.indexOf('/projects/z/last'))
})

test('sitemap rejects duplicate canonical routes instead of emitting duplicate URLs', () => {
  assert.throws(() => buildSitemap([
    row('Owner', 'Repo'),
    row('owner', 'repo'),
  ]), /Duplicate canonical project route/)
})

test('sitemap rejects invalid project URLs and invalid origins', () => {
  assert.throws(() => buildSitemap([row('owner', 'repo')], 'javascript:alert(1)'), /Invalid sitemap origin/)
  assert.throws(() => buildSitemap([{
    type: 'github',
    url: 'https://github.com/owner/repo/issues',
    summary: 'A useful project',
  }]), /Invalid GitHub repository URL/)
})

test('generator writes the deterministic sitemap to the requested project root', () => {
  const root = mkdtempSync(join(tmpdir(), 'awesome-jev-sitemap-'))
  try {
    mkdirSync(join(root, 'data'))
    mkdirSync(join(root, 'public'))
    const items = [row('Owner', 'Repo')]
    writeFileSync(join(root, 'data', 'github.json'), JSON.stringify(items))
    writeFileSync(join(root, 'data', 'news.json'), '[]')
    const result = generateSitemap(root)
    assert.equal(result.urlCount, 10)
    assert.equal(readFileSync(join(root, 'public', 'sitemap.xml'), 'utf8'), result.xml)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
