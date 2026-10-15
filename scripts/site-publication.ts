/**
 * [INPUT]: 依赖本地 Git 完整历史与精确状态路径
 * [OUTPUT]: 提供站点变更与已验产物部署判定
 * [POS]: 发布和部署共用的路径政策，不执行发布或部署
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
export const STATE_ONLY_PATHS = ['radar/state.json', 'radar/latest.json', 'radar/alternatives-state.json', 'radar/alternatives-latest.json', 'radar/metadata-state.json', 'radar/metadata-latest.json'] as const
export function siteChanged(paths: readonly string[]): boolean {
  return paths.some(path => !(STATE_ONLY_PATHS as readonly string[]).includes(path))
}
export function canDeployVerified(root: string, verified: string, current: string): boolean {
  if (![verified, current].every(sha => /^[a-f0-9]{40}$/.test(sha))) return false
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 })
  try {
    if (git('rev-parse', '--is-shallow-repository').trim() !== 'false') return false
    for (const sha of [verified, current]) git('cat-file', '-e', `${sha}^{commit}`)
    git('merge-base', '--is-ancestor', verified, current)
    for (const commit of git('rev-list', `${verified}..${current}`).trim().split('\n').filter(Boolean)) {
      const paths = git('diff-tree', '--root', '-m', '--no-commit-id', '--name-only', '--no-renames', '-r', '-z', commit).split('\0').filter(Boolean)
      if (siteChanged(paths)) return false
    }
    return !siteChanged(git('diff', '--name-only', '--no-renames', '-z', verified, current, '--').split('\0').filter(Boolean))
  } catch { return false }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv[2] !== '--deployable') throw new Error('Use --deployable <verified> <current>')
  const output = `current=${canDeployVerified(process.cwd(), process.argv[3], process.argv[4])}\n`
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, output)
  process.stdout.write(output)
}
