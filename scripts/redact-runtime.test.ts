/**
 * [INPUT]: 依赖真实 Vite 配置、已锁定的运行时与 Vite 隔离打包
 * [OUTPUT]: 验证 Redact 插件顺序、SSR 同源替换与客户端完整功能模块
 * [POS]: scripts 的运行时接入回归；不构建目录页面，不替代浏览器交互验收
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build, loadConfigFromFile, type Plugin } from 'vite'

function bundledFiles(result: Awaited<ReturnType<typeof build>>) {
  return (Array.isArray(result) ? result : [result]).flatMap((output) => {
    assert.ok('output' in output, '隔离构建必须返回完成后的产物')
    return output.output
  })
}

test('configured Redact shares one runtime across SSR and a full-featured client', { timeout: 60_000 }, async (t) => {
  const projectRoot = fileURLToPath(new URL('../', import.meta.url))
  const loaded = await loadConfigFromFile({ command: 'build', mode: 'production' },
    path.join(projectRoot, 'vite.config.ts'), projectRoot, 'silent')
  assert.ok(loaded)
  const plugins = (loaded.config.plugins ?? []).flat(5).filter(Boolean) as Plugin[]
  const runtime = plugins.filter((plugin) => plugin.name.startsWith('redact'))
  assert.ok(runtime.some((plugin) => plugin.name === 'redact'), '真实项目必须启用 Redact，而不只是安装依赖')
  assert.ok(plugins.findIndex((plugin) => plugin.name === 'redact') > plugins.findIndex((plugin) => plugin.name.startsWith('vite:react')),
    'Redact 必须位于 React 插件之后')
  assert.equal(loaded.config.ssr?.noExternal, true, 'SSR 第三方 React 导入必须一起重定向')

  const root = await mkdtemp(path.join(tmpdir(), 'jev-redact-runtime-'))
  try {
    await symlink(path.join(projectRoot, 'node_modules'), path.join(root, 'node_modules'), 'dir')
    const entry = path.join(root, 'entry.js')
    await writeFile(entry, `
import { createElement, createContext, useContext, useId, useState } from 'react'
import { createElement as runtimeElement } from '@tanstack/redact'
import { renderToString } from 'react-dom/server'
const Context = createContext('wrong')
function Child() {
  const value = useContext(Context)
  const [count] = useState(7)
  return createElement('span', { id: useId() }, value + ':' + count)
}
export const shared = createElement === runtimeElement
export const html = renderToString(createElement(Context.Provider, { value: 'ready' }, createElement(Child)))
`)
    // --- 复用真实插件对象与 SSR 配置；不启动 Start/Workers 或抓取全站 ---
    const ssrResult = await build({ root, configFile: false, envDir: false, logLevel: 'silent',
      plugins: runtime, ssr: loaded.config.ssr, build: { ssr: entry, write: false, minify: false } })
    const server = bundledFiles(ssrResult).find((file) => file.type === 'chunk' && file.isEntry)
    assert.ok(server?.type === 'chunk')
    const rendered = await import(`data:text/javascript;base64,${Buffer.from(server.code).toString('base64')}`)
    assert.equal(rendered.shared, true, 'SSR 的 React 导入必须使用同一个 Redact 实例')
    assert.match(rendered.html, /<span id="[^"]+">ready:7<\/span>/)

    await writeFile(entry, `export { hydrateRoot } from 'react-dom/client'; export { createPortal } from 'react-dom';`)
    const clientResult = await build({ root, configFile: false, envDir: false, logLevel: 'silent', plugins: runtime,
      build: { write: false, minify: false, lib: { entry, formats: ['es'] } } })
    const chunks = bundledFiles(clientResult).filter((file) => file.type === 'chunk')
    const modules = chunks.flatMap((chunk) => Object.keys(chunk.modules)).map((id) => id.replaceAll('\\', '/'))
    assert.ok(modules.some((id) => id.includes('/@tanstack/redact/')), '浏览器产物必须实际包含 Redact')
    assert.ok(!modules.some((id) => /\/(react|react-dom)\/cjs\//.test(id)), '浏览器不能混入第二套 React 运行时')
    for (const feature of ['hydration', 'portal', 'context', 'class', 'suspense', 'lazy', 'memo', 'forward-ref', 'activity']) {
      assert.ok(modules.some((id) => id.includes(`/features/${feature}/full.js`)), `保留 ${feature} 的真实实现`)
      assert.ok(!modules.some((id) => id.includes(`/features/${feature}/stub.js`)), `禁止裁剪 ${feature}`)
    }
    t.diagnostic(`SSR 同源与客户端 ${modules.length} 个模块已验证；未执行全站构建`)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
