/**
 * [INPUT]: 依赖共享项目投影、OG 身份、有界检查探针和原有 UI 原语
 * [OUTPUT]: 对外提供 OgPanel 全站/项目 PNG 与 HTML 检查
 * [POS]: workbench 的分享图面板；从旧路由迁入，不改变原有图片与检查行为
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'
import { inspectSharePage, type OgInspection } from '@/lib/og-inspection'
import { localizedPath } from '@/lib/locale-routes'
import { projectPathFromUrl } from '@/lib/project-routes'
import { OG_HEIGHT, OG_WIDTH, projectShareImage, SITE_ORIGIN, siteShareImage, type ShareImage } from '@/lib/share-image'
import type { WorkbenchProject } from '@/lib/workbench'
import { ogMessages } from './messages'

export function OgPanel({ count, project }: { count: number; project?: WorkbenchProject }) {
  const { locale } = useI18n()
  const m = ogMessages[locale]
  return <>
    <p className="text-sm text-muted-foreground">{m.intro}</p>
    <p className="mt-3 text-sm tabular-nums">{count} {m.count} · 1200 × 630 PNG</p>
    <div className="mt-8 grid items-start gap-10 xl:grid-cols-2">
      <InspectionPanel key={`site-${count}-${locale}`} title={m.site} path={localizedPath('/', locale)} image={siteShareImage(count)} />
      {project && <InspectionPanel key={`${projectShareImage(project).path}-${locale}`} title={`${m.project} · ${project.title}`} path={localizedPath(projectPathFromUrl(project.url)!, locale)} image={projectShareImage(project)} />}
    </div>
    <p className="mt-8 text-sm text-muted-foreground">{m.hint}</p>
  </>
}

function InspectionPanel({ title, path, image }: { title: string; path: string; image: ShareImage }) {
  const { locale } = useI18n()
  const m = ogMessages[locale]
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
