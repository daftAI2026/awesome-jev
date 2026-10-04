/**
 * [INPUT]: 依赖 TanStack 文件路由、savedRouteSearch 和共享语言/页面元数据工具
 * [OUTPUT]: 对外提供三语言收藏 Route、验证搜索状态及 noindex/nofollow 页面身份
 * [POS]: routes 的本地收藏入口，不读取远端或复制内容；实际结果由父级目录布局渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute } from '@tanstack/react-router'
import { savedRouteSearch } from '@/lib/saved'
import { localizedHead } from '@/lib/locale-head'
import { localeFromParam } from '@/lib/locale-routes'

export const Route = createFileRoute('/_directory/{-$locale}/saved')({
  validateSearch: savedRouteSearch,
  head: ({ params }) => {
    const locale = localeFromParam(params.locale)
    return localizedHead({
      path: '/saved', locale, robots: 'noindex, nofollow',
      title: locale === 'zh' ? '收藏 · Awesome JEV' : locale === 'ja' ? '保存済み · Awesome JEV' : 'Saved items · Awesome JEV',
      description: locale === 'zh' ? '保存在当前浏览器的 Jev 项目与新闻。' : locale === 'ja' ? 'このブラウザーに保存した Jev のプロジェクトとニュース。' : 'Jev projects and news saved in this browser.',
    })
  },
  component: () => null,
})
