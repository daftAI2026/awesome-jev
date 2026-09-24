import { createFileRoute, notFound } from '@tanstack/react-router'
import { CATEGORIES, type Category } from '@/lib/categories'
import { CATEGORY_LABEL } from '@/lib/categories'
import { zh } from '@/i18n/locales/zh'
import { localizedHead } from '@/lib/locale-head'

const CATEGORY_NAMES: Record<Category, string> = {
  agents: 'Agents & automation',
  applications: 'Apps & demos',
  browser: 'Browser & computer use',
  developer: 'Developer tools',
  resources: 'Learning & resources',
  alternatives: 'Open-source alternatives',
  research: 'Research & evaluation',
  sdk: 'SDKs & integrations',
  other: 'Other',
}
const categoryValues = new Set<string>(CATEGORIES)

export const Route = createFileRoute('/_directory/{-$locale}/category/$category')({
  loader: ({ params }) => {
    if (!categoryValues.has(params.category)) throw notFound()
    return null
  },
  head: ({ params }) => {
    const category = params.category as Category
    const locale = params.locale === 'zh' ? 'zh' : 'en'
    const name = locale === 'zh' ? zh[CATEGORY_LABEL[category]] : CATEGORY_NAMES[category] ?? 'Jev projects'
    const title = `${name} · Awesome JEV`
    const description = locale === 'zh'
      ? `浏览${name}分类下的 TypeSafe Jev GitHub 开源项目、项目简介及仓库链接。`
      : `Browse TypeSafe Jev GitHub projects in ${name.toLowerCase()}, with project details, repository links, and current activity.`
    return localizedHead({ path: `/category/${encodeURIComponent(params.category)}`, locale, title, description })
  },
  component: () => null,
})
