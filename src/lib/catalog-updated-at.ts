
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
