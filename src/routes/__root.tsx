/**
 * [INPUT]: 依赖 TanStack 文档壳、i18n、共享 404、构建期全站图片地址及分享图契约
 * [OUTPUT]: 对外提供 根 Route、首屏语言/主题初始化及文档 head；开发预览不发送 Umami 数据
 * [POS]: routes 的根边界，承接未知地址而不重定向成成功页面
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { ReactNode } from 'react'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from '@tanstack/react-router'
import { I18nProvider } from '@/i18n'
import { NotFoundPage } from '@/components/NotFoundPage'
import { LANGUAGE_TAG, LOCALE_STORAGE_KEY, localeFromPath } from '@/lib/locale-routes'
import { shareImageMeta } from '@/lib/share-image'
import '../index.css'

const SITE_DESCRIPTION = 'A free curated directory of TypeSafe Jev / System One GitHub projects, organized by what they build and how they use Jev.'
const THEME_BOOTSTRAP = `(() => {
  let theme = null
  try { theme = localStorage.getItem('awesome-jev-theme') } catch {}
  if (theme === 'light') document.documentElement.classList.add('light')
  else if (theme === 'dark' || matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark')
})()`
const LOCALE_BOOTSTRAP = `(() => {
  const path = location.pathname
  if (path === '/zh' || path.startsWith('/zh/') || path === '/ja' || path.startsWith('/ja/')) return
  let saved = null
  try { saved = localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)}) } catch {}
  const preferred = saved === 'en' || saved === 'zh' || saved === 'ja'
    ? saved
    : /^zh(?:-|$)/i.test(navigator.languages?.[0] || navigator.language || '') ? 'zh'
    : /^ja(?:-|$)/i.test(navigator.languages?.[0] || navigator.language || '') ? 'ja' : 'en'
  if (preferred !== 'en') location.replace('/' + preferred + (path === '/' ? '' : path) + location.search + location.hash)
})()`

export const Route = createRootRoute({
  head: ({ matches }) => {
    const missing = matches.some((match) => match.status === 'notFound' || match._notFound)
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { title: missing
          ? '404 · Awesome JEV'
          : 'Awesome JEV · free TypeSafe Jev / System One AI directory' },
        ...(missing
          ? [{ name: 'robots', content: 'noindex, follow' }]
          : []),
        { name: 'description', content: SITE_DESCRIPTION },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Awesome JEV' },
        ...shareImageMeta({ path: import.meta.env.VITE_SITE_OG_PATH || '/api/og/site', alt: import.meta.env.VITE_SITE_OG_ALT || 'Awesome JEV · TypeSafe Jev / System One GitHub projects · awesomejev.cc' }),
      ],
      links: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    }
  },
  notFoundComponent: () => <NotFoundPage />,
  shellComponent: RootDocument,
  component: RootComponent,
})

function RootComponent() {
  return <I18nProvider><Outlet /></I18nProvider>
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return (
    <html lang={LANGUAGE_TAG[localeFromPath(pathname)]} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOTSTRAP }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <HeadContent />
        {!import.meta.env.DEV && <script defer src="https://umami.sofxcking.cool/script.js" data-website-id="2c5691f6-1473-43cf-8dce-5311d9e9c085" />}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
