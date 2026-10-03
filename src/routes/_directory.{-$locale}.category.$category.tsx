/**
 * [INPUT]: 依赖 分类白名单、语言文案与 localizedHead
 * [OUTPUT]: 对外提供 分类校验 Route 和与可见用途说明同源的分类搜索元数据
 * [POS]: routes 的分类叶节点，非法分类交给根 404 边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute, notFound } from '@tanstack/react-router'
import { CATEGORIES, type Category } from '@/lib/categories'
import { CATEGORY_LABEL, CATEGORY_DESCRIPTION } from '@/lib/categories'
import { catalogs } from '@/i18n/catalogs'
import { localizedHead } from '@/lib/locale-head'
import { localeFromParam } from '@/lib/locale-routes'

const categoryValues = new Set<string>(CATEGORIES)

export const Route = createFileRoute('/_directory/{-$locale}/category/$category')({
  loader: ({ params }) => {
    if (!categoryValues.has(params.category)) throw notFound()
    return null
  },
  head: ({ params }) => {
    const category = params.category as Category
    const locale = localeFromParam(params.locale)
    const name = catalogs[locale][CATEGORY_LABEL[category]]
    const title = `${name} · Awesome JEV`
    const description = catalogs[locale][CATEGORY_DESCRIPTION[category]]
    return localizedHead({ path: `/category/${encodeURIComponent(params.category)}`, locale, title, description })
  },
  component: () => null,
})
