export interface NewsItem {
  id: string
  title: string
  originalTitle: string | null
  summary: string | null
  sourceName: string
  publishedAt: string | null
  discoveredAt: string
  category: string | null
  score: number | null
  selected: boolean
  reason: string | null
  originalUrl: string
  aihotUrl: string
}

export function newsPreviewSearch(search: Record<string, unknown>): { preview?: string } {
  return { preview: typeof search.preview === 'string' && search.preview.length > 0 && search.preview.length <= 200
    ? search.preview : undefined }
}

const BACKFILL_THRESHOLD_MS = 72 * 60 * 60 * 1000

export function newsTime(item: NewsItem): number {
  const discovered = Date.parse(item.discoveredAt)
  const published = item.publishedAt ? Date.parse(item.publishedAt) : discovered
  return discovered - published > BACKFILL_THRESHOLD_MS ? published : discovered
}

export function sortNews(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => newsTime(b) - newsTime(a) || b.id.localeCompare(a.id))
}
