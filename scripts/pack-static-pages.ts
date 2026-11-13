/**
 * [INPUT]: 依赖完整预渲染产物、有限页清单与共享二进制包布局
 * [OUTPUT]: 提供有界 HTML 打包器；构建后回收已逐字节验证的内部原件
 * [POS]: scripts 的离线容量阶段；仅拥有 _pages 清单文件与 v1 包
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { readFile, writeFile, mkdir, rm, lstat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { gzipSync, gunzipSync } from 'node:zlib'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { staticCatalog, staticPrerenderPages } from './static-catalog.ts'
import type { StaticCatalog } from '../src/lib/static-delivery.ts'
import { pagePackLocation, packedPageEntry, PAGE_PACK_MAGIC, PAGE_PACK_HEADER_BYTES, PAGE_PACK_RECORD_BYTES, PAGE_PACK_MAX_BYTES, PAGE_HTML_MAX_BYTES } from '../src/lib/page-packs.ts'

export async function packStaticPages(root: string, catalog: StaticCatalog): Promise<{ pages: number; packs: number }> {
  const groups = new Map<string, { slot: number; filename: string }[]>()
  for (const page of staticPrerenderPages(catalog)) {
    const location = pagePackLocation(page.prerender.outputPath)
    if (!location) continue
    const entries = groups.get(location.path) ?? []
    if (entries.some((entry) => entry.slot === location.slot)) throw new Error('Duplicate page pack slot')
    entries.push({ slot: location.slot, filename: path.join(root, page.prerender.outputPath, 'index.html') })
    groups.set(location.path, entries)
  }
  const originals: string[] = []
  for (const [assetPath, entries] of groups) {
    const header = Buffer.alloc(PAGE_PACK_HEADER_BYTES)
    header.write(PAGE_PACK_MAGIC)
    const chunks: Buffer[] = [header]
    let offset = header.length
    for (const entry of entries) {
      if (!(await lstat(entry.filename)).isFile()) throw new Error('Page input must be a regular file')
      const html = await readFile(entry.filename)
      if (!html.length || html.length > PAGE_HTML_MAX_BYTES) throw new Error(`Page HTML exceeds packing budget: ${entry.filename}`)
      const gzip = gzipSync(html)
      const start = 8 + entry.slot * PAGE_PACK_RECORD_BYTES
      header.writeUInt32BE(offset, start)
      header.writeUInt32BE(gzip.length, start + 4)
      header.writeUInt32BE(html.length, start + 8)
      createHash('sha256').update(html).digest().copy(header, start + 12)
      chunks.push(gzip)
      offset += gzip.length
    }
    if (offset > PAGE_PACK_MAX_BYTES) throw new Error(`Page pack exceeds budget: ${assetPath}`)
    const bytes = Buffer.concat(chunks)
    const filename = path.join(root, assetPath)
    await mkdir(path.dirname(filename), { recursive: true })
    await writeFile(filename, bytes, { flag: 'wx' })
    const stored = new Uint8Array(await readFile(filename))
    for (const entry of entries) {
      const packed = packedPageEntry(stored, entry.slot)
      const original = await readFile(entry.filename)
      if (packed.htmlLength !== original.length || !gunzipSync(packed.gzip).equals(original)) throw new Error('Packed HTML verification failed')
      originals.push(entry.filename)
    }
  }
  // --- 全量验证完成后才删原件；未知文件、规范首屏、详情和 PNG 均不动 ---
  for (const filename of originals) await rm(filename)
  return { pages: originals.length, packs: groups.size }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [{ default: github }, { default: news }] = await Promise.all([import('../data/github.json', { with: { type: 'json' } }), import('../data/news.json', { with: { type: 'json' } })])
  const result = await packStaticPages(path.resolve('dist/client'), staticCatalog(github, news.length))
  process.stdout.write(`Packed ${result.pages} internal HTML pages into ${result.packs} files; saved ${result.pages - result.packs} static files.\n`)
}
