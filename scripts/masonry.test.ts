/**
 * [INPUT]: 依赖 Node test、TanStack Virtual 与 masonry 纯几何
 * [OUTPUT]: 对外提供 通道/间距与先滚动后水合时 SSR 前缀、阅读位置的回归验证
 * [POS]: scripts 的虚拟布局契约测试，不启动浏览器或读取网络
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { Virtualizer, elementScroll, observeElementOffset, observeElementRect } from '@tanstack/react-virtual'
import { MASONRY_ESTIMATE_SIZE, MASONRY_GAP, virtualCardColumnStyle, masonryRenderItems, masonryBootstrapScrollOffset, masonryScrollAdjustment } from '../src/lib/masonry.ts'

test('pre-ready size measurement preserves Virtualizer internal offset, then restores default compensation', () => {
  const virtualizer = new Virtualizer<Element, Element>({
    count: 30, lanes: 1, estimateSize: () => 300,
    getScrollElement: () => null, initialOffset: 6000,
    initialRect: { width: 402, height: 874 },
    scrollToFn: () => {}, observeElementRect, observeElementOffset,
  })
  virtualizer.getVirtualItems()
  virtualizer.shouldAdjustScrollPositionOnItemSizeChange = masonryScrollAdjustment(false)
  virtualizer.resizeItem(0, 250)
  assert.equal(virtualizer.scrollOffset, 6000, 'DOM and internal offsets must remain aligned during natural flow')
  virtualizer.shouldAdjustScrollPositionOnItemSizeChange = masonryScrollAdjustment(true)
  assert.equal(virtualizer.shouldAdjustScrollPositionOnItemSizeChange, undefined)
  virtualizer.resizeItem(0, 300)
  assert.equal(virtualizer.scrollOffset, 6050, 'Ready virtual layout must retain the original size compensation')
})

test('pre-ready natural flow keeps the SSR prefix even after the live window scrolls away', () => {
  const initial = Array.from({ length: 21 }, (_, index) => ({ index, lane: index % 3 }))
  const scrolled = Array.from({ length: 22 }, (_, index) => ({ index: index + 8, lane: 0 }))
  const pending = masonryRenderItems(initial, scrolled, false, 2199, 1)
  assert.deepEqual(pending.map((item) => item.index), initial.map((item) => item.index))
  assert.ok(pending.every((item) => item.lane === 0))
  assert.equal(masonryRenderItems(initial, scrolled, true, 2199, 1), scrolled)
})

test('pre-ready prefix stays valid if a filter shrinks the catalog or changes columns', () => {
  const initial = Array.from({ length: 21 }, (_, index) => ({ index, lane: index % 3 }))
  const pending = masonryRenderItems(initial, [], false, 5, 2)
  assert.deepEqual(pending.map((item) => item.index), [0, 1, 2, 3, 4])
  pending.forEach((item) => assert.doesNotThrow(() => virtualCardColumnStyle(item.lane, 2)))
})

test('bootstrap scroll synchronization preserves the position already read before hydration', () => {
  assert.equal(masonryBootstrapScrollOffset(0, 6000, false), 6000)
  assert.equal(masonryBootstrapScrollOffset(3000, 6000, true), 3000)
})

test('constant estimates pin TanStack masonry lanes to horizontal reading order', () => {
  const virtualizer = new Virtualizer<Element, Element>({
    count: 12,
    lanes: 3,
    laneAssignmentMode: 'estimate',
    estimateSize: () => MASONRY_ESTIMATE_SIZE,
    getScrollElement: () => null,
    getItemKey: (index) => `project-${index}`,
    initialRect: { width: 1200, height: 10000 },
    gap: MASONRY_GAP,
    scrollToFn: elementScroll,
    observeElementRect,
    observeElementOffset,
  })
  assert.deepEqual(virtualizer.getVirtualItems().map((item) => item.lane), [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2])
  virtualizer.resizeItem(0, 600)
  virtualizer.resizeItem(1, 120)
  virtualizer.resizeItem(2, 450)
  const measured = virtualizer.getVirtualItems()
  assert.deepEqual(measured.map((item) => item.lane), [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2])
  assert.equal(measured[3].start, 600 + MASONRY_GAP)
  assert.equal(measured[4].start, 120 + MASONRY_GAP)
  assert.equal(measured[5].start, 450 + MASONRY_GAP)
})

test('column geometry reserves the same gap at every breakpoint', () => {
  assert.deepEqual(virtualCardColumnStyle(0, 1), { left: 'calc(0% + 0px)', width: 'calc(100% - 0px)' })
  assert.deepEqual(virtualCardColumnStyle(1, 2), { left: 'calc(50% + 8px)', width: 'calc(50% - 8px)' })
  assert.deepEqual(virtualCardColumnStyle(2, 3), { left: 'calc(66.66666666666667% + 10.666666666666666px)', width: 'calc(33.333333333333336% - 10.666666666666666px)' })
  assert.throws(() => virtualCardColumnStyle(3, 3))
  assert.throws(() => virtualCardColumnStyle(0, 0))
})
