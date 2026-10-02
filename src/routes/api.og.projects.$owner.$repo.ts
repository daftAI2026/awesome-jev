/**
 * [INPUT]: 依赖 Start 路由参数与规范目录身份查找
 * [OUTPUT]: 对外提供 /api/og/projects/$owner/$repo 的 GET/HEAD PNG、404 与其它方法的 405
 * [POS]: routes 的项目分享图端点，只渲染已收录项目，拒绝任意内容生成
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/og/projects/$owner/$repo')({
  server: { handlers: {
    ANY: async ({ request, params }) => (await import('@/lib/og-service.server')).ogResponse(request, params),
  } },
})
