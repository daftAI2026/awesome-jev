/**
 * [INPUT]: 依赖可信 main 工作流、临时产物与隔离 Bash/CLI 替身
 * [OUTPUT]: 验证同版本产物、部署门、发布派发与采集资源隔离
 * [POS]: scripts 的部署边界回归；不读取凭据或发起线上部署
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test, { type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { writePublicationOutput } from './publish-data.ts'

const workflow = (file = 'site.yml') => readFileSync(new URL(`../.github/workflows/${file}`, import.meta.url), 'utf8')
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

test('real freshness command permits state-only main and fails closed on data or GitHub read errors', t => {
  const f = fixture(t)
  const git = (...args: string[]) => execFileSync('git', args, { cwd: f.root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  git('init', '--initial-branch=main'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.com')
  f.save('scripts/site-publication.ts', readFileSync(new URL('./site-publication.ts', import.meta.url), 'utf8'))
  f.save('data/github.json', 'base'); git('add', '.'); git('commit', '-m', 'base')
  const verified = git('rev-parse', 'HEAD'); git('remote', 'add', 'origin', f.root)
  f.save('bin/gh', '#!/bin/sh\nprintf "%s\\n" "$@" > "$RECEIPT"\n[ "$GH_FAIL" = "yes" ] && exit 17\nprintf "%s\\n" "$LATEST_SHA"\n', true)
  const check = command(deploy, 'Refuse superseded main deployment')
  const invoke = (latest: string, extra = {}) => { if (existsSync(join(f.root, 'output'))) rmSync(join(f.root, 'output')); return f.invoke(check, { GITHUB_SHA: verified, LATEST_SHA: latest, ...extra }) }
  assert.equal(invoke(verified).status, 0)
  assert.equal(readFileSync(join(f.root, 'output'), 'utf8'), 'current=true\n')
  f.save('radar/state.json', '{}'); git('add', 'radar'); git('commit', '-m', 'state')
  assert.equal(invoke(git('rev-parse', 'HEAD')).status, 0)
  assert.equal(readFileSync(join(f.root, 'output'), 'utf8'), 'current=true\n')
  f.save('data/github.json', 'new'); git('add', 'data'); git('commit', '-m', 'data')
  assert.equal(invoke(git('rev-parse', 'HEAD')).status, 0)
  assert.equal(readFileSync(join(f.root, 'output'), 'utf8'), 'current=false\n')
  assert.equal(invoke(verified, { GH_FAIL: 'yes' }).status, 17)
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
  for (const file of ['radar.yml', 'alternatives.yml', 'news-sync.yml', 'metadata-sync.yml']) {
    const source = workflow(file)
    const publisher = source.slice(source.indexOf('      contents: write'))
    assert.match(publisher, /      actions: write/)
    assert.match(publisher, /id: publication/)
    assert.match(publisher, /if: steps.publication.outputs.status == 'published' && steps.publication.outputs.site_changed == 'true' && vars.CLOUDFLARE_ACTIONS_DEPLOY_ENABLED == 'true'/)
    const dispatch = command(source, 'Request verified main deployment after data publication')
    assert.equal(f.invoke(dispatch).status, 0)
    assert.equal(readFileSync(join(f.root, 'receipt'), 'utf8'), 'workflow\nrun\nsite.yml\n--repo\ndaftAI2026/awesome-jev\n--ref\nmain\n-f\nmode=validate\n')
    assert.equal(f.invoke(dispatch, { GH_EXIT: '17' }).status, 17)
    assert.equal(publisher.includes('secrets.CLOUDFLARE_API_TOKEN'), false)
  }
})

test('publication status appends to Actions output and is optional outside Actions', (t) => {
  const f = fixture(t), output = join(f.root, 'output')
  f.save('output', 'prior=value\n')
  writePublicationOutput({ status: 'published', siteChanged: true, publishedSha: 'a'.repeat(40) }, output)
  writePublicationOutput({ status: 'unchanged', siteChanged: false }, output)
  writePublicationOutput({ status: 'published', siteChanged: false })
  assert.equal(readFileSync(output, 'utf8'), `prior=value\nstatus=published\nsite_changed=true\npublished_sha=${'a'.repeat(40)}\nstatus=unchanged\nsite_changed=false\npublished_sha=\n`)
})

test('discovery workflow no longer owns site triggers or production credentials', () => {
  const source = workflow('radar.yml')
  assert.doesNotMatch(source, /secrets.CLOUDFLARE|^  (push|pull_request|verify|deploy|resume-intake):/m)
  assert.match(source, /options: \[sync\]/)
  assert.match(workflow('metadata-sync.yml'), /cron: '11 1,7,13,19 \* \* \*'/)
  assert.doesNotMatch(workflow('metadata-sync.yml'), /TYPESAFE|JEV_.*BUDGET|limit:/)
})

test('metadata capability failure cannot gate the radar collection step', t => {
  const f = fixture(t)
  f.save('bin/node', `#!/bin/sh
printf '%s\\n' "$*" >> "$RECEIPT"
case "$*" in
  *scripts/github-metadata.ts*) exit 23 ;;
  *scripts/review-checkpoint.ts*) exit 0 ;;
  *scripts/radar.ts*) printf reviewed > "$RUNNER_TEMP/reviewed" ;;
  *) exit 64 ;;
esac
`, true)
  // --- 反例先证明故障探针会阻断后续采集，再执行工作流的真实命令顺序 ---
  const probe = 'node --experimental-strip-types scripts/github-metadata.ts --probe'
  const collect = 'node --experimental-strip-types scripts/radar.ts "$RUNNER_TEMP/snapshot"'
  assert.equal(f.invoke(`${probe}\n${collect}`).status, 23)
  assert.equal(existsSync(join(f.root, 'reviewed')), false)
  const source = workflow('radar.yml')
  const scan = source.slice(source.indexOf('\n  scan:\n'), source.indexOf('      - name: Save radar request budget'))
  const commands = [...scan.matchAll(/^        run: (node .+)$/gm)].map(match => match[1])
  assert.ok(commands.some(value => value.includes('scripts/review-checkpoint.ts')))
  assert.equal(commands.filter(value => value.includes('scripts/radar.ts')).length, 1)
  assert.equal(f.invoke(commands.join('\n')).status, 0, 'GraphQL diagnostics must not prevent REST-backed candidate review')
  assert.equal(readFileSync(join(f.root, 'reviewed'), 'utf8'), 'reviewed')
})
