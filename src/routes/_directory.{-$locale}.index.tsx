/**
 * [INPUT]: 依赖三语言首页文案与共享 localizedHead
 * [OUTPUT]: 对外提供首页 Route 和品牌搜索元数据
 * [POS]: routes 的首页叶节点；目录界面由父布局 App 渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute } from '@tanstack/react-router'
import { catalogs } from '@/i18n/catalogs'
import { localizedHead } from '@/lib/locale-head'
import { localeFromParam } from '@/lib/locale-routes'

export const Route = createFileRoute('/_directory/{-$locale}/')({
  head: ({ params }) => {
    const locale = localeFromParam(params.locale)
    const messages = catalogs[locale]
    return localizedHead({ path: '/', locale, title: messages.documentTitle, description: messages.documentDescription })
  },
  component: () => null,
})
