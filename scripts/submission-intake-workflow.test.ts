/**
 * [INPUT]: 依赖 radar 的显式交接 job、Node 文件系统与隔离 Bash/gh 替身
 * [OUTPUT]: 验证 CI 后只唤醒可信 main 收录入口、严格分支编号和派发失败可见性
 * [POS]: scripts 的工作流边界回归；执行真实交接命令但不持有凭据或访问 GitHub
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

function handoff() {
  const workflow = readFileSync(new URL('../.github/workflows/radar.yml', import.meta.url), 'utf8')
  const start = workflow.indexOf('\n  resume-intake:\n')
  const end = workflow.indexOf('\n  scan:\n', start)
  assert.ok(start >= 0 && end > start, 'Bot validation must explicitly resume intake, not rely only on workflow_run')
  const job = workflow.slice(start, end)
  const command = job.match(/        run: \|\n((?:          .+\n)+)/)?.[1]
  assert.ok(command, 'The handoff must contain an executable command')
  return { job, command: command.replace(/^          /gm, '') }
}

function invoke(ref: string, ghExit = 0) {
  const { command } = handoff()
  const root = mkdtempSync(join(tmpdir(), 'jev-intake-handoff-'))
  const receipt = join(root, 'arguments')
  try {
    // --- gh 只记录参数；隔离 PATH 防止测试误用已登录的真实客户端 ---
    writeFileSync(join(root, 'gh'), '#!/bin/sh\nprintf "%s\\n" "$@" > "$GH_RECEIPT"\nexit "$GH_EXIT"\n', { mode: 0o700 })
    const result = spawnSync('/bin/bash', ['-e', '-o', 'pipefail', '-c', command], {
      encoding: 'utf8', env: { PATH: `${root}:/usr/bin:/bin`, GH_TOKEN: 'offline-test',
        GITHUB_REPOSITORY: 'daftAI2026/awesome-jev', INTAKE_REF: ref, GH_RECEIPT: receipt, GH_EXIT: String(ghExit) },
    })
    assert.ifError(result.error)
    return { status: result.status, args: existsSync(receipt) ? readFileSync(receipt, 'utf8').trimEnd().split('\n') : [] }
  } finally { rmSync(root, { recursive: true, force: true }) }
}

test('CI handoff is limited to successful bot-branch validation and actions permission', () => {
  const { job } = handoff()
  for (const gate of ['needs: verify', "needs.verify.result == 'success'", "github.repository == 'daftAI2026/awesome-jev'",
    "github.event_name == 'workflow_dispatch'", "inputs.mode == 'validate'", "startsWith(github.ref_name, 'jev-intake/issue-')"]) {
    assert.ok(job.includes(gate), `Missing handoff gate: ${gate}`)
  }
  assert.match(job, /    permissions:\n      actions: write\n    steps:/)
  assert.match(job, /    continue-on-error: true\n/, 'A failed notification must not invalidate successful CI')
  assert.ok(!job.includes('actions/checkout') && !job.includes('secrets.') && !job.includes('contents: write'))
  assert.match(job, /GH_TOKEN: \$\{\{ github.token \}\}/)
  assert.match(job, /INTAKE_REF: \$\{\{ github.ref_name \}\}/)
})

test('real handoff command dispatches the original issue on main, not the data branch', () => {
  const result = invoke('jev-intake/issue-8')
  assert.equal(result.status, 0)
  assert.deepEqual(result.args, ['workflow', 'run', 'submission-intake.yml', '--repo', 'daftAI2026/awesome-jev',
    '--ref', 'main', '-f', 'number=8'])
  assert.deepEqual(invoke('jev-intake/issue-12345').args.slice(-2), ['-f', 'number=12345'])
})

test('unrelated, malformed and shell-shaped branch inputs never dispatch', () => {
  for (const ref of ['main', 'jev-intake/issue-', 'jev-intake/issue-0', 'jev-intake/issue-08', 'jev-intake/issue-8/extra',
    'jev-intake/issue-8\n', 'jev-intake/issue-8; gh workflow run other.yml', 'jev-intake/issue-$(echo 8)']) {
    const result = invoke(ref)
    assert.equal(result.status, 0)
    assert.deepEqual(result.args, [], ref)
  }
})

test('an unsuccessful dispatch fails visibly instead of silently claiming handoff', () => {
  const result = invoke('jev-intake/issue-8', 17)
  assert.equal(result.status, 17)
  assert.ok(result.args.length > 0)
})
