import { createFileRoute } from '@tanstack/react-router'
import { savedRouteSearch } from '@/lib/saved'
import { localizedHead } from '@/lib/locale-head'

export const Route = createFileRoute('/_directory/{-$locale}/saved')({
  validateSearch: savedRouteSearch,
  head: ({ params }) => {
    const locale = params.locale === 'zh' ? 'zh' : 'en'
    return localizedHead({
      path: '/saved', locale, robots: 'noindex, nofollow',
      title: locale === 'zh' ? '收藏 · Awesome JEV' : 'Saved items · Awesome JEV',
      description: locale === 'zh' ? '保存在当前浏览器的 Jev 项目与新闻。' : 'Jev projects and news saved in this browser.',
    })
  },
  component: () => null,
})
