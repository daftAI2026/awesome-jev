import { useEffect, useRef, type ReactNode } from 'react'
import StarBorder from '@/components/StarBorder'
import '@/components/StarBorderProject.css'

export function FeaturedProjectBorder({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let visible = false
    const syncAnimation = () => {
      container.dataset.starActive = String(visible && !document.hidden)
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      syncAnimation()
    })
    observer.observe(container)
    document.addEventListener('visibilitychange', syncAnimation)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', syncAnimation)
    }
  }, [])

  return (
    <div ref={containerRef} className="group relative">
      <StarBorder
        as="div"
        className="project-star-border"
        color="var(--ring)"
        speed="5s"
        thickness={1}
        backgroundColor="var(--card)"
        textColor="var(--card-foreground)"
        borderColor="var(--border)"
      >
        {children}
      </StarBorder>
    </div>
  )
}
