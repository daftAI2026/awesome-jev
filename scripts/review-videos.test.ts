import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { reviewVideos, validateVideoCandidates, writeVideoReviewArtifact, type VideoCandidate, type VideoEvaluator } from './review-videos.ts'
import type { JevScore } from './model-types.ts'

const score: JevScore = { jevAbout: 0.99, jevKeep: 'keep', jevKeepConfidence: 0.99 }

const candidate = (overrides: Partial<VideoCandidate> = {}): VideoCandidate => ({
  videoId: 'abc12345678', title: 'Jev integration', channel: 'TypeSafe channel',
  publishedAt: '2026-09-22T00:00:00.000Z', views: 42, url: 'https://www.youtube.com/watch?v=abc12345678',
  description: 'A complete real description about TypeSafe AI Jev.', fetchedAt: '2026-09-22T01:00:00.000Z', ...overrides,
})

test('validates fields, URL identity, duplicates and candidate limit', () => {
  assert.deepEqual(validateVideoCandidates([candidate()]), [candidate()])
  assert.deepEqual(validateVideoCandidates([candidate({ url: 'https://youtu.be/abc12345678' })]), [candidate({ url: 'https://youtu.be/abc12345678' })])
  assert.throws(() => validateVideoCandidates([candidate({ url: 'https://www.youtube.com/watch?v=other1234567' })]), /video-candidate-0-url/)
  assert.throws(() => validateVideoCandidates([candidate(), candidate()]), /video-candidate-1-duplicate/)
  assert.throws(() => validateVideoCandidates([candidate({ views: 1.5 })]), /video-candidate-0-views/)
  assert.throws(() => validateVideoCandidates([candidate({ publishedAt: 'not-a-date' })]), /video-candidate-0-date/)
  assert.throws(() => validateVideoCandidates([candidate({ title: '' })]), /video-candidate-0-string/)
  assert.throws(() => validateVideoCandidates(Array.from({ length: 51 }, (_, index) => candidate({ videoId: `id${String(index).padStart(10, '0')}` }))), /video-candidate-limit-50/)
})

test('missing description is review without a paid evaluator call', async () => {
  let calls = 0
  const evaluate: VideoEvaluator = async () => { calls++; return score }
  const result = await reviewVideos('offline-key', [candidate({ description: null })], { evaluate })
  assert.equal(calls, 0)
  assert.equal(result.requests, 0)
  assert.equal(result.results[0]?.decision, 'review')
  assert.equal(result.results[0]?.scope.metadataOnly, true)
  assert.equal(result.results[0]?.scope.descriptionAvailable, false)
  assert.equal(result.results[0]?.scope.captionsViewed, false)
  assert.equal(result.results[0]?.scope.videoViewed, false)
})

test('passes the complete description and counts each injected beforeRequest', async () => {
  let received = ''
  let requests = 0
  const description = 'full description '.repeat(1000)
  const evaluate: VideoEvaluator = async (_key, row, evidence, options) => {
    assert.equal(row.type, 'youtube')
    assert.equal(row.title, 'Jev integration')
    assert.equal(row.sourceMeta?.handle, 'TypeSafe channel')
    received = evidence
    await options?.beforeRequest?.()
    requests++
    return score
  }
  const result = await reviewVideos('offline-key', [candidate({ description })], { evaluate })
  assert.equal(received, description)
  assert.equal(requests, 1)
  assert.equal(result.requests, 1)
  assert.equal(result.results[0]?.decision, 'keep')
  assert.equal(result.results[0]?.evidenceSha256, createHash('sha256').update(JSON.stringify({ title: 'Jev integration', channel: 'TypeSafe channel', description })).digest('hex'))
})

test('request budget leaves excess candidates pending without a false decision', async () => {
  const evaluate: VideoEvaluator = async (_key, _row, _evidence, options) => {
    await options?.beforeRequest?.()
    return score
  }
  const result = await reviewVideos('offline-key', [candidate(), candidate({ videoId: 'def12345678', url: 'https://www.youtube.com/watch?v=def12345678' }), candidate({ videoId: 'ghi12345678', url: 'https://www.youtube.com/watch?v=ghi12345678' })], { evaluate, maxRequests: 2 })
  assert.equal(result.requests, 2)
  assert.equal(result.results.length, 2)
  assert.deepEqual(result.pending.map((item) => item.videoId), ['ghi12345678'])
})

test('deadline leaves the current and remaining candidates pending', async () => {
  let current = new Date('2026-09-22T00:00:00.000Z')
  const evaluate: VideoEvaluator = async (_key, _row, _evidence, options) => {
    await options?.beforeRequest?.()
    current = new Date('2026-09-22T00:01:01.000Z')
    return score
  }
  const result = await reviewVideos('offline-key', [candidate(), candidate({ videoId: 'def12345678', url: 'https://www.youtube.com/watch?v=def12345678' })], { evaluate, now: () => current, deadlineMs: 60_000 })
  assert.equal(result.results.length, 1)
  assert.deepEqual(result.pending.map((item) => item.videoId), ['def12345678'])
})

test('evaluator errors are not collected as decisions and later candidates may proceed', async () => {
  let calls = 0
  const evaluate: VideoEvaluator = async (_key, _row, _evidence, options) => {
    calls++
    await options?.beforeRequest?.()
    if (calls === 1) throw new Error('jev-network-or-timeout')
    return score
  }
  const result = await reviewVideos('offline-key', [candidate(), candidate({ videoId: 'def12345678', url: 'https://www.youtube.com/watch?v=def12345678' })], { evaluate })
  assert.equal(result.results.length, 1)
  assert.equal(result.results[0]?.candidate.videoId, 'def12345678')
  assert.equal(result.pending[0]?.videoId, 'abc12345678')
})

test('artifact writer replaces output atomically and preserves the JSON shape', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'jev-video-review-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const output = join(directory, 'nested', 'result.json')
  const artifact = { version: 1 as const, status: 'partial' as const, requestLimit: 100, requests: 0, results: [], pending: [candidate()] }
  writeVideoReviewArtifact(output, artifact)
  assert.deepEqual(JSON.parse(readFileSync(output, 'utf8')), artifact)
})
