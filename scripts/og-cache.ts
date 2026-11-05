/**
 * [INPUT]: Exact SVG, renderer/font/toolchain identity and an offline renderer.
 * [OUTPUT]: Reusable PNG bytes with input addressing and output integrity checks.
 * [POS]: Build-only cache outside dist; misses and corruption always render again.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { join } from 'node:path'

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const digest = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest()

export async function cachedPng(
  directory: string,
  identity: string,
  svg: string,
  render: (svg: string) => Promise<Uint8Array>,
  used?: Set<string>,
): Promise<Uint8Array> {
  const key = digest(JSON.stringify([identity, svg])).toString('hex')
  used?.add(`${key}.bin`)
  const file = join(directory, `${key}.bin`)
  try {
    const entry = await readFile(file)
    const png = entry.subarray(32)
    if (png.subarray(0, 8).equals(signature) && digest(png).equals(entry.subarray(0, 32))) return png
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  const png = Buffer.from(await render(svg))
  if (!png.subarray(0, 8).equals(signature)) throw new Error('Invalid rendered PNG')
  await mkdir(directory, { recursive: true })
  const temporary = `${file}.${process.pid}.tmp`
  await writeFile(temporary, Buffer.concat([digest(png), png]))
  await rename(temporary, file)
  return png
}
