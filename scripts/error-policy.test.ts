/**
 * [INPUT]: 依赖错误公开纯策略与 Node test
 * [OUTPUT]: 验证错误/缺失状态分离及异常正文脱敏
 * [POS]: scripts 的离线错误策略回归，与真实 HTTP 故障测试互补
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { hasRouteError, publicErrorAdapter } from '../src/lib/error-policy.ts'

test('only application errors activate 500 recovery', () => {
  assert.equal(hasRouteError([]), false)
  assert.equal(hasRouteError([{ status: 'success' }, { status: 'notFound' }]), false)
  assert.equal(hasRouteError([{ status: 'success' }, { status: 'error' }]), true)
})

test('public Error serialization removes message, stack and cause', () => {
  const error = new Error('PRIVATE_MESSAGE', { cause: new Error('PRIVATE_CAUSE') })
  assert.equal(publicErrorAdapter.test(error), true)
  assert.equal(publicErrorAdapter.test({ message: 'not an Error' }), false)
  assert.equal(publicErrorAdapter.toSerializable(error), null)
  const restored = publicErrorAdapter.fromSerializable(null)
  assert.equal(restored.message, 'Unexpected application error')
  assert.equal(restored.cause, undefined)
})
