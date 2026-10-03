/**
 * [INPUT]: 依赖已加载 Umami 的可选 track 能力与有限语言/分类枚举
 * [OUTPUT]: 对外提供 trackProjectAction，记录出站、分类和相关项目点击
 * [POS]: lib 的非阻塞统计适配器；不记录搜索词、收藏或个人身份，失败不影响导航
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { Category } from './categories.ts'
import type { Locale } from './locale-routes.ts'

export function trackProjectAction(
  event: 'github-open' | 'project-category-open' | 'related-project-open',
  locale: Locale,
  placement: 'detail' | 'preview',
  category?: Category,
) {
  if (typeof window === 'undefined' || import.meta.env.DEV) return
  const tracker = (window as Window & { umami?: { track: (name: string, data: Record<string, string>) => Promise<unknown> | void } }).umami
  // --- 统计被拦截、未加载或拒绝请求时，链接仍按原行为跳转 ---
  try {
    const result = tracker?.track(event, { locale, placement, ...(category ? { category } : {}) })
    void result?.catch(() => {})
  } catch { /* 统计不是导航的前置条件。 */ }
}
