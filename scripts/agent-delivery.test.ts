/**
 * [INPUT]: 依赖 TEST_SITE_ORIGIN 真实 Worker、机器文档契约与三语言入口
 * [OUTPUT]: 验证匿名 GET 媒体类型、全部站内互链与实际页脚品牌入口
 * [POS]: scripts 的构建后 HTTP 护栏；verify-delivery 保证零跳过
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { AGENT_DOCUMENT_PATHS, AGENT_PROVIDERS, agentPrompt } from '../src/lib/agent-links.ts'
import { LOCALES, localizedPath } from '../src/lib/locale-routes.ts'
import { SITE_ORIGIN } from '../src/lib/share-image.ts'
import { readFileSync } from 'node:fs'
import { readCatalog } from './catalog.ts'
import { validateNews } from './news-sync.ts'
import { buildAgentDocuments } from './generate-llms.ts'

const origin = process.env.TEST_SITE_ORIGIN
test('anonymous machine documents have correct MIME types and all site links resolve', { skip: !origin }, async () => {
  const paths = new Set<string>()
  const expected = buildAgentDocuments(readCatalog(process.cwd()).rows, validateNews(JSON.parse(readFileSync('data/news.json', 'utf8'))))
  for (const path of AGENT_DOCUMENT_PATHS) {
    const response = await fetch(`${origin}${path}`)
    assert.equal(response.status, 200, path)
    assert.match(response.headers.get('content-type') ?? '', path.endsWith('.txt') ? /^text\/plain\b/ : /^text\/markdown\b/)
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    const document = await response.text()
    const content = path === '/llms.txt' ? expected.llms : path === '/llms-full.txt' ? expected.full :
      expected.documents[path.slice('/agents/'.length) as keyof typeof expected.documents]
    assert.equal(document, content, `Stale build document: ${path}`)
    assert.doesNotMatch(document, /billflare\.dev|https?:\/\/(?:localhost|127\.0\.0\.1)|\/Users\//i)
    for (const match of document.matchAll(/\]\((https?:\/\/[^\s)]+)\)/g)) {
      const url = new URL(match[1])
      if (url.origin === SITE_ORIGIN) paths.add(url.pathname + url.search)
    }
  }
  const queue = [...paths]
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (queue.length) {
      const path = queue.pop()!
      const response = await fetch(`${origin}${path}`, { method: 'HEAD', redirect: 'manual' })
      assert.equal(response.status, 200, `Broken public link: ${path}`)
    }
  }))
})

test('SSR footer emits each locale prompt and accessible safe brand links', { skip: !origin }, async () => {
  for (const locale of LOCALES) {
    const response = await fetch(`${origin}${localizedPath('/', locale)}`)
    assert.equal(response.status, 200)
    const html = await response.text()
    const footer = html.match(/<section aria-labelledby="footer-agents"[\s\S]*?<\/section>/)?.[0]
    assert.ok(footer, locale)
    assert.doesNotMatch(footer, /Google AI Mode/)
    for (const provider of AGENT_PROVIDERS) {
      assert.ok(footer.includes(provider.icon))
      const anchor: string | undefined = [...footer.matchAll(/<a\b[^>]+>/g)].map((match) => match[0]).find((tag) => tag.includes(`: ${provider.name}"`))
      assert.ok(anchor, provider.name)
      assert.match(anchor, /target="_blank"/)
      assert.match(anchor, /rel="noopener noreferrer"/)
      assert.match(anchor, /aria-label=/)
      const href: string | undefined = anchor.match(/href="([^"]+)"/)?.[1].replaceAll('&amp;', '&')
      assert.ok(href)
      assert.equal(new URL(href).searchParams.get('q'), agentPrompt(locale))
    }
  }
})
