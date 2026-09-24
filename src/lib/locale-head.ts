import { localeAlternates, localizedPath, type Locale } from './locale-routes.ts'

interface LocalizedHeadOptions {
  path: string
  locale: Locale
  title: string
  description: string
  robots?: string
  type?: 'article' | 'website'
}

export function localizedHead({ path, locale, title, description, robots, type = 'website' }: LocalizedHeadOptions) {
  const url = `https://awesomejev.cc${localizedPath(path, locale)}`
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      ...(robots ? [{ name: 'robots', content: robots }] : []),
      { property: 'og:type', content: type },
      { property: 'og:locale', content: locale === 'zh' ? 'zh_CN' : 'en_US' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    links: [{ rel: 'canonical', href: url }, ...localeAlternates(path)],
  }
}
