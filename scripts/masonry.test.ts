import test from 'node:test'
import assert from 'node:assert/strict'
import { masonryPositions } from '../src/lib/masonry.ts'

test('unequal heights retain strict left-to-right reading rows', () => {
  const positions = masonryPositions([80, 20, 20, 80, 20, 20], 3)
  assert.deepEqual(positions.map(p => p.column), [1, 2, 3, 1, 2, 3])
  assert.deepEqual(positions.map(p => p.row), [1, 1, 1, 25, 25, 25])
  for (let start = 0; start < positions.length; start += 3) {
    const band = positions.slice(start, start + 3)
    assert.ok(band.every((position) => position.row === band[0].row))
    if (start > 0) {
      const previous = positions.slice(start - 3, start)
      assert.ok(band[0].row >= Math.max(...previous.map((position) => position.row + position.span)))
    }
  }
  for (const a of positions) for (const b of positions) {
    if (a !== b && a.column === b.column && a.row < b.row) assert.ok(a.row + a.span <= b.row)
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
    [1, 1], [2, 1], [1, 25], [2, 25],
  ])
  assert.throws(() => masonryPositions([10], 0))
  assert.throws(() => masonryPositions([NaN], 2))
  assert.deepEqual(masonryPositions([], 3), [])
})
