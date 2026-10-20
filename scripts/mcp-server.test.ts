/**
 * [INPUT]: 依赖官方 MCP 客户端、真实协议入口与构建投影
 * [OUTPUT]: 验证新旧协议、单消息、流式字节/深度上限与跨域安全
 * [POS]: scripts 的 MCP 协议回归；内存 HTTP 连接不访问外网
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client'
import { buildMcpCatalog } from './mcp-catalog.ts'
import { createMcpEndpoint, MCP_BODY_LIMIT, MCP_JSON_DEPTH_LIMIT } from '../src/lib/mcp-server.ts'

const rows = [{
  id: 'github:owner/sdk', type: 'github' as const, title: 'Jev SDK', summary: 'Typed decisions with TypeScript.',
  category: 'sdk' as const, tags: ['typescript'], url: 'https://github.com/owner/sdk',
  sourceMeta: { stars: 42, language: 'TypeScript', author: 'owner', repo: 'sdk' },
}]
const catalog = buildMcpCatalog(rows)
const endpoint = () => createMcpEndpoint(catalog, { limit: async () => ({ success: true }) })
const url = 'https://awesomejev.cc/api/mcp'
const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }
const rpc = (body: unknown, extra: HeadersInit = {}) => new Request(url, {
  method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(body),
})

test('official modern client discovers exactly two read-only tools and queries the snapshot', async () => {
  const server = endpoint()
  const client = new Client({ name: 'jev-test', version: '1.0.0' }, {
    versionNegotiation: { mode: { pin: '2026-07-28' } },
  })
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    fetch: (input, init) => server.fetch(new Request(input, init)),
  })
  try {
    await client.connect(transport)
    assert.equal(client.getProtocolEra(), 'modern')
    assert.equal(client.getNegotiatedProtocolVersion(), '2026-07-28')
    const { tools } = await client.listTools()
    assert.deepEqual(tools.map((tool) => tool.name).sort(), ['get_project', 'search_projects'])
    assert.ok(tools.every((tool) => tool.annotations?.readOnlyHint === true && tool.annotations?.destructiveHint === false))
    const result = await client.callTool({ name: 'search_projects', arguments: { query: 'TypeScript' } })
    assert.equal(result.isError, undefined)
    const output = result.structuredContent as { items: { repository: string }[]; snapshot: { count: number } }
    assert.equal(output.snapshot.count, 1)
    assert.equal(output.items[0].repository, 'owner/sdk')
    const detail = await client.callTool({ name: 'get_project', arguments: { identity: 'owner/sdk' } })
    assert.ok(detail.structuredContent)
    const missing = await client.callTool({ name: 'get_project', arguments: { identity: 'owner/missing' } })
    assert.equal((missing.structuredContent as { project: unknown }).project, null)
  } finally { await client.close(); await server.close() }
})

test('legacy initialize, tools/list and tools/call work without persistent sessions', async () => {
  const server = endpoint()
  try {
    const initialized = await server.fetch(rpc({ jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'legacy', version: '1' } } }))
    assert.equal(initialized.status, 200)
    assert.equal(initialized.headers.get('mcp-session-id'), null)
    const text = await initialized.text()
    assert.match(text, /2025-11-25/)
    const called = await server.fetch(rpc({ jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: { name: 'search_projects', arguments: { limit: 1 } } }, { 'MCP-Protocol-Version': '2025-11-25' }))
    assert.equal(called.status, 200)
    assert.match(await called.text(), /owner\/sdk/)
  } finally { await server.close() }
})

test('endpoint rejects invalid origins, oversized streams and unsupported HTTP methods', async () => {
  const server = endpoint()
  try {
    const badOrigin = await server.fetch(rpc({ jsonrpc: '2.0', id: 1, method: 'ping' }, { Origin: 'https://evil.example' }))
    assert.equal(badOrigin.status, 403)
    assert.equal(badOrigin.headers.get('Access-Control-Allow-Origin'), null)
    assert.equal((await server.fetch(new Request(url))).status, 405)
    assert.equal((await server.fetch(new Request(url, { method: 'DELETE' }))).status, 405)
    const oversized = await server.fetch(new Request(url, {
      method: 'POST', headers, body: JSON.stringify({ data: 'x'.repeat(MCP_BODY_LIMIT) }),
    }))
    assert.equal(oversized.status, 413)
    const malformed = await server.fetch(new Request(url, { method: 'POST', headers, body: '{' }))
    assert.equal(malformed.status, 400)
    assert.equal(malformed.headers.get('Cache-Control'), 'no-store')
  } finally { await server.close() }
})

test('known browser clients receive CORS, while secrets and search content are not reflected in headers', async () => {
  const server = endpoint()
  try {
    const response = await server.fetch(new Request(url, { method: 'OPTIONS', headers: {
      Origin: 'https://glama.ai', 'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,mcp-protocol-version,mcp-method,mcp-name',
    } }))
    assert.equal(response.status, 204)
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://glama.ai')
    assert.match(response.headers.get('Access-Control-Allow-Headers') ?? '', /mcp-method/i)
    assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null)
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex')
  } finally { await server.close() }
})

test('rate limiting is per caller, fails closed, and does not create an MCP session', async () => {
  const keys: string[] = []
  const limited = createMcpEndpoint(catalog, { limit: async ({ key }) => { keys.push(key); return { success: false } } })
  try {
    const response = await limited.fetch(rpc({ jsonrpc: '2.0', id: 1, method: 'ping' }, { 'CF-Connecting-IP': '192.0.2.1' }))
    assert.equal(response.status, 429)
    assert.equal(response.headers.get('Retry-After'), '60')
    assert.deepEqual(keys, ['192.0.2.1'])
  } finally { await limited.close() }
  const broken = createMcpEndpoint(catalog, { limit: async () => { throw new Error('secret backend detail') } })
  try {
    const response = await broken.fetch(rpc({ jsonrpc: '2.0', id: 1, method: 'ping' }))
    assert.equal(response.status, 503)
    assert.doesNotMatch(await response.text(), /secret/)
  } finally { await broken.close() }
})

test('tool schemas reject unbounded search and nonexistent mutation tools', async () => {
  const server = endpoint()
  const client = new Client({ name: 'jev-test', version: '1.0.0' })
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(url), { fetch: (input, init) => server.fetch(new Request(input, init)) }))
    for (const args of [{ limit: 10000 }, { page: -1 }, { query: 'x'.repeat(161) }, { category: 'invented' }]) {
      const result = await client.callTool({ name: 'search_projects', arguments: args })
      assert.equal(result.isError, true)
    }
    // 未注册工具由协议层拒绝；参数错误才由已注册工具返回 isError。
    await assert.rejects(client.callTool({ name: 'delete_project', arguments: { identity: 'owner/sdk' } }),
      (error: unknown) => error instanceof Error && 'code' in error && error.code === -32602)
  } finally { await client.close(); await server.close() }
})

test('legacy batches cannot amplify one rate-limit check into many tool calls', async () => {
  const server = endpoint()
  try {
    for (const count of [0, 1, 100]) {
      const batch = Array.from({ length: count }, (_, id) => ({
        jsonrpc: '2.0', id, method: 'tools/call',
        params: { name: 'search_projects', arguments: { limit: 20 } },
      }))
      assert.ok(Buffer.byteLength(JSON.stringify(batch)) < MCP_BODY_LIMIT)
      const response = await server.fetch(rpc(batch, { 'MCP-Protocol-Version': '2025-11-25' }))
      assert.equal(response.status, 400)
      assert.doesNotMatch(await response.text(), /owner\/sdk/)
    }
  } finally { await server.close() }
})

test('chunked bodies enforce actual bytes and cancel remaining data without Content-Length', async () => {
  const server = endpoint()
  let cancelled = false
  let pulls = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) { pulls++; controller.enqueue(new Uint8Array(1024).fill(32)) },
    cancel() { cancelled = true },
  })
  try {
    const request = new Request(url, {
      method: 'POST', headers, body: stream, duplex: 'half',
    } as RequestInit & { duplex: 'half' })
    assert.equal(request.headers.get('Content-Length'), null)
    const response = await server.fetch(request)
    assert.equal(response.status, 413)
    assert.equal(cancelled, true)
    assert.ok(pulls <= MCP_BODY_LIMIT / 1024 + 2)
  } finally { await server.close() }
})

test('one bounded body accepts split UTF-8 but rejects invalid UTF-8 and deep metadata', async () => {
  const server = endpoint()
  try {
    const bytes = new TextEncoder().encode(JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'search_projects', arguments: { query: '项目' } },
    }))
    let offset = 0
    const valid = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (offset === bytes.length) { controller.close(); return }
        controller.enqueue(bytes.slice(offset, ++offset))
      },
    })
    const response = await server.fetch(new Request(url, {
      method: 'POST', headers, body: valid, duplex: 'half',
    } as RequestInit & { duplex: 'half' }))
    assert.equal(response.status, 200)
    await response.text()

    const invalid = new TextEncoder().encode('{"jsonrpc":"2.0","id":2,"method":"ping","params":{"_meta":{"note":"x"}}}')
    invalid[invalid.indexOf(120)] = 0xff
    assert.equal((await server.fetch(new Request(url, { method: 'POST', headers, body: invalid }))).status, 400)

    let nested: unknown = 0
    for (let depth = 0; depth < MCP_JSON_DEPTH_LIMIT + 1; depth++) nested = { child: nested }
    const deep = await server.fetch(rpc({ jsonrpc: '2.0', id: 3, method: 'ping', params: { _meta: { nested } } }))
    assert.equal(deep.status, 400)
  } finally { await server.close() }
})

test('body limits count UTF-8 bytes even when Content-Length is missing or misleading', async () => {
  const server = endpoint()
  try {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping', params: { note: '中'.repeat(6000) } })
    assert.ok(body.length < MCP_BODY_LIMIT && Buffer.byteLength(body) > MCP_BODY_LIMIT)
    for (const extra of [{}, { 'Content-Length': '1' }] as Record<string, string>[]) {
      const response = await server.fetch(new Request(url, { method: 'POST', headers: { ...headers, ...extra }, body }))
      assert.equal(response.status, 413)
    }
    const unreadable = new ReadableStream<Uint8Array>({
      pull(controller) { controller.error(new Error('private request failure')) },
    })
    const response = await server.fetch(new Request(url, {
      method: 'POST', headers, body: unreadable, duplex: 'half',
    } as RequestInit & { duplex: 'half' }))
    assert.equal(response.status, 400)
    assert.doesNotMatch(await response.text(), /private request failure/)
  } finally { await server.close() }
})
