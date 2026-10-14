/**
 * [INPUT]: 依赖 ASSETS、固定字体字节复用与 Resvg Workers WASM
 * [OUTPUT]: 对外提供 renderOgPng，将受控 SVG 转为 1200×630 PNG 字节
 * [POS]: lib 的运行时栅格化适配器；不读取磁盘、不请求外部字体，及时释放 WASM 对象
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { env } from 'cloudflare:workers'
import { Resvg } from '@cf-wasm/resvg/workerd'
import { createOgFontLoader, type OgFontName } from './og-fonts'
import { SITE_ORIGIN } from './share-image'

const font = createOgFontLoader((name) => env.ASSETS.fetch(new Request(`${SITE_ORIGIN}/og-fonts/${name}`)))

export async function renderOgPng(svg: string): Promise<Uint8Array<ArrayBuffer>> {
  const names: OgFontName[] = ['Geist-Regular.ttf', 'Geist-SemiBold.ttf', 'GeistMono-Regular.ttf']
  if (/[\u2e80-\u9fff\uac00-\ud7ff\uf900-\ufaff\uff00-\uffef\u3040-\u30ff]/u.test(svg)) names.push('NotoSansSC.ttf')
  const fontBuffers = await Promise.all(names.map((name) => font(name)))
  const renderer = await Resvg.async(svg, { font: { fontBuffers, defaultFontFamily: 'Geist' } })
  try {
    const image = renderer.render()
    try { return new Uint8Array(image.asPng()) } finally { image.free() }
  } finally { renderer.free() }
}
