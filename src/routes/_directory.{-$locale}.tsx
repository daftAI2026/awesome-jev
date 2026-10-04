/**
 * [INPUT]: 依赖 TanStack 文件路由/Outlet/404 与 locale-routes 的语言参数白名单
 * [OUTPUT]: 对外提供目录语言分组 Route，拒绝未知语言并承接子路由
 * [POS]: routes 的语言布局边界，先校验路径参数再向目录子页面传递渲染入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { isLocalizedRouteParam } from '@/lib/locale-routes'

export const Route = createFileRoute('/_directory/{-$locale}')({
  beforeLoad: ({ params }) => {
    if (!isLocalizedRouteParam(params.locale)) throw notFound()
  },
  component: Outlet,
})
