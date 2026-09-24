import { createFileRoute } from '@tanstack/react-router'
import { localizedHead } from '@/lib/locale-head'

const TITLE = 'Top 100 Starred Jev Projects · Awesome JEV'
const DESCRIPTION = 'Explore the 100 most-starred open-source GitHub projects related to TypeSafe Jev.'

export const Route = createFileRoute('/_directory/{-$locale}/top100')({
  head: ({ params }) => {
    const locale = params.locale === 'zh' ? 'zh' : 'en'
    return localizedHead({
      path: '/top100', locale,
      title: locale === 'zh' ? '星标 Top 100 · Awesome JEV' : TITLE,
      description: locale === 'zh' ? '按 GitHub 星标浏览 TypeSafe Jev 开源项目的前 100 名。' : DESCRIPTION,
    })
  },
  component: () => null,
})
