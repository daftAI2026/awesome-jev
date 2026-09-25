import { useCallback, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useI18n, type Locale } from '@/i18n'
import { newsPath, newsTime, sortNews, type NewsItem } from '@/lib/news'
import { INTL_LOCALE, localizedPath } from '@/lib/locale-routes'
import { NewsDialog } from '@/components/NewsDialog'
import { SaveButton } from '@/components/SaveButton'
import { NEWS_CATEGORY_LABEL } from '@/lib/categories'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const INITIAL_NEWS_COUNT = 16
const NEWS_OVERSCAN = 8
const AIHOT_SEARCH = 'https://aihot.news/?q=jev&page=1'
const TIME_ZONE = 'Asia/Shanghai'
type NewsRow = { kind: 'date'; key: string; label: string } | { kind: 'item'; item: NewsItem }

function dayKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function formatDay(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: TIME_ZONE, year: 'numeric', month: 'long', day: 'numeric',
  }).format(date)
}

function formatTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
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
  const date = new Date(newsTime(item)).toISOString()
  const originalTitle = item.originalTitle && !/^https?:\/\//i.test(item.originalTitle) &&
    item.originalTitle !== item.title ? item.originalTitle : null
  const categoryLabel = item.category && item.category in NEWS_CATEGORY_LABEL
    ? t(NEWS_CATEGORY_LABEL[item.category as keyof typeof NEWS_CATEGORY_LABEL]) : item.category

  return (
    <div className="relative min-w-0 sm:grid sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-3">
      <time dateTime={date} className="hidden pt-5 text-right font-mono text-xs tabular-nums text-muted-foreground sm:block">
        {formatTime(new Date(date), locale)}
      </time>
      <a href={localizedPath(newsPath(item.id) ?? '/news', locale)} aria-haspopup="dialog"
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
    </div>
  )
}

export function NewsPanel({ items, query, savedIds, onToggleSaved, savedView = false, previewId, onPreview, onPreviewClose }: {
  items: NewsItem[]
  query: string
  savedIds: ReadonlySet<string>
  onToggleSaved: (item: NewsItem) => void
  savedView?: boolean
  previewId?: string | null
  onPreview: (item: NewsItem) => void
  onPreviewClose: () => void
}) {
  const { locale, t } = useI18n()
  const detailTriggerRef = useRef<HTMLElement | null>(null)
  const initialListRef = useRef<HTMLOListElement>(null)
  const virtualListRef = useRef<HTMLOListElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  const detailItem = items.find((item) => item.id === previewId) ?? null
  const detailOpen = detailItem !== null
  const matched = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    const filtered = term ? items.filter((item) =>
      `${item.title} ${item.originalTitle ?? ''} ${item.summary ?? ''} ${item.sourceName}`.toLocaleLowerCase().includes(term)) : items
    return sortNews(filtered)
  }, [items, query])
  const rows = useMemo(() => {
    const result: NewsRow[] = []
    let previousDay = ''
    for (const item of matched) {
      const date = new Date(newsTime(item))
      const key = dayKey(date)
      if (previousDay !== key) {
        result.push({ kind: 'date', key, label: formatDay(date, locale) })
        previousDay = key
      }
      result.push({ kind: 'item', item })
    }
    return result
  }, [matched, locale])
  const [initialRows, virtualRows] = useMemo(() => {
    const first: NewsRow[] = []
    const rest: NewsRow[] = []
    let itemCount = 0
    for (const row of rows) {
      ;(itemCount < INITIAL_NEWS_COUNT ? first : rest).push(row)
      if (row.kind === 'item') itemCount++
    }
    return [first, rest]
  }, [rows])
  const getItemKey = useCallback((index: number) => {
    const row = virtualRows[index]
    return row.kind === 'date' ? `date:${row.key}` : `news:${row.item.id}`
  }, [virtualRows])
  const virtualizer = useWindowVirtualizer({
    count: virtualRows.length,
    estimateSize: (index) => virtualRows[index].kind === 'date' ? 72 : 280,
    getItemKey,
    overscan: NEWS_OVERSCAN,
    scrollMargin,
    initialRect: { width: 1200, height: 900 },
    initialOffset: 0,
  })

  useLayoutEffect(() => {
    const initialList = initialListRef.current
    const virtualList = virtualListRef.current
    if (!initialList || !virtualList) return
    const syncMargin = () => {
      const nextMargin = virtualList.getBoundingClientRect().top + window.scrollY
      setScrollMargin((current) => Math.abs(current - nextMargin) > 1 ? nextMargin : current)
    }
    syncMargin()
    const observer = new ResizeObserver(syncMargin)
    observer.observe(initialList)
    window.addEventListener('resize', syncMargin)
    void document.fonts.ready.then(() => { if (virtualList.isConnected) syncMargin() })
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncMargin)
    }
  }, [virtualRows.length])
  const openPreview = (item: NewsItem, event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    detailTriggerRef.current = event.currentTarget
    onPreview(item)
  }
  const toggleItemSaved = (item: NewsItem) => {
    if (savedView && savedIds.has(item.id)) {
      if (detailOpen) {
        detailTriggerRef.current = document.getElementById('main')
        onPreviewClose()
      } else {
        requestAnimationFrame(() => document.getElementById('main')?.focus())
      }
    }
    onToggleSaved(item)
  }
  const rowContent = (row: NewsRow) => row.kind === 'date'
    ? <h2 className="text-base font-medium text-foreground">{row.label}</h2>
    : <NewsCard item={row.item} onPreview={openPreview}
        saved={savedIds.has(row.item.id)} onToggleSaved={toggleItemSaved} />
  const rowClass = (row: NewsRow, first: boolean) => row.kind === 'date'
    ? first ? 'pb-4' : 'pt-5 pb-4'
    : 'pb-3'

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
          <ol ref={initialListRef}>
            {initialRows.map((row, index) => <li key={row.kind === 'date' ? `date:${row.key}` : row.item.id}
              role={row.kind === 'date' ? 'presentation' : undefined} className={rowClass(row, index === 0)}>
              {rowContent(row)}
            </li>)}
          </ol>
          {virtualRows.length > 0 && <ol ref={virtualListRef} className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = virtualRows[virtualRow.index]
              return <li key={virtualRow.key} ref={virtualizer.measureElement} data-index={virtualRow.index}
                role={row.kind === 'date' ? 'presentation' : undefined}
                className={`absolute top-0 w-full ${rowClass(row, false)}`}
                style={{ transform: `translateY(${virtualRow.start - scrollMargin}px)` }}>
                {rowContent(row)}
              </li>
            })}
          </ol>}
        </>
      )}
      <NewsDialog item={detailItem} open={detailOpen} onOpenChange={(open) => { if (!open) onPreviewClose() }} triggerRef={detailTriggerRef}
        saved={detailItem ? savedIds.has(detailItem.id) : false}
        onToggleSaved={detailItem ? () => toggleItemSaved(detailItem) : undefined} />
    </section>
  )
}
