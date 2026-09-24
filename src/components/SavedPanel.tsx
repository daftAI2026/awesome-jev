import { useEffect, useMemo, type MouseEvent } from 'react'
import { CardMasonry } from '@/components/CardMasonry'
import { NewsPanel } from '@/components/NewsPanel'
import { Button } from '@/components/ui/button'
import { CATEGORIES, CATEGORY_LABEL, NEWS_CATEGORIES, NEWS_CATEGORY_LABEL, type Category } from '@/lib/categories'
import { searchItems } from '@/lib/search'
import type { NewsItem } from '@/lib/news'
import type { SavedEntry, SavedKind, SavedSection } from '@/lib/saved'
import type { DirectoryItem } from '@/lib/types'
import { useI18n } from '@/i18n'

type Project = DirectoryItem & { category?: Category }
function CategoryFilters<T extends string>({ options, selected, onSelect }: {
  options: { id: T; label: string }[]
  selected: T | 'all'
  onSelect: (id: T | 'all') => void
}) {
  const { t } = useI18n()
  if (options.length < 2) return null
  return (
    <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label={t('categoryLabel')}>
      <Button size="sm" variant={selected === 'all' ? 'secondary' : 'ghost'} aria-pressed={selected === 'all'}
        onClick={() => onSelect('all')}>{t('savedAllCategories')}</Button>
      {options.map(({ id, label }) => <Button key={id} size="sm"
        variant={selected === id ? 'secondary' : 'ghost'} aria-pressed={selected === id}
        onClick={() => onSelect(id)}>{label}</Button>)}
    </div>
  )
}

function UnavailableSaved({ entries, kind, onRemove }: {
  entries: SavedEntry[]
  kind: SavedKind
  onRemove: (kind: SavedKind, id: string) => void
}) {
  const { t } = useI18n()
  if (entries.length === 0) return null
  return (
    <div className="mt-6 space-y-2">
      <p className="text-sm text-muted-foreground">{t('savedUnavailable')}</p>
      {entries.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">{entry.id}</span>
        <Button variant="outline" size="sm" onClick={() => onRemove(kind, entry.id)}>{t('removeSaved')}</Button>
      </div>)}
    </div>
  )
}

export function SavedPanel({ entries, projects, news, newsLoadFailed, query, ranks, onProjectPreview,
  onToggleProject, onToggleNews, onRemoveMissing, onNewsSelect, newsPreviewId, onNewsPreview, onNewsPreviewClose,
  section, projectCategory, newsCategory, onSectionChange, onProjectCategoryChange, onNewsCategoryChange }: {
  entries: SavedEntry[]
  projects: Project[]
  news: NewsItem[] | null
  newsLoadFailed: boolean
  query: string
  ranks: Map<string, number>
  onProjectPreview: (item: DirectoryItem, event: MouseEvent<HTMLAnchorElement>) => void
  onToggleProject: (item: DirectoryItem) => void
  onToggleNews: (item: NewsItem) => void
  onRemoveMissing: (kind: SavedKind, id: string) => void
  onNewsSelect: () => void
  newsPreviewId?: string | null
  onNewsPreview: (item: NewsItem) => void
  onNewsPreviewClose: () => void
  section: SavedSection
  projectCategory: Category | 'all'
  newsCategory: string
  onSectionChange: (section: SavedSection) => void
  onProjectCategoryChange: (category: Category | 'all') => void
  onNewsCategoryChange: (category: string) => void
}) {
  const { t } = useI18n()
  useEffect(() => {
    if (section === 'news' && entries.some((entry) => entry.kind === 'news')) onNewsSelect()
  }, [section, entries, onNewsSelect])
  const projectById = useMemo(() => new Map(projects.map((item) => [item.id, item])), [projects])
  const newsById = useMemo(() => new Map((news ?? []).map((item) => [item.id, item])), [news])
  const savedProjects = entries.filter((entry) => entry.kind === 'github')
    .flatMap((entry) => { const item = projectById.get(entry.id); return item ? [item] : [] })
  const savedNews = entries.filter((entry) => entry.kind === 'news')
    .flatMap((entry) => { const item = newsById.get(entry.id); return item ? [item] : [] })
  const missingProjects = entries.filter((entry) => entry.kind === 'github' && !projectById.has(entry.id))
  const missingNews = news === null ? [] : entries.filter((entry) => entry.kind === 'news' && !newsById.has(entry.id))
  const projectIds = new Set(savedProjects.map((item) => item.id))
  const newsIds = new Set(savedNews.map((item) => item.id))
  const projectMatches = searchItems(savedProjects, query, 'github', []) as Project[]
  const availableProjectCategories = CATEGORIES.filter((category) =>
    savedProjects.some((item) => (item.category ?? 'other') === category))
  const availableNewsCategories = NEWS_CATEGORIES.filter((category) =>
    savedNews.some((item) => item.category === category))
  const activeProjectCategory = projectCategory === 'all' || availableProjectCategories.includes(projectCategory) ? projectCategory : 'all'
  const activeNewsCategory = newsCategory === 'all' || availableNewsCategories.some((category) => category === newsCategory) ? newsCategory : 'all'
  const filteredProjects = activeProjectCategory === 'all' ? projectMatches
    : projectMatches.filter((item) => (item.category ?? 'other') === activeProjectCategory)
  const filteredNews = activeNewsCategory === 'all' ? savedNews
    : savedNews.filter((item) => item.category === activeNewsCategory)

  return (
    <section aria-label={t('categorySaved')}>
      <div className="mb-6 space-y-2">
        <h2 className="text-lg font-medium">{t('savedTitle')}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t('savedNote')}</p>
      </div>
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label={t('categorySaved')}>
        <Button variant={section === 'github' ? 'secondary' : 'outline'} aria-pressed={section === 'github'}
          onClick={() => onSectionChange('github')}>{t('savedProjects')} <span className="ml-1 tabular-nums text-muted-foreground">{savedProjects.length}</span></Button>
        <Button variant={section === 'news' ? 'secondary' : 'outline'} aria-pressed={section === 'news'}
          onClick={() => onSectionChange('news')}>{t('savedNews')} <span className="ml-1 tabular-nums text-muted-foreground">{entries.filter((entry) => entry.kind === 'news').length}</span></Button>
      </div>
      {section === 'github' ? (
        <>
          <CategoryFilters options={availableProjectCategories.map((category) => ({ id: category, label: t(CATEGORY_LABEL[category]) }))}
            selected={activeProjectCategory} onSelect={onProjectCategoryChange} />
          {filteredProjects.length > 0
            ? <CardMasonry items={filteredProjects} ranks={ranks} onPreview={onProjectPreview}
                savedIds={projectIds} onToggleSaved={onToggleProject} />
            : <p className="py-10 text-sm text-muted-foreground">{t(query ? 'emptySearch' : 'savedEmpty')}</p>}
          <UnavailableSaved entries={missingProjects} kind="github" onRemove={onRemoveMissing} />
        </>
      ) : newsLoadFailed ? <p className="py-10 text-sm text-muted-foreground">{t('newsLoadFailed')}</p>
        : news === null && entries.some((entry) => entry.kind === 'news')
          ? <p className="py-10 text-sm text-muted-foreground">{t('newsLoading')}</p>
          : <>
              <CategoryFilters options={availableNewsCategories.map((category) => ({ id: category, label: t(NEWS_CATEGORY_LABEL[category]) }))}
                selected={activeNewsCategory} onSelect={onNewsCategoryChange} />
              {filteredNews.length > 0
                ? <NewsPanel items={filteredNews} query={query} savedIds={newsIds} onToggleSaved={onToggleNews}
                    previewId={newsPreviewId} onPreview={onNewsPreview} onPreviewClose={onNewsPreviewClose} savedView />
                : <p className="py-10 text-sm text-muted-foreground">{t(query ? 'emptySearch' : 'savedEmpty')}</p>}
              <UnavailableSaved entries={missingNews} kind="news" onRemove={onRemoveMissing} />
            </>}
    </section>
  )
}
