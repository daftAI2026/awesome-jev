import type { DirectoryItem } from '@/lib/types'

interface ItemRowProps {
  item: DirectoryItem
}

export function ItemRow({ item }: ItemRowProps) {
  const isGithub = item.type === 'github'
  const metaBits: string[] = []
  const meta = item.sourceMeta

  if (isGithub) {
    if (meta.repo) metaBits.push(meta.repo)
    if (meta.language) metaBits.push(meta.language)
    if (meta.stars != null) {
      metaBits.push(`${meta.stars.toLocaleString('en-US')} stars`)
    }
  } else {
    if (meta.handle) metaBits.push(meta.handle)
    if (meta.date) metaBits.push(meta.date)
    if (meta.likes != null) {
      metaBits.push(`${meta.likes.toLocaleString('en-US')} likes`)
    }
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-baseline gap-3">
        <span className="shrink-0 text-[13px] text-muted-foreground">
          {isGithub ? 'GitHub' : 'X'}
        </span>
        <h2 className="min-w-0 text-[15px] font-medium leading-snug text-foreground group-hover:underline group-hover:underline-offset-2">
          {item.title}
        </h2>
      </div>
      <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
        {item.summary}
      </p>
      {(metaBits.length > 0 || (item.tags ?? []).length > 0) && (
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {metaBits.length > 0 && (
            <span className="font-mono tabular-nums">{metaBits.join(' · ')}</span>
          )}
          {metaBits.length > 0 && (item.tags ?? []).length > 0 && (
            <span aria-hidden="true"> · </span>
          )}
          {(item.tags ?? []).length > 0 && (
            <span>{(item.tags ?? []).join(', ')}</span>
          )}
        </p>
      )}
    </a>
  )
}
