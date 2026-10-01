/**
 * [INPUT]: 依赖 分类白名单、语言文案与 localizedHead
 * [OUTPUT]: 对外提供 分类校验 Route 和分类搜索元数据
 * [POS]: routes 的分类叶节点，非法分类交给根 404 边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute, notFound } from '@tanstack/react-router'
import { CATEGORIES, type Category } from '@/lib/categories'
import { CATEGORY_LABEL } from '@/lib/categories'
import { catalogs } from '@/i18n/catalogs'
import { localizedHead } from '@/lib/locale-head'
import { localeFromParam } from '@/lib/locale-routes'

const CATEGORY_NAMES: Record<Category, string> = {
  agents: 'Agents & automation',
  applications: 'Apps & demos',
  browser: 'Browser & computer use',
  developer: 'Developer tools',
  resources: 'Learning & resources',
  directories: 'Project directories',
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
    const locale = localeFromParam(params.locale)
    const name = catalogs[locale][CATEGORY_LABEL[category]] ?? CATEGORY_NAMES[category] ?? 'Jev projects'
    const title = `${name} · Awesome JEV`
    const description = category === 'directories'
      ? locale === 'zh'
        ? '浏览收录多个 Jev 项目、应用与工具的精选目录；每条均可查看原始 GitHub 仓库。'
        : locale === 'ja'
          ? '複数の Jev プロジェクト、アプリ、ツールをまとめたサイトを探せます。各サイトから元の GitHub リポジトリを確認できます。'
        : 'Explore curated Jev project directories indexing multiple apps, tools, and ecosystem resources, with links to their original repositories.'
      : locale === 'zh'
        ? `浏览${name}分类下的 TypeSafe Jev GitHub 开源项目、项目简介及仓库链接。`
        : locale === 'ja'
          ? `${name}の TypeSafe Jev オープンソースプロジェクトを探せます。概要、GitHub リポジトリ、活動状況を確認できます。`
        : `Browse TypeSafe Jev GitHub projects in ${name.toLowerCase()}, with project details, repository links, and current activity.`
    return localizedHead({ path: `/category/${encodeURIComponent(params.category)}`, locale, title, description })
  },
  component: () => null,
})
