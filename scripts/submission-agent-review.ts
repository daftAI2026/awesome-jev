/**
 * [INPUT]: 依赖真实投稿报告、现有分类白名单与固定提交证据 URL
 * [OUTPUT]: 提供独立 Agent OK 分类收据的严格解析、报告摘要绑定及只输出草稿的 CLI
 * [POS]: scripts 的人工复核交接契约；不提交评论、不授予权限，也不改写 Jev 原始决定
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createHash } from 'node:crypto'
import { readFileSync, realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { isPinnedEvidenceUrl } from '../src/lib/inclusion.ts'
import { repoKey } from './catalog.ts'
import { isProjectCategory } from './jev-client.ts'
import { isRecord, type ProjectCategory } from './model-types.ts'
import { reviewMeta } from './submission-review.ts'

export const AGENT_REVIEW_MARKER = '<!-- awesome-jev-agent-review:v1 -->'
export const reviewBodyHash = (body: string) => createHash('sha256').update(body).digest('hex')
export interface AgentReview {
  decision: 'OK'
  category: ProjectCategory
  repo: string
  sha: string
  inputVersion: string
  reviewCommentId: number
  reviewBodySha256: string
  evidence: string[]
  summary: string
}
type ReviewComment = Parameters<typeof reviewMeta>[0]
type Assessment = Pick<AgentReview, 'category' | 'repo' | 'sha' | 'evidence' | 'summary'>
const SHA = /^[a-f0-9]{40}$/
const HASH = /^[a-f0-9]{64}$/

function valid(value: unknown): value is AgentReview {
  if (!isRecord(value) || Object.keys(value).sort().join(',') !==
    'category,decision,evidence,inputVersion,repo,reviewBodySha256,reviewCommentId,sha,summary' ||
    value.decision !== 'OK' || !isProjectCategory(value.category) ||
    typeof value.repo !== 'string' || repoKey(`https://github.com/${value.repo}`) !== value.repo ||
    typeof value.sha !== 'string' || !SHA.test(value.sha) || typeof value.inputVersion !== 'string' ||
    !(SHA.test(value.inputVersion) || HASH.test(value.inputVersion)) ||
    !Number.isSafeInteger(value.reviewCommentId) || Number(value.reviewCommentId) <= 0 ||
    typeof value.reviewBodySha256 !== 'string' || !HASH.test(value.reviewBodySha256) ||
    typeof value.summary !== 'string' || !value.summary.trim() || value.summary.length > 2000 ||
    !Array.isArray(value.evidence) || !value.evidence.length || value.evidence.length > 10) return false
  return value.evidence.every((url) => typeof url === 'string' && url.length <= 600 &&
    isPinnedEvidenceUrl(url, `https://github.com/${value.repo}`) && new URL(url).pathname.split('/')[4] === value.sha)
}

// --- /ok 是动作；正文中的独立收据解释类别与依据，不接受引用或自由文本猜测 ---
export function parseAgentReviewComment(body: unknown): AgentReview | null {
  if (typeof body !== 'string' || body.length > 12000) return null
  const content = body.startsWith('/ok\n') ? body.slice(4) : body
  const prefix = `${AGENT_REVIEW_MARKER}\n\`\`\`json\n`
  if (!content.startsWith(prefix) || !content.endsWith('\n```')) return null
  try {
    const value: unknown = JSON.parse(content.slice(prefix.length, -4))
    return valid(value) ? value : null
  } catch { return null }
}

export function isOkCommand(body: unknown): boolean {
  return body === '/ok' || typeof body === 'string' && body.startsWith('/ok\n') && !!parseAgentReviewComment(body)
}

export function matchesAgentReview(receipt: AgentReview, report: ReviewComment, version: string, repo: string, sha: string): boolean {
  return valid(receipt) && !!report?.body && receipt.reviewCommentId === report.id &&
    receipt.reviewBodySha256 === reviewBodyHash(report.body) && receipt.inputVersion === version &&
    receipt.repo === repo && receipt.sha === sha
}

export function createAgentReviewComment(report: ReviewComment, assessment: Assessment): string {
  const meta = reviewMeta(report)
  const value: AgentReview = { decision: 'OK', ...assessment, inputVersion: meta?.inputVersion ?? '',
    reviewCommentId: report?.id ?? 0, reviewBodySha256: reviewBodyHash(report?.body ?? '') }
  if (!meta || !valid(value)) throw new Error('intake-invalid-agent-review')
  return `/ok\n${AGENT_REVIEW_MARKER}\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(resolve(process.argv[1]))).href) {
  if (process.argv.length !== 4) throw new Error('intake-agent-review-usage')
  // 输入文件是审核材料；输出只是草稿。发布它可能授权合并，必须另有明确用户授权。
  process.stdout.write(createAgentReviewComment(JSON.parse(readFileSync(process.argv[2]!, 'utf8')),
    JSON.parse(readFileSync(process.argv[3]!, 'utf8'))))
}
