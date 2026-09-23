import { useMemo, useRef, useState, type MouseEvent } from 'react'
import { useI18n, type Locale } from '@/i18n'
import { newsTime, sortNews, type NewsItem } from '@/lib/news'
import { NewsDialog } from '@/components/NewsDialog'
import { SaveButton } from '@/components/SaveButton'
import { NEWS_CATEGORY_LABEL } from '@/lib/categories'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const PAGE_SIZE = 60
const AIHOT_SEARCH = 'https://aihot.news/all?q=jev&page=1'
const TIME_ZONE = 'Asia/Shanghai'

function dayKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function formatDay(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    timeZone: TIME_ZONE, year: 'numeric', month: 'long', day: 'numeric',
  }).format(date)
}

function formatTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date)
}

function NewsCard({ item, onPreview, saved, onToggleSaved }: {
  item: NewsItem
  onPreview: (item: NewsItem, event: MouseEvent<HTMLAnchorElement>) => void
  saved: boolean
  onToggleSaved: (item: NewsItem) => void
}) {
  const { locale, t } = useI18n()
  const date = item.publishedAt ?? item.discoveredAt
  const originalTitle = item.originalTitle && !/^https?:\/\//i.test(item.originalTitle) &&
    item.originalTitle !== item.title ? item.originalTitle : null
  const categoryLabel = item.category && item.category in NEWS_CATEGORY_LABEL
    ? t(NEWS_CATEGORY_LABEL[item.category as keyof typeof NEWS_CATEGORY_LABEL]) : item.category

  return (
    <li className="relative min-w-0 sm:grid sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-3">
      <time dateTime={date} className="hidden pt-5 text-right font-mono text-xs tabular-nums text-muted-foreground sm:block">
        {formatTime(new Date(date), locale)}
      </time>
      <a href={item.aihotUrl} target="_blank" rel="noopener noreferrer" aria-haspopup="dialog"
        aria-label={t('newsPreview', { title: item.title })}
        onClick={(event) => onPreview(item, event)}
        className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        <Card className="gap-4 p-4 transition-colors hover:bg-muted/60 sm:p-5">
          <CardHeader className="gap-4 p-0 pr-8">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="min-w-0 font-medium text-foreground">{item.sourceName}</span>
              <time dateTime={date} className="font-mono tabular-nums sm:hidden">{formatTime(new Date(date), locale)}</time>
              {item.selected && <span>{t('newsSelected')}</span>}
              {item.score != null && <span className="ml-auto shrink-0 tabular-nums">{t('newsScore', { score: item.score })}</span>}
            </div>
            <CardTitle className="text-lg leading-snug group-hover:underline group-hover:underline-offset-2">
              {item.title}
            </CardTitle>
          </CardHeader>
          {(item.summary || originalTitle || item.reason) && (
            <CardContent className="space-y-4 p-0">
              {item.summary && <p className="max-w-prose whitespace-pre-line break-words text-base leading-relaxed text-foreground">{item.summary}</p>}
              {originalTitle && <div className="max-w-prose border-l-2 border-border pl-3">
                <p className="text-xs font-medium text-muted-foreground">{t('newsOriginalTitle')}</p>
                <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">{originalTitle}</p>
              </div>}
              {item.reason && <div className="max-w-prose">
                <p className="text-xs font-medium text-muted-foreground">{t('newsReason')}</p>
                <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">{item.reason}</p>
              </div>}
            </CardContent>
          )}
          {item.category && <div className="flex items-center text-xs text-muted-foreground">
            <Badge variant="outline" className="font-normal text-muted-foreground">{categoryLabel}</Badge>
          </div>}
        </Card>
      </a>
      <SaveButton saved={saved} compact onToggle={() => onToggleSaved(item)}
        className="absolute top-2 right-2 z-10 sm:top-3 sm:right-3" />
    </li>
  )
}

export function NewsPanel({ items, query, savedIds, onToggleSaved, savedView = false }: {
  items: NewsItem[]
  query: string
  savedIds: ReadonlySet<string>
  onToggleSaved: (item: NewsItem) => void
  savedView?: boolean
}) {
  const { locale, t } = useI18n()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [detailItem, setDetailItem] = useState<NewsItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const detailTriggerRef = useRef<HTMLElement | null>(null)
  const matched = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    const filtered = term ? items.filter((item) =>
      `${item.title} ${item.originalTitle ?? ''} ${item.summary ?? ''} ${item.sourceName}`.toLocaleLowerCase().includes(term)) : items
    return sortNews(filtered)
  }, [items, query])
  const visible = matched.slice(0, visibleCount)
  const groups = useMemo(() => {
    const result: { key: string; label: string; items: NewsItem[] }[] = []
    for (const item of visible) {
      const date = new Date(newsTime(item))
      const key = dayKey(date)
      let group = result[result.length - 1]
      if (group?.key !== key) {
        group = { key, label: formatDay(date, locale), items: [] }
        result.push(group)
      }
      group.items.push(item)
    }
    return result
  }, [visible, locale])
  const openPreview = (item: NewsItem, event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    detailTriggerRef.current = event.currentTarget
    setDetailItem(item)
    setDetailOpen(true)
  }
  const toggleItemSaved = (item: NewsItem) => {
    if (savedView && savedIds.has(item.id)) {
      if (detailOpen) {
        detailTriggerRef.current = document.getElementById('main')
        setDetailOpen(false)
      } else {
        requestAnimationFrame(() => document.getElementById('main')?.focus())
      }
    }
    onToggleSaved(item)
  }

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
          <ol className="space-y-8">
            {groups.map((group) => (
              <li key={group.key}>
                <h2 className="mb-4 text-base font-medium text-foreground">{group.label}</h2>
                <ol className="space-y-3">{group.items.map((item) =>
                  <NewsCard key={item.id} item={item} onPreview={openPreview}
                    saved={savedIds.has(item.id)} onToggleSaved={toggleItemSaved} />)}</ol>
              </li>
            ))}
          </ol>
          {visibleCount < matched.length && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>{t('newsShowMore')}</Button>
            </div>
          )}
        </>
      )}
      <NewsDialog item={detailItem} open={detailOpen} onOpenChange={setDetailOpen} triggerRef={detailTriggerRef}
        saved={detailItem ? savedIds.has(detailItem.id) : false}
        onToggleSaved={detailItem ? () => toggleItemSaved(detailItem) : undefined} />
    </section>
  )
}
