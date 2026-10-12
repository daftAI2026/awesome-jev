/**
 * [INPUT]: 依赖 Node test、三语言文案及 locale-routes/locale-head 的规范地址和元数据
 * [OUTPUT]: 提供三语言路径、hreflang 与首页 GitHub 目录搜索文案的离线回归
 * [POS]: scripts 的语言路由契约测试，保护页面导航与搜索元数据共用的纯规则
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { localeAlternates, localeFromPath, localizedPath, stripLocalePrefix } from '../src/lib/locale-routes.ts'
import { localizedHead } from '../src/lib/locale-head.ts'
import { en } from '../src/i18n/locales/en.ts'
import { zh } from '../src/i18n/locales/zh.ts'
import { ja } from '../src/i18n/locales/ja.ts'

test('homepage copy describes the Jev GitHub directory across search and social metadata', () => {
  for (const [locale, messages] of Object.entries({ en, zh, ja })) {
    assert.match(messages.documentTitle, /Awesome JEV.*Jev GitHub/)
    assert.match(messages.documentDescription, /awesome-jev/)
    for (const copy of [messages.documentDescription, messages.tagline]) {
      for (const keyword of ['TypeSafe Jev', 'System One', 'GitHub', 'SDK']) {
        assert.ok(copy.includes(keyword), `${locale} copy must describe ${keyword}`)
      }
    }
    const head = localizedHead({ path: '/', locale: locale as 'en' | 'zh' | 'ja', title: messages.documentTitle, description: messages.documentDescription })
    const tags = new Map(head.meta.map((tag) => ['property' in tag ? tag.property : 'name' in tag ? tag.name : 'title', 'content' in tag ? tag.content : tag.title]))
    for (const key of ['og:title', 'twitter:title']) {
      assert.equal(tags.get(key), messages.documentTitle)
    }
    for (const key of ['description', 'og:description', 'twitter:description']) {
      assert.equal(tags.get(key), messages.documentDescription)
    }
  }
})

test('locale path helpers preserve one project identity across three language variants', () => {
  const project = '/projects/sorrycc/typesafe-snake'
  assert.equal(localizedPath(project, 'en'), project)
  assert.equal(localizedPath(project, 'zh'), `/zh${project}`)
  assert.equal(localizedPath(project, 'ja'), `/ja${project}`)
  assert.equal(stripLocalePrefix(`/zh${project}`), project)
  assert.equal(stripLocalePrefix(`/ja${project}`), project)
  assert.equal(localeFromPath(`/zh${project}`), 'zh')
  assert.equal(localeFromPath(`/ja${project}`), 'ja')
  assert.equal(localeFromPath(project), 'en')
  assert.equal(localizedPath('/zh', 'en'), '/')
  assert.equal(localizedPath('/', 'zh'), '/zh')
  assert.equal(localizedPath('/zh', 'ja'), '/ja')
  assert.equal(localizedPath('/ja', 'en'), '/')
  assert.equal(localizedPath('/', 'ja'), '/ja')
  assert.deepEqual(localeAlternates(project).map((entry) => entry.href), [
    `https://awesomejev.cc${project}`,
    `https://awesomejev.cc/zh${project}`,
    `https://awesomejev.cc/ja${project}`,
  ])
  assert.deepEqual(localeAlternates(project).map((entry) => entry.hrefLang), ['en', 'zh-CN', 'ja-JP'])
})
