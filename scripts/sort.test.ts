/**
 * [INPUT]: 依赖项目排序、公开快照与 Node 测试替身
 * [OUTPUT]: 验证排序次序、输入不变及比较器配置复用
 * [POS]: scripts 的排序护栏；全量对照旧语义，不用耗时阈值断言
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { publicProjects } from '../src/lib/catalog-visibility.ts'
import { githubStarRanks, sortGithubItems } from '../src/lib/sort.ts'
import type { DirectoryItem } from '../src/lib/types.ts'

function project(id: string, title: string, stars?: number | null, date?: string | null): DirectoryItem {
  return { id, type: 'github', title, summary: '', url: `https://github.com/test/${id}`, sourceMeta: { stars, date } }
}
const ids = (items: DirectoryItem[]) => items.map((item) => item.id)
const starsOrZero = (stars: number | null | undefined) => typeof stars === 'number' && !Number.isNaN(stars) ? stars : 0

// --- 固定旧比较规则，避免新实现同时充当预期值和被测值 ---
function previousStars(a: DirectoryItem, b: DirectoryItem): number {
  return starsOrZero(b.sourceMeta.stars) - starsOrZero(a.sourceMeta.stars)
    || a.title.localeCompare(b.title, 'en', { sensitivity: 'base' })
    || a.id.localeCompare(b.id)
}

test('stars rank missing values as zero and compare case/accent ties by ID', () => {
  const rows = [project('tie-z', 'Éclair', 7), project('higher', 'Zulu', 9),
    project('zero', 'beta', 0), project('tie-a', 'eCLAIR', 7),
    project('missing', 'delta'), project('null', 'charlie', null), project('nan', 'alpha', NaN)]
  const expected = ['higher', 'tie-a', 'tie-z', 'nan', 'zero', 'null', 'missing']
  assert.deepEqual(ids(sortGithubItems(rows, 'stars')), expected)
  assert.deepEqual([...githubStarRanks(rows)], expected.map((id, index) => [id, index + 1]))
  assert.deepEqual(ids(sortGithubItems([...rows].reverse(), 'stars')), expected)
})

test('equal star/title rows retain the existing default-locale ID comparison', () => {
  const rows = ['z', 'Z', 'ä', 'a', 'A', 'a-2', 'a_1'].map((id) => project(id, 'same', 1))
  const expected = rows.map((item) => item.id).sort((a, b) => a.localeCompare(b))
  assert.deepEqual(ids(sortGithubItems(rows, 'stars')), expected)
  assert.deepEqual([...githubStarRanks(rows).keys()], expected)
})

test('name sorting ignores case/accents but preserves input order for equal names', () => {
  const rows = [project('z', 'éclair'), project('b', 'Bravo'), project('a', 'ECLAIR'),
    project('c', 'Álpha'), project('m', 'eclair')]
  assert.deepEqual(ids(sortGithubItems(rows, 'name')), ['c', 'b', 'z', 'a', 'm'])
  assert.deepEqual(ids(sortGithubItems([...rows].reverse(), 'name')), ['c', 'b', 'm', 'a', 'z'])
})

test('date sorting stays newest-first, stable within a day, and missing-last', () => {
  const rows = [project('missing', 'missing'), project('old', 'old', 0, '2025-01-01'),
    project('new-z', 'new-z', 0, '2026-10-20T00:00:00Z'), project('blank', 'blank', 0, ' '),
    project('new-a', 'new-a', 0, '2026-10-20T12:00:00Z'), project('null', 'null', 0, null)]
  assert.deepEqual(ids(sortGithubItems(rows, 'date')), ['new-z', 'new-a', 'old', 'missing', 'blank', 'null'])
})

test('sorting and ranking leave frozen input rows and metadata unchanged', () => {
  const rows = [project('b', 'beta', 2), project('a', 'alpha', 1)]
  const before = structuredClone(rows)
  for (const row of rows) { Object.freeze(row.sourceMeta); Object.freeze(row) }
  Object.freeze(rows)
  for (const sort of ['stars', 'name', 'date'] as const) {
    const result = sortGithubItems(rows, sort)
    assert.notEqual(result, rows)
    assert.ok(result.every((row) => rows.includes(row)))
  }
  githubStarRanks(rows)
  assert.deepEqual(rows, before)
  assert.deepEqual(sortGithubItems([], 'stars'), [])
  assert.equal(githubStarRanks([]).size, 0)
})

test('the complete public snapshot retains every previous sort ID and star rank', () => {
  const rows = publicProjects(JSON.parse(readFileSync(new URL('../data/github.json', import.meta.url), 'utf8')) as DirectoryItem[])
  const stars = [...rows].sort(previousStars)
  const names = [...rows].sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }))
  assert.deepEqual(ids(sortGithubItems(rows, 'stars')), ids(stars))
  assert.deepEqual(ids(sortGithubItems(rows, 'name')), ids(names))
  assert.deepEqual([...githubStarRanks(rows)], stars.map((item, index) => [item.id, index + 1]))
})

test('sort comparisons reuse collation configuration instead of preparing it per comparison', (t) => {
  const compare = String.prototype.localeCompare
  t.mock.method(String.prototype, 'localeCompare', function (this: string, other: string, ...configuration: unknown[]) {
    assert.equal(configuration.length, 0, '标题比较不得逐次传入 locale/options；ID 比较保留默认 locale')
    return compare.call(this, other)
  })
  t.mock.method(Intl, 'Collator', function () {
    assert.fail('排序期间不得创建 Collator；固定配置必须在模块初始化时复用')
  })
  const rows = [project('z', 'Éclair', 1), project('a', 'eCLAIR', 1), project('b', 'bravo', 1)]
  for (let repeat = 0; repeat < 2; repeat++) {
    assert.deepEqual(ids(sortGithubItems(rows, 'stars')), ['b', 'a', 'z'])
    assert.deepEqual(ids(sortGithubItems(rows, 'name')), ['b', 'z', 'a'])
    assert.deepEqual([...githubStarRanks(rows).keys()], ['b', 'a', 'z'])
  }
})
