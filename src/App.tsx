import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GithubLogo,
  Info,
  List,
  MagnifyingGlass,
  SquaresFour,
} from '@phosphor-icons/react'
import githubData from '../data/github.json'
import youtubeData from '../data/youtube.json'
import xData from '../data/x.json'
import { AsciiWordmark } from '@/components/AsciiWordmark'
import { GithubList } from '@/components/GithubList'
import { ItemCard } from '@/components/ItemCard'
import { ZoneNav } from '@/components/ZoneNav'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useI18n } from '@/i18n'
import { countByType, countGithubProjects } from '@/lib/counts'
import { searchItems } from '@/lib/search'
import {
  githubStarRanks,
  sortGithubItems,
  sortXItems,
  sortYoutubeItems,
} from '@/lib/sort'
import { cn } from 'cn'
import type {
  DirectoryItem,
  FilterType,
  GithubSort,
  GithubView,
  XSort,
  YoutubeSort,
} from '@/lib/types'

const items = [
  ...(githubData as DirectoryItem[]),
  ...(youtubeData as DirectoryItem[]),
  ...(xData as DirectoryItem[]),
]
const githubProjectCount = countGithubProjects(items)
const githubRanks = githubStarRanks(items)
const zoneCounts: Record<FilterType, number> = {
  github: countByType(items, 'github'),
  x: countByType(items, 'x'),
  youtube: countByType(items, 'youtube'),
}
const visibleZones: FilterType[] = [
  'github',
  'x',
  ...(zoneCounts.youtube > 0 ? (['youtube'] as const) : []),
]

const GITHUB_SORT_KEY = 'awesome-jev-github-sort'
const GITHUB_VIEW_KEY = 'awesome-jev-github-view'
const X_SORT_KEY = 'awesome-jev-x-sort'
const YOUTUBE_SORT_KEY = 'awesome-jev-youtube-sort'
const ZONE_KEY = 'awesome-jev-zone'

function readStoredGithubSort(): GithubSort {
  try {
    const v = localStorage.getItem(GITHUB_SORT_KEY)
    if (v === 'stars' || v === 'date' || v === 'name') return v
  } catch {
    /* ignore */
  }
  return 'stars'
}

function readStoredGithubView(): GithubView {
  try {
    const v = localStorage.getItem(GITHUB_VIEW_KEY)
    if (v === 'cards' || v === 'list') return v
  } catch {
    /* ignore */
  }
  return 'cards'
}

function readStoredXSort(): XSort {
  try {
    const v = localStorage.getItem(X_SORT_KEY)
    if (v === 'date' || v === 'likes') return v
  } catch {
    /* ignore */
  }
  return 'date'
}

function readStoredYoutubeSort(): YoutubeSort {
  try {
    const v = localStorage.getItem(YOUTUBE_SORT_KEY)
    if (v === 'date' || v === 'views') return v
  } catch {
    /* ignore */
  }
  return 'date'
}

function readStoredZone(): FilterType {
  try {
    const v = localStorage.getItem(ZONE_KEY)
    if (v === 'github' || v === 'x' || v === 'youtube') return v
  } catch {
    /* ignore */
  }
  return 'github'
}

export default function App() {
  const { locale, setLocale, t } = useI18n()
  const [query, setQuery] = useState('')
  const [githubSort, setGithubSort] = useState<GithubSort>(readStoredGithubSort)
  const [githubView, setGithubView] = useState<GithubView>(readStoredGithubView)
  const [xSort, setXSort] = useState<XSort>(readStoredXSort)
  const [youtubeSort, setYoutubeSort] = useState<YoutubeSort>(
    readStoredYoutubeSort,
  )
  const [zone, setZone] = useState<FilterType>(readStoredZone)
  const [zoneOpen, setZoneOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(GITHUB_SORT_KEY, githubSort)
    } catch {
      /* ignore */
    }
  }, [githubSort])

  useEffect(() => {
    try {
      localStorage.setItem(GITHUB_VIEW_KEY, githubView)
    } catch {
      /* ignore */
    }
  }, [githubView])

  useEffect(() => {
    try {
      localStorage.setItem(X_SORT_KEY, xSort)
    } catch {
      /* ignore */
    }
  }, [xSort])

  useEffect(() => {
    try {
      localStorage.setItem(YOUTUBE_SORT_KEY, youtubeSort)
    } catch {
      /* ignore */
    }
  }, [youtubeSort])

  useEffect(() => {
    try {
      localStorage.setItem(ZONE_KEY, zone)
    } catch {
      /* ignore */
    }
  }, [zone])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (zone !== 'github') return
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable
      ) {
        return
      }
      event.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zone])

  const onZoneChange = useCallback((next: FilterType) => {
    setZone(next)
    setZoneOpen(false)
  }, [])

  const socialZone = zone === 'x'
  const youtubeZone = zone === 'youtube'

  const matched = useMemo(() => {
    if (zone === 'github') {
      return searchItems(items, query, 'github', [])
    }
    return items.filter((item) => item.type === zone)
  }, [query, zone])

  const sections = useMemo(() => {
    const title =
      zone === 'github'
        ? t('sectionGithub')
        : zone === 'x'
          ? t('sectionX')
          : t('sectionYoutube')
    let sectionItems = matched
    if (zone === 'github') {
      sectionItems = sortGithubItems(sectionItems, githubSort)
    } else if (zone === 'youtube') {
      sectionItems = sortYoutubeItems(sectionItems, youtubeSort)
    } else {
      sectionItems = sortXItems(sectionItems, xSort)
    }
    return [{ id: zone, title, items: sectionItems }]
  }, [matched, zone, githubSort, xSort, youtubeSort, t])

  const githubSearching = zone === 'github'
  const hasQuery = githubSearching && query.trim().length > 0
  const totalMatched = matched.length
  const resultLabel =
    totalMatched === 1
      ? t('resultCount', { count: totalMatched })
      : t('resultCountPlural', { count: totalMatched })

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="skip-link sr-only">
        {t('skipToContent')}
      </a>

      <header className="sticky top-0 z-50 bg-background">
        <div className="flex h-14 w-full items-center justify-between gap-3 px-4">
          <h1 className="truncate text-lg font-medium tracking-tight text-foreground">
            Awesome JEV
          </h1>
          <div className="flex shrink-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              nativeButton={false}
              render={
                <a
                  href="https://github.com/daftAI2026/awesome-jev"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              aria-label={t('openGithub')}
              className="text-muted-foreground"
            >
              <GithubLogo className="size-4" weight="fill" aria-hidden />
            </Button>
            <div
              className="flex shrink-0 items-center gap-2"
              role="group"
              aria-label={t('languageToggle')}
            >
              <Button
                variant={locale === 'zh' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setLocale('zh')}
                aria-pressed={locale === 'zh'}
              >
                中文
              </Button>
              <Button
                variant={locale === 'en' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setLocale('en')}
                aria-pressed={locale === 'en'}
              >
                EN
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
        <AsciiWordmark />
        <p className="mt-8 text-center text-xl leading-snug tracking-tight text-muted-foreground sm:text-2xl">
          {t('tagline')
            .split('\n')
            .map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-8 px-4 pb-8 sm:px-6 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10 lg:px-8 lg:pb-10">
        <aside className="hidden lg:block">
          <div className="sticky top-16">
            <ZoneNav
              zone={zone}
              zones={visibleZones}
              counts={zoneCounts}
              onZoneChange={onZoneChange}
            />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6">
            {githubSearching && (
              <div className="relative">
                <MagnifyingGlass
                  className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 text-muted-foreground"
                  weight="regular"
                  aria-hidden
                />
                <label htmlFor="directory-search" className="sr-only">
                  {t('searchLabel')}
                </label>
                <Input
                  ref={searchRef}
                  id="directory-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  autoComplete="off"
                  className="h-12 rounded-none border-0 border-b border-border bg-transparent px-8 py-3 text-base shadow-none appearance-none focus-visible:border-foreground focus-visible:ring-0 md:text-sm dark:bg-transparent [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden"
                />
                <kbd
                  className="pointer-events-none absolute inset-y-0 right-0 hidden items-center sm:flex"
                  title={t('searchHint')}
                >
                  <Badge
                    variant="outline"
                    className="rounded-lg font-mono font-normal text-muted-foreground"
                  >
                    /
                  </Badge>
                </kbd>
              </div>
            )}
            <div
              className={cn(
                'flex flex-wrap items-center gap-4',
                githubSearching && 'mt-4',
              )}
            >
              <Sheet open={zoneOpen} onOpenChange={setZoneOpen}>
                <SheetTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="lg:hidden"
                      aria-label={t('openZones')}
                    />
                  }
                >
                  <List className="size-4" weight="fill" aria-hidden />
                  {zone === 'github'
                    ? t('zoneGithub')
                    : zone === 'x'
                      ? t('zoneX')
                      : t('zoneYoutube')}
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>{t('zoneLabel')}</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-4">
                    <ZoneNav
                      zone={zone}
                      zones={visibleZones}
                      counts={zoneCounts}
                      onZoneChange={onZoneChange}
                    />
                  </div>
                </SheetContent>
              </Sheet>
              {youtubeZone ? (
                <ToggleGroup
                  value={[youtubeSort]}
                  onValueChange={(vals) => {
                    const next = vals[0]
                    if (next === 'date' || next === 'views') setYoutubeSort(next)
                  }}
                  variant="outline"
                  size="sm"
                  aria-label={t('rankLabel')}
                  className="rounded-lg"
                >
                  <ToggleGroupItem value="date">{t('sortDate')}</ToggleGroupItem>
                  <ToggleGroupItem value="views">{t('sortViews')}</ToggleGroupItem>
                </ToggleGroup>
              ) : socialZone ? (
                <ToggleGroup
                  value={[xSort]}
                  onValueChange={(vals) => {
                    const next = vals[0]
                    if (next === 'date' || next === 'likes') setXSort(next)
                  }}
                  variant="outline"
                  size="sm"
                  aria-label={t('rankLabel')}
                  className="rounded-lg"
                >
                  <ToggleGroupItem value="date">{t('sortDate')}</ToggleGroupItem>
                  <ToggleGroupItem value="likes">{t('sortLikes')}</ToggleGroupItem>
                </ToggleGroup>
              ) : (
                <ToggleGroup
                  value={[githubSort]}
                  onValueChange={(vals) => {
                    const next = vals[0]
                    if (next === 'stars' || next === 'date' || next === 'name') {
                      setGithubSort(next)
                    }
                  }}
                  variant="outline"
                  size="sm"
                  aria-label={t('rankLabel')}
                  className="rounded-lg"
                >
                  <ToggleGroupItem value="stars">
                    {t('sortStars')}
                    <span className="ml-1 tabular-nums text-muted-foreground">
                      ({githubProjectCount})
                    </span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="date">{t('sortDate')}</ToggleGroupItem>
                  <ToggleGroupItem value="name">{t('sortName')}</ToggleGroupItem>
                </ToggleGroup>
              )}
              {githubSearching ? (
                <ToggleGroup
                  value={[githubView]}
                  onValueChange={(vals) => {
                    const next = vals[0]
                    if (next === 'cards' || next === 'list') setGithubView(next)
                  }}
                  variant="outline"
                  size="sm"
                  aria-label={t('viewLabel')}
                  className="ml-auto rounded-lg"
                >
                  <ToggleGroupItem value="cards" aria-label={t('viewCards')}>
                    <SquaresFour className="size-3.5" weight="fill" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label={t('viewList')}>
                    <List className="size-3.5" weight="fill" />
                  </ToggleGroupItem>
                </ToggleGroup>
              ) : null}
            </div>
          </div>

          {hasQuery && (
            <p className="mb-6 text-sm text-muted-foreground tabular-nums">
              {resultLabel}
            </p>
          )}

          <main id="main" className="space-y-12" tabIndex={-1}>
            {hasQuery && totalMatched === 0 ? (
              <p className="py-10 text-sm text-muted-foreground">
                {t('emptySearch')}
              </p>
            ) : (
              sections.map((section, index) => (
                <section
                  key={section.id}
                  aria-labelledby={`section-${section.id}`}
                >
                  {index > 0 && <Separator className="mb-10" />}
                  <h2 id={`section-${section.id}`} className="sr-only">
                    {section.title}
                  </h2>

                  {section.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('emptySection')}
                    </p>
                  ) : section.id === 'x' || section.id === 'youtube' ? (
                    <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                      {section.items.map((item) => (
                        <li key={item.id} className="mb-4 break-inside-avoid">
                          <ItemCard item={item} />
                        </li>
                      ))}
                    </ul>
                  ) : githubView === 'list' ? (
                    <GithubList items={section.items} ranks={githubRanks} />
                  ) : (
                    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {section.items.map((item) => (
                        <li key={item.id} className="min-w-0">
                          <ItemCard
                            item={item}
                            rank={githubRanks.get(item.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))
            )}
          </main>
        </div>
      </div>

      <footer className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-8">
        <Separator className="mb-8" />
        <Alert>
          <Info weight="fill" aria-hidden />
          <AlertTitle>{t('footerTitle')}</AlertTitle>
          <AlertDescription>{t('footerDescription')}</AlertDescription>
        </Alert>
      </footer>
    </div>
  )
}
