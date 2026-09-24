import assert from 'node:assert/strict'
import test from 'node:test'
import { localeAlternates, localeFromPath, localizedPath, stripLocalePrefix } from '../src/lib/locale-routes.ts'

test('locale path helpers preserve one project identity across two language variants', () => {
  const project = '/projects/sorrycc/typesafe-snake'
  assert.equal(localizedPath(project, 'en'), project)
  assert.equal(localizedPath(project, 'zh'), `/zh${project}`)
  assert.equal(stripLocalePrefix(`/zh${project}`), project)
  assert.equal(localeFromPath(`/zh${project}`), 'zh')
  assert.equal(localeFromPath(project), 'en')
  assert.equal(localizedPath('/zh', 'en'), '/')
  assert.equal(localizedPath('/', 'zh'), '/zh')
  assert.deepEqual(localeAlternates(project).map((entry) => entry.href), [
    `https://awesomejev.cc${project}`,
    `https://awesomejev.cc/zh${project}`,
  ])
})
