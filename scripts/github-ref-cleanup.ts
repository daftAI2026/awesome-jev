/**
 * [INPUT]: 依赖 GitHub GraphQL updateRefs 的 beforeOid 比较与调用方确认的本仓 Node ID
 * [OUTPUT]: 提供单分支、固定 expected SHA、非强推且无自动重试的 CAS 删除能力
 * [POS]: scripts 的专用破坏性网络边界；不放宽 github-client 的通用只读 GraphQL
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { FetchImpl } from './model-types.ts'
import { isRecord } from './model-types.ts'

export interface BranchDeletion { repositoryId: string; ref: string; beforeOid: string }
export type BranchDeleter = (input: BranchDeletion) => Promise<void>
export function validBranchRef(ref: unknown): ref is string {
  return typeof ref === 'string' && ref.startsWith('refs/heads/') && ref.length <= 240 &&
    ref !== 'refs/heads/main' && ![...ref].some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || '~^:?*[\\'.includes(char)) &&
    !ref.includes('..') && !ref.includes('@{') && !ref.includes('//') && !ref.endsWith('.') &&
    ref.slice(11).split('/').every((part) => !!part && !part.startsWith('.') && !part.endsWith('.lock'))
}
export function createBranchDeleter(token: string | undefined, fetchImpl: FetchImpl = fetch): BranchDeleter {
  if (!token?.trim()) throw new Error('github-missing-token')
  return async ({ repositoryId, ref, beforeOid }) => {
    if (typeof repositoryId !== 'string' || !/^[A-Za-z0-9_=-]{1,200}$/.test(repositoryId) ||
      !validBranchRef(ref) || !/^[a-f0-9]{40}$/.test(beforeOid) || /^0+$/.test(beforeOid)) throw new Error('github-invalid-ref-delete')
    let response: Response
    try {
      response = await fetchImpl('https://api.github.com/graphql', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json', 'User-Agent': 'awesome-jev-intake' },
        body: JSON.stringify({ query: 'mutation DeleteSubmissionBranch($input: UpdateRefsInput!) { updateRefs(input: $input) { clientMutationId } }',
          variables: { input: { repositoryId, refUpdates: [{ name: ref, beforeOid, afterOid: '0'.repeat(40), force: false }] } } }),
      })
    } catch { throw new Error('github-write-outcome-unknown') }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`github-write-http-${response.status}`) }
    let data: unknown
    try { data = await response.json() } catch { throw new Error('github-write-outcome-unknown') }
    if (!isRecord(data) || data.errors !== undefined || !isRecord(data.data) || !isRecord(data.data.updateRefs)) {
      throw new Error('github-ref-delete-unconfirmed')
    }
  }
}
