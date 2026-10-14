/**
 * [INPUT]: 依赖 getNewsIndex 同源数据边界、新闻/分页搜索校验与本地化 head
 * [OUTPUT]: 对外提供新闻索引 Route、逐页规范地址和可供 App 消费的 loaderData
 * [POS]: routes 的新闻数据入口；SSR/导航只取当前页与计数，历史搜索由客户端静态快照完成
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute } from '@tanstack/react-router'
import { getNewsIndex } from '@/lib/catalog.functions'
import { newsPreviewSearch } from '@/lib/news'
import { localizedHead } from '@/lib/locale-head'
import { localeFromParam } from '@/lib/locale-routes'

const TITLE = 'Jev News · Awesome JEV'
const DESCRIPTION = 'Recent news and updates related to TypeSafe Jev and its open-source ecosystem.'

export const Route = createFileRoute('/_directory/{-$locale}/news')({
  validateSearch: newsPreviewSearch,
  loaderDeps: ({ search }) => ({ page: search.page, preview: search.preview }),
  loader: ({ deps }) => getNewsIndex({ data: deps }),
  head: ({ params, loaderData }) => {
    const locale = localeFromParam(params.locale)
    return localizedHead({
      path: '/news', locale, page: loaderData?.page ?? 1,
      title: locale === 'zh' ? 'Jev 新闻 · Awesome JEV' : locale === 'ja' ? 'Jev ニュース · Awesome JEV' : TITLE,
      description: locale === 'zh' ? '与 TypeSafe Jev 及其开源生态相关的近期新闻和动态。' : locale === 'ja' ? 'TypeSafe Jev とそのオープンソースコミュニティに関する最近のニュースと動向。' : DESCRIPTION,
    })
  },
  component: () => null,
})
