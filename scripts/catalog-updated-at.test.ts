/**
 * [INPUT]: 依赖 node:test/assert 与 lib/catalog-updated-at 的时间规范化和格式化
 * [OUTPUT]: 对外提供缺失/无效历史隐藏及 Asia/Shanghai 展示的离线回归
 * [POS]: scripts 的数据更新时间契约测试，保护构建历史到页脚展示的真实性
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
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
