import { useLayoutEffect, useRef, type MouseEvent } from 'react'
import type { DirectoryItem } from '@/lib/types'
import { masonryPositions, MASONRY_ROW_HEIGHT } from '@/lib/masonry'
import { ItemCard } from '@/components/ItemCard'
import { useI18n } from '@/i18n'

export function CardMasonry({ items, ranks, onPreview }: {
  items: DirectoryItem[]
  ranks?: Map<string, number>
  onPreview?: (item: DirectoryItem, event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const { locale } = useI18n()
  const listRef = useRef<HTMLUListElement>(null)

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const cells = Array.from(list.children) as HTMLLIElement[]
    let frame = 0
    let active = true
    const layout = () => {
      const style = getComputedStyle(list)
      // --- 单列走自然文档流；列数由断点给出，不受旧定位撑出的隐式列干扰 ---
      if (style.display === 'flex') return
      const columns = Number(style.getPropertyValue('--masonry-columns'))
      if (!Number.isInteger(columns) || columns < 2) return
      // --- 先统一读自然高度，再批量写位置，避免交错读写反复重排 ---
      const heights = cells.map((cell) => cell.firstElementChild?.getBoundingClientRect().height ?? 0)
      const positions = masonryPositions(heights, columns)
      cells.forEach((cell, index) => {
        const position = positions[index]
        const area = `${position.row} / ${position.column} / span ${position.span} / span 1`
        if (cell.style.gridArea !== area) cell.style.gridArea = area
      })
      // --- 首屏保留普通网格；定位全部完成后才启用短行，避免水合前卡片堆叠 ---
      list.style.gridAutoRows = `${MASONRY_ROW_HEIGHT}px`
      list.dataset.masonryReady = 'true'
    }
    layout()
    const scheduleLayout = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(layout)
    }
    // --- 仅观察容器宽度；字体与媒体加载后补排，避免千张卡片的观察器循环 ---
    void document.fonts.ready.then(() => { if (active) scheduleLayout() })
    list.addEventListener('load', scheduleLayout, true)
    list.addEventListener('loadedmetadata', scheduleLayout, true)
    window.addEventListener('resize', scheduleLayout)
    let previousWidth = list.clientWidth
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width
      if (width === previousWidth) return
      previousWidth = width
      scheduleLayout()
    })
    observer.observe(list)
    return () => {
      active = false
      observer.disconnect()
      list.removeEventListener('load', scheduleLayout, true)
      list.removeEventListener('loadedmetadata', scheduleLayout, true)
      window.removeEventListener('resize', scheduleLayout)
      cancelAnimationFrame(frame)
    }
  }, [items, locale])

  return (
    <ul
      ref={listRef}
      className="flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:items-start sm:data-[masonry-ready=true]:gap-y-0 sm:[--masonry-columns:2] lg:grid-cols-3 lg:[--masonry-columns:3]"
    >
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <ItemCard item={item} rank={ranks?.get(item.id)} onPreview={onPreview} />
        </li>
      ))}
    </ul>
  )
}
