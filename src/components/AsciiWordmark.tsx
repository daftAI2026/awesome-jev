/**
 * [INPUT]: 依赖 scripts/awesome-jev-banner.txt 原始字符资产
 * [OUTPUT]: 对外提供 AsciiWordmark 自适应字符标识
 * [POS]: components 的目录字标，不承担页面标题语义
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import bannerSrc from '../../scripts/awesome-jev-banner.txt?raw'

const banner = bannerSrc
  .split('\n')
  .filter((ln) => ln.trim().length > 0)
  .join('\n')

export function AsciiWordmark() {
  return (
    <div className="ascii-wordmark min-w-0 w-full">
      <pre
        aria-hidden="true"
        className="overflow-hidden font-mono leading-tight tracking-tight whitespace-pre text-foreground select-none"
      >
        {banner}
      </pre>
    </div>
  )
}
