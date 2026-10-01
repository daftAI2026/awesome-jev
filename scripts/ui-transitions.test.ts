/**
 * [INPUT]: 依赖 UI 原语源码与可选 TEST_BUILD_OUTPUT 编译后的样式
 * [OUTPUT]: 对外提供 visibility 不进入交互过渡、必要视觉属性保留的回归检查
 * [POS]: scripts 的绘制性能护栏；继承显隐不应被通用 transition-all 动画化
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

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
