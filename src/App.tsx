import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { GithubLogo, Info, List, MagnifyingGlass, SquaresFour } from '@phosphor-icons/react'
import githubData from '../data/github.json'
import { AsciiWordmark } from '@/components/AsciiWordmark'
import { CardMasonry } from '@/components/CardMasonry'
import { GithubList } from '@/components/GithubList'
import { GithubProjectDialog } from '@/components/GithubProjectDialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useI18n } from '@/i18n'
import { formatCatalogUpdatedAt } from '@/lib/catalog-updated-at'
import { searchItems } from '@/lib/search'
import { githubStarRanks, sortGithubItems } from '@/lib/sort'
import type { DirectoryItem, GithubSort, GithubView } from '@/lib/types'

const CATEGORIES = ['agents', 'browser', 'sdk', 'developer', 'research', 'resources', 'applications', 'other'] as const
type Category = (typeof CATEGORIES)[number]
type CategoryFilter = 'all' | Category
type GithubItem = DirectoryItem & { category?: Category }
const items = githubData as GithubItem[]
const catalogUpdatedAt = import.meta.env.VITE_CATALOG_UPDATED_AT
const catalogUpdatedLabel = formatCatalogUpdatedAt(catalogUpdatedAt)
const githubRanks = githubStarRanks(items)
const categoryCounts = Object.fromEntries(CATEGORIES.map((category) => [category, items.filter((item) => item.category === category).length])) as Record<Category, number>
const CATEGORY_LABEL = {
  all: 'categoryAll', agents: 'categoryAgents', browser: 'categoryBrowser', sdk: 'categorySdk',
  developer: 'categoryDeveloper', research: 'categoryResearch', resources: 'categoryResources',
  applications: 'categoryApplications', other: 'categoryOther',
} as const
const GITHUB_SORT_KEY = 'awesome-jev-github-sort'
const GITHUB_VIEW_KEY = 'awesome-jev-github-view'
const CATEGORY_KEY = 'awesome-jev-category'

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

function readStoredCategory(): CategoryFilter {
  try {
    const value = localStorage.getItem(CATEGORY_KEY)
    if (value === 'all' || CATEGORIES.some((category) => category === value)) return value as CategoryFilter
  } catch { /* ignore */ }
  return 'all'
}

export default function App() {
  const { locale, setLocale, t } = useI18n()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<GithubSort>(readStoredSort)
  const [view, setView] = useState<GithubView>(readStoredView)
  const [category, setCategory] = useState<CategoryFilter>(readStoredCategory)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<DirectoryItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const detailTriggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => { try { localStorage.setItem(GITHUB_SORT_KEY, sort) } catch { /* ignore */ } }, [sort])
  useEffect(() => { try { localStorage.setItem(GITHUB_VIEW_KEY, view) } catch { /* ignore */ } }, [view])
  useEffect(() => { try { localStorage.setItem(CATEGORY_KEY, category) } catch { /* ignore */ } }, [category])
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

  const selectCategory = useCallback((next: CategoryFilter) => {
    setCategory(next)
    setCategoryOpen(false)
  }, [])
  const openProjectPreview = useCallback((item: DirectoryItem, event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    detailTriggerRef.current = event.currentTarget
    setDetailItem(item)
    setDetailOpen(true)
  }, [])
  const categoryNav = (
    <nav aria-label={t('categoryLabel')} className="flex flex-col gap-2">
      {(['all', ...CATEGORIES] as CategoryFilter[]).map((id) => (
        <Button
          key={id}
          type="button"
          variant={category === id ? 'secondary' : 'ghost'}
          aria-pressed={category === id}
          onClick={() => selectCategory(id)}
          className={`h-8 w-full justify-between gap-4 rounded-lg px-3 font-normal ${category === id ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          <span className="truncate">{t(CATEGORY_LABEL[id])}</span>
          <span className="tabular-nums text-xs text-muted-foreground">{id === 'all' ? items.length : categoryCounts[id]}</span>
        </Button>
      ))}
    </nav>
  )
  const matched = useMemo(() => {
    const searched = searchItems(items, query, 'github', []) as GithubItem[]
    return category === 'all' ? searched : searched.filter((item) => (item.category ?? 'other') === category)
  }, [query, category])
  const sorted = useMemo(() => sortGithubItems(matched, sort), [matched, sort])
  const hasQuery = query.trim().length > 0
  const resultLabel = t(matched.length === 1 ? 'resultCount' : 'resultCountPlural', { count: matched.length })
  const detailCategory = detailItem ? items.find((item) => item.id === detailItem.id)?.category : undefined

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="skip-link sr-only">{t('skipToContent')}</a>
      <header className="sticky top-0 z-50 bg-background">
        <div className="flex h-14 w-full items-center justify-between gap-3 px-4">
          <h1 className="truncate text-lg font-medium tracking-tight text-foreground">Awesome JEV</h1>
          <div className="flex shrink-0 items-center gap-3">
            <Button variant="ghost" size="icon-sm" nativeButton={false}
              render={<a href="https://github.com/daftAI2026/awesome-jev" target="_blank" rel="noopener noreferrer" />}
              aria-label={t('openGithub')} className="text-muted-foreground">
              <GithubLogo className="size-4" weight="fill" aria-hidden />
            </Button>
            <div className="flex shrink-0 items-center gap-2" role="group" aria-label={t('languageToggle')}>
              <Button variant={locale === 'zh' ? 'secondary' : 'outline'} size="sm" onClick={() => setLocale('zh')} aria-pressed={locale === 'zh'}>中文</Button>
              <Button variant={locale === 'en' ? 'secondary' : 'outline'} size="sm" onClick={() => setLocale('en')} aria-pressed={locale === 'en'}>EN</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
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

      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-8 px-4 pb-8 sm:px-6 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10 lg:px-8 lg:pb-10">
        <aside className="hidden lg:block"><div className="sticky top-16">{categoryNav}</div></aside>
        <div className="min-w-0">
          <div className="mb-6">
            <div className="relative">
              <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 text-muted-foreground" weight="regular" aria-hidden />
              <label htmlFor="directory-search" className="sr-only">{t('searchLabel')}</label>
              <Input ref={searchRef} id="directory-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
                placeholder={t('searchPlaceholder')} autoComplete="off"
                className="h-12 rounded-none border-0 border-b border-border bg-transparent px-8 py-3 text-base shadow-none appearance-none focus-visible:border-foreground focus-visible:ring-0 md:text-sm dark:bg-transparent [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden" />
              <kbd className="pointer-events-none absolute inset-y-0 right-0 hidden items-center sm:flex" title={t('searchHint')}>
                <Badge variant="outline" className="rounded-lg font-mono font-normal text-muted-foreground">/</Badge>
              </kbd>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Sheet open={categoryOpen} onOpenChange={setCategoryOpen}>
                <SheetTrigger render={<Button variant="outline" size="sm" className="lg:hidden" aria-label={t('openCategories')} />}>
                  <List className="size-4" weight="fill" aria-hidden />
                  {t(CATEGORY_LABEL[category])}
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="sr-only"><SheetTitle>{t('categoryLabel')}</SheetTitle></SheetHeader>
                  <div className="px-4 pb-4">{categoryNav}</div>
                </SheetContent>
              </Sheet>
              <ToggleGroup value={[sort]} onValueChange={(values) => {
                const next = values[0]
                if (next === 'stars' || next === 'date' || next === 'name') setSort(next)
              }} variant="outline" size="sm" aria-label={t('rankLabel')} className="rounded-lg">
                <ToggleGroupItem value="stars">{t('sortStars')}<span className="ml-1 tabular-nums text-muted-foreground">({items.length})</span></ToggleGroupItem>
                <ToggleGroupItem value="date">{t('sortDate')}</ToggleGroupItem>
                <ToggleGroupItem value="name">{t('sortName')}</ToggleGroupItem>
              </ToggleGroup>
              <ToggleGroup value={[view]} onValueChange={(values) => {
                const next = values[0]
                if (next === 'cards' || next === 'list') setView(next)
              }} variant="outline" size="sm" aria-label={t('viewLabel')} className="ml-auto rounded-lg">
                <ToggleGroupItem value="cards" aria-label={t('viewCards')}><SquaresFour className="size-3.5" weight="fill" /></ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label={t('viewList')}><List className="size-3.5" weight="fill" /></ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          {hasQuery && <p className="mb-6 text-sm text-muted-foreground tabular-nums">{resultLabel}</p>}
          <main id="main" tabIndex={-1}>
            {sorted.length === 0 ? (
              <p className="py-10 text-sm text-muted-foreground">{t(hasQuery ? 'emptySearch' : 'emptySection')}</p>
            ) : view === 'list' ? (
              <GithubList items={sorted} ranks={githubRanks} onPreview={openProjectPreview} />
            ) : (
              <CardMasonry items={sorted} ranks={githubRanks} onPreview={openProjectPreview} />
            )}
          </main>
        </div>
      </div>
      <footer className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-8">
        <Separator className="mb-8" />
        <Alert><Info weight="fill" aria-hidden /><AlertTitle>{t('footerTitle')}</AlertTitle><AlertDescription>{t('footerDescription')}</AlertDescription></Alert>
      </footer>
      <GithubProjectDialog
        item={detailItem}
        categoryLabel={detailCategory ? t(CATEGORY_LABEL[detailCategory]) : undefined}
        rank={detailItem ? githubRanks.get(detailItem.id) : undefined}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        triggerRef={detailTriggerRef}
      />
    </div>
  )
}
