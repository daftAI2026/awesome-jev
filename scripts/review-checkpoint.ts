import { appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createGitHubClient } from './github-client.ts'
import type { ReviewApi } from './review-types.ts'

const REPO = 'daftAI2026/awesome-jev'
type CheckpointKind = 'review' | 'radar' | 'alternatives'
const events = new Set(['workflow_dispatch', 'schedule', 'issues', 'issue_comment', 'workflow_run'])
const MAX_ARTIFACT_BYTES = 128 * 1024 * 1024

export interface ReviewCheckpoint {
  runId: number
  artifactId: number
}

interface WorkflowRun {
  id?: unknown
  workflow_id?: unknown
  path?: unknown
  head_branch?: unknown
  head_repository?: { full_name?: unknown }
  event?: unknown
  run_attempt?: unknown
  status?: unknown
}

interface Artifact {
  id?: unknown
  name?: unknown
  expired?: unknown
  size_in_bytes?: unknown
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function workflowRun(value: unknown): WorkflowRun | null {
  const run = record(value)
  if (!run) return null
  const headRepository = record(run.head_repository)
  return {
    id: run.id,
    workflow_id: run.workflow_id,
    path: run.path,
    head_branch: run.head_branch,
    head_repository: headRepository ? { full_name: headRepository.full_name } : undefined,
    event: run.event,
    run_attempt: run.run_attempt,
    status: run.status,
  }
}

function artifact(value: unknown): Artifact | null {
  const item = record(value)
  return item ? { id: item.id, name: item.name, expired: item.expired, size_in_bytes: item.size_in_bytes } : null
}

const safeInteger = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value)

export async function latestCheckpoint(api: ReviewApi, currentRun: number, kind: CheckpointKind = 'review'): Promise<ReviewCheckpoint | null> {
  const file = kind === 'radar' ? 'radar.yml' : kind === 'alternatives' ? 'alternatives.yml' : 'submission-review.yml'
  const workflowPath = `.github/workflows/${file}`
  const prefix = kind === 'radar' ? 'jev-radar-budget' : kind === 'alternatives' ? 'jev-alternatives-budget' : 'jev-review-checkpoint'
  const workflow = record(await api(`/repos/${REPO}/actions/workflows/${file}`))
  const workflowId = workflow?.id
  if (!safeInteger(workflowId)) throw new Error('submission-invalid-workflow')
  for (let page = 1; page <= 10; page++) {
    const response = record(await api(`/repos/${REPO}/actions/workflows/${workflowId}/runs?branch=main&status=completed&per_page=100&page=${page}`))
    const rawRuns = response?.workflow_runs
    if (!Array.isArray(rawRuns)) throw new Error('submission-invalid-workflow-runs')
    for (const raw of rawRuns) {
      const run = workflowRun(raw)
      if (!run || run.id === currentRun || run.status !== 'completed' || run.workflow_id !== workflowId || run.path !== workflowPath ||
        run.head_branch !== 'main' || run.head_repository?.full_name !== REPO || typeof run.event !== 'string' ||
        !events.has(run.event) || !safeInteger(run.id) || !safeInteger(run.run_attempt)) continue
      const artifactsResponse = record(await api(`/repos/${REPO}/actions/runs/${run.id}/artifacts?per_page=100`))
      const artifacts = artifactsResponse?.artifacts
      if (!Array.isArray(artifacts)) throw new Error('submission-invalid-artifacts')
      const wantedName = `${prefix}-${run.id}-${run.run_attempt}`
      const found = artifacts.map(artifact).find((item): item is Artifact => !!item && item.expired !== true && item.name === wantedName)
      if (!found) continue
      if (!safeInteger(found.id) || typeof found.size_in_bytes !== 'number' || found.size_in_bytes < 0 || found.size_in_bytes > MAX_ARTIFACT_BYTES) {
        throw new Error('submission-invalid-artifact')
      }
      return { runId: run.id, artifactId: found.id }
    }
    if (rawRuns.length < 100) return null
  }
  throw new Error('submission-checkpoint-pagination-limit')
}

async function main(): Promise<void> {
  if (process.env.GITHUB_REPOSITORY !== REPO) throw new Error('submission-wrong-repository')
  const runId = Number(process.env.GITHUB_RUN_ID)
  const output = process.env.GITHUB_OUTPUT
  if (!safeInteger(runId) || !output) throw new Error('submission-invalid-run')
  const kind = process.env.JEV_CHECKPOINT_KIND ?? 'review'
  if (kind !== 'review' && kind !== 'radar' && kind !== 'alternatives') throw new Error('submission-invalid-checkpoint-kind')
  const checkpoint = await latestCheckpoint(createGitHubClient(process.env.GITHUB_TOKEN), runId, kind)
  if (checkpoint) appendFileSync(output, `run_id=${checkpoint.runId}\nartifact_id=${checkpoint.artifactId}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => {
    process.stderr.write('submission-checkpoint-restore-failed\n')
    process.exitCode = 1
  })
}
