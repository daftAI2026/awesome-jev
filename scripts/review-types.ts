
import type {
  FactScores as ModelFactScores,
  GitHubApi,
  GitHubDirectoryItem,
  GitHubEvidence,
  GitHubRepository,
  JevScore,
} from './model-types.ts'

export type { GitHubApi, GitHubDirectoryItem, GitHubEvidence, GitHubRepository, JevScore, ReviewKeep } from './model-types.ts'

export type ReviewScore = JevScore
export type ReviewRow = GitHubDirectoryItem
export type ReviewRepository = GitHubRepository
export type ReviewEvidence = Omit<GitHubEvidence, 'readme'> & { readme?: GitHubEvidence['readme'] }
export type FactScores = ModelFactScores

export interface ReviewPart {
  start: number
  end: number
  lineStart: number
  lineEnd: number
  facts?: FactScores
  model?: string
}

export type ReviewFileStatus = 'pending' | 'done' | 'excluded' | 'blocked'

export interface ReviewFile {
  path: string
  sha?: string
  size?: number
  status: ReviewFileStatus
  reason?: string
  parts?: ReviewPart[]
}

export interface ReviewQueueEntry {
  path: string
  sha: string
}

export interface ReviewProgress {
  checked: number
  total: number
  excluded: number
  blocked: number
  inventoryComplete: boolean
}

export interface ReviewResult {
  repo: string
  deep?: boolean
  progress?: ReviewProgress
  evidence: string
  status: 'pending' | 'review' | 'keep' | 'drop'
  reason?: string
  evidenceLinks?: string[]
  score?: ReviewScore
}

export interface ReviewReceipt {
  checked?: number
  total?: number
  excluded?: number
  blocked?: number
  inventoryComplete?: boolean
  manifestHash: string
  limitations: Array<{ path: string; reason?: string }>
  exclusions: Record<string, number>
  segments: number
  models: string[]
}

export interface ReviewInFlight {
  kind: 'initial' | 'segments'
  at: string
}

export interface ReviewTask {
  policy: string
  context: string
  repo: string
  sha: string
  row: ReviewRow
  initialDone: boolean
  queue: ReviewQueueEntry[]
  files: ReviewFile[]
  inFlight: ReviewInFlight | null
  instructionFlag?: boolean
  initial?: ReviewScore | null
  result?: ReviewResult
  completedAt?: string
  receipt?: ReviewReceipt
  updatedAt?: string
}

export interface ReviewStore {
  load(id: string): Promise<ReviewTask | null>
  save(id: string, state: ReviewTask): Promise<void>
}

export interface ReviewStoreOptions {
  now?: number
}

export interface ReviewBeforeRequest {
  beforeRequest: () => Promise<void>
}

export interface ReviewInitialOptions extends ReviewBeforeRequest {
  attempts?: number
}

export interface ReviewSegment {
  path: string
  text: string
  start: number
  lineStart: number
}

export interface ReviewInspectResult {
  facts: FactScores[]
  model: string
}

export type Reviewer = (
  row: ReviewRow,
  text: string,
  options: ReviewInitialOptions,
) => Promise<ReviewScore>

export type Inspector = (
  row: ReviewRow,
  segments: ReviewSegment[],
  options: ReviewBeforeRequest,
) => Promise<ReviewInspectResult>

export type ReviewApi = GitHubApi

export interface ReviewOptions {
  store?: ReviewStore
  inspect?: Inspector
  manual?: boolean
  deadline?: number
  maxOperations?: number
}

export { isRecord } from './model-types.ts'

export function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
