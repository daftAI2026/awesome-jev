/**
 * [INPUT]: 依赖路由语言、公开入口与 OpenFree 原版布局/品牌资产
 * [OUTPUT]: 提供 AgentsFooter 机器文档导航和五个品牌外链
 * [POS]: components 的独立 Footer 区块；App 保留社区说明与页脚布局
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useI18n } from '@/i18n'
import { AGENT_DOCUMENT_PATHS, agentChatLinks } from '@/lib/agent-links'

export function AgentsFooter() {
  const { locale, t } = useI18n()
  return (
    <section aria-labelledby="footer-agents" className="mt-10">
      <nav aria-label={t('agentDocuments')} className="grid gap-3 border-t border-border pt-7 text-sm">
        <h2 id="footer-agents" className="font-medium">Agents</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-muted-foreground">
        {AGENT_DOCUMENT_PATHS.map((path) => (
          <a key={path} href={path}
            className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            {path.replace(/^\/(agents\/)?/, '')}
          </a>
        ))}
        </div>
      </nav>
      <div className="flex flex-col gap-5 py-7 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{t('agentDescription')}</p>
        <div className="flex shrink-0 items-center gap-2">
          {agentChatLinks(locale).map(({ name, href, icon, monochrome }) => {
            const label = `${t('agentAsk')}: ${name}`
            return (
              <a key={name} href={href} target="_blank" rel="noopener noreferrer" title={label}
                aria-label={label}
                className="inline-flex size-9 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px">
                <img src={icon} width={20} height={20} alt="" aria-hidden="true" loading="lazy"
                  className={monochrome ? 'size-5 object-contain dark:invert' : 'size-5 object-contain'} />
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
