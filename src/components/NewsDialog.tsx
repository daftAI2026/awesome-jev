import { Dialog } from '@base-ui/react/dialog'
import type { RefObject } from 'react'
import { useI18n } from '@/i18n'
import type { NewsItem } from '@/lib/news'
import { PreviewDialogHeader } from '@/components/PreviewDialogHeader'
import { PreviewDialogFooter } from '@/components/PreviewDialogFooter'
import { NewsItemContent, NewsItemMeta, NewsSourceLinks } from '@/components/NewsItemContent'

interface NewsDialogProps {
  item: NewsItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: RefObject<HTMLElement | null>
  saved: boolean
  onToggleSaved?: () => void
}

export function NewsDialog({ item, open, onOpenChange, triggerRef, saved, onToggleSaved }: NewsDialogProps) {
  const { t } = useI18n()

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {item ? (
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Popup finalFocus={triggerRef}
            className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground outline-none">
            <PreviewDialogHeader title={item.title} saved={saved} onToggleSaved={onToggleSaved}
              closeLabel={t('newsClose')}
              subtitle={<NewsItemMeta item={item} />}
            />

            <div className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-6">
              <Dialog.Description render={<div />}>
                <NewsItemContent item={item} />
              </Dialog.Description>
            </div>

            <PreviewDialogFooter>
              <NewsSourceLinks item={item} />
            </PreviewDialogFooter>
          </Dialog.Popup>
        </Dialog.Portal>
      ) : null}
    </Dialog.Root>
  )
}
