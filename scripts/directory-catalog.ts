/**
 * [INPUT]: 依赖规范 GitHub 快照、前端目录类型与 Vite 的虚拟模块/多环境更新接口
 * [OUTPUT]: 对外提供目录展示投影、虚拟模块 ID 与 directoryCatalogPlugin
 * [POS]: scripts 的构建期数据交付边界，不生成第二份规范快照或改变同步预览
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { readFile } from 'node:fs/promises'
import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { normalizePath, type EnvironmentModuleNode, type Plugin } from 'vite'
import type { DirectoryItem } from '../src/lib/types.ts'
import type { Category } from '../src/lib/categories.ts'

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
  return rows.map((row) => {
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
  return {
    name: 'vite-plugin-directory-catalog',
    resolveId(id) {
      if (id === DIRECTORY_CATALOG_ID) return RESOLVED_DIRECTORY_CATALOG_ID
    },
    hotUpdate({ file, timestamp, server }) {
      if (![sourcePath, catalogFile].includes(normalizePath(file))) return
      // 第一份环境发出刷新前，先清掉所有环境的派生模块与规范 JSON 缓存。
      for (const environment of Object.values(server.environments)) {
        const graph = environment.moduleGraph
        const virtual = graph.getModuleById(RESOLVED_DIRECTORY_CATALOG_ID)
        const modules = new Set(graph.getModulesByFile(catalogFile))
        if (virtual) modules.add(virtual)
        const invalidated = new Set<EnvironmentModuleNode>()
        for (const module of modules) graph.invalidateModule(module, invalidated, timestamp, true)
      }
      this.environment.hot.send({ type: 'full-reload' })
      return []
    },
    async load(id) {
      if (id !== RESOLVED_DIRECTORY_CATALOG_ID) return
      this.addWatchFile(catalogFile)
      const rows = JSON.parse(await readFile(catalogFile, 'utf8')) as DirectoryCatalogItem[]
      return `export default ${JSON.stringify(projectDirectoryCatalog(rows))};`
    },
  }
}
