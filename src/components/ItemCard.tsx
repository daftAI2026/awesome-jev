import type { ReactNode } from 'react'
import {
  Bookmark,
  Bug,
  ChatCircle,
  GitFork,
  GithubLogo,
  Heart,
  Play,
  Repeat,
  Star,
} from '@phosphor-icons/react'
import { cn } from 'cn'
import type { DirectoryItem } from '@/lib/types'
import { TweetBody } from '@/components/TweetBody'
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
}

function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

function formatCompact(n: number): string {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

function TweetStat({
  label,
  count,
  icon,
}: {
  label: string
  count: number | null | undefined
  icon: ReactNode
}) {
  const n = count ?? 0
  return (
    <span
      className="inline-flex min-w-0 items-center gap-1 tabular-nums"
      aria-label={n > 0 ? `${label}: ${n.toLocaleString('en-US')}` : label}
    >
      {icon}
      {n > 0 ? <span aria-hidden>{formatCompact(n)}</span> : null}
    </span>
  )
}

function GithubCard({ item, rank }: ItemCardProps) {
  const { t } = useI18n()
  const meta = item.sourceMeta
  const metaBits: string[] = []

  if (meta.repo) metaBits.push(meta.repo)
  if (meta.language) metaBits.push(meta.language)

  const hasMetrics =
    meta.stars != null || meta.forks != null || meta.openIssues != null

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card size="sm" className="h-full transition-colors hover:bg-muted/60">
        <CardHeader>
          <CardTitle className="flex min-w-0 items-start gap-2 text-sm tracking-tight group-hover:underline group-hover:underline-offset-2">
            <GithubLogo
              className="mt-1 size-3.5 shrink-0 text-muted-foreground"
              weight="fill"
              aria-hidden
            />
            <span className="min-w-0">{item.title}</span>
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {item.summary}
          </CardDescription>
          {rank != null ? (
            <CardAction>
              <Badge
                variant="outline"
                className="rounded-lg font-mono font-normal tabular-nums text-muted-foreground"
                aria-label={t('githubStarRank', { rank })}
              >
                {rank}
              </Badge>
            </CardAction>
          ) : null}
        </CardHeader>
        {(metaBits.length > 0 || hasMetrics || (item.tags ?? []).length > 0) && (
          <CardContent className="mt-auto space-y-2">
            {metaBits.length > 0 && (
              <p className="font-mono text-xs tabular-nums leading-relaxed text-muted-foreground">
                {metaBits.join(' · ')}
              </p>
            )}
            {hasMetrics && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-muted-foreground">
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
                {meta.openIssues != null && (
                  <span className="inline-flex items-center gap-1">
                    <Bug className="size-3 shrink-0" weight="fill" aria-hidden />
                    {formatCount(meta.openIssues)}
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
    </a>
  )
}

/** X post card. Body links stay clickable; the permalink is the header/media. */
function SocialCard({ item }: ItemCardProps) {
  const { t } = useI18n()
  const meta = item.sourceMeta
  const handle = meta.handle
    ? meta.handle.startsWith('@')
      ? meta.handle
      : `@${meta.handle}`
    : null
  const displayName = meta.author?.trim() || null
  const preview =
    meta.mediaUrls && meta.mediaUrls.length > 0 ? meta.mediaUrls[0] : null
  const video =
    meta.videoUrls && meta.videoUrls.length > 0 ? meta.videoUrls[0] : null
  const body = item.summary || item.title
  const avatar = meta.avatarUrl

  return (
    <Card
      size="sm"
      className="overflow-hidden transition-colors hover:bg-muted/60"
    >
      <CardHeader className="pb-0">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {avatar ? (
            <img
              src={avatar}
              alt=""
              width={32}
              height={32}
              loading="lazy"
              className="size-8 shrink-0 rounded-full bg-muted"
            />
          ) : null}
          <span className="min-w-0">
            {displayName ? (
              <span className="block truncate font-medium text-foreground">
                {displayName}
              </span>
            ) : null}
            <span className="flex flex-wrap items-center gap-1">
              {handle ? (
                <span className={displayName ? undefined : 'font-medium text-foreground'}>
                  {handle}
                </span>
              ) : null}
              {handle && meta.date ? (
                <span aria-hidden className="text-muted-foreground/60">
                  ·
                </span>
              ) : null}
              {meta.date ? (
                <time className="font-mono tabular-nums" dateTime={meta.date}>
                  {meta.date}
                </time>
              ) : null}
            </span>
          </span>
        </a>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        <TweetBody text={body} />
        {video ? (
          <video
            className="block h-auto w-full overflow-hidden rounded-lg border border-border bg-muted"
            controls
            playsInline
            preload="metadata"
            poster={preview ?? undefined}
          >
            <source src={video} type="video/mp4" />
          </video>
        ) : preview ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img
              src={preview}
              alt=""
              loading="lazy"
              className="block h-auto w-full"
            />
          </a>
        ) : null}
        <p
          className="flex items-center justify-between gap-2 text-xs text-muted-foreground"
          aria-label={t('tweetEngagement')}
        >
          <TweetStat
            label={t('tweetReplies')}
            count={meta.replies}
            icon={<ChatCircle className="size-3.5 shrink-0" weight="fill" aria-hidden />}
          />
          <TweetStat
            label={t('tweetReposts')}
            count={meta.retweets}
            icon={<Repeat className="size-3.5 shrink-0" weight="fill" aria-hidden />}
          />
          <TweetStat
            label={t('tweetLikes')}
            count={meta.likes}
            icon={<Heart className="size-3.5 shrink-0" weight="fill" aria-hidden />}
          />
          <TweetStat
            label={t('tweetBookmarks')}
            count={meta.bookmarks}
            icon={<Bookmark className="size-3.5 shrink-0" weight="fill" aria-hidden />}
          />
        </p>
      </CardContent>
    </Card>
  )
}

function XCard({ item }: ItemCardProps) {
  return <SocialCard item={item} />
}

function YoutubeCard({ item }: ItemCardProps) {
  const meta = item.sourceMeta
  const videoId = meta.videoId
  const preview =
    meta.mediaUrls && meta.mediaUrls.length > 0
      ? meta.mediaUrls[0]
      : videoId
        ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        : null
  const channel = meta.handle || meta.author
  const views = meta.views

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card
        size="sm"
        className={cn(
          'overflow-hidden transition-colors hover:bg-muted/60',
          preview && 'pt-0',
        )}
      >
        {preview && (
          <div className="relative overflow-hidden bg-muted">
            <img
              src={preview}
              alt=""
              loading="lazy"
              className="block aspect-video h-auto w-full object-cover"
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="flex size-10 items-center justify-center rounded-lg bg-background/90 text-foreground">
                <Play className="size-4" weight="fill" aria-hidden />
              </span>
            </span>
          </div>
        )}
        <CardHeader className="gap-2">
          <CardTitle className="text-sm leading-snug">{item.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {channel && <span className="text-foreground">{channel}</span>}
            {meta.date && (
              <time className="font-mono tabular-nums" dateTime={meta.date}>
                {meta.date.slice(0, 10)}
              </time>
            )}
            {views != null && (
              <span className="font-mono tabular-nums">
                {views.toLocaleString('en-US')}
              </span>
            )}
          </div>
        </CardHeader>
        {item.summary ? (
          <CardContent>
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {item.summary}
            </p>
          </CardContent>
        ) : null}
      </Card>
    </a>
  )
}

export function ItemCard({ item, rank }: ItemCardProps) {
  if (item.type === 'x') {
    return <XCard item={item} />
  }
  if (item.type === 'youtube') {
    return <YoutubeCard item={item} />
  }
  return <GithubCard item={item} rank={rank} />
}
