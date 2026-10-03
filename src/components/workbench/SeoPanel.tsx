/**
 * [INPUT]: 依赖白名单目标、seo-inspection 有界探针与工作台三语言文案
 * [OUTPUT]: 对外提供 SeoPanel 显式检查、事实诊断与用户提供的品牌词样本
 * [POS]: workbench 的只读 SEO 面板；不自动抓全站、不造趋势图、不提供无依据评分
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'
import { inspectSeoPage, type SeoInspection } from '@/lib/seo-inspection'
import type { WorkbenchPreset } from '@/lib/workbench'
import { workbenchMessages } from './messages'

// --- 用户提供的查询汇总；没有日期序列，不能推断趋势或 CTR ---
const BRAND_QUERY_SAMPLE = [['awesome jev', 288], ['awesome-jev', 113], ['jev awesome', 28]] as const

export function SeoPanel({ path, preset }: { path: string; preset: WorkbenchPreset }) {
  const { locale } = useI18n()
  const m = workbenchMessages[locale]
  const [report, setReport] = useState<SeoInspection | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  async function inspect() {
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setBusy(true); setReport(null); setError('')
    try {
      const result = await inspectSeoPage({ path, status: preset === 'missing' ? 404 : 200, indexable: preset !== 'missing' && preset !== 'saved' }, request.signal)
      if (!request.signal.aborted) setReport(result)
    } catch (failure) {
      if (!request.signal.aborted) setError(failure instanceof Error ? failure.message : String(failure))
    } finally { if (!request.signal.aborted) setBusy(false) }
  }
  return <>
    <p className="break-all font-mono text-xs text-muted-foreground">{path}</p>
    <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={inspect}>{busy ? m.checking : m.check}</Button>
      <Button variant="ghost" nativeButton={false} render={<a href={path} target="_blank" rel="noopener noreferrer" />}>{m.open}</Button></div>
    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{m.seoHint}</p>
    <div className="mt-6" role="status" aria-live="polite">
      {error ? <p className="break-words text-sm text-destructive">{error}</p> : report ? <dl className="divide-y divide-border">
        {report.checks.map((check) => <div key={check.key} className="grid gap-2 py-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
          <dt className="text-sm">{check.key === 'title' ? m.pageTitle : m[check.key]}</dt>
          <dd className="min-w-0"><span className={`text-xs ${check.state === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>{m[check.state]}</span>
            {check.value && <p className="mt-1 break-words whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">{check.value}</p>}</dd>
        </div>)}
      </dl> : <p className="text-sm text-muted-foreground">{m.pending}</p>}
    </div>
    {report && <details className="mt-6 border-t border-border pt-4"><summary className="cursor-pointer text-sm focus-visible:outline-2 focus-visible:outline-ring">{m.details}</summary>
      <pre className="mt-3 max-h-80 overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(report.facts, null, 2)}</pre></details>}
    <section className="mt-10 border-t border-border pt-6" aria-label={m.brand}>
      <h3 className="text-sm font-medium">{m.brand}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.brandHint}</p>
      <table className="mt-4 w-full max-w-lg text-sm"><thead><tr><th scope="col" className="pb-2 text-left font-normal">{m.brand}</th><th scope="col" className="pb-2 text-right font-normal">{m.impressions}</th></tr></thead>
        <tbody>{BRAND_QUERY_SAMPLE.map(([query, count]) => <tr key={query}><th scope="row" className="py-1 text-left font-normal">{query}</th><td className="text-right tabular-nums">{count}</td></tr>)}</tbody></table>
    </section>
  </>
}
