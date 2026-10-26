/**
 * [INPUT]: 依赖 Vite/Start/Cloudflare/Redact、规范快照、公开可见性、展示投影、分享图身份与 Git 历史
 * [OUTPUT]: 提供 Redact 同源运行时、多环境构建、IPv4 回环预览、三语言指南与有限查询产物
 * [POS]: 根级构建编排；公开数据同源，MCP 索引只进入服务端模块
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { directoryCatalogPlugin } from './scripts/directory-catalog.ts'
import { staticCatalog, staticPrerenderPages } from './scripts/static-catalog.ts'
import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { redact } from '@tanstack/redact/vite'
import tailwindcss from '@tailwindcss/vite'
import { CATEGORIES } from './src/lib/categories.ts'
import { normalizeCatalogUpdatedAt } from './src/lib/catalog-updated-at.ts'
import githubData from './data/github.json' with { type: 'json' }
import newsData from './data/news.json' with { type: 'json' }
import { projectPathFromUrl } from './src/lib/project-routes.ts'
import { newsPath } from './src/lib/news.ts'
import { LOCALES, localizedPath } from './src/lib/locale-routes.ts'
import { siteShareImage } from './src/lib/share-image.ts'
import { publicProjects } from './src/lib/catalog-visibility.ts'

const root = path.dirname(fileURLToPath(import.meta.url))
const publicCatalog = publicProjects(githubData)
const projectPaths = publicCatalog
  .filter((item) => item.type === 'github' && typeof item.summary === 'string' && item.summary.trim().length > 0)
  .map((item) => {
    const projectPath = projectPathFromUrl(item.url)
    if (!projectPath) throw new Error(`Cannot prerender invalid GitHub repository URL: ${item.url}`)
    return projectPath
  })

const uniqueProjectPaths = new Set(projectPaths)
if (uniqueProjectPaths.size !== projectPaths.length) {
  throw new Error('Cannot prerender duplicate canonical GitHub project routes')
}

const newsPaths = newsData
  .filter((item) => typeof item.summary === 'string' && item.summary.trim().length > 0)
  .map((item) => {
    const path = newsPath(item.id)
    if (!path) throw new Error(`Cannot prerender invalid news ID: ${item.id}`)
    return path
  })
if (new Set(newsPaths).size !== newsPaths.length) {
  throw new Error('Cannot prerender duplicate news routes')
}

const englishPrerenderPaths = [
  '/',
  ...CATEGORIES.map((category) => `/category/${category}`),
  '/top100',
  '/news',
  '/mcp',
  '/saved',
  ...projectPaths,
  ...newsPaths,
]
const prerenderPaths = LOCALES.flatMap((locale) => englishPrerenderPaths.map((path) => localizedPath(path, locale)))
const staticPages = staticPrerenderPages(staticCatalog(githubData, newsData.length))
const prerenderPages = new Map(prerenderPaths.map((path) => [path, { path }]))
for (const page of staticPages) prerenderPages.set(page.prerender.outputPath, page)

const catalogUpdatedAt = (() => {
  try {
    // 浅克隆根提交会被 Git 当作所有文件的起点，不能冒充真实数据更新。
    const git = (args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    if (git(['rev-parse', '--is-shallow-repository']) !== 'false') return null
    if (git(['status', '--porcelain', '--', 'data/github.json', 'data/news.json'])) return null
    const output = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', 'data/github.json', 'data/news.json'],
      { cwd: root, encoding: 'utf8' },
    )
    return normalizeCatalogUpdatedAt(output)
  } catch {
    return null
  }
})()

export default defineConfig({
  // 本项目构建只需 Vite define 的 catalog 时间戳，不读取 .env.local。
  envDir: false,
  // --- 预渲染与交付验收共用 IPv4，避开 localhost 双栈连接竞态 ---
  preview: { host: '127.0.0.1' },
  // --- 第三方 SSR 依赖也必须经过 Redact，避免混用两套 React ---
  ssr: { noExternal: true },
  plugins: [
    directoryCatalogPlugin(path.join(root, 'data/github.json'), catalogUpdatedAt),
    tailwindcss(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart({
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
        crawlLinks: false,
      },
      pages: [...prerenderPages.values()],
    }),
    react(),
    // 保留完整功能；本站依赖水合、Portal、Suspense 与类错误边界。
    redact(),
  ],
  define: {
    'import.meta.env.VITE_CATALOG_UPDATED_AT': JSON.stringify(catalogUpdatedAt ?? ''),
    'import.meta.env.VITE_SITE_OG_ALT': JSON.stringify(siteShareImage(publicCatalog.filter((item) => item.type === 'github').length).alt),
    'import.meta.env.VITE_SITE_OG_PATH': JSON.stringify(siteShareImage(publicCatalog.filter((item) => item.type === 'github').length).path),
  },
  resolve: {
    alias: {
      '@': path.resolve(root, './src'),
    },
  },
})
