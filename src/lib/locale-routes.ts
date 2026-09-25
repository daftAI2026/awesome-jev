export const LOCALES = ['en', 'zh', 'ja'] as const
export type Locale = (typeof LOCALES)[number]
const PREFIXED_LOCALES = LOCALES.filter((locale) => locale !== 'en')
export const LANGUAGE_TAG: Record<Locale, string> = { en: 'en', zh: 'zh-CN', ja: 'ja-JP' }
export const INTL_LOCALE: Record<Locale, string> = { en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' }

export function localeFromParam(value: string | undefined): Locale {
  return PREFIXED_LOCALES.find((locale) => locale === value) ?? 'en'
}

export function isLocalizedRouteParam(value: string | undefined): boolean {
  return value === undefined || PREFIXED_LOCALES.some((locale) => locale === value)
}

export const LOCALE_STORAGE_KEY = 'awesome-jev-locale'

export function localeFromPath(pathname: string): Locale {
  for (const locale of PREFIXED_LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) return locale
  }
  return 'en'
}

export function stripLocalePrefix(pathname: string): string {
  for (const locale of PREFIXED_LOCALES) {
    if (pathname === `/${locale}` || pathname === `/${locale}/`) return '/'
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(3)
  }
  return pathname
}

export function localizedPath(pathname: string, locale: Locale): string {
  if (!pathname.startsWith('/')) throw new Error(`Expected an absolute site path: ${pathname}`)
  const base = stripLocalePrefix(pathname)
  return locale === 'en' ? base : `/${locale}${base === '/' ? '' : base}`
}

export function localeAlternates(pathname: string, origin = 'https://awesomejev.cc') {
  const base = stripLocalePrefix(pathname)
  return LOCALES.map((locale) => ({
    rel: 'alternate', hrefLang: LANGUAGE_TAG[locale], href: `${origin}${localizedPath(base, locale)}`,
  }))
}
