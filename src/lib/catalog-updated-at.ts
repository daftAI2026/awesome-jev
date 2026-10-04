/**
 * [INPUT]: 依赖调用方传入的真实 Git 历史时间及标准 Date/Intl 格式化能力
 * [OUTPUT]: 对外提供时间规范化、固定 Asia/Shanghai 展示和 CATALOG_TIME_ZONE
 * [POS]: lib 的目录更新时间纯边界，被 Vite 构建和 App 页脚共用，缺失/无效历史返回空值而不造时间
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const CATALOG_TIME_ZONE = 'Asia/Shanghai'

export function normalizeCatalogUpdatedAt(value: string | null | undefined): string | null {
  const text = value?.trim()
  if (!text) return null
  const date = new Date(text)
  return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

export function formatCatalogUpdatedAt(value: string | null | undefined): string | null {
  const normalized = normalizeCatalogUpdatedAt(value)
  if (!normalized) return null

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CATALOG_TIME_ZONE,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(normalized))
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]))
  const month = values.month
  const day = values.day
  const hour = values.hour === '24' ? '00' : values.hour
  const minute = values.minute
  if (!month || !day || !hour || !minute) return null
  return `${month}/${day} ${hour}:${minute}`
}
