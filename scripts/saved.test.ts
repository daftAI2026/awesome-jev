/**
 * [INPUT]: 依赖 node:test/assert 与 lib/saved 的收藏解析、切换和搜索校验
 * [OUTPUT]: 对外提供来源隔离、无内容复制、损坏/重复数据过滤及路由白名单的离线回归
 * [POS]: scripts 的本地收藏契约测试，保护浏览器存储与收藏页筛选之间的纯数据边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseSaved, savedRouteSearch, toggleSaved } from '../src/lib/saved.ts'

const now = '2026-09-23T00:00:00.000Z'

test('saved entries are namespaced by source and toggle without copying content', () => {
  const project = toggleSaved([], 'github', 'same-id', now)
  const both = toggleSaved(project, 'news', 'same-id', now)
  assert.deepEqual(both.map(({ kind, id }) => `${kind}:${id}`), ['news:same-id', 'github:same-id'])
  assert.deepEqual(toggleSaved(both, 'github', 'same-id', now), [both[0]])
})

test('invalid and duplicate local data does not leak into the saved view', () => {
  const valid = { kind: 'news', id: 'one', savedAt: now }
  assert.deepEqual(parseSaved(JSON.stringify([{ ...valid, summary: 'not part of saved state' }, valid,
    { ...valid, kind: 'other' }, { ...valid, savedAt: 'bad' }])), [valid])
  assert.deepEqual(parseSaved('{'), [])
  assert.deepEqual(parseSaved(null), [])
})

test('saved route restores only known source and category filters', () => {
  assert.deepEqual(savedRouteSearch({ section: 'news', projectCategory: 'agents', newsCategory: 'paper', preview: 'item-1' }), {
    section: 'news', projectCategory: 'agents', newsCategory: 'paper', preview: 'item-1',
  })
  assert.deepEqual(savedRouteSearch({ section: 'other', projectCategory: 'fake', newsCategory: 'fake', preview: '' }), {
    section: undefined, projectCategory: undefined, newsCategory: undefined, preview: undefined,
  })
})
