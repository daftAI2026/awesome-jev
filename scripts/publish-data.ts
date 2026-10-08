/**
 * [INPUT]: 依赖可信已验证的采集结果、Git main、三方合并及既有构建/交付验证
 * [OUTPUT]: 提供 publishData 与 Actions 发布状态输出；实际推送后由工作流派发 main 构建
 * [POS]: scripts 的三采集器共享发布边界；不重跑付费审核、不强推、不重置调用方工作区
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { isDeepStrictEqual as equal } from 'node:util'
import { readCatalog, renderReadme, validateSnapshot } from './catalog.ts'
import { createGitHubClient } from './github-client.ts'
import { refreshMetadata } from './github-metadata.ts'
import { generateSitemap } from './generate-sitemap.ts'
import { mergePublishedCatalog, mergePublishedNews } from './publication-merge.ts'
import { validateNews } from './news-sync.ts'
import { validateState } from './radar.ts'
import type { GitHubApi } from './model-types.ts'

type Mode = 'news' | 'radar' | 'alternatives'
export function writePublicationOutput(status: 'published' | 'unchanged', outputFile?: string): void {
  if (outputFile) appendFileSync(outputFile, `status=${status}\n`)
}
const ownedFiles = (mode: Mode) => mode === 'news' ? ['data/news.json', 'public/sitemap.xml'] :
  ['data/github.json', 'README.md', 'public/sitemap.xml', `radar/${mode === 'radar' ? 'state' : 'alternatives-state'}.json`, `radar/${mode === 'radar' ? 'latest' : 'alternatives-latest'}.json`]
const git = (root: string, args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim()
const auth = ['-c', "credential.helper=!gh auth git-credential"]
const json = (root: string, file: string) => JSON.parse(readFileSync(join(root, file), 'utf8'))
const store = (root: string, file: string, value: unknown) => writeFileSync(join(root, file), `${JSON.stringify(value, null, 2)}\n`)

// --- 仅合并路径需要再次安装/构建；通常路径已由原工作流完整验证 ---
function validateMerged(root: string): void {
  const env = { ...process.env }; delete env.TYPESAFE_API_KEY
  const run = (args: string[]) => execFileSync('npm', args, { cwd: root, env, stdio: 'inherit', timeout: 15 * 60 * 1000 })
  run(['ci', '--ignore-scripts', '--no-audit', '--no-fund'])
  for (const task of ['typecheck', 'test', 'categories:check', 'data:check', 'news:check', 'lint', 'build', 'test:delivery']) run(['run', task])
}

export async function publishData({ root, mode, validate = validateMerged, githubApi, beforePush }: {
  root: string; mode: Mode; validate?: (root: string) => void | Promise<void>; githubApi?: GitHubApi
  beforePush?: (root: string, attempt: number) => void | Promise<void>
}): Promise<{ status: 'published' | 'unchanged'; attempts: number; rebased: boolean }> {
  if (!['news', 'radar', 'alternatives'].includes(mode)) throw new Error('publication-invalid-mode')
  if (git(root, ['diff', '--cached', '--name-only'])) throw new Error('publication-index-not-clean')
  const base = git(root, ['rev-parse', 'HEAD'])
  const files = ownedFiles(mode)
  const incoming = new Map(files.map((file) => [file, readFileSync(join(root, file), 'utf8')]))
  const original = new Map(files.map((file) => [file, git(root, ['show', `${base}:${file}`])]))
  const dataFile = files[0]
  const collected = JSON.parse(incoming.get(dataFile)!)
  const baseline = JSON.parse(original.get(dataFile)!)
  // publish 调用方必须先完成原工作流的验证；额外验证保护合并路径。
  if (mode === 'news') { validateNews(baseline); validateNews(collected) }
  const parent = mkdtempSync(join(tmpdir(), 'jev-publish-'))
  const worktree = join(parent, 'latest')
  let rebased = false
  let registered = false
  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      git(root, [...auth, 'fetch', 'origin', '+refs/heads/main:refs/remotes/origin/main'])
      const latest = git(root, ['rev-parse', 'refs/remotes/origin/main'])
      const fast = latest === base && attempt === 1
      const target = fast ? root : worktree
      if (!fast) {
        rebased = true
        git(root, ['worktree', 'add', '--detach', worktree, latest])
        registered = true
        if (mode === 'news') {
          store(target, dataFile, mergePublishedNews(baseline, collected, json(target, dataFile)))
        } else {
          const rows = mergePublishedCatalog(baseline, collected, readCatalog(target).rows)
          const stateFile = files[3], reportFile = files[4]
          // 同一队列的检查点也被推进时，不能用旧轮次将其倒退。
          if (!equal(json(target, stateFile), JSON.parse(original.get(stateFile)!))) throw new Error('publication-checkpoint-advanced')
          const state = JSON.parse(incoming.get(stateFile)!)
          const report = JSON.parse(incoming.get(reportFile)!)
          validateState(state)
          if (!['complete', 'partial'].includes(report.status) || !Array.isArray(report.receipts)) throw new Error('publication-invalid-report')
          if (mode === 'radar') {
            if (report.metadata?.top100?.complete !== true) throw new Error('github-top100-incomplete')
            const refreshed = await refreshMetadata(rows, state, githubApi ?? createGitHubClient(process.env.GH_TOKEN, { deadline: Date.now() + 120000 }), 0)
            if (!refreshed.report.top100.complete) throw new Error('github-top100-incomplete')
            report.metadata.top100 = refreshed.report.top100
            report.publication = { rebasedOn: latest, metadata: refreshed.report }
          }
          if (mode === 'alternatives') {
            const oldIds = new Set(readCatalog(target).rows.map((row) => row.id))
            if (rows.some((row) => !oldIds.has(row.id) && row.category !== 'alternatives')) throw new Error('publication-non-alternative-addition')
          }
          report.totalProjects = rows.length
          store(target, dataFile, rows); store(target, stateFile, state); store(target, reportFile, report)
          writeFileSync(join(target, 'README.md'), renderReadme(readFileSync(join(target, 'README.md'), 'utf8'), rows))
          // 与最新 main 比较，而不是借原基线绕过人工字段/收录阈值保护。
          const check = join(parent, 'baseline')
          git(root, ['worktree', 'add', '--detach', check, latest])
          try { validateSnapshot(check, target) } finally { git(root, ['worktree', 'remove', '--force', check]) }
        }
        generateSitemap(target)
        await validate(target)
      }
      if (fast) generateSitemap(target)
      git(target, ['config', 'user.name', 'github-actions[bot]'])
      git(target, ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'])
      git(target, ['add', '--', ...files])
      const diff = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: target })
      if (diff.status === 0) return { status: 'unchanged', attempts: attempt, rebased }
      if (diff.status !== 1) throw new Error('publication-diff-failed')
      git(target, ['commit', '-m', `data: sync Jev ${mode}`])
      await beforePush?.(target, attempt)
      const push = spawnSync('git', [...auth, 'push', 'origin', 'HEAD:refs/heads/main'], { cwd: target, encoding: 'utf8' })
      if (push.status === 0) return { status: 'published', attempts: attempt, rebased }
      // 只有远端推进才自动重叠加；认证、权限、网络错误不伪装成竞争。
      git(root, [...auth, 'fetch', 'origin', '+refs/heads/main:refs/remotes/origin/main'])
      if (git(root, ['rev-parse', 'refs/remotes/origin/main']) === latest) throw new Error('publication-push-failed-without-main-change')
      if (!fast) { git(root, ['worktree', 'remove', '--force', worktree]); registered = false }
    }
    throw new Error('publication-main-kept-advancing-after-three-attempts')
  } finally {
    if (registered) git(root, ['worktree', 'remove', '--force', worktree])
    rmSync(parent, { recursive: true, force: true })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  // --- 真实推送只在可信 Actions 入口执行；本机不意外触发发布 ---
  if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('publication-actions-only')
  publishData({ root: process.cwd(), mode: process.argv[2] as Mode })
    .then((result) => {
      process.stdout.write(`Data publication: ${JSON.stringify(result)}\n`)
      writePublicationOutput(result.status, process.env.GITHUB_OUTPUT)
    })
    .catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : 'publication-failed'}\n`); process.exitCode = 1 })
}
