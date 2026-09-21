import { repoKey } from './catalog.mjs'

export function evidenceIssue(repo, readme) {
  const text = `${repo.name}\n${repo.description ?? ''}\n${readme}`
  // --- 确定性前置门槛只负责保守分流，不把模型置信度当作安全证明 ---
  const provider = /typesafe\.ai\b|@typesafe-ai\/|github\.com\/typesafe-ai\/|\bTypeSafe AI\b/i.test(text)
  const subject = /\bjev\b|system[\s_-]?one/i.test(text)
  if (!provider || !subject) return 'insufficient-provider-context'
  if (/\b(?:ignore|disregard|override)\b.{0,60}\b(?:instructions|rules|system prompt)\b/i.test(text) ||
    /\b(?:always|must)\s+(?:return|respond|output)\s+["'`]*(?:keep|accepted)\b/i.test(text)) {
    return 'instruction-like-evidence'
  }
  return null
}

export async function githubEvidence(api, key) {
  const repo = await api(`/repos/${key}`)
  if (repo.private || repo.fork || repo.archived || repoKey(repo.html_url) !== key) throw new Error('github-ineligible-repository')
  const branch = await api(`/repos/${key}/commits/${encodeURIComponent(repo.default_branch)}`)
  if (!/^[a-f0-9]{40}$/.test(branch.sha)) throw new Error('github-invalid-sha')
  const readme = await api(`/repos/${key}/readme?ref=${branch.sha}`)
  if (readme.encoding !== 'base64' || typeof readme.content !== 'string' ||
    readme.content.length > 180000 || readme.size > 128000 || typeof readme.path !== 'string') throw new Error('github-invalid-readme')
  const text = Buffer.from(readme.content, 'base64').toString('utf8').slice(0, 12000)
  if (!text.trim()) throw new Error('github-empty-readme')
  return { repo, sha: branch.sha, readme, text,
    evidenceUrl: `https://github.com/${key}/blob/${branch.sha}/${readme.path.split('/').map(encodeURIComponent).join('/')}` }
}
