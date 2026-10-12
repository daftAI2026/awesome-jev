/**
 * [INPUT]: 依赖 TanStack Start 和 Error 公开序列化策略
 * [OUTPUT]: 提供 startInstance，为 SSR 与服务端函数共用异常脱敏
 * [POS]: src 的 Start 配置入口；错误细节留在服务端，不进入水合数据
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createStart } from '@tanstack/react-start'
import { publicErrorAdapter } from './lib/error-policy'

export const startInstance = createStart(() => ({
  serializationAdapters: [publicErrorAdapter],
}))
