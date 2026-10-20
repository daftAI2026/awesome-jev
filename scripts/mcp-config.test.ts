/**
 * [INPUT]: 依赖 MCP 公开配置、三语言文案和使用页源文件
 * [OUTPUT]: 验证客户端命令、同源端点和使用页的公开边界
 * [POS]: scripts 的 MCP 接入文档护栏；不连接或修改用户客户端
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { MCP_CLIENTS, MCP_DOCUMENT_PATH, MCP_ENDPOINT } from '../src/lib/mcp-config.ts'
import { en } from '../src/i18n/locales/en.ts'
import { zh } from '../src/i18n/locales/zh.ts'
import { ja } from '../src/i18n/locales/ja.ts'

test('MCP setup exposes one HTTPS endpoint without credentials or invented install links', () => {
  assert.equal(MCP_ENDPOINT, 'https://awesomejev.cc/api/mcp')
  assert.equal(MCP_DOCUMENT_PATH, '/mcp.md')
  assert.deepEqual(MCP_CLIENTS.map(({ id }) => id), ['claude', 'claude-code', 'cursor', 'codex', 'http'])
  for (const client of MCP_CLIENTS) {
    assert.ok(client.config.includes(MCP_ENDPOINT), client.id)
    assert.equal(new URL(client.docs).protocol, 'https:')
    assert.doesNotMatch(client.config, /API_KEY|TOKEN|Authorization|npx|localhost|\/Users\//i)
    assert.equal(client.steps.length, 3)
  }
})

test('copyable configurations use the documented native client transports', () => {
  const byId = (id: string) => MCP_CLIENTS.find((client) => client.id === id)!
  assert.equal(byId('claude-code').config, `claude mcp add --transport http awesome-jev ${MCP_ENDPOINT}`)
  assert.equal(byId('codex').config, `codex mcp add awesome-jev --url ${MCP_ENDPOINT}`)
  assert.deepEqual(JSON.parse(byId('cursor').config), {
    mcpServers: { 'awesome-jev': { url: MCP_ENDPOINT } },
  })
  assert.equal(byId('claude').config, MCP_ENDPOINT)
  assert.equal(byId('http').config, MCP_ENDPOINT)
})

test('every setup step and public capability has complete three-language copy', () => {
  const keys = [
    'mcpTitle', 'mcpDescription', 'mcpConnect', 'mcpEndpoint', 'mcpCopy', 'mcpCopied',
    'mcpCopyFailed', 'mcpClientLabel', 'mcpClientDocs', 'mcpTools', 'mcpSearchTool',
    'mcpGetTool', 'mcpTryTitle', 'mcpExample', 'mcpBoundariesTitle', 'mcpSnapshot',
    'mcpPrivacy', 'mcpCost', 'mcpDocument', 'mcpReadonly',
    ...MCP_CLIENTS.flatMap((client) => client.steps),
  ] as const
  for (const messages of [en, zh, ja]) {
    for (const key of keys) assert.ok(messages[key as keyof typeof en]?.length, key)
  }
  for (const messages of [zh, ja]) {
    assert.notEqual(messages.mcpDescription, en.mcpDescription)
    assert.notEqual(messages.mcpPrivacy, en.mcpPrivacy)
  }
})

test('MCP page has a public route, accessible copy state and localized footer entry', () => {
  const page = readFileSync('src/components/McpPage.tsx', 'utf8')
  const route = readFileSync('src/routes/{-$locale}.mcp.tsx', 'utf8')
  const footer = readFileSync('src/components/AgentsFooter.tsx', 'utf8')
  assert.match(page, /href="#main-content"/)
  assert.match(page, /id="main-content"/)
  assert.match(page, /aria-live="polite"/)
  assert.match(page, /navigator\.clipboard\.writeText/)
  assert.match(page, /search_projects/)
  assert.match(page, /get_project/)
  assert.match(page, /MCP_DOCUMENT_PATH/)
  assert.match(route, /isLocalizedRouteParam/)
  assert.match(route, /localizedHead/)
  assert.doesNotMatch(route, /virtual:directory-catalog|catalog\.functions|data\/github/)
  assert.match(footer, /localizedPath\('\/mcp', locale\)/)
})
