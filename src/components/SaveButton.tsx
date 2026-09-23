import { Bookmark } from '@phosphor-icons/react'
import { useI18n } from '@/i18n'
import { Button } from '@/components/ui/button'

export function SaveButton({ saved, onToggle, className = '' }: {
  saved: boolean
  onToggle: () => void
  className?: string
}) {
  const { t } = useI18n()
  const label = t(saved ? 'removeSaved' : 'addSaved')
  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={label} title={label}
      aria-pressed={saved} onClick={onToggle}
      className={`size-10 text-muted-foreground hover:text-foreground ${className}`}>
      <Bookmark className="size-4" weight={saved ? 'fill' : 'regular'} aria-hidden />
    </Button>
  )
}
