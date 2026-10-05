/**
 * [INPUT]: 依赖投稿版本/机器人报告、共享评分与固定证据边界，以及规范目录校验
 * [OUTPUT]: 对外提供共用报告绑定、分类复核准入、完整不匹配拒收和仅追加目录/文件的纯安全门
 * [POS]: scripts 的收录政策边界；控制器负责维护者权限、评论时序与合并前再次锁定输入
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { isDeepStrictEqual } from 'node:util'
import { pinnedSource, isPinnedEvidenceUrl } from '../src/lib/inclusion.ts'
import { repoKey, validateRows, validateRepositoryIdentityChanges } from './catalog.ts'
import { isProjectCategory, reviewDecision } from './jev-client.ts'
import { isRecord, type DirectoryItem, type JevScore, type ProjectCategory } from './model-types.ts'
import { MARKER, REPOSITORY, reportLanguage, reviewMeta, submissionFingerprint, type SubmissionResult } from './submission-review.ts'
import { matchesAgentReview, type AgentReview } from './submission-agent-review.ts'

export interface IntakeApproval {
  repo: string
  sha: string
  category: ProjectCategory
  reviewCommentId: number
  approvalCommentId?: number
  approvedBy?: string
  review: SubmissionResult
  checkedAt: string
  agentReview?: AgentReview
  agentReviewCommentId?: number
  agentReviewedBy?: string
}

type IntakeComment = { updated_at?: string; id?: number; body?: string; user?: { login?: string; type?: string } }
type IntakeIssue = { title?: string; body?: string | null }
type IntakeInput = { keys: string[]; version: string }
type ManualApproval = { category: ProjectCategory; login: string; commentId: number; agentReview?: AgentReview;
  agentReviewCommentId?: number; agentReviewedBy?: string }
const validId = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0
const validCount = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const probability = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
const manualReasons = new Set(['insufficient-provider-context', 'insufficient-usage-evidence'])

// --- 人工授权必须是一个完整命令，不从自然语言、引用或额外空白猜测批准 ---
export function parseIncludeCommand(body: unknown): ProjectCategory | null {
  if (typeof body !== 'string') return null
  const match = body.match(/^\/jev include ([a-z]+)$/)
  return match && match[0] === body && isProjectCategory(match[1]) ? match[1] : null
}

export function genuineReport(value: unknown): value is IntakeComment {
  return isRecord(value) && isRecord(value.user) && value.user.login === 'github-actions[bot]' &&
    value.user.type === 'Bot' && typeof value.body === 'string' && value.body.startsWith(MARKER)
}

function validTimestamp(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) || !Number.isFinite(Date.parse(value))) return false
  return new Date(value).toISOString() === (value.includes('.') ? value : value.replace('Z', '.000Z'))
}

function validScore(value: unknown): value is JevScore {
  return isRecord(value) && probability(value.jevAbout) && probability(value.jevKeepConfidence) &&
    typeof value.jevKeep === 'string' && ['keep', 'review', 'drop'].includes(value.jevKeep) &&
    (value.category === undefined || isProjectCategory(value.category)) &&
    (value.needsReview === undefined || typeof value.needsReview === 'boolean') &&
    (value.conflictingEvidence === undefined || value.conflictingEvidence === false)
}

function completeCoverage(value: unknown): boolean {
  return isRecord(value) && value.inventoryComplete === true && validCount(value.checked) &&
    validCount(value.total) && value.total > 0 && value.checked === value.total &&
    validCount(value.excluded) && value.blocked === 0
}

// --- 初审只认原始模型分数；深扫只认完整覆盖，二者都不能由 keep 标签伪造 ---
function eligibleResult(result: Record<string, unknown>, manual: boolean): result is Record<string, unknown> & SubmissionResult {
  if (result.status !== 'keep' && !(manual && result.status === 'review')) return false
  if (result.reason !== undefined && !(manual && result.status === 'review' && typeof result.reason === 'string' && manualReasons.has(result.reason))) return false
  if (result.deep !== undefined && typeof result.deep !== 'boolean') return false
  const deep = result.deep === true
  if ((deep || result.progress !== undefined) && (!deep || !completeCoverage(result.progress))) return false
  if (result.score !== undefined) {
    if (!validScore(result.score)) return false
    const decision = reviewDecision(result.score)
    if ((result.status === 'keep' && decision !== 'keep') || decision === 'drop') return false
  } else if (!deep) return false
  return result.status !== 'review' || deep
}

function evidenceSha(value: unknown, repo: string): string | null {
  const repositoryUrl = `https://github.com/${repo}`
  if (!pinnedSource(value, repositoryUrl) && !isPinnedEvidenceUrl(value, repositoryUrl)) return null
  return new URL(value as string).pathname.split('/')[4]!
}

export function currentSubmissionReport(issue: IntakeIssue, input: IntakeInput, comments: IntakeComment[], known: Set<string>) {
  if (!input || typeof input.version !== 'string' || !input.version || !Array.isArray(input.keys) || !input.keys.length ||
    new Set(input.keys).size !== input.keys.length || input.keys.some((key) => typeof key !== 'string' ||
      key === REPOSITORY.toLowerCase() || repoKey(`https://github.com/${key}`) !== key) || !Array.isArray(comments)) return null
  // --- 最新真实报告失效即撤销授权；不能回退到更早的一次绿灯 ---
  const comment = comments.findLast(genuineReport)
  const meta = reviewMeta(comment)
  if (!comment || !validId(comment.id) || !meta || meta.inputVersion !== input.version ||
    meta.fingerprint !== submissionFingerprint(input, known, reportLanguage(issue)) || meta.pending !== false || meta.retryable !== false ||
    !validTimestamp(meta.at) || meta.day !== meta.at.slice(0, 10) || !Array.isArray(meta.completed) || meta.completed.length !== input.keys.length) return null

  const byRepo = new Map<string, Record<string, unknown>>()
  for (const result of meta.completed) {
    if (!isRecord(result) || typeof result.repo !== 'string' || !input.keys.includes(result.repo) || byRepo.has(result.repo)) return null
    byRepo.set(result.repo, result)
  }
  return { comment: { ...comment, id: comment.id }, meta, byRepo }
}

export function intakeApprovals(
  issue: IntakeIssue, input: IntakeInput, comments: IntakeComment[], known: Set<string>, manual?: ManualApproval,
): IntakeApproval[] | null {
  const report = currentSubmissionReport(issue, input, comments, known)
  if (!report || manual && (input.keys.length !== 1 || known.has(input.keys[0]!) || !isProjectCategory(manual.category) ||
    !validId(manual.commentId) || typeof manual.login !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(manual.login))) return null
  const { comment, meta, byRepo } = report
  const approvals: IntakeApproval[] = []
  for (const repo of input.keys) {
    const result = byRepo.get(repo)!
    if (known.has(repo)) {
      if (result.status !== 'included') return null
      continue
    }
    if (!eligibleResult(result, !!manual)) return null
    const sha = evidenceSha(result.evidence, repo)
    if (!sha || (result.evidenceLinks !== undefined && (!Array.isArray(result.evidenceLinks) ||
      result.evidenceLinks.some((url) => evidenceSha(url, repo) !== sha)))) return null
    if (manual?.agentReview && (!validId(manual.agentReviewCommentId) || typeof manual.agentReviewedBy !== 'string' ||
      !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(manual.agentReviewedBy) || manual.category !== manual.agentReview.category ||
      !matchesAgentReview(manual.agentReview, comment, input.version, repo, sha))) return null
    approvals.push({ repo, sha, category: manual?.category ?? result.score?.category ?? 'other',
      reviewCommentId: comment.id, ...(manual ? { approvalCommentId: manual.commentId, approvedBy: manual.login } : {}),
      review: result, checkedAt: meta.at, ...(manual?.agentReview ? { agentReview: manual.agentReview,
        agentReviewCommentId: manual.agentReviewCommentId, agentReviewedBy: manual.agentReviewedBy } : {}) })
  }
  return approvals.length ? approvals : null
}

// --- 明确“不匹配”只接受完整整仓 unrelated；浅审 drop/混合结果不等于整单拒收 ---
export function submissionRejections(issue: IntakeIssue, input: IntakeInput, comments: IntakeComment[], known: Set<string>) {
  const report = currentSubmissionReport(issue, input, comments, known)
  if (!report || input.keys.some((repo) => known.has(repo))) return null
  const rejections = []
  for (const repo of input.keys) {
    const result = report.byRepo.get(repo)!
    if (result.status !== 'drop' || result.reason !== 'unrelated-evidence' || result.deep !== true ||
      !completeCoverage(result.progress) || result.score !== undefined &&
      (!validScore(result.score) || reviewDecision(result.score) !== 'drop')) return null
    const sha = evidenceSha(result.evidence, repo)
    if (!sha || result.evidenceLinks !== undefined && (!Array.isArray(result.evidenceLinks) ||
      result.evidenceLinks.some((url) => evidenceSha(url, repo) !== sha))) return null
    rejections.push({ repo, sha, reviewCommentId: report.comment.id })
  }
  return rejections.length ? rejections : null
}

// --- 提交面只容许规范目录和它的两份派生资产，不放行 workflow 或源码 ---
export function assertIntakeFiles(files: string[]): void {
  const allowed = new Set(['data/github.json', 'README.md', 'public/sitemap.xml'])
  if (!Array.isArray(files) || !files.includes('data/github.json') || new Set(files).size !== files.length ||
    files.some((file) => !allowed.has(file))) throw new Error('submission-intake-unexpected-files')
}

export function intakeAdditions(base: DirectoryItem[], head: DirectoryItem[]): DirectoryItem[] {
  validateRows(base)
  validateRows(head)
  validateRepositoryIdentityChanges(head, base)
  if (head.length <= base.length || base.some((row, index) => !isDeepStrictEqual(row, head[index]))) {
    throw new Error('submission-intake-not-append-only')
  }
  return head.slice(base.length)
}
