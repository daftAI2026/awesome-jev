import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const RADAR_BUDGET_VERSION = 1
export const RADAR_DAILY_LIMIT = 2000
export const RADAR_BUDGET_FILENAME = 'jev-radar-budget.json'

export interface RadarBudgetState {
  version: 1
  day: string
  used: number
  limit: number
}

export interface RadarBudgetOptions {
  now?: () => Date
  limit?: number
}

export interface RadarBudget {
  readonly path: string
  readonly beforeRequest: () => Promise<void>
  snapshot(): RadarBudgetState
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const validDay = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(`${value}T00:00:00.000Z`))

const utcDay = (date: Date): string => {
  if (!Number.isFinite(date.getTime())) throw new Error('radar-budget-invalid-time')
  return date.toISOString().slice(0, 10)
}

function validateState(value: unknown, limit: number): RadarBudgetState {
  if (!isRecord(value) || value.version !== RADAR_BUDGET_VERSION || !validDay(value.day) ||
    value.limit !== limit || typeof value.used !== 'number' || !Number.isSafeInteger(value.used) || value.used < 0 || value.used > limit) {
    throw new Error('radar-budget-invalid-state')
  }
  return { version: 1, day: value.day, used: value.used, limit }
}

function persist(path: string, state: RadarBudgetState): void {
  mkdirSync(dirname(path), { recursive: true })
  const temporary = `${path}.${process.pid}.tmp`
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
  renameSync(temporary, path)
}

function load(path: string, day: string, limit: number): RadarBudgetState {
  if (!existsSync(path)) return { version: 1, day, used: 0, limit }
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown
  } catch {
    throw new Error('radar-budget-invalid-state')
  }
  const state = validateState(parsed, limit)
  return state.day === day ? state : { version: 1, day, used: 0, limit }
}

export function createRadarBudget(directory: string, { now = () => new Date(), limit = RADAR_DAILY_LIMIT }: RadarBudgetOptions = {}): RadarBudget {
  if (!directory || !Number.isSafeInteger(limit) || limit < 1 || limit > RADAR_DAILY_LIMIT) {
    throw new Error('radar-budget-invalid-config')
  }
  const path = join(directory, RADAR_BUDGET_FILENAME)
  let state = load(path, utcDay(now()), limit)
  try {
    // 初始化也落盘，确保没有付费请求时仍有可上传的当日账本。
    persist(path, state)
  } catch {
    throw new Error('radar-budget-persist-failed')
  }
  const beforeRequest = async (): Promise<void> => {
    const day = utcDay(now())
    if (state.day !== day) state = { version: 1, day, used: 0, limit }
    if (state.used >= state.limit) throw new Error('radar-budget-exhausted')
    const next: RadarBudgetState = { ...state, used: state.used + 1 }
    try {
      // 先落盘再放行请求；进程中断也只会少发，不会让账本少记一次已预约请求。
      persist(path, next)
    } catch {
      throw new Error('radar-budget-persist-failed')
    }
    state = next
  }
  return {
    path,
    beforeRequest,
    snapshot: () => ({ ...state }),
  }
}
