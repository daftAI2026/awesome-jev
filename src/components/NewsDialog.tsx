/**
 * [INPUT]: 依赖新闻摘要共享正文、预览外壳与头尾、路由层提供的开关和触发元素
 * [OUTPUT]: 对外提供 NewsDialog 摘要预览，关闭焦点由共享外壳恢复到触发元素或主内容
 * [POS]: components 的新闻预览容器，由 NewsPanel 编排；导航历史归调用方，正文归 NewsItemContent
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { RefObject } from 'react'
import { useI18n } from '@/i18n'
import type { NewsItem } from '@/lib/news'
import { PreviewDialogHeader } from '@/components/PreviewDialogHeader'
import { PreviewDialogFooter } from '@/components/PreviewDialogFooter'
import { PreviewDialogFrame } from '@/components/PreviewDialogFrame'
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
    <PreviewDialogFrame open={open && item !== null} onOpenChange={onOpenChange} triggerRef={triggerRef}
      header={item && <PreviewDialogHeader title={item.title} saved={saved} onToggleSaved={onToggleSaved}
        closeLabel={t('newsClose')} subtitle={<NewsItemMeta item={item} />}
      />}
      footer={item && <PreviewDialogFooter><NewsSourceLinks item={item} /></PreviewDialogFooter>}
    >
      {item && <NewsItemContent item={item} />}
    </PreviewDialogFrame>
  )
}
