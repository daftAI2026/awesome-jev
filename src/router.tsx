/**
 * [INPUT]: 依赖 TanStack Router、生成的 routeTree 与首次水合滚动策略
 * [OUTPUT]: 对外提供 逐请求创建的 getRouter 和路由类型注册，保留首屏已发生的阅读
 * [POS]: src 的路由装配入口，与 routes 分离配置和页面职责
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { initialScrollRestoration } from './lib/scroll-restoration'

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: initialScrollRestoration(
      typeof window === 'undefined' ? null : window.location.pathname + window.location.search + window.location.hash,
      () => typeof window === 'undefined' ? 0 : window.scrollY,
    ),
    defaultPreload: 'intent',
    unmaskOnReload: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
