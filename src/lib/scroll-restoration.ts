/**
 * [INPUT]: 依赖路由创建时的 URL 与按需读取的实际滚动位置
 * [OUTPUT]: 对外提供 initialScrollRestoration，供 Router 公开滚动策略回调消费
 * [POS]: lib 的首次水合滚动边界；仅保留已发生的阅读，后续导航交还 Router
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export function initialScrollRestoration(initialHref: string | null, readScrollY: () => number) {
  let firstRender = true
  return ({ location }: { location: { href: string } }) => {
    const first = firstRender
    firstRender = false
    return !(first && initialHref !== null && !initialHref.includes('#')
      && location.href === initialHref && readScrollY() > 0)
  }
}
