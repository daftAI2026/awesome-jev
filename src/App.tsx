import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useMatches, useNavigate, useRouterState } from '@tanstack/react-router'
import { GithubLogo, Info, List, MagnifyingGlass, SquaresFour, X } from '@phosphor-icons/react'
import githubData from '../data/github.json'
import { AsciiWordmark } from '@/components/AsciiWordmark'
import { CardMasonry } from '@/components/CardMasonry'
import { DecryptedBrand } from '@/components/DecryptedBrand'
import { GithubList } from '@/components/GithubList'
import { GithubProjectDialog } from '@/components/GithubProjectDialog'
import { LanguageMenu } from '@/components/LanguageMenu'
import { NewsPanel } from '@/components/NewsPanel'
import { SavedPanel } from '@/components/SavedPanel'
import { ThemeMenu } from '@/components/ThemeMenu'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useI18n } from '@/i18n'
import { formatCatalogUpdatedAt } from '@/lib/catalog-updated-at'
import { CATEGORIES, CATEGORY_LABEL, NEWS_CATEGORIES, type Category } from '@/lib/categories'
import { useSaved } from '@/hooks/useSaved'
import { savedRouteSearch, type SavedRouteSearch, type SavedSection } from '@/lib/saved'
import { searchItems } from '@/lib/search'
import { githubStarRanks, sortGithubItems } from '@/lib/sort'
import { newsPath, type NewsItem } from '@/lib/news'
import type { DirectoryItem, GithubSort, GithubView } from '@/lib/types'
import { findGitHubProject, projectPathFromUrl } from '@/lib/project-routes'
import { localizedPath, stripLocalePrefix } from '@/lib/locale-routes'

type DirectoryFilter = 'all' | 'top100' | 'news' | 'saved' | Category
type GithubItem = DirectoryItem & { category?: Category }
const items = githubData as GithubItem[]
const catalogUpdatedAt = import.meta.env.VITE_CATALOG_UPDATED_AT
const catalogUpdatedLabel = formatCatalogUpdatedAt(catalogUpdatedAt)
const githubRanks = githubStarRanks(items)
const categoryCounts = Object.fromEntries(CATEGORIES.map((category) => [category, items.filter((item) => item.category === category).length])) as Record<Category, number>
const FILTER_LABEL = {
  all: 'categoryAll', top100: 'categoryTop100', news: 'categoryNews', saved: 'categorySaved',
  ...CATEGORY_LABEL,
} as const
const GITHUB_SORT_KEY = 'awesome-jev-github-sort'
const GITHUB_VIEW_KEY = 'awesome-jev-github-view'
const TOP_PROJECT_LIMIT = 100

function filterFromPath(pathname: string): DirectoryFilter | null {
  pathname = stripLocalePrefix(pathname)
  if (pathname === '/') return 'all'
  if (pathname === '/top100') return 'top100'
  if (pathname === '/news') return 'news'
  if (pathname === '/saved') return 'saved'
  const category = pathname.match(/^\/category\/([^/]+)\/?$/)?.[1]
  return CATEGORIES.find((entry) => entry === category) ?? null
}

function filterPath(filter: DirectoryFilter): string {
  if (filter === 'all') return '/'
  if (filter === 'top100' || filter === 'news' || filter === 'saved') return `/${filter}`
  return `/category/${filter}`
}

function readStoredSort(): GithubSort {
  try {
    const value = localStorage.getItem(GITHUB_SORT_KEY)
    if (value === 'stars' || value === 'date' || value === 'name') return value
  } catch { /* ignore */ }
  return 'stars'
}

function readStoredView(): GithubView {
  try {
    const value = localStorage.getItem(GITHUB_VIEW_KEY)
    if (value === 'cards' || value === 'list') return value
  } catch { /* ignore */ }
  return 'cards'
}

export default function App() {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const basePath = stripLocalePrefix(pathname)
  const routeSearch = useRouterState({ select: (state) => state.location.search })
  const newsPreviewId = useRouterState({ select: (state) => {
    const preview = state.location.search.preview
    return typeof preview === 'string' ? preview : null
  } })
  const newsPreviewIsMasked = useRouterState({ select: (state) => Boolean(state.location.maskedLocation) })
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<GithubSort>('stars')
  const [view, setView] = useState<GithubView>('cards')
  const [preferencesReady, setPreferencesReady] = useState(false)
  const [filter, setFilter] = useState<DirectoryFilter>(() => filterFromPath(pathname) ?? 'all')
  const [lastSavedSearch, setLastSavedSearch] = useState<SavedRouteSearch>(() => basePath === '/saved' ? savedRouteSearch(routeSearch) : {})
  const savedSearch = useMemo(() => basePath === '/saved' ? savedRouteSearch(routeSearch) : lastSavedSearch,
    [basePath, routeSearch, lastSavedSearch])
  const routeNewsItems = useMatches({ select: (matches) =>
    matches.find((match) => match.routeId === '/_directory/{-$locale}/news')?.loaderData as NewsItem[] | undefined })
  const [newsItems, setNewsItems] = useState<NewsItem[] | null>(null)
  const [newsLoadFailed, setNewsLoadFailed] = useState(false)
  const [savedNewsRequested, setSavedNewsRequested] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<DirectoryItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const { entries: savedEntries, toggle: toggleSaved, saveError } = useSaved()
  const searchRef = useRef<HTMLInputElement>(null)
  const detailTriggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setSort(readStoredSort())
    setView(readStoredView())
    setPreferencesReady(true)
  }, [])
  useEffect(() => { if (preferencesReady) try { localStorage.setItem(GITHUB_SORT_KEY, sort) } catch { /* ignore */ } }, [sort, preferencesReady])
  useEffect(() => { if (preferencesReady) try { localStorage.setItem(GITHUB_VIEW_KEY, view) } catch { /* ignore */ } }, [view, preferencesReady])
  useEffect(() => {
    const preview = basePath.match(/^\/preview\/([^/]+)\/([^/]+)\/?$/)
    if (preview) {
      const project = findGitHubProject(items, preview[1], preview[2])
      setDetailItem(project ?? null)
      setDetailOpen(Boolean(project))
      return
    }
    const next = filterFromPath(pathname)
    if (next) {
      setFilter(next)
      setDetailOpen(false)
    }
  }, [basePath])
  useEffect(() => {
    if (basePath === '/saved') setLastSavedSearch(savedRouteSearch(routeSearch))
  }, [basePath, routeSearch])
  useEffect(() => {
    if (filter !== 'saved' || !savedNewsRequested || !savedEntries.some((entry) => entry.kind === 'news')) return
    if (newsItems !== null || newsLoadFailed) return
    let active = true
    import('../data/news.json').then(({ default: rows }) => {
      if (active) setNewsItems(rows as NewsItem[])
    }).catch(() => {
      if (active) setNewsLoadFailed(true)
    })
    return () => { active = false }
  }, [filter, newsItems, newsLoadFailed, savedEntries, savedNewsRequested])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '') || target?.isContentEditable) return
      event.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const selectFilter = useCallback((next: DirectoryFilter) => {
    const mode = (value: DirectoryFilter) => value === 'news' || value === 'saved' ? value : 'github'
    if (mode(filter) !== mode(next)) setQuery('')
    setCategoryOpen(false)
    void navigate({ to: localizedPath(filterPath(next), locale) })
  }, [filter, locale, navigate])
  const returnHome = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    setQuery('')
    selectFilter('all')
    window.scrollTo(0, 0)
  }, [selectFilter])
  const openProjectPreview = useCallback((item: DirectoryItem, event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    const path = projectPathFromUrl(item.url)
    if (!path) return
    const [, , owner, repo] = path.split('/')
    detailTriggerRef.current = event.currentTarget
    if (filter === 'saved') setLastSavedSearch(savedSearch)
    setDetailItem(item)
    setDetailOpen(true)
    void navigate({
      to: '/{-$locale}/preview/$owner/$repo',
      params: { locale: locale === 'zh' ? 'zh' : undefined, owner, repo },
      mask: { to: '/{-$locale}/projects/$owner/$repo', params: { locale: locale === 'zh' ? 'zh' : undefined, owner, repo } },
      resetScroll: false,
    })
  }, [filter, locale, navigate, savedSearch])
  const onDetailOpenChange = useCallback((open: boolean) => {
    if (!open && basePath.startsWith('/preview/')) {
      window.history.back()
      setDetailOpen(false)
      return
    }
    setDetailOpen(open)
  }, [basePath])
  const openNewsPreview = useCallback((item: NewsItem) => {
    const path = newsPath(item.id)
    if (!path) return
    const publicPath = localizedPath(path, locale)
    if (filter === 'saved') {
      const background = { ...savedSearch, section: 'news' as const, preview: undefined }
      const to = localizedPath('/saved', locale)
      void navigate({ to, search: { ...background, preview: item.id }, mask: { to: publicPath }, resetScroll: false })
    } else {
      const to = localizedPath('/news', locale)
      void navigate({ to, search: { preview: item.id }, mask: { to: publicPath }, resetScroll: false })
    }
  }, [filter, locale, navigate, savedSearch])
  const closeNewsPreview = useCallback(() => {
    if (!newsPreviewId) return
    if (newsPreviewIsMasked) {
      window.history.back()
    } else {
      if (filter === 'saved') void navigate({ to: localizedPath('/saved', locale), search: { ...savedSearch, preview: undefined }, replace: true })
      else void navigate({ to: localizedPath('/news', locale), search: {}, replace: true })
    }
  }, [filter, locale, navigate, newsPreviewId, newsPreviewIsMasked, savedSearch])
  const selectSavedSection = useCallback((section: SavedSection) => {
    void navigate({ to: localizedPath('/saved', locale), search: { ...savedSearch, section } })
  }, [locale, navigate, savedSearch])
  const selectSavedProjectCategory = useCallback((category: Category | 'all') => {
    void navigate({ to: localizedPath('/saved', locale), search: { ...savedSearch, projectCategory: category === 'all' ? undefined : category } })
  }, [locale, navigate, savedSearch])
  const selectSavedNewsCategory = useCallback((category: string) => {
    const newsCategory = NEWS_CATEGORIES.find((entry) => entry === category)
    void navigate({ to: localizedPath('/saved', locale), search: { ...savedSearch, newsCategory } })
  }, [locale, navigate, savedSearch])
  const savedProjectIds = useMemo(() => new Set(savedEntries.filter((entry) => entry.kind === 'github').map((entry) => entry.id)), [savedEntries])
  const savedNewsIds = useMemo(() => new Set(savedEntries.filter((entry) => entry.kind === 'news').map((entry) => entry.id)), [savedEntries])
  const savedSection = savedSearch.section ?? (newsPreviewId || (!savedEntries.some((entry) => entry.kind === 'github') && savedEntries.some((entry) => entry.kind === 'news')) ? 'news' : 'github')
  const toggleProjectSavedRaw = useCallback((item: DirectoryItem) => toggleSaved('github', item.id), [toggleSaved])
  const toggleProjectSaved = useCallback((item: DirectoryItem) => {
    if (filter === 'saved' && savedProjectIds.has(item.id)) {
      if (detailOpen) {
        detailTriggerRef.current = document.getElementById('main')
        onDetailOpenChange(false)
      } else {
        requestAnimationFrame(() => document.getElementById('main')?.focus())
      }
    }
    toggleProjectSavedRaw(item)
  }, [filter, savedProjectIds, detailOpen, toggleProjectSavedRaw, onDetailOpenChange])
  const toggleNewsSaved = useCallback((item: NewsItem) => toggleSaved('news', item.id), [toggleSaved])
  const requestSavedNews = useCallback(() => setSavedNewsRequested(true), [])
  const filterButton = (id: DirectoryFilter) => {
    const count = id === 'top100' ? undefined
      : id === 'all' ? items.length
      : id === 'news' ? (routeNewsItems ?? newsItems)?.length
      : id === 'saved' ? savedEntries.length
      : categoryCounts[id]
    return (
      <Button
        key={id}
        nativeButton={false}
        render={<a href={localizedPath(filterPath(id), locale)} />}
        variant={filter === id ? 'secondary' : 'ghost'}
        aria-current={filter === id ? 'page' : undefined}
        onClick={(event) => {
          if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
          event.preventDefault()
          selectFilter(id)
        }}
        className={`min-h-8 w-full rounded-lg px-3 py-1.5 font-normal whitespace-nowrap ${id === 'saved' ? 'justify-start gap-2' : 'justify-between gap-4'} ${filter === id ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        <span className={`min-w-0 text-left leading-snug ${id === 'saved' ? '' : 'flex-1'}`}>{t(FILTER_LABEL[id])}</span>
        {count != null && (id === 'saved'
          ? <Badge variant="outline" className="min-w-5 rounded-sm px-1.5 font-normal tabular-nums text-muted-foreground">{count}</Badge>
          : <span className="shrink-0 tabular-nums text-xs text-muted-foreground">{count}</span>)}
      </Button>
    )
  }
  const categoryNav = (
    <nav aria-label={t('categoryLabel')} className="flex w-max min-w-52 flex-col gap-2 xl:w-full xl:min-w-0">
      {filterButton('top100')}
      {filterButton('news')}
      {filterButton('saved')}
      <Separator className="my-1" />
      {filterButton('all')}
      {CATEGORIES.map(filterButton)}
    </nav>
  )
  const matched = useMemo(() => {
    if (filter === 'news' || filter === 'saved') return []
    const searched = searchItems(items, query, 'github', []) as GithubItem[]
    if (filter === 'all') return searched
    if (filter === 'top100') return searched.filter((item) => (githubRanks.get(item.id) ?? Infinity) <= TOP_PROJECT_LIMIT)
    return searched.filter((item) => (item.category ?? 'other') === filter)
  }, [query, filter])
  const sorted = useMemo(() => sortGithubItems(matched, sort), [matched, sort])
  const hasQuery = query.trim().length > 0
  const resultLabel = t(matched.length === 1 ? 'resultCount' : 'resultCountPlural', { count: matched.length })
  const detailCategory = detailItem ? items.find((item) => item.id === detailItem.id)?.category : undefined

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="skip-link sr-only">{t('skipToContent')}</a>
      <header className="sticky top-0 z-50 bg-background">
        <div className="flex h-14 w-full items-center justify-between gap-3 px-4">
          <h1 className="min-w-0 text-base font-medium tracking-tight text-foreground sm:text-lg">
            <DecryptedBrand onClick={returnHome} />
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="icon-sm" nativeButton={false}
              render={<a href="https://github.com/daftAI2026/awesome-jev" target="_blank" rel="noopener noreferrer" />}
              aria-label={t('openGithub')} className="size-9 text-muted-foreground">
              <GithubLogo className="size-4" weight="fill" aria-hidden />
            </Button>
            <ThemeMenu />
            <LanguageMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[72.5rem] px-4 py-8 sm:px-8 lg:py-10">
        <AsciiWordmark />
        <p className="mt-8 text-center text-xl leading-snug tracking-tight text-muted-foreground sm:text-2xl">
          {t('tagline').split('\n').map((line) => <span key={line} className="block">{line}</span>)}
        </p>
        {catalogUpdatedLabel && (
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>{t('dataUpdated')}</span>
            <time dateTime={catalogUpdatedAt} title={t('dataUpdatedTimezone')} className="font-mono tabular-nums">{catalogUpdatedLabel}</time>
          </p>
        )}
      </div>

      <div className="mx-auto grid w-full max-w-[72.5rem] flex-1 grid-cols-1 gap-8 px-4 pb-8 sm:px-6 lg:px-8 lg:pb-10 xl:grid-cols-[13.5rem_minmax(0,1fr)]">
        <aside className="hidden xl:block"><div className="sticky top-16 max-h-[calc(100dvh-5rem)] overflow-x-hidden overflow-y-auto">{categoryNav}</div></aside>
        <div className="min-w-0">
          <div className="mb-6">
            <div className="relative">
              <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 text-muted-foreground" weight="regular" aria-hidden />
              <label htmlFor="directory-search" className="sr-only">{t(filter === 'news' ? 'searchNewsPlaceholder' : filter === 'saved' ? 'searchSavedPlaceholder' : 'searchLabel')}</label>
              <Input ref={searchRef} id="directory-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
                placeholder={t(filter === 'news' ? 'searchNewsPlaceholder' : filter === 'saved' ? 'searchSavedPlaceholder' : 'searchPlaceholder')} autoComplete="off"
                className="h-12 rounded-none border-0 border-b border-border bg-transparent px-8 py-3 text-base shadow-none appearance-none focus-visible:border-foreground focus-visible:ring-0 md:text-sm dark:bg-transparent [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden" />
              <kbd className="pointer-events-none absolute inset-y-0 right-0 hidden items-center sm:flex" title={t('searchHint')}>
                <Badge variant="outline" className="rounded-lg font-mono font-normal text-muted-foreground">/</Badge>
              </kbd>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Sheet open={categoryOpen} onOpenChange={setCategoryOpen}>
                <SheetTrigger render={<Button variant="outline" size="sm" className="xl:hidden" aria-label={t('openCategories')} />}>
                  <List className="size-4" weight="fill" aria-hidden />
                  {t(FILTER_LABEL[filter])}
                </SheetTrigger>
                <SheetContent side="left" showCloseButton={false}
                  className="gap-0 p-0 shadow-none data-[side=left]:w-72 data-[side=left]:sm:max-w-72">
                  <SheetHeader className="h-14 flex-row items-center justify-between px-4 py-0">
                    <SheetTitle className="sr-only">{t('categoryLabel')}</SheetTitle>
                    <div className="min-w-0 text-base font-medium tracking-tight text-foreground sm:text-lg">
                      <DecryptedBrand onClick={returnHome} />
                    </div>
                    <SheetClose render={<Button variant="ghost" size="icon-sm" className="size-10" />}
                      aria-label={t('closeCategories')}>
                      <X className="size-4" aria-hidden />
                    </SheetClose>
                  </SheetHeader>
                  <div className="min-h-0 overflow-y-auto overscroll-contain px-4 pt-3 pb-4">{categoryNav}</div>
                </SheetContent>
              </Sheet>
              {filter !== 'news' && filter !== 'saved' && <ToggleGroup value={[sort]} onValueChange={(values) => {
                const next = values[0]
                if (next === 'stars' || next === 'date' || next === 'name') setSort(next)
              }} variant="outline" size="sm" aria-label={t('rankLabel')} className="rounded-lg">
                <ToggleGroupItem value="stars">{t('sortStars')}</ToggleGroupItem>
                <ToggleGroupItem value="date">{t('sortDate')}</ToggleGroupItem>
                <ToggleGroupItem value="name">{t('sortName')}</ToggleGroupItem>
              </ToggleGroup>}
              {filter !== 'news' && filter !== 'saved' && <ToggleGroup value={[view]} onValueChange={(values) => {
                const next = values[0]
                if (next === 'cards' || next === 'list') setView(next)
              }} variant="outline" size="sm" aria-label={t('viewLabel')} className="ml-auto rounded-lg">
                <ToggleGroupItem value="cards" aria-label={t('viewCards')}><SquaresFour className="size-3.5" weight="fill" /></ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label={t('viewList')}><List className="size-3.5" weight="fill" /></ToggleGroupItem>
              </ToggleGroup>}
            </div>
          </div>
          {hasQuery && filter !== 'news' && filter !== 'saved' && <p className="mb-6 text-sm text-muted-foreground tabular-nums">{resultLabel}</p>}
          {saveError && <p role="alert" className="mb-6 text-sm text-destructive">{t('savedStorageError')}</p>}
          <main id="main" tabIndex={-1}>
            {filter === 'news' ? (
              routeNewsItems === undefined ? <p className="py-10 text-sm text-muted-foreground">{t('newsLoading')}</p>
                  : <NewsPanel key={query} items={routeNewsItems} query={query} savedIds={savedNewsIds} onToggleSaved={toggleNewsSaved}
                      previewId={newsPreviewId} onPreview={openNewsPreview} onPreviewClose={closeNewsPreview} />
            ) : filter === 'saved' ? (
              <SavedPanel entries={savedEntries} projects={items} news={newsItems} newsLoadFailed={newsLoadFailed}
                query={query} ranks={githubRanks} onProjectPreview={openProjectPreview}
                onToggleProject={toggleProjectSaved} onToggleNews={toggleNewsSaved} onRemoveMissing={toggleSaved}
                onNewsSelect={requestSavedNews} newsPreviewId={newsPreviewId}
                onNewsPreview={openNewsPreview} onNewsPreviewClose={closeNewsPreview}
                section={savedSection} projectCategory={savedSearch.projectCategory ?? 'all'} newsCategory={savedSearch.newsCategory ?? 'all'}
                onSectionChange={selectSavedSection} onProjectCategoryChange={selectSavedProjectCategory}
                onNewsCategoryChange={selectSavedNewsCategory} />
            ) : sorted.length === 0 ? (
              <p className="py-10 text-sm text-muted-foreground">{t(hasQuery ? 'emptySearch' : 'emptySection')}</p>
            ) : view === 'list' ? (
              <GithubList items={sorted} ranks={githubRanks} onPreview={openProjectPreview}
                savedIds={savedProjectIds} onToggleSaved={toggleProjectSavedRaw} />
            ) : (
              <CardMasonry items={sorted} ranks={githubRanks} onPreview={openProjectPreview}
                savedIds={savedProjectIds} onToggleSaved={toggleProjectSavedRaw} />
            )}
          </main>
        </div>
      </div>
      <footer className="mx-auto w-full max-w-[72.5rem] px-4 pt-8 pb-20 sm:px-8">
        <Separator className="mb-8" />
        <Alert><Info weight="fill" aria-hidden /><AlertTitle>{t('footerTitle')}</AlertTitle><AlertDescription>{t('footerDescription')}</AlertDescription></Alert>
      </footer>
      <GithubProjectDialog
        item={detailItem}
        categoryLabel={detailCategory ? t(FILTER_LABEL[detailCategory]) : undefined}
        open={detailOpen}
        onOpenChange={onDetailOpenChange}
        triggerRef={detailTriggerRef}
        saved={detailItem ? savedProjectIds.has(detailItem.id) : false}
        onToggleSaved={detailItem ? () => toggleProjectSaved(detailItem) : undefined}
      />
    </div>
  )
}
