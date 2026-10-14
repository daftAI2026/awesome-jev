/**
 * [INPUT]: 依赖 OG 固定字库读取器与可控响应流
 * [OUTPUT]: 验证成功字节复用、未知字库拒绝与失败重试/容量边界
 * [POS]: scripts 的 OG 资源护栏；不加载 Worker 或访问真实绑定
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createOgFontLoader, type OgFontName } from '../src/lib/og-fonts.ts'
test('successful font bytes are reused without keeping a response body', async () => {
  let reads = 0
  const load = createOgFontLoader(async () => { reads++; return new Response(new Uint8Array(1024)) })
  const first = await load('Geist-Regular.ttf')
  assert.equal(await load('Geist-Regular.ttf'), first)
  assert.equal(reads, 1)
  await load('NotoSansSC.ttf')
  assert.equal(reads, 2)
  await assert.rejects(load('unknown.ttf' as OgFontName), /Unknown OG font/)
  assert.equal(reads, 2)
})
test('failed or short fonts are not cached and can be loaded again', async () => {
  let reads = 0
  const load = createOgFontLoader(async () => ++reads === 1 ? new Response('bad') : new Response(new Uint8Array(1024)))
  await assert.rejects(load('Geist-Regular.ttf'), /Invalid OG font/)
  assert.equal((await load('Geist-Regular.ttf')).byteLength, 1024)
  assert.equal(reads, 2)
})
test('oversized font streams are rejected and cancelled', async () => {
  let cancelled = false
  const load = createOgFontLoader(async () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(20 * 1024 * 1024 + 1)) },
    cancel() { cancelled = true },
  })))
  await assert.rejects(load('NotoSansSC.ttf'), /OG font too large/)
  assert.equal(cancelled, true)
})
