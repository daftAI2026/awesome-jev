/**
 * [INPUT]: 依赖正式站点 origin 与三语言消息键
 * [OUTPUT]: 提供 MCP 端点、公开文档地址与原生客户端配置
 * [POS]: lib 的接入说明单一来源；不读取目录、不发请求、不安装客户端
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { SITE_ORIGIN } from './share-image.ts'
import type { MessageKey } from '../i18n/locales/en.ts'

export const MCP_ENDPOINT = `${SITE_ORIGIN}/api/mcp`
export const MCP_DOCUMENT_PATH = '/mcp.md'

// --- 仅使用各客户端原生 HTTP 配置；无需安装转发进程 ---
export const MCP_CLIENTS = [
  {
    id: 'claude',
    name: 'Claude',
    config: MCP_ENDPOINT,
    format: 'url',
    docs: 'https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp',
    steps: ['mcpClaudeStep1', 'mcpClaudeStep2', 'mcpClaudeStep3'],
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    config: `claude mcp add --transport http awesome-jev ${MCP_ENDPOINT}`,
    format: 'shell',
    docs: 'https://code.claude.com/docs/en/mcp',
    steps: ['mcpClaudeCodeStep1', 'mcpClaudeCodeStep2', 'mcpClaudeCodeStep3'],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    config: JSON.stringify({ mcpServers: { 'awesome-jev': { url: MCP_ENDPOINT } } }, null, 2),
    format: 'json',
    docs: 'https://cursor.com/docs/mcp',
    steps: ['mcpCursorStep1', 'mcpCursorStep2', 'mcpCursorStep3'],
  },
  {
    id: 'codex',
    name: 'Codex',
    config: `codex mcp add awesome-jev --url ${MCP_ENDPOINT}`,
    format: 'shell',
    docs: 'https://developers.openai.com/codex/mcp',
    steps: ['mcpCodexStep1', 'mcpCodexStep2', 'mcpCodexStep3'],
  },
  {
    id: 'http',
    name: 'Streamable HTTP',
    config: MCP_ENDPOINT,
    format: 'url',
    docs: 'https://modelcontextprotocol.io/docs/learn/client-concepts',
    steps: ['mcpHttpStep1', 'mcpHttpStep2', 'mcpHttpStep3'],
  },
] as const satisfies readonly {
  id: string
  name: string
  config: string
  format: 'url' | 'shell' | 'json'
  docs: string
  steps: readonly MessageKey[]
}[]

export type McpClientId = (typeof MCP_CLIENTS)[number]['id']
