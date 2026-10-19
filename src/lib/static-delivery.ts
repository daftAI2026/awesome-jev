/**
 * [INPUT]: 依赖构建期清单、Router 查询解析、仓库白名单与 ASSETS
 * [OUTPUT]: 提供静态页地址、图片清单类型和请求交付入口
 * [POS]: lib 的免费交付边界；未覆盖的请求交还原路由
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { directorySearch, paginationRange } from './pagination.ts'
import { serveOgAsset } from './og-response.ts'
import { defaultParseSearch } from '@tanstack/react-router'
import { projectPath } from './project-routes.ts'

export interface StaticCatalog {
  pages: Record<string, number>
  images: Record<string, { path: string; asset: string; count?: number }>
}
export type AssetReader = (request: Request) => Promise<Response>

export function staticPagePath(path: string, page: number, sort: string): string {
  if (page === 1 && sort === 'stars' && !path.includes('%')) return path
  // --- 有界内部地址不含编码分隔符；构建清单检查散列碰撞 ---
  let hash = 2166136261
  for (let i = 0; i < path.length; i++) hash = Math.imul(hash ^ path.charCodeAt(i), 16777619)
  return `/_pages/${(hash >>> 0).toString(16)}/${sort}/${page}`
}

export async function staticDelivery(request: Request, catalog: StaticCatalog, assets: AssetReader): Promise<Response | undefined> {
  const url = new URL(request.url)
  const lowerPath = url.pathname.toLowerCase()
  let ogPath = lowerPath === '/og.png' ? '/api/og/site' : lowerPath
  const repository = lowerPath.match(/^\/api\/og\/projects\/([^/]+)\/([^/]+)$/)
  if (repository) {
    try {
      const path = projectPath(decodeURIComponent(repository[1]), decodeURIComponent(repository[2]))
      ogPath = path ? `/api/og${path}` : ''
    } catch { return new Response(request.method === 'HEAD' ? null : 'Invalid path', { status: 400, headers: { 'Cache-Control': 'no-store' } }) }
  }
  if (ogPath === '/api/og/site' || repository) {
    return serveOgAsset(request, Object.hasOwn(catalog.images, ogPath) ? catalog.images[ogPath] : null, assets)
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') return
  if (!Object.hasOwn(catalog.pages, url.pathname) || url.searchParams.has('preview')) return
  if (url.searchParams.getAll('page').length > 1 || url.searchParams.getAll('sort').length > 1) return
  const search = directorySearch(defaultParseSearch(url.search))
  const page = paginationRange(catalog.pages[url.pathname], search.page).page
  const sort = /\/(news|tags)$/.test(url.pathname) ? 'stars' : search.sort ?? 'stars'
  const assetUrl = new URL(staticPagePath(url.pathname, page, sort), request.url)
  const headers = new Headers()
  for (const key of ['If-None-Match', 'If-Modified-Since']) {
    const value = request.headers.get(key)
    if (value) headers.set(key, value)
  }
  let response: Response
  try { response = await assets(new Request(assetUrl, { method: request.method, headers })) }
  catch {
    return new Response(request.method === 'HEAD' ? null : 'Page unavailable', {
      status: 503, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
  if (response.status !== 200 && response.status !== 304) { await response.body?.cancel(); return }
  const outgoing = new Headers(response.headers)
  outgoing.set('X-Jev-Delivery', 'static')
  return new Response(response.body, { status: response.status, headers: outgoing })
}
