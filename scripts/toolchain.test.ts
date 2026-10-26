/**
 * [INPUT]: 依赖插件解析的 Miniflare、Node 子进程与随机端口回环 HTTP
 * [OUTPUT]: 验证畸形编码响应被拒绝且外部 Undici 不终止进程
 * [POS]: scripts 的工具链安全回归；不覆盖插件内联的 Undici 副本
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const runNode = promisify(execFile)
const CHILD_TIMEOUT_MS = 15_000

test('plugin Miniflare rejects excessive content encodings without crashing its process', {
  timeout: CHILD_TIMEOUT_MS + 5_000,
}, async (t) => {
  const pluginRequire = createRequire(import.meta.resolve('@cloudflare/vite-plugin'))
  const miniflareEntry = pluginRequire.resolve('miniflare')
  const miniflareRequire = createRequire(miniflareEntry)
  const undiciVersion = miniflareRequire('undici/package.json').version
  t.diagnostic(`插件 Miniflare 的外部 Undici：${undiciVersion}；不覆盖插件内联副本`)

  // --- 上游 #16476：先发出六重编码头，再在正文到达前关闭连接 ---
  let requests = 0
  const upstream = createServer((_request, response) => {
    requests++
    response.writeHead(200, {
      'Content-Encoding': 'gzip, gzip, gzip, gzip, gzip, gzip',
      'Content-Length': '1',
    })
    response.flushHeaders()
    response.socket?.end()
  })
  try {
    await new Promise<void>((resolve, reject) => {
      upstream.once('error', reject)
      upstream.listen(0, '127.0.0.1', () => {
        upstream.off('error', reject)
        resolve()
      })
    })
    const address = upstream.address()
    assert.ok(address && typeof address === 'object')

    // --- 独立进程保留未捕获异常语义；禁止挂 error 监听吞掉漏洞 ---
    const script = `
      import assert from 'node:assert/strict'
      import { setTimeout } from 'node:timers/promises'
      const { fetch } = await import(process.argv[2])
      await assert.rejects(fetch(process.argv[1]), (error) => {
        assert.match(error.cause?.message ?? '', /too many content-encodings/)
        return true
      })
      await setTimeout(100)
      process.stdout.write('fetch rejected safely\\n')
    `
    const child = await runNode(process.execPath, [
      '--input-type=module', '-e', script,
      `http://127.0.0.1:${address.port}/`, pathToFileURL(miniflareEntry).href,
    ], {
      encoding: 'utf8', timeout: CHILD_TIMEOUT_MS, killSignal: 'SIGKILL',
      signal: t.signal, maxBuffer: 128 * 1024,
    })
    assert.equal(requests, 1, '必须验证真实 HTTP 响应，不能只验证依赖版本')
    assert.equal(child.stdout.trim(), 'fetch rejected safely')
    assert.equal(child.stderr, '')
  } finally {
    upstream.closeAllConnections()
    if (upstream.listening) await new Promise<void>((resolve) => upstream.close(() => resolve()))
  }
})
