/**
 * [INPUT]: 依赖内部分页地址、ASSETS 与共享有界读取
 * [OUTPUT]: 提供版本化包布局、条目解析和已构建 HTML 交付
 * [POS]: lib 的物理文件聚合层；不渲染 React，不改变公开 URL
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { boundedBytes } from './local-inspection.ts'
import type { AssetReader } from './static-delivery.ts'

export const PAGE_PACK_MAGIC = 'JEVP0001'
export const PAGE_PACK_SLOTS = 12
export const PAGE_PACK_RECORD_BYTES = 44
export const PAGE_PACK_HEADER_BYTES = 8 + PAGE_PACK_SLOTS * PAGE_PACK_RECORD_BYTES
export const PAGE_PACK_MAX_BYTES = 4 * 1024 * 1024
export const PAGE_HTML_MAX_BYTES = 2 * 1024 * 1024

export function pagePackLocation(assetPath: string): { path: string; slot: number } | undefined {
  const match = /^\/_pages\/([a-f0-9]{1,8})\/(stars|name|date)\/([1-9]\d*)$/.exec(assetPath)
  if (!match) return
  const page = Number(match[3])
  if (!Number.isSafeInteger(page)) throw new Error('Invalid packed page')
  return { path: `/_page-packs/v1/${match[1]}/${Math.floor((page - 1) / 4)}.bin`, slot: ((page - 1) % 4) * 3 + ['stars', 'name', 'date'].indexOf(match[2]) }
}

export function packedPageEntry(bytes: Uint8Array<ArrayBuffer>, slot: number) {
  if (bytes.length < PAGE_PACK_HEADER_BYTES || bytes.length > PAGE_PACK_MAX_BYTES || new TextDecoder().decode(bytes.subarray(0, 8)) !== PAGE_PACK_MAGIC) throw new Error('Invalid page pack')
  if (!Number.isInteger(slot) || slot < 0 || slot >= PAGE_PACK_SLOTS) throw new Error('Invalid page slot')
  const start = 8 + slot * PAGE_PACK_RECORD_BYTES
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const offset = view.getUint32(start)
  const length = view.getUint32(start + 4)
  const htmlLength = view.getUint32(start + 8)
  if (offset < PAGE_PACK_HEADER_BYTES || length < 20 || offset + length > bytes.length || !htmlLength || htmlLength > PAGE_HTML_MAX_BYTES) throw new Error('Missing or invalid packed page')
  const digest = Array.from(bytes.subarray(start + 12, start + 44), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return { gzip: bytes.subarray(offset, offset + length), htmlLength, etag: `W/"${digest}"` }
}

export async function servePackedPage(request: Request, assetPath: string, assets: AssetReader): Promise<Response | undefined> {
  const location = pagePackLocation(assetPath)
  if (!location) return
  // --- 包的 ETag 不等于页面 ETag；内部读取始终使用 GET，不转发条件头 ---
  const response = await assets(new Request(new URL(location.path, request.url)))
  if (response.status === 404) { await response.body?.cancel(); return }
  if (response.status !== 200) { await response.body?.cancel(); throw new Error('Page pack unavailable') }
  const bytes = await boundedBytes(response, PAGE_PACK_MAX_BYTES)
  const entry = packedPageEntry(bytes, location.slot)
  const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate', 'ETag': entry.etag, 'X-Jev-Delivery': 'static' })
  const modified = response.headers.get('Last-Modified')
  if (modified) headers.set('Last-Modified', modified)
  const condition = request.headers.get('If-None-Match')
  const since = request.headers.get('If-Modified-Since')
  const unmodified = condition !== null
    ? condition.split(',').some((tag) => tag.trim() === '*' || tag.trim().replace(/^W\//, '') === entry.etag.replace(/^W\//, ''))
    : !!(modified && since && Date.parse(modified) <= Date.parse(since))
  // --- HEAD/304 只验证包布局与页面身份；不执行正文解压 ---
  if (unmodified) return new Response(null, { status: 304, headers })
  if (request.method === 'HEAD') return new Response(null, { headers })
  // --- 只解压选中条目；包内其它语言、页码和排序不进入 HTML 解析 ---
  const body = new Response(entry.gzip).body!.pipeThrough(new DecompressionStream('gzip'))
  const html = await boundedBytes(new Response(body), entry.htmlLength)
  if (html.length !== entry.htmlLength) throw new Error('Packed HTML length mismatch')
  return new Response(html, { headers })
}
