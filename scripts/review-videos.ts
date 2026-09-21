import { createHash } from 'node:crypto'
import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { evaluateJev, JEV_MODEL, reviewDecision, type EvaluateOptions } from './jev-client.ts'
import type { JevRow, JevScore, ReviewKeep } from './model-types.ts'

export const MAX_VIDEO_CANDIDATES = 50
export const MAX_VIDEO_REQUESTS = 100
export const VIDEO_DEADLINE_MS = 12 * 60 * 1000
export const VIDEO_ARTIFACT_VERSION = 1

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/
const CANDIDATE_FIELDS = ['videoId', 'title', 'channel', 'publishedAt', 'views', 'url', 'description', 'fetchedAt'] as const

export interface VideoCandidate {
  videoId: string
  title: string
  channel: string
  publishedAt: string
  views: number
  url: string
  description: string | null
  fetchedAt: string
}

export interface VideoReviewScope {
  source: 'youtube'
  evidenceFields: readonly ['title', 'channel', 'description']
  metadataOnly: true
  descriptionAvailable: boolean
  captionsViewed: false
  videoViewed: false
}

export interface VideoReviewResult {
  candidate: VideoCandidate
  score?: JevScore
  decision: ReviewKeep
  model: typeof JEV_MODEL
  checkedAt: string
  evidenceSha256: string
  scope: VideoReviewScope
}

export interface VideoReviewArtifact {
  version: 1
  status: 'complete' | 'partial'
  requestLimit: number
  requests: number
  results: VideoReviewResult[]
  pending: VideoCandidate[]
}

export type VideoEvaluator = (
  key: string,
  row: JevRow,
  evidence: string,
  options?: EvaluateOptions,
) => Promise<JevScore>

export type VideoClock = () => Date

export interface ReviewVideosOptions {
  evaluate?: VideoEvaluator
  now?: VideoClock
  maxRequests?: number
  deadlineMs?: number
  onProgress?: (artifact: VideoReviewArtifact) => void | Promise<void>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const nonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const validDate = (value: unknown): value is string =>
  typeof value === 'string' && ISO_DATE_PATTERN.test(value) && Number.isFinite(Date.parse(value))

const validViews = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

function urlVideoId(value: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:') return null
  const host = parsed.hostname.toLowerCase()
  if (host === 'youtu.be') {
    const parts = parsed.pathname.split('/').filter(Boolean)
    return parts.length === 1 ? parts[0] ?? null : null
  }
  if (host !== 'youtube.com' && host !== 'www.youtube.com' && host !== 'm.youtube.com') return null
  if (parsed.pathname === '/watch') {
    const values = parsed.searchParams.getAll('v')
    return values.length === 1 ? values[0] ?? null : null
  }
  const pathMatch = /^\/(?:shorts|embed)\/([^/]+)\/?$/.exec(parsed.pathname)
  return pathMatch?.[1] ?? null
}

function validateVideoCandidate(value: unknown, index: number): VideoCandidate {
  if (!isRecord(value)) throw new Error(`video-candidate-${index}-invalid`)
  const unknownField = Object.keys(value).find((field) => !(CANDIDATE_FIELDS as readonly string[]).includes(field))
  if (unknownField) throw new Error(`video-candidate-${index}-unknown-field`)
  const videoId = value.videoId
  const title = value.title
  const channel = value.channel
  const publishedAt = value.publishedAt
  const views = value.views
  const url = value.url
  const description = value.description
  const fetchedAt = value.fetchedAt
  if (typeof videoId !== 'string' || !VIDEO_ID_PATTERN.test(videoId)) throw new Error(`video-candidate-${index}-video-id`)
  if (!nonEmptyString(title) || !nonEmptyString(channel)) throw new Error(`video-candidate-${index}-string`)
  if (!validDate(publishedAt) || !validDate(fetchedAt)) throw new Error(`video-candidate-${index}-date`)
  if (!validViews(views)) throw new Error(`video-candidate-${index}-views`)
  if (typeof url !== 'string' || !url.trim() || urlVideoId(url) !== videoId) throw new Error(`video-candidate-${index}-url`)
  if (description !== null && typeof description !== 'string') throw new Error(`video-candidate-${index}-description`)
  return { videoId, title, channel, publishedAt, views, url, description, fetchedAt }
}

export function validateVideoCandidates(value: unknown): VideoCandidate[] {
  if (!Array.isArray(value)) throw new Error('video-candidates-must-be-array')
  if (value.length > MAX_VIDEO_CANDIDATES) throw new Error(`video-candidate-limit-${MAX_VIDEO_CANDIDATES}`)
  const seen = new Set<string>()
  return value.map((candidate, index) => {
    const validated = validateVideoCandidate(candidate, index)
    if (seen.has(validated.videoId)) throw new Error(`video-candidate-${index}-duplicate`)
    seen.add(validated.videoId)
    return validated
  })
}

const scopeFor = (candidate: VideoCandidate): VideoReviewScope => ({
  source: 'youtube',
  evidenceFields: ['title', 'channel', 'description'],
  metadataOnly: true,
  descriptionAvailable: candidate.description !== null && candidate.description.trim().length > 0,
  captionsViewed: false,
  videoViewed: false,
})

const evidenceHash = (candidate: VideoCandidate): string => createHash('sha256')
  .update(JSON.stringify({ title: candidate.title, channel: candidate.channel, description: candidate.description }))
  .digest('hex')

const rowFor = (candidate: VideoCandidate): JevRow => ({
  type: 'youtube',
  title: candidate.title,
  summary: candidate.description ?? '',
  url: candidate.url,
  sourceMeta: {
    handle: candidate.channel,
    videoId: candidate.videoId,
    views: candidate.views,
    date: candidate.publishedAt,
  },
})

const runStop = (error: unknown): boolean => error instanceof Error &&
  (error.message === 'video-budget-exhausted' || error.message === 'video-deadline')

function validClockDate(clock: VideoClock): Date {
  const value = clock()
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error('video-invalid-clock')
  return value
}

function validateRunOptions(maxRequests: number, deadlineMs: number): void {
  if (!Number.isSafeInteger(maxRequests) || maxRequests < 1 || maxRequests > MAX_VIDEO_REQUESTS) {
    throw new Error(`video-request-limit-1-${MAX_VIDEO_REQUESTS}`)
  }
  if (!Number.isSafeInteger(deadlineMs) || deadlineMs < 1 || deadlineMs > VIDEO_DEADLINE_MS) {
    throw new Error(`video-deadline-limit-1-${VIDEO_DEADLINE_MS}`)
  }
}

export async function reviewVideos(
  key: string,
  candidates: readonly VideoCandidate[],
  {
    evaluate = evaluateJev,
    now = () => new Date(),
    maxRequests = MAX_VIDEO_REQUESTS,
    deadlineMs = VIDEO_DEADLINE_MS,
    onProgress,
  }: ReviewVideosOptions = {},
): Promise<VideoReviewArtifact> {
  if (!key.trim()) throw new Error('video-missing-key')
  validateRunOptions(maxRequests, deadlineMs)
  const validated = validateVideoCandidates(candidates)
  const startedAt = validClockDate(now).getTime()
  const deadline = startedAt + deadlineMs
  const results: VideoReviewResult[] = []
  const pending = [...validated]
  let requests = 0

  const snapshot = (): VideoReviewArtifact => ({
    version: VIDEO_ARTIFACT_VERSION,
    status: pending.length ? 'partial' : 'complete',
    requestLimit: maxRequests,
    requests,
    results: structuredClone(results),
    pending: structuredClone(pending),
  })
  const progress = async (): Promise<void> => { await onProgress?.(snapshot()) }
  await progress()

  const beforeRequest = async (): Promise<void> => {
    if (validClockDate(now).getTime() >= deadline) throw new Error('video-deadline')
    if (requests >= maxRequests) throw new Error('video-budget-exhausted')
    requests++
    await progress()
  }

  for (const candidate of validated) {
    if (validClockDate(now).getTime() >= deadline) break
    const description = candidate.description
    const scope = scopeFor(candidate)
    if (description === null || description.trim().length === 0) {
      results.push({ candidate, decision: 'review', model: JEV_MODEL, checkedAt: validClockDate(now).toISOString(), evidenceSha256: evidenceHash(candidate), scope })
      pending.splice(pending.findIndex((item) => item.videoId === candidate.videoId), 1)
      await progress()
      continue
    }
    try {
      const score = await evaluate(key, rowFor(candidate), description, { beforeRequest })
      results.push({ candidate, score, decision: reviewDecision(score), model: JEV_MODEL,
        checkedAt: validClockDate(now).toISOString(), evidenceSha256: evidenceHash(candidate), scope })
      pending.splice(pending.findIndex((item) => item.videoId === candidate.videoId), 1)
      await progress()
    } catch (error) {
      // 错误不生成审查结论；当前候选留在 pending，供下一次云端运行重试。
      if (runStop(error)) break
      await progress()
    }
  }
  return snapshot()
}

export function writeVideoReviewArtifact(output: string, artifact: VideoReviewArtifact): void {
  mkdirSync(dirname(output), { recursive: true })
  const temporary = `${output}.${process.pid}.tmp`
  writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`, { mode: 0o600 })
  renameSync(temporary, output)
}

async function main(): Promise<void> {
  const output = process.argv[2]
  if (!output) throw new Error('video-output-required')
  const key = process.env.TYPESAFE_API_KEY
  if (!key?.trim()) throw new Error('Configure repository Actions secret TYPESAFE_API_KEY first')
  const rawCandidates = process.env.JEV_VIDEO_CANDIDATES
  if (!rawCandidates) throw new Error('JEV_VIDEO_CANDIDATES is required')
  let parsed: unknown
  try {
    parsed = JSON.parse(rawCandidates) as unknown
  } catch {
    throw new Error('video-candidates-invalid-json')
  }
  const candidates = validateVideoCandidates(parsed)
  const result = await reviewVideos(key, candidates, { onProgress: (artifact) => writeVideoReviewArtifact(resolve(output), artifact) })
  writeVideoReviewArtifact(resolve(output), result)
  process.stdout.write(`review-videos: ${result.results.length} reviewed, ${result.pending.length} pending, ${result.requests}/${result.requestLimit} requests\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'video-review-failed'}\n`)
    process.exitCode = 1
  })
}
