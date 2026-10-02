/**
 * [INPUT]: 依赖 Start 服务端路由与 OG 快照/渲染入口
 * [OUTPUT]: 对外提供 /api/og/site 的 GET/HEAD PNG 与其它方法的 405 响应
 * [POS]: routes 的全站分享图端点，不预渲染、不生成磁盘文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/og/site')({
  server: { handlers: {
    ANY: async ({ request }) => (await import('@/lib/og-service.server')).ogResponse(request),
  } },
})
