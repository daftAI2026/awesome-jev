export const MASONRY_ROW_HEIGHT = 4
export const MASONRY_GAP = 16

export function masonryPositions(heights: number[], columns: number) {
  if (!Number.isInteger(columns) || columns < 1) throw new Error('Invalid column count')
  const spans = heights.map((height) => {
    if (!Number.isFinite(height) || height < 0) throw new Error('Invalid card height')
    return Math.max(1, Math.ceil((height + MASONRY_GAP) / MASONRY_ROW_HEIGHT))
  })
  const positions: { column: number; row: number; span: number }[] = []
  let row = 1
  // --- 逐行放置：保留横向阅读顺序，不让后续条目钻入短列 ---
  for (let start = 0; start < spans.length; start += columns) {
    const band = spans.slice(start, start + columns)
    band.forEach((span, index) => positions.push({ column: index + 1, row, span }))
    row += Math.max(...band)
  }
  return positions
}
