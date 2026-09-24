import { createFileRoute, notFound } from '@tanstack/react-router'
import githubData from '../../data/github.json'
import { findGitHubProject } from '@/lib/project-routes'
import { localizedHead } from '@/lib/locale-head'
import type { DirectoryItem } from '@/lib/types'

export const Route = createFileRoute('/_directory/{-$locale}/preview/$owner/$repo')({
  loader: ({ params }) => {
    const item = findGitHubProject(githubData as DirectoryItem[], params.owner, params.repo)
    if (!item) throw notFound()
    return { title: item.title, summary: item.summary }
  },
  head: ({ loaderData, params }) => localizedHead({
    path: `/projects/${params.owner.toLowerCase()}/${params.repo.toLowerCase()}`,
    locale: params.locale === 'zh' ? 'zh' : 'en',
    title: `${loaderData?.title ?? 'Project'} · Awesome JEV`,
    description: loaderData?.summary ?? '',
    type: 'article',
  }),
  component: () => null,
})
