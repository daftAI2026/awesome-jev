/**
 * [INPUT]: 依赖 列/通道参数、SSR/实时窗口及启动滚动状态，不依赖 DOM
 * [OUTPUT]: 对外提供 卡片几何、预就绪渲染窗口及滚动/尺寸补偿规则
 * [POS]: lib 的瀑布流几何权威，由 CardMasonry 与 Node 回归测试消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export const MASONRY_GAP = 16
export const MASONRY_ESTIMATE_SIZE = 300
export const MASONRY_OVERSCAN = 9

export function masonryRenderItems<T extends { index: number; lane: number }>(
  initial: readonly T[], current: readonly T[], ready: boolean, count: number, columns: number,
): readonly T[] {
  if (ready) return current
  return initial.filter((item) => item.index < count)
    .map((item) => ({ ...item, lane: item.index % columns }))
}

export function masonryBootstrapScrollOffset(requested: number, actual: number, ready: boolean) {
  return ready ? requested : actual
}

const preserveNaturalScroll = () => false

export function masonryScrollAdjustment(ready: boolean): (() => boolean) | undefined {
  return ready ? undefined : preserveNaturalScroll
}

export function virtualCardColumnStyle(lane: number, columns: number) {
  if (!Number.isInteger(columns) || columns < 1 || !Number.isInteger(lane) || lane < 0 || lane >= columns) {
    throw new Error('Invalid masonry lane')
  }
  return {
    left: `calc(${lane * 100 / columns}% + ${lane * MASONRY_GAP / columns}px)`,
    width: `calc(${100 / columns}% - ${(columns - 1) * MASONRY_GAP / columns}px)`,
  }
}
