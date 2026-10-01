/**
 * [INPUT]: 依赖 GitHub Actions 工作流、attempt、jobs 与 artifact API
 * [OUTPUT]: 对外提供 可信审核状态与独立预算的恢复定位
 * [POS]: 服务端采集的跨运行恢复边界，不消费 PR artifact
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
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
  head_sha?: unknown
  updated_at?: unknown
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
    head_sha: run.head_sha,
    updated_at: run.updated_at,
  }
}

function artifact(value: unknown): Artifact | null {
  const item = record(value)
  return item ? { id: item.id, name: item.name, expired: item.expired, size_in_bytes: item.size_in_bytes } : null
}

const safeInteger = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value)

interface CheckpointOptions {
  currentAttempt?: number
  now?: Date
}

function trustedRun(run: WorkflowRun | null, workflowId: number, workflowPath: string): run is WorkflowRun & { id: number; run_attempt: number } {
  return !!run && run.workflow_id === workflowId && run.path === workflowPath && run.head_branch === 'main' &&
    run.head_repository?.full_name === REPO && typeof run.event === 'string' && events.has(run.event) &&
    safeInteger(run.id) && run.id > 0 && safeInteger(run.run_attempt) && run.run_attempt > 0
}

function timestamp(value: unknown): number {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new Error('submission-invalid-run-time')
  return Date.parse(value)
}

async function runArtifacts(api: ReviewApi, runId: number): Promise<Artifact[]> {
  const result: Artifact[] = []
  for (let page = 1; page <= 10; page++) {
    const response = record(await api(`/repos/${REPO}/actions/runs/${runId}/artifacts?per_page=100&page=${page}`))
    if (!Array.isArray(response?.artifacts)) throw new Error('submission-invalid-artifacts')
    result.push(...response.artifacts.map(artifact).filter((item): item is Artifact => item !== null))
    if (response.artifacts.length < 100) return result
  }
  throw new Error('submission-artifact-pagination-limit')
}

function findArtifact(artifacts: Artifact[], name: string): Artifact & { id: number } | null {
  const found = artifacts.find((item) => item.expired !== true && item.name === name)
  if (!found) return null
  if (!safeInteger(found.id) || found.id < 1 || typeof found.size_in_bytes !== 'number' || found.size_in_bytes < 0 || found.size_in_bytes > MAX_ARTIFACT_BYTES) {
    throw new Error('submission-invalid-artifact')
  }
  return found as Artifact & { id: number }
}

async function collectionTime(api: ReviewApi, run: WorkflowRun & { id: number; run_attempt: number }): Promise<number | null> {
  // 不根据 workflow 成功与否猜测是否花过预算；verify-only 和 skipped scan 没有付费阶段。
  if (typeof run.head_sha !== 'string' || !/^[a-f0-9]{40}$/i.test(run.head_sha)) throw new Error('submission-invalid-run-sha')
  const jobs: Record<string, unknown>[] = []
  for (let page = 1; page <= 10; page++) {
    const response = record(await api(`/repos/${REPO}/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100&page=${page}`))
    if (!Array.isArray(response?.jobs)) throw new Error('submission-invalid-jobs')
    for (const raw of response.jobs) {
      const job = record(raw)
      if (!job || job.run_id !== run.id || job.head_sha !== run.head_sha || job.status !== 'completed') throw new Error('submission-invalid-jobs')
      jobs.push(job)
    }
    if (response.jobs.length < 100) break
    if (page === 10) throw new Error('submission-job-pagination-limit')
  }
  if (!jobs.length) throw new Error('submission-invalid-jobs')
  const collectName = 'Collect and review (no dependency installation)'
  const collects = jobs.flatMap((job) => Array.isArray(job.steps) ? job.steps.map(record)
    .filter((step): step is Record<string, unknown> => step?.name === collectName) : [])
  const executed = collects.filter((step) => step.conclusion !== 'skipped')
  // --- job 改名不能抹掉已执行的付费阶段；多个阶段的账本归属不明时拒绝猜测 ---
  if (executed.length > 1) throw new Error('submission-budget-execution-unknown')
  if (executed.length === 1) return timestamp(executed[0].completed_at)
  const scan = jobs.find((job) => job.name === 'scan')
  const otherJobsAreVerification = jobs.every((job) => job.conclusion === 'skipped' ||
    (job.name === 'verify' && Array.isArray(job.steps)) || job === scan)
  if (!otherJobsAreVerification) throw new Error('submission-budget-execution-unknown')
  if (scan) {
    if (scan.conclusion === 'skipped' || collects.some((step) => step.conclusion === 'skipped')) return null
    throw new Error('submission-budget-execution-unknown')
  }
  // 完整 jobs 只包含明确的 verify/跳过任务才证明没有付费；未知名称不能作为空账本。
  return null
}

export async function latestCheckpoint(api: ReviewApi, currentRun: number, kind: CheckpointKind = 'review', {
  currentAttempt = 1, now = new Date(),
}: CheckpointOptions = {}): Promise<ReviewCheckpoint | null> {
  if (!safeInteger(currentRun) || currentRun < 1 || !safeInteger(currentAttempt) || currentAttempt < 1 || !Number.isFinite(now.getTime())) {
    throw new Error('submission-invalid-run')
  }
  const file = kind === 'radar' ? 'radar.yml' : kind === 'alternatives' ? 'alternatives.yml' : 'submission-review.yml'
  const workflowPath = `.github/workflows/${file}`
  const prefix = kind === 'radar' ? 'jev-radar-budget' : kind === 'alternatives' ? 'jev-alternatives-budget' : 'jev-review-checkpoint'
  const workflow = record(await api(`/repos/${REPO}/actions/workflows/${file}`))
  const workflowId = workflow?.id
  if (!safeInteger(workflowId)) throw new Error('submission-invalid-workflow')
  const runs: (WorkflowRun & { id: number; run_attempt: number })[] = []
  if (currentAttempt > 1) {
    const current = workflowRun(await api(`/repos/${REPO}/actions/runs/${currentRun}`))
    if (!trustedRun(current, workflowId, workflowPath) || current.id !== currentRun || current.run_attempt !== currentAttempt) throw new Error('submission-invalid-current-run')
    // 同一 run 的前次 attempt 不会出现在 completed 列表中，必须单独核对。
    for (let attempt = currentAttempt - 1; attempt >= 1; attempt--) {
      if (currentAttempt - attempt > 100) throw new Error('submission-attempt-pagination-limit')
      const previous = workflowRun(await api(`/repos/${REPO}/actions/runs/${currentRun}/attempts/${attempt}`))
      if (!trustedRun(previous, workflowId, workflowPath) || previous.id !== currentRun || previous.run_attempt !== attempt || previous.status !== 'completed') throw new Error('submission-invalid-run-attempt')
      runs.push(previous)
    }
  }
  // --- 预算域不用搜索 filter，避免 GitHub 的 1000 结果上限遮住旧 run 的今日重跑 ---
  const maximumRunPages = kind === 'review' ? 10 : 100
  const runFilter = kind === 'review' ? 'branch=main&status=completed&' : ''
  for (let page = 1; page <= maximumRunPages; page++) {
    const response = record(await api(`/repos/${REPO}/actions/workflows/${workflowId}/runs?${runFilter}per_page=100&page=${page}`))
    const rawRuns = response?.workflow_runs
    if (!Array.isArray(rawRuns)) throw new Error('submission-invalid-workflow-runs')
    for (const raw of rawRuns) {
      const run = workflowRun(raw)
      if (!trustedRun(run, workflowId, workflowPath) || run.id === currentRun || run.status !== 'completed') continue
      runs.push(run)
    }
    if (rawRuns.length < 100) break
    if (page === maximumRunPages) throw new Error('submission-checkpoint-pagination-limit')
  }
  const dayStart = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`)
  let selected: (ReviewCheckpoint & { time: number }) | null = null
  const artifactCache = new Map<number, Artifact[]>()
  for (const latestRun of runs) {
    if (kind !== 'review' && timestamp(latestRun.updated_at) < dayStart) continue
    // 投稿状态另有评论账本，保持原来的过期清理策略；独立日预算必须覆盖每个 attempt。
    if (kind !== 'review' && latestRun.id !== currentRun && latestRun.run_attempt > 100) throw new Error('submission-attempt-pagination-limit')
    const attempts = kind === 'review' || latestRun.id === currentRun ? [latestRun.run_attempt] :
      Array.from({ length: latestRun.run_attempt }, (_, index) => latestRun.run_attempt - index)
    for (const attempt of attempts) {
      const run = attempt === latestRun.run_attempt ? latestRun : workflowRun(await api(`/repos/${REPO}/actions/runs/${latestRun.id}/attempts/${attempt}`))
      if (!trustedRun(run, workflowId, workflowPath) || run.id !== latestRun.id || run.run_attempt !== attempt || run.status !== 'completed') throw new Error('submission-invalid-run-attempt')
      const time = kind === 'review' ? 0 : await collectionTime(api, run)
      if (time === null || (kind !== 'review' && time < dayStart)) continue
      let artifacts = artifactCache.get(run.id)
      if (!artifacts) {
        artifacts = await runArtifacts(api, run.id)
        artifactCache.set(run.id, artifacts)
      }
      const found = findArtifact(artifacts, `${prefix}-${run.id}-${attempt}`)
      if (!found) {
        // 当日已执行阶段但账本缺失时拒绝恢复旧额度；下个 UTC 日自然解除。
        if (kind !== 'review') throw new Error('submission-budget-checkpoint-missing')
        continue
      }
      if (kind === 'review') return { runId: run.id, artifactId: found.id }
      if (!selected || time > selected.time) selected = { runId: run.id, artifactId: found.id, time }
    }
  }
  return selected ? { runId: selected.runId, artifactId: selected.artifactId } : null
}

async function main(): Promise<void> {
  if (process.env.GITHUB_REPOSITORY !== REPO) throw new Error('submission-wrong-repository')
  const runId = Number(process.env.GITHUB_RUN_ID)
  const output = process.env.GITHUB_OUTPUT
  if (!safeInteger(runId) || !output) throw new Error('submission-invalid-run')
  const kind = process.env.JEV_CHECKPOINT_KIND ?? 'review'
  if (kind !== 'review' && kind !== 'radar' && kind !== 'alternatives') throw new Error('submission-invalid-checkpoint-kind')
  const currentAttempt = Number(process.env.GITHUB_RUN_ATTEMPT ?? '1')
  const checkpoint = await latestCheckpoint(createGitHubClient(process.env.GITHUB_TOKEN), runId, kind, { currentAttempt })
  if (checkpoint) appendFileSync(output, `run_id=${checkpoint.runId}\nartifact_id=${checkpoint.artifactId}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => {
    process.stderr.write('submission-checkpoint-restore-failed\n')
    process.exitCode = 1
  })
}
