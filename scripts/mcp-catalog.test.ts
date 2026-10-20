/**
 * [INPUT]: 依赖 Node test、MCP 构建投影与只读查询函数
 * [OUTPUT]: 验证公开字段、构建字节门禁、身份迁移、查询边界与快照一致性
 * [POS]: scripts 的 MCP 数据层验收；离线 fixture 不访问模型或 GitHub
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { buildMcpCatalog, type McpCatalogSource } from './mcp-catalog.ts'
import { getProject, searchProjects, type McpSearchArgs } from '../src/lib/mcp-catalog.ts'
import { publicProjects } from '../src/lib/catalog-visibility.ts'
import { sortGithubItems } from '../src/lib/sort.ts'

const row = (repo: string, extra: Partial<McpCatalogSource> = {}): McpCatalogSource => ({
  id: `gh-${repo.replace('/', '-')}`, type: 'github', title: repo.split('/')[1],
  summary: 'A useful SDK for typed decisions', url: `https://github.com/${repo}`,
  category: 'sdk', tags: ['sdk', 'Jev', 'node.js'],
  sourceMeta: { stars: 10, forks: 2, language: 'TypeScript', author: repo.split('/')[0], date: '2026-10-20' },
  ...extra,
})
const basis = {
  text: { en: 'Calls the official SDK.', zh: '调用官方 SDK。', ja: '公式 SDK を呼び出す。' },
  evidence: [{ url: `https://github.com/org/alpha/blob/${'a'.repeat(40)}/src/index.ts`, quote: 'import { Jev } from "@typesafe/jev"' }],
  checkedAt: '2026-10-20T00:00:00Z', reviewer: 'internal-reviewer',
}

test('MCP build projects only public whitelisted facts and never mutates input', () => {
  const visible = row('org/alpha', {
    sourceMeta: { stars: 20, inclusion: { ...basis, futureAudit: 'secret-inclusion' } as typeof basis,
      previousUrls: ['https://github.com/old/alpha'], futureAudit: 'secret-meta' } as McpCatalogSource['sourceMeta'],
    futureAudit: 'secret-row',
  } as Partial<McpCatalogSource>)
  const hidden = row('org/hidden', { sourceMeta: { lifecycle: { state: 'unavailable' }, previousUrls: ['https://github.com/old/hidden'] } } as unknown as Partial<McpCatalogSource>)
  const rows = [visible, hidden], before = structuredClone(rows)
  const catalog = buildMcpCatalog(rows, '2026-10-20T00:00:00Z')
  assert.equal(catalog.snapshot.count, 1)
  assert.equal(catalog.snapshot.updatedAt, '2026-10-20T00:00:00.000Z')
  assert.match(catalog.snapshot.version, /^[a-f0-9]{64}$/)
  const detail = getProject(catalog, 'org/alpha').project
  assert.ok(detail)
  assert.deepEqual(detail.inclusion, { text: basis.text, evidence: basis.evidence, checkedAt: basis.checkedAt })
  assert.equal(detail.pageUrl, 'https://awesomejev.cc/projects/org/alpha')
  assert.equal(detail.url, 'https://github.com/org/alpha')
  assert.equal(detail.repository, 'org/alpha')
  assert.deepEqual(detail.tags, ['sdk', 'nodejs'])
  assert.deepEqual(Object.keys(detail).sort(), [
    'id', 'repository', 'title', 'summary', 'category', 'tags', 'language', 'stars', 'forks',
    'author', 'date', 'url', 'pageUrl', 'inclusion',
  ].sort())
  for (const secret of ['secret-inclusion', 'secret-meta', 'secret-row', 'internal-reviewer', 'org/hidden', 'old/hidden']) {
    assert.ok(!JSON.stringify(catalog).includes(secret), secret)
  }
  assert.deepEqual(rows, before)
  detail.inclusion!.text.en = 'changed projection'
  assert.deepEqual(rows, before)
})

test('snapshot version ignores hidden/audit-only changes and changes with public facts or aliases', () => {
  const original = row('org/alpha'), catalog = buildMcpCatalog([original])
  assert.equal(Object.hasOwn(catalog.snapshot, 'updatedAt'), false)
  assert.deepEqual(catalog, JSON.parse(JSON.stringify(catalog)))
  assert.deepEqual(catalog, buildMcpCatalog([structuredClone(original)]))
  const audited = structuredClone(original)
  Object.assign(audited.sourceMeta, { jevAbout: 0.5, githubIdentity: { databaseId: 5, nodeId: 'secret' } })
  const hidden = row('org/hidden', { sourceMeta: { lifecycle: { state: 'review' } } } as unknown as Partial<McpCatalogSource>)
  assert.equal(buildMcpCatalog([audited, hidden]).snapshot.version, catalog.snapshot.version)
  assert.notEqual(buildMcpCatalog([{ ...original, summary: 'changed' }]).snapshot.version, catalog.snapshot.version)
  assert.notEqual(buildMcpCatalog([{ ...original, sourceMeta: { ...original.sourceMeta, previousUrls: ['https://github.com/old/alpha'] } }]).snapshot.version, catalog.snapshot.version)
  assert.equal(Object.hasOwn(buildMcpCatalog([original], 'invalid').snapshot, 'updatedAt'), false)
})

test('canonical and historical identity lookup is case-insensitive, bounded, and fail-closed', () => {
  const renamed = row('Org/Current', { sourceMeta: { previousUrls: ['https://github.com/Old/Previous'] } })
  const collision = row('Else/Current', { sourceMeta: { previousUrls: ['https://github.com/shared/previous'] } })
  renamed.sourceMeta.previousUrls!.push('https://github.com/shared/previous')
  const hidden = row('Org/Hidden', { sourceMeta: { lifecycle: { state: 'replaced' }, previousUrls: ['https://github.com/Old/Hidden'] } } as unknown as Partial<McpCatalogSource>)
  const catalog = buildMcpCatalog([renamed, collision, hidden])
  for (const identity of ['ORG/CURRENT', 'https://github.com/Org/Current/', 'https://github.com/Org/Current.git', 'old/previous']) {
    assert.equal(getProject(catalog, identity).project?.repository, 'org/current', identity)
  }
  for (const identity of ['org/hidden', 'old/hidden', 'shared/previous', 'unknown/project', '../org/current',
    'https://evil.test/Org/Current', 'https://github.com/Org/Current?x=1', 'https://github.com/Org%2fOther/Current',
    'Org/%2e%2e', 'Org/%43urrent', 'https://github.com/Org/Current/issues', '__proto__', 'constructor']) {
    assert.equal(getProject(catalog, identity).project, null, identity)
  }
  const actual = row('Old/Previous')
  assert.equal(getProject(buildMcpCatalog([renamed, actual]), 'Old/Previous').project?.id, actual.id)
  const replacement = row('Org/Hidden', { id: 'new-approved-identity' })
  assert.equal(getProject(buildMcpCatalog([hidden, replacement]), 'Org/Hidden').project?.id, replacement.id)
  assert.equal(getProject(buildMcpCatalog([hidden, replacement]), 'Old/Hidden').project, null)
  assert.throws(() => buildMcpCatalog([row('org/same'), row('ORG/SAME')]), /duplicate/i)
  assert.throws(() => buildMcpCatalog([row('bad/path/extra')]), /repository/i)
})

test('search combines literal AND words with public tags, category and language', () => {
  const rows = [
    row('org/alpha', { summary: 'Typed decisions, fast browser workflow', tags: ['Jev', 'csharp', 'node.js'] }),
    row('org/beta', { category: 'browser', summary: 'Browser typed decisions', tags: ['c++'], sourceMeta: { language: 'C++', stars: 200 } }),
    row('org/gamma', { summary: 'decision.* literal keyword and 中文工具', tags: ['agent'] }),
  ]
  const catalog = buildMcpCatalog(rows)
  const ids = (args: McpSearchArgs) => searchProjects(catalog, args).items.map(item => item.id)
  assert.deepEqual(ids({ query: 'BROWSER   typed' }), [rows[1].id, rows[0].id])
  assert.deepEqual(ids({ query: 'browser', category: 'sdk', language: 'typescript', tag: 'csharp' }), [rows[0].id])
  assert.deepEqual(ids({ tag: 'node-js' }), [rows[0].id])
  assert.deepEqual(ids({ tag: 'agents' }), [rows[2].id])
  assert.deepEqual(ids({ query: 'decision.*' }), [rows[2].id])
  assert.deepEqual(ids({ query: '中文工具' }), [rows[2].id])
  assert.deepEqual(ids({ query: 'browser missing' }), [])
  assert.deepEqual(ids({ tag: 'jev' }), [])
  assert.deepEqual(ids({ language: 'Rust' }), [])
  assert.deepEqual(ids({ query: 'org/alpha' }), [rows[0].id])
})

test('query pagination is bounded and leaves precomputed order and source objects unchanged', () => {
  const rows = Array.from({ length: 27 }, (_, i) => row(`org/repo-${i}`, {
    title: `Project ${String(i).padStart(2, '0')}`, sourceMeta: { stars: i, date: `2026-10-${String(i + 1).padStart(2, '0')}` },
  }))
  const catalog = buildMcpCatalog(rows), before = structuredClone(catalog)
  const first = searchProjects(catalog)
  assert.equal(first.total, 27)
  assert.equal(first.page, 1)
  assert.equal(first.limit, 10)
  assert.equal(first.nextPage, 2)
  assert.equal(first.items.length, 10)
  assert.deepEqual(first.snapshot, catalog.snapshot)
  const third = searchProjects(catalog, { page: 3, limit: 10 })
  assert.equal(third.items.length, 7)
  assert.equal(third.nextPage, null)
  assert.equal(searchProjects(catalog, { page: 9999 }).items.length, 0)
  assert.equal(searchProjects(catalog, { page: 9999 }).nextPage, null)
  assert.equal(searchProjects(catalog, { query: 'absent' }).total, 0)
  for (const sort of ['stars', 'name', 'date'] as const) {
    const actual = [1, 2, 3].flatMap(page => searchProjects(catalog, { page, sort }).items.map(item => item.id))
    assert.deepEqual(actual, sortGithubItems(rows, sort).map(item => item.id))
  }
  assert.deepEqual(catalog, before)
})

test('search responses avoid full inclusion and mark shortened descriptions', () => {
  const source = row('org/alpha', { summary: '字'.repeat(500), sourceMeta: { inclusion: basis } })
  const catalog = buildMcpCatalog([source])
  const item = searchProjects(catalog).items[0]
  assert.equal(Object.hasOwn(item, 'inclusion'), false)
  assert.equal(item.summaryTruncated, true)
  assert.equal(item.summary.length, 320)
  assert.equal(getProject(catalog, 'org/alpha').project?.summary.length, 500)
})

for (const field of ['title', 'summary'] as const) {
  test(`MCP build rejects a one-MiB ${field} without logging or changing its content`, () => {
    const source = row('org/oversize', { [field]: 'private-source-marker'.padEnd(1024 * 1024, 'x') })
    const before = structuredClone(source)
    assert.throws(() => buildMcpCatalog([source]), (error: unknown) => {
      assert.ok(error instanceof Error)
      assert.match(error.message, /^MCP project too large: org\/oversize \(\d+ bytes > 4096\)$/)
      assert.ok(!error.message.includes('private-source-marker'))
      return true
    })
    assert.deepEqual(source, before)
  })
}

test('MCP build measures UTF-8 JSON bytes and accepts exactly 4096 bytes without truncation', () => {
  const source = row('org/boundary', { summary: '' })
  const overhead = Buffer.byteLength(JSON.stringify(buildMcpCatalog([source]).projects[0]), 'utf8')
  const remaining = 4096 - overhead
  source.summary = '字'.repeat(Math.floor(remaining / 3)) + 'x'.repeat(remaining % 3)
  const before = structuredClone(source), catalog = buildMcpCatalog([source])
  assert.equal(Buffer.byteLength(JSON.stringify(catalog.projects[0]), 'utf8'), 4096)
  assert.equal(getProject(catalog, 'org/boundary').project?.summary, source.summary)
  assert.deepEqual(source, before)
  assert.throws(
    () => buildMcpCatalog([{ ...source, summary: `${source.summary}x` }]),
    /^Error: MCP project too large: org\/boundary \(4097 bytes > 4096\)$/,
  )
})

test('runtime rejects unbounded inputs and never sorts or creates an index per request', () => {
  const catalog = buildMcpCatalog([row('org/alpha')])
  for (const args of [
    { limit: 0 }, { limit: 21 }, { limit: 1.5 }, { limit: Infinity }, { page: 0 }, { page: 10001 },
    { page: NaN }, { query: 'x'.repeat(161) }, { query: 'a b c d e f g h i' }, { query: 1 },
    { category: 'invalid' }, { sort: 'invalid' }, { language: 'x'.repeat(81) }, { tag: 'x'.repeat(51) },
  ]) assert.throws(() => searchProjects(catalog, args as McpSearchArgs), /invalid/i, JSON.stringify(args))
  assert.throws(() => getProject(catalog, 'x'.repeat(501)), /invalid/i)
  const original = Array.prototype.sort
  Array.prototype.sort = () => { throw new Error('Runtime sorting is forbidden') }
  try {
    assert.equal(searchProjects(catalog, { query: 'typed decisions' }).total, 1)
    assert.equal(getProject(catalog, 'org/alpha').project?.repository, 'org/alpha')
  } finally { Array.prototype.sort = original }
})

test('current snapshot yields identical public membership and all three existing ordering rules', () => {
  const rows = JSON.parse(readFileSync(new URL('../data/github.json', import.meta.url), 'utf8')) as McpCatalogSource[]
  const visible = publicProjects(rows), catalog = buildMcpCatalog(rows)
  assert.equal(catalog.snapshot.count, visible.length)
  for (const sort of ['stars', 'name', 'date'] as const) {
    const actual: string[] = []
    for (let page = 1; page <= Math.ceil(visible.length / 20); page++) {
      actual.push(...searchProjects(catalog, { sort, page, limit: 20 }).items.map(item => item.id))
    }
    assert.deepEqual(actual, sortGithubItems(visible, sort).map(item => item.id))
  }
  for (const source of rows) {
    const project = getProject(catalog, source.url).project
    if (visible.includes(source)) assert.equal(project?.id, source.id)
    else {
      assert.notEqual(project?.id, source.id)
      // --- 新身份经独立审核后可复用旧 URL；禁止返回的是旧隐藏记录 ---
      if (project) assert.ok(visible.some(item => item.id === project.id))
    }
  }
  for (const field of ['githubIdentity', 'jevAbout', 'jevKeepConfidence', 'previousUrls', 'reviewer', 'lifecycle']) {
    assert.ok(!JSON.stringify(catalog).includes(`"${field}":`), field)
  }
})
