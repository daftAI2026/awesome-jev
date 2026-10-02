/**
 * [INPUT]: 依赖目录展示投影、共享分享图/SEO 契约、只读探针与现有 UI/主题/语言原语
 * [OUTPUT]: 仅在开发模式提供三语言 OG 工作台；生产 GET/HEAD 返回真实 404
 * [POS]: routes 的本地检查工具，以编译期 DEV 开关隔离生产访问，不信任 URL/Host 参数
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ThemeMenu } from '@/components/ThemeMenu'
import { LanguageMenu } from '@/components/LanguageMenu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/i18n'
import { localizedHead } from '@/lib/locale-head'
import { isLocalizedRouteParam, localeFromParam, localizedPath } from '@/lib/locale-routes'
import { inspectSharePage, type OgInspection } from '@/lib/og-inspection'
import { projectPathFromUrl } from '@/lib/project-routes'
import { OG_HEIGHT, OG_WIDTH, projectShareImage, SITE_ORIGIN, siteShareImage, type ShareImage } from '@/lib/share-image'

const messages = {
  en: { title: 'OG workbench', intro: 'Inspect the site and project share images from this catalog. News is not included.', count: 'GitHub projects', site: 'Site image', project: 'Project image', search: 'Find a project', results: 'matches', select: 'Choose a project', empty: 'No matching project', check: 'Inspect HTML + PNG', checking: 'Inspecting…', pass: 'Checks passed', failed: 'Checks failed', pending: 'Not inspected', open: 'Open PNG', page: 'Open page', copy: 'Copy image URL', copied: 'Copied', hint: 'Checks read this running site, not a simulated platform preview. Social platforms may keep their own cache.', imageError: 'The image endpoint did not respond. Check the running Worker and retry.', fields: 'Actual HTML metadata', skip: 'Skip to workbench' },
  zh: { title: 'OG 工作台', intro: '检查当前目录的全站与项目分享图。新闻暂不纳入。', count: '个 GitHub 项目', site: '全站分享图', project: '项目分享图', search: '搜索项目名或仓库路径', results: '项匹配', select: '选择项目', empty: '没有匹配的项目', check: '检查 HTML + PNG', checking: '正在检查…', pass: '检查通过', failed: '检查未通过', pending: '尚未检查', open: '打开 PNG', page: '打开页面', copy: '复制图片地址', copied: '已复制', hint: '读取当前运行站点的实际响应，不模拟平台卡片。分享平台可能保留自己的缓存。', imageError: '图片接口未响应。请检查当前 Worker 的运行状态后重试。', fields: '实际 HTML 元数据', skip: '跳到工作台' },
  ja: { title: 'OG ワークベンチ', intro: '現在のカタログからサイトとプロジェクトの共有画像を確認します。ニュースは対象外です。', count: 'GitHub プロジェクト', site: 'サイト画像', project: 'プロジェクト画像', search: '名前・リポジトリを検索', results: '件一致', select: 'プロジェクトを選択', empty: '一致するプロジェクトはありません', check: 'HTML + PNG を検査', checking: '検査中…', pass: '検査に合格', failed: '検査に不合格', pending: '未検査', open: 'PNG を開く', page: 'ページを開く', copy: '画像 URL をコピー', copied: 'コピー済み', hint: '稼働中のサイトの実際の応答を読みます。各共有サービスには独自のキャッシュがあります。', imageError: '画像 API が応答しません。Worker の稼働状況を確認し、再試行してください。', fields: '実際の HTML メタデータ', skip: 'ワークベンチへ移動' },
}

export const Route = createFileRoute('/{-$locale}/og-workbench')({
  beforeLoad: ({ params }) => { if (!import.meta.env.DEV || !isLocalizedRouteParam(params.locale)) throw notFound() },
  loader: async () => {
    // --- 独立守住数据读取边界；生产构建不靠 noindex 或秘密网址限制访问 ---
    if (!import.meta.env.DEV) throw notFound()
    const { default: catalog } = await import('virtual:directory-catalog')
    return catalog.map(({ url, title, summary }) => ({ url, title, summary }))
  },
  head: ({ params }) => !import.meta.env.DEV ? {} : localizedHead({ path: '/og-workbench', locale: localeFromParam(params.locale), title: `${messages[localeFromParam(params.locale)].title} · Awesome JEV`, description: messages[localeFromParam(params.locale)].intro, robots: 'noindex, nofollow' }),
  component: OgWorkbench,
})

function OgWorkbench() {
  const projects = Route.useLoaderData()
  const { locale } = useI18n()
  const m = messages[locale]
  const [query, setQuery] = useState('')
  const [selectedUrl, setSelectedUrl] = useState(projects[0]?.url ?? '')
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase()
    return projects.filter((item) => !term || `${item.title} ${item.url}`.toLowerCase().includes(term))
  }, [projects, query])
  const project = projects.find((item) => item.url === selectedUrl)
  const options = matches.slice(0, 50)
  if (project && !options.some((item) => item.url === project.url)) options.unshift(project)

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a href="#og-workbench" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-background focus:p-4">{m.skip}</a>
      <header className="flex h-14 items-center justify-between px-4">
        <Link to={localizedPath('/', locale)} className="font-medium focus-visible:outline-2 focus-visible:outline-ring">Awesome JEV</Link>
        <div className="flex gap-2"><ThemeMenu /><LanguageMenu /></div>
      </header>
      <main id="og-workbench" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-medium">{m.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{m.intro}</p>
        <p className="mt-4 text-sm tabular-nums"><strong className="font-medium">{projects.length}</strong> {m.count} · awesomejev.cc · 1200 × 630 PNG</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="og-search" className="mb-2 block text-sm">{m.search}</label>
            <Input id="og-search" value={query} onChange={(event) => setQuery(event.target.value)} />
            <p className="mt-2 text-xs text-muted-foreground" role="status">{matches.length} {m.results}</p>
          </div>
          <div>
            <label htmlFor="og-project" className="mb-2 block text-sm">{m.select}</label>
            <select id="og-project" value={selectedUrl} onChange={(event) => setSelectedUrl(event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring">
              {options.map((item) => <option key={item.url} value={item.url}>{item.url.slice('https://github.com/'.length)}</option>)}
            </select>
            {matches.length === 0 && <p className="mt-2 text-xs text-muted-foreground">{m.empty}</p>}
          </div>
        </div>
        <div className="mt-8 grid items-start gap-10 lg:grid-cols-2">
          <InspectionPanel key={`site-${projects.length}-${locale}`} title={m.site} path={localizedPath('/', locale)} image={siteShareImage(projects.length)} />
          {project && <InspectionPanel key={`${projectShareImage(project).path}-${locale}`} title={`${m.project} · ${project.title}`} path={localizedPath(projectPathFromUrl(project.url)!, locale)} image={projectShareImage(project)} />}
        </div>
        <p className="mt-10 text-sm text-muted-foreground">{m.hint}</p>
      </main>
    </div>
  )
}

function InspectionPanel({ title, path, image }: { title: string; path: string; image: ShareImage }) {
  const { locale } = useI18n()
  const m = messages[locale]
  const [result, setResult] = useState<OgInspection | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState(false)
  const [copied, setCopied] = useState(false)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])

  async function inspect() {
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const report = await inspectSharePage(path, image, request.signal)
      if (!request.signal.aborted) setResult(report)
    } catch (failure) {
      if (!request.signal.aborted) setError(failure instanceof Error ? failure.message : String(failure))
    } finally {
      if (!request.signal.aborted) setBusy(false)
    }
  }

  return (
    <section aria-label={title}>
      <h2 className="mb-4 break-words text-base font-medium">{title}</h2>
      <a href={image.path} target="_blank" rel="noopener noreferrer" className="block focus-visible:outline-2 focus-visible:outline-ring">
        <img src={image.path} alt={image.alt} width={OG_WIDTH} height={OG_HEIGHT} className="h-auto w-full" onError={() => setImageError(true)} onLoad={() => setImageError(false)} />
      </a>
      {imageError && <p role="alert" className="mt-3 text-sm text-destructive">{m.imageError}</p>}
      <p className="mt-3 break-all font-mono text-xs text-muted-foreground">{SITE_ORIGIN}{image.path}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={inspect} disabled={busy}>{busy ? m.checking : m.check}</Button>
        <Button variant="ghost" nativeButton={false} render={<a href={image.path} target="_blank" rel="noopener noreferrer" />}>{m.open}</Button>
        <Button variant="ghost" nativeButton={false} render={<a href={path} target="_blank" rel="noopener noreferrer" />}>{m.page}</Button>
        <Button variant="ghost" onClick={async () => {
          try { await navigator.clipboard.writeText(`${SITE_ORIGIN}${image.path}`); setCopied(true) }
          catch (failure) { setError(failure instanceof Error ? failure.message : String(failure)) }
        }}>{copied ? m.copied : m.copy}</Button>
      </div>
      <div className="mt-4 text-sm" role="status" aria-live="polite">
        {error ? <p className="text-destructive">{error}</p> : result ? <>
          <p className={result.errors.length ? 'text-destructive' : 'text-foreground'}>{result.errors.length ? m.failed : m.pass} · HTML {result.pageStatus} · PNG {result.imageStatus ?? '?'} · {result.imageSize ?? '?'}</p>
          {result.errors.length > 0 && <ul className="mt-2 space-y-1 break-words font-mono text-xs text-destructive">{result.errors.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
        </> : <p className="text-muted-foreground">{m.pending}</p>}
      </div>
      {result && <details className="mt-5 border-t border-border pt-4">
        <summary className="cursor-pointer text-sm focus-visible:outline-2 focus-visible:outline-ring">{m.fields}</summary>
        <dl className="mt-4 space-y-3 font-mono text-xs">
          {result.tags.map((tag, index) => <div key={`${tag.key}-${index}`}><dt className="text-muted-foreground">{tag.key}</dt><dd className="mt-1 break-all">{tag.value}</dd></div>)}
        </dl>
      </details>}
    </section>
  )
}
