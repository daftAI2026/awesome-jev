/**
 * [INPUT]: 依赖路由 pathname、i18n、语言路径与现有主题/语言菜单及 Button
 * [OUTPUT]: 对外提供 NotFoundPage，支持页面、项目和新闻的缺失状态
 * [POS]: components 的统一恢复页面，自带文案边界以兼容根路由被替换的情况
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Link, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { LanguageMenu } from '@/components/LanguageMenu'
import { ThemeMenu } from '@/components/ThemeMenu'
import { Button } from '@/components/ui/button'
import { I18nProvider, useI18n } from '@/i18n'
import { localizedPath } from '@/lib/locale-routes'

const COPY = {
  page: { title: 'pageNotFound', description: 'pageNotFoundDescription' },
  project: { title: 'projectNotFound', description: 'projectNotFoundDescription' },
  news: { title: 'newsNotFound', description: 'newsNotFoundDescription' },
} as const

export function NotFoundPage({ kind = 'page' }: { kind?: keyof typeof COPY }) {
  return <I18nProvider><NotFoundContent kind={kind} /></I18nProvider>
}

function NotFoundContent({ kind }: { kind: keyof typeof COPY }) {
  const { locale, t } = useI18n()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const home = localizedPath('/', locale)
  const copy = COPY[kind]

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <a href="#main-content" className="sr-only rounded-md bg-background px-4 py-3 text-sm focus:not-sr-only focus:fixed focus:top-2 focus:left-4 focus:z-50 focus-visible:outline-2 focus-visible:outline-ring">
        {t('skipToContent')}
      </a>
      <header>
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <Link to={home} className="rounded-sm text-base font-medium tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:text-lg">
            Awesome JEV
          </Link>
          <div className="flex items-center gap-2"><ThemeMenu /><LanguageMenu /></div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto flex w-full max-w-[1160px] flex-1 items-center px-4 py-16 focus:outline-none sm:px-6 sm:py-24">
        <section aria-labelledby="not-found-title" className="grid w-full max-w-3xl gap-8 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-12">
          <p aria-hidden="true" className="text-8xl leading-none font-medium tracking-tight tabular-nums sm:text-9xl">404</p>
          <div className="min-w-0">
            <h1 id="not-found-title" className="text-2xl leading-tight font-medium sm:text-3xl">{t(copy.title)}</h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">{t(copy.description)}</p>
            <p className="mt-6 text-xs text-muted-foreground">
              <span className="block">{t('notFoundPath')}</span>
              <code className="mt-2 block font-mono leading-relaxed break-all">{pathname}</code>
            </p>
            <Button nativeButton={false} render={<Link to={home} />} className="mt-8 h-10 gap-2 rounded-md px-4 transition-[color,background-color,transform] motion-reduce:transition-none">
              <ArrowLeft className="size-4" aria-hidden />{t('notFoundBackHome')}
            </Button>
            <nav aria-label={t('notFoundExplore')} className="mt-10 border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">{t('notFoundExplore')}</p>
              <ul className="mt-2 flex flex-wrap gap-x-6">
                {([
                  ['/top100', 'categoryTop100'],
                  ['/news', 'categoryNews'],
                ] as const).map(([path, label]) => (
                  <li key={path}>
                    <Link to={localizedPath(path, locale)} className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm underline-offset-4 hover:underline active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                      {t(label)}<ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>
      </main>
    </div>
  )
}
