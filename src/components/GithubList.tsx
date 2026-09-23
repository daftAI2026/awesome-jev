import { Star } from '@phosphor-icons/react'
import type { DirectoryItem } from '@/lib/types'
import { useI18n } from '@/i18n'

function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

export function GithubList({
  items,
  ranks,
}: {
  items: DirectoryItem[]
  ranks: Map<string, number>
}) {
  const { t } = useI18n()

  return (
    <div>
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-2 pb-2 text-xs text-muted-foreground">
        <span>{t('githubColRank')}</span>
        <span>{t('githubColProject')}</span>
        <span className="text-right">{t('sortStars')}</span>
      </div>
      <ul>
        {items.map((item) => {
          const rank = ranks.get(item.id)
          const stars = item.sourceMeta.stars
          const repo = item.sourceMeta.repo
          return (
            <li key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-2 py-3 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  {rank ?? '—'}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  {repo ? (
                    <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                      {repo}
                    </span>
                  ) : null}
                </span>
                <span className="inline-flex items-center justify-end gap-1 text-sm tabular-nums text-muted-foreground">
                  <Star className="size-3 shrink-0" weight="fill" aria-hidden />
                  {stars != null ? formatCount(stars) : '—'}
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
