import type { GitHubApi, GitHubEvidence, GitHubReadme, GitHubRepository } from './model-types.ts'
import { repoKey } from './catalog.ts'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function repository(value: unknown): GitHubRepository {
  if (!isRecord(value) || typeof value.html_url !== 'string' || typeof value.full_name !== 'string' ||
    typeof value.name !== 'string' || !isRecord(value.owner) || typeof value.owner.login !== 'string') {
    throw new Error('github-ineligible-repository')
  }
  return value as unknown as GitHubRepository
}

export function evidenceIssue(repo: Pick<GitHubRepository, 'name' | 'description'>, readme: string): string | null {
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

interface CommitResponse { sha?: unknown }

function commitSha(value: unknown): string {
  if (!isRecord(value) || typeof value.sha !== 'string' || !/^[a-f0-9]{40}$/.test(value.sha)) {
    throw new Error('github-invalid-sha')
  }
  return value.sha
}

function readmeResponse(value: unknown): { raw: Record<string, unknown>; readme: GitHubReadme } {
  if (!isRecord(value) || typeof value.path !== 'string') throw new Error('github-invalid-readme')
  return {
    raw: value,
    readme: {
      path: value.path,
      encoding: typeof value.encoding === 'string' ? value.encoding : undefined,
      content: typeof value.content === 'string' ? value.content : undefined,
      size: typeof value.size === 'number' ? value.size : undefined,
    },
  }
}

export interface GitHubEvidenceOptions {
  allowFullScan?: boolean
}

export async function githubEvidence(
  api: GitHubApi,
  key: string,
  { allowFullScan = false }: GitHubEvidenceOptions = {},
): Promise<GitHubEvidence> {
  const repo = repository(await api(`/repos/${key}`))
  if (repo.private || repo.fork || repo.archived || repoKey(repo.html_url) !== key) {
    throw new Error('github-ineligible-repository')
  }
  const branch = await api(`/repos/${key}/commits/${encodeURIComponent(String(repo.default_branch))}`) as CommitResponse
  const sha = commitSha(branch)
  const fallback: GitHubEvidence = {
    repo,
    sha,
    readme: { path: '' },
    text: '',
    evidenceUrl: `https://github.com/${key}/tree/${sha}`,
  }
  let response: unknown
  try {
    response = await api(`/repos/${key}/readme?ref=${sha}`)
  } catch (error: unknown) {
    if (allowFullScan && error instanceof Error && error.message === 'github-http-404') return fallback
    throw error
  }
  let raw: Record<string, unknown>
  let readme: GitHubReadme
  try {
    ({ raw, readme } = readmeResponse(response))
  } catch {
    if (allowFullScan) return fallback
    throw new Error('github-invalid-readme')
  }
  if (raw.encoding !== 'base64' || typeof raw.content !== 'string' ||
    raw.content.length > 180000 || (typeof raw.size === 'number' && raw.size > 128000) ||
    typeof raw.path !== 'string') {
    if (allowFullScan) return fallback
    throw new Error('github-invalid-readme')
  }
  const text = Buffer.from(raw.content, 'base64').toString('utf8')
  if (Buffer.byteLength(text) > 128000) {
    if (allowFullScan) return fallback
    throw new Error('github-invalid-readme')
  }
  if (!text.trim()) {
    if (allowFullScan) return fallback
    throw new Error('github-empty-readme')
  }
  return {
    repo,
    sha,
    readme,
    text,
    evidenceUrl: `https://github.com/${key}/blob/${sha}/${readme.path.split('/').map(encodeURIComponent).join('/')}`,
  }
}
