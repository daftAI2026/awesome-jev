import { Dialog } from '@base-ui/react/dialog'
import { ArrowSquareOut, X } from '@phosphor-icons/react'
import type { RefObject } from 'react'
import type { DirectoryItem } from '@/lib/types'
import { useI18n } from '@/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SaveButton } from '@/components/SaveButton'

interface GithubProjectDialogProps {
  item: DirectoryItem | null
  categoryLabel?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: RefObject<HTMLElement | null>
  saved: boolean
  onToggleSaved?: () => void
}

export function GithubProjectDialog({
  item, categoryLabel, open, onOpenChange, triggerRef, saved, onToggleSaved,
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
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => onOpenChange(false)}
          />
          <Dialog.Popup
            finalFocus={triggerRef}
            className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground outline-none"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 p-4 sm:p-6">
              <div className="min-w-0 space-y-2">
                <Dialog.Title className="break-words text-xl leading-snug font-medium">
                  {item.title}
                </Dialog.Title>
                {meta?.repo ? (
                  <p className="break-all font-mono text-xs text-muted-foreground">{meta.repo}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {onToggleSaved && <SaveButton saved={saved} onToggle={onToggleSaved} />}
                <Dialog.Close
                  render={<Button variant="ghost" size="icon-sm" className="size-10" />}
                  aria-label={t('projectClose')}
                >
                  <X className="size-4" aria-hidden />
                </Dialog.Close>
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-6">
              <Dialog.Description className="break-words text-base leading-relaxed text-foreground">
                {item.summary}
              </Dialog.Description>

              {(categoryLabel || meta?.language) && (
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  {categoryLabel && <span>{categoryLabel}</span>}
                  {meta?.language && <span>{meta.language}</span>}
                </div>
              )}

              {(meta?.stars != null || meta?.forks != null || meta?.openIssues != null) && (
                <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {meta.stars != null && (
                    <div className="flex items-baseline gap-2">
                      <dt className="text-muted-foreground">{t('projectStars')}</dt>
                      <dd className="font-medium tabular-nums">{meta.stars.toLocaleString('en-US')}</dd>
                    </div>
                  )}
                  {meta.forks != null && (
                    <div className="flex items-baseline gap-2">
                      <dt className="text-muted-foreground">{t('projectForks')}</dt>
                      <dd className="font-medium tabular-nums">{meta.forks.toLocaleString('en-US')}</dd>
                    </div>
                  )}
                  {meta.openIssues != null && (
                    <div className="flex items-baseline gap-2">
                      <dt className="text-muted-foreground">{t('projectIssues')}</dt>
                      <dd className="font-medium tabular-nums">{meta.openIssues.toLocaleString('en-US')}</dd>
                    </div>
                  )}
                </dl>
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

              {(item.tags ?? []).length > 0 && (
                <section className="mt-6" aria-label={t('projectTags')}>
                  <h3 className="text-sm font-medium">{t('projectTags')}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.tags?.map((tag) => <Badge key={tag} variant="outline" className="h-auto min-h-5 max-w-full break-all py-1 font-normal whitespace-normal text-muted-foreground">{tag}</Badge>)}
                  </div>
                </section>
              )}
            </div>

            <div className="flex shrink-0 justify-end border-t border-border bg-background p-4 sm:px-6">
              <Button className="h-10 gap-2 px-4" nativeButton={false} render={<a href={item.url} target="_blank" rel="noopener noreferrer" />}>
                {t('projectOpenGithub')}<ArrowSquareOut className="size-4" aria-hidden />
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      ) : null}
    </Dialog.Root>
  )
}
