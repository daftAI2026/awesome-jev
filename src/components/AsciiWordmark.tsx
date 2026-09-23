import { useLayoutEffect, useRef } from 'react'
import bannerSrc from '../../scripts/awesome-jev-banner.txt?raw'

const banner = bannerSrc
  .split('\n')
  .filter((ln) => ln.trim().length > 0)
  .join('\n')

export function AsciiWordmark() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLPreElement>(null)

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const pre = preRef.current
    if (!wrap || !pre) return

    const fit = () => {
      pre.style.fontSize = '16px'
      const width = wrap.clientWidth
      const natural = pre.scrollWidth
      if (width <= 0 || natural <= 0) return
      pre.style.fontSize = `${Math.max(4, (16 * width) / natural)}px`
    }

    fit()
    let frame = 0
    let previousWidth = wrap.clientWidth
    const ro = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width
      if (width === previousWidth) return
      previousWidth = width
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(fit)
    })
    ro.observe(wrap)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={wrapRef} className="min-w-0 w-full">
      <pre
        ref={preRef}
        aria-hidden="true"
        className="overflow-hidden font-mono leading-tight tracking-tight whitespace-pre text-foreground select-none"
      >
        {banner}
      </pre>
    </div>
  )
}
