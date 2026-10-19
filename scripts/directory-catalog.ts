/**
 * [INPUT]: 依赖规范快照、公开可见性与 Vite 多环境接口
 * [OUTPUT]: 提供展示投影、静态交付清单与 directoryCatalogPlugin
 * [POS]: scripts 的构建期公开边界；审计留在规范快照，运行时只读展示与交付身份
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { readFile } from 'node:fs/promises'
import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { normalizePath, type EnvironmentModuleNode, type Plugin } from 'vite'
import type { DirectoryItem } from '../src/lib/types.ts'
import type { Category } from '../src/lib/categories.ts'
import { publicProjects } from '../src/lib/catalog-visibility.ts'
import { STATIC_CATALOG_ID, staticCatalog } from './static-catalog.ts'

export type DirectoryCatalogItem = DirectoryItem & { category?: Category }
export const DIRECTORY_CATALOG_ID = 'virtual:directory-catalog'
export const RESOLVED_DIRECTORY_CATALOG_ID = `\0${DIRECTORY_CATALOG_ID}`

const ITEM_FIELDS = ['id', 'type', 'title', 'summary', 'tags', 'url', 'category'] as const
const META_FIELDS = ['stars', 'forks', 'language', 'author', 'date', 'repo', 'inclusion'] as const

function pick<T extends object, K extends keyof T>(value: T, keys: readonly K[]): Pick<T, K> {
  const selected = {} as Pick<T, K>
  for (const key of keys) if (Object.hasOwn(value, key)) selected[key] = value[key]
  return selected
}

// --- 白名单保留完整展示与校验输入；审计字段仍留在唯一规范快照 ---
export function projectDirectoryCatalog(rows: readonly DirectoryCatalogItem[]): DirectoryCatalogItem[] {
  return publicProjects(rows).map((row) => {
    const meta = row.sourceMeta
    return structuredClone({
      ...pick(row, ITEM_FIELDS),
      sourceMeta: {
        ...pick(meta, META_FIELDS),
        ...(Object.hasOwn(meta, 'jevEvidence') ? {
          jevEvidence: meta.jevEvidence == null ? meta.jevEvidence : { evidenceUrl: meta.jevEvidence.evidenceUrl },
        } : {}),
      },
    })
  })
}

export function directoryCatalogPlugin(file: string): Plugin {
  const sourcePath = normalizePath(resolve(file))
  const catalogFile = normalizePath(realpathSync(sourcePath))
  const newsFile = normalizePath(resolve(catalogFile, '../news.json'))
  return {
    name: 'vite-plugin-directory-catalog',
    resolveId(id) {
      if (id === DIRECTORY_CATALOG_ID) return RESOLVED_DIRECTORY_CATALOG_ID
      if (id === STATIC_CATALOG_ID) return `\0${STATIC_CATALOG_ID}`
    },
    hotUpdate({ file, timestamp, server }) {
      if (![sourcePath, catalogFile, newsFile].includes(normalizePath(file))) return
      // 第一份环境发出刷新前，先清掉所有环境的派生模块与规范 JSON 缓存。
      for (const environment of Object.values(server.environments)) {
        const graph = environment.moduleGraph
        const virtual = graph.getModuleById(RESOLVED_DIRECTORY_CATALOG_ID)
        const delivery = graph.getModuleById(`\0${STATIC_CATALOG_ID}`)
        const modules = new Set(graph.getModulesByFile(catalogFile))
        if (virtual) modules.add(virtual)
        if (delivery) modules.add(delivery)
        const invalidated = new Set<EnvironmentModuleNode>()
        for (const module of modules) graph.invalidateModule(module, invalidated, timestamp, true)
      }
      this.environment.hot.send({ type: 'full-reload' })
      return []
    },
    async load(id) {
      if (id === `\0${STATIC_CATALOG_ID}`) {
        this.addWatchFile(catalogFile)
        this.addWatchFile(newsFile)
        const rows = JSON.parse(await readFile(catalogFile, 'utf8')) as DirectoryCatalogItem[]
        const news = JSON.parse(await readFile(newsFile, 'utf8')) as unknown[]
        return `export default ${JSON.stringify(staticCatalog(rows, news.length))};`
      }
      if (id !== RESOLVED_DIRECTORY_CATALOG_ID) return
      this.addWatchFile(catalogFile)
      const rows = JSON.parse(await readFile(catalogFile, 'utf8')) as DirectoryCatalogItem[]
      return `export default ${JSON.stringify(projectDirectoryCatalog(rows))};`
    },
  }
}
