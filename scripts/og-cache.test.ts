/**
 * [INPUT]: Isolated temporary cache and counted renderer fixtures.
 * [OUTPUT]: Guards warm reuse, every input invalidation, corrupt cache recovery and render failures.
 * [POS]: Offline build-cache regression; no service or deployment access.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cachedPng } from './og-cache.ts'

const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3])

test('identical second build performs zero renders; SVG and renderer identity both invalidate', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'jev-og-cache-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  let renders = 0
  const render = async () => { renders++; return png }
  assert.deepEqual(await cachedPng(dir, 'fonts+renderer+lock-v1', '<svg>A</svg>', render), png)
  assert.deepEqual(await cachedPng(dir, 'fonts+renderer+lock-v1', '<svg>A</svg>', render), png)
  assert.equal(renders, 1)
  await cachedPng(dir, 'fonts+renderer+lock-v1', '<svg>B</svg>', render)
  await cachedPng(dir, 'fonts+renderer+lock-v2', '<svg>A</svg>', render)
  assert.equal(renders, 3)
})

test('corrupt cache including a valid PNG signature is regenerated', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'jev-og-cache-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  let renders = 0
  const render = async () => { renders++; return png }
  await cachedPng(dir, 'identity', 'svg', render)
  const file = join(dir, (await readdir(dir))[0])
  const data = await readFile(file)
  data[data.length - 1] ^= 1
  await writeFile(file, data)
  assert.deepEqual(await cachedPng(dir, 'identity', 'svg', render), png)
  assert.equal(renders, 2)
  await writeFile(file, Buffer.from('truncated'))
  assert.deepEqual(await cachedPng(dir, 'identity', 'svg', render), png)
  assert.equal(renders, 3)
})

test('invalid output and renderer failure are never saved as success', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'jev-og-cache-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  await assert.rejects(cachedPng(dir, 'identity', 'svg', async () => Buffer.from('invalid')), /Invalid rendered PNG/)
  await assert.rejects(cachedPng(dir, 'identity', 'svg', async () => { throw new Error('renderer failed') }), /renderer failed/)
  assert.deepEqual(await readdir(dir), [])
})
