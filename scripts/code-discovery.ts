import { createHash } from 'node:crypto'
import { exclusion } from './repository-review.ts'

type Api = (path: string) => Promise<unknown>
export const CODE_QUERIES = ['"api.typesafe.ai" in:file', '"@typesafe-ai/sdk" in:file', '"TYPESAFE_API_KEY" in:file', '"jev-latest" in:file']
export interface CodeHint { query: string; path: string }
export interface EvidenceLink { url: string; path: string; sha256: string }
interface CodeItem { path?: string; repository?: { full_name?: string; private?: boolean; fork?: boolean; archived?: boolean } }
export interface CodeSearchPage { total: number; incomplete: boolean; count: number; hits: { repo: string; hint: CodeHint }[] }
export async function searchCodePage(api: Api, query: string, page: number): Promise<CodeSearchPage> {
  const data = await api(`/search/code?q=${encodeURIComponent(query)}&per_page=100&page=${page}`) as { items?: CodeItem[]; total_count?: number; incomplete_results?: boolean }
  if (!Array.isArray(data.items) || !Number.isSafeInteger(data.total_count) || data.total_count! < 0) throw new Error('github-invalid-response')
  const hits: CodeSearchPage['hits'] = []
  for (const item of data.items) {
    const repo = item.repository
    if (!repo?.full_name || !/^[\w.-]+\/[\w.-]+$/.test(repo.full_name) || repo.private || repo.fork || repo.archived || !item.path || exclusion(item.path, '100644')) continue
    hits.push({ repo: repo.full_name.toLowerCase(), hint: { query, path: item.path } })
  }
  return { total: data.total_count!, incomplete: !!data.incomplete_results, count: data.items.length, hits }
}
export async function integrationEvidence(api: Api, key: string, sha: string, hints: CodeHint[]): Promise<{ text: string; links: EvidenceLink[]; incomplete: boolean }> {
  const links: EvidenceLink[] = [], texts: string[] = []
  let incomplete = false
  // 搜索索引只负责发现；必须重新读取当前固定提交，不能把过时命中当成当前证据。
  for (const path of [...new Set(hints.map((hint) => hint.path))].slice(0, 3)) {
    if (exclusion(path, '100644')) { incomplete = true; continue }
    const route = path.split('/').map(encodeURIComponent).join('/')
    try {
      const data = await api(`/repos/${key}/contents/${route}?ref=${sha}`) as { type?: string; encoding?: string; content?: string; size?: number; sha?: string }
      if (data.type !== 'file' || data.encoding !== 'base64' || typeof data.content !== 'string' || !Number.isSafeInteger(data.size) || data.size! > 128000 || data.content.length > 180000) throw new Error('github-invalid-code-evidence')
      const bytes = Buffer.from(data.content, 'base64')
      if (bytes.length !== data.size || bytes.includes(0) || createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') !== data.sha) throw new Error('github-invalid-code-evidence')
      const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      const url = `https://github.com/${key}/blob/${sha}/${route}`
      texts.push(`\n--- Integration evidence: ${path} ---\n${text}`)
      links.push({ url, path, sha256: createHash('sha256').update(bytes).digest('hex') })
    } catch { incomplete = true }
  }
  return { text: texts.join('\n'), links, incomplete }
}
