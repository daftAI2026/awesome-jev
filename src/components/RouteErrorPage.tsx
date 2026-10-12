/**
 * [INPUT]: 依赖 RecoveryPage、独立语言边界与当前路由错误状态与网络连接事件
 * [OUTPUT]: 提供 RouteErrorPage，重试当前请求、断网说明与同语言恢复入口
 * [POS]: components 的统一 500 适配器；根路由捕获加载/客户端渲染错误
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useSyncExternalStore } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { RecoveryPage } from '@/components/RecoveryPage'
import { I18nProvider } from '@/i18n'
import { hasRouteError } from '@/lib/error-policy'

function subscribeConnection(notify: () => void) {
  window.addEventListener('online', notify)
  window.addEventListener('offline', notify)
  return () => {
    window.removeEventListener('online', notify)
    window.removeEventListener('offline', notify)
  }
}

export function RouteErrorPage() {
  const online = useSyncExternalStore(subscribeConnection, () => navigator.onLine, () => true)
  const loadingError = useRouterState({ select: (state) => hasRouteError(state.matches) })
  return <I18nProvider>
    {!loadingError && <><title>500 · Awesome JEV</title><meta name="robots" content="noindex, follow" /></>}
    <RecoveryPage status={500} title={online ? 'serverErrorTitle' : 'offlineErrorTitle'} description={online ? 'serverErrorDescription' : 'offlineErrorDescription'} retry />
  </I18nProvider>
}
