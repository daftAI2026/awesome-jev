export type Locale = 'en' | 'zh'

export const LOCALE_STORAGE_KEY = 'awesome-jev-locale'

export function localeFromPath(pathname: string): Locale {
  return pathname === '/zh' || pathname.startsWith('/zh/') ? 'zh' : 'en'
}

export function stripLocalePrefix(pathname: string): string {
  if (pathname === '/zh' || pathname === '/zh/') return '/'
  return pathname.startsWith('/zh/') ? pathname.slice(3) : pathname
}

export function localizedPath(pathname: string, locale: Locale): string {
  if (!pathname.startsWith('/')) throw new Error(`Expected an absolute site path: ${pathname}`)
  const base = stripLocalePrefix(pathname)
  return locale === 'zh' ? `/zh${base === '/' ? '' : base}` : base
}

export function localeAlternates(pathname: string, origin = 'https://awesomejev.cc') {
  const base = stripLocalePrefix(pathname)
  return [
    { rel: 'alternate', hrefLang: 'en', href: `${origin}${localizedPath(base, 'en')}` },
    { rel: 'alternate', hrefLang: 'zh-CN', href: `${origin}${localizedPath(base, 'zh')}` },
  ]
}
