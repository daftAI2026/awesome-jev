/**
 * [INPUT]: 依赖项目 Vite 配置、真实轻量预览与 Node 回环 TCP
 * [OUTPUT]: 验证预渲染入口固定 IPv4，事件循环停顿不触发双栈误切换
 * [POS]: scripts 的构建连接回归；只加载配置，不启动项目插件服务器
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { createConnection } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { loadConfigFromFile, preview, type PreviewServer } from 'vite'

const STALL_MS = 400
const CONNECT_TIMEOUT_MS = 5_000

async function connectAfterStall(url: URL, signal: AbortSignal) {
  const attempts: string[] = []
  let stalled = false
  const socket = createConnection({ host: url.hostname, port: Number(url.port) })
  let timer: ReturnType<typeof setTimeout> | undefined
  const abort = () => socket.destroy(new Error('Preview connection test cancelled'))
  try {
    const error = await new Promise<Error | undefined>((resolve) => {
      socket.once('connect', () => resolve(undefined))
      socket.once('error', resolve)
      socket.on('connectionAttempt', (ip: string) => {
        attempts.push(ip)
        if (stalled) return
        stalled = true
        // --- 停顿发生在 connect 发起后；不改 DNS 或 Node 连接超时 ---
        process.nextTick(() => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, STALL_MS))
      })
      timer = setTimeout(() => socket.destroy(new Error('Preview connection timed out')), CONNECT_TIMEOUT_MS)
      signal.addEventListener('abort', abort, { once: true })
      if (signal.aborted) abort()
    })
    return { attempts, stalled, error }
  } finally {
    if (timer) clearTimeout(timer)
    signal.removeEventListener('abort', abort)
    socket.destroy()
  }
}

test('configured prerender preview stays on IPv4 during an event-loop stall', { timeout: 60_000 }, async (t) => {
  const projectRoot = fileURLToPath(new URL('../', import.meta.url))
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'production', isPreview: true },
    path.join(projectRoot, 'vite.config.ts'), projectRoot, 'silent')
  assert.ok(loaded, '必须读取项目真实配置，不得在夹具中硬编码修复值')
  const root = await mkdtemp(path.join(tmpdir(), 'jev-preview-host-'))
  let server: PreviewServer | undefined
  try {
    await mkdir(path.join(root, 'dist'))
    // --- 仅带入真实 host；不执行 Cloudflare、Start 或其它项目插件 ---
    server = await preview({
      root, configFile: false, envDir: false, appType: 'custom', logLevel: 'silent',
      preview: { host: loaded.config.preview?.host, port: 0, open: false },
    })
    const resolved = server.resolvedUrls?.local[0]
    assert.ok(resolved)
    const url = new URL(resolved)
    const result = await connectAfterStall(url, t.signal)
    t.diagnostic(JSON.stringify({ hostname: url.hostname, listening: server.httpServer.address(),
      attempts: result.attempts, error: result.error && String(result.error),
      causes: result.error instanceof AggregateError ? result.error.errors.map(String) : undefined }))
    assert.equal(url.hostname, '127.0.0.1', '预渲染 URL 必须与交付验收使用相同的 IPv4 回环地址')
    assert.ok(result.stalled, '必须在真实 TCP 连接过程中施加事件循环停顿')
    assert.ifError(result.error)
    assert.deepEqual(result.attempts, ['127.0.0.1'])
  } finally {
    try { await server?.close() }
    finally { await rm(root, { recursive: true, force: true }) }
  }
})
