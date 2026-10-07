/**
 * [INPUT]: 依赖分页/排名/检索纯规则、真实项目与新闻快照、三语言 head
 * [OUTPUT]: 验证 50 条边界、全量检索、全局排名、页码校验与规范地址
 * [POS]: scripts 的分页离线护栏；不拆分数据、不请求外部站点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { directorySearch, DIRECTORY_PAGE_SIZE, paginate, paginationNumbers, paginationRange } from '../src/lib/pagination.ts'
import { CATEGORIES } from '../src/lib/categories.ts'
import { githubStarRanks, sortGithubItems } from '../src/lib/sort.ts'
import { searchItems } from '../src/lib/search.ts'
import { localizedHead } from '../src/lib/locale-head.ts'
import { LOCALES, localizedPath } from '../src/lib/locale-routes.ts'
import { sortNews, type NewsItem } from '../src/lib/news.ts'
import { readCatalog } from './catalog.ts'

const projects = readCatalog(process.cwd()).rows
test('URL pagination rejects malformed values and validates sort without extra dependencies', () => {
  for (const value of [undefined, null, true, [], {}, '', '0', '-1', 0, -2, 1.2, '1.2', '2e2', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(directorySearch({ page: value }).page, undefined, String(value))
  }
  assert.deepEqual(directorySearch({ page: '2', sort: 'name', token: 'hidden' }), { page: 2, sort: 'name' })
  assert.deepEqual(directorySearch({ page: 1, sort: 'bad' }), { page: undefined, sort: undefined })
})
test('50-item pages cover empty, exact, remainder and out-of-range results', () => {
  assert.equal(DIRECTORY_PAGE_SIZE, 50)
  for (const total of [0, 1, 49, 50, 51, 100, 101, 2199]) {
    const rows = Array.from({ length: total }, (_, index) => index)
    const count = Math.max(1, Math.ceil(total / 50))
    assert.equal(paginationRange(total, 999999).page, count)
    assert.deepEqual(Array.from({ length: count }, (_, index) => paginate(rows, index + 1).items).flat(), rows)
    assert.ok(paginate(rows, count).items.length <= 50)
    assert.equal(paginate(rows, 0).page, 1)
  }
})
test('all categories and sorts paginate the entire result set without duplicates or data mutation', () => {
  const source = JSON.stringify(projects)
  for (const category of ['all', ...CATEGORIES]) {
    for (const sort of ['stars', 'date', 'name'] as const) {
      const rows = sortGithubItems(category === 'all' ? projects : projects.filter((item) => item.category === category), sort)
      const pages = paginationRange(rows.length).pages
      const gathered = Array.from({ length: pages }, (_, index) => paginate(rows, index + 1).items).flat()
      assert.deepEqual(gathered.map((item) => item.id), rows.map((item) => item.id))
      assert.equal(new Set(gathered.map((item) => item.id)).size, rows.length)
    }
  }
  assert.equal(JSON.stringify(projects), source)
})
test('Top 100 has exactly two pages and page two retains global ranks 51 through 100', () => {
  const ranks = githubStarRanks(projects)
  const top = sortGithubItems(projects.filter((item) => ranks.get(item.id)! <= 100), 'stars')
  assert.equal(paginate(top, 1).pages, 2)
  assert.deepEqual(paginate(top, 2).items.map((item) => ranks.get(item.id)), Array.from({ length: 50 }, (_, index) => index + 51))
  assert.deepEqual(sortGithubItems([...projects].reverse(), 'stars').map((item) => item.id), sortGithubItems(projects, 'stars').map((item) => item.id))
})
test('search finds a project beyond the first page before slicing', () => {
  const target = sortGithubItems(projects, 'stars')[80]
  const matches = searchItems(projects, target.title, 'github', [])
  assert.ok(matches.some((item) => item.id === target.id))
  assert.ok(paginate(matches).items.some((item) => item.id === target.id))
})
test('news retains complete latest-first results and paginates items, not date headings', () => {
  const news = JSON.parse(readFileSync('data/news.json', 'utf8')) as NewsItem[]
  const sorted = sortNews(news)
  const pages = Array.from({ length: paginationRange(sorted.length).pages }, (_, index) => paginate(sorted, index + 1).items)
  assert.deepEqual(pages.flat().map((item) => item.id), sorted.map((item) => item.id))
  assert.ok(pages.every((page) => page.length <= 50))
})
test('page navigation stays bounded and always identifies current, first and last pages', () => {
  for (const pages of [1, 2, 7, 8, 44, 1000]) {
    for (const page of [1, Math.ceil(pages / 2), pages]) {
      const numbers = paginationNumbers(page, pages)
      assert.ok(numbers.length <= 7)
      assert.ok(numbers.includes(page)); assert.ok(numbers.includes(1)); assert.ok(numbers.includes(pages))
      assert.equal(new Set(numbers.filter((value) => typeof value === 'number')).size, numbers.filter((value) => typeof value === 'number').length)
      const compact = paginationNumbers(page, pages, true)
      assert.ok(compact.length <= 5)
      assert.ok(compact.includes(page)); assert.ok(compact.includes(1)); assert.ok(compact.includes(pages))
    }
  }
})
test('canonical and all language alternatives identify the requested page, not page one', () => {
  for (const locale of LOCALES) {
    const head = localizedHead({ path: '/', locale, title: 'Directory', description: 'Projects', page: 2 })
    assert.equal(head.links[0].href, `https://awesomejev.cc${localizedPath('/', locale)}?page=2`)
    assert.ok(head.links.every((link) => link.href.endsWith('?page=2')))
    assert.ok(!localizedHead({ path: '/', locale, title: 'Directory', description: 'Projects' }).links[0].href.includes('?'))
  }
})
