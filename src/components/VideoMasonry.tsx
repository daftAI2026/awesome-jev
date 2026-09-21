import { useLayoutEffect, useRef } from 'react'
import type { DirectoryItem } from '@/lib/types'
import { ItemCard } from '@/components/ItemCard'

import { masonryPositions, MASONRY_ROW_HEIGHT } from '@/lib/masonry'

export function VideoMasonry({ items }: { items: DirectoryItem[] }) {
  const listRef = useRef<HTMLUListElement>(null)

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const cells = Array.from(list.children) as HTMLLIElement[]
    let frame = 0
    const layout = () => {
      const columns = getComputedStyle(list).gridTemplateColumns.split(' ').length
      // 先统一读取尺寸，再写布局，避免逐项读写引发反复重排。
      const heights = cells.map((cell) => cell.firstElementChild?.getBoundingClientRect().height ?? 0)
      const positions = masonryPositions(heights, columns)
      cells.forEach((cell, index) => {
        const position = positions[index]
        cell.style.gridColumnStart = String(position.column)
        cell.style.gridRowStart = String(position.row)
        cell.style.gridRowEnd = `span ${position.span}`
      })
    }
    layout()
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(layout)
    })
    observer.observe(list)
    cells.forEach((cell) => {
      if (cell.firstElementChild) observer.observe(cell.firstElementChild)
    })
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [items])

  return (
    <ul
      ref={listRef}
      className="grid grid-cols-1 items-start gap-x-4 sm:grid-cols-2 lg:grid-cols-3"
      style={{ gridAutoRows: `${MASONRY_ROW_HEIGHT}px` }}
    >
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <ItemCard item={item} />
        </li>
      ))}
    </ul>
  )
}
