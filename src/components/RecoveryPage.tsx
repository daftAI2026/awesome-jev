/**
 * [INPUT]: 依赖路由 pathname、语言文案、主题/语言菜单、Button 与 Jev 教学图
 * [OUTPUT]: 提供 RecoveryPage，统一 404/500 恢复动作与双列共享分割线
 * [POS]: components 的恢复页外壳；不读取目录，不显示异常正文或查询参数
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useRouterState } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, ArrowClockwise } from '@phosphor-icons/react'
import { LanguageMenu } from '@/components/LanguageMenu'
import { ThemeMenu } from '@/components/ThemeMenu'
import { Button } from '@/components/ui/button'
import { JevDecisionFigure } from '@/components/jev-figure/JevDecisionFigure'
import { useI18n } from '@/i18n'
import type { MessageKey } from '@/i18n/locales/en'
import { localizedPath } from '@/lib/locale-routes'

export function RecoveryPage({ status, title, description, retry = false }: { status: 404 | 500; title: MessageKey; description: MessageKey; retry?: boolean }) {
  const { locale, t } = useI18n()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const home = localizedPath('/', locale)

  return (
    <div data-recovery-status={status} className="flex min-h-dvh flex-col bg-background text-foreground">
      <a href="#main-content" className="sr-only rounded-md bg-background px-4 py-3 text-sm focus:not-sr-only focus:fixed focus:top-2 focus:left-4 focus:z-50 focus-visible:outline-2 focus-visible:outline-ring">
        {t('skipToContent')}
      </a>
      <header>
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <a href={home} className="rounded-sm text-base font-medium tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:text-lg">
            Awesome JEV
          </a>
          <div className="flex items-center gap-2"><ThemeMenu /><LanguageMenu /></div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto flex w-full max-w-[1160px] flex-1 items-center px-4 py-16 focus:outline-none sm:px-6 sm:py-24">
        <section aria-labelledby="recovery-title" className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr_auto] lg:items-stretch lg:gap-x-16 lg:gap-y-0">
          <div className="min-w-0 lg:row-span-3 lg:grid lg:grid-rows-subgrid">
            <div className="lg:row-span-2">
              <p aria-hidden="true" className="mb-6 text-8xl leading-none font-medium tracking-tight tabular-nums sm:text-9xl">{status}</p>
              <h1 id="recovery-title" className="text-2xl leading-tight font-medium sm:text-3xl">{t(title)}</h1>
              <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">{t(description)}</p>
              <p className="mt-6 text-xs text-muted-foreground">
                <span className="block">{t('notFoundPath')}</span>
                <code className="mt-2 block font-mono leading-relaxed break-all">{pathname}</code>
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {retry && <Button onClick={() => window.location.reload()} className="h-10 gap-2 px-4"><ArrowClockwise className="size-4" aria-hidden />{t('errorRetry')}</Button>}
                <Button variant={retry ? 'outline' : 'default'} nativeButton={false} render={<a href={home} />} className="h-10 gap-2 rounded-md px-4 transition-[color,background-color,transform] motion-reduce:transition-none">
                  <ArrowLeft className="size-4" aria-hidden />{t('notFoundBackHome')}
                </Button>
              </div>
            </div>
            <nav aria-label={t('notFoundExplore')} className="mt-10 border-t border-border pt-6 lg:mt-8">
              <p className="text-sm text-muted-foreground">{t('notFoundExplore')}</p>
              <ul className="mt-2 flex flex-wrap gap-x-6">
                {([
                  ['/top100', 'categoryTop100'],
                  ['/news', 'categoryNews'],
                ] as const).map(([path, label]) => (
                  <li key={path}>
                    <a href={localizedPath(path, locale)} className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm underline-offset-4 hover:underline active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                      {t(label)}<ArrowRight className="size-4" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <JevDecisionFigure />
        </section>
      </main>
    </div>
  )
}
