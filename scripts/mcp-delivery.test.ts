/**
 * [INPUT]: 依赖真实构建 Worker、官方 MCP 客户端与目录可见性规则
 * [OUTPUT]: 验证协议、三语言使用页、文档与客户端产物隔离
 * [POS]: scripts 的 MCP 上线门禁；零跳过交付由 verify-delivery 编排
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client'
import { publicProjects } from '../src/lib/catalog-visibility.ts'
import { buildMcpCatalog } from './mcp-catalog.ts'
import { getProject } from '../src/lib/mcp-catalog.ts'
import snapshot from '../data/github.json' with { type: 'json' }

const origin = process.env.TEST_SITE_ORIGIN
const build = process.env.TEST_BUILD_OUTPUT

test('built Worker serves modern MCP and legacy requests without sessions or SSR', { skip: !origin }, async () => {
  const client = new Client({ name: 'awesome-jev-delivery', version: '1.0.0' }, {
    versionNegotiation: { mode: { pin: '2026-07-28' } },
  })
  const endpoint = `${origin}/api/mcp`
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)))
    assert.equal(client.getProtocolEra(), 'modern')
    assert.equal(client.getNegotiatedProtocolVersion(), '2026-07-28')
    const tools = await client.listTools()
    assert.deepEqual(tools.tools.map(tool => tool.name).sort(), ['get_project', 'search_projects'])
    const result = await client.callTool({ name: 'search_projects', arguments: { limit: 2 } })
    const value = result.structuredContent as { items: { repository: string }[]; snapshot: { count: number } }
    assert.equal(value.snapshot.count, publicProjects(snapshot).length)
    assert.equal(value.items.length, 2)
    const detail = await client.callTool({ name: 'get_project', arguments: { identity: value.items[0].repository } })
    assert.ok((detail.structuredContent as { project: unknown }).project)
    const missing = await client.callTool({ name: 'get_project', arguments: { identity: 'missing/missing' } })
    assert.equal((missing.structuredContent as { project: unknown }).project, null)
    const catalog = buildMcpCatalog(snapshot)
    const hidden = snapshot.find(row => 'lifecycle' in row.sourceMeta && getProject(catalog, row.url).project === null)
    assert.ok(hidden, '需要一个真实隐藏且未被新项目接管的仓库')
    const removed = await client.callTool({ name: 'get_project', arguments: { identity: hidden.url } })
    assert.equal((removed.structuredContent as { project: unknown }).project, null)
  } finally { await client.close() }
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'delivery', version: '1' } } }),
  })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('mcp-session-id'), null)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  assert.match(await response.text(), /2025-11-25/)
})

test('built HTTP boundary preserves origin and bounded-input rules', { skip: !origin }, async () => {
  const endpoint = `${origin}/api/mcp`
  assert.equal((await fetch(endpoint)).status, 405)
  const blocked = await fetch(endpoint, { method: 'POST', headers: { Origin: 'https://evil.example' }, body: '{}' })
  assert.equal(blocked.status, 403)
  assert.equal(blocked.headers.get('Access-Control-Allow-Origin'), null)
  const oversized = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ padding: 'x'.repeat(16 * 1024) }),
  })
  assert.equal(oversized.status, 413)
  await oversized.body?.cancel()
})

test('MCP setup is a static three-language page with matching public markdown', { skip: !origin || !build }, async () => {
  for (const prefix of ['', '/zh', '/ja']) {
    const response = await fetch(`${origin}${prefix}/mcp`)
    assert.equal(response.status, 200)
    const html = await response.text()
    assert.ok(html.includes(`rel="canonical" href="https://awesomejev.cc${prefix}/mcp"`))
    assert.match(html, /https:\/\/awesomejev\.cc\/api\/mcp/)
    assert.match(html, /search_projects/)
    assert.match(html, /get_project/)
    assert.match(html, /\/mcp\.md/)
    const built = await readFile(path.join(build!, prefix, 'mcp', 'index.html'), 'utf8')
    assert.ok(built.length > 1000)
  }
  const markdown = await fetch(`${origin}/mcp.md`)
  assert.equal(markdown.status, 200)
  assert.match(markdown.headers.get('Content-Type') ?? '', /text\/markdown/)
  assert.match(await markdown.text(), /https:\/\/awesomejev\.cc\/api\/mcp/)
})

test('MCP server implementation and private snapshot fields never enter browser JavaScript', { skip: !build }, async () => {
  const assets = path.join(build!, 'assets')
  const files = (await readdir(assets)).filter(name => name.endsWith('.js'))
  assert.ok(files.length > 0)
  for (const filename of files) {
    const code = await readFile(path.join(assets, filename), 'utf8')
    assert.doesNotMatch(code, /Search the curated Awesome JEV directory|MCP temporarily unavailable\.|mcp-catalog|identity-unavailable|rateLimitRetryAt/, filename)
  }
})
