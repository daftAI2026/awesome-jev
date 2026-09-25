import { ArrowSquareOut } from '@phosphor-icons/react'
import { useI18n } from '@/i18n'
import { newsTime, type NewsItem } from '@/lib/news'
import { Button } from '@/components/ui/button'

export function NewsItemMeta({ item }: { item: NewsItem }) {
  const { locale, t } = useI18n()
  const date = new Date(newsTime(item)).toISOString()
  const formattedDate = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))

  return <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
    <span>{item.sourceName}</span>
    <span aria-hidden>·</span><time dateTime={date}>{formattedDate}</time>
    {item.score != null && <><span aria-hidden>·</span><span className="tabular-nums">{t('newsScore', { score: item.score })}</span></>}
  </p>
}

export function NewsItemContent({ item, standalone = false }: { item: NewsItem; standalone?: boolean }) {
  const { t } = useI18n()
  const SectionHeading = standalone ? 'h2' : 'h3'
  const originalTitle = item.originalTitle && !/^https?:\/\//i.test(item.originalTitle) &&
    item.originalTitle !== item.title ? item.originalTitle : null

  return <div className="space-y-6">
    <section>
      <SectionHeading className="mb-2 text-sm font-medium">{t('newsSummary')}</SectionHeading>
      <p className="whitespace-pre-line break-words text-base leading-relaxed">{item.summary ?? t('newsNoSummary')}</p>
    </section>
    {originalTitle && <section>
      <SectionHeading className="text-sm font-medium">{t('newsOriginalTitle')}</SectionHeading>
      <p className="mt-2 border-l-2 border-border pl-3 text-sm leading-relaxed text-muted-foreground">{originalTitle}</p>
    </section>}
    {item.reason && <section>
      <SectionHeading className="text-sm font-medium">{t('newsReason')}</SectionHeading>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{item.reason}</p>
    </section>}
  </div>
}

export function NewsSourceLinks({ item }: { item: NewsItem }) {
  const { t } = useI18n()
  return <>
    <Button variant="outline" className="h-10 gap-2 px-4" nativeButton={false}
      render={<a href={item.aihotUrl} target="_blank" rel="noopener noreferrer" />}>
      {t('newsOpenAihot')}<ArrowSquareOut className="size-4" aria-hidden />
    </Button>
    <Button className="h-10 gap-2 px-4" nativeButton={false}
      render={<a href={item.originalUrl} target="_blank" rel="noopener noreferrer" />}>
      {t('newsOpenOriginal')}<ArrowSquareOut className="size-4" aria-hidden />
    </Button>
  </>
}
