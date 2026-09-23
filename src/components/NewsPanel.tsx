import { useMemo, useState } from 'react'
import { ArrowUpRight } from '@phosphor-icons/react'
import { useI18n } from '@/i18n'
import { sortNews, type NewsItem } from '@/lib/news'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const PAGE_SIZE = 60
const AIHOT_SEARCH = 'https://aihot.news/all?q=jev&page=1'

function NewsCard({ item }: { item: NewsItem }) {
  const { locale, t } = useI18n()
  const date = item.publishedAt ?? item.discoveredAt
  const formattedDate = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(date))

  return (
    <li className="min-w-0">
      <a href={item.aihotUrl} target="_blank" rel="noopener noreferrer"
        aria-label={t('newsReadAtAihot', { title: item.title })}
        className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        <Card size="sm" className="transition-colors hover:bg-muted/60">
          <CardHeader>
            <CardTitle className="text-sm tracking-tight group-hover:underline group-hover:underline-offset-2">{item.title}</CardTitle>
            {item.summary && <CardDescription className="line-clamp-4 text-sm leading-relaxed">{item.summary}</CardDescription>}
          </CardHeader>
          <CardContent className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <span className="min-w-0 truncate" title={item.sourceName}>{item.sourceName}</span>
            <span aria-hidden>·</span>
            <time dateTime={date} className="shrink-0 tabular-nums">{formattedDate}</time>
            <ArrowUpRight className="ml-auto size-3.5 shrink-0" aria-hidden />
          </CardContent>
        </Card>
      </a>
    </li>
  )
}

export function NewsPanel({ items, query }: { items: NewsItem[]; query: string }) {
  const { t } = useI18n()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const matched = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    const filtered = term ? items.filter((item) =>
      `${item.title} ${item.summary ?? ''} ${item.sourceName}`.toLocaleLowerCase().includes(term)) : items
    return sortNews(filtered)
  }, [items, query])
  const visible = matched.slice(0, visibleCount)

  return (
    <section aria-label={t('newsLabel')}>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 text-sm text-muted-foreground">
        <p>{t('newsVia')} <a href="https://aihot.news/" target="_blank" rel="noopener noreferrer"
          className="text-foreground underline underline-offset-4">AIHOT</a></p>
        {items.length > 0 && <span className="tabular-nums">{t('resultCountPlural', { count: matched.length })}</span>}
      </div>
      {items.length === 0 ? (
        <p className="py-10 text-sm text-muted-foreground">
          {t('newsPending')}{' '}
          <a href={AIHOT_SEARCH} target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4">{t('newsBrowseSource')}</a>
        </p>
      ) : matched.length === 0 ? (
        <p className="py-10 text-sm text-muted-foreground">{t('emptySearch')}</p>
      ) : (
        <>
          <ul className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => <NewsCard key={item.id} item={item} />)}
          </ul>
          {visibleCount < matched.length && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>{t('newsShowMore')}</Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
