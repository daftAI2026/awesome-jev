import assert from 'node:assert/strict'
import test from 'node:test'
import { localeAlternates, localeFromPath, localizedPath, stripLocalePrefix } from '../src/lib/locale-routes.ts'

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
