/**
 * [INPUT]: 依赖 新闻快照、新闻身份工具、摘要组件和共享 404 页面
 * [OUTPUT]: 对外提供 新闻详情 Route、索引策略及缺失新闻边界
 * [POS]: routes 的独立新闻页，只展示已有摘要和原始来源链接
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft } from '@phosphor-icons/react'
import newsData from '../../data/news.json'
import { DecryptedBrand } from '@/components/DecryptedBrand'
import { LanguageMenu } from '@/components/LanguageMenu'
import { NotFoundPage } from '@/components/NotFoundPage'
import { NewsItemContent, NewsItemMeta, NewsSourceLinks } from '@/components/NewsItemContent'
import { SaveButton } from '@/components/SaveButton'
import { ThemeMenu } from '@/components/ThemeMenu'
import { useSaved } from '@/hooks/useSaved'
import { useI18n } from '@/i18n'
import { catalogs } from '@/i18n/catalogs'
import { localizedHead } from '@/lib/locale-head'
import { isLocalizedRouteParam, localeFromParam, localizedPath } from '@/lib/locale-routes'
import { findNewsItem, hasIndexableNewsSummary, newsPath, type NewsItem } from '@/lib/news'

const news = newsData as NewsItem[]

export const Route = createFileRoute('/{-$locale}/news/$id')({
  beforeLoad: ({ params }) => {
    if (!isLocalizedRouteParam(params.locale)) throw notFound()
  },
  loader: ({ params }) => {
    const item = findNewsItem(news, params.id)
    if (!item) throw notFound()
    return item
  },
  head: ({ loaderData, params }) => {
    const item = loaderData as NewsItem | undefined
    const locale = localeFromParam(params.locale)
    if (!item) return { meta: [{ title: `${catalogs[locale].newsNotFound} · Awesome JEV` }, { name: 'robots', content: 'noindex' }] }
    return localizedHead({
      path: newsPath(item.id) ?? '/news',
      locale,
      title: `${item.title} · ${catalogs[locale].newsLabel} · Awesome JEV`,
      description: (item.summary ?? item.title).replace(/\s+/g, ' ').slice(0, 240),
      robots: hasIndexableNewsSummary(item.summary) ? undefined : 'noindex, follow',
      type: 'article',
    })
  },
  component: NewsItemPage,
  notFoundComponent: NewsNotFound,
})

function NewsNotFound() {
  return <NotFoundPage kind="news" />
}

function NewsItemPage() {
  const item = Route.useLoaderData()
  const { locale, t } = useI18n()
  const { entries, toggle } = useSaved()
  const saved = entries.some((entry) => entry.kind === 'news' && entry.id === item.id)

  return <div className="min-h-dvh bg-background text-foreground">
    <header className="sticky top-0 z-40 bg-background">
      <div className="flex h-14 w-full items-center justify-between gap-3 px-4">
        <div className="text-base font-medium tracking-tight sm:text-lg"><DecryptedBrand onClick={() => {}} /></div>
        <div className="flex items-center gap-2"><ThemeMenu /><LanguageMenu /></div>
      </div>
    </header>
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <Link to={localizedPath('/news', locale)} className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />{t('newsLabel')}
      </Link>
      <article className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 p-4 sm:p-6">
          <h1 className="min-w-0 break-words text-xl leading-snug font-medium">{item.title}</h1>
          <SaveButton saved={saved} onToggle={() => toggle('news', item.id)} />
          <div className="col-span-2"><NewsItemMeta item={item} /></div>
        </div>
        <div className="px-4 pb-6 sm:px-6"><NewsItemContent item={item} standalone /></div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border p-4 sm:p-6">
          <NewsSourceLinks item={item} />
        </div>
      </article>
    </main>
  </div>
}
