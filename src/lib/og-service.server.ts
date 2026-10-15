/**
 * [INPUT]: 依赖规范快照、公开可见性、仓库身份、ASCII 字标、Cache 与运行时渲染
 * [OUTPUT]: 提供全站/项目 OG 入口与实例内同键渲染合并；缺失返回 404
 * [POS]: lib 的服务端数据边界；隐藏记录先返回 404，完整快照和 WASM 不进入浏览器
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import banner from '../../scripts/awesome-jev-banner.txt?raw'
import { findGitHubProject } from './project-routes'
import { serveOg, type OgContent } from './og-response'
import type { DirectoryItem } from './types'
import { publicProjects } from './catalog-visibility'

// ---- 只保存公开 PNG 的在途字节任务；结束即移除，不是跨实例锁 ----
const inflight = new Map<string, Promise<Uint8Array<ArrayBuffer>>>()

export async function ogResponse(request: Request, repository?: { owner: string; repo: string }): Promise<Response> {
  const { default: snapshot } = await import('../../data/github.json')
  const items = publicProjects(snapshot) as DirectoryItem[]
  const item = repository ? findGitHubProject(items, repository.owner, repository.repo) : undefined
  const content: OgContent | null = repository ? (item ? { kind: 'project', item } : null) : { kind: 'site', projectCount: items.filter((project) => project.type === 'github').length }
  const cache = await caches.open('awesome-jev-og')
  return serveOg(request, content, {
    banner, cache, inflight,
    render: async (svg) => (await import('./og-render.server')).renderOgPng(svg),
  })
}
