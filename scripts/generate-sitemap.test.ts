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
  assert.deepEqual(result.categories, ['agents', 'research'])
  assert.equal(result.urlCount, 14)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\//)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\/top100/)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\/category\/agents/)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\/category\/research/)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\/projects\/a-owner\/alpha/)
  assert.match(result.xml, /https:\/\/awesomejev\.cc\/zh\/projects\/a-owner\/alpha/)
  assert.match(result.xml, /hreflang="zh-CN"/)
  assert.doesNotMatch(result.xml, /\/projects\/no-summary\/thin/)
  assert.doesNotMatch(result.xml, /\/category\/unknown/)
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
    const result = generateSitemap(root)
    assert.equal(result.urlCount, 8)
    assert.equal(readFileSync(join(root, 'public', 'sitemap.xml'), 'utf8'), result.xml)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
