import test from 'node:test'
import assert from 'node:assert/strict'
import { masonryPositions } from '../src/lib/masonry.ts'

test('unequal heights keep round-robin columns without empty row bands', () => {
  const positions = masonryPositions([80, 20, 20, 80, 20, 20], 3)
  assert.deepEqual(positions.map(p => p.column), [1, 2, 3, 1, 2, 3])
  assert.deepEqual(positions.map(p => p.row), [1, 1, 1, 25, 10, 10])
  for (const a of positions) for (const b of positions) {
    if (a !== b && a.column === b.column && a.row < b.row) assert.equal(a.row + a.span, b.row)
  }
})

test('one column stays sequential and invalid measurements fail clearly', () => {
  assert.deepEqual(masonryPositions([80, 20], 1), [
    { column: 1, row: 1, span: 24 }, { column: 1, row: 25, span: 9 },
  ])
  assert.deepEqual(masonryPositions([80, 20, 20, 20], 3).map(p => [p.column, p.row]), [
    [1, 1], [2, 1], [3, 1], [1, 25],
  ])
  assert.deepEqual(masonryPositions([80, 20, 20, 80], 2).map(p => [p.column, p.row]), [
    [1, 1], [2, 1], [1, 25], [2, 10],
  ])
  assert.throws(() => masonryPositions([10], 0))
  assert.throws(() => masonryPositions([NaN], 2))
  assert.deepEqual(masonryPositions([], 3), [])
})
