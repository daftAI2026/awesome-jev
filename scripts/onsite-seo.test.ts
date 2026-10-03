/**
 * [INPUT]: 依赖 Node test、相关项目/工作台/SEO 纯契约及有界网络工具
 * [OUTPUT]: 对外提供确定性推荐、同源状态校验与 SEO 正常/异常/排除回归
 * [POS]: scripts 的站内优化单元护栏；离线运行，不请求统计或搜索服务
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { relatedProjects, type CategorizedProject } from '../src/lib/related-projects.ts'
import { workbenchSearch, workbenchPage, selectWorkbenchProject } from '../src/lib/workbench.ts'
import { evaluateSeoFacts, type SeoFacts } from '../src/lib/seo-inspection.ts'
import { boundedBytes, readLocal } from '../src/lib/local-inspection.ts'
import { localeAlternates } from '../src/lib/locale-routes.ts'
import { SITE_ORIGIN } from '../src/lib/share-image.ts'

function project(repo: string, tags: string[], category: CategorizedProject['category'] = 'agents'): CategorizedProject {
  return { id: repo, type: 'github', title: repo, summary: `Summary of ${repo}`, url: `https://github.com/owner/${repo}`, tags, category, sourceMeta: { language: 'TypeScript' } }
}

test('related projects need specific common topics in the same category, not generic tags or stars', () => {
  const current = project('current', ['jev', 'typescript', 'workflow', 'mcp'])
  const strong = project('strong', ['workflow', 'mcp'])
  const weak = project('weak', ['workflow'])
  const generic = project('generic', ['jev', 'typescript', 'ai', 'llm'])
  generic.sourceMeta.stars = 999999
  assert.deepEqual(relatedProjects([current, generic, weak, strong, project('wrong-category', ['workflow', 'mcp'], 'browser')], current).map((item) => item.path), ['/projects/owner/strong', '/projects/owner/weak'])
})

test('related projects are stable, at most three, deduplicated and never self links', () => {
  const current = project('current', ['workflow'])
  const candidates = ['d', 'b', 'a', 'c'].map((repo) => project(repo, ['workflow']))
  const selfAlias = { ...current, id: 'alias', url: 'https://github.com/OWNER/CURRENT.git' }
  const duplicate = { ...candidates[0], id: 'alias-d', url: 'https://github.com/OWNER/D' }
  const invalid = { ...project('invalid', ['workflow']), url: 'https://example.com/owner/invalid' }
  const empty = { ...project('empty', ['workflow']), summary: '  ' }
  const items = [selfAlias, invalid, empty, ...candidates, duplicate]
  assert.deepEqual(relatedProjects(items, current).map((item) => item.path), ['/projects/owner/a', '/projects/owner/b', '/projects/owner/c'])
  assert.deepEqual(relatedProjects(items, current), relatedProjects([...items].reverse(), current))
  assert.deepEqual(Object.keys(relatedProjects(items, current)[0]).sort(), ['path', 'summary', 'title', 'topics'])
})

test('no reliable topics or category means no manufactured recommendations', () => {
  for (const current of [project('a', ['jev']), project('b', ['workflow'], 'other'), { ...project('c', ['workflow']), category: undefined }]) {
    assert.deepEqual(relatedProjects([project('candidate', ['jev', 'workflow'])], current), [])
  }
})

test('workbench input is finite and targets stay same-origin in the selected language', () => {
  const state = workbenchSearch({ tool: 'seo', preset: 'project', project: 'https://github.com/Owner/Repo', width: 'mobile', category: 'browser' })
  assert.equal(workbenchPage(state, 'zh', project('current', ['workflow'])), '/zh/projects/owner/current')
  assert.equal(workbenchSearch({ tool: 'https://evil.test', project: '//evil.test', category: '../saved', preset: 'og-workbench', width: '99999' }).tool, 'og')
  assert.equal(workbenchSearch({ project: 'https://evil.test' }).project, undefined)
  assert.equal(workbenchPage({ ...state, preset: 'category' }, 'ja'), '/ja/category/browser')
  assert.equal(workbenchPage({ ...state, preset: 'missing' }, 'en'), '/__workbench-missing-page')
})

test('all workbench tools select the same canonical project for case and trailing-slash aliases', () => {
  const projects = [project('first', ['workflow']), project('Target', ['workflow'])]
  for (const url of ['https://GITHUB.COM/OWNER/TARGET', 'https://github.com/owner/target/']) {
    const search = workbenchSearch({ preset: 'project', project: url })
    assert.equal(selectWorkbenchProject(projects, search.project), projects[1])
    assert.equal(workbenchPage(search, 'zh', selectWorkbenchProject(projects, search.project)), '/zh/projects/owner/target')
  }
})

function facts(path = '/zh'): SeoFacts {
  return { status: 200, contentType: 'text/html; charset=utf-8', titles: ['Awesome JEV'], descriptions: ['A real directory'], canonicals: [SITE_ORIGIN + path], language: 'zh-CN', alternates: localeAlternates(path).map((item) => ({ language: item.hrefLang, href: item.href })), robots: '', headings: ['Awesome JEV'], links: [{ href: '/zh/category/browser', text: 'Browser' }], inSitemap: true, robotsStatus: 200 }
}

test('healthy indexable SEO facts pass without guessing rankings', () => {
  const report = evaluateSeoFacts(facts(), { path: '/zh', status: 200, indexable: true })
  assert.equal(report.length, 12)
  assert.ok(report.every((check) => check.state === 'pass'))
})

test('saved and real 404 noindex are expected exclusions, not SEO errors', () => {
  for (const status of [200, 404] as const) {
    const actual = facts(status === 200 ? '/zh/saved' : '/zh/missing')
    actual.status = status; actual.robots = 'noindex, follow'; actual.inSitemap = false
    if (status === 404) actual.canonicals = []
    const report = evaluateSeoFacts(actual, { path: status === 200 ? '/zh/saved' : '/zh/missing', status, indexable: false })
    assert.ok(!report.some((check) => check.state === 'error'))
    assert.equal(report.find((check) => check.key === 'robots')?.state, 'excluded')
    assert.equal(report.find((check) => check.key === 'sitemap')?.state, 'excluded')
  }
})

test('SEO detects wrong status, canonical, missing/duplicate metadata, accidental noindex and sitemap mismatch', () => {
  const actual = facts(); actual.status = 404; actual.titles = ['one', 'two']; actual.descriptions = []
  actual.canonicals = [SITE_ORIGIN + '/']; actual.alternates = []; actual.robots = 'none'; actual.inSitemap = false
  actual.headings = []; actual.links = []
  const report = evaluateSeoFacts(actual, { path: '/zh', status: 200, indexable: true })
  for (const key of ['status', 'title', 'canonical', 'alternates', 'robots', 'sitemap']) assert.equal(report.find((check) => check.key === key)?.state, 'error')
  for (const key of ['description', 'heading', 'links']) assert.equal(report.find((check) => check.key === key)?.state, 'warning')
})

test('inspection refuses external and malformed paths before issuing requests', async () => {
  for (const path of ['https://evil.test', '//evil.test', '/\\evil.test', '/\u0000']) await assert.rejects(readLocal(path), /same-origin/)
})

test('inspection reads bounded streams and rejects overflow', async () => {
  assert.deepEqual(await boundedBytes(new Response('abc'), 3), new TextEncoder().encode('abc'))
  await assert.rejects(boundedBytes(new Response('abcd'), 3), /budget/)
  assert.equal((await boundedBytes(new Response(null), 3)).length, 0)
})
