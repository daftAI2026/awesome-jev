/**
 * [INPUT]: 依赖 Node 子进程和可注入 GitExecutor 检测 Git 浅仓库并读取 origin 历史
 * [OUTPUT]: 对外提供 prepareBuildHistory、执行契约和构建前历史准备命令
 * [POS]: scripts 的构建前置门，仅补齐缺失历史，失败时阻止不可靠的目录更新时间发布
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

export type GitExecutor = (args: readonly string[], cwd: string) => string

export interface PrepareBuildHistoryOptions {
  cwd?: string
  exec?: GitExecutor
}

export interface PrepareBuildHistoryResult {
  shallow: boolean
  fetched: boolean
}

const defaultExec: GitExecutor = (args, cwd) => execFileSync('git', [...args], {
  cwd,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
}).toString()

const SHALLOW_CHECK = ['rev-parse', '--is-shallow-repository'] as const
const UNSHALLOW_FETCH = ['fetch', '--unshallow', '--filter=blob:none', 'origin'] as const

function gitFailure(action: string): Error {
  return new Error(`prepare-build-history: ${action}; data timestamp would be unsafe`)
}

export function prepareBuildHistory({ cwd = process.cwd(), exec = defaultExec }: PrepareBuildHistoryOptions = {}): PrepareBuildHistoryResult {
  let status: string
  try {
    status = exec(SHALLOW_CHECK, cwd).trim()
  } catch {
    throw gitFailure('git is unavailable or cwd is not a repository')
  }
  if (status === 'false') return { shallow: false, fetched: false }
  if (status !== 'true') throw gitFailure('git returned an invalid shallow-repository status')

  try {
    exec(UNSHALLOW_FETCH, cwd)
  } catch {
    throw gitFailure('unable to complete git fetch --unshallow --filter=blob:none origin')
  }
  return { shallow: true, fetched: true }
}

function main(): void {
  const result = prepareBuildHistory()
  const message = result.fetched
    ? 'prepare-build-history: completed shallow clone history\n'
    : 'prepare-build-history: full history already present\n'
  process.stdout.write(message)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'prepare-build-history: failed'}\n`)
    process.exitCode = 1
  }
}
