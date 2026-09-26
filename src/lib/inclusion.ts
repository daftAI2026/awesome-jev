export interface InclusionBasis {
  text: { en: string; zh: string; ja: string }
  evidence: Array<{ url: string; quote: string }>
  checkedAt: string
  reviewer: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// --- 无空格的中日文逐字计入预算，避免长段摘录绕过词数限制 ---
function excerptUnits(value: string): number {
  const cjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu
  const characters = value.match(cjk)?.length ?? 0
  const words = value.replace(cjk, ' ').split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length
  return characters + words
}

// --- 依据必须绑定本项目的固定源码版本；分类和评分不是证据 ---
export function pinnedSource(url: unknown, repositoryUrl: string): { rawUrl: string; path: string } | null {
  if (typeof url !== 'string') return null
  try {
    const repository = new URL(repositoryUrl)
    const source = new URL(url)
    const parts = source.pathname.split('/').slice(1)
    if (repository.origin !== 'https://github.com' || repository.username || repository.password || repository.search || repository.hash ||
      source.origin !== 'https://github.com' || source.username || source.password || source.search ||
      !/^\/[^/]+\/[^/]+\/?$/.test(repository.pathname) || parts.length < 5 ||
      `/${parts[0]}/${parts[1]}`.toLowerCase() !== repository.pathname.replace(/\/$/, '').toLowerCase() ||
      parts[2] !== 'blob' || !/^[a-f0-9]{40}$/.test(parts[3]) ||
      (source.hash && !/^#L\d+(?:-L\d+)?$/.test(source.hash))) return null
    const pathParts = parts.slice(4).map(decodeURIComponent)
    if (pathParts.some((part) => !part || part === '.' || part === '..' || /[\\/]/.test(part) ||
      [...part].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127))) return null
    return { rawUrl: `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts[3]}/${pathParts.map(encodeURIComponent).join('/')}`, path: pathParts.join('/') }
  } catch {
    return null
  }
}

export function isInclusionBasis(value: unknown, repositoryUrl: string): value is InclusionBasis {
  if (!isRecord(value) || !isRecord(value.text) || !Array.isArray(value.evidence) ||
    value.evidence.length < 1 || value.evidence.length > 2 ||
    typeof value.checkedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value.checkedAt) ||
    !Number.isFinite(Date.parse(value.checkedAt)) ||
    new Date(value.checkedAt).toISOString() !== (value.checkedAt.includes('.') ? value.checkedAt : value.checkedAt.replace('Z', '.000Z')) ||
    typeof value.reviewer !== 'string' || !/^[a-z0-9][a-z0-9 ._-]{0,59}$/.test(value.reviewer)) return false
  if (!(['en', 'zh', 'ja'] as const).every((locale) => {
    const text = (value.text as Record<string, unknown>)[locale]
    return typeof text === 'string' && text.trim().length > 0 && text.length <= 600
  })) return false
  const citations = new Set<string>()
  const wordsBySource = new Map<string, number>()
  return value.evidence.every((entry) => {
    if (!isRecord(entry) || !pinnedSource(entry.url, repositoryUrl) ||
      typeof entry.quote !== 'string' || entry.quote.trim().length < 8 || entry.quote.length > 350) return false
    const key = `${entry.url}\n${entry.quote}`
    if (citations.has(key)) return false
    citations.add(key)
    const file = (entry.url as string).split('#')[0]
    const words = (wordsBySource.get(file) ?? 0) + excerptUnits(entry.quote)
    if (words > 25) return false
    wordsBySource.set(file, words)
    return true
  })
}
