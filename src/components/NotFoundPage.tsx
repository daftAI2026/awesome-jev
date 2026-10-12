/**
 * [INPUT]: 依赖 RecoveryPage 恢复布局、i18n 和三种缺失文案
 * [OUTPUT]: 提供 NotFoundPage，保留页面/项目/新闻的真实 404 语义
 * [POS]: components 的缺失状态适配器，与 500 共用外壳但不混同错误类型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { RecoveryPage } from '@/components/RecoveryPage'
import { I18nProvider } from '@/i18n'

const COPY = {
  page: { title: 'pageNotFound', description: 'pageNotFoundDescription' },
  project: { title: 'projectNotFound', description: 'projectNotFoundDescription' },
  news: { title: 'newsNotFound', description: 'newsNotFoundDescription' },
} as const

export function NotFoundPage({ kind = 'page' }: { kind?: keyof typeof COPY }) {
  const copy = COPY[kind]
  return <I18nProvider><RecoveryPage status={404} title={copy.title} description={copy.description} /></I18nProvider>
}
