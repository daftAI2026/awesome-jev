/**
 * [INPUT]: 依赖公开标签纯规则、规范快照和真实采集候选入口
 * [OUTPUT]: 提供同义去重、来源不变、路径安全与索引门槛回归
 * [POS]: scripts 的公开标签契约；不调用模型、不改规范快照
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { normalizeProjectTag, projectTags, projectTagIndex, projectTagPath, projectTagFromPath, hasProjectTag, TAG_INDEX_MIN_PROJECTS } from '../src/lib/project-tags.ts'
import { candidateRow } from './catalog.ts'

test('public tags merge explicit synonyms without mutating source arrays or collapsing different meanings', () => {
  const source = { tags: ['jev', 'Jev-AI', 'Typesafe', 'Agent', 'ai-agents', 'agents', 'golang', 'go', 'C', 'C++', 'C#', 'MCP', 'mcp-server', 'sdk'] }
  const before = structuredClone(source)
  assert.deepEqual(projectTags(source), ['ai-agents', 'go', 'c', 'c++', 'c#', 'mcp', 'mcp-server', 'sdk'])
  assert.deepEqual(source, before)
  assert.deepEqual(projectTags({ tags: ['csharp', 'c#', 'cpp', 'c++', 'agent-skill', 'agent-skills', 'coding-agent', 'coding-agents', 'github-action', 'github-actions', 'systemone', 'typesafe-jev'] }), ['c#', 'c++', 'agent-skills', 'coding-agents', 'github-actions'])
  assert.ok(hasProjectTag(source, 'ai-agents'))
  assert.deepEqual(projectTags({ tags: ['jev'] }), [])
})

test('tag counts count each project once and preserve long-tail detail navigation', () => {
  const rows = [{ tags: ['agent', 'agents', 'ai-agent', 'rare'] }, { tags: ['ai-agents'] }, { tags: ['agents'] }]
  const index = projectTagIndex(rows)
  assert.deepEqual(index, [{ tag: 'ai-agents', path: '/tags/ai-agents', count: 3 }, { tag: 'rare', path: '/tags/rare', count: 1 }])
  assert.deepEqual(index.filter((entry) => entry.count >= TAG_INDEX_MIN_PROJECTS).map((entry) => entry.tag), ['ai-agents'])
  assert.equal(projectTagIndex(rows), index)
  assert.notEqual(projectTagIndex([...rows]), index)
})

test('tag path encoding distinguishes C, C++ and C# and refuses path injection', () => {
  for (const tag of ['c', 'c++', 'c#', 'node.js', 'machine learning']) {
    const path = projectTagPath(tag)
    assert.equal(new URL(path, 'https://awesomejev.cc').hash, '')
    assert.equal(projectTagFromPath(path), normalizeProjectTag(tag))
  }
  assert.notEqual(projectTagPath('c++'), projectTagPath('c#'))
  for (const value of ['../escape', '.', '..', 'a/b', '<script>', '', 'x'.repeat(51), '\n', '💥']) assert.equal(normalizeProjectTag(value), null)
  for (const path of ['/tags/%', '/tags/%2F', '/tags/%2e%2e', '/tags/a/b']) assert.equal(projectTagFromPath(path), null)
  assert.equal(projectTagFromPath('/tags/agent'), 'ai-agents')
})

test('current snapshots and new Action bot candidates share the same public projection without new paid calls', () => {
  const projects = JSON.parse(readFileSync('data/github.json', 'utf8'))
  const before = JSON.stringify(projects)
  const index = projectTagIndex(projects)
  assert.ok(index.length > 9)
  assert.ok(index.every((entry) => entry.count <= projects.length))
  assert.ok(!index.some((entry) => entry.tag === 'jev'))
  assert.equal(JSON.stringify(projects), before)
  const candidate = candidateRow({ html_url: 'https://github.com/example/tool', full_name: 'example/tool', name: 'tool', owner: { login: 'example' }, topics: ['agent', 'ai-agents', 'golang'], language: 'Go', stargazers_count: 0, forks_count: 0 })
  assert.deepEqual(projectTags(candidate), ['ai-agents', 'go'])
  assert.ok(candidate.tags?.includes('jev'), 'raw collector data must stay intact')
})
