import type { ReactNode } from 'react'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from '@tanstack/react-router'
import { I18nProvider } from '@/i18n'
import { LOCALE_STORAGE_KEY, localeFromPath } from '@/lib/locale-routes'
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
  if (path === '/zh' || path.startsWith('/zh/')) return
  let saved = null
  try { saved = localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)}) } catch {}
  const preferred = saved === 'en' || saved === 'zh'
    ? saved
    : /^zh(?:-|$)/i.test(navigator.languages?.[0] || navigator.language || '') ? 'zh' : 'en'
  if (preferred === 'zh') location.replace('/zh' + (path === '/' ? '' : path) + location.search + location.hash)
})()`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { title: 'Awesome JEV · free TypeSafe Jev / System One AI directory' },
      { name: 'description', content: SITE_DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Awesome JEV' },
      { property: 'og:image', content: 'https://awesomejev.cc/og.png' },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'Awesome JEV · free TypeSafe Jev / System One AI directory' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: 'https://awesomejev.cc/og.png' },
    ],
    links: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  }),
  notFoundComponent: () => <main className="mx-auto max-w-3xl px-6 py-16"><h1 className="text-2xl font-semibold">Page not found</h1></main>,
  shellComponent: RootDocument,
  component: RootComponent,
})

function RootComponent() {
  return <I18nProvider><Outlet /></I18nProvider>
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return (
    <html lang={localeFromPath(pathname) === 'zh' ? 'zh-CN' : 'en'}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOTSTRAP }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <HeadContent />
        <script defer src="https://umami.sofxcking.cool/script.js" data-website-id="2c5691f6-1473-43cf-8dce-5311d9e9c085" />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
