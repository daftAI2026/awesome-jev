/**
 * [INPUT]: 依赖 Node test 与首次水合滚动策略
 * [OUTPUT]: 对外提供迟到水合、后续导航与 hash 的滚动边界回归
 * [POS]: scripts 的 Router 启动策略护栏，与 masonry 内部偏移检查互补
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { initialScrollRestoration } from '../src/lib/scroll-restoration.ts'

const at = (href: string) => ({ location: { href } })

test('first hydration preserves reading begun after router creation, then restores default behavior', () => {
  let y = 0
  const restore = initialScrollRestoration('/zh', () => y)
  y = 2000
  assert.equal(restore(at('/zh')), false)
  assert.equal(restore(at('/zh/news')), true)
  assert.equal(restore(at('/zh')), true)
})

test('an intervening navigation consumes the initial exception even before returning', () => {
  const restore = initialScrollRestoration('/zh', () => 2000)
  assert.equal(restore(at('/zh/news')), true)
  assert.equal(restore(at('/zh')), true)
})

test('server, page-top and hash navigation keep the normal restoration behavior', () => {
  for (const [href, y] of [[null, 0], ['/zh', 0], ['/zh#main', 2000]] as const) {
    const restore = initialScrollRestoration(href, () => y)
    assert.equal(restore(at(href ?? '/zh')), true)
  }
})
