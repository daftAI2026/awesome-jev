import { Dialog } from '@base-ui/react/dialog'
import { ArrowSquareOut } from '@phosphor-icons/react'
import type { RefObject } from 'react'
import type { DirectoryItem } from '@/lib/types'
import { useI18n } from '@/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PreviewDialogHeader } from '@/components/PreviewDialogHeader'
import { PreviewDialogFooter } from '@/components/PreviewDialogFooter'
import { isInclusionBasis, pinnedSource } from '@/lib/inclusion'

interface GithubProjectDialogProps {
  item: DirectoryItem | null
  categoryLabel?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: RefObject<HTMLElement | null>
  saved: boolean
  onToggleSaved?: () => void
}

export function GithubProjectContent({ item, categoryLabel, standalone = false }: { item: DirectoryItem; categoryLabel?: string; standalone?: boolean }) {
  const { locale, t } = useI18n()
  const SectionHeading = standalone ? 'h2' : 'h3'
  const meta = item.sourceMeta
  const citedUrl = meta.jevEvidence?.evidenceUrl
  const evidenceUrl = citedUrl?.startsWith('https://github.com/') ? citedUrl : null
  const inclusion = isInclusionBasis(meta.inclusion, item.url) ? meta.inclusion : null
  const inclusionSources = inclusion?.evidence.filter((source, index, sources) =>
    sources.findIndex((candidate) => candidate.url === source.url) === index) ?? []

  return (
    <>
      <p className="break-words text-base leading-relaxed text-foreground">{item.summary}</p>
      {(categoryLabel || meta.language) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {categoryLabel && <span>{categoryLabel}</span>}
          {meta.language && <span>{meta.language}</span>}
        </div>
      )}
      {(meta.stars != null || meta.forks != null) && (
        <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {meta.stars != null && <div className="flex items-baseline gap-2"><dt className="text-muted-foreground">{t('projectStars')}</dt><dd className="font-medium tabular-nums">{meta.stars.toLocaleString('en-US')}</dd></div>}
          {meta.forks != null && <div className="flex items-baseline gap-2"><dt className="text-muted-foreground">{t('projectForks')}</dt><dd className="font-medium tabular-nums">{meta.forks.toLocaleString('en-US')}</dd></div>}
        </dl>
      )}
      <section className="mt-6">
        <SectionHeading className="text-sm font-medium">{t('projectInclusionBasis')}</SectionHeading>
        <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">
          {inclusion ? inclusion.text[locale] : t('projectInclusionPending')}
        </p>
        {inclusion ? (
          <ul className="mt-2 flex flex-col items-start gap-2">
            {inclusionSources.map((source) => (
              <li key={source.url} className="max-w-full">
                <a href={source.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-2 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="min-w-0 break-all">{pinnedSource(source.url, item.url)?.path}</span>
                  <ArrowSquareOut className="size-4 shrink-0" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        ) : evidenceUrl ? (
          <a href={evidenceUrl} target="_blank" rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {t('projectViewEvidence')}<ArrowSquareOut className="size-4" aria-hidden />
          </a>
        ) : null}
      </section>
      {(item.tags ?? []).length > 0 && (
        <section className="mt-6" aria-label={t('projectTags')}>
          <SectionHeading className="text-sm font-medium">{t('projectTags')}</SectionHeading>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.tags?.map((tag) => <Badge key={tag} variant="outline" className="h-auto min-h-5 max-w-full break-all py-1 font-normal whitespace-normal text-muted-foreground">{tag}</Badge>)}
          </div>
        </section>
      )}
    </>
  )
}

export function GithubProjectDialog({
  item, categoryLabel, open, onOpenChange, triggerRef, saved, onToggleSaved,
}: GithubProjectDialogProps) {
  const { t } = useI18n()
  const meta = item?.sourceMeta

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {item ? (
        <Dialog.Portal>
          <Dialog.Backdrop
            className="fixed inset-0 z-50 bg-black/40"
          />
          <Dialog.Popup
            finalFocus={triggerRef}
            className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground outline-none"
          >
            <PreviewDialogHeader title={item.title} saved={saved} onToggleSaved={onToggleSaved}
              closeLabel={t('projectClose')}
              subtitle={meta?.repo ? <p className="break-all font-mono text-xs text-muted-foreground">{meta.repo}</p> : undefined}
            />

            <div className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-6">
              <Dialog.Description render={<div />}>
                <GithubProjectContent item={item} categoryLabel={categoryLabel} />
              </Dialog.Description>
            </div>

            <PreviewDialogFooter>
              <Button className="h-10 gap-2 px-4" nativeButton={false} render={<a href={item.url} target="_blank" rel="noopener noreferrer" />}>
                {t('projectOpenGithub')}<ArrowSquareOut className="size-4" aria-hidden />
              </Button>
            </PreviewDialogFooter>
          </Dialog.Popup>
        </Dialog.Portal>
      ) : null}
    </Dialog.Root>
  )
}
