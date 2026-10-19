/**
 * [INPUT]: 依赖公开目录、固定字库与 Node WASM 渲染器
 * [OUTPUT]: 提供构建 PNG 生成器与免费资产容量检查
 * [POS]: scripts 的离线图片阶段；失败阻止交付，不在请求中栅格化
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { readFile, mkdir, writeFile, readdir, rm, lstat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { Resvg } from '@cf-wasm/resvg/node'
import { publicProjects } from '../src/lib/catalog-visibility.ts'
import { renderProjectSvg, renderSiteSvg } from '../src/lib/og-template.ts'
import { projectShareImage, siteShareImage } from '../src/lib/share-image.ts'
import type { DirectoryItem } from '../src/lib/types.ts'

export function assertFreeAssetCount(count: number): void {
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid static asset count')
  if (count > 20_000) throw new Error(`Workers Free static asset limit 20000 exceeded: ${count}; reduce build output before publishing`)
}

export async function generateOgAssets(root: string, rows: DirectoryItem[], render: (svg: string) => Promise<Uint8Array>): Promise<number> {
  const projects = publicProjects(rows)
  const banner = await readFile(path.join(root, 'scripts/awesome-jev-banner.txt'), 'utf8')
  const output = path.join(root, 'dist/client/_og')
  await mkdir(output, { recursive: true })
  if ((await lstat(output)).isSymbolicLink()) throw new Error('OG output must not be a symbolic link')
  const generated = new Set<string>()
  const entries = [
    { image: siteShareImage(projects.length), svg: () => renderSiteSvg(projects.length, banner) },
    ...projects.map((item) => ({ image: projectShareImage(item), svg: () => renderProjectSvg(item, banner) })),
  ]
  for (const entry of entries) {
    const version = new URL(entry.image.path, 'https://assets.local').searchParams.get('v')!
    const filename = `${version}.png`
    if (!/^[a-f0-9]{16}\.png$/.test(filename) || generated.has(filename)) throw new Error('Invalid or duplicate OG asset identity')
    const bytes = await render(entry.svg())
    if (!Buffer.from(bytes).subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('Invalid rendered PNG')
    await writeFile(path.join(output, filename), bytes)
    generated.add(filename)
  }
  // --- 仅回收本生成器的版本 PNG；未知文件不删除 ---
  for (const file of await readdir(output)) {
    if (/^[a-f0-9]{16}\.png$/.test(file) && !generated.has(file)) await rm(path.join(output, file))
  }
  return generated.size
}

async function buildOgAssets(root: string) {
  const rows = JSON.parse(await readFile(path.join(root, 'data/github.json'), 'utf8')) as DirectoryItem[]
  const names = ['Geist-Regular.ttf', 'Geist-SemiBold.ttf', 'GeistMono-Regular.ttf', 'NotoSansSC.ttf']
  const fonts = await Promise.all(names.map((name) => readFile(path.join(root, 'public/og-fonts', name))))
  const count = await generateOgAssets(root, rows, async (svg) => {
    const cjk = /[\u2e80-\u9fff\uac00-\ud7ff\uf900-\ufaff\uff00-\uffef\u3040-\u30ff]/u.test(svg)
    const renderer = await Resvg.async(svg, { font: { fontBuffers: cjk ? fonts : fonts.slice(0, 3), defaultFontFamily: 'Geist' } })
    try {
      const image = renderer.render()
      try { return new Uint8Array(image.asPng()) } finally { image.free() }
    } finally { renderer.free() }
  })
  const files = await readdir(path.join(root, 'dist/client'), { recursive: true, withFileTypes: true })
  const assets = files.filter((file) => file.isFile()).length
  assertFreeAssetCount(assets)
  process.stdout.write(`Generated ${count} public OG PNGs; ${assets}/20000 static files.\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await buildOgAssets(process.cwd())
