import test from 'node:test'
import assert from 'node:assert/strict'
import { CATEGORIES, CATEGORY_LABEL } from '../src/lib/categories.ts'
import { en } from '../src/i18n/locales/en.ts'

test('sidebar project categories follow English labels with Other last', () => {
  const labels = CATEGORIES.map((category) => en[CATEGORY_LABEL[category]])
  assert.equal(CATEGORIES.at(-1), 'other')
  assert.deepEqual(labels.slice(0, -1), [...labels.slice(0, -1)].sort((a, b) => a.localeCompare(b, 'en')))
})
