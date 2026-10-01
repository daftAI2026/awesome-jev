/**
 * [INPUT]: 依赖 DecryptedText、语言路径与系统减少动态效果偏好
 * [OUTPUT]: 对外提供 DecryptedBrand 可访问品牌链接
 * [POS]: components 的品牌适配器，为目录和独立页面提供同一返回入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useState, type MouseEvent } from 'react'
import DecryptedText from './DecryptedText'
import { useI18n } from '@/i18n'
import { localizedPath } from '@/lib/locale-routes'

const LABEL = 'Awesome JEV'

export function DecryptedBrand({ onClick }: { onClick: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const { locale } = useI18n()
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(preference.matches)
    const onChange = (event: MediaQueryListEvent) => setReduceMotion(event.matches)
    preference.addEventListener('change', onChange)
    return () => preference.removeEventListener('change', onChange)
  }, [])

  return (
    <a href={localizedPath('/', locale)} aria-label={LABEL} onClick={onClick}
      className="relative inline-block whitespace-nowrap rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <span aria-hidden="true" className="invisible">{LABEL}</span>
      <span aria-hidden="true" className="absolute inset-0">
        {reduceMotion ? LABEL : <DecryptedText text={LABEL} speed={100} maxIterations={10} sequential
          useOriginalCharsOnly={false} revealDirection="start" animateOn="hover" clickMode="once"
          style={{ whiteSpace: 'nowrap' }} />}
      </span>
    </a>
  )
}
