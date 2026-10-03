/**
 * [INPUT]: 依赖项目分类白名单、英文名称文案与 App 的响应式控制栏声明
 * [OUTPUT]: 对外提供侧栏分类排序及手机版固定两行布局的离线回归
 * [POS]: scripts 的目录导航护栏；分类顺序与控制栏分行不随文字长度漂移
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CATEGORIES, CATEGORY_LABEL } from '../src/lib/categories.ts'
import { en } from '../src/i18n/locales/en.ts'

test('sidebar project categories follow English labels with Other last', () => {
  const labels = CATEGORIES.map((category) => en[CATEGORY_LABEL[category]])
  assert.equal(CATEGORIES.at(-1), 'other')
  assert.deepEqual(labels.slice(0, -1), [...labels.slice(0, -1)].sort((a, b) => a.localeCompare(b, 'en')))
})

test('mobile directory toolbar reserves a category row and preserves desktop flex', () => {
  const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const toolbar = source.match(/<div className="([^"]+)">\s*<Sheet open=\{categoryOpen\}/)?.[1].split(' ')
  assert.ok(toolbar, 'Category, sort and view must share the directory toolbar')
  for (const utility of ['grid', 'grid-cols-[minmax(0,1fr)_auto]', 'sm:flex', 'sm:flex-wrap']) {
    assert.ok(toolbar.includes(utility), `Missing responsive layout contract: ${utility}`)
  }
  assert.ok(!toolbar.includes('flex-wrap'), 'Mobile must not wrap controls according to label length')
  const trigger = source.match(/<SheetTrigger render=\{<Button[^>]*className="([^"]+)"/)?.[1].split(' ')
  assert.ok(trigger)
  assert.ok(trigger.includes('col-span-2'), 'Category owns the complete first grid row')
  assert.ok(trigger.includes('justify-self-start'), 'Category stays compact instead of stretching across the row')
})
