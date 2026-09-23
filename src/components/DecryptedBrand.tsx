import { useEffect, useRef, useState, type MouseEvent } from 'react'

const LABEL = 'Awesome JEV'
const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+'
const SPEED_MS = 60

function scramble(revealedCount: number): string {
  return Array.from(LABEL, (character, index) => {
    if (character === ' ' || index < revealedCount) return character
    return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
  }).join('')
}

export function DecryptedBrand({ onClick }: { onClick: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const [display, setDisplay] = useState(LABEL)
  const anchorRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let interval: ReturnType<typeof setInterval> | undefined
    let revealedCount = 0
    let started = false

    const finish = () => {
      if (interval) clearInterval(interval)
      interval = undefined
      setDisplay(LABEL)
    }

    const observer = new IntersectionObserver((entries) => {
      if (started || !entries.some((entry) => entry.isIntersecting)) return
      started = true
      observer.disconnect()
      if (motionPreference.matches) return

      interval = setInterval(() => {
        revealedCount += 1
        setDisplay(scramble(revealedCount))
        if (revealedCount >= LABEL.length) finish()
      }, SPEED_MS)
    }, { root: null, rootMargin: '0px', threshold: 0.1 })

    const onMotionChange = () => {
      if (motionPreference.matches) finish()
    }

    motionPreference.addEventListener('change', onMotionChange)
    observer.observe(anchor)
    return () => {
      observer.disconnect()
      motionPreference.removeEventListener('change', onMotionChange)
      if (interval) clearInterval(interval)
    }
  }, [])

  return (
    <a ref={anchorRef} href="/" aria-label={LABEL} onClick={onClick}
      className="relative inline-block whitespace-nowrap rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <span aria-hidden="true" className="invisible">{LABEL}</span>
      <span aria-hidden="true" className="absolute inset-0 overflow-hidden">{display}</span>
    </a>
  )
}
