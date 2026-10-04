/**
 * [INPUT]: 依赖可信投稿报告、维护者权限、规范目录生成器与分离的 GitHub 读写客户端
 * [OUTPUT]: 对外提供收录编排和精确版本 CI 门；Issue 生成数据 PR，合并后幂等关闭与主干校验恢复
 * [POS]: scripts 的条件写入边界；只运行 main 代码，不执行 PR 或投稿仓库代码、不调用 Jev
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { readFileSync, appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual as equal } from 'node:util'
import { createGitHubClient, createGitHubWriter, type GitHubWriter } from './github-client.ts'
import { candidateRow, renderReadme, repoKey, validateRows, MAX_CATALOG_FILE_BYTES } from './catalog.ts'
import { buildSitemap } from './generate-sitemap.ts'
import { isRecord, type GitHubApi, type DirectoryItem, type GitHubRepository } from './model-types.ts'
import { REPOSITORY, MARKER, isSubmission, jsonAt, submissionInput, reportLanguage } from './submission-review.ts'
import { parseIncludeCommand, intakeApprovals, intakeAdditions, assertIntakeFiles, type IntakeApproval } from './submission-intake-policy.ts'

const PREFIX = `/repos/${REPOSITORY}`
export const INTAKE_MARKER = '<!-- awesome-jev-intake:v1 -->'
const RESULT_MARKER = '<!-- awesome-jev-intake-result:v1 -->'
const RADAR_PATH = '.github/workflows/radar.yml'
const SHA = /^[a-f0-9]{40}$/
const BOT = 'github-actions[bot]'
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const positive = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0
const record = (value: unknown): Record<string, any> => {
  if (!isRecord(value)) throw new Error('intake-invalid-response')
  return value
}

interface Comment { id: number; body: string; created_at: string; updated_at: string; user: { login: string; type: string } }
interface Issue { number: number; title: string; body: string | null; state: string; pull_request?: unknown; user: { login: string }; labels?: { name?: string }[] }
interface ApprovalContext { version: string; approvals: IntakeApproval[]; signature: string }
interface IntakeMeta { issue: number; version: string; signature: string; baseSha: string; approvals: IntakeApproval[] }
export interface IntakeOptions { api: GitHubApi; write: GitHubWriter }

async function pages<T>(api: GitHubApi, path: string): Promise<T[]> {
  const all: T[] = []
  for (let page = 1; page <= 10; page++) {
    const rows = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`)
    if (!Array.isArray(rows)) throw new Error('intake-invalid-response')
    all.push(...rows)
    if (rows.length < 100) return all
  }
  throw new Error('intake-pagination-limit')
}

async function mainSha(api: GitHubApi): Promise<string> {
  const sha = record(record(await api(`${PREFIX}/git/ref/heads/main`)).object).sha
  if (typeof sha !== 'string' || !SHA.test(sha)) throw new Error('intake-invalid-sha')
  return sha
}

async function textAt(api: GitHubApi, path: string, sha: string): Promise<string> {
  if (!SHA.test(sha)) throw new Error('intake-invalid-sha')
  let file = record(await api(`${PREFIX}/contents/${path}?ref=${sha}`))
  if (file.encoding === 'none' && SHA.test(file.sha)) file = record(await api(`${PREFIX}/git/blobs/${file.sha}`))
  if (file.encoding !== 'base64' || typeof file.content !== 'string' ||
    !Number.isSafeInteger(file.size) || file.size < 0 || file.size > MAX_CATALOG_FILE_BYTES ||
    file.content.length > MAX_CATALOG_FILE_BYTES * 2) throw new Error('intake-invalid-file')
  const bytes = Buffer.from(file.content, 'base64')
  if (bytes.length !== file.size) throw new Error('intake-invalid-file')
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

// --- 人工批准锁定既有完整报告；晚到的旧命令不能批准后来修改的材料 ---
async function consent(api: GitHubApi, issue: Issue, known: Set<string>): Promise<ApprovalContext | null> {
  const input = await submissionInput(api, issue)
  const comments = await pages<Comment>(api, `${PREFIX}/issues/${issue.number}/comments`)
  const report = comments.filter((c) => c.user?.login === BOT && c.user.type === 'Bot' && c.body?.startsWith(MARKER)).at(-1)
  if (!report || !positive(report.id)) return null
  const commands = comments.filter((c) => c.user?.type !== 'Bot' && parseIncludeCommand(c.body)).reverse()
  const permissions = new Map<string, string>()
  let command: Comment | undefined
  let manual: { category: NonNullable<ReturnType<typeof parseIncludeCommand>>; login: string; commentId: number } | undefined
  for (const candidate of commands) {
    if (!positive(candidate.id) || !/^[\w-]+$/.test(candidate.user.login) ||
      !Number.isFinite(Date.parse(candidate.created_at)) || !Number.isFinite(Date.parse(report.updated_at)) ||
      Date.parse(candidate.created_at) < Date.parse(report.updated_at)) continue
    let permission = permissions.get(candidate.user.login)
    if (permission === undefined) {
      try { permission = record(await api(`${PREFIX}/collaborators/${candidate.user.login}/permission`)).permission }
      catch (error) {
        if (!(error instanceof Error) || error.message !== 'github-http-404') throw error
        permission = 'none'
      }
      if (typeof permission !== 'string') throw new Error('intake-invalid-response')
      permissions.set(candidate.user.login, permission)
    }
    if (['admin', 'maintain', 'write'].includes(permission)) {
      command = candidate
      manual = { category: parseIncludeCommand(command.body)!, login: command.user.login, commentId: command.id }
      break
    }
  }
  const approvals = intakeApprovals(issue, input, comments, known, manual)
  if (!approvals) return null
  return { version: input.version, approvals,
    signature: digest([input.version, report.id, report.body, report.updated_at, manual ? [command!.id, command!.body, command!.updated_at, manual.login] : null]) }
}

async function approvedRows(api: GitHubApi, approvals: IntakeApproval[]): Promise<DirectoryItem[]> {
  const rows: DirectoryItem[] = []
  for (const approval of approvals) {
    const repo = record(await api(`/repos/${approval.repo}`)) as GitHubRepository
    if (!repo.default_branch || !positive(repo.id) || typeof repo.node_id !== 'string' || !repo.node_id) throw new Error('intake-missing-identity')
    const current = record(await api(`/repos/${approval.repo}/commits/${encodeURIComponent(repo.default_branch)}`)).sha
    if (current !== approval.sha) throw new Error('intake-source-changed')
    if (approval.category === 'alternatives' && (!repo.license?.spdx_id || repo.license.spdx_id === 'NOASSERTION')) {
      throw new Error('intake-missing-license')
    }
    const row = candidateRow(repo, approval.review.score ?? {}, { alternative: approval.category === 'alternatives' })
    row.category = approval.category
    row.sourceMeta.jevEvidence = { repo: approval.repo, sha: approval.sha, evidenceUrl: approval.review.evidence,
      checkedAt: approval.checkedAt, status: approval.review.status, ...(approval.review.score ? { score: approval.review.score } : {}) }
    rows.push(row)
  }
  validateRows(rows)
  return rows
}

export function parseIntakeMeta(body: unknown): IntakeMeta | null {
  if (typeof body !== 'string' || body.length > 65000 || !body.startsWith(INTAKE_MARKER)) return null
  try {
    const match = body.match(/<!-- intake-meta:([A-Za-z0-9+/=]+) -->/)
    const value = JSON.parse(Buffer.from(match?.[1] ?? '', 'base64').toString())
    if (!isRecord(value) || !positive(value.issue) || !SHA.test(String(value.baseSha)) ||
      !/^[a-f0-9]{64}$/.test(String(value.version)) || !/^[a-f0-9]{64}$/.test(String(value.signature)) ||
      !Array.isArray(value.approvals) || !value.approvals.length || value.approvals.length > 10) return null
    for (const a of value.approvals) {
      if (!isRecord(a) || typeof a.repo !== 'string' || repoKey(`https://github.com/${a.repo}`) !== a.repo ||
        !SHA.test(String(a.sha))) return null
    }
    return value as unknown as IntakeMeta
  } catch { return null }
}

function prBody(meta: IntakeMeta): string {
  const items = meta.approvals.map((a) => `- https://github.com/${a.repo} (${a.category}), pinned source \`${a.sha}\`; ${a.approvedBy ? `human approval by @${a.approvedBy}, comment ${a.approvalCommentId}` : 'Jev recommendation'}; review comment ${a.reviewCommentId}.`).join('\n')
  return `${INTAKE_MARKER}\n<!-- intake-meta:${Buffer.from(JSON.stringify(meta)).toString('base64')} -->\nSource submission: #${meta.issue}\n\n${items}\n\nOnly catalog additions and generated README/sitemap. The original model receipt is retained, never promoted to a fabricated keep score. Merge requires exact-version radar validation and fresh consent.\n`
}

async function dataFiles(api: GitHubApi, sha: string, additions: DirectoryItem[]): Promise<Record<string, string>> {
  const before = await jsonAt(api, 'data/github.json', sha)
  const ids = new Set(before.map((r) => r.sourceMeta.githubIdentity?.databaseId))
  const urls = new Set(before.map((r) => repoKey(r.url)))
  if (additions.some((r) => ids.has(r.sourceMeta.githubIdentity?.databaseId) || urls.has(repoKey(r.url)))) throw new Error('intake-already-listed')
  const rows = [...before, ...additions]
  validateRows(rows)
  const readme = await textAt(api, 'README.md', sha)
  const news = JSON.parse(await textAt(api, 'data/news.json', sha))
  return { 'data/github.json': JSON.stringify(rows, null, 2) + '\n',
    'README.md': renderReadme(readme, rows), 'public/sitemap.xml': buildSitemap(rows, 'https://awesomejev.cc', news).xml }
}

async function commitFiles({ api, write }: IntakeOptions, base: string, files: Record<string, string>, parents: string[], issue: number): Promise<string> {
  const treeSha = record(record(await api(`${PREFIX}/git/commits/${base}`)).tree).sha
  if (!SHA.test(String(treeSha))) throw new Error('intake-invalid-sha')
  const tree = []
  for (const [path, content] of Object.entries(files)) {
    const blob = record(await write(`${PREFIX}/git/blobs`, 'POST', { content, encoding: 'utf-8' }))
    if (!SHA.test(String(blob.sha))) throw new Error('intake-invalid-sha')
    tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha })
  }
  const nextTree = record(await write(`${PREFIX}/git/trees`, 'POST', { base_tree: treeSha, tree }))
  if (!SHA.test(String(nextTree.sha))) throw new Error('intake-invalid-sha')
  const commit = record(await write(`${PREFIX}/git/commits`, 'POST', { message: `data: curate submission #${issue}`, tree: nextTree.sha, parents }))
  if (!SHA.test(String(commit.sha))) throw new Error('intake-invalid-sha')
  return commit.sha
}

// --- CI 身份、当前 attempt 和实际 verify 步骤共同约束，任意绿色 check 不构成许可 ---
export function verifiedRun(run: unknown, workflowId: number, repositoryId: number, sha: string, branch: string, jobs: unknown, prNumber?: number): boolean {
  if (!isRecord(run) || run.workflow_id !== workflowId || run.event !== (prNumber ? 'pull_request' : 'workflow_dispatch') ||
    run.path !== RADAR_PATH || run.head_sha !== sha || run.head_branch !== branch ||
    !isRecord(run.head_repository) || run.head_repository.id !== repositoryId ||
    run.status !== 'completed' || run.conclusion !== 'success' || !positive(run.run_attempt) || !Array.isArray(jobs)) return false
  // GitHub 可省略 fork run 的 PR 关联；此时仍由当前 PR 的 repo/ref/SHA 三元组绑定。
  if (prNumber && (!Array.isArray(run.pull_requests) ||
    (run.pull_requests.length > 0 && !run.pull_requests.some((p) => isRecord(p) && p.number === prNumber)))) return false
  const verify = jobs.filter((j) => isRecord(j) && j.name === 'verify')
  if (verify.length !== 1) return false
  const job = record(verify[0])
  if (job.run_attempt !== run.run_attempt || job.status !== 'completed' || job.conclusion !== 'success' || !Array.isArray(job.steps)) return false
  const commands = ['Install locked dependencies', 'Verify new or edited rationale quotes at pinned sources', 'Verify catalog and delivery']
  return commands.every((name) => job.steps.filter((s: unknown) => isRecord(s) && s.name === name && s.status === 'completed' && s.conclusion === 'success').length === 1)
}

async function validation({ api, write }: IntakeOptions, pr: Record<string, any>): Promise<boolean> {
  const workflow = record(await api(`${PREFIX}/actions/workflows/radar.yml`))
  const repository = record(await api(PREFIX))
  if (!positive(workflow.id) || workflow.path !== RADAR_PATH || !positive(repository.id)) throw new Error('intake-invalid-workflow')
  const botPr = pr.user?.login === BOT && pr.user.type === 'Bot' && parseIntakeMeta(pr.body)
  const event = botPr ? 'workflow_dispatch' : 'pull_request'
  const sourceId = botPr ? repository.id : pr.head.repo?.id
  if (!positive(sourceId)) return false
  const response = record(await api(`${PREFIX}/actions/workflows/${workflow.id}/runs?event=${event}&head_sha=${pr.head.sha}&per_page=100`))
  if (!Array.isArray(response.workflow_runs) || response.total_count > 100) return false
  const runs = response.workflow_runs as Record<string, any>[]
  const matches = runs.filter((r) => r.head_sha === pr.head.sha && r.head_branch === pr.head.ref &&
    r.head_repository?.id === sourceId).sort((a, b) => b.id - a.id)
  if (!matches.length) {
    if (!botPr || pr.head.repo?.full_name !== REPOSITORY) return false
    await write(`${PREFIX}/actions/workflows/radar.yml/dispatches`, 'POST', { ref: pr.head.ref, inputs: { mode: 'validate' } })
    return false
  }
  const run = record(await api(`${PREFIX}/actions/runs/${matches[0].id}`))
  const jobResponse = record(await api(`${PREFIX}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`))
  if (jobResponse.total_count > 100) return false
  return verifiedRun(run, workflow.id, sourceId, pr.head.sha, pr.head.ref, jobResponse.jobs, botPr ? undefined : pr.number)
}

async function prFiles(api: GitHubApi, pr: Record<string, any>): Promise<void> {
  const files = await pages<Record<string, any>>(api, `${PREFIX}/pulls/${pr.number}/files`)
  assertIntakeFiles(files.map((f) => f.filename))
  if (files.some((f) => f.status === 'removed' || f.status === 'renamed')) throw new Error('intake-file-deletion')
}

async function verifyData(api: GitHubApi, pr: Record<string, any>, approvals: IntakeApproval[], base: string, scopeChecked = false): Promise<DirectoryItem[]> {
  if (!scopeChecked) await prFiles(api, pr)
  const before = await jsonAt(api, 'data/github.json', base)
  const after = await jsonAt(api, 'data/github.json', pr.head.sha)
  const additions = intakeAdditions(before, after)
  if (additions.length !== approvals.length) throw new Error('intake-unapproved-addition')
  const expected = await approvedRows(api, approvals)
  for (const addition of additions) {
    const a = approvals.find((a) => a.repo === repoKey(addition.url))
    if (!a || addition.category !== a.category) throw new Error('intake-unapproved-addition')
    const trusted = expected.find((r) => repoKey(r.url) === a.repo)!
    if (!equal(trusted.sourceMeta.githubIdentity, addition.sourceMeta.githubIdentity)) {
      throw new Error('intake-identity-mismatch')
    }
    for (const field of ['jevAbout', 'jevKeep', 'jevKeepConfidence', 'jevEvidence', 'needsReview', 'conflictingEvidence', 'category', 'repo', 'author', 'date', 'previousUrls'] as const) {
      if (!equal(addition.sourceMeta[field], trusted.sourceMeta[field])) throw new Error('intake-review-receipt-changed')
    }
    if (addition.id !== trusted.id) throw new Error('intake-id-changed')
  }
  if (await textAt(api, 'README.md', pr.head.sha) !== renderReadme(await textAt(api, 'README.md', base), after)) throw new Error('intake-readme-modified')
  const news = JSON.parse(await textAt(api, 'data/news.json', base))
  if (await textAt(api, 'public/sitemap.xml', pr.head.sha) !== buildSitemap(after, 'https://awesomejev.cc', news).xml) throw new Error('intake-sitemap-modified')
  return additions
}

async function ensureMainValidation({ api, write }: IntakeOptions): Promise<void> {
  const currentMain = await mainSha(api)
  const workflow = record(await api(`${PREFIX}/actions/workflows/radar.yml`))
  if (!positive(workflow.id) || workflow.path !== RADAR_PATH) throw new Error('intake-invalid-workflow')
  const validationRuns = record(await api(`${PREFIX}/actions/workflows/${workflow.id}/runs?event=workflow_dispatch&head_sha=${currentMain}&per_page=100`))
  if (!Array.isArray(validationRuns.workflow_runs)) throw new Error('intake-invalid-response')
  if (!validationRuns.workflow_runs.some((run: Record<string, any>) => run.head_sha === currentMain && run.head_branch === 'main' &&
    run.workflow_id === workflow.id && run.event === 'workflow_dispatch' && run.path === RADAR_PATH &&
    run.head_repository?.full_name === REPOSITORY && run.display_title === 'Jev validate: main')) {
    // 合并已成功但 dispatch 结果不明时，下轮先查同版本 run；不重复生成 PR 或再次合并。
    await write(`${PREFIX}/actions/workflows/radar.yml/dispatches`, 'POST', { ref: 'main', inputs: { mode: 'validate' } })
  }
}

async function closeSource(options: IntakeOptions, pr: Record<string, any>, meta: IntakeMeta): Promise<string> {
  const { api, write } = options
  if (!pr.merged || !SHA.test(String(pr.merge_commit_sha))) return 'awaiting-merge'
  const issue = record(await api(`${PREFIX}/issues/${meta.issue}`)) as Issue
  if (issue.state !== 'open' || issue.pull_request || !isSubmission(issue)) return 'already-closed-or-withdrawn'
  if ((await submissionInput(api, issue)).version !== meta.version) return 'submission-changed'
  const rows = await jsonAt(api, 'data/github.json', pr.merge_commit_sha)
  const keys = (await submissionInput(api, issue)).keys
  if (!meta.approvals.every((a) => keys.includes(a.repo)) || !keys.every((key) => rows.some((r) => repoKey(r.url) === key)) ||
    meta.approvals.some((a) => !rows.some((r) => repoKey(r.url) === a.repo))) return 'membership-unconfirmed'
  await ensureMainValidation(options)
  const comments = await pages<Comment>(api, `${PREFIX}/issues/${meta.issue}/comments`)
  const zh = reportLanguage(issue) === 'zh'
  const body = `${RESULT_MARKER}\n@${issue.user.login} ${zh ? `已收录，收录改动已通过校验并在 PR #${pr.number} 合并。` : `Added to the directory in #${pr.number} after validation.`} ${zh ? '独立替代实现的收录不代表已认证的 Jev 兼容性或安全性。' : 'Listing an independent alternative does not certify Jev compatibility or security.'}`
  if (!comments.some((c) => c.user?.login === BOT && c.user.type === 'Bot' && c.body === body)) {
    await write(`${PREFIX}/issues/${meta.issue}/comments`, 'POST', { body })
  }
  // 原 reviewer 的预算评论不删、不改；结果评论先持久化，关闭失败时下轮恢复。
  await write(`${PREFIX}/issues/${meta.issue}`, 'PATCH', { state: 'closed', state_reason: 'completed' })
  return 'merged-and-closed'
}

async function issueIntake(options: IntakeOptions, issue: Issue): Promise<string> {
  const { api, write } = options
  const branch = `jev-intake/issue-${issue.number}`
  const prs = await pages<Record<string, any>>(api, `${PREFIX}/pulls?state=all&head=daftAI2026:${branch}&base=main`)
  const existing = prs.find((p) => p.head?.ref === branch && p.user?.login === BOT && p.user.type === 'Bot')
  if (existing) {
    const pr = record(await api(`${PREFIX}/pulls/${existing.number}`))
    const meta = parseIntakeMeta(pr.body)
    if (!meta || meta.issue !== issue.number || pr.head.repo?.full_name !== REPOSITORY) return 'untrusted-existing-pr'
    if (pr.merged) return closeSource(options, pr, meta)
    if (pr.state !== 'open' || pr.draft || pr.base.ref !== 'main') return 'intake-pr-withdrawn'
  }
  const base = await mainSha(api)
  const current = await jsonAt(api, 'data/github.json', base)
  const known = new Set(current.map((r) => repoKey(r.url)!))
  const ctx = await consent(api, issue, known)
  if (!ctx) return 'awaiting-approval'
  const additions = await approvedRows(api, ctx.approvals)
  const files = await dataFiles(api, base, additions)
  const meta: IntakeMeta = { issue: issue.number, version: ctx.version, signature: ctx.signature, baseSha: base, approvals: ctx.approvals }
  let pr: Record<string, any>
  if (existing) {
    pr = record(await api(`${PREFIX}/pulls/${existing.number}`))
    const old = parseIntakeMeta(pr.body)!
    // 未授权代码混入旧分支时停止，而不是通过重新生成把它偷偷抹掉。
    await prFiles(api, pr)
    const generated = await Promise.all(Object.entries(files).map(async ([path, content]) => await textAt(api, path, pr.head.sha) === content))
    const ancestry = record(await api(`${PREFIX}/compare/${base}...${pr.head.sha}`))
    const exactGenerated = generated.every(Boolean) && ancestry.merge_base_commit?.sha === base
    if (!exactGenerated) await verifyData(api, pr, old.approvals, old.baseSha)
    if (old.baseSha !== base || old.signature !== ctx.signature) {
      if (!exactGenerated) {
        const head = await commitFiles(options, base, files, [...new Set([pr.head.sha, base])], issue.number)
        const fresh = record(await api(`${PREFIX}/pulls/${pr.number}`))
        if (fresh.head.sha !== pr.head.sha) return 'pr-head-changed'
        await write(`${PREFIX}/git/refs/heads/${branch}`, 'PATCH', { sha: head, force: false })
      }
      await write(`${PREFIX}/pulls/${pr.number}`, 'PATCH', { body: prBody(meta) })
      pr = record(await api(`${PREFIX}/pulls/${pr.number}`))
    }
  } else {
    // orphan ref 是先前建 PR 结果不明后的恢复点，不凭名字赋予它写入许可。
    let ref: Record<string, any> | undefined
    try { ref = record(await api(`${PREFIX}/git/ref/heads/${branch}`)) }
    catch (error) { if (!(error instanceof Error) || error.message !== 'github-http-404') throw error }
    let head: string
    if (ref) {
      head = record(ref.object).sha
      if (!SHA.test(head)) throw new Error('intake-invalid-sha')
      const compare = record(await api(`${PREFIX}/compare/${base}...${head}`))
      assertIntakeFiles((compare.files ?? []).map((f: Record<string, any>) => f.filename))
      const matches = await Promise.all(Object.entries(files).map(async ([path, content]) => await textAt(api, path, head) === content))
      if (!matches.every(Boolean) || compare.merge_base_commit?.sha !== base) {
        const originalBase = compare.merge_base_commit?.sha
        if (!SHA.test(String(originalBase))) throw new Error('intake-orphan-ref-changed')
        await verifyData(api, { head: { sha: head } }, ctx.approvals, originalBase, true)
        const next = await commitFiles(options, base, files, [...new Set([head, base])], issue.number)
        const freshRef = record(await api(`${PREFIX}/git/ref/heads/${branch}`))
        if (record(freshRef.object).sha !== head) return 'pr-head-changed'
        await write(`${PREFIX}/git/refs/heads/${branch}`, 'PATCH', { sha: next, force: false })
        head = next
      }
    } else {
      head = await commitFiles(options, base, files, [base], issue.number)
      await write(`${PREFIX}/git/refs`, 'POST', { ref: `refs/heads/${branch}`, sha: head })
    }
    pr = record(await write(`${PREFIX}/pulls`, 'POST', { title: `Add submission #${issue.number}`, head: branch, base: 'main', body: prBody(meta) }))
    pr = record(await api(`${PREFIX}/pulls/${pr.number}`))
  }
  await verifyData(api, pr, ctx.approvals, base)
  if (!await validation(options, pr)) return `validating-pr-${pr.number}`
  const latestIssue = record(await api(`${PREFIX}/issues/${issue.number}`)) as Issue
  const renewed = await consent(api, latestIssue, known)
  if (latestIssue.state !== 'open' || !isSubmission(latestIssue) || !renewed || renewed.signature !== ctx.signature ||
    !equal(renewed.approvals, ctx.approvals)) return 'approval-changed'
  await approvedRows(api, renewed.approvals)
  if (await mainSha(api) !== base) return 'main-advanced-retry'
  const fresh = record(await api(`${PREFIX}/pulls/${pr.number}`))
  if (fresh.state !== 'open' || fresh.draft || fresh.head.sha !== pr.head.sha || fresh.base.ref !== 'main' ||
    fresh.head.repo?.full_name !== REPOSITORY || fresh.mergeable !== true) return 'pr-not-mergeable'
  const merged = record(await write(`${PREFIX}/pulls/${pr.number}/merge`, 'PUT', { sha: pr.head.sha, merge_method: 'squash' }))
  if (merged.merged !== true) throw new Error('intake-merge-not-confirmed')
  return closeSource(options, record(await api(`${PREFIX}/pulls/${pr.number}`)), meta)
}

async function submittedPr(options: IntakeOptions, issue: Issue): Promise<string> {
  const { api, write } = options
  const pr = record(await api(`${PREFIX}/pulls/${issue.number}`))
  // 自建 PR 由源 Issue 驱动，不让它绕过原人工批准。
  const own = parseIntakeMeta(pr.body)
  if (own && pr.user?.login === BOT && pr.user.type === 'Bot') {
    return processIntake(options, own.issue)
  }
  if (pr.state === 'closed' && pr.merged === true && SHA.test(String(pr.merge_commit_sha)) &&
    pr.merged_by?.login === BOT && pr.merged_by.type === 'Bot' && pr.base.ref === 'main' &&
    pr.base.repo?.full_name === REPOSITORY) {
    // 原生 PR 合并后已关闭；恢复只补主干校验，不再写目录或重复合并。
    await ensureMainValidation(options)
    return 'recovered-main-validation'
  }
  if (pr.state !== 'open' || pr.draft || pr.base.ref !== 'main') return 'not-open-catalog-pr'
  const base = await mainSha(api)
  const current = await jsonAt(api, 'data/github.json', base)
  const known = new Set(current.map((r) => repoKey(r.url)!))
  const ctx = await consent(api, issue, known)
  if (!ctx) return 'awaiting-approval'
  const comparison = record(await api(`${PREFIX}/compare/${base}...${pr.head.sha}`))
  if (comparison.merge_base_commit?.sha !== base) return 'pr-needs-main-update'
  await verifyData(api, pr, ctx.approvals, base)
  await approvedRows(api, ctx.approvals)
  if (!await validation(options, pr)) return 'awaiting-exact-ci'
  const freshIssue = record(await api(`${PREFIX}/issues/${issue.number}`)) as Issue
  const renewed = await consent(api, freshIssue, known)
  if (freshIssue.state !== 'open' || !renewed || renewed.signature !== ctx.signature || !equal(renewed.approvals, ctx.approvals) ||
    await mainSha(api) !== base) return 'approval-or-main-changed'
  await approvedRows(api, renewed.approvals)
  const fresh = record(await api(`${PREFIX}/pulls/${pr.number}`))
  if (fresh.head.sha !== pr.head.sha || fresh.state !== 'open' || fresh.draft || fresh.base.ref !== 'main' ||
    fresh.mergeable !== true) return 'pr-not-mergeable'
  const result = record(await write(`${PREFIX}/pulls/${pr.number}/merge`, 'PUT', { sha: pr.head.sha, merge_method: 'squash' }))
  if (result.merged !== true) throw new Error('intake-merge-not-confirmed')
  await ensureMainValidation(options)
  return 'merged-catalog-pr'
}

export async function processIntake(options: IntakeOptions, number: number): Promise<string> {
  if (!positive(number)) throw new Error('intake-invalid-number')
  const issue = record(await options.api(`${PREFIX}/issues/${number}`)) as Issue
  if (issue.pull_request) return submittedPr(options, issue)
  if (issue.state !== 'open') return 'not-open'
  if (!isSubmission(issue)) return 'not-submission'
  return issueIntake(options, issue)
}

const safeError = (error: unknown) => error instanceof Error && /^(intake|submission-intake|github)-[a-z0-9-]+$/.test(error.message) ? error.message : 'intake-invalid-data'
export async function runIntakeTargets(options: IntakeOptions, numbers: number[]): Promise<Array<{ number: number; status: string }>> {
  const results = []
  for (const number of numbers) {
    // 一条坏投稿不阻断其后的合法申请；错误只回显受控代码，不打印远端正文或凭据。
    try { results.push({ number, status: await processIntake(options, number) }) }
    catch (error) { results.push({ number, status: safeError(error) }) }
  }
  return results
}

async function main(): Promise<void> {
  if (process.env.GITHUB_REPOSITORY !== REPOSITORY) throw new Error('intake-wrong-repository')
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH!, 'utf8'))
  const api = createGitHubClient(process.env.GITHUB_TOKEN, { deadline: Date.now() + 8 * 60 * 1000, maxRequests: 2000 })
  const options = { api, write: createGitHubWriter(process.env.GITHUB_TOKEN) }
  let numbers: number[]
  if (process.env.GITHUB_EVENT_NAME === 'workflow_dispatch') {
    if (!/^[1-9]\d*$/.test(String(event.inputs?.number))) throw new Error('intake-invalid-number')
    numbers = [Number(event.inputs.number)]
  } else if (process.env.GITHUB_EVENT_NAME === 'issue_comment') {
    if (!parseIncludeCommand(event.comment?.body) || event.comment?.user?.type === 'Bot') return
    // 事件正文与当前正文不同会由已绑定的 report inputVersion 拒绝。
    numbers = [event.issue?.number]
  } else {
    const issues = await pages<Issue>(api, `${PREFIX}/issues?state=open&sort=updated&direction=desc`)
    const closed = await api(`${PREFIX}/pulls?state=closed&base=main&sort=updated&direction=desc&per_page=20`)
    if (!Array.isArray(closed)) throw new Error('intake-invalid-response')
    const recent = closed.filter((pr) => isRecord(pr) && typeof pr.merged_at === 'string' &&
      Date.parse(pr.merged_at) >= Date.now() - 24 * 60 * 60 * 1000).map((pr) => pr.number)
    const linked = Array.isArray(event.workflow_run?.pull_requests) ? event.workflow_run.pull_requests.map((pr: Record<string, any>) => pr.number).filter(positive) : []
    // run 关联仅作导航；权限仍由当前本仓 PR、合并者身份和 main 校验边界决定。
    numbers = [...new Set([...linked, ...issues.filter((i) => i.pull_request || isSubmission(i)).map((i) => i.number).slice(0, 40), ...recent])]
  }
  for (const { number, status } of await runIntakeTargets(options, numbers)) {
    const summary = `Submission intake #${number}: ${status}\n`
    process.stdout.write(summary)
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(safeError(error) + '\n'); process.exitCode = 1
  })
}
