/**
 * [INPUT]: 依赖构建期静态清单、ASSETS 与延迟加载的 Start 渲染器
 * [OUTPUT]: 提供 Worker fetch 入口，先交付已生成页面和 PNG
 * [POS]: src 的请求计算边界；开发和未覆盖的路由保留 Start 行为
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { env } from 'cloudflare:workers'
import catalog from 'virtual:static-catalog'
import { staticDelivery } from './lib/static-delivery'
import type { RequestHandler } from '@tanstack/react-start/server'
import type { Register } from '@tanstack/react-router'

const fetch: RequestHandler<Register> = async (request, options) => {
  if (import.meta.env.PROD) {
    const response = await staticDelivery(request, catalog, (asset) => env.ASSETS.fetch(asset))
    if (response) return response
  }
  const { default: server } = await import('./ssr-handler')
  return server.fetch(request, options)
}

export default { fetch }
