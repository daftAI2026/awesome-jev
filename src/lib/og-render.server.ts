/**
 * [INPUT]: 依赖 Cloudflare ASSETS 字库绑定与 @cf-wasm/resvg 的 Workers WASM 渲染器
 * [OUTPUT]: 对外提供 renderOgPng，将受控 SVG 转为 1200×630 PNG 字节
 * [POS]: lib 的运行时栅格化适配器；不读取磁盘、不请求外部字体，及时释放 WASM 对象
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { env } from 'cloudflare:workers'
import { Resvg } from '@cf-wasm/resvg/workerd'

async function font(name: string, origin: string): Promise<Uint8Array<ArrayBuffer>> {
  const response = await env.ASSETS.fetch(new Request(`${origin}/og-fonts/${name}`))
  if (!response.ok) throw new Error(`OG font unavailable: ${response.status} ${response.url}`)
  // --- 字库路径固定；流读取设硬上限，错误 HTML/未知长度不能无限占用内存 ---
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Empty OG font')
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.length
      if (length > 20 * 1024 * 1024) throw new Error('OG font too large')
      chunks.push(value)
    }
  } finally { await reader.cancel(); reader.releaseLock() }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  if (bytes.length < 1000) throw new Error('Invalid OG font')
  return bytes
}

export async function renderOgPng(svg: string, origin: string): Promise<Uint8Array<ArrayBuffer>> {
  const names = ['Geist-Regular.ttf', 'Geist-SemiBold.ttf', 'GeistMono-Regular.ttf']
  if (/[\u2e80-\u9fff\uac00-\ud7ff\uf900-\ufaff\uff00-\uffef\u3040-\u30ff]/u.test(svg)) names.push('NotoSansSC.ttf')
  const fontBuffers = await Promise.all(names.map((name) => font(name, origin)))
  const renderer = await Resvg.async(svg, { font: { fontBuffers, defaultFontFamily: 'Geist' } })
  try {
    const image = renderer.render()
    try { return new Uint8Array(image.asPng()) } finally { image.free() }
  } finally { renderer.free() }
}
