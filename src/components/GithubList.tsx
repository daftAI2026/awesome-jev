import { Star } from '@phosphor-icons/react'
import { memo, useCallback, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import type { DirectoryItem } from '@/lib/types'
import { projectPathFromUrl } from '@/lib/project-routes'
import { localizedPath } from '@/lib/locale-routes'
import { useI18n } from '@/i18n'
import { SaveButton } from '@/components/SaveButton'

const LIST_ESTIMATE_SIZE = 64
const LIST_OVERSCAN = 12

function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

const GithubListRow = memo(function GithubListRow({ item, rank, saved, onPreview, onToggleSaved }: {
  item: DirectoryItem
  rank?: number
  saved: boolean
  onPreview?: (item: DirectoryItem, event: MouseEvent<HTMLAnchorElement>) => void
  onToggleSaved?: (item: DirectoryItem) => void
}) {
  const { locale } = useI18n()
  const stars = item.sourceMeta.stars
  const repo = item.sourceMeta.repo
  const projectPath = projectPathFromUrl(item.url)
  return (
    <div className="relative">
      <a href={projectPath ? localizedPath(projectPath, locale) : item.url}
        aria-haspopup={onPreview ? 'dialog' : undefined}
        onClick={onPreview ? (event) => onPreview(item, event) : undefined}
        className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-2 py-3 pr-10 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{rank ?? '—'}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
          {repo && <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">{repo}</span>}
        </span>
        <span className="inline-flex items-center justify-end gap-1 text-sm tabular-nums text-muted-foreground">
          <Star className="size-3 shrink-0" weight="fill" aria-hidden />
          {stars != null ? formatCount(stars) : '—'}
        </span>
      </a>
      {onToggleSaved && <SaveButton saved={saved} compact onToggle={() => onToggleSaved(item)}
        className="absolute top-1/2 right-0 z-10 -translate-y-1/2" />}
    </div>
  )
})

export function GithubList({
  items,
  ranks,
  onPreview,
  savedIds,
  onToggleSaved,
}: {
  items: DirectoryItem[]
  ranks: Map<string, number>
  onPreview?: (item: DirectoryItem, event: MouseEvent<HTMLAnchorElement>) => void
  savedIds?: ReadonlySet<string>
  onToggleSaved?: (item: DirectoryItem) => void
}) {
  const { t } = useI18n()
  const listRef = useRef<HTMLUListElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  const getItemKey = useCallback((index: number) => items[index].id, [items])
  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => LIST_ESTIMATE_SIZE,
    getItemKey,
    overscan: LIST_OVERSCAN,
    scrollMargin,
    initialRect: { width: 1200, height: 900 },
    initialOffset: 0,
  })

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const syncMargin = () => {
      const nextMargin = list.getBoundingClientRect().top + window.scrollY
      setScrollMargin((current) => Math.abs(current - nextMargin) > 1 ? nextMargin : current)
    }
    syncMargin()
    window.addEventListener('resize', syncMargin)
    return () => window.removeEventListener('resize', syncMargin)
  }, [])

  return (
    <div>
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-2 pb-2 pr-10 text-xs text-muted-foreground">
        <span>{t('githubColRank')}</span>
        <span>{t('githubColProject')}</span>
        <span className="text-right">{t('sortStars')}</span>
      </div>
      <ul ref={listRef} className="virtual-list relative" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index]
          return <li key={item.id} ref={virtualizer.measureElement} data-index={virtualItem.index}
            className="absolute top-0 w-full"
            style={{ transform: `translateY(${virtualItem.start - scrollMargin}px)` }}>
            <GithubListRow item={item} rank={ranks.get(item.id)}
              saved={savedIds?.has(item.id) ?? false} onPreview={onPreview} onToggleSaved={onToggleSaved} />
          </li>
        })}
      </ul>
    </div>
  )
}
