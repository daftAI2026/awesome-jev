import { TextDecoder } from 'node:util'
import { candidateRow } from './catalog.mjs'
import { evidenceIssue } from './github-evidence.mjs'
import { combineReviews, reviewDecision } from './jev-client.mjs'

export const MAX_FILES = 8
export const MAX_FILE_BYTES = 64000
export const MAX_EXTRA_CHARS = 120000
const shaPattern = /^[a-f0-9]{40}$/
const decoder = new TextDecoder('utf-8', { fatal: true })
const code = /\.(?:[cm]?[jt]sx?|py|go|rs|php|lua|rb|java|kt|swift|cs|sh|mod|toml|ya?ml|json|md|rst|txt)$/i
const blocked = /(?:^|\/)(?:\.git|node_modules|vendor|dist|build|coverage|\.next|target|__pycache__)(?:\/|$)|(?:^|\/)(?:\.env(?:\.|$)|[^/]*(?:lock|secret|credential)[^/]*$)|\.(?:min\.[jt]s|pem|key)$/i
const safePath = (path) => typeof path === 'string' && path.length < 400 && ![...path].some((char) => char.charCodeAt(0) < 32) && !/[\\?#]/.test(path) &&
  !path.split('/').some((part) => !part || part === '.' || part === '..')
const urlFor = (key, sha, path) => `https://github.com/${key}/blob/${sha}/${path.split('/').map(encodeURIComponent).join('/')}`

export function selectEvidenceFiles(tree, readmePath) {
  const priority = (path) => /jev|typesafe|system.?one|integrat/i.test(path) ? 0 :
    /(?:^|\/)(?:examples?|demos?|docs?)(?:\/|$)/i.test(path) ? 1 :
      /(?:^|\/)(?:package\.json|pyproject\.toml|Cargo\.toml|go\.mod|composer\.json)$/i.test(path) ? 2 :
        /(?:^|\/)(?:src|lib|app|plugin|lua)(?:\/|$)|(?:^|\/)(?:main|index|client|api)\./i.test(path) ? 3 : 4
  return tree.filter((file) => file.type === 'blob' && ['100644', '100755'].includes(file.mode) && safePath(file.path) &&
    file.path !== readmePath && code.test(file.path) && !blocked.test(file.path))
    .sort((a, b) => priority(a.path) - priority(b.path) || a.path.localeCompare(b.path))
    .slice(0, MAX_FILES)
}
export async function repositoryEvidence(api, key, evidence) {
  const commit = await api(`/repos/${key}/git/commits/${evidence.sha}`)
  if (!shaPattern.test(commit.tree?.sha ?? '')) throw new Error('github-invalid-tree')
  const tree = await api(`/repos/${key}/git/trees/${commit.tree.sha}?recursive=1`)
  if (!Array.isArray(tree.tree)) throw new Error('github-invalid-tree')
  const files = selectEvidenceFiles(tree.tree, evidence.readme.path)
  const documents = [], skipped = []
  let size = 0
  for (const file of files) {
    if (!shaPattern.test(file.sha ?? '') || !Number.isSafeInteger(file.size) || file.size > MAX_FILE_BYTES || file.size < 0) {
      skipped.push(file.path); continue
    }
    const blob = await api(`/repos/${key}/git/blobs/${file.sha}`)
    if (blob.encoding !== 'base64' || typeof blob.content !== 'string' || blob.content.length > MAX_FILE_BYTES * 1.5) {
      skipped.push(file.path); continue
    }
    let text
    try { text = decoder.decode(Buffer.from(blob.content, 'base64')) } catch { skipped.push(file.path); continue }
    if (Buffer.byteLength(text) > MAX_FILE_BYTES || text.includes('\0') || size + text.length + file.path.length + 32 > MAX_EXTRA_CHARS) {
      skipped.push(file.path); continue
    }
    if (!text.trim()) continue
    const section = `\n--- FILE: ${file.path} ---\n${text}`
    size += section.length
    documents.push({ text: section, url: urlFor(key, evidence.sha, file.path) })
  }
  return { text: documents.map((doc) => doc.text).join('\n'), urls: documents.map((doc) => doc.url),
    incomplete: !!tree.truncated || skipped.length > 0, filesRead: documents.length, skipped: skipped.length }
}

export async function reviewRepository(api, review, key, evidence) {
  const row = candidateRow(evidence.repo)
  const initialReason = evidenceIssue(evidence.repo, evidence.text)
  const base = { repo: key, stars: evidence.repo.stargazers_count, evidence: evidence.evidenceUrl }
  if (initialReason === 'instruction-like-evidence') return { ...base, status: 'review', reason: initialReason }
  const initial = initialReason ? null : await review(row, evidence.text)
  if (initial && reviewDecision(initial) !== 'review') return { ...base, status: reviewDecision(initial), score: initial }
  const extra = await repositoryEvidence(api, key, evidence)
  const result = { ...base, deep: true, filesRead: extra.filesRead, evidenceLinks: extra.urls }
  const reason = evidenceIssue(evidence.repo, evidence.text + '\n' + extra.text)
  if (reason === 'instruction-like-evidence') return { ...result, status: 'review', reason }
  if (extra.incomplete) return { ...result, status: 'review', reason: 'incomplete-evidence' }
  if (reason) return { ...result, status: 'review', reason }
  if (!extra.text) return { ...result, status: 'review', reason: 'insufficient-usage-evidence' }
  // 相关说明可能仅在代码中：不能因 README 缺少提供商名称跳过它。
  const scores = initial ? [initial] : [await review(row, evidence.text, { partial: true })]
  scores.push(await review(row, extra.text, { partial: true }))
  const score = combineReviews(scores)
  const status = reviewDecision(score)
  return { ...result, score, status: status === 'drop' ? 'review' : status,
    reason: status === 'keep' ? undefined : 'insufficient-usage-evidence' }
}
