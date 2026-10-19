/**
 * [INPUT]: 依赖 TanStack Start 的请求作用域与流式 SSR
 * [OUTPUT]: 提供原有 SSR fetch 入口
 * [POS]: src 的延迟渲染器；静态页和生产 OG 不加载它
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createStartHandler, createServerEntry, defaultStreamHandler } from '@tanstack/react-start/server'

export default createServerEntry({ fetch: createStartHandler(defaultStreamHandler) })
