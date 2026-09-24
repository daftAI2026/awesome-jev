import type { DirectoryItem } from './types.ts'

export interface GitHubRepository {
  owner: string
  repo: string
  /** Lower-cased identity used for case-insensitive matching. */
  key: string
}

// Catalog sources may use organization slugs with a trailing hyphen; keep the
// segment bounded and path-safe rather than over-constraining GitHub naming.
const OWNER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/
const REPOSITORY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/
const GITHUB_REPOSITORY_URL = /^https:\/\/([^/?#]+)(\/[^?#]*)?$/i

function validRepositoryParts(owner: string, repo: string): boolean {
  return OWNER_PATTERN.test(owner) && REPOSITORY_PATTERN.test(repo) && repo !== '.' && repo !== '..'
}

/**
 * Parse one canonical GitHub repository URL. Rejects non-repository paths,
 * credentials, query/hash aliases, encoded separators, and path traversal.
 */
export function parseGitHubRepositoryUrl(value: string): GitHubRepository | null {
  if (typeof value !== 'string' || value.length === 0 || /[\\\u0000-\u001f\u007f]/.test(value)) return null

  // Inspect the raw path before URL() normalizes dot segments such as /a/../b.
  const match = GITHUB_REPOSITORY_URL.exec(value)
  if (!match || /%(?:2f|5c)/i.test(value)) return null

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return null
  }

  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname.toLowerCase() !== 'github.com' ||
    parsed.port !== '' ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) return null

  const rawPath = match[2] ?? ''
  const segments = rawPath.split('/').slice(1)
  if (segments.at(-1) === '') segments.pop()
  if (segments.length !== 2) return null

  const [owner, rawRepo] = segments
  if (!owner || !rawRepo || owner.includes('%') || rawRepo.includes('%')) return null
  const repo = rawRepo.toLowerCase().endsWith('.git') ? rawRepo.slice(0, -4) : rawRepo
  if (!validRepositoryParts(owner, repo)) return null

  return { owner, repo, key: `${owner}/${repo}`.toLowerCase() }
}

/** Build the stable, lower-case internal URL for a GitHub repository. */
export function projectPath(owner: string, repo: string): string | null {
  if (typeof owner !== 'string' || typeof repo !== 'string' || !validRepositoryParts(owner, repo)) return null
  return `/projects/${owner.toLowerCase()}/${repo.toLowerCase()}`
}

export function projectPathFromUrl(url: string): string | null {
  const repository = parseGitHubRepositoryUrl(url)
  return repository ? projectPath(repository.owner, repository.repo) : null
}

export function projectPathFor(item: Pick<DirectoryItem, 'type' | 'url'>): string | null {
  return item.type === 'github' ? projectPathFromUrl(item.url) : null
}

/**
 * Resolve a route pair without trusting it as a filesystem path or URL.
 * GitHub is case-insensitive for owner/repository names; same repo names under
 * different owners remain distinct. Ambiguous duplicate records fail closed.
 */
export function findGitHubProject(
  items: readonly DirectoryItem[],
  owner: string,
  repo: string,
): DirectoryItem | undefined {
  if (typeof owner !== 'string' || typeof repo !== 'string' || !validRepositoryParts(owner, repo)) return undefined
  const key = `${owner}/${repo}`.toLowerCase()
  let found: DirectoryItem | undefined

  for (const item of items) {
    if (item.type !== 'github') continue
    const parsed = parseGitHubRepositoryUrl(item.url)
    if (parsed?.key !== key) continue
    if (found) return undefined
    found = item
  }

  return found
}
