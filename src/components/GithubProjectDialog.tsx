import { Dialog } from '@base-ui/react/dialog'
import { ArrowSquareOut, Bug, GitFork, Star, X } from '@phosphor-icons/react'
import type { RefObject } from 'react'
import type { DirectoryItem } from '@/lib/types'
import { useI18n } from '@/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface GithubProjectDialogProps {
  item: DirectoryItem | null
  categoryLabel?: string
  rank?: number
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: RefObject<HTMLElement | null>
}

export function GithubProjectDialog({
  item, categoryLabel, rank, open, onOpenChange, triggerRef,
}: GithubProjectDialogProps) {
  const { t } = useI18n()
  const meta = item?.sourceMeta
  const citedUrl = meta?.jevEvidence?.evidenceUrl
  const evidenceUrl = citedUrl?.startsWith('https://github.com/') ? citedUrl : null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {item ? (
        <Dialog.Portal>
          <Dialog.Backdrop
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => onOpenChange(false)}
          />
          <Dialog.Popup
            finalFocus={triggerRef}
            className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-xl border border-border bg-background p-4 text-foreground shadow-lg outline-none sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <Dialog.Title className="break-words text-xl leading-snug font-medium">
                  {item.title}
                </Dialog.Title>
                {meta?.repo ? (
                  <p className="break-all font-mono text-xs text-muted-foreground">{meta.repo}</p>
                ) : null}
              </div>
              <Dialog.Close
                render={<Button variant="ghost" size="icon-sm" className="shrink-0" />}
                aria-label={t('projectClose')}
              >
                <X className="size-4" aria-hidden />
              </Dialog.Close>
            </div>

            <Dialog.Description className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {item.summary}
            </Dialog.Description>

            {(categoryLabel || meta?.language || rank != null) && (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                {categoryLabel && <span>{categoryLabel}</span>}
                {meta?.language && <span>{meta.language}</span>}
                {rank != null && <span>{t('githubStarRank', { rank })}</span>}
              </div>
            )}

            {(meta?.stars != null || meta?.forks != null || meta?.openIssues != null) && (
              <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-border py-4 text-sm">
                <div className="min-w-0">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Star className="size-3.5" weight="fill" aria-hidden />{t('projectStars')}
                  </dt>
                  <dd className="mt-2 tabular-nums">{meta?.stars?.toLocaleString('en-US') ?? '—'}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <GitFork className="size-3.5" weight="fill" aria-hidden />{t('projectForks')}
                  </dt>
                  <dd className="mt-2 tabular-nums">{meta?.forks?.toLocaleString('en-US') ?? '—'}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Bug className="size-3.5" weight="fill" aria-hidden />{t('projectIssues')}
                  </dt>
                  <dd className="mt-2 tabular-nums">{meta?.openIssues?.toLocaleString('en-US') ?? '—'}</dd>
                </div>
              </dl>
            )}

            {(item.tags ?? []).length > 0 && (
              <section className="mt-6" aria-label={t('projectTags')}>
                <h3 className="text-sm font-medium">{t('projectTags')}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.tags?.map((tag) => <Badge key={tag} variant="outline" className="font-normal">{tag}</Badge>)}
                </div>
              </section>
            )}

            {evidenceUrl && (
              <section className="mt-6">
                <h3 className="text-sm font-medium">{t('projectReviewSource')}</h3>
                <a href={evidenceUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {t('projectViewEvidence')}<ArrowSquareOut className="size-4" aria-hidden />
                </a>
              </section>
            )}

            <div className="mt-8 flex justify-end border-t border-border pt-4">
              <Button nativeButton={false} render={<a href={item.url} target="_blank" rel="noopener noreferrer" />}>
                {t('projectOpenGithub')}<ArrowSquareOut className="size-4" aria-hidden />
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      ) : null}
    </Dialog.Root>
  )
}
