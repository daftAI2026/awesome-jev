import type { ReactNode } from 'react'

export function PreviewDialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-background p-4 sm:p-6">
      {children}
    </div>
  )
}
