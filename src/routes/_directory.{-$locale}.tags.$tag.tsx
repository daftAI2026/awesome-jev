/**
 * [INPUT]: 依赖服务端标签计数、公开标签投影和共享语言/分页元数据
 * [OUTPUT]: 提供标签聚合 Route、同义地址 301、未知标签 404 与长尾 noindex
 * [POS]: routes 的标签目录边界；App 复用检索/排序/每页 50 条
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { getProjectTag } from '@/lib/catalog.functions'
import { normalizeProjectTag, TAG_INDEX_MIN_PROJECTS } from '@/lib/project-tags'
import { localizedHead } from '@/lib/locale-head'
import { localeFromParam, localizedPath } from '@/lib/locale-routes'
import { paginationRange } from '@/lib/pagination'
import { catalogs } from '@/i18n/catalogs'

export const Route = createFileRoute('/_directory/{-$locale}/tags/$tag')({
  loaderDeps: ({ search }) => ({ page: search.page, sort: search.sort }),
  loader: async ({ params, deps }) => {
    const normalized = normalizeProjectTag(params.tag)
    if (!normalized) throw notFound()
    const entry = await getProjectTag({ data: { tag: normalized } })
    if (!entry) throw notFound()
    if (params.tag !== normalized) {
      const query = new URLSearchParams()
      if (deps.page) query.set('page', String(deps.page))
      if (deps.sort) query.set('sort', deps.sort)
      throw redirect({ href: localizedPath(entry.path, localeFromParam(params.locale)) + (query.size ? `?${query}` : ''), statusCode: 301 })
    }
    return entry
  },
  head: ({ loaderData, params, match }) => {
    if (!loaderData) return { meta: [{ name: 'robots', content: 'noindex' }] }
    const locale = localeFromParam(params.locale)
    const messages = catalogs[locale]
    return localizedHead({ path: loaderData.path, locale,
      title: `${messages.tagPageTitle.replace('{tag}', loaderData.tag)} · Awesome JEV`,
      description: messages.tagPageDescription.replace('{tag}', loaderData.tag),
      robots: loaderData.count < TAG_INDEX_MIN_PROJECTS ? 'noindex,follow' : undefined,
      page: paginationRange(loaderData.count, match.search.page).page,
    })
  },
  component: () => null,
})
