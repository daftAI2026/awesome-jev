/**
 * [INPUT]: 依赖真实临时 Git 历史与站点发布判定
 * [OUTPUT]: 验证精确状态白名单、回滚历史、合并与读取失败关闭
 * [POS]: scripts 的部署新鲜度回归，不操作真实仓库或生产
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test, { type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { siteChanged, canDeployVerified, STATE_ONLY_PATHS } from './site-publication.ts'
function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'jev-site-history-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  git('init', '--initial-branch=main'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.com')
  const commit = (path: string, value: string) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), value); git('add', '.'); git('commit', '-m', path); return git('rev-parse', 'HEAD') }
  const base = commit('data/github.json', 'base')
  return { root, git, commit, base }
}
test('only six exact state paths avoid a site build', () => {
  assert.equal(STATE_ONLY_PATHS.length, 6)
  assert.equal(siteChanged(STATE_ONLY_PATHS), false)
  assert.equal(siteChanged([]), false)
  for (const path of ['radar/CLAUDE.md', 'radar/unknown.json', 'scripts/radar.ts', 'CLAUDE.md', 'data/github.json', 'radar/state.json\nmalicious']) assert.equal(siteChanged([path]), true)
})
test('verified D remains deployable after state-only R but never after data or code', t => {
  const f = fixture(t)
  assert.equal(canDeployVerified(f.root, f.base, f.base), true)
  const r = f.commit('radar/state.json', '{}')
  assert.equal(canDeployVerified(f.root, f.base, r), true)
  for (const path of ['scripts/tool.ts', 'data/github.json', 'radar/unknown.json']) {
    const head = f.commit(path, path)
    assert.equal(canDeployVerified(f.root, f.base, head), false)
  }
})
test('data change then revert to identical bytes still invalidates the old artifact', t => {
  const f = fixture(t)
  f.commit('data/github.json', 'changed')
  const reverted = f.commit('data/github.json', 'base')
  assert.equal(f.git('diff', f.base, reverted), '')
  assert.equal(canDeployVerified(f.root, f.base, reverted), false)
})
test('rename across whitelist and merge commits cannot hide non-state history', t => {
  const f = fixture(t)
  const state = f.commit('radar/state.json', '{}')
  f.git('mv', 'radar/state.json', 'radar/unknown.json'); f.git('commit', '-m', 'rename')
  assert.equal(canDeployVerified(f.root, state, f.git('rev-parse', 'HEAD')), false)
  f.git('checkout', '-b', 'side', f.base); f.commit('scripts/tool.ts', 'code')
  f.git('checkout', 'main'); f.git('merge', '--no-ff', 'side', '-m', 'merge')
  assert.equal(canDeployVerified(f.root, state, f.git('rev-parse', 'HEAD')), false)
})
test('divergence, reverse ancestry, invalid SHA, missing history and Git failure all close the gate', t => {
  const f = fixture(t), r = f.commit('radar/state.json', '{}')
  assert.equal(canDeployVerified(f.root, r, f.base), false)
  assert.equal(canDeployVerified(f.root, 'bad', r), false)
  assert.equal(canDeployVerified(f.root, 'b'.repeat(40), 'b'.repeat(40)), false)
  assert.equal(canDeployVerified('/does/not/exist', f.base, f.base), false)
  f.git('checkout', '-b', 'side', f.base); const side = f.commit('radar/latest.json', '{}')
  assert.equal(canDeployVerified(f.root, r, side), false)
})
