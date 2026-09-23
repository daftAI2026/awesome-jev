import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'
import type { NewsItem } from '../src/lib/news.ts'

const API = 'https://aihot.news/api/v1/items'
const PAGE_SIZE = 100
const MAX_PAGES = 15
const MIN_REQUEST_INTERVAL_MS = 60_000
const MAX_RETRY_WAIT_MS = 10 * 60_000
const DATA_FILE = 'data/news.json'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function requireText(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`Invalid ${label}`)
  return value.trim()
}

function requireDate(value: unknown, label: string): string {
  const text = requireText(value, label, 40)
  if (!Number.isFinite(Date.parse(text))) throw new Error(`Invalid ${label}`)
  return text
}

function requireUrl(value: unknown, label: string): string {
  const text = requireText(value, label, 2048)
  const url = new URL(text)
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`Unsafe ${label}`)
  return url.href
}

function originalKey(url: string): string {
  const parsed = new URL(url)
  parsed.hash = ''
  return parsed.href.replace(/\/$/, '')
}

export function parseNewsItem(value: unknown): NewsItem {
  if (!isRecord(value) || !isRecord(value.source) || !isRecord(value.links)) throw new Error('Invalid AIHOT item')
  const id = requireText(value.id, 'news id', 64)
  if (!/^[a-z0-9]+$/.test(id)) throw new Error('Invalid news id')
  const aihotUrl = requireUrl(value.links.aihot, 'AIHOT URL')
  const aihot = new URL(aihotUrl)
  if (aihot.origin !== 'https://aihot.news' || aihot.pathname !== `/items/${id}` || aihot.search || aihot.hash) {
    throw new Error('Unexpected AIHOT item URL')
  }
  if (typeof value.selected !== 'boolean') throw new Error('Invalid news selection state')
  return {
    id,
    title: requireText(value.title, 'news title', 500),
    originalTitle: value.originalTitle == null ? null : requireText(value.originalTitle, 'original title', 2000),
    summary: value.summary == null ? null : requireText(value.summary, 'news summary', 2000),
    sourceName: requireText(value.source.name, 'news source', 200),
    publishedAt: value.publishedAt == null ? null : requireDate(value.publishedAt, 'publication date'),
    discoveredAt: requireDate(value.discoveredAt, 'discovery date'),
    category: value.category == null ? null : requireText(value.category, 'news category', 80),
    score: value.score == null ? null : requireScore(value.score),
    selected: value.selected,
    reason: value.reason == null ? null : requireText(value.reason, 'recommendation reason', 2000),
    originalUrl: requireUrl(value.links.original, 'original URL'),
    aihotUrl,
  }
}

function requireScore(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error('Invalid news score')
  }
  return value
}

export function validateNews(value: unknown): NewsItem[] {
  if (!Array.isArray(value)) throw new Error('News store must be an array')
  const ids = new Set<string>()
  const originals = new Set<string>()
  return value.map((candidate) => {
    if (!isRecord(candidate)) throw new Error('Invalid stored news item')
    const item = parseNewsItem({
      ...candidate,
      source: { name: candidate.sourceName },
      links: { original: candidate.originalUrl, aihot: candidate.aihotUrl },
    })
    const original = originalKey(item.originalUrl)
    if (ids.has(item.id) || originals.has(original)) throw new Error('Duplicate stored news item')
    ids.add(item.id)
    originals.add(original)
    return item
  })
}

export function mergeNews(existing: NewsItem[], incoming: NewsItem[]): { items: NewsItem[]; added: number; updated: number } {
  const items = [...existing]
  const byId = new Map(items.map((item, index) => [item.id, index]))
  const originals = new Set(items.map((item) => originalKey(item.originalUrl)))
  let added = 0
  let updated = 0
  for (const item of incoming) {
    const index = byId.get(item.id)
    if (index !== undefined) {
      if (originalKey(items[index].originalUrl) !== originalKey(item.originalUrl)) {
        throw new Error(`News identity changed: ${item.id}`)
      }
      if (JSON.stringify(items[index]) !== JSON.stringify(item)) {
        items[index] = item
        updated++
      }
    } else if (!originals.has(originalKey(item.originalUrl))) {
      byId.set(item.id, items.length)
      originals.add(originalKey(item.originalUrl))
      items.push(item)
      added++
    }
  }
  return { items, added, updated }
}

function retryDelay(response: Response): number {
  const header = response.headers.get('Retry-After')
  if (!header) return MIN_REQUEST_INTERVAL_MS
  const seconds = Number(header)
  const milliseconds = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - Date.now()
  return Math.max(MIN_REQUEST_INTERVAL_MS, Number.isFinite(milliseconds) ? milliseconds : MIN_REQUEST_INTERVAL_MS)
}

export async function collectNews(
  fetchImpl: typeof fetch = fetch,
  wait: (milliseconds: number) => Promise<unknown> = sleep,
): Promise<NewsItem[]> {
  const collected: NewsItem[] = []
  const seenCursors = new Set<string>()
  let cursor: string | null = null
  for (let page = 0; page < MAX_PAGES; page++) {
    if (page > 0) await wait(MIN_REQUEST_INTERVAL_MS)
    const url = new URL(API)
    url.searchParams.set('mode', 'all')
    url.searchParams.set('window', '7d')
    url.searchParams.set('by', 'timeline')
    url.searchParams.set('q', 'Jev')
    url.searchParams.set('limit', String(PAGE_SIZE))
    if (cursor) url.searchParams.set('cursor', cursor)
    let response: Response
    for (let attempt = 0; ; attempt++) {
      response = await fetchImpl(url, {
        headers: { 'User-Agent': 'awesome-jev/1.0 (https://github.com/daftAI2026/awesome-jev)' },
        signal: AbortSignal.timeout(20_000),
      })
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt > 0) break
      const delay = response.status === 429 ? retryDelay(response) : MIN_REQUEST_INTERVAL_MS
      if (delay > MAX_RETRY_WAIT_MS) throw new Error(`AIHOT API returned ${response.status}; retry deferred to next run`)
      await wait(delay)
    }
    if (!response.ok) throw new Error(`AIHOT API returned ${response.status}`)
    const body: unknown = await response.json()
    if (!isRecord(body) || body.schemaVersion !== 1 || !Array.isArray(body.items) || !isRecord(body.page) ||
      typeof body.page.hasMore !== 'boolean') throw new Error('Invalid AIHOT response')
    collected.push(...body.items.map(parseNewsItem))
    if (!body.page.hasMore) return collected
    const next = requireText(body.page.nextCursor, 'news cursor', 4096)
    if (seenCursors.has(next)) throw new Error('Repeated AIHOT cursor')
    seenCursors.add(next)
    cursor = next
  }
  throw new Error('AIHOT page limit reached; refusing partial sync')
}

export async function syncNews(
  root = process.cwd(),
  fetchImpl: typeof fetch = fetch,
  wait: (milliseconds: number) => Promise<unknown> = sleep,
): Promise<{ added: number; updated: number }> {
  const path = resolve(root, DATA_FILE)
  const existing = validateNews(JSON.parse(readFileSync(path, 'utf8')) as unknown)
  const incoming = await collectNews(fetchImpl, wait)
  const result = mergeNews(existing, incoming)
  validateNews(result.items)
  if (result.added || result.updated) {
    const temporary = `${path}.${process.pid}.tmp`
    writeFileSync(temporary, `${JSON.stringify(result.items, null, 2)}\n`)
    renameSync(temporary, path)
  }
  return { added: result.added, updated: result.updated }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv[2] === '--check') {
    validateNews(JSON.parse(readFileSync(resolve(DATA_FILE), 'utf8')) as unknown)
    process.stdout.write('news store valid\n')
  } else if (process.env.AIHOT_NEWS_ENABLED !== 'true') {
    process.stderr.write('AIHOT_NEWS_ENABLED must be true before publishing AIHOT content\n')
    process.exitCode = 1
  } else {
    syncNews().then(({ added, updated }) => {
      process.stdout.write(`AIHOT news: ${added} added, ${updated} updated\n`)
    }).catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.message : 'news sync failed'}\n`)
      process.exitCode = 1
    })
  }
}
