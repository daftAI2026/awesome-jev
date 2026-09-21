export const MASONRY_ROW_HEIGHT = 4
export const MASONRY_GAP = 16

export function masonryPositions(heights: number[], columns: number) {
  if (!Number.isInteger(columns) || columns < 1) throw new Error('Invalid column count')
  const ends = Array<number>(columns).fill(0)
  return heights.map((height) => {
    if (!Number.isFinite(height) || height < 0) throw new Error('Invalid card height')
    const top = Math.min(...ends)
    const column = ends.indexOf(top)
    const span = Math.max(1, Math.ceil((height + MASONRY_GAP) / MASONRY_ROW_HEIGHT))
    ends[column] += span
    return { column: column + 1, row: top + 1, span }
  })
}
