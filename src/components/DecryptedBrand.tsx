import { useEffect, useState, type MouseEvent } from 'react'
import DecryptedText from './DecryptedText'

const LABEL = 'Awesome JEV'

export function DecryptedBrand({ onClick }: { onClick: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const [reduceMotion, setReduceMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event: MediaQueryListEvent) => setReduceMotion(event.matches)
    preference.addEventListener('change', onChange)
    return () => preference.removeEventListener('change', onChange)
  }, [])

  return (
    <a href="/" aria-label={LABEL} onClick={onClick}
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
