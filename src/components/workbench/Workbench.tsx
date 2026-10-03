/**
 * [INPUT]: 依赖路由校验后的搜索状态、工作台项目投影、三种工具面板和既有主题/语言/Sheet
 * [OUTPUT]: 对外提供 Workbench 单一侧栏壳与共享目标选择
 * [POS]: workbench 的编排层；工具不拥有第二套目标数据或语言状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { List } from '@phosphor-icons/react'
import { ThemeMenu } from '@/components/ThemeMenu'
import { LanguageMenu } from '@/components/LanguageMenu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useI18n } from '@/i18n'
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/categories'
import { localizedPath } from '@/lib/locale-routes'
import { WORKBENCH_PRESETS, WORKBENCH_TOOLS, selectWorkbenchProject, workbenchPage, type WorkbenchProject, type WorkbenchSearch } from '@/lib/workbench'
import { OgPanel } from './OgPanel'
import { SeoPanel } from './SeoPanel'
import { PreviewPanel } from './PreviewPanel'
import { workbenchMessages } from './messages'

const selectClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring'

export function Workbench({ projects, search, onChange }: {
  projects: WorkbenchProject[]
  search: WorkbenchSearch
  onChange: (next: Partial<WorkbenchSearch>) => void
}) {
  const { locale, t } = useI18n()
  const m = workbenchMessages[locale]
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase()
    return projects.filter((item) => !term || `${item.title} ${item.url}`.toLowerCase().includes(term))
  }, [projects, query])
  const project = selectWorkbenchProject(projects, search.project)
  const options = matches.slice(0, 50)
  if (project && !options.some((item) => item.url === project.url)) options.unshift(project)
  const path = workbenchPage(search, locale, project)
  const nav = <nav aria-label={m.tools} className="space-y-1">
    {WORKBENCH_TOOLS.map((tool) => <Button key={tool} nativeButton={false}
      render={<Link to={localizedPath('/og-workbench', locale)} search={{ ...search, tool }} />}
      variant={search.tool === tool ? 'secondary' : 'ghost'} aria-current={search.tool === tool ? 'page' : undefined}
      onClick={() => setMenuOpen(false)} className="h-10 w-full justify-start font-normal">{m[tool]}</Button>)}
  </nav>

  return <div className="min-h-dvh bg-background text-foreground">
    <a href="#workbench" className="skip-link sr-only">{m.skip}</a>
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-background px-4">
      <Link to={localizedPath('/', locale)} className="font-medium focus-visible:outline-2 focus-visible:outline-ring">Awesome JEV</Link>
      <div className="flex gap-2"><ThemeMenu /><LanguageMenu /></div>
    </header>
    <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div><h1 className="text-2xl font-medium">{m.title}</h1><p className="mt-2 text-sm text-muted-foreground">{m.intro}</p></div>
        <span className="shrink-0 text-xs text-muted-foreground">{m.local}</span>
      </div>
      <div className="grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <aside className="hidden lg:block"><div className="sticky top-20">{nav}</div></aside>
        <main id="workbench" tabIndex={-1} className="min-w-0">
          <div className="mb-6 flex items-center gap-3">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger render={<Button variant="outline" size="icon-sm" className="lg:hidden" aria-label={m.tools} />}><List className="size-4" aria-hidden /></SheetTrigger>
              <SheetContent side="left" className="w-72 gap-6 p-4 sm:max-w-72"><SheetHeader className="p-0"><SheetTitle>{m.title}</SheetTitle></SheetHeader>{nav}</SheetContent>
            </Sheet>
            <h2 className="text-lg font-medium">{m[search.tool]}</h2>
          </div>
          <div className="mb-8 grid items-start gap-4 sm:grid-cols-2">
            {search.tool !== 'og' && <div><label htmlFor="workbench-target" className="mb-2 block text-sm">{m.target}</label>
              <select id="workbench-target" value={search.preset} onChange={(event) => onChange({ preset: event.target.value as WorkbenchSearch['preset'] })} className={selectClass}>
                {WORKBENCH_PRESETS.map((preset) => <option key={preset} value={preset}>{m[preset]}</option>)}
              </select>
            </div>}
            {search.tool !== 'og' && search.preset === 'category' && <div><label htmlFor="workbench-category" className="mb-2 block text-sm">{m.categoryLabel}</label>
              <select id="workbench-category" value={search.category} onChange={(event) => onChange({ category: event.target.value as WorkbenchSearch['category'] })} className={selectClass}>
                {CATEGORIES.map((category) => <option key={category} value={category}>{t(CATEGORY_LABEL[category])}</option>)}
              </select>
            </div>}
            {(search.tool === 'og' || search.preset === 'project') && <>
              <div><label htmlFor="workbench-search" className="mb-2 block text-sm">{m.search}</label>
                <Input id="workbench-search" value={query} onChange={(event) => setQuery(event.target.value)} />
                <p className="mt-2 text-xs text-muted-foreground" role="status">{matches.length} {m.matches}</p>
              </div>
              <div><label htmlFor="workbench-project" className="mb-2 block text-sm">{m.choose}</label>
                <select id="workbench-project" value={project?.url ?? ''} onChange={(event) => onChange({ project: event.target.value })} className={selectClass}>
                  {options.map((item) => <option key={item.url} value={item.url}>{item.url.slice('https://github.com/'.length)}</option>)}
                </select>
                {!matches.length && <p className="mt-2 text-xs text-muted-foreground">{m.empty}</p>}
              </div>
            </>}
          </div>
          {search.tool === 'og' ? <OgPanel count={projects.length} project={project} />
            : search.tool === 'seo' ? <SeoPanel key={path} path={path} preset={search.preset} />
            : <PreviewPanel path={path} search={search} onChange={onChange} />}
        </main>
      </div>
    </div>
  </div>
}
