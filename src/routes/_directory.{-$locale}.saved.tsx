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
