/**
 * [INPUT]: 依赖目录展示投影、项目/分享图身份工具与本地化 head
 * [OUTPUT]: 对外提供项目预览 Route、当前项目标题/摘要及真实 404
 * [POS]: routes 的遮罩元数据入口；动态导入复用目录展示投影，避免启动包依赖与额外 RPC
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute, notFound } from '@tanstack/react-router'
import { findGitHubProject } from '@/lib/project-routes'
import { localizedHead } from '@/lib/locale-head'
import { projectShareImage } from '@/lib/share-image'
import { localeFromParam } from '@/lib/locale-routes'
import type { DirectoryItem } from '@/lib/types'

export const Route = createFileRoute('/_directory/{-$locale}/preview/$owner/$repo')({
  loader: async ({ params }) => {
    const { default: projects } = await import('virtual:directory-catalog')
    const item = findGitHubProject(projects as DirectoryItem[], params.owner, params.repo)
    if (!item) throw notFound()
    return { title: item.title, summary: item.summary, image: projectShareImage(item) }
  },
  head: ({ loaderData, params }) => localizedHead({
    path: `/projects/${params.owner.toLowerCase()}/${params.repo.toLowerCase()}`,
    locale: localeFromParam(params.locale),
    title: `${loaderData?.title ?? 'Project'} · Awesome JEV`,
    description: loaderData?.summary ?? '',
    type: 'article',
    image: loaderData?.image,
  }),
  component: () => null,
})
