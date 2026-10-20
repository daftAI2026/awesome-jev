/**
 * [INPUT]: 依赖 MCP 使用页、三语言消息和规范路径元数据
 * [OUTPUT]: 提供三语言公开 MCP 使用页与 canonical/语言替代地址
 * [POS]: routes 的静态接入说明；真实协议请求由独立 /api/mcp 入口接收
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute, notFound } from '@tanstack/react-router'
import { McpPage } from '@/components/McpPage'
import { catalogs } from '@/i18n/catalogs'
import { localizedHead } from '@/lib/locale-head'
import { isLocalizedRouteParam, localeFromParam } from '@/lib/locale-routes'

export const Route = createFileRoute('/{-$locale}/mcp')({
  beforeLoad: ({ params }) => {
    if (!isLocalizedRouteParam(params.locale)) throw notFound()
  },
  head: ({ params }) => {
    const locale = localeFromParam(params.locale)
    return localizedHead({
      path: '/mcp',
      locale,
      title: `${catalogs[locale].mcpTitle} · Awesome JEV`,
      description: catalogs[locale].mcpDescription,
    })
  },
  component: McpPage,
})
