import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { CATEGORIES } from './src/lib/categories.ts'
import { normalizeCatalogUpdatedAt } from './src/lib/catalog-updated-at.ts'
import githubData from './data/github.json' with { type: 'json' }
import { projectPathFromUrl } from './src/lib/project-routes.ts'
import { localizedPath } from './src/lib/locale-routes.ts'

const root = path.dirname(fileURLToPath(import.meta.url))
const projectPaths = githubData
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

const englishPrerenderPaths = [
  '/',
  ...CATEGORIES.map((category) => `/category/${category}`),
  '/top100',
  '/news',
  '/saved',
  ...projectPaths,
]
const prerenderPaths = [
  ...englishPrerenderPaths,
  ...englishPrerenderPaths.map((path) => localizedPath(path, 'zh')),
]

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
  plugins: [
    tailwindcss(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart({
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
        crawlLinks: false,
      },
      pages: prerenderPaths.map((path) => ({ path })),
    }),
    react(),
  ],
  define: {
    'import.meta.env.VITE_CATALOG_UPDATED_AT': JSON.stringify(catalogUpdatedAt ?? ''),
  },
  resolve: {
    alias: {
      '@': path.resolve(root, './src'),
    },
  },
})
