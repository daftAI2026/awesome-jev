/**
 * [INPUT]: 依赖当前源码、Vite 配置和 Node 临时目录；不读取凭据
 * [OUTPUT]: 提供 buildErrorFixture，复制真实页面并注入仅测试用失败路由
 * [POS]: scripts 的故障隔离夹具；生产源码和构建产物均不含故障入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'

export const ERROR_CANARY = 'PRIVATE_ERROR_CANARY_DO_NOT_PUBLISH'

export async function buildErrorFixture(root = process.cwd()) {
  const cwd = await mkdtemp(path.join(tmpdir(), 'jev-error-fixture-'))
  const cleanup = () => rm(cwd, { recursive: true, force: true })
  try {
    await Promise.all(['src', 'scripts'].map((file) => cp(path.join(root, file), path.join(cwd, file), { recursive: true })))
    for (const file of ['package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'tsconfig.scripts.json', 'wrangler.toml']) {
      await cp(path.join(root, file), path.join(cwd, file))
    }
    await symlink(path.join(root, 'node_modules'), path.join(cwd, 'node_modules'), 'dir')
    await mkdir(path.join(cwd, 'data'))
    await mkdir(path.join(cwd, 'public'))
    const projects = JSON.parse(await readFile(path.join(root, 'data/github.json'), 'utf8'))
    await writeFile(path.join(cwd, 'data/github.json'), JSON.stringify(projects.slice(0, 1)))
    await writeFile(path.join(cwd, 'data/news.json'), '[]')
    await cp(path.join(root, 'public/favicon.svg'), path.join(cwd, 'public/favicon.svg'))
    const config = (await readFile(path.join(root, 'vite.config.ts'), 'utf8')).replace('enabled: true,', 'enabled: false,')
    await writeFile(path.join(cwd, 'vite.config.ts'), config)
    for (const [name, id, stage] of [
      ['{-$locale}.fault.tsx', '/{-$locale}/fault', 'loader'],
      ['_directory.{-$locale}.fault-nested.tsx', '/_directory/{-$locale}/fault-nested', 'loader'],
      ['{-$locale}.fault-before.tsx', '/{-$locale}/fault-before', 'beforeLoad'],
    ]) {
      await writeFile(path.join(cwd, 'src/routes', name!), `import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('${id}')({
  ${stage}: () => { throw new Error('${ERROR_CANARY}') },
  head: () => ({ meta: [{ title: 'SHOULD_NOT_INDEX' }], links: [{ rel: 'canonical', href: 'https://invalid.test/success' }] }),
  component: () => <h1>SHOULD_NOT_RENDER</h1>,
})`)
    }
    await writeFile(path.join(cwd, 'src/routes/{-$locale}.fault-render.tsx'), `import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
export const Route = createFileRoute('/{-$locale}/fault-render')({ component: Fault })
function Fault() {
  const [fail, setFail] = useState(false)
  useEffect(() => setFail(true), [])
  if (fail) throw new Error('${ERROR_CANARY}')
  return <p>Client render fixture</p>
}`)
    await writeFile(path.join(cwd, 'src/routes/{-$locale}.fault-retry.tsx'), `import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
let requests = 0
const load = createServerFn({ method: 'GET' }).handler(() => {
  if (++requests === 1) throw new Error('${ERROR_CANARY}')
  return true
})
export const Route = createFileRoute('/{-$locale}/fault-retry')({ loader: () => load(), component: () => <h1>Recovered successfully</h1> })`)
    // --- 仅复制品接受失败注入；不在正式路由增加开关 ---
    await promisify(execFile)(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'build'], {
      cwd, env: { ...process.env, CLOUDFLARE_SEND_METRICS: 'false', WRANGLER_SEND_METRICS: 'false' }, timeout: 180_000, maxBuffer: 8 * 1024 * 1024,
    })
    return { cwd, cleanup }
  } catch (error) {
    await cleanup()
    throw error
  }
}
