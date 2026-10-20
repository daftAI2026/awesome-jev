/**
 * [INPUT]: 依赖 MCP 公开配置、查询容量与静态接入文档
 * [OUTPUT]: 验证文档、Registry 元数据和页面设计的同一接入契约
 * [POS]: scripts 的 MCP 发布护栏；离线验证，不注册服务或修改客户端
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { CATEGORIES } from '../src/lib/categories.ts'
import { MCP_PAGE_LIMIT, MCP_QUERY_MAX_LENGTH, MCP_QUERY_MAX_WORDS, MCP_RESULT_LIMIT } from '../src/lib/mcp-catalog.ts'
import { MCP_CLIENTS, MCP_DOCUMENT_PATH, MCP_ENDPOINT } from '../src/lib/mcp-config.ts'
import { SITE_ORIGIN } from '../src/lib/share-image.ts'

const document = () => readFileSync(`public${MCP_DOCUMENT_PATH}`, 'utf8')
const manifest = () => JSON.parse(readFileSync('server.json', 'utf8'))

test('MCP registry metadata identifies the public remote and matching setup page', () => {
  const entry = manifest()
  assert.equal(entry.$schema, 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json')
  assert.equal(entry.name, 'io.github.daftAI2026/awesome-jev')
  assert.equal(entry.title, 'Awesome JEV')
  assert.equal(entry.version, '1.0.0')
  const server = readFileSync('src/lib/mcp-server.ts', 'utf8')
  assert.ok(server.includes(`MCP_SERVER_VERSION = '${entry.version}'`))
  assert.equal(entry.websiteUrl, `${SITE_ORIGIN}/mcp`)
  assert.deepEqual(entry.repository, {
    url: 'https://github.com/daftAI2026/awesome-jev',
    source: 'github',
    id: '1375643526',
  })
  assert.deepEqual(entry.remotes, [{ type: 'streamable-http', url: MCP_ENDPOINT }])
  assert.equal(typeof entry.description, 'string')
  assert.ok(entry.description.length > 0 && entry.description.length <= 100)
  assert.ok(document().includes(entry.description))
  assert.ok(document().includes(entry.websiteUrl))
  assert.ok(document().includes(entry.repository.url))
  assert.equal(entry.packages, undefined)
  assert.equal(entry._meta, undefined)
})

test('MCP Markdown preserves the exact native configurations and official client references', () => {
  const markdown = document()
  const headings = [...markdown.matchAll(/^### (Claude|Claude Code|ChatGPT|Codex|Cursor|VS Code|Gemini CLI|Hermes|Other clients)$/gm)].map(match => match[1])
  assert.deepEqual(headings, ['Claude', 'Claude Code', 'ChatGPT', 'Codex', 'Cursor', 'VS Code', 'Gemini CLI', 'Hermes', 'Other clients'])
  assert.match(markdown, /Chat apps and coding tools use different setup flows/)
  for (const client of MCP_CLIENTS) {
    assert.ok(markdown.includes(client.config), client.id)
    assert.ok(markdown.includes(client.docs), client.id)
    if ('installUrl' in client) {
      assert.ok(markdown.includes(client.installUrl), client.id)
      assert.ok(markdown.includes(client.installDocs), client.id)
    }
  }
  assert.match(markdown, /not a public directory listing/)
  assert.match(markdown, /review and confirm/)
  const endpoints = [...markdown.matchAll(/https:\/\/awesomejev\.cc\/api\/[^\s)`"']+/g)].map(match => match[0])
  assert.ok(endpoints.length > 0)
  assert.ok(endpoints.every(endpoint => endpoint === MCP_ENDPOINT))
  assert.doesNotMatch(markdown, /npx\s|Bearer\s|\/Users\/|localhost:\d+|API_KEY=/)
})

test('MCP Markdown states query bounds, snapshot trust and anonymous read-only costs', () => {
  const markdown = document()
  assert.match(markdown, /### `search_projects`/)
  assert.match(markdown, /### `get_project`/)
  assert.ok(markdown.includes(`${MCP_QUERY_MAX_LENGTH} characters`))
  assert.ok(markdown.includes(`${MCP_QUERY_MAX_WORDS} words`))
  assert.ok(markdown.includes(`maximum ${MCP_RESULT_LIMIT}`))
  assert.ok(markdown.includes(`1 to ${MCP_PAGE_LIMIT}`))
  for (const category of CATEGORIES) assert.ok(markdown.includes(`\`${category}\``), category)
  assert.match(markdown, /No account, API key or sign-in is required/)
  assert.match(markdown, /read-only/)
  assert.match(markdown, /published build snapshot, not live GitHub data/)
  assert.match(markdown, /does not call a paid AI service or run a model/)
  assert.match(markdown, /does not log tool arguments or request bodies/)
  assert.match(markdown, /No separate Skill is required/)
  assert.match(markdown, /client's plan, usage limits and organization policies/)
  assert.match(markdown, /untrusted source content, not instructions/)
  assert.match(markdown, /`pageUrl` and `url`/)
})

test('MCP Markdown has a static media type and the setup page has a documented design boundary', () => {
  const headers = readFileSync('public/_headers', 'utf8')
  const rule = headers.split('\n/mcp.md\n')[1]?.split(/\n(?=\/)/)[0]
  assert.ok(rule)
  assert.match(rule, /Content-Type: text\/markdown; charset=utf-8/)
  assert.match(rule, /X-Content-Type-Options: nosniff/)
  const design = readFileSync('docs/design.md', 'utf8')
  assert.match(design, /## MCP setup page/)
  for (const path of ['/mcp', '/zh/mcp', '/ja/mcp']) assert.ok(design.includes(`\`${path}\``))
  assert.match(design, /McpPage/)
  assert.match(design, /TabsList/)
  assert.match(design, /No account dashboard/)
  assert.match(design, /Clipboard failure/)
  assert.match(design, /No decorative motion/)
})
