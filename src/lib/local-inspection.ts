/**
 * [INPUT]: 依赖浏览器 fetch、流式响应与可取消信号
 * [OUTPUT]: 对外提供 readLocal、boundedBytes 的有界同源只读能力
 * [POS]: lib 的工作台网络边界；OG 与 SEO 共用超时/容量规则，不读取第三方地址
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export async function readLocal(path: string, signal?: AbortSignal): Promise<Response> {
  // oxlint-disable-next-line no-control-regex -- 控制字符和反斜线不能成为探针路径。
  if (!path.startsWith('/') || path.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(path)) throw new Error('Expected a same-origin path')
  return fetch(path, { signal: AbortSignal.any([AbortSignal.timeout(15_000), ...(signal ? [signal] : [])]), cache: 'no-store' })
}

export async function boundedBytes(response: Response, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  const reader = response.body?.getReader()
  if (!reader) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.length
      if (length > limit) throw new Error('Response exceeds inspection budget')
      chunks.push(value)
    }
  } finally { await reader.cancel(); reader.releaseLock() }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  return bytes
}
