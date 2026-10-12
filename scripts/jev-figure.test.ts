/**
 * [INPUT]: 依赖本地决策教学模型、生成 SVG 与三语言文案
 * [OUTPUT]: 验证自动出口轮换、快速轨迹、静态产物、真实圆角实体遮挡、线端和教学边界
 * [POS]: scripts 的 Jev 图离线护栏；不请求模型 API
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { CYCLE_SECONDS, INPUT_END, DECISION_END, OUTPUT_END, RESET_START, REST_TIME, DEMO_OPTIONS, OUTPUT_Y, decisionPose } from '../src/components/jev-figure/model.ts'
import { FIGURE_SVG, SOLID_COUNT } from '../src/components/jev-figure/art.generated.ts'
import { en } from '../src/i18n/locales/en.ts'
import { zh } from '../src/i18n/locales/zh.ts'
import { ja } from '../src/i18n/locales/ja.ts'

test('teaching sorter automatically visits every predefined output and repeats', () => {
  assert.deepEqual(DEMO_OPTIONS, ['search', 'code', 'review'])
  for (const [index, y] of OUTPUT_Y.entries()) {
    const start = CYCLE_SECONDS * index
    assert.equal(decisionPose(start + (INPUT_END + DECISION_END) / 2).phase, 'decision')
    const output = decisionPose(start + REST_TIME)
    assert.equal(output.index, index)
    assert.equal(output.y, y)
    assert.equal(output.headY, y)
    assert.equal(output.phase, 'output')
    assert.equal(output.x, 108)
    assert.equal(decisionPose(start + CYCLE_SECONDS * 3 + REST_TIME).index, index)
  }
})

test('sorter pose is bounded and continuous between moving phases', () => {
  for (let selected = 0; selected < 3; selected++) {
    for (let time = 0; time < CYCLE_SECONDS; time += 0.01) {
      const pose = decisionPose(time + selected * CYCLE_SECONDS)
      assert.ok(pose.x >= -104 && pose.x <= 108)
      assert.ok(Math.abs(pose.y) <= 44 && Math.abs(pose.headY) <= 44)
      assert.ok(pose.opacity >= 0 && pose.opacity <= 1)
    }
    for (const boundary of [INPUT_END, DECISION_END, OUTPUT_END, RESET_START]) {
      const before = decisionPose(boundary + selected * CYCLE_SECONDS - 0.00001)
      const after = decisionPose(boundary + selected * CYCLE_SECONDS + 0.00001)
      for (const key of ['x', 'y', 'headY'] as const) assert.ok(Math.abs(before[key] - after[key]) < 0.001)
    }
  }
  assert.deepEqual(decisionPose(NaN), decisionPose(0))
  assert.deepEqual(decisionPose(Infinity), decisionPose(0))
  assert.deepEqual(decisionPose(-1), decisionPose(0))
})

test('fast decision beat leaves a readable result without pretending to benchmark Jev', () => {
  assert.ok(Math.abs(DECISION_END - INPUT_END - 0.03) < 0.00001)
  assert.equal(CYCLE_SECONDS, 0.3)
  assert.equal(decisionPose(REST_TIME).opacity, 1)
  assert.equal(decisionPose(0).opacity, 0)
  assert.equal(decisionPose(CYCLE_SECONDS - 0.01).opacity, 0)
})

test('offline Anatomy art is reproducible and has no executable or external markup', () => {
  execFileSync(process.execPath, ['scripts/generate-jev-figure.mjs', '--check'])
  assert.ok(SOLID_COUNT >= 40 && SOLID_COUNT <= 80)
  assert.equal([...FIGURE_SVG.matchAll(/class="iso-solid"/g)].length, SOLID_COUNT)
  assert.equal([...FIGURE_SVG.matchAll(/data-packet=""/g)].length, 1)
  assert.equal([...FIGURE_SVG.matchAll(/data-head=""/g)].length, 1)
  assert.doesNotMatch(FIGURE_SVG, /<(?:script|foreignObject|image|text)\b|\bon\w+=|(?:href|src)=/i)
})

test('every language identifies the illustration as local rather than live inference', () => {
  for (const catalog of [en, zh, ja]) {
    for (const key of ['jevFigureTitle', 'jevFigureDescription', 'jevDemoDisclaimer', 'jevDemoRouting', 'jevDemoPlay', 'jevDemoPause'] as const) assert.ok(catalog[key].length > 0)
    assert.match(catalog.jevDemoDisclaimer, /Jev/)
    for (const primitive of ['Choice', 'Score', 'Noul']) assert.ok(catalog.jevFigureDescription.includes(primitive))
  }
})

test('every open detail line resolves onto an outline rather than floating', () => {
  // ---- 本图只使用 M/L/Z 折线；每个实体的变换均为平移 ----
  // 检查本地投影即可，无需启动上游的独立 Chrome 截图工具。
  type Point = [number, number]
  const paths: { points: Point[]; detail: boolean; closed: boolean }[] = []
  const stack: Point[] = [[0, 0]]
  for (const token of FIGURE_SVG.matchAll(/<g\b[^>]*>|<\/g>|<path\b[^>]*\/>/g)) {
    const tag = token[0]
    if (tag.startsWith('<g')) {
      const move = /transform="translate\(([-\d.]+) ([-\d.]+)\)"/.exec(tag)
      const parent = stack.at(-1)!
      stack.push([parent[0] + Number(move?.[1] ?? 0), parent[1] + Number(move?.[2] ?? 0)])
    } else if (tag === '</g>') stack.pop()
    else if (/class="iso-line/.test(tag)) {
      const d = /\bd="([^"]*)"/.exec(tag)![1]
      assert.doesNotMatch(d, /[ACQHVS]/i, 'Extend the checker before introducing curved paths')
      for (const subpath of d.match(/M[^M]*/g) ?? []) {
        const values = (subpath.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
        const offset = stack.at(-1)!
        const points: Point[] = []
        for (let i = 0; i < values.length; i += 2) points.push([values[i] + offset[0], values[i + 1] + offset[1]])
        paths.push({ points, closed: /Z$/.test(subpath), detail: !/iso-edge|iso-crease|iso-bevel|data-free/.test(tag) })
      }
    }
  }
  const distance = (p: Point, a: Point, b: Point) => {
    const dx = b[0] - a[0], dy = b[1] - a[1]
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)))
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
  }
  let checked = 0
  for (const current of paths.filter((item) => item.detail && !item.closed)) {
    const ends = [current.points[0], current.points.at(-1)!]
    const distances = ends.map((end) => Math.min(...paths.filter((item) => item !== current).flatMap((other) => {
      const points = other.closed ? [...other.points, other.points[0]] : other.points
      return points.slice(1).map((point, index) => distance(end, points[index], point))
    })))
    const short = current.points.length === 2 && Math.hypot(ends[0][0] - ends[1][0], ends[0][1] - ends[1][1]) <= 7
    assert.ok(short ? Math.min(...distances) <= 2 : Math.max(...distances) <= 1, `Floating line ends: ${distances}`)
    checked++
  }
  assert.ok(checked >= 20, 'The ruler detail must be present')
})

test('rounded hopper and all output rims occlude cards in true camera depth throughout the cycle', () => {
  // ---- 审计读取生成器同源几何，不以矩形包围盒替代圆角实体 ----
  type Solid = { id: number; plan: { x: number; y: number; w: number; d: number; r: number }; z: number; h: number; motion: string }
  type Point = [number, number, number]
  const { solids, projection, order } = JSON.parse(execFileSync(process.execPath, ['scripts/generate-jev-figure.mjs', '--geometry'], { encoding: 'utf8' })) as {
    solids: Solid[]; order: number[]; projection: { origin: number[]; scale: number; azimuth: number; elevation: number }
  }
  const a = projection.azimuth * Math.PI / 180, e = projection.elevation * Math.PI / 180
  const sa = Math.sin(a), ca = Math.cos(a), se = Math.sin(e), ce = Math.cos(e)
  const scale = projection.scale * Math.sqrt(1.6)
  const direction: Point = [ca * ce, sa * ce, se]
  const project = ([x, y, z]: Point) => [(x * sa - y * ca) * scale, ((x * ca + y * sa) * se - z * ce) * scale]
  const mesh = (solid: Solid, pose: ReturnType<typeof decisionPose>) => {
    const { x, y, w, d } = solid.plan
    const r = Math.max(0, Math.min(solid.plan.r, w / 2, d / 2))
    const dx = solid.motion === 'packet' ? pose.x : 0
    const dy = solid.motion === 'packet' ? pose.y : solid.motion === 'head' ? pose.headY : 0
    // Anatomy roundedPlan 使用四段圆角，slabOf 的倒角仅是表面描线。
    const ring = [[x + w - r, y + r, -90], [x + w - r, y + d - r, 0], [x + r, y + d - r, 90], [x + r, y + r, 180]].flatMap(([cx, cy, start]) =>
      Array.from({ length: 5 }, (_, i) => [cx + r * Math.cos((start + i * 22.5) * Math.PI / 180) + dx, cy + r * Math.sin((start + i * 22.5) * Math.PI / 180) + dy]))
    const planes: { normal: Point; bound: number }[] = ring.flatMap(([x0, y0], i) => {
      const [x1, y1] = ring[(i + 1) % ring.length]
      const nx = y1 - y0, ny = x0 - x1, length = Math.hypot(nx, ny)
      // 厚度等于圆角直径时，相邻圆角共享端点，不生成零长度侧面。
      if (length < 1e-9) return []
      return [{ normal: [nx / length, ny / length, 0] as Point, bound: (nx * x0 + ny * y0) / length }]
    })
    planes.push({ normal: [0, 0, 1], bound: solid.z + solid.h }, { normal: [0, 0, -1], bound: -solid.z })
    const points = ring.flatMap(([x0, y0]) => [project([x0, y0, solid.z]), project([x0, y0, solid.z + solid.h])])
    const bounds = [Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1])), Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))]
    return { id: solid.id, planes, bounds }
  }
  const dot = (a: Point, b: Point) => a.reduce((sum, n, i) => sum + n * b[i], 0)
  const hit = (item: ReturnType<typeof mesh>, px: number, py: number) => {
    const u = px / scale, v = py / scale
    const origin: Point = [sa * u + ca * se * v, -ca * u + sa * se * v, -ce * v]
    let near = -Infinity, far = Infinity
    for (const { normal, bound } of item.planes) {
      const slope = dot(normal, direction), distance = bound - dot(normal, origin)
      if (Math.abs(slope) < 1e-9) { if (distance < 0) return null }
      else if (slope > 0) far = Math.min(far, distance / slope)
      else near = Math.max(near, distance / slope)
    }
    // 跳过轮廓抗锯齿与切线接触，不掩盖实体内部的反向遮挡。
    return far - near > 0.5 ? far : null
  }
  const packet = solids.find(s => s.motion === 'packet')!
  const hopper = solids.filter(s => s.plan.x <= -80 && s.plan.y >= -22 && s.plan.y < 22 && s.z >= 5)
  const outlets = solids.filter(s => s.plan.x >= 80)
  const conflicts = (items: ReturnType<typeof mesh>[], paintOrder: number[]) => {
    const ranks = new Map(paintOrder.map((id, rank) => [id, rank]))
    let checked = 0, wrong = 0
    const pairs: Record<string, number> = {}
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const left = items[i], right = items[j]
      const minX = Math.max(left.bounds[0], right.bounds[0]), minY = Math.max(left.bounds[1], right.bounds[1])
      const maxX = Math.min(left.bounds[2], right.bounds[2]), maxY = Math.min(left.bounds[3], right.bounds[3])
      for (let x = minX + 0.37; x < maxX; x += 0.75) for (let y = minY + 0.29; y < maxY; y += 0.75) {
        const ld = hit(left, x, y), rd = hit(right, x, y)
        if (ld === null || rd === null || Math.abs(ld - rd) < 0.5) continue
        checked++
        if ((ld > rd) !== (ranks.get(left.id)! > ranks.get(right.id)!)) { wrong++; const key = `${left.id}/${right.id}`; pairs[key] = (pairs[key] ?? 0) + 1 }
      }
    }
    return { checked, wrong, pairs }
  }
  const rest = decisionPose(REST_TIME)
  const outletResult = conflicts(outlets.map(s => mesh(s, rest)), order)
  assert.equal(outletResult.wrong, 0, `Output rims must respect their neighboring faces: ${JSON.stringify(outletResult)}`)
  const hopperMeshes = hopper.map(s => mesh(s, rest))
  const staticResult = conflicts(hopperMeshes, order)
  assert.ok(staticResult.checked > 100, 'Audit must cover overlapping hopper interiors')
  assert.equal(staticResult.wrong, 0, 'Far hopper walls must precede the pile and near rim')
  const farWalls = hopper.filter(s => s.plan.x === -132 && s.z === 7 && s.plan.y < 0).map(s => s.id)
  const oldHopperOrder = [...order.filter(id => !farWalls.includes(id)), ...farWalls]
  const brokenHopper = conflicts(hopperMeshes, oldHopperOrder)
  assert.ok(brokenHopper.wrong > 0, `Original far-wall-last regression must fail this audit: ${JSON.stringify(brokenHopper)}`)
  const oldPacketOrder = [...order.filter(id => id !== packet.id), packet.id]
  for (let index = 0; index < 3; index++) {
    const pose = decisionPose(index * CYCLE_SECONDS + REST_TIME)
    const brokenPacket = conflicts([...outlets, packet].map(s => mesh(s, pose)), oldPacketOrder)
    assert.ok(brokenPacket.wrong > 0, `Original packet-over-rim regression must fail for output ${index}: ${JSON.stringify(brokenPacket)}`)
  }
  let checked = 0
  for (let index = 0; index < 3; index++) for (let step = 0; step <= 30; step++) {
    const pose = decisionPose(index * CYCLE_SECONDS + step * CYCLE_SECONDS / 31)
    const moving = mesh(packet, pose)
    const neighbors = [...hopper, ...outlets].map(s => mesh(s, pose))
    for (const neighbor of neighbors) {
      const result = conflicts([neighbor, moving], order)
      checked += result.checked
      assert.equal(result.wrong, 0, `Card must respect rim depth: output ${index}, step ${step}, solid ${neighbor.id}`)
    }
  }
  assert.ok(checked > 1000, 'Audit must include packet/rim overlaps, not only isolated geometry')
})
