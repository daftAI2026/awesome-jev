/**
 * [INPUT]: 依赖本站分类、公开标签计数、语言与 Phosphor 图标
 * [OUTPUT]: 提供 DirectoryBrowseFooter 分类和热门标签内链
 * [POS]: components 的页脚浏览导航；目录与详情共用，不改 Agents 品牌区
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Link } from '@tanstack/react-router'
import { Hash, SquaresFour, Tag } from '@phosphor-icons/react'
import { useI18n } from '@/i18n'
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/categories'
import { localizedPath } from '@/lib/locale-routes'
import type { ProjectTag } from '@/lib/project-tags'

const linkClass = 'rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:translate-y-px'

export function DirectoryBrowseFooter({ tags }: { tags: readonly ProjectTag[] }) {
  const { locale, t } = useI18n()
  return <nav data-browse-footer aria-label={t('browseDirectory')} className="mt-10 grid gap-7 border-t border-border pt-7">
    <section>
      <h2 className="flex items-center gap-2 text-sm font-medium"><SquaresFour className="size-4" aria-hidden />{t('categoryLabel')}</h2>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
        {CATEGORIES.map((category) => <Link key={category} to={localizedPath(`/category/${category}`, locale)} className={linkClass}>{t(CATEGORY_LABEL[category])}</Link>)}
      </div>
    </section>
    <section>
      <h2 className="flex items-center gap-2 text-sm font-medium"><Tag className="size-4" aria-hidden />{t('popularTags')}</h2>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
        {tags.slice(0, 12).map(({ tag, path }) => <Link key={tag} to={localizedPath(path, locale)} className={`${linkClass} inline-flex max-w-full items-center gap-1`}><Hash className="size-3 shrink-0" aria-hidden /><span className="break-all">{tag}</span></Link>)}
        <Link to={localizedPath('/tags', locale)} className={linkClass}>{t('allTags')}</Link>
      </div>
    </section>
  </nav>
}
