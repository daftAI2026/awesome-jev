/**
 * [INPUT]: 依赖 TanStack Virtual、masonry 几何/启动窗口规则、ItemCard 与当前语言
 * [OUTPUT]: 对外提供有序且有界的 CardMasonry，窄屏预渲染内容可在水合前阅读
 * [POS]: components 的项目虚拟布局；初始流保留 SSR 前缀与阅读位置，就绪提交同步接管虚拟窗口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useCallback, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { useWindowVirtualizer, windowScroll } from '@tanstack/react-virtual'
import type { DirectoryItem } from '@/lib/types'
import { MASONRY_ESTIMATE_SIZE, MASONRY_GAP, MASONRY_OVERSCAN, virtualCardColumnStyle, masonryRenderItems, masonryBootstrapScrollOffset, masonryScrollAdjustment } from '@/lib/masonry'
import { ItemCard } from '@/components/ItemCard'
import { useI18n } from '@/i18n'

const SKELETON_CARD_COUNT = 18
const INITIAL_VIEWPORT = { width: 1200, height: 900 }

function viewportColumns(): number {
  if (window.matchMedia('(min-width: 64rem)').matches) return 3
  if (window.matchMedia('(min-width: 40rem)').matches) return 2
  return 1
}

export function CardMasonry({ items, ranks, onPreview, savedIds, onToggleSaved }: {
  items: DirectoryItem[]
  ranks?: Map<string, number>
  onPreview?: (item: DirectoryItem, event: MouseEvent<HTMLAnchorElement>) => void
  savedIds?: ReadonlySet<string>
  onToggleSaved?: (item: DirectoryItem) => void
}) {
  const { locale } = useI18n()
  const listRef = useRef<HTMLUListElement>(null)
  const [columns, setColumns] = useState(3)
  const [scrollMargin, setScrollMargin] = useState(0)
  const [ready, setReady] = useState(false)
  const getItemKey = useCallback((index: number) => items[index].id, [items])
  const virtualizer = useWindowVirtualizer({
    count: items.length,
    lanes: columns,
    laneAssignmentMode: 'estimate',
    estimateSize: () => MASONRY_ESTIMATE_SIZE,
    getItemKey,
    gap: MASONRY_GAP,
    overscan: MASONRY_OVERSCAN,
    scrollMargin,
    initialRect: INITIAL_VIEWPORT,
    initialOffset: 0,
    // --- SSR 身份不变；水合前用户已读到的位置不能被初始化同步清零 ---
    scrollToFn: (offset, options, instance) => windowScroll(
      masonryBootstrapScrollOffset(offset, window.scrollY, ready),
      ready ? options : { ...options, adjustments: undefined }, instance,
    ),
  })
  // --- Virtualizer 的公开实例策略，不是 React 状态；自然流阶段禁止内部滚动补偿 ---
  // oxlint-disable-next-line react/immutability
  virtualizer.shouldAdjustScrollPositionOnItemSizeChange = masonryScrollAdjustment(ready)
  const [initialVirtualItems] = useState(() => virtualizer.getVirtualItems())

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    let frame = 0
    let previousWidth = list.clientWidth
    const remeasureMounted = () => {
      // --- 先读后写，避免每次更新虚拟尺寸后再次触发布局读取 ---
      const measurements = Array.from(list.children, (card) => {
        const element = card as HTMLLIElement
        return { index: Number(element.dataset.index), height: element.offsetHeight }
      })
      for (const { index, height } of measurements) {
        if (Number.isInteger(index)) virtualizer.resizeItem(index, height)
      }
    }
    const syncLayout = () => {
      const nextColumns = viewportColumns()
      const nextMargin = list.getBoundingClientRect().top + window.scrollY
      if (nextColumns !== columns) {
        setColumns(nextColumns)
      }
      setScrollMargin((current) => Math.abs(current - nextMargin) > 1 ? nextMargin : current)
      const width = list.clientWidth
      if (width !== previousWidth) {
        previousWidth = width
        remeasureMounted()
      }
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setReady(true))
    }
    syncLayout()
    remeasureMounted()
    const observer = new ResizeObserver(() => {
      if (list.clientWidth !== previousWidth) syncLayout()
    })
    observer.observe(list)
    window.addEventListener('resize', syncLayout)
    void document.fonts.ready.then(() => {
      if (list.isConnected) {
        remeasureMounted()
        syncLayout()
      }
    })
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncLayout)
      cancelAnimationFrame(frame)
    }
  }, [columns, locale, virtualizer])

  const virtualItems = masonryRenderItems(
    initialVirtualItems, virtualizer.getVirtualItems(), ready, items.length, columns,
  )
  return (
    <div className="masonry-shell">
      {items.length > 0 && !ready && (
        <div className="masonry-skeleton" aria-hidden="true">
          {Array.from({ length: Math.min(items.length, SKELETON_CARD_COUNT) }, (_, index) => (
            <div key={index} className="masonry-skeleton-card">
              <span className="masonry-skeleton-title" />
              <span className="masonry-skeleton-line" />
              <span className="masonry-skeleton-line" />
              <span className="masonry-skeleton-line masonry-skeleton-line-short" />
            </div>
          ))}
        </div>
      )}
      <ul ref={listRef} data-masonry-ready={ready} className="card-masonry relative w-full"
        style={{ height: virtualizer.getTotalSize() }}>
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index]
          return (
            <li key={item.id} ref={virtualizer.measureElement} data-index={virtualItem.index}
              className="absolute top-0 min-w-0"
              style={{
                ...virtualCardColumnStyle(virtualItem.lane, columns),
                transform: `translateY(${virtualItem.start - scrollMargin}px)`,
              }}>
              <ItemCard item={item} rank={ranks?.get(item.id)} onPreview={onPreview}
                saved={savedIds?.has(item.id)} onToggleSaved={onToggleSaved} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
