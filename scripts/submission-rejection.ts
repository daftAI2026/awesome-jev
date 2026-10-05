/**
 * [INPUT]: 依赖当前完整不匹配报告、纯投稿范围、真实关闭事件与专用 expected SHA 删除能力
 * [OUTPUT]: 提供拒收意图/单次删除尝试/终态持久化、关闭 PR 与本仓合格分支 CAS 回收
 * [POS]: scripts 的负向投稿生命周期；不改模型预算、不创建 PR，拒绝 fork/main/保护与已发现共享分支
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createHash } from 'node:crypto'
import { repoKey } from './catalog.ts'
import { catalogPrAdditions } from './submission-catalog-pr.ts'
import { submissionRejections, genuineReport } from './submission-intake-policy.ts'
import { jsonAt, submissionInput, reviewMeta, REPOSITORY } from './submission-review.ts'
import { pages, record, mainSha, PREFIX, SHA } from './submission-github.ts'
import { validBranchRef, type BranchDeleter } from './github-ref-cleanup.ts'
import type { GitHubWriter } from './github-client.ts'
import { isRecord, type GitHubApi } from './model-types.ts'

export const REJECTION_MARKER = '<!-- awesome-jev-rejection:v1 -->'
const CLEANED_MARKER = '<!-- awesome-jev-rejection-cleaned:v1 -->'
const ATTEMPT_MARKER = '<!-- awesome-jev-rejection-delete-attempt:v1 -->'
const BOT = 'github-actions[bot]'
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
interface RejectionOptions { api: GitHubApi; write: GitHubWriter; deleteBranch?: BranchDeleter }
interface Source { number: number; version: string }
interface Receipt { pr: number; source: number; version: string; signature: string; headSha: string; ref: string; headRepoId: number; headRepo: string }
const bot = (value: any) => value?.user?.login === BOT && value.user.type === 'Bot'
const positive = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0
const sameHead = (pr: Record<string, any>, receipt: Receipt) => pr.head?.sha === receipt.headSha &&
  pr.head.ref === receipt.ref && pr.head.repo?.id === receipt.headRepoId && pr.head.repo.full_name === receipt.headRepo

function parseReceipt(comment: any): Receipt | null {
  if (!bot(comment) || typeof comment.body !== 'string' || !comment.body.startsWith(REJECTION_MARKER)) return null
  try {
    const value = JSON.parse(Buffer.from(comment.body.match(/<!-- rejection-meta:([A-Za-z0-9+/=]+) -->/)?.[1] ?? '', 'base64').toString())
    if (!isRecord(value) || !positive(value.pr) || !positive(value.source) || !SHA.test(String(value.headSha)) ||
      !/^[a-f0-9]{64}$/.test(String(value.signature)) || typeof value.version !== 'string' ||
      !/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(value.version) || !positive(value.headRepoId) ||
      typeof value.ref !== 'string' || typeof value.headRepo !== 'string') return null
    return value as unknown as Receipt
  } catch { return null }
}

async function context(api: GitHubApi, source: number) {
  const comments = await pages<any>(api, `${PREFIX}/issues/${source}/comments`)
  const report = comments.findLast(genuineReport)
  const meta = reviewMeta(report)
  if (!meta || !Array.isArray(meta.completed) || !meta.completed.length ||
    !meta.completed.every((r) => r?.status === 'drop' && r.reason === 'unrelated-evidence' && r.deep === true)) return null
  const issue = record(await api(`${PREFIX}/issues/${source}`))
  const input = await submissionInput(api, { ...issue, number: source })
  const known = new Set((await jsonAt(api, 'data/github.json', await mainSha(api))).map((r) => repoKey(r.url)!))
  const rejections = submissionRejections(issue, input, comments, known)
  if (!rejections) return null
  for (const item of rejections) {
    const repo = record(await api(`/repos/${item.repo}`))
    if (typeof repo.default_branch !== 'string' || !repo.default_branch || repo.private || repo.archived ||
      record(await api(`/repos/${item.repo}/commits/${encodeURIComponent(repo.default_branch)}`)).sha !== item.sha) return null
  }
  return { input, rejections, signature: hash([input.version, report!.id, report!.body, report!.updated_at]) }
}

async function cleanup(options: RejectionOptions, pr: Record<string, any>, receipt: Receipt, comment: any): Promise<string> {
  const { api, deleteBranch } = options
  if (pr.state !== 'closed' || pr.merged || !sameHead(pr, receipt)) return 'rejection-head-or-state-changed'
  const events = await pages<any>(api, `${PREFIX}/issues/${pr.number}/events`)
  const closing = events.findLast((e) => ['closed', 'reopened'].includes(e.event))
  if (closing?.event !== 'closed' || closing.actor?.login !== BOT || closing.actor.type !== 'Bot' ||
    !Number.isFinite(Date.parse(closing.created_at)) || !Number.isFinite(Date.parse(comment.created_at)) ||
    Date.parse(closing.created_at) < Date.parse(comment.created_at)) return 'rejection-close-not-owned'
  if (comment.body.includes(CLEANED_MARKER)) return 'rejected-and-cleaned'
  const finish = async () => {
    if (!positive(comment.id)) throw new Error('intake-invalid-rejection-comment')
    // 已确认清理必须持久化终态；以后人为恢复同 SHA 的分支，也不重新回收。
    await options.write(`${PREFIX}/issues/comments/${comment.id}`, 'PATCH', { body: comment.body + '\n' + CLEANED_MARKER })
    return 'rejected-and-cleaned'
  }
  const repository = record(await api(PREFIX))
  if (receipt.headRepo !== REPOSITORY || receipt.headRepoId !== repository.id) return 'rejected-fork-branch-retained'
  if (receipt.ref === repository.default_branch || !validBranchRef(`refs/heads/${receipt.ref}`)) return 'rejected-default-branch-retained'
  const refPath = `${PREFIX}/git/ref/heads/${receipt.ref.split('/').map(encodeURIComponent).join('/')}`
  const currentRef = async () => {
    try { return record(record(await api(refPath)).object).sha }
    catch (error) { if (error instanceof Error && error.message === 'github-http-404') return null; throw error }
  }
  const current = await currentRef()
  if (current === null) return finish()
  // OID 不能区分同 SHA 的 ref 重建；曾尝试但结果不明时，不自动再次删除。
  if (comment.body.includes(ATTEMPT_MARKER)) return 'rejected-cleanup-needs-maintainer'
  if (current !== receipt.headSha) return 'rejected-newer-branch-retained'
  const branch = record(await api(`${PREFIX}/branches/${encodeURIComponent(receipt.ref)}`))
  if (branch.protected !== false || branch.commit?.sha !== receipt.headSha) return 'rejected-protected-or-changed-branch-retained'
  const open = await pages<any>(api, `${PREFIX}/pulls?state=open`)
  if (open.some((p) => p.head?.repo?.id === repository.id && p.head.ref === receipt.ref ||
    p.base?.repo?.id === repository.id && p.base.ref === receipt.ref)) return 'rejected-shared-branch-retained'
  const renewed = await context(api, receipt.source)
  if (!renewed || renewed.signature !== receipt.signature || renewed.input.version !== receipt.version) return 'rejection-report-changed'
  const fresh = record(await api(`${PREFIX}/pulls/${pr.number}`))
  if (fresh.state !== 'closed' || fresh.merged || !sameHead(fresh, receipt) || fresh.base?.ref !== 'main' ||
    fresh.base.repo?.full_name !== REPOSITORY || fresh.base.repo.id !== repository.id) return 'rejection-head-or-state-changed'
  if (!deleteBranch) return 'rejected-cleanup-unavailable'
  const body = comment.body + '\n' + ATTEMPT_MARKER
  const attempted = record(await options.write(`${PREFIX}/issues/comments/${comment.id}`, 'PATCH', { body }))
  if (!bot(attempted) || attempted.id !== comment.id || attempted.body !== body) throw new Error('intake-rejection-attempt-unconfirmed')
  comment = attempted
  try { await deleteBranch({ repositoryId: repository.node_id, ref: `refs/heads/${receipt.ref}`, beforeOid: receipt.headSha }) }
  catch (error) {
    // 响应丢失不能重发删除；先确认 ref 是否消失，后续 sweep 仅确认终态或转人工。
    if (await currentRef() === null) return finish()
    throw error
  }
  return await currentRef() === null ? finish() : 'rejected-cleanup-unconfirmed'
}

export async function rejectSubmissionPr(options: RejectionOptions, number: number, source?: Source): Promise<string | null> {
  const { api, write } = options
  const pr = record(await api(`${PREFIX}/pulls/${number}`))
  if (pr.merged || pr.draft || pr.base?.ref !== 'main' || pr.base.repo?.full_name !== REPOSITORY ||
    !positive(pr.head?.repo?.id) || typeof pr.head.repo.full_name !== 'string' ||
    !SHA.test(String(pr.head.sha)) || !SHA.test(String(pr.base.sha))) return null
  const sourceNumber = source?.number ?? number
  const ctx = pr.state === 'open' ? await context(api, sourceNumber) : null
  if (pr.state === 'open' && (!ctx || source && ctx.input.version !== source.version ||
    !source && ctx.input.version !== pr.head.sha)) return null
  const comments = await pages<any>(api, `${PREFIX}/issues/${number}/comments`)
  const priorComment = comments.findLast((c) => parseReceipt(c)?.pr === number && parseReceipt(c)?.source === sourceNumber)
  const prior = priorComment ? parseReceipt(priorComment)! : null
  if (pr.state !== 'open') {
    if (pr.state !== 'closed' || !prior) return null
    return cleanup(options, pr, prior, priorComment)
  }
  if (!ctx) return null
  const repository = record(await api(PREFIX))
  if (pr.base.repo.id !== repository.id || repository.full_name !== REPOSITORY) return null
  const compare = record(await api(`${PREFIX}/compare/${pr.base.sha}...${pr.head.sha}`))
  const additions = await catalogPrAdditions(api, pr as { number: number; head: { sha: string } }, compare.merge_base_commit?.sha)
  const keys = additions.map((r) => repoKey(r.url)!).sort()
  if (JSON.stringify(keys) !== JSON.stringify([...ctx.input.keys].sort())) return null
  const receipt: Receipt = { pr: number, source: sourceNumber, version: ctx.input.version, signature: ctx.signature,
    headSha: pr.head.sha, ref: pr.head.ref, headRepoId: pr.head.repo.id, headRepo: pr.head.repo.full_name }
  let comment = prior && hash(prior) === hash(receipt) ? priorComment : undefined
  if (!comment) {
    const body = `${REJECTION_MARKER}\n<!-- rejection-meta:${Buffer.from(JSON.stringify(receipt)).toString('base64')} -->\n` +
      `The complete current review found no substantial Jev connection for every submitted project (review ${ctx.rejections[0]!.reviewCommentId}). ` +
      'This catalog-only PR will be closed. Eligible unchanged branches in this repository may be reclaimed; fork, protected and reused branches are retained.'
    comment = record(await write(`${PREFIX}/issues/${number}/comments`, 'POST', { body }))
  }
  const renewed = await context(api, sourceNumber)
  const fresh = record(await api(`${PREFIX}/pulls/${number}`))
  if (!renewed || renewed.signature !== ctx.signature || !sameHead(fresh, receipt) || fresh.draft || fresh.merged ||
    fresh.base?.ref !== 'main' || fresh.base.repo?.full_name !== REPOSITORY) return 'rejection-report-or-head-changed'
  if (fresh.state === 'open') {
    // GitHub 关闭 PR 不支持 expected-head；CAS 只保证后面的 ref 删除，不能混为原子事务。
    try { await write(`${PREFIX}/pulls/${number}`, 'PATCH', { state: 'closed' }) }
    catch (error) {
      const state = record(await api(`${PREFIX}/pulls/${number}`))
      if (state.state !== 'closed' || state.merged) throw error
    }
  }
  return cleanup(options, record(await api(`${PREFIX}/pulls/${number}`)), receipt, comment)
}
