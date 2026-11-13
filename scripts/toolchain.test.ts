/**
 * [INPUT]: 依赖 Vite+ 单一内核、安装/构建脚本、Miniflare 与回环 HTTP
 * [OUTPUT]: 验证 Vite+ 真实接入、既有 Node 验收保留和外部 Undici 不崩溃
 * [POS]: scripts 的工具链安全回归；不覆盖插件内联的 Undici 副本
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const runNode = promisify(execFile)
const CHILD_TIMEOUT_MS = 15_000

test('Vite+ owns the build without replacing Node tests or the GitHub delivery chain', async () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const version = pkg.devDependencies['vite-plus']
  assert.match(version ?? '', /^\d+\.\d+\.\d+$/, '必须实际安装固定版本 Vite+，不是只改脚本名')
  assert.equal(pkg.devDependencies.vite, `npm:@voidzero-dev/vite-plus-core@${version}`)
  assert.equal(pkg.overrides.vite, '$vite', '第三方 Vite 消费方必须复用同一内核')
  assert.match(pkg.scripts.build, /&& vp build &&/)
  assert.match(pkg.scripts.test, /^node --experimental-strip-types --test /)
  const workflow = readFileSync(new URL('../.github/workflows/site.yml', import.meta.url), 'utf8')
  assert.match(workflow, /run: npm run build && npm run test:delivery/)
  assert.match(workflow, /npm ci --ignore-scripts/)
  assert.ok(!workflow.includes('voidzero-dev/setup-vp'), '原 GitHub 安装与验收链不迁移到另一套 Action')
  const config = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8')
  assert.match(config, /import \{ defineConfig \} from 'vite-plus'/)
  for (const name of ['verify-delivery.ts', 'error-page-fixture.ts']) {
    assert.ok(!readFileSync(new URL(name, import.meta.url), 'utf8').includes('node_modules/vite/bin/vite.js'), '交付与故障验收不能启动旧 Vite CLI')
  }
  const plus = await import('vite-plus')
  const core = await import('vite')
  assert.equal(typeof plus.defineConfig, 'function')
  assert.equal(typeof core.build, 'function')
  assert.match(core.version, /^8\./)
})

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
