import { appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createGitHubClient } from './github-client.mjs'
const REPO = 'daftAI2026/awesome-jev'
const WORKFLOW = '.github/workflows/submission-review.yml'
const events = new Set(['workflow_dispatch', 'schedule', 'issues', 'issue_comment', 'workflow_run'])
export async function latestCheckpoint(api, currentRun) {
  const workflow = await api(`/repos/${REPO}/actions/workflows/submission-review.yml`)
  if (!Number.isSafeInteger(workflow.id)) throw new Error('submission-invalid-workflow')
  for (let page = 1; page <= 10; page++) {
    const data = await api(`/repos/${REPO}/actions/workflows/${workflow.id}/runs?branch=main&status=completed&per_page=100&page=${page}`)
    if (!Array.isArray(data.workflow_runs)) throw new Error('submission-invalid-workflow-runs')
    for (const run of data.workflow_runs) {
      if (run.id === currentRun || run.status !== 'completed' || run.workflow_id !== workflow.id || run.path !== WORKFLOW || run.head_branch !== 'main' ||
        run.head_repository?.full_name !== REPO || !events.has(run.event) || !Number.isSafeInteger(run.id)) continue
      const data = await api(`/repos/${REPO}/actions/runs/${run.id}/artifacts?per_page=100`)
      if (!Array.isArray(data.artifacts)) throw new Error('submission-invalid-artifacts')
      const artifact = data.artifacts.find((a) => !a.expired && a.name === `jev-review-checkpoint-${run.id}-${run.run_attempt}`)
      if (!artifact) continue
      if (!Number.isSafeInteger(artifact.id) || artifact.size_in_bytes > 128 * 1024 * 1024) throw new Error('submission-invalid-artifact')
      return { runId: run.id, artifactId: artifact.id }
    }
    if (data.workflow_runs.length < 100) return null
  }
  throw new Error('submission-checkpoint-pagination-limit')
}
async function main() {
  if (process.env.GITHUB_REPOSITORY !== REPO) throw new Error('submission-wrong-repository')
  const checkpoint = await latestCheckpoint(createGitHubClient(process.env.GITHUB_TOKEN), Number(process.env.GITHUB_RUN_ID))
  if (checkpoint) appendFileSync(process.env.GITHUB_OUTPUT, `run_id=${checkpoint.runId}\nartifact_id=${checkpoint.artifactId}\n`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(() => {
  process.stderr.write('submission-checkpoint-restore-failed\n'); process.exitCode = 1
})
