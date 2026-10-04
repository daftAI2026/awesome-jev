/**
 * [INPUT]: 依赖 TanStack 文件路由及共享语言/页面元数据工具
 * [OUTPUT]: 对外提供三语言 Top100 Route 的规范路径、标题和说明
 * [POS]: routes 的全目录星标排名页面身份，结果筛选由父级目录布局承担而不新建数据快照
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute } from '@tanstack/react-router'
import { localizedHead } from '@/lib/locale-head'
import { localeFromParam } from '@/lib/locale-routes'

const TITLE = 'Top 100 Starred Jev Projects · Awesome JEV'
const DESCRIPTION = 'Explore the 100 most-starred open-source GitHub projects related to TypeSafe Jev.'

export const Route = createFileRoute('/_directory/{-$locale}/top100')({
  head: ({ params }) => {
    const locale = localeFromParam(params.locale)
    return localizedHead({
      path: '/top100', locale,
      title: locale === 'zh' ? '星标 Top 100 · Awesome JEV' : locale === 'ja' ? 'スター数トップ 100 · Awesome JEV' : TITLE,
      description: locale === 'zh' ? '按 GitHub 星标浏览 TypeSafe Jev 开源项目的前 100 名。' : locale === 'ja' ? 'TypeSafe Jev に関連するオープンソースプロジェクトを、GitHub のスター数上位 100 件から探せます。' : DESCRIPTION,
    })
  },
  component: () => null,
})
