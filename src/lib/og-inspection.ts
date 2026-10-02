/**
 * [INPUT]: 依赖浏览器 DOMParser、同源 HTTP 读取与 share-image 图片契约
 * [OUTPUT]: 对外提供 inspectSharePage，返回真实 HTML 元数据与 PNG 响应诊断
 * [POS]: lib 的工作台只读探针，不运行被检查页面脚本，不请求第三方分享平台
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { OG_HEIGHT, OG_WIDTH, SITE_ORIGIN, type ShareImage } from './share-image.ts'

export interface OgInspection {
  tags: Array<{ key: string; value: string }>
  errors: string[]
  pageStatus: number
  imageStatus: number | null
  imageSize: string | null
}

// --- 仅允许内部路径；所有网络读取归这个有超时、可取消的只读边界管理 ---
async function readLocal(path: string, signal?: AbortSignal): Promise<Response> {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) throw new Error('Expected a same-origin path')
  return fetch(path, { signal: AbortSignal.any([AbortSignal.timeout(15_000), ...(signal ? [signal] : [])]), cache: 'no-store' })
}

// --- 限制实际读取量而非读完再判定，错误响应不能吞掉工作台内存 ---
async function boundedBytes(response: Response, limit: number): Promise<Uint8Array<ArrayBuffer>> {
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

export async function inspectSharePage(path: string, expectedImage: ShareImage, signal?: AbortSignal): Promise<OgInspection> {
  const response = await readLocal(path, signal)
  const html = new TextDecoder().decode(await boundedBytes(response, 10 * 1024 * 1024))
  const document = new DOMParser().parseFromString(html, 'text/html')
  const tags = Array.from(document.head.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]'))
    .map((node) => ({ key: node.getAttribute('property') ?? node.getAttribute('name')!, value: node.getAttribute('content') ?? '' }))
  const errors: string[] = []
  if (response.status !== 200) errors.push(`Page HTTP ${response.status}`)
  const required = ['og:title', 'og:type', 'og:description', 'og:url', 'og:site_name', 'og:locale', 'og:image', 'og:image:secure_url', 'og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']
  const value = (key: string) => tags.find((tag) => tag.key === key)?.value
  for (const key of required) {
    const matches = tags.filter((tag) => tag.key === key)
    if (matches.length !== 1 || !matches[0].value) errors.push(`${key}: expected one nonempty value, got ${matches.length}`)
  }
  const imageUrl = `${SITE_ORIGIN}${expectedImage.path}`
  for (const key of ['og:image', 'og:image:secure_url', 'twitter:image']) {
    if (value(key) !== imageUrl) errors.push(`${key}: does not match current catalog image`)
  }
  if (value('og:image:width') !== String(OG_WIDTH) || value('og:image:height') !== String(OG_HEIGHT)) errors.push('OG dimensions are not 1200 × 630')
  if (value('og:image:type') !== 'image/png') errors.push('og:image:type is not image/png')
  if (value('twitter:card') !== 'summary_large_image') errors.push('twitter:card is not summary_large_image')
  if (value('twitter:title') !== value('og:title') || value('twitter:description') !== value('og:description')) errors.push('Twitter text differs from OG text')
  if (value('twitter:image:alt') !== value('og:image:alt')) errors.push('Twitter alt differs from OG alt')
  const canonical = document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')
  if (canonical !== `${SITE_ORIGIN}${path}` || value('og:url') !== canonical) errors.push('Canonical and og:url do not match the inspected page')
  tags.push({ key: 'canonical', value: canonical ?? '' })
  let imageStatus: number | null = null
  let imageSize: string | null = null
  try {
    const image = await readLocal(expectedImage.path, signal)
    imageStatus = image.status
    if (image.status !== 200) errors.push(`Image HTTP ${image.status}`)
    if (!image.headers.get('content-type')?.startsWith('image/png')) errors.push('Image response is not image/png')
    const bytes = (await boundedBytes(image, 5 * 1024 * 1024)).buffer
    const signature = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 8))
    if (bytes.byteLength < 24 || signature.join(',') !== '137,80,78,71,13,10,26,10') {
      errors.push('Image response is not a PNG file')
    } else {
      const view = new DataView(bytes)
      const width = view.getUint32(16)
      const height = view.getUint32(20)
      imageSize = `${width} × ${height}`
      if (width !== OG_WIDTH || height !== OG_HEIGHT) errors.push(`PNG dimensions: ${imageSize}`)
    }
  } catch (error) {
    if (signal?.aborted) throw error
    errors.push(`Image fetch: ${error instanceof Error ? error.message : String(error)}`)
  }
  return { tags, errors, pageStatus: response.status, imageStatus, imageSize }
}
