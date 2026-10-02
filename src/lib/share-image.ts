/**
 * [INPUT]: 依赖项目规范身份和标题/摘要，不读取目录快照或 Node 能力
 * [OUTPUT]: 对外提供分享图身份、尺寸和 OG/Twitter 图片元数据
 * [POS]: lib 的分享图契约，运行时图片接口与页面 head 共用地址及内容版本
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { parseGitHubRepositoryUrl } from './project-routes.ts'
import type { DirectoryItem } from './types.ts'

export const SITE_ORIGIN = 'https://awesomejev.cc'
export const SITE_DOMAIN = 'awesomejev.cc'
export const OG_WIDTH = 1200
export const OG_HEIGHT = 630
// --- 排版、字库或渲染逻辑变化时递增，避免社交平台复用旧图片地址 ---
const IMAGE_VERSION = '4'

export interface ShareImage { path: string; alt: string }
export type ShareProject = Pick<DirectoryItem, 'url' | 'title' | 'summary'>

export function imageText(value: string): string {
  // oxlint-disable-next-line no-control-regex -- XML 1.0 禁止这些控制字符，作者文本必须清理
  return value.replace(/\p{Surrogate}/gu, '\ufffd').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\s+/gu, ' ').trim()
}

function revision(parts: readonly string[]): string {
  // --- FNV-1a 64 位：同一纯规则在 Node 构建与浏览器路由中生成同一内容地址 ---
  let hash = 0xcbf29ce484222325n
  for (const character of JSON.stringify([IMAGE_VERSION, ...parts])) {
    hash ^= BigInt(character.codePointAt(0)!)
    hash = BigInt.asUintN(64, hash * 0x100000001b3n)
  }
  return hash.toString(16).padStart(16, '0')
}

export function siteShareImage(projectCount: number): ShareImage {
  if (!Number.isSafeInteger(projectCount) || projectCount < 0) throw new TypeError('Invalid OG project count')
  return {
    path: `/api/og/site?v=${revision([String(projectCount)])}`,
    alt: `Awesome JEV · ${projectCount} GitHub projects · ${SITE_DOMAIN}`,
  }
}

export function projectShareImage(item: ShareProject): ShareImage {
  const repository = parseGitHubRepositoryUrl(item.url)
  if (!repository) throw new TypeError('Invalid OG project repository')
  return {
    path: `/api/og/projects/${repository.key}?v=${revision([repository.key, imageText(item.title), imageText(item.summary)])}`,
    alt: `${imageText(item.title)} · ${repository.key} · Awesome JEV · ${SITE_DOMAIN}`,
  }
}

export function shareImageMeta(image: ShareImage) {
  const url = `${SITE_ORIGIN}${image.path}`
  return [
    { property: 'og:image', content: url },
    { property: 'og:image:secure_url', content: url },
    { property: 'og:image:type', content: 'image/png' },
    { property: 'og:image:width', content: String(OG_WIDTH) },
    { property: 'og:image:height', content: String(OG_HEIGHT) },
    { property: 'og:image:alt', content: image.alt },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:image', content: url },
    { name: 'twitter:image:alt', content: image.alt },
  ]
}
