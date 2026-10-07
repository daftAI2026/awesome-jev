/**
 * [INPUT]: 依赖 locale-routes 的规范地址/语言 alternates 与 share-image 的图片元数据
 * [OUTPUT]: 对外提供 localizedHead 元数据构造器与逐页规范地址
 * [POS]: lib 的有效页面 SEO 与分页身份适配器，缺失页面不生成规范地址
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { localeAlternates, localizedPath, type Locale } from './locale-routes.ts'
import { shareImageMeta, SITE_ORIGIN, type ShareImage } from './share-image.ts'

interface LocalizedHeadOptions {
  path: string
  locale: Locale
  title: string
  description: string
  robots?: string
  type?: 'article' | 'website'
  page?: number
  image?: ShareImage
}

export function localizedHead({ path, locale, title, description, robots, type = 'website', image, page = 1 }: LocalizedHeadOptions) {
  const suffix = page > 1 ? `?page=${page}` : ''
  const url = `${SITE_ORIGIN}${localizedPath(path, locale)}${suffix}`
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
      ...(image ? shareImageMeta(image) : []),
    ],
    links: [{ rel: 'canonical', href: url }, ...localeAlternates(path).map((link) => ({ ...link, href: link.href + suffix }))],
  }
}
