/**
 * [INPUT]: 依赖本站 Base UI Button、cn 与 Phosphor；结构源自 shadcn base-nova
 * [OUTPUT]: 提供 Pagination 导航、页码链接、前后链接与省略号原语
 * [POS]: components/ui 的分页外观；结果切片和路由状态由调用方定义
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { ComponentProps } from 'react'
import { CaretLeft, CaretRight, DotsThree } from '@phosphor-icons/react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'

function Pagination({ className, ...props }: ComponentProps<'nav'>) {
  return <nav aria-label="Pagination" data-slot="pagination"
    className={cn('mx-auto flex w-full justify-center', className)} {...props} />
}
function PaginationContent({ className, ...props }: ComponentProps<'ul'>) {
  return <ul data-slot="pagination-content" className={cn('flex items-center gap-0.5', className)} {...props} />
}
function PaginationItem(props: ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />
}
type PaginationLinkProps = ComponentProps<'a'> & Pick<ComponentProps<typeof Button>, 'size'> & { isActive?: boolean }
function PaginationLink({ className, isActive, size = 'icon', ...props }: PaginationLinkProps) {
  return <Button variant={isActive ? 'outline' : 'ghost'} size={size} nativeButton={false}
    className={cn('aria-disabled:pointer-events-none aria-disabled:opacity-50', className)}
    render={<a role="link" aria-current={isActive ? 'page' : undefined} data-slot="pagination-link" data-active={isActive} {...props} />} />
}
function PaginationPrevious({ text = 'Previous', className, ...props }: PaginationLinkProps & { text?: string }) {
  return <PaginationLink size="default" className={cn('pl-1.5', className)} {...props}>
    <CaretLeft aria-hidden data-icon="inline-start" /><span className="hidden sm:block">{text}</span>
  </PaginationLink>
}
function PaginationNext({ text = 'Next', className, ...props }: PaginationLinkProps & { text?: string }) {
  return <PaginationLink size="default" className={cn('pr-1.5', className)} {...props}>
    <span className="hidden sm:block">{text}</span><CaretRight aria-hidden data-icon="inline-end" />
  </PaginationLink>
}
function PaginationEllipsis({ className, ...props }: ComponentProps<'span'>) {
  return <span aria-hidden data-slot="pagination-ellipsis" className={cn('flex size-8 items-center justify-center', className)} {...props}>
    <DotsThree className="size-4" />
  </span>
}
export { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis }
