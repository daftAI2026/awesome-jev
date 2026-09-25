import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft } from '@phosphor-icons/react'
import newsData from '../../data/news.json'
import { DecryptedBrand } from '@/components/DecryptedBrand'
import { LanguageMenu } from '@/components/LanguageMenu'
import { NewsItemContent, NewsItemMeta, NewsSourceLinks } from '@/components/NewsItemContent'
import { SaveButton } from '@/components/SaveButton'
import { ThemeMenu } from '@/components/ThemeMenu'
import { useSaved } from '@/hooks/useSaved'
import { useI18n } from '@/i18n'
import { localizedHead } from '@/lib/locale-head'
import { localizedPath } from '@/lib/locale-routes'
import { findNewsItem, hasIndexableNewsSummary, newsPath, type NewsItem } from '@/lib/news'

const news = newsData as NewsItem[]

export const Route = createFileRoute('/{-$locale}/news/$id')({
  beforeLoad: ({ params }) => {
    if (params.locale && params.locale !== 'zh') throw notFound()
  },
  loader: ({ params }) => {
    const item = findNewsItem(news, params.id)
    if (!item) throw notFound()
    return item
  },
  head: ({ loaderData, params }) => {
    const item = loaderData as NewsItem | undefined
    if (!item) return { meta: [{ title: 'News not found · Awesome JEV' }, { name: 'robots', content: 'noindex' }] }
    return localizedHead({
      path: newsPath(item.id) ?? '/news',
      locale: params.locale === 'zh' ? 'zh' : 'en',
      title: `${item.title} · Jev News · Awesome JEV`,
      description: (item.summary ?? item.title).replace(/\s+/g, ' ').slice(0, 240),
      robots: hasIndexableNewsSummary(item.summary) ? undefined : 'noindex, follow',
      type: 'article',
    })
  },
  component: NewsItemPage,
})

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
