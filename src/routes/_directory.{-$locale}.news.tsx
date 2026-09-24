import { createFileRoute } from '@tanstack/react-router'
import { newsPreviewSearch } from '@/lib/news'
import { localizedHead } from '@/lib/locale-head'

const TITLE = 'Jev News · Awesome JEV'
const DESCRIPTION = 'Recent news and updates related to TypeSafe Jev and its open-source ecosystem.'

export const Route = createFileRoute('/_directory/{-$locale}/news')({
  validateSearch: newsPreviewSearch,
  head: ({ params }) => {
    const locale = params.locale === 'zh' ? 'zh' : 'en'
    return localizedHead({
      path: '/news', locale, robots: 'noindex, follow',
      title: locale === 'zh' ? 'Jev 新闻 · Awesome JEV' : TITLE,
      description: locale === 'zh' ? '与 TypeSafe Jev 及其开源生态相关的近期新闻和动态。' : DESCRIPTION,
    })
  },
  component: () => null,
})
