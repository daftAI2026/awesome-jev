/**
 * [INPUT]: 依赖公开目录计数、分页规则与三语言首页文案与共享 localizedHead
 * [OUTPUT]: 提供逐页规范地址及首页 Route 和品牌搜索元数据
 * [POS]: routes 的首页叶节点；目录界面由父布局 App 渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { paginationRange } from '@/lib/pagination'
import { getDirectoryCounts } from '@/lib/catalog.functions'
import { createFileRoute } from '@tanstack/react-router'
import { catalogs } from '@/i18n/catalogs'
import { localizedHead } from '@/lib/locale-head'
import { localeFromParam } from '@/lib/locale-routes'

export const Route = createFileRoute('/_directory/{-$locale}/')({
  loader: () => getDirectoryCounts(),
  head: ({ params, match, loaderData }) => {
    const locale = localeFromParam(params.locale)
    const messages = catalogs[locale]
    return localizedHead({ path: '/', locale, title: messages.documentTitle, description: messages.documentDescription, page: paginationRange(loaderData?.total ?? 0, match.search.page).page })
  },
  component: () => null,
})
