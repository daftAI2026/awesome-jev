/**
 * [INPUT]: 依赖规范 GitHub 快照、仓库身份规则、ASCII 字标、Cloudflare Cache 与运行时渲染
 * [OUTPUT]: 对外提供全站/项目 OG 请求入口；缺失身份返回 404
 * [POS]: lib 的服务端数据边界；完整快照和 WASM 不进入浏览器启动包，渲染仅在缓存未命中时执行
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import banner from '../../scripts/awesome-jev-banner.txt?raw'
import { findGitHubProject } from './project-routes'
import { serveOg, type OgContent } from './og-response'
import type { DirectoryItem } from './types'

export async function ogResponse(request: Request, repository?: { owner: string; repo: string }): Promise<Response> {
  const { default: snapshot } = await import('../../data/github.json')
  const items = snapshot as DirectoryItem[]
  const item = repository ? findGitHubProject(items, repository.owner, repository.repo) : undefined
  const content: OgContent | null = repository ? (item ? { kind: 'project', item } : null) : { kind: 'site', projectCount: items.filter((project) => project.type === 'github').length }
  const cache = await caches.open('awesome-jev-og')
  return serveOg(request, content, {
    banner, cache,
    render: async (svg) => (await import('./og-render.server')).renderOgPng(svg, new URL(request.url).origin),
  })
}
