/**
 * [INPUT]: 依赖 Node test、规范目录、展示投影与安装的 Vite 多环境模块图
 * [OUTPUT]: 对外提供全目录展示等价、审计字段排除与热更新一致性的离线回归断言
 * [POS]: scripts 的构建投影验收，不启动产品构建或调用网络/付费模型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { gzipSync } from 'node:zlib'
import { createServer, type HotUpdateOptions } from 'vite'
import { directoryCatalogPlugin, projectDirectoryCatalog, DIRECTORY_CATALOG_ID, RESOLVED_DIRECTORY_CATALOG_ID } from './directory-catalog.ts'
import type { DirectoryCatalogItem } from './directory-catalog.ts'
import { searchItems } from '../src/lib/search.ts'
import { githubStarRanks, sortGithubItems } from '../src/lib/sort.ts'

const full = JSON.parse(readFileSync(new URL('../data/github.json', import.meta.url), 'utf8')) as DirectoryCatalogItem[]
const metaFields = ['stars', 'forks', 'language', 'author', 'date', 'repo', 'inclusion'] as const
const topFields = ['id', 'type', 'title', 'summary', 'tags', 'url', 'category'] as const
const ids = (rows: DirectoryCatalogItem[]) => rows.map((row) => row.id)

test('directory projection strips audit-only fields and keeps every current UI field', () => {
  const projected = projectDirectoryCatalog(full)
  assert.equal(projected.length, full.length)
  projected.forEach((row, index) => {
    const original = full[index]
    for (const field of topFields) assert.deepEqual(row[field], original[field], `${index}.${field}`)
    for (const field of metaFields) assert.deepEqual(row.sourceMeta[field], original.sourceMeta[field], `${index}.sourceMeta.${field}`)
    assert.deepEqual(Object.keys(row).sort(), Object.keys(original).filter((key) => new Set<string>([...topFields, 'sourceMeta']).has(key)).sort())
    assert.deepEqual(Object.keys(row.sourceMeta).sort(), Object.keys(original.sourceMeta).filter((key) => new Set<string>([...metaFields, 'jevEvidence']).has(key)).sort())
    if (original.sourceMeta.jevEvidence) {
      assert.deepEqual(row.sourceMeta.jevEvidence, { evidenceUrl: original.sourceMeta.jevEvidence.evidenceUrl })
    } else assert.equal(row.sourceMeta.jevEvidence, original.sourceMeta.jevEvidence)
  })
  const source = JSON.stringify(projected)
  for (const field of ['categoryEvidenceSha', 'categoryEvidenceUrl', 'jevAbout', 'jevKeepConfidence', 'evidenceSha256', 'evidenceLinks']) {
    assert.ok(!source.includes(`"${field}":`), `Audit field leaked: ${field}`)
  }
  // --- 同一输入组合测量，不将独立字段压缩差值相加 ---
  assert.ok(gzipSync(source, { level: 9 }).length < gzipSync(JSON.stringify(full), { level: 9 }).length * 0.85)
})

test('projection is detached, preserves optional/null values and cannot leak future audit additions', () => {
  const row = structuredClone(full[0]) as DirectoryCatalogItem & { futureAudit?: string }
  row.futureAudit = 'unconsumed top-level audit'
  const meta = row.sourceMeta as typeof row.sourceMeta & { futureAudit?: string; githubIdentity?: { databaseId: number; nodeId: string }; previousUrls?: string[] }
  meta.githubIdentity = { databaseId: 42, nodeId: 'opaque' }
  meta.previousUrls = ['https://github.com/test/old']
  meta.futureAudit = 'unconsumed nested audit'
  meta.language = null
  delete meta.date
  const before = structuredClone(row)
  const projected = projectDirectoryCatalog([row])[0]
  assert.equal(projected.sourceMeta.language, null)
  assert.equal(Object.hasOwn(projected.sourceMeta, 'date'), false)
  assert.equal(Object.hasOwn(projected, 'futureAudit'), false)
  assert.equal(Object.hasOwn(projected.sourceMeta, 'futureAudit'), false)
  assert.equal(Object.hasOwn(projected.sourceMeta, 'githubIdentity'), false)
  assert.equal(Object.hasOwn(projected.sourceMeta, 'previousUrls'), false)
  projected.tags?.push('only-projection')
  if (projected.sourceMeta.inclusion) projected.sourceMeta.inclusion.text.en = 'only-projection'
  assert.deepEqual(row, before)
})

test('local search, all sorting modes and stable ranks are identical after projection', () => {
  const projected = projectDirectoryCatalog(full)
  for (const sort of ['stars', 'date', 'name'] as const) assert.deepEqual(ids(sortGithubItems(projected, sort)), ids(sortGithubItems(full, sort)))
  assert.deepEqual([...githubStarRanks(projected)], [...githubStarRanks(full)])
  for (const query of ['', 'browser', 'typesafe', full[0].sourceMeta.author ?? '', full[0].sourceMeta.repo ?? '']) {
    for (const tags of [[], ['sdk']]) assert.deepEqual(ids(searchItems(projected, query, 'github', tags)), ids(searchItems(full, query, 'github', tags)))
  }
})

test('installed Vite loads only the projection and invalidates client and SSR together', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'jev-directory-plugin-')))
  const file = join(root, 'github.json')
  writeFileSync(file, JSON.stringify([full[0]]))
  const plugin = directoryCatalogPlugin(file)
  const server = await createServer({ configFile: false, root, plugins: [plugin], logLevel: 'silent',
    server: { middlewareMode: true, watch: { ignored: ['**/*'] } }, optimizeDeps: { noDiscovery: true, include: [] } })
  try {
    const url = DIRECTORY_CATALOG_ID
    for (const environment of Object.values(server.environments)) {
      const output = await environment.transformRequest(url)
      assert.ok(output?.code.includes(full[0].title))
      assert.ok(!output?.code.includes('jevAbout'))
      assert.ok(environment.moduleGraph.getModuleById(RESOLVED_DIRECTORY_CATALOG_ID)?.transformResult)
      await environment.transformRequest('/github.json')
    }
    const watchFiles: string[] = []
    const load = typeof plugin.load === 'function' ? plugin.load : plugin.load?.handler
    assert.ok(load)
    await Reflect.apply(load, { addWatchFile: (path: string) => watchFiles.push(path) }, [RESOLVED_DIRECTORY_CATALOG_ID])
    assert.deepEqual(watchFiles, [file])
    const revised = structuredClone(full[0]); revised.title = 'updated directory title'
    writeFileSync(file, JSON.stringify([revised]))
    const hook = typeof plugin.hotUpdate === 'function' ? plugin.hotUpdate : plugin.hotUpdate?.handler
    assert.ok(hook)
    const event: HotUpdateOptions = { type: 'update', file, timestamp: Date.now(), modules: [], read: () => readFileSync(file, 'utf8'), server }
    await Reflect.apply(hook, { environment: server.environments.client }, [event])
    // --- 第一个环境收到更新时，其他环境的旧转换也必须已失效 ---
    for (const environment of Object.values(server.environments)) {
      assert.equal(environment.moduleGraph.getModuleById(RESOLVED_DIRECTORY_CATALOG_ID)?.transformResult, null)
      assert.equal(environment.moduleGraph.getModulesByFile(file)?.values().next().value?.transformResult, null)
      assert.ok((await environment.transformRequest(url))?.code.includes(revised.title))
      assert.ok((await environment.transformRequest('/github.json'))?.code.includes(revised.title))
    }
    assert.equal(await Reflect.apply(hook, { environment: server.environments.client }, [{ ...event, file: join(root, 'unrelated.json') }]), undefined)
  } finally {
    await server.close()
    rmSync(root, { recursive: true, force: true })
  }
})
