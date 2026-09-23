#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { readCatalog, repoKey } from './catalog.ts'
import { createGitHubClient } from './github-client.ts'
import { alternativeEvidenceIssue, githubEvidence } from './github-evidence.ts'
import { classifyProjects, evaluateJev, JEV_MODEL, reviewDecision } from './jev-client.ts'
import type { GitHubApi, GitHubDirectoryItem, JevScore, ProjectCategory, ReviewKeep } from './model-types.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const checkpointPath = join(root, 'alternatives-audit.json.local')

interface AuditVerdict {
  decision: ReviewKeep
  reason?: string
  score?: JevScore
  sha?: string
  evidenceUrl?: string
  evidenceSha256?: string
  license?: string
  checkedAt: string
}

interface AuditState {
  version: 1
  fingerprint: string
  screened: Record<string, ProjectCategory>
  reviewed: Record<string, AuditVerdict>
}

const alternativeSignal = /\b(?:open[- ]?jev|jev[- ]?(?:like|compatible|style)|system[- ]?one[- ]?style|independent.{0,30}(?:jev|decision)|(?:jev|system[- ]?one).{0,35}(?:alternative|clone|reimplement)|(?:alternative|clone|reimplement).{0,35}(?:jev|system[- ]?one)|(?:train|trained|training).{0,50}decision model|local.{0,30}decision model|typed decisions?|decision models?|probabilistic decisions?)\b/i

export function possibleAlternative(row: Pick<GitHubDirectoryItem, 'title' | 'summary' | 'tags' | 'category'>,
  screenedCategory?: ProjectCategory): boolean {
  return row.category === 'alternatives' || screenedCategory === 'alternatives' ||
    alternativeSignal.test([row.title, row.summary, ...(row.tags ?? [])].join(' '))
}

function fingerprint(rows: GitHubDirectoryItem[]): string {
  const input = rows.map(({ id, title, summary, tags, url, sourceMeta }) => [id, title, summary, tags, url, sourceMeta.repo])
  return createHash('sha256').update(JSON.stringify(input)).digest('hex')
}

function loadState(hash: string): AuditState {
  if (!existsSync(checkpointPath)) return { version: 1, fingerprint: hash, screened: {}, reviewed: {} }
  const state = JSON.parse(readFileSync(checkpointPath, 'utf8')) as AuditState
  if (state.version !== 1 || state.fingerprint !== hash || !state.screened || !state.reviewed) {
    throw new Error('Audit input changed; move the local checkpoint aside before starting a fresh audit')
  }
  return state
}

function saveState(state: AuditState): void {
  const temporary = `${checkpointPath}.${process.pid}.tmp`
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
  renameSync(temporary, checkpointPath)
}

function localKey(): string {
  if (!process.env.TYPESAFE_API_KEY) {
    for (const name of ['.env.local', '.env']) {
      const path = join(root, name)
      if (existsSync(path)) process.loadEnvFile(path)
      if (process.env.TYPESAFE_API_KEY) break
    }
  }
  const key = process.env.TYPESAFE_API_KEY?.trim()
  if (!key) throw new Error('TYPESAFE_API_KEY is missing from the local environment')
  return key
}

function localGitHubToken(): string {
  if (process.env.GITHUB_TOKEN?.trim()) return process.env.GITHUB_TOKEN.trim()
  try { return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() }
  catch { throw new Error('GITHUB_TOKEN is missing; configure it or sign in with gh auth login') }
}

async function fetchEvidence(api: GitHubApi, repo: string): ReturnType<typeof githubEvidence> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await githubEvidence(api, repo) }
    catch (error) {
      if (!(error instanceof Error) || error.message !== 'github-network-or-timeout' || attempt === 2) throw error
      await sleep(1000 * 2 ** attempt)
    }
  }
  throw new Error('github-network-or-timeout')
}

export async function auditAlternatives(rows: GitHubDirectoryItem[], key: string, githubToken: string,
  state: AuditState, persist: (state: AuditState) => void): Promise<AuditState> {
  for (let start = 0; start < rows.length; start += 8) {
    const batch = rows.slice(start, start + 8)
    const pending = batch.filter((row) => !Object.hasOwn(state.screened, row.id))
    if (!pending.length) continue
    const categories = await classifyProjects(key, pending)
    pending.forEach((row, index) => { state.screened[row.id] = categories[index] })
    persist(state)
    if ((start + batch.length) % 80 < 8 || start + batch.length === rows.length) {
      process.stdout.write(`Screened ${Math.min(start + batch.length, rows.length)}/${rows.length}\n`)
    }
  }

  const candidates = rows.filter((row) => possibleAlternative(row, state.screened[row.id]))
    .sort((a, b) => (b.sourceMeta.stars ?? 0) - (a.sourceMeta.stars ?? 0) || a.id.localeCompare(b.id))
  const api = createGitHubClient(githubToken)
  let consecutiveForbidden = 0
  process.stdout.write(`${candidates.length} candidates for repository review\n`)
  for (const row of candidates) {
    if (Object.hasOwn(state.reviewed, row.id) && state.reviewed[row.id].reason !== 'github-network-or-timeout') continue
    const checkedAt = new Date().toISOString()
    const repo = repoKey(row.url)
    if (!repo) throw new Error(`Invalid catalog repository: ${row.id}`)
    let verdict: AuditVerdict
    try {
      const evidence = await fetchEvidence(api, repo)
      const license = evidence.repo.license?.spdx_id ?? undefined
      const reason = !license || license === 'NOASSERTION' ? 'missing-open-source-license' :
        alternativeEvidenceIssue(evidence.repo, evidence.text)
      const score = reason ? undefined : await evaluateJev(key, row, evidence.text, { alternative: true })
      if (score) consecutiveForbidden = 0
      const rawDecision = reason ? 'review' : reviewDecision(score)
      verdict = {
        decision: rawDecision === 'keep' && score?.category !== 'alternatives' ? 'review' : rawDecision,
        ...(reason ? { reason } : rawDecision === 'keep' && score?.category !== 'alternatives'
          ? { reason: 'category-not-alternative' } : {}),
        ...(score ? { score } : {}),
        sha: evidence.sha, evidenceUrl: evidence.evidenceUrl,
        evidenceSha256: createHash('sha256').update(evidence.text).digest('hex'),
        license, checkedAt,
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('jev-') && error.message !== 'jev-http-403') throw error
      if (error instanceof Error && error.message === 'jev-http-403') consecutiveForbidden++
      verdict = { decision: 'review', reason: error instanceof Error ? error.message : 'github-unavailable', checkedAt }
    }
    state.reviewed[row.id] = verdict
    persist(state)
    process.stdout.write(`${repo}: ${verdict.decision}${verdict.reason ? ` (${verdict.reason})` : ''}\n`)
    if (consecutiveForbidden >= 3) throw new Error('Three consecutive Jev 403 responses; audit paused with checkpoint')
  }
  return state
}

async function main(): Promise<void> {
  const rows = readCatalog(root).rows.filter((row): row is GitHubDirectoryItem => row.type === 'github')
  const state = loadState(fingerprint(rows))
  await auditAlternatives(rows, localKey(), localGitHubToken(), state, saveState)
  const counts = { keep: 0, review: 0, drop: 0 }
  const verdicts = Object.values(state.reviewed)
  for (const verdict of verdicts) counts[verdict.decision]++
  process.stdout.write(`${JSON.stringify({ model: JEV_MODEL, screened: Object.keys(state.screened).length,
    attempted: verdicts.length, evidenceChecked: verdicts.filter((verdict) => verdict.sha).length,
    modelScored: verdicts.filter((verdict) => verdict.score).length,
    ...counts, checkpoint: checkpointPath }, null, 2)}\n`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : 'audit-failed'}\n`); process.exitCode = 1 })
}
