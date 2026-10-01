/**
 * [INPUT]: 依赖 React DOM、App、I18nProvider 与全局样式
 * [OUTPUT]: 对外提供 旧 index.html 的客户端启动与水合策略
 * [POS]: src 的保留 SPA 启动入口；当前 TanStack Start 使用框架生成的客户端入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from '@/i18n'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>
)

function canHydrate(): boolean {
  if (!root.hasChildNodes()) return false
  try {
    const storedLocale = localStorage.getItem('awesome-jev-locale')
    if (storedLocale === 'zh' || storedLocale === 'ja' ||
      (storedLocale !== 'en' && /^(?:zh|ja)(?:-|$)/i.test(navigator.language))) return false
    const defaults = {
      'awesome-jev-github-sort': 'stars',
      'awesome-jev-github-view': 'cards',
      'awesome-jev-category': 'all',
    }
    return Object.entries(defaults).every(([key, value]) => {
      const stored = localStorage.getItem(key)
      return stored === null || stored === value
    })
  } catch {
    return false
  }
}

if (canHydrate()) hydrateRoot(root, app)
else createRoot(root).render(app)
