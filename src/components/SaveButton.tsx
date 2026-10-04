/**
 * [INPUT]: 依赖 BookmarkSimple、cn、i18n 与 Button，保存状态和切换动作由调用方提供
 * [OUTPUT]: 对外提供 SaveButton 的本地收藏动作、按压状态及可访问标签
 * [POS]: components 的收藏呈现单元，与持久化和导航解耦，供项目/新闻展示复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
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
