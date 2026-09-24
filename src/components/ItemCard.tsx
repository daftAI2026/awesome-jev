import { memo, type MouseEvent } from 'react'
import { GitFork, GithubLogo, Star } from '@phosphor-icons/react'
import { cn } from 'cn'
import type { DirectoryItem } from '@/lib/types'
import { projectPathFromUrl } from '@/lib/project-routes'
import { localizedPath } from '@/lib/locale-routes'
import { SaveButton } from '@/components/SaveButton'
import { FeaturedProjectBorder } from '@/components/FeaturedProjectBorder'
import { useI18n } from '@/i18n'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ItemCardProps {
  item: DirectoryItem
  rank?: number
  onPreview?: (item: DirectoryItem, event: MouseEvent<HTMLAnchorElement>) => void
  saved?: boolean
  onToggleSaved?: (item: DirectoryItem) => void
}

function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

function GithubCard({ item, rank, onPreview, saved = false, onToggleSaved }: ItemCardProps) {
  const { locale, t } = useI18n()
  const meta = item.sourceMeta
  const metaBits: string[] = []

  if (meta.repo) metaBits.push(meta.repo)
  if (meta.language) metaBits.push(meta.language)

  const hasMetrics = meta.stars != null || meta.forks != null
  const projectPath = projectPathFromUrl(item.url)
  const projectHref = projectPath ? localizedPath(projectPath, locale) : item.url
  const featured = meta.stars != null && meta.stars > 1000

  const card = (
      <Card size="sm" className={cn('transition-colors group-hover:bg-muted/60', featured && 'ring-0')}>
        <CardHeader className="gap-y-3">
          <CardTitle className="flex min-w-0 items-start gap-2 text-sm tracking-tight">
            {rank != null ? (
              <Badge
                variant="outline"
                className="rounded-lg font-mono font-normal tabular-nums text-muted-foreground"
                aria-label={t('githubStarRank', { rank })}
              >
                {rank}
              </Badge>
            ) : (
              <GithubLogo className="mt-1 size-3.5 shrink-0 text-muted-foreground" weight="fill" aria-hidden />
            )}
            <span className="min-w-0">
              <a
                href={projectHref}
                aria-haspopup={onPreview ? 'dialog' : undefined}
                onClick={onPreview ? (event) => onPreview(item, event) : undefined}
                className="group-hover:underline group-hover:underline-offset-2 after:absolute after:inset-0 after:z-[1] after:rounded-xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-background"
              >
                {item.title}
              </a>
            </span>
          </CardTitle>
          {onToggleSaved && (
            <CardAction className="relative z-10 row-span-1 w-8 self-stretch">
              <SaveButton saved={saved} compact onToggle={() => onToggleSaved(item)}
                className="absolute top-1/2 -right-2 -translate-y-1/2" />
            </CardAction>
          )}
          <CardDescription className={cn('text-sm leading-relaxed', onToggleSaved && 'col-span-2')}>
            {item.summary}
          </CardDescription>
        </CardHeader>
        {(metaBits.length > 0 || hasMetrics || (item.tags ?? []).length > 0) && (
          <CardContent className="space-y-3">
            {metaBits.length > 0 && (
              <p className="font-mono text-xs tabular-nums leading-relaxed text-muted-foreground">
                {metaBits.join(' · ')}
              </p>
            )}
            {hasMetrics && (
              <div className="flex flex-nowrap items-center gap-3 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                {meta.stars != null && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3 shrink-0" weight="fill" aria-hidden />
                    {formatCount(meta.stars)}
                  </span>
                )}
                {meta.forks != null && (
                  <span className="inline-flex items-center gap-1">
                    <GitFork className="size-3 shrink-0" weight="fill" aria-hidden />
                    {formatCount(meta.forks)}
                  </span>
                )}
              </div>
            )}
            {(item.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(item.tags ?? []).map((tag) => (
                  <Badge key={tag} variant="outline" className="font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
  )

  return featured
    ? <FeaturedProjectBorder>{card}</FeaturedProjectBorder>
    : <div className="group relative">{card}</div>
}

export const ItemCard = memo(function ItemCard({ item, rank, onPreview, saved, onToggleSaved }: ItemCardProps) {
  return <GithubCard item={item} rank={rank} onPreview={onPreview} saved={saved} onToggleSaved={onToggleSaved} />
})
