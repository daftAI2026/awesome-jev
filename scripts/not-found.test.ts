/**
 * [INPUT]: 依赖 Node test、TEST_SITE_ORIGIN 指定的运行站点与三语言文案
 * [OUTPUT]: 对外提供真实 HTTP 404、索引边界和恢复入口的集成回归检查
 * [POS]: scripts 的运行时路由测试，不启动服务器，不访问采集 API
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { en } from '../src/i18n/locales/en.ts'
import { zh } from '../src/i18n/locales/zh.ts'
import { ja } from '../src/i18n/locales/ja.ts'
import { localizedPath, LANGUAGE_TAG, LOCALES } from '../src/lib/locale-routes.ts'

const origin = process.env.TEST_SITE_ORIGIN
const messages = { en, zh, ja }
const cases = [
  ['/__missing_page__', 'pageNotFound'],
  ['/category/__missing_category__', 'pageNotFound'],
  ['/projects/__missing_owner__/__missing_repo__', 'projectNotFound'],
  ['/news/__missing_news__', 'newsNotFound'],
] as const

for (const locale of LOCALES) {
  for (const [path, titleKey] of cases) {
    const pathname = localizedPath(path, locale)
    test(`404 ${pathname} preserves language, noindex and recovery links`, { skip: !origin }, async () => {
      const response = await fetch(new URL(pathname, origin), { redirect: 'manual', signal: AbortSignal.timeout(30_000) })
      assert.equal(response.status, 404)
      assert.match(response.headers.get('content-type') ?? '', /text\/html/)
      const html = await response.text()
      assert.ok(html.includes(`<html lang="${LANGUAGE_TAG[locale]}"`))
      assert.equal([...html.matchAll(/<h1\b[^>]*>/g)].length, 1)
      assert.ok(html.includes(messages[locale][titleKey]))
      assert.match(html, /<meta name="robots" content="noindex(?:, follow)?"/)
      assert.doesNotMatch(html, /<link rel="canonical"/)
      assert.ok(html.includes('id="main-content"'))
      assert.ok(html.includes('href="#main-content"'))
      for (const target of ['/', '/top100', '/news']) {
        assert.ok(html.includes(`href="${localizedPath(target, locale)}"`))
      }
    })
  }
  test(`healthy ${localizedPath('/', locale)} remains indexable`, { skip: !origin }, async () => {
    const response = await fetch(new URL(localizedPath('/', locale), origin), { signal: AbortSignal.timeout(30_000) })
    assert.equal(response.status, 200)
    const html = await response.text()
    assert.match(html, /<link rel="canonical"/)
    assert.doesNotMatch(html, /<meta name="robots" content="noindex/)
  })
}
