/**
 * [INPUT]: 依赖分享图身份、纯 SVG 模板与调用方注入的渲染/缓存能力
 * [OUTPUT]: 提供 PNG/条件响应、静态图片交付与开发渲染的在途合并
 * [POS]: lib 的 OG HTTP 策略；静态与开发入口共用身份、版本和条件响应
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { projectShareImage, siteShareImage, SITE_ORIGIN, type ShareProject } from './share-image.ts'
import { renderProjectSvg, renderSiteSvg } from './og-template.ts'

export type OgContent = { kind: 'site'; projectCount: number } | { kind: 'project'; item: ShareProject }
export interface OgPorts {
  banner: string
  render: (svg: string) => Promise<Uint8Array<ArrayBuffer>>
  inflight?: Map<string, Promise<Uint8Array<ArrayBuffer>>>
  cache?: { match: (request: Request) => Promise<Response | undefined>; put: (request: Request, response: Response) => Promise<void> }
}

function failure(status: number, message: string, method: string): Response {
  return new Response(method === 'HEAD' ? null : message, { status, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8', ...(status === 405 ? { Allow: 'GET, HEAD' } : {}) } })
}

function representation(request: Request, image: { path: string } | null, projectCount?: number) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return failure(405, 'Method not allowed', request.method)
  if (!image) return failure(404, 'Project not found', request.method)
  const current = new URL(image.path, SITE_ORIGIN)
  const incoming = new URL(request.url)
  const versioned = incoming.search === current.search && incoming.pathname === current.pathname
  // --- 旧版本与多余参数统一到有限目录地址，避免任意查询制造无限缓存键 ---
  if (incoming.search && !versioned) return new Response(null, { status: 307, headers: { Location: image.path, 'Cache-Control': 'no-store' } })
  const etag = `"og-${current.searchParams.get('v')}"`
  const headers = new Headers({
    'Content-Type': 'image/png',
    'X-Content-Type-Options': 'nosniff',
    'Content-Location': image.path,
    'Cache-Control': versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=60',
    ETag: etag,
    ...(projectCount !== undefined ? { 'X-OG-Project-Count': String(projectCount) } : {}),
  })
  if (request.headers.get('If-None-Match')?.split(',').some((value) => value.trim().replace(/^W\//, '') === etag || value.trim() === '*')) {
    return new Response(null, { status: 304, headers })
  }
  if (request.method === 'HEAD') return new Response(null, { headers })
  return { headers, current }
}

export async function serveOgAsset(request: Request, image: { path: string; asset: string; count?: number } | null,
  readAsset: (request: Request) => Promise<Response>): Promise<Response> {
  const result = representation(request, image, image?.count)
  if (result instanceof Response) return result
  try {
    const asset = await readAsset(new Request(new URL(image!.asset, request.url)))
    if (asset.status !== 200) { await asset.body?.cancel(); return failure(503, 'OG image unavailable', request.method) }
    result.headers.set('X-OG-Cache', 'STATIC')
    return new Response(asset.body, { headers: result.headers })
  } catch { return failure(503, 'OG image unavailable', request.method) }
}

export async function serveOg(request: Request, content: OgContent | null, ports: OgPorts): Promise<Response> {
  const image = content ? content.kind === 'site' ? siteShareImage(content.projectCount) : projectShareImage(content.item) : null
  const result = representation(request, image, content?.kind === 'site' ? content.projectCount : undefined)
  if (result instanceof Response) return result
  const { headers, current } = result
  const key = new Request(current)
  try {
    const cached = await ports.cache?.match(key)
    if (cached) {
      headers.set('X-OG-Cache', 'HIT')
      return new Response(cached.body, { headers })
    }
    let task = ports.inflight?.get(key.url)
    if (!task) {
      // ---- 只共享 PNG 字节；流、Request 与 Response 留在所属请求内 ----
      task = Promise.resolve().then(async () => {
        const svg = content!.kind === 'site' ? renderSiteSvg(content!.projectCount, ports.banner) : renderProjectSvg(content!.item, ports.banner)
        const png = await ports.render(svg)
        if (ports.cache) {
          const cacheHeaders = new Headers(headers)
          cacheHeaders.set('Cache-Control', 'public, max-age=31536000, immutable')
          await ports.cache.put(key, new Response(png.slice(), { headers: cacheHeaders }))
        }
        return png
      }).finally(() => { ports.inflight?.delete(key.url) })
      ports.inflight?.set(key.url, task)
    }
    const png = await task
    headers.set('X-OG-Cache', 'MISS')
    return new Response(png.slice(), { headers })
  } catch {
    // 不回退到旧图或全站图：工作台能发现真实渲染失败。
    return failure(503, 'OG image unavailable', request.method)
  }
}
