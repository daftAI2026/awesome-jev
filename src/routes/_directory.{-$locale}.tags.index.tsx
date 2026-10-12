/**
 * [INPUT]: 依赖语言文案与共享规范地址元数据
 * [OUTPUT]: 提供三语言公开标签索引 Route
 * [POS]: routes 的标签索引；App 从既有展示投影读取标签计数
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createFileRoute } from '@tanstack/react-router'
import { catalogs } from '@/i18n/catalogs'
import { localizedHead } from '@/lib/locale-head'
import { localeFromParam } from '@/lib/locale-routes'

export const Route = createFileRoute('/_directory/{-$locale}/tags/')({
  head: ({ params }) => {
    const locale = localeFromParam(params.locale)
    const messages = catalogs[locale]
    return localizedHead({ path: '/tags', locale, title: `${messages.tagsTitle} · Awesome JEV`, description: messages.tagsDescription })
  },
  component: () => null,
})
