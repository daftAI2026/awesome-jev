/**
 * [INPUT]: 依赖可信 main 工作流、临时产物与隔离 Bash/CLI 替身
 * [OUTPUT]: 验证同版本产物交接、部署门、过期拒绝和机器人发布派发
 * [POS]: scripts 的部署边界回归；不读取凭据或发起线上部署
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test, { type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { writePublicationOutput } from './publish-data.ts'

const workflow = (file = 'radar.yml') => readFileSync(new URL(`../.github/workflows/${file}`, import.meta.url), 'utf8')
const radar = workflow()
const deploy = radar.slice(radar.indexOf('\n  deploy:\n'), radar.indexOf('\n  resume-intake:\n'))

function command(source: string, name: string): string {
  const start = source.indexOf(`      - name: ${name}\n`)
  assert.ok(start >= 0, `Missing step: ${name}`)
  const end = source.indexOf('\n      - ', start + 1)
  const step = source.slice(start, end < 0 ? undefined : end)
  const block = step.match(/        run: \|\n((?:          [^\n]*\n?)+)/)
  if (block) return block[1].replace(/^          /gm, '')
  const line = step.match(/        run: (.+)/)
  assert.ok(line, `Missing command: ${name}`)
  return line[1]
}

function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'jev-deploy-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const save = (file: string, value: string, executable = false) => {
    mkdirSync(dirname(join(root, file)), { recursive: true })
    writeFileSync(join(root, file), value, executable ? { mode: 0o700 } : undefined)
  }
  const invoke = (script: string, env: Record<string, string> = {}) => {
    const result = spawnSync('/bin/bash', ['-e', '-o', 'pipefail', '-c', script], { cwd: root, encoding: 'utf8', env: {
      PATH: `${join(root, 'bin')}:${dirname(process.execPath)}:/usr/bin:/bin`, RUNNER_TEMP: root,
      GITHUB_SHA: 'verified-main', GITHUB_OUTPUT: join(root, 'output'), GITHUB_REPOSITORY: 'daftAI2026/awesome-jev',
      RECEIPT: join(root, 'receipt'), ...env,
    } })
    assert.ifError(result.error)
    return result
  }
  return { root, save, invoke }
}

test('only successful trusted main validation packages output and exposes production credentials', () => {
  assert.ok(radar.indexOf('npm run test:delivery') < radar.indexOf('Package verified Worker output'))
  for (const gate of ["needs.verify.result == 'success'", "needs.verify.outputs.artifact_id != ''",
    "github.repository == 'daftAI2026/awesome-jev'", "github.ref == 'refs/heads/main'",
    "vars.CLOUDFLARE_ACTIONS_DEPLOY_ENABLED == 'true'", "github.event_name == 'push'",
    "github.event_name == 'workflow_dispatch'", "inputs.mode == 'validate'", 'environment: production']) {
    assert.ok(deploy.includes(gate), gate)
  }
  assert.match(deploy, /permissions:\n      contents: read/)
  assert.match(deploy, /group: jev-production-deploy\n      cancel-in-progress: false/)
  assert.match(deploy, /artifact-ids: \$\{\{ needs.verify.outputs.artifact_id \}\}/)
  assert.match(deploy, /ref: \$\{\{ github.sha \}\}\n          persist-credentials: false/)
  assert.match(deploy, /if: steps.freshness.outputs.current == 'true'/)
  assert.ok(!deploy.includes('npm run build') && !deploy.includes('contents: write'))
  assert.equal(radar.replace(deploy, '').includes('secrets.CLOUDFLARE_API_TOKEN'), false)
  assert.match(radar, /retention-days: 1/)
})

test('real packaging restores hidden assets and refuses wrong SHA or Worker configuration', (t) => {
  const f = fixture(t)
  const config = { name: 'awesome-jev-project', no_bundle: true, assets: { directory: '../client' } }
  f.save('dist/server/wrangler.json', JSON.stringify(config))
  f.save('dist/client/.vite/manifest.json', '{"hidden":true}')
  f.save('dist/client/zh/index.html', '<h1>verified</h1>')
  assert.equal(f.invoke(command(radar, 'Package verified Worker output')).status, 0)
  mkdirSync(join(f.root, 'worker-build'))
  f.save('worker-build/worker-build.tar.gz', '')
  // --- 真实压缩包转移到下载目录；删除源产物后执行恢复步骤 ---
  writeFileSync(join(f.root, 'worker-build/worker-build.tar.gz'), readFileSync(join(f.root, 'worker-build.tar.gz')))
  rmSync(join(f.root, 'dist'), { recursive: true })
  const restore = command(deploy, 'Restore exact verified output')
  assert.equal(f.invoke(restore).status, 0)
  assert.equal(readFileSync(join(f.root, 'dist/client/.vite/manifest.json'), 'utf8'), '{"hidden":true}')
  assert.equal(readFileSync(join(f.root, 'dist/client/zh/index.html'), 'utf8'), '<h1>verified</h1>')
  assert.notEqual(f.invoke(restore, { GITHUB_SHA: 'another-main' }).status, 0)
  for (const wrong of [{ ...config, name: 'another-worker' }, { ...config, no_bundle: false },
    { ...config, assets: { directory: '../../source' } }]) {
    f.save('dist/server/wrangler.json', JSON.stringify(wrong))
    assert.equal(f.invoke(command(radar, 'Package verified Worker output')).status, 0)
    writeFileSync(join(f.root, 'worker-build/worker-build.tar.gz'), readFileSync(join(f.root, 'worker-build.tar.gz')))
    assert.notEqual(f.invoke(restore).status, 0)
  }
})

test('freshness command skips obsolete main and fails closed on GitHub read errors', (t) => {
  const f = fixture(t)
  f.save('bin/gh', '#!/bin/sh\nprintf "%s\\n" "$@" > "$RECEIPT"\n[ "$GH_FAIL" = "yes" ] && exit 17\nprintf "%s\\n" "$LATEST_SHA"\n', true)
  const check = command(deploy, 'Refuse superseded main deployment')
  assert.equal(f.invoke(check, { LATEST_SHA: 'verified-main' }).status, 0)
  assert.equal(readFileSync(join(f.root, 'output'), 'utf8'), 'current=true\n')
  rmSync(join(f.root, 'output'))
  assert.equal(f.invoke(check, { LATEST_SHA: 'newer-main' }).status, 0)
  assert.equal(readFileSync(join(f.root, 'output'), 'utf8'), 'current=false\n')
  rmSync(join(f.root, 'output'))
  assert.equal(f.invoke(check, { GH_FAIL: 'yes' }).status, 17)
  assert.equal(existsSync(join(f.root, 'output')), false)
  assert.equal(readFileSync(join(f.root, 'receipt'), 'utf8'), 'api\nrepos/daftAI2026/awesome-jev/git/ref/heads/main\n--jq\n.object.sha\n')
})

test('deploy command requires both credentials and invokes only the precompiled config', (t) => {
  const f = fixture(t)
  f.save('bin/npx', '#!/bin/sh\nprintf "%s\\n" "$@" > "$RECEIPT"\n', true)
  const run = command(deploy, 'Deploy the verified output without rebuilding')
  const incomplete: Record<string, string>[] = [{}, { CLOUDFLARE_API_TOKEN: 'offline-placeholder' }, { CLOUDFLARE_ACCOUNT_ID: 'offline-account' }]
  for (const env of incomplete) {
    assert.notEqual(f.invoke(run, env).status, 0)
    assert.equal(existsSync(join(f.root, 'receipt')), false)
  }
  assert.equal(f.invoke(run, { CLOUDFLARE_API_TOKEN: 'offline-placeholder', CLOUDFLARE_ACCOUNT_ID: 'offline-account' }).status, 0)
  assert.equal(readFileSync(join(f.root, 'receipt'), 'utf8'), '--no-install\nwrangler\ndeploy\n--config\ndist/server/wrangler.json\n--message\nGitHub verified-main\n')
})

test('all collectors dispatch trusted main only after an actual publication; dispatch errors remain visible', (t) => {
  const f = fixture(t)
  f.save('bin/gh', '#!/bin/sh\nprintf "%s\\n" "$@" > "$RECEIPT"\nexit "${GH_EXIT:-0}"\n', true)
  for (const file of ['radar.yml', 'alternatives.yml', 'news-sync.yml']) {
    const source = workflow(file)
    const publisher = source.slice(source.indexOf('      contents: write'))
    assert.match(publisher, /      actions: write/)
    assert.match(publisher, /id: publication/)
    assert.match(publisher, /if: steps.publication.outputs.status == 'published' && vars.CLOUDFLARE_ACTIONS_DEPLOY_ENABLED == 'true'/)
    const dispatch = command(source, 'Request verified main deployment after data publication')
    assert.equal(f.invoke(dispatch).status, 0)
    assert.equal(readFileSync(join(f.root, 'receipt'), 'utf8'), 'workflow\nrun\nradar.yml\n--repo\ndaftAI2026/awesome-jev\n--ref\nmain\n-f\nmode=validate\n')
    assert.equal(f.invoke(dispatch, { GH_EXIT: '17' }).status, 17)
    assert.equal(publisher.includes('secrets.CLOUDFLARE_API_TOKEN'), false)
  }
})

test('publication status appends to Actions output and is optional outside Actions', (t) => {
  const f = fixture(t), output = join(f.root, 'output')
  f.save('output', 'prior=value\n')
  writePublicationOutput('published', output)
  writePublicationOutput('unchanged', output)
  writePublicationOutput('published')
  assert.equal(readFileSync(output, 'utf8'), 'prior=value\nstatus=published\nstatus=unchanged\n')
})
