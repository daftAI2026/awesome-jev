import test from 'node:test'
import assert from 'node:assert/strict'
import { formatCatalogUpdatedAt, normalizeCatalogUpdatedAt } from '../src/lib/catalog-updated-at.ts'

test('missing or invalid history stays hidden instead of inventing a timestamp', () => {
  assert.equal(normalizeCatalogUpdatedAt(undefined), null)
  assert.equal(normalizeCatalogUpdatedAt(''), null)
  assert.equal(normalizeCatalogUpdatedAt('not-a-date'), null)
  assert.equal(formatCatalogUpdatedAt(undefined), null)
  assert.equal(formatCatalogUpdatedAt('not-a-date'), null)
})

test('normalizes ISO history and formats it in fixed Asia/Shanghai time', () => {
  const value = normalizeCatalogUpdatedAt('2026-09-22T00:00:00Z')
  assert.equal(value, '2026-09-22T00:00:00.000Z')
  assert.equal(formatCatalogUpdatedAt(value), '09/22 08:00')
})
