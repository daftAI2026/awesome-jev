/**
 * [INPUT]: 依赖正式站点 origin 与三语言消息键
 * [OUTPUT]: 提供原生配置、三种官方预填链接与本地品牌引用
 * [POS]: lib 的接入说明单一来源；不读取目录、不发请求、不安装客户端
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { SITE_ORIGIN } from './share-image.ts'
import type { MessageKey } from '../i18n/locales/en.ts'

export const MCP_ENDPOINT = `${SITE_ORIGIN}/api/mcp`
export const MCP_DOCUMENT_PATH = '/mcp.md'

// --- 产品家族相邻；各客户端保留原生配置，通用协议放末尾 ---
export const MCP_CLIENTS = [
  {
    id: 'claude',
    name: 'Claude',
    icon: { src: '/agent-logos/anthropic.svg', darkSrc: '/agent-logos/anthropic-dark.svg', monochrome: false },
    config: MCP_ENDPOINT,
    format: 'url',
    docs: 'https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp',
    installUrl: `https://claude.ai/customize/connectors?${new URLSearchParams({ modal: 'add-custom-connector', connectorName: 'Awesome JEV', connectorUrl: MCP_ENDPOINT })}`,
    installDocs: 'https://claude.com/docs/connectors/building/directory-vs-custom#custom-connector-install-link',
    steps: ['mcpClaudeStep1', 'mcpClaudeStep2', 'mcpClaudeStep3'],
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    icon: { src: '/agent-logos/anthropic.svg', darkSrc: '/agent-logos/anthropic-dark.svg', monochrome: false },
    config: `claude mcp add --transport http awesome-jev ${MCP_ENDPOINT}`,
    format: 'shell',
    docs: 'https://code.claude.com/docs/en/mcp',
    steps: ['mcpClaudeCodeStep1', 'mcpClaudeCodeStep2', 'mcpClaudeCodeStep3'],
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: { src: '/agent-logos/openai.svg', monochrome: true },
    config: MCP_ENDPOINT,
    format: 'url',
    docs: 'https://developers.openai.com/plugins/deploy/connect-chatgpt',
    steps: ['mcpChatgptStep1', 'mcpChatgptStep2', 'mcpChatgptStep3'],
  },
  {
    id: 'codex',
    name: 'Codex',
    icon: { src: '/agent-logos/openai.svg', monochrome: true },
    config: `codex mcp add awesome-jev --url ${MCP_ENDPOINT}`,
    format: 'shell',
    docs: 'https://developers.openai.com/codex/mcp',
    steps: ['mcpCodexStep1', 'mcpCodexStep2', 'mcpCodexStep3'],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    icon: { src: '/agent-logos/cursor.svg', darkSrc: '/agent-logos/cursor-dark.svg', monochrome: false },
    config: JSON.stringify({ mcpServers: { 'awesome-jev': { url: MCP_ENDPOINT } } }, null, 2),
    format: 'json',
    docs: 'https://cursor.com/docs/mcp',
    installUrl: `cursor://anysphere.cursor-deeplink/mcp/install?${new URLSearchParams({ name: 'awesome-jev', config: btoa(JSON.stringify({ url: MCP_ENDPOINT })) })}`,
    installDocs: 'https://cursor.com/docs/mcp/install-links',
    steps: ['mcpCursorStep1', 'mcpCursorStep2', 'mcpCursorStep3'],
  },
  {
    id: 'vscode',
    name: 'VS Code',
    icon: { src: '/agent-logos/vscode-codicon.svg', monochrome: true },
    config: JSON.stringify({ servers: { 'awesome-jev': { type: 'http', url: MCP_ENDPOINT } } }, null, 2),
    format: 'json',
    docs: 'https://code.visualstudio.com/docs/agents/reference/mcp-configuration',
    installUrl: `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: 'awesome-jev', type: 'http', url: MCP_ENDPOINT }))}`,
    installDocs: 'https://code.visualstudio.com/api/extension-guides/ai/mcp#create-an-mcp-installation-url',
    steps: ['mcpVscodeStep1', 'mcpVscodeStep2', 'mcpVscodeStep3'],
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    icon: { src: '/agent-logos/gemini-cli-mono.svg', darkSrc: '/agent-logos/gemini-cli-mono-dark.svg', monochrome: false },
    config: JSON.stringify({ mcpServers: { 'awesome-jev': { httpUrl: MCP_ENDPOINT } } }, null, 2),
    format: 'json',
    docs: 'https://geminicli.com/docs/tools/mcp-server/',
    steps: ['mcpGeminiStep1', 'mcpGeminiStep2', 'mcpGeminiStep3'],
  },
  {
    id: 'hermes',
    name: 'Hermes',
    icon: { src: '/agent-logos/hermes-mono.png', monochrome: false },
    config: `hermes mcp add awesome-jev --url ${MCP_ENDPOINT}`,
    format: 'shell',
    docs: 'https://hermes-agent.nousresearch.com/docs/reference/cli-commands#hermes-mcp',
    steps: ['mcpHermesStep1', 'mcpHermesStep2', 'mcpHermesStep3'],
  },
  {
    id: 'http',
    name: 'Streamable HTTP',
    icon: null,
    config: MCP_ENDPOINT,
    format: 'url',
    docs: 'https://modelcontextprotocol.io/docs/learn/client-concepts',
    steps: ['mcpHttpStep1', 'mcpHttpStep2', 'mcpHttpStep3'],
  },
] as const satisfies readonly {
  id: string
  name: string
  icon: { src: string; darkSrc?: string; monochrome: boolean } | null
  config: string
  format: 'url' | 'shell' | 'json'
  docs: string
  installUrl?: string
  installDocs?: string
  steps: readonly MessageKey[]
}[]

export type McpClientId = (typeof MCP_CLIENTS)[number]['id']
