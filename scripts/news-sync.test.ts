import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { collectNews, mergeNews, parseNewsItem, syncNews, validateNews } from './news-sync.ts'

function remote(id: string, original = `https://example.com/${id}`, title = id) {
  return {
    id,
    title,
    originalTitle: `Original ${id}`,
    summary: `Summary for ${id}`,
    source: { name: 'Example News' },
    links: { aihot: `https://aihot.news/items/${id}`, original },
    publishedAt: '2026-09-23T10:00:00.000Z',
    discoveredAt: '2026-09-23T10:10:00.000Z',
    category: 'ai-products',
    score: 68,
    selected: true,
    reason: `Reason for ${id}`,
  }
}

function page(items: unknown[], hasMore = false, nextCursor: string | null = null): Response {
  return Response.json({ schemaVersion: 1, items, page: { hasMore, nextCursor } })
}

test('window pagination keeps opaque cursor within one run', async () => {
  const urls: string[] = []
  const fakeFetch = (async (input: string | URL | Request) => {
    const url = new URL(String(input))
    urls.push(url.href)
    return url.searchParams.has('cursor') ? page([remote('news0002')]) : page([remote('news0001')], true, 'opaque-cursor')
  }) as typeof fetch
  const items = await collectNews(fakeFetch)
  assert.deepEqual(items.map((item) => item.id), ['news0001', 'news0002'])
  assert.equal(new URL(urls[0]).searchParams.get('q'), 'Jev')
  assert.equal(new URL(urls[0]).searchParams.get('mode'), 'all')
  assert.equal(new URL(urls[1]).searchParams.get('cursor'), 'opaque-cursor')
})

test('merge appends new IDs, updates known IDs, and ignores duplicate original URLs', () => {
  const first = parseNewsItem(remote('news0001'))
  const result = mergeNews([first], [
    parseNewsItem(remote('news0001', first.originalUrl, 'Edited title')),
    parseNewsItem(remote('news0002', first.originalUrl)),
    parseNewsItem(remote('news0003')),
  ])
  assert.deepEqual({ added: result.added, updated: result.updated }, { added: 1, updated: 1 })
  assert.deepEqual(result.items.map((item) => item.id), ['news0001', 'news0003'])
  assert.equal(result.items[0].title, 'Edited title')
  assert.equal(result.items[0].score, 68)
  assert.deepEqual(mergeNews(result.items, result.items), { items: result.items, added: 0, updated: 0 })
})

test('rejects unsafe URLs, duplicate records, and incomplete pagination', async () => {
  assert.throws(() => parseNewsItem(remote('news0001', 'javascript:alert(1)')))
  assert.throws(() => parseNewsItem({ ...remote('news0001'), score: 101 }), /score/)
  assert.throws(() => parseNewsItem({ ...remote('news0001'), selected: 'true' }), /selection/)
  assert.throws(() => parseNewsItem({ ...remote('news0001'), links: { original: 'https://example.com', aihot: 'https://evil.example/items/news0001' } }))
  const item = parseNewsItem(remote('news0001'))
  assert.throws(() => validateNews([item, item]), /Duplicate/)
  const repeated = (async () => page([remote('news0001')], true, 'same-cursor')) as typeof fetch
  await assert.rejects(collectNews(repeated), /Repeated AIHOT cursor/)
})

test('failed fetch keeps the previous checked-in snapshot intact', async () => {
  const root = mkdtempSync(join(tmpdir(), 'awesome-jev-news-'))
  try {
    mkdirSync(join(root, 'data'))
    const path = join(root, 'data/news.json')
    const previous = `${JSON.stringify([parseNewsItem(remote('news0001'))], null, 2)}\n`
    writeFileSync(path, previous)
    const failure = (async () => new Response('', { status: 429 })) as typeof fetch
    await assert.rejects(syncNews(root, failure), /429/)
    assert.equal(readFileSync(path, 'utf8'), previous)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
