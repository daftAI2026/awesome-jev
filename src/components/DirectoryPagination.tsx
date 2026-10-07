/**
 * [INPUT]: 依赖 TanStack Router、分页纯规则、i18n 与本站 Pagination 原语
 * [OUTPUT]: 提供真实页码链接、结果范围、越界页码归一和翻页焦点定位
 * [POS]: components 的共享分页入口；项目、新闻及收藏传入全量结果数量
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, type MouseEvent } from 'react'
import { useNavigate, useRouter, useRouterState } from '@tanstack/react-router'
import { useI18n } from '@/i18n'
import { directorySearch, paginationNumbers, paginationRange } from '@/lib/pagination'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

export function DirectoryPagination({ total, page, sort }: {
  total: number; page: number; sort?: 'stars' | 'date' | 'name'
}) {
  const { t } = useI18n()
  const router = useRouter()
  const navigate = useNavigate()
  const { pathname, search } = useRouterState({ select: (state) => state.location })
  const range = paginationRange(total, page)
  const requested = directorySearch(search).page ?? 1
  useEffect(() => {
    // --- 背景预览不得新增历史；越界页以替换导航归一 ---
    if (total === 0 || requested === range.page || pathname.includes('/preview/')) return
    void navigate({ to: pathname, search: { ...search, page: range.page > 1 ? range.page : undefined }, replace: true, resetScroll: false })
  }, [navigate, pathname, range.page, requested, search, total])
  if (total === 0) return null
  const target = (next: number) => ({ ...search, preview: undefined, page: next > 1 ? next : undefined, ...(sort ? { sort } : {}) })
  const linkProps = (next: number, disabled = false) => ({
    href: disabled ? undefined : router.buildLocation({ to: pathname, search: target(next) }).href,
    'aria-disabled': disabled || undefined,
    tabIndex: disabled ? -1 : undefined,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) { event.preventDefault(); return }
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      void navigate({ to: pathname, search: target(next), resetScroll: false }).then(() => {
        const main = document.getElementById('main')
        main?.focus({ preventScroll: true })
        if (main) window.scrollTo({ top: Math.max(0, main.getBoundingClientRect().top + window.scrollY - 72), behavior: 'instant' })
      })
    },
  })
  return <div data-directory-pagination data-page={range.page} data-pages={range.pages} data-total={total}
    className="mt-8 space-y-3">
    <p className="text-center text-xs tabular-nums text-muted-foreground" aria-live="polite">
      {t('paginationRange', { start: range.start + 1, end: range.end, total })}
    </p>
    {range.pages > 1 && <Pagination aria-label={t('paginationLabel')}>
      <PaginationContent>
        <PaginationItem><PaginationPrevious text={t('paginationPrevious')} aria-label={t('paginationPrevious')}
          {...linkProps(range.page - 1, range.page === 1)} /></PaginationItem>
        {[false, true].flatMap((compact) => paginationNumbers(range.page, range.pages, compact).map((value, index) =>
          <PaginationItem key={`${compact}-${value}-${index}`} className={compact ? 'sm:hidden' : 'hidden sm:list-item'}>
            {value === 'ellipsis' ? <PaginationEllipsis /> : <PaginationLink isActive={value === range.page}
              aria-label={t('paginationPage', { page: value })} {...linkProps(value)}>{value}</PaginationLink>}
          </PaginationItem>))}
        <PaginationItem><PaginationNext text={t('paginationNext')} aria-label={t('paginationNext')}
          {...linkProps(range.page + 1, range.page === range.pages)} /></PaginationItem>
      </PaginationContent>
    </Pagination>}
  </div>
}
