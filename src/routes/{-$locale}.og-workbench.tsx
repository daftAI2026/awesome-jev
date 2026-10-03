/**
 * [INPUT]: 依赖目录展示投影、工作台搜索契约、统一工作台壳与语言/head 工具
 * [OUTPUT]: 仅在 DEV 提供三语言统一工作台；生产 GET/HEAD 与所有工具参数均返回真实 404
 * [POS]: routes 的唯一工具入口；保留旧地址，以编译期边界隔离生产数据而非秘密 URL
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Workbench } from '@/components/workbench/Workbench'
import { workbenchMessages } from '@/components/workbench/messages'
import { localizedHead } from '@/lib/locale-head'
import { isLocalizedRouteParam, localeFromParam } from '@/lib/locale-routes'
import { workbenchSearch } from '@/lib/workbench'

export const Route = createFileRoute('/{-$locale}/og-workbench')({
  validateSearch: workbenchSearch,
  beforeLoad: ({ params }) => { if (!import.meta.env.DEV || !isLocalizedRouteParam(params.locale)) throw notFound() },
  loader: async () => {
    // --- 数据边界独立守卫，tool/Host/查询参数不能绕过生产隔离 ---
    if (!import.meta.env.DEV) throw notFound()
    const { default: catalog } = await import('virtual:directory-catalog')
    return catalog.map(({ url, title, summary, category }) => ({ url, title, summary, category }))
  },
  head: ({ params }) => !import.meta.env.DEV ? {} : localizedHead({ path: '/og-workbench', locale: localeFromParam(params.locale), title: `${workbenchMessages[localeFromParam(params.locale)].title} · Awesome JEV`, description: workbenchMessages[localeFromParam(params.locale)].intro, robots: 'noindex, nofollow' }),
  component: import.meta.env.DEV ? WorkbenchRoute : () => null,
})

function WorkbenchRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return <Workbench projects={Route.useLoaderData()} search={search} onChange={(next) => { void navigate({ search: { ...search, ...next }, resetScroll: false }) }} />
}
