/**
 * [INPUT]: 依赖离线 PNG 生成器、临时目录与公开可见性夹具
 * [OUTPUT]: 验证新鲜计数、隐藏身份隔离、产物缺失和免费容量门槛
 * [POS]: scripts 的构建阶段护栏；不写正式目录或线上资源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, writeFile, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { generateOgAssets, assertFreeAssetCount } from './generate-og.ts'
import { projectShareImage } from '../src/lib/share-image.ts'
import type { DirectoryItem } from '../src/lib/types.ts'

const rows: DirectoryItem[] = [
  { id: 'live', type: 'github', url: 'https://github.com/owner/live', title: 'Live', summary: 'Current', sourceMeta: {} },
  { id: 'hidden', type: 'github', url: 'https://github.com/owner/hidden', title: 'Hidden', summary: 'Retired', sourceMeta: { lifecycle: { status: 'review' } } } as DirectoryItem,
]
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

test('build generates exactly the current public images and removes retired image artifacts', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'jev-og-build-'))
  try {
    await mkdir(path.join(root, 'scripts'))
    await writeFile(path.join(root, 'scripts/awesome-jev-banner.txt'), 'JEV')
    const output = path.join(root, 'dist/client/_og')
    await mkdir(output, { recursive: true })
    await writeFile(path.join(output, 'notes.txt'), 'keep unknown files')
    const retired = new URL(projectShareImage(rows[1]).path, 'https://assets.local').searchParams.get('v')!
    await writeFile(path.join(output, retired + '.png'), png)
    const rendered: string[] = []
    const count = await generateOgAssets(root, rows, async (svg) => { rendered.push(svg); return png })
    assert.equal(count, 2)
    assert.equal(rendered.length, 2)
    assert.ok(rendered.some((svg) => svg.includes('>1 GitHub projects</text>')))
    assert.ok(rendered.every((svg) => !svg.includes('Hidden')))
    const files = await readdir(output)
    assert.equal(files.length, 3)
    assert.ok(!files.includes(retired + '.png'))
    assert.equal(await readFile(path.join(output, 'notes.txt'), 'utf8'), 'keep unknown files')
    for (const file of files.filter((file) => file.endsWith('.png'))) assert.deepEqual(new Uint8Array(await readFile(path.join(output, file))), png)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('render failure aborts the build instead of substituting an old or site image', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'jev-og-build-'))
  try {
    await mkdir(path.join(root, 'scripts'))
    await writeFile(path.join(root, 'scripts/awesome-jev-banner.txt'), 'JEV')
    await assert.rejects(generateOgAssets(root, rows, async () => { throw new Error('render failed') }), /render failed/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('the free asset limit is a build gate rather than a paid upgrade', () => {
  assert.doesNotThrow(() => assertFreeAssetCount(20_000))
  assert.throws(() => assertFreeAssetCount(20_001), /20.?000|20000/)
  assert.throws(() => assertFreeAssetCount(-1), /Invalid/)
})
