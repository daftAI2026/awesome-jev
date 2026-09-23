import { BookmarkSimple } from '@phosphor-icons/react'
import { cn } from 'cn'
import { useI18n } from '@/i18n'
import { Button } from '@/components/ui/button'

export function SaveButton({ saved, onToggle, compact = false, className }: {
  saved: boolean
  onToggle: () => void
  compact?: boolean
  className?: string
}) {
  const { t } = useI18n()
  const label = t(saved ? 'removeSaved' : 'addSaved')
  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={label} title={label}
      aria-pressed={saved} onClick={onToggle}
      className={cn('relative text-muted-foreground hover:text-foreground',
        compact ? "size-8 before:absolute before:-inset-1 before:content-['']" : 'size-10', className)}>
      <BookmarkSimple className="size-4" weight={saved ? 'fill' : 'regular'} aria-hidden />
    </Button>
  )
}
