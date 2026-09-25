import test from 'node:test'
import assert from 'node:assert/strict'
import { Virtualizer, elementScroll, observeElementOffset, observeElementRect } from '@tanstack/react-virtual'
import { MASONRY_ESTIMATE_SIZE, MASONRY_GAP, virtualCardColumnStyle } from '../src/lib/masonry.ts'

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
