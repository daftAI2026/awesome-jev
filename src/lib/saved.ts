import { CATEGORIES, NEWS_CATEGORIES, type Category } from './categories.ts'

export type SavedKind = 'github' | 'news'
export type SavedSection = SavedKind

export interface SavedRouteSearch {
  preview?: string
  section?: SavedSection
  projectCategory?: Category
  newsCategory?: (typeof NEWS_CATEGORIES)[number]
}

export function savedRouteSearch(search: Record<string, unknown>): SavedRouteSearch {
  return {
    preview: typeof search.preview === 'string' && search.preview.length > 0 && search.preview.length <= 200 ? search.preview : undefined,
    section: search.section === 'github' || search.section === 'news' ? search.section : undefined,
    projectCategory: typeof search.projectCategory === 'string' && (CATEGORIES as readonly string[]).includes(search.projectCategory)
      ? search.projectCategory as Category : undefined,
    newsCategory: typeof search.newsCategory === 'string' && (NEWS_CATEGORIES as readonly string[]).includes(search.newsCategory)
      ? search.newsCategory as (typeof NEWS_CATEGORIES)[number] : undefined,
  }
}

export interface SavedEntry {
  kind: SavedKind
  id: string
  savedAt: string
}

export const SAVED_KEY = 'awesome-jev-saved-v1'
const MAX_SAVED = 5000

export function parseSaved(raw: string | null): SavedEntry[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value) || value.length > MAX_SAVED) return []
    const keys = new Set<string>()
    const entries: SavedEntry[] = []
    for (const entry of value) {
      if (!entry || typeof entry !== 'object') continue
      const candidate = entry as Record<string, unknown>
      if ((candidate.kind !== 'github' && candidate.kind !== 'news') ||
        typeof candidate.id !== 'string' || !candidate.id || candidate.id.length > 200 ||
        typeof candidate.savedAt !== 'string' || !Number.isFinite(Date.parse(candidate.savedAt))) continue
      const key = `${candidate.kind}:${candidate.id}`
      if (keys.has(key)) continue
      keys.add(key)
      entries.push({ kind: candidate.kind, id: candidate.id, savedAt: candidate.savedAt })
    }
    return entries
  } catch {
    return []
  }
}

export function toggleSaved(entries: SavedEntry[], kind: SavedKind, id: string, savedAt: string): SavedEntry[] {
  if (entries.some((entry) => entry.kind === kind && entry.id === id)) {
    return entries.filter((entry) => entry.kind !== kind || entry.id !== id)
  }
  if (entries.length >= MAX_SAVED) throw new Error('Saved storage limit reached')
  return [{ kind, id, savedAt }, ...entries]
}
