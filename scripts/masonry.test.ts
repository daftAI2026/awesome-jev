import test from 'node:test'
import assert from 'node:assert/strict'
import { masonryPositions } from '../src/lib/masonry.ts'

test('unequal heights retain top-to-bottom then left-to-right order', () => {
  const positions = masonryPositions([80, 20, 20, 80, 20, 20], 3)
  assert.deepEqual(positions.slice(0, 3).map(p => p.column), [1, 2, 3])
  for (let i = 1; i < positions.length; i++) {
    const a = positions[i - 1], b = positions[i]
    assert.ok(b.row > a.row || (b.row === a.row && b.column > a.column))
  }
  for (const a of positions) for (const b of positions) {
    if (a !== b && a.column === b.column && a.row < b.row) assert.ok(a.row + a.span <= b.row)
  }
})

test('one column stays sequential and invalid measurements fail clearly', () => {
  assert.deepEqual(masonryPositions([80, 20], 1), [
    { column: 1, row: 1, span: 24 }, { column: 1, row: 25, span: 9 },
  ])
  assert.throws(() => masonryPositions([10], 0))
  assert.throws(() => masonryPositions([NaN], 2))
  assert.deepEqual(masonryPositions([], 3), [])
})
