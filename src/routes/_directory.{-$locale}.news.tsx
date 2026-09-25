import { createFileRoute } from '@tanstack/react-router'
import newsData from '../../data/news.json'
import { newsPreviewSearch } from '@/lib/news'
import { localizedHead } from '@/lib/locale-head'
import { localeFromParam } from '@/lib/locale-routes'

const TITLE = 'Jev News · Awesome JEV'
const DESCRIPTION = 'Recent news and updates related to TypeSafe Jev and its open-source ecosystem.'

export const Route = createFileRoute('/_directory/{-$locale}/news')({
  validateSearch: newsPreviewSearch,
  loader: () => newsData,
  head: ({ params }) => {
    const locale = localeFromParam(params.locale)
    return localizedHead({
      path: '/news', locale,
      title: locale === 'zh' ? 'Jev 新闻 · Awesome JEV' : locale === 'ja' ? 'Jev ニュース · Awesome JEV' : TITLE,
      description: locale === 'zh' ? '与 TypeSafe Jev 及其开源生态相关的近期新闻和动态。' : locale === 'ja' ? 'TypeSafe Jev とそのオープンソースコミュニティに関する最近のニュースと動向。' : DESCRIPTION,
    })
  },
  component: () => null,
})
