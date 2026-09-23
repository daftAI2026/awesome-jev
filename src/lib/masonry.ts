export const MASONRY_ROW_HEIGHT = 4
export const MASONRY_GAP = 16

export function masonryPositions(heights: number[], columns: number) {
  if (!Number.isInteger(columns) || columns < 1) throw new Error('Invalid column count')
  const spans = heights.map((height) => {
    if (!Number.isFinite(height) || height < 0) throw new Error('Invalid card height')
    return Math.max(1, Math.ceil((height + MASONRY_GAP) / MASONRY_ROW_HEIGHT))
  })
  const positions: { column: number; row: number; span: number }[] = []
  const nextRows = Array<number>(columns).fill(1)
  // --- 横向轮流分列，纵向紧贴本列上一张卡片 ---
  spans.forEach((span, index) => {
    const columnIndex = index % columns
    positions.push({ column: columnIndex + 1, row: nextRows[columnIndex], span })
    nextRows[columnIndex] += span
  })
  return positions
}
