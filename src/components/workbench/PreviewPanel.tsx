/**
 * [INPUT]: 依赖白名单同源目标、共享宽度状态和本轮工作台文案
 * [OUTPUT]: 对外提供 PreviewPanel 桌面/手机真实页面、实际 favicon 与变更位置说明
 * [POS]: workbench 的界面审核入口；iframe 消费真实产品路由，不复制渲染或伪造历史截图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'
import type { WorkbenchSearch } from '@/lib/workbench'
import { workbenchMessages } from './messages'

export function PreviewPanel({ path, search, onChange }: { path: string; search: WorkbenchSearch; onChange: (next: Partial<WorkbenchSearch>) => void }) {
  const { locale } = useI18n()
  const m = workbenchMessages[locale]
  const change = search.preset === 'category' ? m.categoryChange : search.preset === 'project' ? m.projectChange : search.preset === 'home' ? m.homeChange : m.otherChange
  return <>
    <section aria-label={m.changes} className="mb-6">
      <h3 className="text-sm font-medium">{m.changes}</h3>
      <p className="mt-2 text-sm leading-relaxed">{change}</p>
      <a href="/favicon.svg" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-3 text-sm">
        <img src="/favicon.svg" width={32} height={32} alt={m.favicon} className="size-8 object-contain" />
        <span>{m.favicon}</span>
      </a>
      <p className="mt-2 text-xs text-muted-foreground">{m.current}</p>
    </section>
    <div className="mb-4 flex flex-wrap gap-2">
      {(['desktop', 'mobile'] as const).map((width) => <Button key={width} variant={search.width === width ? 'secondary' : 'outline'} aria-pressed={search.width === width} onClick={() => onChange({ width })}>{m[width]}</Button>)}
      <Button variant="ghost" nativeButton={false} render={<a href={path} target="_blank" rel="noopener noreferrer" />}>{m.open}</Button>
    </div>
    <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{m.previewHint}</p>
    <div className="overflow-x-auto rounded-lg border border-border bg-muted p-2">
      <iframe key={`${path}-${search.width}`} src={path} title={`${m.preview} · ${path} · ${m[search.width]}`} width={search.width === 'mobile' ? 390 : 1280} height={800}
        className="mx-auto block max-w-none border-0 bg-background" />
    </div>
  </>
}
