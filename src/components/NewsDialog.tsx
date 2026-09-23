import { Dialog } from '@base-ui/react/dialog'
import { ArrowSquareOut, X } from '@phosphor-icons/react'
import type { RefObject } from 'react'
import { useI18n } from '@/i18n'
import type { NewsItem } from '@/lib/news'
import { Button } from '@/components/ui/button'
import { SaveButton } from '@/components/SaveButton'

interface NewsDialogProps {
  item: NewsItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: RefObject<HTMLElement | null>
  saved: boolean
  onToggleSaved?: () => void
}

export function NewsDialog({ item, open, onOpenChange, triggerRef, saved, onToggleSaved }: NewsDialogProps) {
  const { locale, t } = useI18n()
  const date = item?.publishedAt ?? item?.discoveredAt
  const formattedDate = date && new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
  const originalTitle = item?.originalTitle && !/^https?:\/\//i.test(item.originalTitle) &&
    item.originalTitle !== item.title ? item.originalTitle : null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {item ? (
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" onClick={() => onOpenChange(false)} />
          <Dialog.Popup finalFocus={triggerRef}
            className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground outline-none">
            <div className="flex shrink-0 items-start justify-between gap-4 p-4 sm:p-6">
              <div className="min-w-0 space-y-2">
                <Dialog.Title className="break-words text-xl leading-snug font-medium">{item.title}</Dialog.Title>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>{item.sourceName}</span>
                  {formattedDate && <><span aria-hidden>·</span><time dateTime={date}>{formattedDate}</time></>}
                  {item.score != null && <><span aria-hidden>·</span><span className="tabular-nums">{t('newsScore', { score: item.score })}</span></>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {onToggleSaved && <SaveButton saved={saved} onToggle={onToggleSaved} />}
                <Dialog.Close render={<Button variant="ghost" size="icon-sm" className="size-10" />}
                  aria-label={t('newsClose')}>
                  <X className="size-4" aria-hidden />
                </Dialog.Close>
              </div>
            </div>

            <div className="min-h-0 space-y-6 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-6">
              <section>
                <h3 className="mb-2 text-sm font-medium">{t('newsSummary')}</h3>
                <Dialog.Description className="whitespace-pre-line break-words text-base leading-relaxed">
                  {item.summary ?? t('newsNoSummary')}
                </Dialog.Description>
              </section>
              {originalTitle && (
                <section>
                  <h3 className="text-sm font-medium">{t('newsOriginalTitle')}</h3>
                  <p className="mt-2 border-l-2 border-border pl-3 text-sm leading-relaxed text-muted-foreground">{originalTitle}</p>
                </section>
              )}
              {item.reason && (
                <section>
                  <h3 className="text-sm font-medium">{t('newsReason')}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{item.reason}</p>
                </section>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border bg-background p-4 sm:px-6">
              <Button variant="outline" className="h-10 gap-2 px-4" nativeButton={false}
                render={<a href={item.aihotUrl} target="_blank" rel="noopener noreferrer" />}>
                {t('newsOpenAihot')}<ArrowSquareOut className="size-4" aria-hidden />
              </Button>
              <Button className="h-10 gap-2 px-4" nativeButton={false}
                render={<a href={item.originalUrl} target="_blank" rel="noopener noreferrer" />}>
                {t('newsOpenOriginal')}<ArrowSquareOut className="size-4" aria-hidden />
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      ) : null}
    </Dialog.Root>
  )
}
