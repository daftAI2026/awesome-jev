/**
 * [INPUT]: 依赖真实 Worker、规范快照、分页/排序规则与三语言文案
 * [OUTPUT]: 验证全部分类、Top100、新闻的第二页 HTML、链接和逐页规范地址
 * [POS]: scripts 的分页 HTTP 护栏；必须拦住静态第一页覆盖查询页
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { CATEGORIES } from '../src/lib/categories.ts'
import { paginate } from '../src/lib/pagination.ts'
import { githubStarRanks, sortGithubItems } from '../src/lib/sort.ts'
import { sortNews, type NewsItem } from '../src/lib/news.ts'
import { projectPathFromUrl } from '../src/lib/project-routes.ts'
import { LOCALES, localizedPath } from '../src/lib/locale-routes.ts'
import { readCatalog } from './catalog.ts'

const origin = process.env.TEST_SITE_ORIGIN
const projects = readCatalog(process.cwd()).rows
const ranks = githubStarRanks(projects)
const news = sortNews(JSON.parse(readFileSync('data/news.json', 'utf8')) as NewsItem[])

for (const locale of LOCALES) {
  test(`${locale} all project categories and Top100 serve the requested 50-item page before hydration`, { skip: !origin }, async () => {
    const variants = [
      { path: '/', rows: projects },
      { path: '/top100', rows: projects.filter((item) => ranks.get(item.id)! <= 100) },
      ...CATEGORIES.map((category) => ({ path: `/category/${category}`, rows: projects.filter((item) => item.category === category) })),
    ]
    for (const { path, rows } of variants) {
      const sorted = sortGithubItems(rows, 'stars')
      for (const requested of [1, 2, 999999]) {
        const page = paginate(sorted, requested)
        const route = localizedPath(path, locale)
        const response = await fetch(`${origin}${route}${requested > 1 ? `?page=${requested}` : ''}`)
        assert.equal(response.status, 200, `${route}: ${requested}`)
        const html = await response.text()
        const main = html.match(/<main\b[^>]*id="main"[^>]*>[\s\S]*?<\/main>/)?.[0]
        assert.ok(main, route)
        assert.equal((main.match(/data-directory-pagination=/g) ?? []).length, 1, `Pager must exist only at the bottom: ${route}`)
        assert.ok(main.lastIndexOf('data-directory-pagination=') > main.lastIndexOf('data-masonry-ready='), route)
        assert.ok(main.includes(`data-page="${page.page}" data-pages="${page.pages}" data-total="${rows.length}"`), route)
        const canonical = `https://awesomejev.cc${route}${page.page > 1 ? `?page=${page.page}` : ''}`
        assert.ok(html.includes(`rel="canonical" href="${canonical}"`), route)
        const rendered = [...main.matchAll(/href="([^"]*\/projects\/[^"?]+)"/g)].map((match) => match[1])
        const expected = new Set(page.items.map((item) => localizedPath(projectPathFromUrl(item.url)!, locale)))
        assert.ok(rendered.length > 0 && rendered.length <= 50, route)
        assert.ok(rendered.every((href) => expected.has(href)), `Wrong-page project rendered: ${route}`)
        assert.equal(rendered[0], localizedPath(projectPathFromUrl(page.items[0].url)!, locale))
        if (page.pages > 1) {
          assert.match(main, /aria-current="page"/)
          const links = [...main.matchAll(/href="([^"]+)"/g)].map((match) => new URL(match[1].replaceAll('&amp;', '&'), origin))
          assert.ok(links.some((link) => link.pathname === route && Number(link.searchParams.get('page')) >= 2), `Missing actual page link: ${route}`)
        }
        if (path === '/top100' && page.page === 2) assert.ok(main.includes('>51</span>'), 'Top100 page two must retain rank 51')
      }
    }
  })
  test(`${locale} news page two has correct time-ordered items and crawlable navigation`, { skip: !origin }, async () => {
    const route = localizedPath('/news', locale)
    const page = paginate(news, 2)
    const response = await fetch(`${origin}${route}?page=2`)
    assert.equal(response.status, 200)
    const html = await response.text()
    const main = html.match(/<main\b[^>]*id="main"[^>]*>[\s\S]*?<\/main>/)?.[0]
    assert.ok(main)
    assert.equal((main.match(/data-directory-pagination=/g) ?? []).length, 1)
    assert.ok(main.lastIndexOf('data-directory-pagination=') > main.lastIndexOf('data-preview-origin'))
    assert.ok(main.includes(`data-page="2" data-pages="${page.pages}" data-total="${news.length}"`))
    assert.ok(main.includes(`href="${localizedPath(`/news/${page.items[0].id}`, locale)}"`))
    assert.ok(!main.includes(`href="${localizedPath(`/news/${news[0].id}`, locale)}"`))
    const ids = new Set(page.items.map((item) => localizedPath(`/news/${item.id}`, locale)))
    const rendered = [...main.matchAll(/href="([^"]*\/news\/[a-z0-9]+)"/g)].map((match) => match[1])
    assert.ok(rendered.length > 0 && rendered.length <= 50)
    assert.ok(rendered.every((href) => ids.has(href)))
    assert.ok(html.includes(`rel="canonical" href="https://awesomejev.cc${route}?page=2"`))
  })
}
