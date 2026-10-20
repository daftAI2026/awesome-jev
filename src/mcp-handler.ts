/**
 * [INPUT]: 依赖服务端 MCP 快照、官方协议适配器与 Cloudflare 限流绑定
 * [OUTPUT]: 提供仅 /api/mcp 调用的 fetch
 * [POS]: src 的 isolate 初始化边界；SDK 预热不挤占首个请求 CPU
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { env } from 'cloudflare:workers'
import catalog from 'virtual:mcp-catalog'
import { createMcpEndpoint } from './lib/mcp-server'

const endpoint = createMcpEndpoint(catalog, {
  limit: options => env.MCP_RATE_LIMITER.limit(options),
})

export const fetch = (request: Request) => endpoint.fetch(request)
