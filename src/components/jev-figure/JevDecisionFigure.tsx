/**
 * [INPUT]: 依赖教学模型、离线 SVG、三语言文案和浏览器可见性/动态偏好
 * [OUTPUT]: 提供 JevDecisionFigure，自动轮换 Choice 路由示例
 * [POS]: 恢复页的教学图；桌面参与 RecoveryPage 的共享网格行，恢复不依赖播放
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useId, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { DEMO_OPTIONS, REST_TIME, decisionPose } from './model'
import { FIGURE_SVG, PROJECTION } from './art.generated'
import './figure.css'

const translate = (x: number, y: number) => `translate(${PROJECTION.dx[0] * x + PROJECTION.dy[0] * y} ${PROJECTION.dx[1] * x + PROJECTION.dy[1] * y})`
const SVG_MARKUP = { __html: FIGURE_SVG }

export function JevDecisionFigure() {
  const { t } = useI18n()
  const id = useId()
  const scope = useRef<HTMLElement>(null)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const clock = useRef(REST_TIME)

  useEffect(() => {
    const root = scope.current!
    const packet = root.querySelector<SVGGElement>('[data-packet]')!
    const head = root.querySelector<SVGGElement>('[data-head]')!
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false
    let frame = 0
    let last = 0
    const draw = (seconds: number) => {
      const pose = decisionPose(seconds)
      packet.setAttribute('transform', translate(pose.x, pose.y))
      head.setAttribute('transform', translate(0, pose.headY))
      // ---- 卡片淡入/淡出，避免循环首尾在画布上跳跃 ----
      packet.setAttribute('opacity', String(pose.opacity))
      root.dataset.phase = pose.phase
      root.dataset.output = DEMO_OPTIONS[pose.index]
    }
    const active = () => visible && !document.hidden && !paused && !preference.matches
    const tick = (now: number) => {
      frame = 0
      if (!active()) return
      clock.current += last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      draw(clock.current)
      frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      cancelAnimationFrame(frame)
      frame = 0
      last = 0
      setReduced(preference.matches)
      if (preference.matches) draw(REST_TIME)
      else draw(clock.current)
      root.dataset.playback = active() ? 'playing' : 'paused'
      if (active()) frame = requestAnimationFrame(tick)
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
    observer.observe(root)
    preference.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    draw(clock.current)
    sync()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      preference.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [paused])

  return <figure ref={scope} className="jev-figure min-w-0 lg:row-span-3 lg:grid lg:grid-rows-subgrid" aria-labelledby={`${id}-title`} data-jev-figure="">
    <figcaption>
      <div className="flex items-baseline justify-between gap-4 text-xs text-muted-foreground">
        <span className="font-mono">JEV / SYSTEM ONE</span>
        <span>{t('jevDemoLabel')}</span>
      </div>
      <h2 id={`${id}-title`} className="mt-3 text-xl leading-snug font-medium text-balance sm:text-2xl">{t('jevFigureTitle')}</h2>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-pretty text-muted-foreground">{t('jevFigureDescription')}</p>
    </figcaption>
    {/* ---- 图本身提供键盘暂停，不增加选项或播放按钮栏 ---- */}
    <button type="button" className="mt-4 block w-full rounded-md active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:self-end"
      aria-label={t(paused ? 'jevDemoPlay' : 'jevDemoPause')} aria-pressed={paused} disabled={reduced}
      onClick={() => setPaused((value) => !value)}>
      <svg viewBox="64 92 512 288" className="block w-full" aria-hidden="true" focusable="false">
        <g dangerouslySetInnerHTML={SVG_MARKUP} />
      </svg>
    </button>
    <div data-jev-routing="" className="mt-4 border-t border-border pt-4 lg:mt-8 lg:pt-6">
      <p className="text-sm leading-relaxed">{t('jevDemoRouting')} <code className="font-mono">{DEMO_OPTIONS.join(' / ')}</code></p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t('jevDemoDisclaimer')} <a className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring" href="https://docs.typesafe.ai/introduction">{t('jevDemoSource')}</a></p>
    </div>
  </figure>
}
