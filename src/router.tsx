/**
 * [INPUT]: 依赖 TanStack Router 与生成的 routeTree
 * [OUTPUT]: 对外提供 逐请求创建的 getRouter 和路由类型注册
 * [POS]: src 的路由装配入口，与 routes 分离配置和页面职责
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    unmaskOnReload: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
