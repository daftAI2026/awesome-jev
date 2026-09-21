import { mkdirSync, lstatSync, readdirSync, readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs'
import { resolve, join } from 'node:path'
import type { ReviewStore, ReviewStoreOptions, ReviewTask } from './review-types.ts'

const MAX_BYTES = 8 * 1024 * 1024

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && typeof error.code === 'string'
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null
}

export function createReviewStore(directory: string | undefined, { now = Date.now() }: ReviewStoreOptions = {}): ReviewStore {
  if (!directory) throw new Error('submission-missing-state-directory')
  const root = resolve(directory)
  mkdirSync(root, { recursive: true })
  if (lstatSync(root).isSymbolicLink()) throw new Error('submission-invalid-state-directory')

  const read = (path: string): unknown => {
    let stat
    try {
      stat = lstatSync(path)
    } catch (error: unknown) {
      if (isNodeError(error) && error.code === 'ENOENT') return null
      throw error
    }
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_BYTES) throw new Error('submission-invalid-state-file')
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as unknown
    } catch {
      throw new Error('submission-invalid-state-file')
    }
  }

  const pathFor = (id: string): string => {
    if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('submission-invalid-state-id')
    return join(root, `${id}.json`)
  }

  for (const name of readdirSync(root).filter((entry) => /^[a-f0-9]{64}\.json$/.test(entry))) {
    const path = join(root, name)
    const state = record(read(path))
    const completedAt = typeof state?.completedAt === 'string' ? state.completedAt : undefined
    const updatedAt = typeof state?.updatedAt === 'string' ? state.updatedAt : undefined
    const touched = Date.parse(completedAt ?? updatedAt ?? '')
    if (Number.isFinite(touched) && now - touched > 30 * 86400000) unlinkSync(path)
  }

  read(join(root, 'manifest.json'))
  writeFileSync(join(root, 'manifest.json'), JSON.stringify({ format: 1, updatedAt: new Date(now).toISOString() }), { flag: 'w' })

  return {
    load: async (id: string): Promise<ReviewTask | null> => {
      const value = read(pathFor(id))
      return value === null ? null : value as ReviewTask
    },
    save: async (id: string, state: ReviewTask): Promise<void> => {
      const path = pathFor(id)
      const text = JSON.stringify({ ...state, updatedAt: new Date(now).toISOString() })
      if (Buffer.byteLength(text) > MAX_BYTES) throw new Error('submission-state-too-large')
      // 独立临时文件 + 原子替换，避免中断留下半份 JSON。
      const temp = `${path}.${process.pid}.${Date.now()}.tmp`
      writeFileSync(temp, text, { flag: 'wx', mode: 0o600 })
      renameSync(temp, path)
    },
  }
}

export function memoryReviewStore(): ReviewStore {
  const data = new Map<string, ReviewTask>()
  return {
    load: async (id: string): Promise<ReviewTask | null> => structuredClone(data.get(id) ?? null),
    save: async (id: string, state: ReviewTask): Promise<void> => {
      data.set(id, structuredClone(state))
    },
  }
}
