/**
 * [INPUT]: 依赖现有 Vite 预览、构建产物和 Node 页面/OG 交付测试，不访问采集 API
 * [OUTPUT]: 对外提供 runDelivery、可取消命令入口与零跳过集成验收
 * [POS]: scripts 的构建后验收编排器；只拥有并清理自己启动的进程组
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

interface DeliveryOptions {
  cwd?: string
  startupTimeoutMs?: number
  testTimeoutMs?: number
  previewCommand?: string[]
  testCommand?: string[]
  onOutput?: (output: string) => void
  signal?: AbortSignal
}

async function availablePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No preview port')
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  return address.port
}

function launch(command: string[], cwd: string, env: NodeJS.ProcessEnv, onOutput: (value: string) => void) {
  const child = spawn(command[0], command.slice(1), { cwd, env, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  const collect = (value: Buffer) => {
    onOutput(String(value))
    // --- 有界诊断输出，不让挂起子进程无限占用内存 ---
    output = (output + value).slice(-4 * 1024 * 1024)
  }
  child.stdout?.on('data', collect)
  child.stderr?.on('data', collect)
  const done = new Promise<number | null>((resolve, reject) => {
    child.once('error', reject)
    child.once('close', (code) => resolve(code))
  })
  // 启动期也监测异常，避免尚未 await 的拒绝成为 unhandled rejection。
  void done.catch(() => {})
  return { child, done, output: () => output }
}

async function stop(child: ChildProcess) {
  if (!child.pid) return
  const signal = (value: NodeJS.Signals) => {
    try {
      if (process.platform === 'win32') child.kill(value)
      else process.kill(-child.pid!, value)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error
    }
  }
  signal('SIGTERM')
  if (child.exitCode === null && child.signalCode === null) {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 2000)
      child.once('close', () => { clearTimeout(timer); resolve() })
    })
  }
  // 组长退出后仍可能有孙进程；只针对本次独立进程组兜底。
  signal('SIGKILL')
}

export async function runDelivery(options: DeliveryOptions = {}): Promise<string> {
  const cwd = options.cwd ?? process.cwd()
  const port = await availablePort()
  const origin = `http://127.0.0.1:${port}`
  const env = { ...process.env, DELIVERY_PREVIEW_PORT: String(port), TEST_BUILD_OUTPUT: path.join(cwd, 'dist/client'), TEST_SITE_ORIGIN: origin }
  const output = options.onOutput ?? (() => {})
  const preview = launch(options.previewCommand ?? [process.execPath, 'node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], cwd, env, output)
  let tests: ReturnType<typeof launch> | undefined
  try {
    const deadline = Date.now() + (options.startupTimeoutMs ?? 60_000)
    let ready = false
    while (Date.now() < deadline) {
      options.signal?.throwIfAborted()
      if (preview.child.exitCode !== null || preview.child.signalCode !== null || !preview.child.pid) {
        throw new Error(`Preview failed to start: ${preview.output()}`)
      }
      try {
        const response = await fetch(origin, { signal: AbortSignal.timeout(1000) })
        await response.body?.cancel()
        if (response.status === 200) { ready = true; break }
      } catch { /* 仅启动探测可重试；交付测试失败不能重试掩盖。 */ }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (!ready) throw new Error(`Preview startup timeout: ${preview.output()}`)
    options.signal?.throwIfAborted()
    tests = launch(options.testCommand ?? [process.execPath, '--experimental-strip-types', '--test', '--test-reporter=tap', 'scripts/page-delivery.test.ts', 'scripts/not-found.test.ts', 'scripts/og-delivery.test.ts'], cwd, env, output)
    let timer: ReturnType<typeof setTimeout> | undefined
    const cancelled = () => cancelReject?.(options.signal?.reason ?? new Error('Delivery cancelled'))
    let cancelReject: ((reason: unknown) => void) | undefined
    const code = await Promise.race([
      tests.done,
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Delivery test timeout')), options.testTimeoutMs ?? 180_000) }),
      new Promise<never>((_, reject) => {
        cancelReject = reject
        options.signal?.addEventListener('abort', cancelled, { once: true })
        if (options.signal?.aborted) cancelled()
      }),
    ]).finally(() => {
      if (timer) clearTimeout(timer)
      options.signal?.removeEventListener('abort', cancelled)
    })
    if (code !== 0) throw new Error(`Delivery tests failed (${code}): ${tests.output()}`)
    const summary = tests.output()
    const count = Number(summary.match(/^# tests (\d+)\s*$/m)?.[1] ?? 0)
    const skipped = summary.match(/^# skipped (\d+)\s*$/m)?.[1]
    if (count <= 0 || skipped !== '0' || !/^# fail 0\s*$/m.test(summary)) {
      throw new Error(`Delivery tests failed or skipped; require a nonempty zero-skip TAP result: ${summary}`)
    }
    return tests.output()
  } finally {
    if (tests) await stop(tests.child)
    await stop(preview.child)
  }
}

export async function runDeliveryCommand(options: DeliveryOptions = {}): Promise<void> {
  const controller = new AbortController()
  let exitCode = 1
  const interrupt = () => { exitCode = 130; controller.abort(new Error('Delivery cancelled by SIGINT')) }
  const terminate = () => { exitCode = 143; controller.abort(new Error('Delivery cancelled by SIGTERM')) }
  process.on('SIGINT', interrupt)
  process.on('SIGTERM', terminate)
  try {
    await runDelivery({ onOutput: (output) => process.stdout.write(output), ...options, signal: controller.signal })
  } catch (error: unknown) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = exitCode
  } finally {
    // 先等自有组全部清理，再恢复控制器的信号行为；不能抢先 process.exit。
    process.off('SIGINT', interrupt)
    process.off('SIGTERM', terminate)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await runDeliveryCommand()
}
