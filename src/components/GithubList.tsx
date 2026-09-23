import { Star } from '@phosphor-icons/react'
import { memo, type MouseEvent } from 'react'
import type { DirectoryItem } from '@/lib/types'
import { useI18n } from '@/i18n'
import { SaveButton } from '@/components/SaveButton'

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
  const stars = item.sourceMeta.stars
  const repo = item.sourceMeta.repo
  return (
    <li className="relative">
      <a href={item.url} target="_blank" rel="noopener noreferrer"
        aria-haspopup={onPreview ? 'dialog' : undefined}
        onClick={onPreview ? (event) => onPreview(item, event) : undefined}
        className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-2 py-3 pr-14 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
      {onToggleSaved && <SaveButton saved={saved} onToggle={() => onToggleSaved(item)}
        className="absolute top-1/2 right-1 z-10 -translate-y-1/2" />}
    </li>
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

  return (
    <div>
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-2 pb-2 pr-14 text-xs text-muted-foreground">
        <span>{t('githubColRank')}</span>
        <span>{t('githubColProject')}</span>
        <span className="text-right">{t('sortStars')}</span>
      </div>
      <ul>
        {items.map((item) => <GithubListRow key={item.id} item={item} rank={ranks.get(item.id)}
          saved={savedIds?.has(item.id) ?? false} onPreview={onPreview} onToggleSaved={onToggleSaved} />)}
      </ul>
    </div>
  )
}
