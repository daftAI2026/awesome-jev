/**
 * [INPUT]: 依赖 UI 原语/共享预览源码、preview-motion 纯几何与可选 TEST_BUILD_OUTPUT 编译后的样式
 * [OUTPUT]: 对外提供真实卡片端点几何、官方 Motion 组合、稳定退出/复开/焦点回落及动态偏好结构回归检查
 * [POS]: scripts 的绘制性能与动效接入护栏；浏览器另验真实进出轨迹、历史和焦点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { previewOriginTransform } from '../src/lib/preview-motion.ts'

const previewFrame = readFileSync(new URL('../src/components/PreviewDialogFrame.tsx', import.meta.url), 'utf8')

test('project and news previews delegate the modal shell to one frame', () => {
  for (const name of ['GithubProjectDialog', 'NewsDialog']) {
    const source = readFileSync(new URL(`../src/components/${name}.tsx`, import.meta.url), 'utf8')
    assert.match(source, /<PreviewDialogFrame open=\{open && item !== null\}/)
    assert.doesNotMatch(source, /<Dialog\.(Root|Portal|Backdrop|Popup)/)
  }
})

test('preview uses the official memoized arc and Base UI presence composition without timers', () => {
  assert.match(previewFrame, /useMemo\(\(\) => arc\(\{ strength: 0\.25 \}\), \[\]\)/)
  assert.match(previewFrame, /<AnimatePresence onExitComplete=/)
  assert.match(previewFrame, /\{open && \(/)
  assert.match(previewFrame, /<Dialog\.Portal key="preview" keepMounted>/)
  assert.match(previewFrame, /render=\{<PreviewDialogFlight triggerRef=\{triggerRef\}/)
  assert.match(previewFrame, /useAnimationControls\(\)/)
  assert.match(previewFrame, /usePresence\(\)/)
  assert.match(previewFrame, /safeToRemove\?\.\(\)/)
  assert.match(previewFrame, /if \(!open\) actionsRef\.current\?\.unmount\(\)/)
  assert.match(previewFrame, /finalFocus=\{\(\) =>/)
  assert.doesNotMatch(previewFrame, /setTimeout|setInterval|transition-all/)
})


function assertPreviewFlightLifecycle(source: string) {
  assert.match(source, /controls\.set\(hidden\)/)
  assert.ok(source.indexOf('controls.set(hidden)') < source.indexOf('controls.start('), 'Source must be set before flight starts')
  assert.match(source, /animate=\{controls\}/)
  assert.match(source, /<Dialog\.Popup hidden=\{false\}/)
  assert.match(source, /<Dialog\.Backdrop hidden=\{false\}/)
}

test('entry survives effect replay and Base UI cannot hide the retained return flight', () => {
  assertPreviewFlightLifecycle(previewFrame)
  // ---- 反例护栏 ----
  // 坐标仅排队而未同步写入，或保留 DOM 却提前 hidden，都必须使同一断言失败。
  assert.throws(() => assertPreviewFlightLifecycle(previewFrame.replace('controls.set(hidden)', 'void hidden')))
  assert.throws(() => assertPreviewFlightLifecycle(previewFrame.replace('<Dialog.Popup hidden={false}', '<Dialog.Popup')))
})

function assertStableExitCompletion(source: string) {
  assert.match(source, /const completeExit = useEffectEvent\(\(\) => safeToRemove\?\.\(\)\)/)
  assert.match(source, /animation\.then\(\(\) => \{ if \(active\) completeExit\(\) \}\)/)
  const flightDependencies = source.match(/\}, \[controls, isPresent, path, reducedMotion[^\]]*\]\)/)?.[0]
  assert.ok(flightDependencies, 'Flight must declare its animation inputs')
  assert.doesNotMatch(flightDependencies, /safeToRemove|completeExit/)
}

test('presence callback churn does not restart exits and completion reads the latest callback', () => {
  assertStableExitCompletion(previewFrame)
  // ---- 反例护栏 ----
  // 父级刷新可换掉完成回调；把它重新加入依赖或捕获旧值都必须被拦截。
  assert.throws(() => assertStableExitCompletion(previewFrame.replace(
    '[controls, isPresent, path, reducedMotion, triggerRef]',
    '[controls, isPresent, path, reducedMotion, safeToRemove, triggerRef]',
  )))
  assert.throws(() => assertStableExitCompletion(previewFrame.replace(
    'useEffectEvent(() => safeToRemove?.())', '() => safeToRemove?.()',
  )))
})

function assertPreviewRecovery(source: string) {
  assert.match(source, /if \(isPresent\) \{\s*sourceRef\.current = triggerRef\.current\?\.closest/)
  assert.match(source, /triggerRef\.current\?\.isConnected && triggerRef\.current\.getClientRects\(\)\.length > 0/)
  assert.match(source, /\? triggerRef\.current : document\.getElementById\('main'\)/)
}

test('interrupted reopening adopts the selected card and vanished triggers recover main focus', () => {
  assertPreviewRecovery(previewFrame)
  assert.throws(() => assertPreviewRecovery(previewFrame.replace('if (isPresent) {', 'if (!startedRef.current) {')))
  assert.throws(() => assertPreviewRecovery(previewFrame.replace('triggerRef.current?.isConnected && ', '')))
})

test('reduced-motion previews bypass translation, curve and duration', () => {
  assert.match(previewFrame, /useSyncExternalStore\(subscribeReducedMotion, getReducedMotion, \(\) => true\)/)
  assert.match(previewFrame, /preference\.addEventListener\('change', onChange\)/)
  assert.match(previewFrame, /preference\.removeEventListener\('change', onChange\)/)
  assert.match(previewFrame, /const duration = reducedMotion \? 0 : PREVIEW_DURATION/)
  assert.match(previewFrame, /const hidden = reducedMotion \? \{ \.\.\.VISIBLE_POSITION, opacity: 0 \} : origin/)
  assert.match(previewFrame, /path: reducedMotion \? undefined : path/)
})

test('each preview source marks the whole card or row, not just its title', () => {
  for (const name of ['ItemCard', 'GithubList', 'NewsPanel']) {
    const source = readFileSync(new URL(`../src/components/${name}.tsx`, import.meta.url), 'utf8')
    assert.match(source, /data-preview-origin/)
  }
  assert.match(previewFrame, /closest<HTMLElement>\('\[data-preview-origin\]'\)/)
  assert.match(previewFrame, /source\?\.isConnected \? source\.getBoundingClientRect\(\) : null/)
  assert.doesNotMatch(previewFrame, /HIDDEN_POSITION|x: -12|y: 24/)
})

const popup = { left: 300, top: 200, width: 680, height: 500 }
const viewport = { width: 1280, height: 900 }

test('different cards produce their own exact center endpoints with uniform fit scaling', () => {
  const left = { left: 100, top: 500, width: 200, height: 100 }
  const right = { left: 900, top: 600, width: 300, height: 150 }
  assert.deepEqual(previewOriginTransform(left, popup, viewport), { opacity: 0, x: -440, y: 100, scale: 0.2 })
  assert.deepEqual(previewOriginTransform(right, popup, viewport), { opacity: 0, x: 410, y: 225, scale: 0.3 })
})

test('return endpoints follow current card position after scrolling and viewport/popup resizing', () => {
  const source = { left: 16, top: 600, width: 358, height: 300 }
  const mobilePopup = { left: 16, top: 94, width: 358, height: 656 }
  const at = (top: number) => previewOriginTransform({ ...source, top }, mobilePopup, { width: 390, height: 844 })
  assert.equal(at(600).x, 0)
  assert.equal(at(600).y, 328)
  assert.equal(at(400).y, 128)
  assert.equal(at(400).scale, 300 / 656)
})

test('missing, hidden, offscreen or invalid sources fade at the center without a fictional return point', () => {
  for (const source of [null, { left: 0, top: 0, width: 0, height: 100 },
    { left: 0, top: 901, width: 200, height: 100 }, { left: -201, top: 0, width: 200, height: 100 },
    { left: NaN, top: 0, width: 200, height: 100 }]) {
    assert.deepEqual(previewOriginTransform(source, popup, viewport), { opacity: 0, x: 0, y: 0, scale: 1 })
  }
  assert.equal(previewOriginTransform({ left: 0, top: -50, width: 200, height: 100 }, popup, viewport).x, -540)
})

for (const name of ['badge', 'button', 'toggle']) {
  test(`${name} keeps interaction transitions without animating inherited visibility`, () => {
    const source = readFileSync(new URL(`../src/components/ui/${name}.tsx`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /\btransition-all\b/)
    assert.match(source, /\btransition\b/)
  })
}

test('compiled standard transition excludes visibility and preserves color, focus and press feedback', {
  skip: !process.env.TEST_BUILD_OUTPUT,
}, () => {
  const assets = path.join(process.env.TEST_BUILD_OUTPUT!, 'assets')
  const css = readdirSync(assets).filter((name) => name.endsWith('.css'))
    .map((name) => readFileSync(path.join(assets, name), 'utf8')).join('\n')
  const rule = css.match(/(?:^|})\.transition\{([^}]+)}/)
  assert.ok(rule, 'Build must include the standard transition utility')
  const properties = rule[1].match(/transition-property:([^;]+)/)?.[1].split(',').map((value) => value.trim())
  assert.ok(properties)
  assert.ok(!properties.includes('visibility'))
  for (const property of ['color', 'background-color', 'border-color', 'box-shadow', 'opacity', 'translate']) {
    assert.ok(properties.includes(property), `Missing interaction transition: ${property}`)
  }
})
