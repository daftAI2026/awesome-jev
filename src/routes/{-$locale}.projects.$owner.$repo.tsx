/**
 * [INPUT]: 依赖 getProject 同源数据边界、项目身份工具、详情组件和共享 404 页面
 * [OUTPUT]: 对外提供 项目详情 Route、预渲染元数据及缺失项目边界
 * [POS]: routes 的独立项目页，与目录内的遮罩预览共享项目身份
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft, ArrowSquareOut, GithubLogo } from '@phosphor-icons/react'
import { getProject } from '@/lib/catalog.functions'
import { DecryptedBrand } from '@/components/DecryptedBrand'
import { GithubProjectContent } from '@/components/GithubProjectDialog'
import { LanguageMenu } from '@/components/LanguageMenu'
import { NotFoundPage } from '@/components/NotFoundPage'
import { SaveButton } from '@/components/SaveButton'
import { ThemeMenu } from '@/components/ThemeMenu'
import { Button } from '@/components/ui/button'
import { useSaved } from '@/hooks/useSaved'
import { useI18n } from '@/i18n'
import { catalogs } from '@/i18n/catalogs'
import { CATEGORY_LABEL, type Category } from '@/lib/categories'
import { projectPathFromUrl } from '@/lib/project-routes'
import { localizedHead } from '@/lib/locale-head'
import { isLocalizedRouteParam, localeFromParam, localizedPath } from '@/lib/locale-routes'
import type { DirectoryItem } from '@/lib/types'

type Project = DirectoryItem & { category?: Category }

export const Route = createFileRoute('/{-$locale}/projects/$owner/$repo')({
  beforeLoad: ({ params }) => {
    if (!isLocalizedRouteParam(params.locale)) throw notFound()
  },
  loader: async ({ params }) => {
    const item = await getProject({ data: { owner: params.owner, repo: params.repo } })
    if (!item) throw notFound()
    return item as Project
  },
  head: ({ loaderData, params }) => {
    const item = loaderData as Project | undefined
    if (!item) return { meta: [{ title: `${catalogs[localeFromParam(params.locale)].projectNotFound} · Awesome JEV` }, { name: 'robots', content: 'noindex' }] }
    const path = projectPathFromUrl(item.url)
    const title = `${item.title} · Awesome JEV`
    const description = item.summary.slice(0, 240)
    return localizedHead({ path: path ?? '/', locale: localeFromParam(params.locale), title, description, type: 'article' })
  },
  component: ProjectPage,
  notFoundComponent: ProjectNotFound,
})

function ProjectPage() {
  const item = Route.useLoaderData()
  const { locale, t } = useI18n()
  const { entries, toggle } = useSaved()
  const saved = entries.some((entry) => entry.kind === 'github' && entry.id === item.id)
  const categoryLabel = item.category ? t(CATEGORY_LABEL[item.category]) : undefined

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="text-base font-medium tracking-tight sm:text-lg">
            <DecryptedBrand onClick={() => {}} />
          </div>
          <div className="flex items-center gap-2">
            <ThemeMenu />
            <LanguageMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <Link to={localizedPath('/', locale)} className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />{t('categoryAll')}
        </Link>
        <article className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-start justify-between gap-4 p-4 sm:p-6">
            <div className="min-w-0">
              <h1 className="break-words text-xl leading-snug font-medium">{item.title}</h1>
              {item.sourceMeta.repo && (
                <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{item.sourceMeta.repo}</p>
              )}
            </div>
            <SaveButton saved={saved} onToggle={() => toggle('github', item.id)} />
          </div>
          <div className="px-4 pb-6 sm:px-6">
            <GithubProjectContent item={item} categoryLabel={categoryLabel} standalone />
          </div>
          <div className="flex justify-end border-t border-border p-4 sm:px-6">
            <Button nativeButton={false} render={<a href={item.url} target="_blank" rel="noopener noreferrer" />} className="h-10 gap-2 px-4">
              <GithubLogo className="size-4" weight="fill" aria-hidden />
              {t('projectOpenGithub')}
              <ArrowSquareOut className="size-4" aria-hidden />
            </Button>
          </div>
        </article>
      </main>
    </div>
  )
}

function ProjectNotFound() {
  return <NotFoundPage kind="project" />
}
