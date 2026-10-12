/**
 * [INPUT]: 依赖 TanStack 序列化适配器与路由状态，不读取异常正文
 * [OUTPUT]: 提供 hasRouteError 与 publicErrorAdapter
 * [POS]: lib 的错误公开边界；SSR/水合只传通用错误，不传 message/stack/cause
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createSerializationAdapter } from '@tanstack/react-router'

export function hasRouteError(matches: readonly { status: string }[]): boolean {
  return matches.some((match) => match.status === 'error')
}

export const publicErrorAdapter = createSerializationAdapter<Error, null>({
  key: 'AwesomeJevPublicError',
  test: (value): value is Error => value instanceof Error,
  toSerializable: () => null,
  fromSerializable: () => new Error('Unexpected application error'),
})
