import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import DecryptedText from './DecryptedText'

const LABEL = 'Awesome JEV'
const REPLAY_HOLD_MS = 1200

export function DecryptedBrand({ onClick }: { onClick: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const anchorRef = useRef<HTMLAnchorElement>(null)
  const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef(false)
  const [active, setActive] = useState(false)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let inView = false
    const updatePlayback = () => {
      const next = inView && !document.hidden && !motionPreference.matches
      activeRef.current = next
      setActive(next)
      if (!next && replayTimerRef.current) {
        clearTimeout(replayTimerRef.current)
        replayTimerRef.current = null
      }
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries.at(-1)
      if (!entry) return
      inView = entry.isIntersecting
      updatePlayback()
    }, { root: null, rootMargin: '0px', threshold: 0.1 })

    observer.observe(anchor)
    document.addEventListener('visibilitychange', updatePlayback)
    motionPreference.addEventListener('change', updatePlayback)
    return () => {
      activeRef.current = false
      observer.disconnect()
      document.removeEventListener('visibilitychange', updatePlayback)
      motionPreference.removeEventListener('change', updatePlayback)
      if (replayTimerRef.current) clearTimeout(replayTimerRef.current)
      replayTimerRef.current = null
    }
  }, [])

  const scheduleReplay = useCallback(() => {
    if (!activeRef.current || replayTimerRef.current) return
    replayTimerRef.current = setTimeout(() => {
      replayTimerRef.current = null
      if (activeRef.current) setCycle((current) => current + 1)
    }, REPLAY_HOLD_MS)
  }, [])

  return (
    <a ref={anchorRef} href="/" aria-label={LABEL} onClick={onClick}
      className="relative inline-block whitespace-nowrap rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <span aria-hidden="true" className="invisible">{LABEL}</span>
      <span aria-hidden="true" className="absolute inset-0 overflow-hidden">
        {active ? <DecryptedText key={cycle} text={LABEL} speed={60} maxIterations={10} sequential
          useOriginalCharsOnly={false} revealDirection="start" animateOn="view" clickMode="once"
          onComplete={scheduleReplay} /> : LABEL}
      </span>
    </a>
  )
}
