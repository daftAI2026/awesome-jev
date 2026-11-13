/**
 * [INPUT]: 依赖本地 Vite+ CLI、真实 Node 子进程、临时 HTTP 与交付编排器
 * [OUTPUT]: 验证默认 Vite+ 预览、测试失败/跳过拒绝及自有进程清理
 * [POS]: scripts 的 CI 编排护栏，验证生命周期而非匹配工作流字符串
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { runDelivery } from './verify-delivery.ts'
import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'

test('default Vite+ delivery preview serves and closes without a site build', { timeout: 20_000 }, async () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'jev-delivery-viteplus-'))
  const originFile = path.join(cwd, 'origin.txt')
  try {
    symlinkSync(path.join(process.cwd(), 'node_modules'), path.join(cwd, 'node_modules'), 'dir')
    mkdirSync(path.join(cwd, 'dist'))
    writeFileSync(path.join(cwd, 'dist/index.html'), '<!doctype html><title>Preview fixture</title>')
    writeFileSync(path.join(cwd, 'package.json'), '{"private":true,"type":"module"}')
    writeFileSync(path.join(cwd, 'vite.config.ts'), `import { defineConfig } from 'vite-plus'; export default defineConfig({envDir:false})`)
    const code = `require('node:fs').writeFileSync(${JSON.stringify(originFile)},process.env.TEST_SITE_ORIGIN);
console.log('TAP version 13\\n1..1\\n# tests 1\\n# pass 1\\n# fail 0\\n# skipped 0')`
    await runDelivery({ cwd, startupTimeoutMs: 10_000, testTimeoutMs: 5000,
      testCommand: [process.execPath, '-e', code] })
    const origin = readFileSync(originFile, 'utf8')
    assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/)
    await assert.rejects(fetch(origin, { signal: AbortSignal.timeout(1000) }), '验收结束必须关闭真实预览服务')
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})

for (const mode of ['pass', 'fail', 'skip', 'startup-fail', 'startup-timeout', 'test-timeout']) {
  test(`delivery runner ${mode} cleans up its own preview`, async () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'jev-delivery-runner-'))
    const pidFile = path.join(cwd, 'preview.pid')
    const server = mode === 'startup-fail' ? 'process.exit(7)' : `
      require('node:fs').writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));
      ${mode === 'startup-timeout' ? 'setInterval(()=>{},1000)' : `require('node:http').createServer((req,res)=>res.end('ready')).listen(Number(process.env.DELIVERY_PREVIEW_PORT),'127.0.0.1')`};
    `
    const code = mode === 'test-timeout' ? 'setInterval(()=>{},1000)' : `
      if(!process.env.TEST_BUILD_OUTPUT || !process.env.TEST_SITE_ORIGIN) process.exit(9);
      console.log('TAP version 13\\n1..1\\n# tests 1\\n# pass ${mode === 'pass' ? 1 : 0}\\n# fail ${mode === 'fail' ? 1 : 0}\\n# skipped ${mode === 'skip' ? 1 : 0}');
      process.exit(${mode === 'fail' ? 1 : 0});
    `
    try {
      const execution = runDelivery({ cwd, startupTimeoutMs: 1500, testTimeoutMs: 1500,
        previewCommand: [process.execPath, '-e', server], testCommand: [process.execPath, '-e', code] })
      if (mode === 'pass') await execution
      else await assert.rejects(execution, /preview|failed|skipped|timeout/i)
      if (mode !== 'startup-fail') {
        const pid = Number(readFileSync(pidFile, 'utf8'))
        assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
      }
    } finally { rmSync(cwd, { recursive: true, force: true }) }
  })
}


const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))
async function waitFor(predicate: () => boolean, timeout = 5000) {
  const end = Date.now() + timeout
  while (!predicate() && Date.now() < end) await delay(25)
  assert.ok(predicate(), 'Timed out waiting for the lifecycle fixture')
}
const alive = (pid: number) => { try { process.kill(pid, 0); return true } catch { return false } }
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  test(`delivery CLI ${signal} cleans up preview, tests and grandchildren`, async () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'jev-delivery-signal-'))
    const paths = ['preview', 'tests', 'grandchild'].map((name) => path.join(cwd, `${name}.pid`))
    const [previewPid, testsPid, grandchildPid] = paths
    const grandchild = `require('node:fs').writeFileSync(${JSON.stringify(grandchildPid)},String(process.pid));setInterval(()=>{},1000)`
    const preview = `
      require('node:fs').writeFileSync(${JSON.stringify(previewPid)},String(process.pid));
      require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{stdio:'ignore'});
      require('node:http').createServer((req,res)=>res.end('ready')).listen(+process.env.DELIVERY_PREVIEW_PORT,'127.0.0.1');
    `
    const tests = `require('node:fs').writeFileSync(${JSON.stringify(testsPid)},String(process.pid));setInterval(()=>{},1000)`
    // --- 外层控制器必须经历真实信号；直接调用 stop 不能证明 CLI 中断会清理 ---
    const module = pathToFileURL(path.join(process.cwd(), 'scripts/verify-delivery.ts')).href
    const controllerCode = `import {runDeliveryCommand} from ${JSON.stringify(module)};await runDeliveryCommand({
      cwd:${JSON.stringify(cwd)},startupTimeoutMs:5000,testTimeoutMs:60000,
      previewCommand:[process.execPath,'-e',${JSON.stringify(preview)}],testCommand:[process.execPath,'-e',${JSON.stringify(tests)}],
    })`
    const controller = spawn(process.execPath, ['--input-type=module', '-e', controllerCode], { stdio: 'ignore' })
    const closed = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
      controller.once('error', reject)
      controller.once('close', (code, signal) => resolve({ code, signal }))
    })
    let closeTimer: ReturnType<typeof setTimeout> | undefined
    try {
      await waitFor(() => paths.every(existsSync))
      const pids = paths.map((file) => Number(readFileSync(file, 'utf8')))
      assert.ok(pids.every(alive), 'All owned processes must be running before interruption')
      controller.kill(signal)
      const outcome = await Promise.race([closed, new Promise<never>((_, reject) => {
        closeTimer = setTimeout(() => reject(new Error('Controller did not finish signal cleanup')), 8000)
      })]).finally(() => { if (closeTimer) clearTimeout(closeTimer) })
      await waitFor(() => pids.every((pid) => !alive(pid)), 2000)
      assert.equal(outcome.code, signal === 'SIGINT' ? 130 : 143)
      assert.equal(outcome.signal, null, 'CLI should finish cleanup before exiting with conventional status')
    } finally {
      // --- 红测也必须回收自己的独立组，不能把失败 fixture 留给其他测试或开发者 ---
      controller.kill('SIGKILL')
      for (const file of paths) if (existsSync(file)) {
        const pid = Number(readFileSync(file, 'utf8'))
        for (const target of [process.platform === 'win32' ? pid : -pid, pid]) {
          try { process.kill(target, 'SIGKILL') } catch { /* 独立组可能已被正常退出路径回收。 */ }
        }
      }
      await closed.catch(() => {})
      rmSync(cwd, { recursive: true, force: true })
    }
  })
}
