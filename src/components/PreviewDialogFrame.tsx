/**
 * [INPUT]: 依赖 Base UI Dialog、Motion 的 presence/animation controls/arc、preview-motion 几何规则和 React 媒体订阅/Effect Event；触发元素定位完整来源卡片
 * [OUTPUT]: 对外提供 PreviewDialogFrame，统一真实来源飞出/归位、退出卸载与来源失效时的主内容焦点回落
 * [POS]: components 的预览共享外壳，呈现与生命周期集中于此，数据、来源动作和导航历史留在调用方
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Dialog } from '@base-ui/react/dialog'
import { AnimatePresence, arc, motion, useAnimationControls, usePresence, type HTMLMotionProps } from 'motion/react'
import { useEffectEvent, useImperativeHandle, useLayoutEffect, useMemo, useRef, useSyncExternalStore, type ReactNode, type RefObject } from 'react'
import { previewOriginTransform } from '@/lib/preview-motion'

interface PreviewDialogFrameProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: RefObject<HTMLElement | null>
  header: ReactNode
  footer: ReactNode
  children: ReactNode
}

const VISIBLE_POSITION = { opacity: 1, x: 0, y: 0, scale: 1 }
const PREVIEW_DURATION = 0.24
const PREVIEW_EASE = [0.22, 1, 0.36, 1] as const
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

// ---- 动态偏好 ----
// Motion 13.4.2 的 hook 仅保留初值；原生订阅保证页面存活期间切换设置也生效。
function subscribeReducedMotion(onChange: () => void) {
  const preference = window.matchMedia(REDUCED_MOTION_QUERY)
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}

function getReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

// ---- 来源与轨迹 ----
// 在打开/复开时接收来源身份；退出时重测它，不读取可能已改成焦点回落目标的 triggerRef。
function PreviewDialogFlight({ triggerRef, reducedMotion, ref, ...props }: HTMLMotionProps<'div'> & {
  triggerRef: RefObject<HTMLElement | null>
  reducedMotion: boolean
}) {
  const scope = useRef<HTMLDivElement>(null)
  const controls = useAnimationControls()
  const [isPresent, safeToRemove] = usePresence()
  // 完成回调跟随 presence 的最新提交，但父级重渲染不能重启同一次退出。
  const completeExit = useEffectEvent(() => safeToRemove?.())
  const sourceRef = useRef<HTMLElement | null>(null)
  const startedRef = useRef(false)
  const path = useMemo(() => arc({ strength: 0.25 }), [])
  useImperativeHandle(ref, () => scope.current!, [])

  useLayoutEffect(() => {
    const popup = scope.current!
    if (isPresent) {
      sourceRef.current = triggerRef.current?.closest<HTMLElement>('[data-preview-origin]') ?? null
    }
    const source = sourceRef.current
    const style = getComputedStyle(popup)
    // 当前 transform 可能尚在飞行；CSS 的固定中心与布局尺寸才是未变形的终点。
    const popupRect = {
      left: Number.parseFloat(style.left) - popup.offsetWidth / 2,
      top: Number.parseFloat(style.top) - popup.offsetHeight / 2,
      width: popup.offsetWidth, height: popup.offsetHeight,
    }
    const origin = previewOriginTransform(source?.isConnected ? source.getBoundingClientRect() : null,
      popupRect, { width: window.innerWidth, height: window.innerHeight })
    const hidden = reducedMotion ? { ...VISIBLE_POSITION, opacity: 0 } : origin
    if (!startedRef.current) {
      // 同步写入起点，避免路由 Activity 的 effect 重放吞掉首帧。
      controls.set(hidden)
      startedRef.current = true
    }
    let active = true
    const animation = controls.start(isPresent ? { ...VISIBLE_POSITION } : hidden, {
      duration: reducedMotion ? 0 : PREVIEW_DURATION, ease: PREVIEW_EASE,
      path: reducedMotion ? undefined : path,
    })
    if (!isPresent) void animation.then(() => { if (active) completeExit() })
    return () => { active = false; controls.stop() }
  }, [controls, isPresent, path, reducedMotion, triggerRef])

  return <motion.div {...props} ref={scope} initial={{ opacity: 0 }} animate={controls} />
}

export function PreviewDialogFrame({ open, onOpenChange, triggerRef, header, footer, children }: PreviewDialogFrameProps) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true)
  const actionsRef = useRef<Dialog.Root.Actions | null>(null)
  const duration = reducedMotion ? 0 : PREVIEW_DURATION

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} actionsRef={actionsRef}>
      <AnimatePresence onExitComplete={() => { if (!open) actionsRef.current?.unmount() }}>
        {open && (
          <Dialog.Portal key="preview" keepMounted>
            <Dialog.Backdrop hidden={false} className="fixed inset-0 z-50 bg-black/40"
              render={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration, ease: PREVIEW_EASE }} />}
            />
            <Dialog.Popup hidden={false} finalFocus={() =>
              triggerRef.current?.isConnected && triggerRef.current.getClientRects().length > 0
                ? triggerRef.current : document.getElementById('main')}
              className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground outline-none"
              render={<PreviewDialogFlight triggerRef={triggerRef} reducedMotion={reducedMotion} />}
            >
              {header}
              <div className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-6">
                <Dialog.Description render={<div />}>{children}</Dialog.Description>
              </div>
              {footer}
            </Dialog.Popup>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
