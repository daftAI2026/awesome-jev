import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { normalizeCatalogUpdatedAt } from './src/lib/catalog-updated-at.ts'

const root = path.dirname(fileURLToPath(import.meta.url))
const catalogUpdatedAt = (() => {
  try {
    // 浅克隆根提交会被 Git 当作所有文件的起点，不能冒充真实数据更新。
    const git = (args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    if (git(['rev-parse', '--is-shallow-repository']) !== 'false') return null
    if (git(['status', '--porcelain', '--', 'data/github.json', 'data/youtube.json', 'data/x.json', 'data/news.json'])) return null
    const output = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', 'data/github.json', 'data/youtube.json', 'data/x.json', 'data/news.json'],
      { cwd: root, encoding: 'utf8' },
    )
    return normalizeCatalogUpdatedAt(output)
  } catch {
    return null
  }
})()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_CATALOG_UPDATED_AT': JSON.stringify(catalogUpdatedAt ?? ''),
  },
  resolve: {
    alias: {
      '@': path.resolve(root, './src'),
    },
  },
})
