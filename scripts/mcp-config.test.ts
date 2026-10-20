/**
 * [INPUT]: 依赖 MCP 公开配置、三语言文案和使用页源文件
 * [OUTPUT]: 验证八种配置、单行 Tabs、预填链接解码与收藏后导航
 * [POS]: scripts 的 MCP 接入文档护栏；不连接或修改用户客户端
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { MCP_CLIENTS, MCP_DOCUMENT_PATH, MCP_ENDPOINT } from '../src/lib/mcp-config.ts'
import { en } from '../src/i18n/locales/en.ts'
import { zh } from '../src/i18n/locales/zh.ts'
import { ja } from '../src/i18n/locales/ja.ts'

test('MCP setup exposes one HTTPS endpoint without credentials or invented install links', () => {
  assert.equal(MCP_ENDPOINT, 'https://awesomejev.cc/api/mcp')
  assert.equal(MCP_DOCUMENT_PATH, '/mcp.md')
  assert.deepEqual(MCP_CLIENTS.map(({ id }) => id), ['claude', 'claude-code', 'chatgpt', 'codex', 'cursor', 'vscode', 'gemini', 'hermes', 'http'])
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
  assert.deepEqual(JSON.parse(byId('vscode').config), {
    servers: { 'awesome-jev': { type: 'http', url: MCP_ENDPOINT } },
  })
  assert.deepEqual(JSON.parse(byId('gemini').config), {
    mcpServers: { 'awesome-jev': { httpUrl: MCP_ENDPOINT } },
  })
  assert.equal(byId('gemini').name, 'Gemini CLI')
  assert.equal(byId('hermes').config, `hermes mcp add awesome-jev --url ${MCP_ENDPOINT}`)
  assert.equal(byId('chatgpt').config, MCP_ENDPOINT)
  assert.equal(byId('claude').config, MCP_ENDPOINT)
  assert.equal(byId('http').config, MCP_ENDPOINT)
})

test('every setup step and public capability has complete three-language copy', () => {
  const keys = [
    'mcpTitle', 'mcpDescription', 'mcpConnect', 'mcpEndpoint', 'mcpCopy', 'mcpCopied',
    'mcpCopyFailed', 'mcpClientLabel', 'mcpClientDocs', 'mcpTools', 'mcpSearchTool',
    'mcpGetTool', 'mcpTryTitle', 'mcpExample', 'mcpBoundariesTitle', 'mcpSnapshot',
    'mcpPrivacy', 'mcpCost', 'mcpDocument', 'mcpReadonly', 'mcpClientDifference', 'mcpInstall', 'mcpInstallNotice',
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

test('MCP client tabs stay in one native scroll strip with visible keyboard activation', () => {
  const page = readFileSync('src/components/McpPage.tsx', 'utf8')
  const list = page.match(/<TabsList[^>]+>/)?.[0]
  const trigger = page.match(/<TabsTrigger[^>]+>/)?.[0]
  assert.ok(list)
  assert.ok(trigger)
  assert.match(page, /max-w-full min-w-0 overflow-x-auto/)
  assert.match(list, /activateOnFocus/)
  assert.match(list, /w-max min-w-full flex-nowrap justify-start gap-1/)
  assert.doesNotMatch(list, /grid-cols|flex-wrap/)
  assert.match(trigger, /min-w-0 flex-none justify-start text-left/)
  assert.match(trigger, /entry\.id === 'http' \? 'ml-2 border-l-border' : ''/)
  assert.match(page, /scrollIntoView\(\{ block: 'nearest', inline: 'nearest', behavior: 'instant' \}\)/)
  assert.doesNotMatch(page, /col-span-full|scroll-smooth/)
  assert.match(page, /t\('mcpClientDifference'\)/)
  assert.match(page, /size-4 shrink-0 object-contain/)
  assert.match(en.mcpClientDifference, /Chat apps.*coding tools.*different setup/i)
  for (const messages of [zh, ja]) assert.notEqual(messages.mcpClientDifference, en.mcpClientDifference)
})

test('only documented clients expose credential-free install links with exact decoded configuration', () => {
  const available = MCP_CLIENTS.filter(client => 'installUrl' in client)
  assert.deepEqual(available.map(client => client.id), ['claude', 'cursor', 'vscode'])
  const byId = (id: string) => available.find(client => client.id === id)!
  const claude = new URL(byId('claude').installUrl)
  assert.equal(claude.origin, 'https://claude.ai')
  assert.equal(claude.pathname, '/customize/connectors')
  assert.deepEqual(Object.fromEntries(claude.searchParams), {
    modal: 'add-custom-connector', connectorName: 'Awesome JEV', connectorUrl: MCP_ENDPOINT,
  })
  const cursor = new URL(byId('cursor').installUrl)
  assert.equal(cursor.protocol, 'cursor:')
  assert.equal(cursor.hostname, 'anysphere.cursor-deeplink')
  assert.equal(cursor.pathname, '/mcp/install')
  assert.equal(cursor.searchParams.get('name'), 'awesome-jev')
  assert.deepEqual(JSON.parse(atob(cursor.searchParams.get('config')!)), { url: MCP_ENDPOINT })
  const vscode = new URL(byId('vscode').installUrl)
  assert.equal(vscode.protocol, 'vscode:')
  assert.equal(vscode.pathname, 'mcp/install')
  assert.deepEqual(JSON.parse(decodeURIComponent(vscode.search.slice(1))), { name: 'awesome-jev', type: 'http', url: MCP_ENDPOINT })
  for (const client of available) {
    assert.doesNotMatch(client.installUrl, /API_KEY|TOKEN|Bearer|Authorization|localhost|npx/i)
    assert.equal(new URL(client.installDocs).protocol, 'https:')
  }
  const page = readFileSync('src/components/McpPage.tsx', 'utf8')
  assert.match(page, /'installUrl' in entry/)
  assert.match(page, /href=\{entry\.installUrl\}/)
  assert.match(page, /t\('mcpInstall', \{ client: entry\.name \}\)/)
  assert.match(en.mcpInstallNotice, /review.*confirm/i)
  assert.match(en.mcpChatgptStep3, /not.*public.*listing/i)
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

test('MCP client choices use the shared Base UI Tabs with linked content panels', () => {
  const page = readFileSync('src/components/McpPage.tsx', 'utf8')
  const tabs = readFileSync('src/components/ui/tabs.tsx', 'utf8')
  assert.match(page, /import \{ Tabs, TabsList, TabsTrigger, TabsContent \} from '@\/components\/ui\/tabs'/)
  assert.doesNotMatch(page, /ToggleGroup/)
  assert.match(page, /<TabsList[^>]+aria-label=\{t\('mcpClientLabel'\)\}/)
  assert.match(page, /<TabsTrigger[^>]+value=\{entry\.id\}/)
  assert.match(page, /<TabsContent[^>]+value=\{entry\.id\}/)
  assert.match(tabs, /@base-ui\/react\/tabs/)
  for (const part of ['Root', 'List', 'Tab', 'Panel']) assert.ok(tabs.includes(`TabsPrimitive.${part}`))
  assert.match(tabs, /focus-visible:ring/)
  assert.doesNotMatch(tabs, /transition-all|shadow-|#[0-9a-f]{3,8}\b/i)
})

test('MCP navigation sits above the directory categories and stays localized', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const navigation = app.slice(app.indexOf('const categoryNav ='), app.indexOf('const matched ='))
  assert.match(navigation, /localizedPath\('\/mcp', locale\)/)
  assert.match(navigation, /t\('mcpNav'\)/)
  assert.match(navigation, /<Button nativeButton=\{false\} role="link" render=\{<a href=\{localizedPath\('\/mcp', locale\)\}/)
  assert.ok(navigation.indexOf("filterButton('saved')") < navigation.indexOf("localizedPath('/mcp', locale)"))
  assert.ok(navigation.indexOf("localizedPath('/mcp', locale)") < navigation.indexOf('<Separator'))
  assert.equal(en.mcpNav, 'MCP')
  assert.equal(zh.mcpNav, 'MCP 接入')
  assert.equal(ja.mcpNav, 'MCP 接続')
})

test('MCP software tabs use local self-contained brand assets and a generic protocol icon', () => {
  const page = readFileSync('src/components/McpPage.tsx', 'utf8')
  const sources = readFileSync('public/agent-logos/README.md', 'utf8')
  for (const client of MCP_CLIENTS) {
    if (client.id === 'http') {
      assert.equal(client.icon, null)
      continue
    }
    assert.ok(client.icon, client.id)
    assert.match(client.icon.src, /^\/agent-logos\/[a-z-]+\.(svg|png)$/)
    const bytes = readFileSync(`public${client.icon.src}`)
    if (client.icon.src.endsWith('.svg')) {
      assert.match(bytes.toString(), /<svg\b/)
      assert.doesNotMatch(bytes.toString(), /<script\b|<foreignObject\b|\bon\w+\s*=|(?:xlink:)?href\s*=\s*["'](?!#)|url\(\s*["']?(?!#)/i)
    } else {
      assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    }
    assert.ok(sources.includes(client.icon.src.split('/').at(-1)!))
  }
  assert.match(page, /<Globe[^>]+aria-hidden/)
  assert.match(page, /<img[^>]+alt=""/)
  assert.match(page, /dark:invert/)
  for (const [name, hash] of [
    ['cursor.svg', 'c483c02f78eb2619778fdd959e72a9adfac4844854472cd2653d4cbfd60e4d71'],
    ['cursor-dark.svg', 'cd0e3e5d8991a4cdd4577f8896cd063105207665165c73e25a1ff918dd367eb7'],
    ['anthropic.svg', 'd55918884053460f24c958fca3fba8d10b48fdd86e73ba3cd1237713bc0a03bb'],
    ['anthropic-dark.svg', '38fc06d8e9390654cc4e96aa53691e2e78d929667c0034805b6d1b3891ba22dd'],
    ['gemini-cli-mono.svg', '4ecb094718b12b9f865e6c26cbea5ccd0aad0d54ae9154bad7b3b5e36bb102ac'],
    ['gemini-cli-mono-dark.svg', '60efbc885db0e30b839459e5aa991ca15a6fc439bf18d971f673cf63398c1834'],
    ['vscode-codicon.svg', 'f9130337f239b034092a047fd4b2c771843f0b58362447b4b94e0ed9d6bb9886'],
    ['hermes-mono.png', '8e88dcec5b87a07eadd3a89d8f029f0eddd5f456aae29ae3c54c36e08bca4a55'],
  ]) {
    const bytes = readFileSync(`public/agent-logos/${name}`)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash)
    assert.ok(sources.includes(name))
  }
  assert.match(readFileSync('public/agent-logos/HERMES-LICENSE.txt', 'utf8'), /MIT License/)
  assert.match(readFileSync('public/agent-logos/CODICONS-LICENSE.txt', 'utf8'), /Attribution 4.0 International/)
})

test('MCP client icons use official monochrome variants without recoloring footer assets', () => {
  assert.deepEqual(MCP_CLIENTS.map(client => [client.id, client.icon?.src]), [
    ['claude', '/agent-logos/anthropic.svg'], ['claude-code', '/agent-logos/anthropic.svg'],
    ['chatgpt', '/agent-logos/openai.svg'], ['codex', '/agent-logos/openai.svg'],
    ['cursor', '/agent-logos/cursor.svg'], ['vscode', '/agent-logos/vscode-codicon.svg'],
    ['gemini', '/agent-logos/gemini-cli-mono.svg'], ['hermes', '/agent-logos/hermes-mono.png'], ['http', undefined],
  ])
  const page = readFileSync('src/components/McpPage.tsx', 'utf8')
  assert.doesNotMatch(page, /grayscale|brightness-/)
})

test('new client instructions distinguish app access, configuration scopes and reloads', () => {
  assert.match(en.mcpChatgptStep1, /Plugins/)
  assert.match(en.mcpChatgptStep1, /plan.*workspace/i)
  assert.match(en.mcpChatgptStep2, /authentication/)
  assert.match(en.mcpVscodeStep1, /\.vscode\/mcp\.json/)
  assert.match(en.mcpGeminiStep1, /\.gemini\/settings\.json/)
  assert.match(en.mcpHermesStep3, /hermes mcp test awesome-jev/)
  assert.match(en.mcpHermesStep3, /\/reload-mcp/)
})
