/**
 * [INPUT]: 依赖调用方的固定字库读取能力，不访问外部网络
 * [OUTPUT]: 提供四份字库的有界读取与成功字节复用；失败不缓存
 * [POS]: lib 的 OG 公共字体资源边界；不跨请求保存响应流或请求对象
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export const OG_FONT_NAMES = ['Geist-Regular.ttf', 'Geist-SemiBold.ttf', 'GeistMono-Regular.ttf', 'NotoSansSC.ttf'] as const
export type OgFontName = typeof OG_FONT_NAMES[number]
const MAX_FONT_BYTES = 20 * 1024 * 1024

export function createOgFontLoader(fetchFont: (name: OgFontName) => Promise<Response>) {
  const loaded = new Map<OgFontName, Uint8Array<ArrayBuffer>>()
  return async (name: OgFontName): Promise<Uint8Array<ArrayBuffer>> => {
    if (!OG_FONT_NAMES.includes(name)) throw new Error('Unknown OG font')
    const cached = loaded.get(name)
    if (cached) return cached
    const response = await fetchFont(name)
    if (!response.ok) throw new Error(`OG font unavailable: ${response.status}`)
    const reader = response.body?.getReader()
    if (!reader) throw new Error('Empty OG font')
    const chunks: Uint8Array[] = []
    let length = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        length += value.length
        if (length > MAX_FONT_BYTES) throw new Error('OG font too large')
        chunks.push(value)
      }
    } finally { await reader.cancel(); reader.releaseLock() }
    if (length < 1000) throw new Error('Invalid OG font')
    const bytes = new Uint8Array(length)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
    // ---- 仅保留成功读取的固定公开资源；部署更换实例时自然失效 ----
    loaded.set(name, bytes)
    return bytes
  }
}
