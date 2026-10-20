/**
 * [INPUT]: 依赖静态清单、ASSETS、预初始化 MCP 与延迟 Start
 * [OUTPUT]: 提供 Worker fetch；MCP、静态页面和 SSR 分路
 * [POS]: src 的计算边界；MCP 校验器在 isolate 启动期初始化
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { env } from 'cloudflare:workers'
import catalog from 'virtual:static-catalog'
import { staticDelivery } from './lib/static-delivery'
import { fetch as mcpFetch } from './mcp-handler'
import type { RequestHandler } from '@tanstack/react-start/server'
import type { Register } from '@tanstack/react-router'

const fetch: RequestHandler<Register> = async (request, options) => {
  if (new URL(request.url).pathname === '/api/mcp') {
    return mcpFetch(request)
  }
  if (import.meta.env.PROD) {
    const response = await staticDelivery(request, catalog, (asset) => env.ASSETS.fetch(asset))
    if (response) return response
  }
  const { default: server } = await import('./ssr-handler')
  return server.fetch(request, options)
}

export default { fetch }
