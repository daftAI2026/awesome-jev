/**
 * [INPUT]: 依赖真实 Worker、公开快照、公开标签与三语言分页规则
 * [OUTPUT]: 验证标签索引/详情内链、逐页 SSR、特殊字符、301/404 和 noindex
 * [POS]: scripts 的标签 HTTP 交付护栏；不以客户端水合掩盖错误首屏
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import snapshot from '../data/github.json' with { type: 'json' }
import { projectTagIndex, projectTags, hasProjectTag, TAG_INDEX_MIN_PROJECTS } from '../src/lib/project-tags.ts'
import { localizedPath, LOCALES } from '../src/lib/locale-routes.ts'
import { projectPathFromUrl } from '../src/lib/project-routes.ts'
import { paginate } from '../src/lib/pagination.ts'
import { sortGithubItems } from '../src/lib/sort.ts'
import { publicProjects } from '../src/lib/catalog-visibility.ts'

const origin = process.env.TEST_SITE_ORIGIN
const projects = publicProjects(snapshot)
const index = projectTagIndex(projects)

for (const locale of LOCALES) {
  test(`${locale} tag directory serves real page-two projects, normalized URLs and only a bottom pager`, { skip: !origin }, async () => {
    const entry = index.find((entry) => entry.tag === 'ai-agents')!
    const rows = sortGithubItems(projects.filter((item) => hasProjectTag(item, entry.tag)), 'stars')
    const route = localizedPath(entry.path, locale)
    const response = await fetch(`${origin}${route}?page=2`)
    assert.equal(response.status, 200)
    const html = await response.text()
    const main = html.match(/<main\b[^>]*id="main"[^>]*>[\s\S]*?<\/main>/)?.[0]
    assert.ok(main)
    const page = paginate(rows, 2)
    assert.ok(main.includes(`data-page="2" data-pages="${page.pages}" data-total="${entry.count}"`))
    assert.equal((main.match(/data-directory-pagination=/g) ?? []).length, 1)
    assert.ok(main.lastIndexOf('data-directory-pagination=') > main.lastIndexOf('data-masonry-ready='))
    const expected = new Set(page.items.map((item) => localizedPath(projectPathFromUrl(item.url)!, locale)))
    const links = [...main.matchAll(/href="([^"]*\/projects\/[^"?]+)"/g)].map((match) => match[1])
    assert.ok(links.length > 0 && links.length <= 50)
    assert.ok(links.every((href) => expected.has(href)))
    assert.ok(html.includes(`rel="canonical" href="https://awesomejev.cc${route}?page=2"`))
    for (const alternate of LOCALES) assert.ok(html.includes(`https://awesomejev.cc${localizedPath(entry.path, alternate)}?page=2`))
  })

  test(`${locale} tag index and detail expose crawlable one-column classification and tag navigation`, { skip: !origin }, async () => {
    const response = await fetch(`${origin}${localizedPath('/tags', locale)}`)
    assert.equal(response.status, 200)
    const html = await response.text()
    const main = html.match(/<main\b[^>]*id="main"[^>]*>[\s\S]*?<\/main>/)?.[0]
    assert.ok(main)
    const tags = index.filter((entry) => entry.count >= TAG_INDEX_MIN_PROJECTS)
    for (const entry of tags) assert.ok(main.includes(`href="${localizedPath(entry.path, locale)}"`), entry.path)
    assert.equal((main.match(/<h1\b/g) ?? []).length, 1)
    assert.ok(!main.includes('/tags/jev"'))
    const detail = await (await fetch(`${origin}${localizedPath(projectPathFromUrl(projects[0].url)!, locale)}`)).text()
    assert.ok(detail.includes('data-project-taxonomy'))
    assert.ok(detail.indexOf('data-project-category') < detail.indexOf('data-project-tag='))
    for (const tag of projectTags(projects[0])) assert.ok(detail.includes(`href="${localizedPath(`/tags/${encodeURIComponent(tag)}`, locale)}"`))
    assert.ok(detail.includes('data-browse-footer'))
  })

  test(`${locale} aliases redirect while thin tags, special characters and unknown tags keep their own SEO status`, { skip: !origin }, async () => {
    const alias = await fetch(`${origin}${localizedPath('/tags/agent', locale)}?page=2&sort=name`, { redirect: 'manual' })
    assert.equal(alias.status, 301)
    const location = new URL(alias.headers.get('location')!, origin)
    assert.equal(location.pathname, localizedPath('/tags/ai-agents', locale))
    assert.equal(location.searchParams.get('page'), '2')
    assert.equal(location.searchParams.get('sort'), 'name')
    for (const tag of ['c++', 'c#']) {
      const entry = index.find((entry) => entry.tag === tag)!
      assert.ok(entry)
      const response = await fetch(`${origin}${localizedPath(entry.path, locale)}`)
      assert.equal(response.status, 200)
      const html = await response.text()
      assert.ok(html.includes(`rel="canonical" href="https://awesomejev.cc${localizedPath(entry.path, locale)}"`))
    }
    const thin = index.find((entry) => entry.count === 1)!
    const response = await fetch(`${origin}${localizedPath(thin.path, locale)}`)
    assert.equal(response.status, 200)
    assert.match(await response.text(), /name="robots" content="noindex,follow"/)
    for (const path of ['/tags/nonexistent-tag-987654321', '/tags/jev']) {
      const unknown = await fetch(`${origin}${localizedPath(path, locale)}`)
      assert.equal(unknown.status, 404)
    }
  })
}
