export interface NewsItem {
  id: string
  title: string
  summary: string | null
  sourceName: string
  publishedAt: string | null
  discoveredAt: string
  originalUrl: string
  aihotUrl: string
}

export function newsTime(item: NewsItem): number {
  return Date.parse(item.publishedAt ?? item.discoveredAt)
}

export function sortNews(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => newsTime(b) - newsTime(a) || a.id.localeCompare(b.id))
}
