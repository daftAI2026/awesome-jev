/**
 * [INPUT]: 依赖新闻纯分页规则与递增历史样本
 * [OUTPUT]: 验证动态交付上限、全量计数、排序与可选单条预览
 * [POS]: scripts 的新闻成本护栏；不删除历史，也不调用外部 API
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { selectNewsPage, sortNews, type NewsItem } from '../src/lib/news.ts'
const rows = (count: number): NewsItem[] => Array.from({ length: count }, (_, index) => ({
  id: `news${index}`, title: `Jev ${index}`, summary: 'Typed decisions', originalTitle: null,
  sourceName: 'Example', discoveredAt: new Date(1_700_000_000_000 + index * 1000).toISOString(),
  publishedAt: null, category: null, score: null, selected: false, reason: null,
  originalUrl: 'https://example.com/', aihotUrl: 'https://aihot.news/',
}))
test('growing history never increases the 50-record dynamic page payload', () => {
  const sizes: number[] = []
  for (const count of [100, 1000, 10000]) {
    const source = rows(count)
    const page = selectNewsPage(source, 2)
    assert.equal(page.total, count)
    assert.equal(page.items.length, 50)
    assert.equal(page.page, 2)
    assert.deepEqual(page.items, sortNews(source).slice(50, 100))
    assert.equal(source[0].id, 'news0')
    assert.equal(selectNewsPage(source, 2).items[0], page.items[0])
    sizes.push(Buffer.byteLength(JSON.stringify(page)))
  }
  assert.ok(Math.max(...sizes) < Math.min(...sizes) * 1.1)
})
test('page clamping, empty history and off-page preview stay bounded', () => {
  const source = rows(123)
  assert.equal(selectNewsPage(source, 999999).items.length, 23)
  assert.equal(selectNewsPage(source, -1).page, 1)
  const page = selectNewsPage(source, 1, 'news0')
  assert.equal(page.items.length, 50)
  assert.equal(page.preview?.id, 'news0')
  assert.equal(selectNewsPage(source, 1, 'missing').preview, null)
  assert.equal(selectNewsPage([], 2).total, 0)
  assert.deepEqual(selectNewsPage([], 2).items, [])
})
