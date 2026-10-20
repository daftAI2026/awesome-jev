/**
 * [INPUT]: 依赖 MCP 公开配置、路由语言和现有主题、按钮与 Tabs 页签
 * [OUTPUT]: 提供三语言单行横滚页签、配置复制与官方预填添加入口
 * [POS]: components 的公开使用说明；不连接客户端，不读取项目快照或调用 MCP
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useState } from 'react'
import { ArrowLeft, ArrowUpRight, Check, Copy, Globe } from '@phosphor-icons/react'
import { LanguageMenu } from '@/components/LanguageMenu'
import { ThemeMenu } from '@/components/ThemeMenu'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useI18n } from '@/i18n'
import { localizedPath } from '@/lib/locale-routes'
import { MCP_CLIENTS, MCP_DOCUMENT_PATH, MCP_ENDPOINT, type McpClientId } from '@/lib/mcp-config'

function CopyButton({ value, label }: { value: string; label: string }) {
  const { t } = useI18n()
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
  }
  return <div className="flex flex-wrap items-center gap-2">
    <Button variant="outline" className="h-10 rounded-md px-3" onClick={() => { void copy() }}>
      {status === 'copied' ? <Check aria-hidden /> : <Copy aria-hidden />}
      {status === 'copied' ? t('mcpCopied') : label}
    </Button>
    <span role="status" aria-live="polite" className={status === 'failed' ? 'text-sm text-muted-foreground' : 'sr-only'}>
      {status === 'failed' ? t('mcpCopyFailed') : status === 'copied' ? t('mcpCopied') : ''}
    </span>
  </div>
}

export function McpPage() {
  const { locale, t } = useI18n()
  const [clientId, setClientId] = useState<McpClientId>('claude')
  const linkStyle = 'rounded-sm text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring'

  return <div className="min-h-dvh bg-background text-foreground">
    <a href="#main-content" className="sr-only rounded-md bg-background px-4 py-3 text-sm focus:not-sr-only focus:fixed focus:top-2 focus:left-4 focus:z-50 focus-visible:outline-2 focus-visible:outline-ring">
      {t('skipToContent')}
    </a>
    <header>
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        <a href={localizedPath('/', locale)} className="rounded-sm text-base font-medium tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:text-lg">
          Awesome JEV
        </a>
        <div className="flex items-center gap-2"><ThemeMenu /><LanguageMenu /></div>
      </div>
    </header>

    <main id="main-content" tabIndex={-1} className="mx-auto grid w-full max-w-3xl gap-10 px-4 py-10 focus:outline-none sm:px-6 sm:py-16">
      <section aria-labelledby="mcp-title">
        <a href={localizedPath('/', locale)} className={`${linkStyle} mb-8 inline-flex min-h-10 items-center gap-2 text-muted-foreground hover:text-foreground`}>
          <ArrowLeft className="size-4" aria-hidden />{t('browseDirectory')}
        </a>
        <h1 id="mcp-title" className="text-3xl leading-tight font-medium sm:text-4xl">{t('mcpTitle')}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{t('mcpDescription')}</p>
        <p className="mt-4 text-sm">{t('mcpReadonly')}</p>
      </section>

      <section aria-labelledby="mcp-endpoint-title" className="grid gap-3">
        <h2 id="mcp-endpoint-title" className="text-sm font-medium">{t('mcpEndpoint')}</h2>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4">
          <code className="min-w-0 font-mono text-sm leading-relaxed break-all sm:text-base">{MCP_ENDPOINT}</code>
          <CopyButton value={MCP_ENDPOINT} label={t('mcpCopyAddress')} />
        </div>
        <p className="text-sm text-muted-foreground">HTTPS · Streamable HTTP</p>
      </section>

      <section aria-labelledby="mcp-connect-title" className="grid min-w-0 gap-5">
        <div className="grid gap-2">
          <h2 id="mcp-connect-title" className="text-xl font-medium">{t('mcpConnect')}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t('mcpClientDifference')}</p>
        </div>
        <Tabs value={clientId} onValueChange={(value) => {
          const next = MCP_CLIENTS.find((entry) => entry.id === value)
          if (next) setClientId(next.id)
        }} className="min-w-0 gap-5">
          <div className="max-w-full min-w-0 overflow-x-auto rounded-lg">
            <TabsList activateOnFocus aria-label={t('mcpClientLabel')} className="w-max min-w-full flex-nowrap justify-start gap-1">
              {MCP_CLIENTS.map((entry) => <TabsTrigger key={entry.id} value={entry.id} className={`min-h-10 min-w-0 flex-none justify-start text-left ${entry.id === 'http' ? 'ml-2 border-l-border' : ''}`}
                onFocus={(event) => event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })}>
                {entry.icon ? <>
                  <img src={entry.icon.src} alt="" aria-hidden width={16} height={16}
                    className={`size-4 shrink-0 object-contain ${'darkSrc' in entry.icon ? 'dark:hidden' : entry.icon.monochrome ? 'dark:invert' : ''}`} />
                  {'darkSrc' in entry.icon && <img src={entry.icon.darkSrc} alt="" aria-hidden width={16} height={16}
                    className="hidden size-4 shrink-0 object-contain dark:block" />}
                </> : <Globe className="size-4" aria-hidden />}
                {entry.name}
              </TabsTrigger>)}
            </TabsList>
          </div>
          {MCP_CLIENTS.map((entry) => <TabsContent key={entry.id} value={entry.id} className="grid gap-5">
            <ol className="grid list-decimal gap-3 pl-5 text-sm leading-relaxed marker:text-muted-foreground">
              {entry.steps.map((step) => <li key={step} className="pl-1">{t(step)}</li>)}
            </ol>
            <div className="min-w-0 rounded-lg bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed break-all"><code>{entry.config}</code></pre>
              <div className="mt-4">
                <CopyButton key={clientId} value={entry.config} label={entry.format === 'url' ? t('mcpCopyAddress') : t('mcpCopy')} />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                {'installUrl' in entry && <Button nativeButton={false} role="link"
                  render={<a href={entry.installUrl} target={entry.installUrl.startsWith('https:') ? '_blank' : undefined} rel="noopener noreferrer" />}
                  className="min-h-10 rounded-md px-3">
                  {t('mcpInstall', { client: entry.name })}<ArrowUpRight className="size-4" aria-hidden />
                </Button>}
                <a href={entry.docs} target="_blank" rel="noopener noreferrer" className={`${linkStyle} inline-flex min-h-10 w-fit items-center gap-1`}>
                  {t('mcpClientDocs', { client: entry.name })}<ArrowUpRight className="size-4" aria-hidden />
                </a>
              </div>
              {'installUrl' in entry && <p className="text-sm leading-relaxed text-muted-foreground">{t('mcpInstallNotice')}</p>}
            </div>
          </TabsContent>)}
        </Tabs>
      </section>

      <section aria-labelledby="mcp-tools-title" className="grid gap-5 border-t border-border pt-8">
        <h2 id="mcp-tools-title" className="text-xl font-medium">{t('mcpTools')}</h2>
        <dl className="grid gap-6">
          <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
            <dt className="font-mono text-sm">search_projects</dt>
            <dd className="text-sm leading-relaxed text-muted-foreground">{t('mcpSearchTool')}</dd>
          </div>
          <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
            <dt className="font-mono text-sm">get_project</dt>
            <dd className="text-sm leading-relaxed text-muted-foreground">{t('mcpGetTool')}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="mcp-example-title" className="grid gap-3">
        <h2 id="mcp-example-title" className="text-xl font-medium">{t('mcpTryTitle')}</h2>
        <p className="text-base leading-relaxed">{t('mcpExample')}</p>
        <div><CopyButton value={t('mcpExample')} label={t('mcpCopyExample')} /></div>
      </section>

      <section aria-labelledby="mcp-boundaries-title" className="grid gap-3 border-t border-border pt-8">
        <h2 id="mcp-boundaries-title" className="text-base font-medium">{t('mcpBoundariesTitle')}</h2>
        <ul className="grid list-disc gap-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>{t('mcpSnapshot')}</li>
          <li>{t('mcpPrivacy')}</li>
          <li>{t('mcpCost')}</li>
        </ul>
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
          <a href={MCP_DOCUMENT_PATH} className={`${linkStyle} inline-flex min-h-10 items-center`}>{t('mcpDocument')}</a>
          <a href={localizedPath('/', locale)} className={`${linkStyle} inline-flex min-h-10 items-center text-muted-foreground`}>{t('browseDirectory')}</a>
        </div>
      </section>
    </main>
  </div>
}
