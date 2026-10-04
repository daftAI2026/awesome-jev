/**
 * [INPUT]: 依赖 React 生命周期、StarBorder、项目边框样式及浏览器可见性观察
 * [OUTPUT]: 对外提供 FeaturedProjectBorder，将子卡片包装为离屏/后台暂停的装饰边框
 * [POS]: components 的高星卡片适配器，由 ItemCard 决定启用，不在上游装饰组件中混入目录业务
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
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
