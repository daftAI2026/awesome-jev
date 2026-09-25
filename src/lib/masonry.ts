export const MASONRY_GAP = 16
export const MASONRY_ESTIMATE_SIZE = 300
export const MASONRY_OVERSCAN = 9

export function virtualCardColumnStyle(lane: number, columns: number) {
  if (!Number.isInteger(columns) || columns < 1 || !Number.isInteger(lane) || lane < 0 || lane >= columns) {
    throw new Error('Invalid masonry lane')
  }
  return {
    left: `calc(${lane * 100 / columns}% + ${lane * MASONRY_GAP / columns}px)`,
    width: `calc(${100 / columns}% - ${(columns - 1) * MASONRY_GAP / columns}px)`,
  }
}
