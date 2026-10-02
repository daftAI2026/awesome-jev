/**
 * [INPUT]: 依赖分享图身份、纯 SVG 模板与调用方注入的渲染/缓存能力
 * [OUTPUT]: 对外提供 serveOg 的 PNG、条件请求、规范版本和失败响应
 * [POS]: lib 的 OG HTTP 策略；先验证当前目录身份，再读缓存，不接受任意标题或图片地址
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { projectShareImage, siteShareImage, SITE_ORIGIN, type ShareProject } from './share-image.ts'
import { renderProjectSvg, renderSiteSvg } from './og-template.ts'

export type OgContent = { kind: 'site'; projectCount: number } | { kind: 'project'; item: ShareProject }
export interface OgPorts {
  banner: string
  render: (svg: string) => Promise<Uint8Array<ArrayBuffer>>
  cache?: { match: (request: Request) => Promise<Response | undefined>; put: (request: Request, response: Response) => Promise<void> }
}

function failure(status: number, message: string, method: string): Response {
  return new Response(method === 'HEAD' ? null : message, { status, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8', ...(status === 405 ? { Allow: 'GET, HEAD' } : {}) } })
}

export async function serveOg(request: Request, content: OgContent | null, ports: OgPorts): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return failure(405, 'Method not allowed', request.method)
  if (!content) return failure(404, 'Project not found', request.method)
  const image = content.kind === 'site' ? siteShareImage(content.projectCount) : projectShareImage(content.item)
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
    ...(content.kind === 'site' ? { 'X-OG-Project-Count': String(content.projectCount) } : {}),
  })
  if (request.headers.get('If-None-Match')?.split(',').some((value) => value.trim().replace(/^W\//, '') === etag || value.trim() === '*')) {
    return new Response(null, { status: 304, headers })
  }
  if (request.method === 'HEAD') return new Response(null, { headers })
  const key = new Request(current)
  try {
    const cached = await ports.cache?.match(key)
    if (cached) {
      headers.set('X-OG-Cache', 'HIT')
      return new Response(cached.body, { headers })
    }
    const svg = content.kind === 'site' ? renderSiteSvg(content.projectCount, ports.banner) : renderProjectSvg(content.item, ports.banner)
    const png = await ports.render(svg)
    headers.set('X-OG-Cache', 'MISS')
    const response = new Response(png, { headers })
    if (ports.cache) {
      const cacheHeaders = new Headers(headers)
      cacheHeaders.set('Cache-Control', 'public, max-age=31536000, immutable')
      await ports.cache.put(key, new Response(response.clone().body, { headers: cacheHeaders }))
    }
    return response
  } catch {
    // 不回退到旧图或全站图：工作台能发现真实渲染失败。
    return failure(503, 'OG image unavailable', request.method)
  }
}
