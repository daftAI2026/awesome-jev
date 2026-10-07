/**
 * [INPUT]: 依赖 Agents 入口、三语言规则、SVG 与授权文本
 * [OUTPUT]: 验证公开 q 参数、端点、品牌安全与授权完整性
 * [POS]: scripts 的 Footer 离线护栏，不向第三方发送问题
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { AGENT_PROVIDERS, agentChatLinks, agentPrompt } from '../src/lib/agent-links.ts'
import { LOCALES } from '../src/lib/locale-routes.ts'

test('five providers share the same safely encoded public prompt in each locale', () => {
  for (const locale of LOCALES) {
    const links = agentChatLinks(locale)
    assert.deepEqual(links.map((item) => item.name), ['ChatGPT', 'Claude', 'Perplexity', 'Gemini', 'Grok'])
    for (const item of links) {
      const url = new URL(item.href)
      const provider = AGENT_PROVIDERS.find((value) => value.name === item.name)!
      assert.equal(url.origin, new URL(provider.endpoint).origin)
      assert.equal(url.pathname, new URL(provider.endpoint).pathname)
      assert.equal(url.searchParams.get('q'), agentPrompt(locale))
      assert.equal(url.protocol, 'https:')
      assert.equal(url.username + url.password + url.hash, '')
      assert.ok(url.searchParams.get('q')?.includes('https://awesomejev.cc/llms.txt https://awesomejev.cc/llms-full.txt'))
      assert.doesNotMatch(item.href, /billflare|localhost|127\.0\.0\.1|token|\/Users\//i)
      if (item.name === 'Gemini') assert.equal(url.searchParams.get('udm'), '50')
    }
  }
  assert.equal(new Set(LOCALES.map(agentPrompt)).size, 3)
})

test('SVG assets match the reference, stay self-contained and retain provenance', () => {
  const hashes = ['a4b4dae5e28790a0fb3dc7b5d8bb199b0dd6938a002e52a8b6355394c321718e',
    '0df6dad23995f5a76c6db8cc2a4e646ff45bd7a0626ef98662a7025646e5eea1',
    '8353f3ab20822f1a933224b0ea32cc39f0c32d5740f4af8c254b0f418e0a3a70',
    '9433d6ef1a443b17ad22f46dae819b69b3a18ca7157813d5c91e85fdedc36760',
    '1cba91592be1921bde6c1fd5984e789a6077def2bd23ed5d7b595d15e70f2137']
  for (const provider of AGENT_PROVIDERS) {
    const svg = readFileSync(`public${provider.icon}`, 'utf8')
    assert.match(svg, /<svg\b/)
    assert.equal(createHash('sha256').update(svg).digest('hex'), hashes[AGENT_PROVIDERS.indexOf(provider)], provider.name)
    assert.doesNotMatch(svg, /<script\b|<foreignObject\b|\bon\w+\s*=|(?:xlink:)?href\s*=\s*["'](?!#)|url\(\s*["']?(?!#)/i)
    assert.equal(provider.monochrome, ['ChatGPT', 'Grok'].includes(provider.name))
  }
  assert.match(readFileSync('public/agent-logos/LICENSE.txt', 'utf8'), /MIT License/)
  assert.match(readFileSync('public/agent-logos/LICENSE.txt', 'utf8'), /Permission is hereby granted/)
  assert.match(readFileSync('public/agent-logos/README.md', 'utf8'), /1\.95\.1/)
})
