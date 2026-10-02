/**
 * [INPUT]: 依赖分享图尺寸/身份、项目规范路径与 ASCII 原始字标
 * [OUTPUT]: 对外提供全站/项目 SVG 模板和有界文字换行，不进行 I/O
 * [POS]: lib 的白底黑字分享图模板，运行时渲染与离线测试共享同一排版
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { parseGitHubRepositoryUrl } from './project-routes.ts'
import { imageText, OG_HEIGHT, OG_WIDTH, projectShareImage, SITE_DOMAIN, siteShareImage, type ShareProject } from './share-image.ts'

const COLORS = { background: '#ffffff', foreground: '#171717', muted: '#666666' }

const escapeXml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')

// --- 图中正文限行，元数据保留完整标题；等宽字与 CJK 按各自占位换行 ---
export function wrapImageText(value: string, maxUnits: number, maxLines: number, proportional = false): string[] {
  const characters = Array.from(imageText(value))
  const lines: string[] = []
  let offset = 0
  while (offset < characters.length && lines.length < maxLines) {
    let end = offset
    let units = 0
    let lastSpace = -1
    while (end < characters.length) {
      const width = /[\u2e80-\u9fff\uac00-\ud7ff\uf900-\ufaff\uff00-\uffef]|\p{Extended_Pictographic}/u.test(characters[end]) ? 2 : proportional && /[MWmw@%]/.test(characters[end]) ? 1.7 : 1
      if (units + width > maxUnits) break
      if (characters[end] === ' ') lastSpace = end
      units += width
      end++
    }
    if (end < characters.length && lastSpace > offset) end = lastSpace
    if (end === offset) end++
    lines.push(characters.slice(offset, end).join('').trim())
    offset = end
    while (characters[offset] === ' ') offset++
  }
  return lines
}

function text(value: string, y: number, size: number, options: { mono?: boolean; muted?: boolean; bold?: boolean } = {}): string {
  return `<text x="48" y="${y}" fill="${options.muted ? COLORS.muted : COLORS.foreground}" font-family="${options.mono ? 'Geist Mono' : 'Geist'}, Noto Sans SC" font-size="${size}"${options.bold ? ' font-weight="600"' : ''}>${escapeXml(value)}</text>`
}

function frame(banner: string, content: string[], title: string): string {
  const wordmark = banner.split(/\r?\n/).filter((line) => line.trim())
    .map((line, index) => `<text x="48" y="${88 + index * 16}">${escapeXml(line)}</text>`).join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">`,
    `<title>${escapeXml(title)}</title>`,
    `<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${COLORS.background}"/>`,
    `<g fill="${COLORS.foreground}" font-family="Geist Mono, Noto Sans SC" font-size="10.5" xml:space="preserve">${wordmark}</g>`,
    ...content,
    text(SITE_DOMAIN, 582, 24, { mono: true, muted: true }),
    '</svg>',
  ].join('\n') + '\n'
}

export function renderSiteSvg(projectCount: number, banner: string): string {
  const image = siteShareImage(projectCount)
  return frame(banner, [
    text('TypeSafe System One · Jev', 410, 28, { muted: true }),
    text(`${projectCount} GitHub projects`, 470, 40, { bold: true }),
  ], image.alt)
}

export function renderProjectSvg(item: ShareProject, banner: string): string {
  const image = projectShareImage(item)
  const repository = parseGitHubRepositoryUrl(item.url)!
  return frame(banner, [
    ...wrapImageText(repository.key, 88, 2).map((line, index) => text(line, 246 + index * 28, 20, { mono: true, muted: true })),
    ...wrapImageText(item.title, 32, 2).map((line, index) => text(line, 332 + index * 60, 56, { mono: true })),
    ...wrapImageText(item.summary, 66, 2, true).map((line, index) => text(line, 458 + index * 36, 26, { muted: true })),
  ], image.alt)
}
