import { readFileSync, appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { createGitHubClient } from './github-client.mjs'
import { githubEvidence, evidenceIssue } from './github-evidence.mjs'
import { readCatalog, repoKey, candidateRow, validateRows } from './catalog.mjs'
import { evaluateJev, reviewDecision } from './jev-client.mjs'

export const REPOSITORY = 'daftAI2026/awesome-jev'
export const MARKER = '<!-- awesome-jev-submission-review:v1 -->'
export const MAX_PROJECTS = 10
export const DAILY_BUDGET = 100
const COOLDOWN_MS = 10 * 60 * 1000
const BOT = 'github-actions[bot]'
const safeError = (error) => /^(github|jev|submission)-[a-z0-9-]+$/.test(error?.message ?? '') ? error.message : 'submission-invalid-data'
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const validNumber = (value) => Number.isSafeInteger(value) && value > 0

export function repositoryLinks(text) {
  return [...new Set((String(text ?? '').match(/https:\/\/github\.com\/[\w.-]+\/[\w.-]+/g) ?? [])
    .map((url) => repoKey(url.replace(/[.,]+$/, ''))).filter((key) => key && key !== REPOSITORY.toLowerCase()))]
}
export function isSubmission(issue) {
  return /^\[submission\]/i.test(issue.title ?? '') || (issue.labels ?? []).some((label) => label.name === 'submission')
}
export function reviewMeta(comment) {
  if (comment?.user?.login !== BOT || comment.user.type !== 'Bot' || !comment.body?.startsWith(MARKER)) return null
  const match = comment.body.match(/<!-- jev-meta:([A-Za-z0-9+/=]+) -->/)
  try {
    const data = JSON.parse(Buffer.from(match?.[1] ?? '', 'base64').toString())
    if (data.version !== 1 || !/^[a-f0-9]{64}$/.test(data.fingerprint) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.day) || !Number.isSafeInteger(data.used) || data.used < 0 || data.used > DAILY_BUDGET ||
      typeof data.at !== 'string' || !Number.isFinite(Date.parse(data.at))) return null
    return data
  } catch { return null }
}
export function cacheReason(meta, fingerprint, manual, now) {
  if (!meta) return null
  if (!manual && meta.fingerprint === fingerprint && !meta.pending && !meta.retryable) return 'unchanged'
  if (now.getTime() - Date.parse(meta.at) < COOLDOWN_MS) return 'cooldown'
  return null
}
async function pages(api, path, maxPages = 20) {
  const result = []
  for (let page = 1; page <= maxPages; page++) {
    const data = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`)
    if (!Array.isArray(data)) throw new Error('github-invalid-response')
    result.push(...data)
    if (data.length < 100) return result
  }
  throw new Error('submission-pagination-limit')
}

export async function eventTargets(api, eventName, event) {
  if (event.repository?.full_name !== REPOSITORY) return []
  if (eventName === 'schedule') {
    const issues = await pages(api, `/repos/${REPOSITORY}/issues?state=open&sort=updated&direction=desc`, 5)
    return issues.filter((issue) => issue.pull_request || isSubmission(issue)).map((issue) => ({ number: issue.number, manual: false }))
  }
  if (eventName === 'workflow_dispatch') {
    const raw = String(event.inputs?.number ?? '')
    if (!/^[1-9]\d*$/.test(raw) || !validNumber(Number(raw))) throw new Error('submission-invalid-number')
    return [{ number: Number(raw), manual: true }]
  }
  if (eventName === 'issue_comment') {
    if (event.action !== 'created' || event.comment?.body?.trim() !== '/jev review' || event.comment.user?.type === 'Bot') return []
    const login = event.comment?.user?.login
    if (!/^[\w-]+$/.test(login ?? '')) return []
    const permission = await api(`/repos/${REPOSITORY}/collaborators/${encodeURIComponent(login)}/permission`)
    if (!['admin', 'write', 'maintain'].includes(permission.permission)) return []
    return validNumber(event.issue?.number) ? [{ number: event.issue.number, manual: true }] : []
  }
  if (eventName === 'issues') {
    return validNumber(event.issue?.number) && isSubmission(event.issue) ? [{ number: event.issue.number, manual: false }] : []
  }
  if (eventName === 'workflow_run') {
    const run = event.workflow_run
    // 不消费上游产物或代码；只用已完成 PR 检查的 SHA 找仍然开放的申请。
    if (run?.event !== 'pull_request' || run.status !== 'completed' || !/^[a-f0-9]{40}$/.test(run.head_sha ?? '')) return []
    const prs = await pages(api, `/repos/${REPOSITORY}/pulls?state=open`, 5)
    return prs.filter((pr) => pr.head?.sha === run.head_sha && !pr.draft)
      .slice(0, 10).map((pr) => ({ number: pr.number, manual: false }))
  }
  return []
}
async function jsonAt(api, path, sha, optional = false) {
  try {
    const data = await api(`/repos/${REPOSITORY}/contents/${path}?ref=${sha}`)
    if (data.encoding !== 'base64' || typeof data.content !== 'string' || data.content.length > 6000000) throw new Error('submission-data-too-large')
    const rows = JSON.parse(Buffer.from(data.content, 'base64').toString())
    if (!Array.isArray(rows)) throw new Error('submission-invalid-data')
    return rows
  } catch (error) {
    if (optional && error.message === 'github-http-404') return []
    throw error
  }
}
export async function submissionInput(api, issue) {
  if (!issue.pull_request) return { keys: repositoryLinks(issue.body), version: digest([issue.title, issue.body]), notes: [] }
  const pr = await api(`/repos/${REPOSITORY}/pulls/${issue.number}`)
  if (pr.draft) return { keys: [], version: pr.head.sha, notes: [] }
  if (!/^[a-f0-9]{40}$/.test(pr.head.sha) || !/^[a-f0-9]{40}$/.test(pr.base.sha)) throw new Error('submission-invalid-sha')
  const files = await pages(api, `/repos/${REPOSITORY}/pulls/${issue.number}/files`, 5)
  const dataFiles = files.filter((file) => /^data\/(github|items|part-\d+)\.json$/.test(file.filename) && file.status !== 'removed')
  if (!dataFiles.length) return { keys: [], version: pr.head.sha, notes: [] }
  if (dataFiles.length > 5) throw new Error('submission-too-many-data-files')
  const comparison = await api(`/repos/${REPOSITORY}/compare/${pr.base.sha}...${pr.head.sha}`)
  const base = comparison.merge_base_commit?.sha
  if (!/^[a-f0-9]{40}$/.test(base ?? '')) throw new Error('submission-invalid-sha')
  const keys = new Set(), notes = []
  for (const file of dataFiles) {
    const before = await jsonAt(api, file.filename, base, true)
    const after = await jsonAt(api, file.filename, pr.head.sha)
    const old = new Set(before.filter((row) => row.type === 'github').map((row) => repoKey(row.url)))
    const additions = after.filter((row) => row.type === 'github' && !old.has(repoKey(row.url)))
    validateRows(additions)
    for (const row of additions) keys.add(repoKey(row.url))
    if (file.filename !== 'data/github.json') notes.push('数据路径已迁移，请将收录条目放入 data/github.json，不要恢复 items/part 分片。')
  }
  return { keys: [...keys], version: pr.head.sha, notes: [...new Set(notes)] }
}

export async function assessProject(api, review, key, known) {
  if (known.has(key)) return { repo: key, status: 'included' }
  try {
    const evidence = await githubEvidence(api, key)
    const reason = evidenceIssue(evidence.repo, evidence.text)
    const result = { repo: key, stars: evidence.repo.stargazers_count, evidence: evidence.evidenceUrl }
    if (reason) return { ...result, status: 'review', reason }
    const score = await review(candidateRow(evidence.repo), evidence.text)
    return { ...result, status: reviewDecision(score), score }
  } catch (error) { return { repo: key, status: 'error', reason: safeError(error) } }
}
export function renderReport(meta, results, notes = [], pending = false) {
  const labels = { included: '已收录，无需重复添加', keep: '建议收录（未自动合并）', review: '待复核', drop: '暂不建议收录', error: '审查失败，不代表不合格' }
  const explanations = {
    'insufficient-provider-context': '缺少清晰的 TypeSafe 与 Jev/System One 关联证据，请补充官方链接或集成说明。',
    'instruction-like-evidence': '证据含指令式文本，转人工检查，不进行自动准入。',
  }
  const lines = results.map((r) => {
    const score = r.score ? `；相关性 **${r.score.jevAbout.toFixed(2)}**，模型判断 **${r.score.jevKeep}**，该判断置信度 **${r.score.jevKeepConfidence.toFixed(2)}**` : ''
    const reason = explanations[r.reason] ?? (r.reason ? `状态码：\`${r.reason}\`。` :
      r.status === 'review' ? '未达到自动通过条件，请补充可核对的用例、实现说明或测试证据。' : '')
    return `- [${r.repo}](https://github.com/${r.repo})：**${labels[r.status]}**${score}${r.stars != null ? `；Star ${r.stars}` : ''}。${reason}${r.evidence ? ` [审查证据](${r.evidence})` : ''}`
  })
  return `${MARKER}\n<!-- jev-meta:${Buffer.from(JSON.stringify(meta)).toString('base64')} -->\n## Jev 收录审查\n\n审查时间（UTC）：${meta.at}。${pending ? '正在审查，请稍候。' : ''}\n\n${lines.join('\n') || '未发现可审查的新增 GitHub 项目。'}\n\n${notes.map((n) => `- ${n}`).join('\n')}\n\n通过条件：模型判断 keep、相关性 ≥ 0.90、该判断置信度 ≥ 0.90。低置信度不等于项目不合格；这些分数不是质量或安全认证。\n\n仅进行收录相关性审查，未运行外部代码；不自动合并、关闭申请或写入目录。维护者可评论 \`/jev review\` 复审（10 分钟冷却）。\n`
}

export async function processSubmission({ api, writeComment, review, number, manual, known, now = new Date() }) {
  const issue = await api(`/repos/${REPOSITORY}/issues/${number}`)
  if (issue.state !== 'open' || (!manual && !issue.pull_request && !isSubmission(issue))) return 'not-submission'
  let input
  try { input = await submissionInput(api, issue) }
  catch (error) { input = { keys: [], version: digest([issue.updated_at, issue.body]), notes: [`无法读取收录数据：${safeError(error)}。请检查 JSON 格式和提交路径。`] } }
  if (!input.keys.length && !input.notes.length) return 'no-projects'
  const fingerprint = digest([input.version, input.keys, input.keys.filter((key) => known.has(key))])
  const comments = await pages(api, `/repos/${REPOSITORY}/issues/${number}/comments`)
  const previous = comments.filter((comment) => reviewMeta(comment)).at(-1)
  const oldMeta = reviewMeta(previous)
  const skip = cacheReason(oldMeta, fingerprint, manual, now)
  if (skip) return skip
  const day = now.toISOString().slice(0, 10)
  const recent = await pages(api, `/repos/${REPOSITORY}/issues/comments?since=${day}T00:00:00Z`)
  const used = recent.reduce((sum, comment) => {
    const meta = reviewMeta(comment)
    return sum + (meta?.day === day ? meta.used : 0)
  }, 0)
  const keys = input.keys.slice(0, MAX_PROJECTS)
  const reserve = keys.filter((key) => !known.has(key)).length
  if (used + reserve > DAILY_BUDGET) return 'daily-budget-exhausted'
  const meta = { version: 1, fingerprint, at: now.toISOString(), day, used: (oldMeta?.day === day ? oldMeta.used : 0) + reserve, pending: true }
  const notes = [...input.notes]
  if (input.keys.length > MAX_PROJECTS) notes.push(`本次仅审查前 ${MAX_PROJECTS} 个；另外 ${input.keys.length - MAX_PROJECTS} 个请拆分申请。`)
  // 先保留预算，再调用模型；崩溃或网络失败也不能反复免费重试额度。
  const comment = await writeComment(number, previous?.id, renderReport(meta, [], notes, true))
  const results = []
  let unavailable = false
  for (const key of keys) {
    const result = unavailable && !known.has(key) ? { repo: key, status: 'error', reason: 'jev-deferred-after-error' } :
      await assessProject(api, review, key, known)
    if (result.reason?.startsWith('jev-')) unavailable = true
    results.push(result)
  }
  await writeComment(number, comment.id, renderReport({ ...meta, pending: false, retryable: results.some((r) => r.status === 'error') }, results, notes))
  return `reviewed-${results.length}`
}

export function commentWriter(token, { fetchImpl = fetch } = {}) {
  return async (number, id, body) => {
    if (!validNumber(number) || (id != null && !validNumber(id))) throw new Error('submission-invalid-number')
    const path = id == null ? `issues/${number}/comments` : `issues/comments/${id}`
    let response
    try {
      response = await fetchImpl(`https://api.github.com/repos/${REPOSITORY}/${path}`, {
        method: id == null ? 'POST' : 'PATCH', redirect: 'error', signal: AbortSignal.timeout(30000),
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
        body: JSON.stringify({ body }),
      })
    } catch { throw new Error('github-comment-network-error') }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`github-comment-http-${response.status}`) }
    const result = await response.json()
    if (!validNumber(result.id)) throw new Error('github-invalid-response')
    return result
  }
}
async function main() {
  if (process.env.GITHUB_REPOSITORY !== REPOSITORY) throw new Error('submission-wrong-repository')
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
  const api = createGitHubClient(process.env.GITHUB_TOKEN)
  const targets = await eventTargets(api, process.env.GITHUB_EVENT_NAME, event)
  if (!targets.length) return
  if (!process.env.TYPESAFE_API_KEY?.trim()) throw new Error('jev-missing-key')
  const known = new Set(readCatalog(process.cwd()).rows.filter((r) => r.type === 'github').map((r) => repoKey(r.url)))
  for (const target of targets) {
    const result = await processSubmission({ ...target, api, known, writeComment: commentWriter(process.env.GITHUB_TOKEN),
      review: (row, evidence) => evaluateJev(process.env.TYPESAFE_API_KEY, row, evidence) })
    const summary = `Submission #${target.number}: ${result}\n`
    process.stdout.write(summary)
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { process.stderr.write(`${safeError(error)}\n`); process.exitCode = 1 })
}
