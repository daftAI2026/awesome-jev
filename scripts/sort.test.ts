import test from 'node:test'
import assert from 'node:assert/strict'
import { sortYoutubeItems } from '../src/lib/sort.ts'
import type { DirectoryItem } from '../src/lib/types.ts'

function video(id: string, date: string | null | undefined): DirectoryItem {
  return {
    id,
    type: 'youtube',
    title: id,
    summary: '',
    url: `https://www.youtube.com/watch?v=${id}`,
    sourceMeta: { date },
  }
}

test('YouTube date sort compares complete timestamps across offsets', () => {
  const items = [
    video('same-day-early', '2026-09-17T09:00:00Z'),
    video('offset-newer', '2026-09-18T00:30:00+09:00'),
    video('same-day-late', '2026-09-17T13:00:00Z'),
    video('date-only', '2026-09-17'),
  ]

  assert.deepEqual(
    sortYoutubeItems(items, 'date').map((item) => item.id),
    ['offset-newer', 'same-day-late', 'same-day-early', 'date-only'],
  )
})

test('invalid and missing dates sort last; equal instants use stable IDs', () => {
  const items = [
    video('zeta', '2026-09-17T12:00:00Z'),
    video('invalid', 'not-a-date'),
    video('invalid-calendar', '2026-02-30'),
    video('alpha', '2026-09-17T14:00:00+02:00'),
    video('missing', undefined),
    video('blank', '  '),
  ]

  assert.deepEqual(
    sortYoutubeItems(items, 'date').map((item) => item.id),
    ['alpha', 'zeta', 'blank', 'invalid', 'invalid-calendar', 'missing'],
  )
})

test('date sorting returns a new array without mutating input order', () => {
  const items = [video('old', '2026-09-16'), video('new', '2026-09-21')]
  const before = structuredClone(items)

  const sorted = sortYoutubeItems(items, 'date')

  assert.deepEqual(sorted.map((item) => item.id), ['new', 'old'])
  assert.notStrictEqual(sorted, items)
  assert.deepEqual(items, before)
})

test('YouTube date order never puts September 17 before September 19', () => {
  const items = [video('seventeen', '2026-09-17'), video('twenty-one', '2026-09-21'), video('nineteen', '2026-09-19')]
  assert.deepEqual(sortYoutubeItems(items, 'date').map((item) => item.id), ['twenty-one', 'nineteen', 'seventeen'])
})
