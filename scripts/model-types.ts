export type ReviewKeep = 'keep' | 'review' | 'drop'
export type ProjectCategory = 'agents' | 'browser' | 'sdk' | 'developer' | 'research' | 'resources' | 'directories' | 'applications' | 'alternatives' | 'other'

export interface ScoreInput {
  jevAbout?: number
  jevKeep?: ReviewKeep
  jevKeepConfidence?: number
  category?: ProjectCategory
  needsReview?: boolean
  conflictingEvidence?: boolean
}

export interface CatalogSourceMeta extends ScoreInput {
  [key: string]: unknown
  repo?: string
  author?: string
  stars?: number
  forks?: number
  language?: string | null
  date?: string
}

export interface GitHubDirectoryItem {
  id: string
  type: 'github'
  title: string
  summary: string
  tags?: string[]
  category?: ProjectCategory
  url: string
  sourceMeta: CatalogSourceMeta
}

export type DirectoryItem = GitHubDirectoryItem

export interface Catalog {
  files: Map<string, DirectoryItem[]>
  rows: DirectoryItem[]
}

/** GitHub REST responses are untrusted JSON; required fields are validated at use sites. */
export interface GitHubRepository {
  html_url: string
  full_name: string
  name: string
  owner: { login: string }
  description?: string | null
  default_branch?: string
  topics?: string[]
  language?: string | null
  created_at?: string | null
  private?: boolean
  fork?: boolean
  archived?: boolean
  license?: { spdx_id?: string | null } | null
  stargazers_count?: number
  forks_count?: number
}

export interface GitHubReadme {
  encoding?: string
  content?: string
  size?: number
  path: string
}

export interface GitHubEvidence {
  repo: GitHubRepository
  sha: string
  readme: GitHubReadme
  text: string
  evidenceUrl: string
}

export type GitHubApi = (path: string) => Promise<unknown>

export type Waiter = (milliseconds: number) => Promise<unknown>

export type FetchImpl = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

/** Model input is deliberately partial: callers may submit an untrusted row for validation. */
export interface JevRow {
  type?: string
  title?: string
  summary?: string
  url?: string
  sourceMeta?: CatalogSourceMeta
  name?: string
  description?: string | null
  tags?: string[]
}

export interface JevScore extends ScoreInput {
  jevAbout: number
  jevKeep: ReviewKeep
  jevKeepConfidence: number
}

export interface ReviewQuestion {
  type: 'noul' | 'choice'
  instructions: string
  criteria?: Record<string, string>
}

export interface ReviewBody {
  model: string
  state: {
    type?: string
    title: string | null
    summary: string | null
    url?: string
    repo: string | null
    readme: string
    tags?: string[]
  }
  questions: {
    about: ReviewQuestion
    keep: ReviewQuestion
    category?: ReviewQuestion
  }
}

export interface EvidencePartBody {
  path?: string
  text?: string
  start?: number
  end?: number
  lineStart?: number
  lineEnd?: number
  facts?: FactScores
  model?: string
}

export interface FactsBody {
  model: string
  state: {
    project: { name?: string; summary?: string }
    segments: EvidencePartBody[]
  }
  questions: Record<string, { type: 'noul'; instructions: string }>
}

export interface FactScores {
  related: number
  useful: number
  mock: number
  conflict: number
  injection: number
}

export interface InspectResult {
  facts: FactScores[]
  model: string
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
