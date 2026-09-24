import { Dialog } from '@base-ui/react/dialog'
import { X } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { SaveButton } from '@/components/SaveButton'

interface PreviewDialogHeaderProps {
  title: string
  subtitle?: ReactNode
  saved: boolean
  onToggleSaved?: () => void
  closeLabel: string
}

export function PreviewDialogHeader({ title, subtitle, saved, onToggleSaved, closeLabel }: PreviewDialogHeaderProps) {
  return (
    <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 p-4 sm:p-6">
      <Dialog.Title className="min-w-0 break-words text-xl leading-snug font-medium">{title}</Dialog.Title>
      <div className={cn('relative col-start-2 row-start-1 self-stretch', onToggleSaved ? 'w-21' : 'w-10')}>
        <div className="absolute top-1/2 right-0 flex -translate-y-1/2 items-center gap-1">
          {onToggleSaved && <SaveButton saved={saved} onToggle={onToggleSaved} />}
          <Dialog.Close
            render={<Button variant="ghost" size="icon-sm" className="size-10" />}
            aria-label={closeLabel}
          >
            <X className="size-4" aria-hidden />
          </Dialog.Close>
        </div>
      </div>
      {subtitle && <div className="col-span-2 min-w-0">{subtitle}</div>}
    </div>
  )
}
