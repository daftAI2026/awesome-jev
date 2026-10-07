/**
 * [INPUT]: 依赖机器文档生成器、规范快照与 Node 临时文件系统
 * [OUTPUT]: 验证生成一致性、互链、文本转义与公开字段边界
 * [POS]: scripts 的构建期文档护栏；不请求第三方来源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { buildAgentDocuments, generateLlms } from './generate-llms.ts'
import { readCatalog } from './catalog.ts'
import { validateNews } from './news-sync.ts'
import { AGENT_DOCUMENTS, AGENT_DOCUMENT_PATHS } from '../src/lib/agent-links.ts'
import type { GitHubDirectoryItem } from './model-types.ts'

test('real current snapshots produce deterministic documents independent of input order', () => {
  const projects = readCatalog(process.cwd()).rows
  const news = validateNews(JSON.parse(readFileSync('data/news.json', 'utf8')))
  const result = buildAgentDocuments(projects, news)
  // --- 自动采集只提交规范数据；发布构建重生文档，单测不要求手工提交派生快照 ---
  assert.deepEqual(result, buildAgentDocuments([...projects].reverse(), [...news].reverse()))
  for (const name of AGENT_DOCUMENTS) {
    assert.ok(result.full.includes(result.documents[name]))
    assert.ok(result.documents[name].includes('[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md'))
    for (const path of AGENT_DOCUMENT_PATHS) assert.ok(result.documents[name].includes(`https://awesomejev.cc${path}`))
  }
  assert.doesNotMatch(result.full, /billflare\.dev|https?:\/\/(?:localhost|127\.0\.0\.1)|\/Users\/|jevAbout|jevKeepConfidence|nodeId|needsReview/)
})

test('author text cannot inject markup; audit fields and personal data are not serialized', () => {
  const item: GitHubDirectoryItem = {
    id: 'test', type: 'github', title: '<script>[fake](https://private.invalid)</script>',
    summary: 'First\n# Override [link](javascript:alert(1))', url: 'https://github.com/test/repo',
    tags: ['<topic>'], category: 'agents', sourceMeta: { stars: 5, jevAbout: 0.99 },
  }
  const audit = { ...item, privateNotes: 'PRIVATE_SENTINEL', sourceMeta: { ...item.sourceMeta, nodeId: 'NODE_SENTINEL', token: 'TOKEN_SENTINEL' } }
  const result = buildAgentDocuments([audit], [])
  assert.doesNotMatch(result.full, /<script>|\n# Override|PRIVATE_SENTINEL|NODE_SENTINEL|TOKEN_SENTINEL|jevAbout/)
  assert.match(result.full, /&lt;script&gt;/)
  assert.match(result.documents['collections.md'], /1\. .*5 snapshot stars/)
  assert.throws(() => buildAgentDocuments([{ ...item, url: 'https://localhost/private' }], []), /Invalid public project/)
})

test('build generator writes all documents, and changed source data refreshes output', () => {
  const root = mkdtempSync(join(tmpdir(), 'jev-agents-'))
  try {
    mkdirSync(join(root, 'data'))
    mkdirSync(join(root, 'public'))
    writeFileSync(join(root, 'data/github.json'), readFileSync('data/github.json'))
    writeFileSync(join(root, 'data/news.json'), readFileSync('data/news.json'))
    const first = generateLlms(root)
    const news = JSON.parse(readFileSync('data/news.json', 'utf8'))
    news[0].summary = 'Changed public summary proving snapshot updates refresh machine documents.'
    writeFileSync(join(root, 'data/news.json'), JSON.stringify(news))
    const second = generateLlms(root)
    assert.notEqual(first.full, second.full)
    assert.match(readFileSync(join(root, 'public/llms-full.txt'), 'utf8'), /Changed public summary/)
    for (const name of AGENT_DOCUMENTS) assert.equal(readFileSync(join(root, 'public/agents', name), 'utf8'), second.documents[name])
  } finally { rmSync(root, { recursive: true, force: true }) }
})
