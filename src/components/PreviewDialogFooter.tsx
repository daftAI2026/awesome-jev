/**
 * [INPUT]: 依赖 React 内容组合，由项目/新闻预览提供来源链接等动作
 * [OUTPUT]: 对外提供 PreviewDialogFooter，统一固定底部动作区的边界和换行布局
 * [POS]: components 的预览共享尾部，与滚动正文分离，不决定来源或导航行为
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { ReactNode } from 'react'

export function PreviewDialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-background p-4 sm:p-6">
      {children}
    </div>
  )
}
