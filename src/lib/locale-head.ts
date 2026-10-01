/**
 * [INPUT]: 依赖 locale-routes 的规范地址和语言 alternates
 * [OUTPUT]: 对外提供 localizedHead 元数据构造器
 * [POS]: lib 的有效页面 SEO 适配器，缺失页面不生成规范地址
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
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
      { property: 'og:locale', content: { en: 'en_US', zh: 'zh_CN', ja: 'ja_JP' }[locale] },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    links: [{ rel: 'canonical', href: url }, ...localeAlternates(path)],
  }
}
