import { mkdirSync, lstatSync, readdirSync, readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs'
import { resolve, join } from 'node:path'
const MAX_BYTES = 8 * 1024 * 1024
export function createReviewStore(directory, { now = Date.now() } = {}) {
  if (!directory) throw new Error('submission-missing-state-directory')
  const root = resolve(directory)
  mkdirSync(root, { recursive: true })
  if (lstatSync(root).isSymbolicLink()) throw new Error('submission-invalid-state-directory')
  const read = (path) => {
    let stat
    try { stat = lstatSync(path) } catch (error) { if (error.code === 'ENOENT') return null; throw error }
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_BYTES) throw new Error('submission-invalid-state-file')
    try { return JSON.parse(readFileSync(path, 'utf8')) } catch { throw new Error('submission-invalid-state-file') }
  }
  const pathFor = (id) => {
    if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('submission-invalid-state-id')
    return join(root, `${id}.json`)
  }
  for (const name of readdirSync(root).filter((n) => /^[a-f0-9]{64}\.json$/.test(n))) {
    const path = join(root, name), state = read(path)
    const touched = Date.parse(state?.completedAt ?? state?.updatedAt)
    if (Number.isFinite(touched) && now - touched > 30 * 86400000) unlinkSync(path)
  }
  read(join(root, 'manifest.json'))
  writeFileSync(join(root, 'manifest.json'), JSON.stringify({ format: 1, updatedAt: new Date(now).toISOString() }), { flag: 'w' })
  return {
    load: async (id) => read(pathFor(id)),
    async save(id, state) {
      const path = pathFor(id), text = JSON.stringify({ ...state, updatedAt: new Date(now).toISOString() })
      if (Buffer.byteLength(text) > MAX_BYTES) throw new Error('submission-state-too-large')
      // 随机临时文件 + 原子替换，避免中断留下半份 JSON。
      const temp = `${path}.${process.pid}.${Date.now()}.tmp`
      writeFileSync(temp, text, { flag: 'wx', mode: 0o600 })
      renameSync(temp, path)
    },
  }
}
export function memoryReviewStore() {
  const data = new Map()
  return { load: async (id) => structuredClone(data.get(id) ?? null), save: async (id, state) => { data.set(id, structuredClone(state)) } }
}
