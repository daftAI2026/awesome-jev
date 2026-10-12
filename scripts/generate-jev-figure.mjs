/**
 * [INPUT]: 依赖项目级 Anatomy 的 MIT iso-kit、固定世界坐标与前后遮挡层
 * [OUTPUT]: 生成可信 SVG；--check 检查产物，--geometry 提供同源审计几何
 * [POS]: scripts 的离线插图工具；kit 不进入浏览器或 Worker 请求链
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as k from '../.agents/skills/anatomy/kit/iso-kit.mjs'

// ---- 世界：底座、输入料仓、横向分选滑台、三个输出槽 ----
const base = { x: -144, y: -83, w: 294, d: 166, r: 8 }
const P = k.fitProjection(k.boxCorners(base, -15, 83), 640, 400, { pad: 34, azimuth: 48, elevation: 30 })
const parts = []
let count = 0
const solids = []
let motion = 'static'
const line = (d, tone = 'lo', free = false) => k.lineSvg(d, { tone, free })
const dots = (points) => k.dotsSvg(points.map((point) => k.iso(point, P)), { size: 0.6 })
const slab = (plan, z, h, tone = 'mid', inner = '') => {
  count++
  solids.push({ id: count, plan, z, h, motion })
  return k.solidSvg(k.slabOf(plan, z, h, P, 4, 0.6), { tone, inner }).replace('<g', `<g data-solid-id="${count}"`)
}
const put = (plan, z, h, tone, inner) => parts.push(slab(plan, z, h, tone, inner))
const plan = (x, y, w, d, r = 1) => ({ x, y, w, d, r })
for (const [x, y] of k.corners(base, 18).sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))) {
  put(plan(x - 7, y - 7, 14, 14, 3), -15, 4, 'lo')
  put(plan(x - 5, y - 5, 10, 10, 2), -11, 3, 'lo')
}
put(base, -8, 8, 'lo', line(k.planOutline(k.insetPlan(base, 4), 0, P)))
parts.push(dots(k.corners(base, 9).map(([x, y]) => [x, y, 0])))
put(plan(-135, -72, 274, 144, 4), 0, 5, 'lo')
// ---- 轨道和承载面；细节闭合在所属零件表面 ----
for (const y of [-69, 66]) {
  put(plan(-71, y, 140, 3), 5, 3, 'mid')
  for (const x of [-66, 62]) parts.push(dots([[x, y + 1.5, 8]]))
}
for (const x of [-70, 65]) put(plan(x, -66, 4, 132), 5, 3, 'mid')
const strip = plan(-61, 57, 120, 5)
put(strip, 5, 0.8, 'lo')
const ticks = k.topTicks(-58, 56, 4, 5, 57, 5.8, [1.8, 3.5], P)
parts.push(line(ticks.minor), line(ticks.major, 'mid'))
for (const x of [-70, 60]) for (const y of [-51, 51]) put(plan(x - 5, y - 5, 10, 10, 1), 5, 10, 'lo')
put(plan(-80, -56, 160, 112, 3), 15, 4, 'lo')
// ---- 输入料仓：后挡板、托块和叠卡先画；前挡板留到活动卡片之后 ----
put(plan(-132, -22, 52, 44, 2), 5, 2, 'mid')
put(plan(-132, -22, 52, 2), 7, 11, 'mid')
put(plan(-132, -20, 2, 40), 7, 11, 'mid')
put(plan(-122, -14, 38, 28, 1), 7, 6, 'lo')
for (let i = 0; i < 5; i++) put(plan(-122 + i * 1.2, -14, 32, 28, 1), 13 + i * 1.2, 1.2, 'lo')
const foreground = [slab(plan(-132, 20, 52, 2), 7, 11, 'mid')]
// ---- 输出槽：底板与后挡板在卡片后；近侧和端面挡板在卡片前 ----
for (const y of [-44, 0, 44]) {
  put(plan(80, y - 18, 53, 36, 2), 5, 14, 'mid')
  put(plan(80, y - 18, 53, 2), 19, 4, 'mid')
  foreground.push(slab(plan(131, y - 16, 2, 32), 19, 4, 'mid'))
  foreground.push(slab(plan(80, y + 16, 53, 2), 19, 4, 'mid'))
}
// ---- 先画后支架，再画活动件，最后画前支架 ----
const support = (y) => {
  let svg = slab(plan(-8, y - 6, 16, 12, 2), 5, 5, 'mid')
  svg += slab(plan(-5, y - 4, 10, 8), 10, 46, 'mid')
  svg += slab(plan(-8, y - 6, 16, 12, 2), 56, 4, 'mid')
  svg += dots([[-4, y, 60], [4, y, 60]])
  return svg
}
parts.push(support(-62))
// ---- 唯一高亮主体：输入上下文卡；没有概率或耗时读数 ----
const cardPlan = plan(-13, -12, 26, 24, 1)
motion = 'packet'
let card = slab(cardPlan, 19, 1.6, 'hi')
card = `<g data-packet="" data-lit="">${card}${line(k.planOutline(k.insetPlan(cardPlan, 3), 20.6, P), 'hi')}${[-4, 0, 4].map((y) => line(k.lineOnTop([-7, y], [6, y], 20.6, P), 'hi', true)).join('')}</g>`
motion = 'static'
// 固定前景同时遮挡输入和输出卡片；不靠运行时 z-index 或重复卡片。
parts.push(card, ...foreground)
// ---- 全长横梁独立于滑动读头；上下表面有真实间隙 ----
put(plan(-5, -66, 10, 132, 2), 60, 5, 'mid')
motion = 'head'
const head = slab(plan(-10, -9, 20, 18, 2), 65, 5, 'mid')
  + slab(plan(-12, -11, 24, 22, 2), 70, 7, 'mid')
  + slab(plan(-8, -7, 16, 14, 1), 77, 1, 'mid')
  + dots([[-7, -6, 78], [7, 6, 78]])
motion = 'static'
parts.push(`<g data-head="">${head}</g>`)
parts.push(support(62))
// ---- 三个机械按键与铭牌；仅闭合几何，不画悬空说明线 ----
for (let i = 0; i < 3; i++) {
  put(plan(-130 + i * 16, 49, 13, 13, 2), 5, 2, 'lo')
  put(plan(-128 + i * 16, 51, 9, 9, 1), 7, 3, 'mid')
}
put(plan(-123, -61, 40, 17, 2), 5, 1, 'lo', line(k.planOutline(plan(-120, -58, 34, 11), 6, P), 'faint'))
const origin = k.iso([0, 0, 0], P)
const dx = k.iso([1, 0, 0], P).map((v, i) => v - origin[i])
const dy = k.iso([0, 1, 0], P).map((v, i) => v - origin[i])
const move = (x, y) => `translate(${dx[0] * x + dy[0] * y} ${dx[1] * x + dy[1] * y})`
const svg = parts.join('').replace('data-packet=""', `data-packet="" transform="${move(108, -44)}"`).replace('data-head=""', `data-head="" transform="${move(0, -44)}"`)
const output = `/**
 * [INPUT]: 依赖 scripts/generate-jev-figure.mjs 的固定几何和 Anatomy MIT kit
 * [OUTPUT]: 提供 FIGURE_SVG、PROJECTION 和 SOLID_COUNT；禁止手改生成路径
 * [POS]: Jev 图的可信静态产物；上游许可见 .agents/skills/anatomy/LICENSE
 * Copyright (c) 2026 Ryan. MIT 许可完整文本见 public/anatomy-LICENSE.txt
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export const FIGURE_SVG = ${JSON.stringify(svg)}
export const PROJECTION = ${JSON.stringify({ dx, dy })}
export const SOLID_COUNT = ${count}
`
const target = fileURLToPath(new URL('../src/components/jev-figure/art.generated.ts', import.meta.url))
if (process.argv.includes('--geometry')) {
  const order = [...svg.matchAll(/data-solid-id="(\d+)"/g)].map((match) => Number(match[1]))
  console.log(JSON.stringify({ projection: P, solids, order }))
} else if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== output) throw new Error('Jev figure is stale; run npm run figure:generate')
} else writeFileSync(target, output)
if (!process.argv.includes('--geometry')) console.log(`Jev figure: ${count} solids, ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KiB SVG`)
