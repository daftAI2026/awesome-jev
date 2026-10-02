/**
 * [INPUT]: 依赖 Start 服务端路由与全站 OG 运行时入口
 * [OUTPUT]: 对外保留 /og.png 旧分享地址的 GET/HEAD 响应
 * [POS]: routes 的兼容边界；与新端点共用当前目录计数，不保存旧 PNG
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/og.png')({
  server: { handlers: {
    ANY: async ({ request }) => (await import('@/lib/og-service.server')).ogResponse(request),
  } },
})
