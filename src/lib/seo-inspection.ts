/**
 * [INPUT]: 依赖 local-inspection 有界同源读取、浏览器 DOMParser 和语言 URL 契约
 * [OUTPUT]: 对外提供 inspectSeoPage、evaluateSeoFacts 及可离线验证的诊断类型
 * [POS]: lib 的工作台 SEO 探针；只判断返回 HTML/索引资产事实，不运行页面脚本或推断搜索排名
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { boundedBytes, readLocal } from './local-inspection.ts'
import { LANGUAGE_TAG, localeAlternates, localeFromPath } from './locale-routes.ts'
import { SITE_ORIGIN } from './share-image.ts'

export type SeoCheckKey = 'status' | 'contentType' | 'title' | 'description' | 'canonical' | 'language' | 'alternates' | 'robots' | 'sitemap' | 'heading' | 'links' | 'robotsFile'
export interface SeoCheck { key: SeoCheckKey; state: 'pass' | 'warning' | 'error' | 'excluded'; value: string }
export interface SeoFacts {
  status: number
  contentType: string
  titles: string[]
  descriptions: string[]
  canonicals: string[]
  language: string
  alternates: Array<{ language: string; href: string }>
  robots: string
  headings: string[]
  links: Array<{ href: string; text: string }>
  inSitemap: boolean
  robotsStatus: number
}
export interface SeoExpectation { path: string; status: 200 | 404; indexable: boolean }
export interface SeoInspection { facts: SeoFacts; checks: SeoCheck[] }

export function evaluateSeoFacts(facts: SeoFacts, expected: SeoExpectation): SeoCheck[] {
  const url = `${SITE_ORIGIN}${expected.path}`
  const checks: SeoCheck[] = []
  const add = (key: SeoCheckKey, valid: boolean, value: string, failed: SeoCheck['state'] = 'error') =>
    checks.push({ key, state: valid ? 'pass' : failed, value })
  add('status', facts.status === expected.status, `${facts.status} / ${expected.status}`)
  add('contentType', /^text\/html\b/i.test(facts.contentType), facts.contentType)
  add('title', facts.titles.length === 1 && !!facts.titles[0].trim(), facts.titles.join(' | '))
  add('description', facts.descriptions.length === 1 && !!facts.descriptions[0].trim(), facts.descriptions.join(' | '), 'warning')
  add('canonical', expected.status === 404 ? facts.canonicals.length === 0 : facts.canonicals.length === 1 && facts.canonicals[0] === url, facts.canonicals.join(' | '))
  add('language', facts.language === LANGUAGE_TAG[localeFromPath(expected.path)], facts.language)
  if (expected.indexable) {
    const alternates = localeAlternates(expected.path)
    add('alternates', alternates.every((item) => facts.alternates.filter((value) => value.language === item.hrefLang && value.href === item.href).length === 1), facts.alternates.map((item) => `${item.language}: ${item.href}`).join('\n'))
  } else checks.push({ key: 'alternates', state: 'excluded', value: '' })
  const noindex = /(?:^|[,;\s])(?:noindex|none)(?:$|[,;\s])/i.test(facts.robots)
  checks.push({ key: 'robots', state: noindex === !expected.indexable ? (expected.indexable ? 'pass' : 'excluded') : 'error', value: facts.robots || 'index (default)' })
  checks.push({ key: 'sitemap', state: facts.inSitemap === expected.indexable ? (expected.indexable ? 'pass' : 'excluded') : 'error', value: facts.inSitemap ? url : '' })
  add('heading', facts.headings.length === 1 && !!facts.headings[0].trim(), `${facts.headings.length}: ${facts.headings.join(' | ')}`, 'warning')
  add('links', facts.links.length > 0, String(facts.links.length), 'warning')
  add('robotsFile', facts.robotsStatus === 200, String(facts.robotsStatus), 'warning')
  return checks
}

export async function inspectSeoPage(expected: SeoExpectation, signal?: AbortSignal): Promise<SeoInspection> {
  const [page, sitemap, robots] = await Promise.all([
    readLocal(expected.path, signal), readLocal('/sitemap.xml', signal), readLocal('/robots.txt', signal),
  ])
  const [pageBytes, sitemapBytes, robotsBytes] = await Promise.all([
    boundedBytes(page, 10 * 1024 * 1024), boundedBytes(sitemap, 10 * 1024 * 1024), boundedBytes(robots, 64 * 1024),
  ])
  // --- 索引资产不可读时不能把未知状态冒充“未收录” ---
  if (sitemap.status !== 200 || !/xml/i.test(sitemap.headers.get('content-type') ?? '')) throw new Error(`Sitemap HTTP ${sitemap.status}: expected XML`)
  const parser = new DOMParser()
  const document = parser.parseFromString(new TextDecoder().decode(pageBytes), 'text/html')
  const sitemapDocument = parser.parseFromString(new TextDecoder().decode(sitemapBytes), 'application/xml')
  if (sitemapDocument.querySelector('parsererror') || sitemapDocument.documentElement.localName !== 'urlset') throw new Error('Invalid sitemap XML')
  const values = (selector: string, attribute?: string) => Array.from(document.querySelectorAll(selector))
    .map((node) => (attribute ? node.getAttribute(attribute) ?? '' : node.textContent ?? '').trim())
  const readableText = (node: Element) => {
    const clone = node.cloneNode(true) as Element
    clone.querySelectorAll('[aria-hidden="true"], [hidden]').forEach((child) => child.remove())
    clone.querySelectorAll('[aria-label]').forEach((child) => { child.textContent = child.getAttribute('aria-label') })
    return (clone.getAttribute('aria-label') ?? clone.textContent ?? '').trim()
  }
  const links = Array.from(document.querySelectorAll('a[href]')).flatMap((node) => {
    try {
      const url = new URL(node.getAttribute('href')!, `${SITE_ORIGIN}${expected.path}`)
      return url.origin === SITE_ORIGIN && !url.hash ? [{ href: url.pathname, text: readableText(node) }] : []
    } catch { return [] }
  })
  const facts: SeoFacts = {
    status: page.status,
    contentType: page.headers.get('content-type') ?? '',
    titles: values('head title'), descriptions: values('head meta[name="description"]', 'content'),
    canonicals: values('head link[rel="canonical"]', 'href'), language: document.documentElement.lang,
    alternates: Array.from(document.querySelectorAll('head link[rel="alternate"][hreflang]')).map((node) => ({ language: node.getAttribute('hreflang')!, href: node.getAttribute('href') ?? '' })),
    robots: [...values('head meta[name="robots"]', 'content'), ...values('head meta[name="googlebot"]', 'content'), page.headers.get('x-robots-tag') ?? ''].filter(Boolean).join(', '),
    headings: Array.from(document.querySelectorAll('h1')).map(readableText), links,
    inSitemap: Array.from(sitemapDocument.getElementsByTagName('loc')).some((node) => node.textContent?.trim() === `${SITE_ORIGIN}${expected.path}`),
    robotsStatus: robotsBytes.length ? robots.status : 0,
  }
  return { facts, checks: evaluateSeoFacts(facts, expected) }
}
