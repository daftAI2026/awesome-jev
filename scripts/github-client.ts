/**
 * [INPUT]: 依赖 Node timers 的等待与 model-types 的 GitHubApi / FetchImpl 契约
 * [OUTPUT]: 提供响应体截止、认证停机与限流隔离；已知失败不降级，写入不重试
 * [POS]: scripts 的共享网络边界，被发现、取证与投稿审核调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { setTimeout as sleep } from 'node:timers/promises'
import type { FetchImpl, GitHubApi, Waiter } from './model-types.ts'

interface GitHubClientOptions {
  fetchImpl?: FetchImpl
  wait?: Waiter
  now?: () => number
  deadline?: number
  maxRequests?: number
}

// --- 仅分类上游消息，不把响应正文拼入公开错误 ---
function rateLimitMessage(message: unknown): 'secondary' | 'unspecified' | undefined {
  if (typeof message !== 'string') return undefined
  if (/secondary rate limit|abuse detection/i.test(message)) return 'secondary'
  if (/rate limit/i.test(message)) return 'unspecified'
  return undefined
}

// --- GitHub 响应头决定服务端额度；本地上限只约束本次运行，不代替配额 ---
export function createGitHubClient(token: string | undefined, {
  fetchImpl = fetch, wait = sleep, now = Date.now, deadline = Infinity, maxRequests = Infinity,
}: GitHubClientOptions = {}): GitHubApi {
  if (!token?.trim()) throw new Error('github-missing-token')
  if (!(deadline === Infinity || Number.isFinite(deadline)) || deadline < 0 ||
    !(maxRequests === Infinity || Number.isSafeInteger(maxRequests) && maxRequests > 0)) throw new Error('github-invalid-budget')
  let requests = 0
  let halted: string | undefined
  let secondaryUntil = 0
  const primaryUntil = new Map<string, number>()
  const resourceNames = new Map<string, string>()
  const stop = (reason: string): never => { halted = reason; throw new Error(reason) }
  const check = () => {
    if (halted) throw new Error(halted)
    if (now() >= deadline) stop('github-deadline')
    if (requests >= maxRequests) stop('github-request-budget')
  }
  const pauseUntil = async (until: number, primary: boolean, phaseDeadline: number) => {
    check()
    const remaining = until - now()
    if (remaining <= 0) return
    // 不截短服务端要求的等待，也不占满快照保存所需的执行窗口。
    if (until >= deadline) {
      if (primary) throw new Error('github-resource-deferred')
      stop('github-deadline')
    }
    if (until >= phaseDeadline) throw new Error('github-phase-deadline')
    await wait(remaining)
    check()
  }
  return async function api(path: string, request, options): Promise<unknown> {
    const phaseDeadline = Math.min(deadline, options?.deadline ?? Infinity)
    if (!(phaseDeadline === Infinity || Number.isFinite(phaseDeadline)) || phaseDeadline < 0) throw new Error('github-invalid-budget')
    const checkPhase = () => { check(); if (now() >= phaseDeadline) throw new Error('github-phase-deadline') }
    const pause = async (until: number, primary = false) => { await pauseUntil(until, primary, phaseDeadline); checkPhase() }
    if (request) {
      const operation = typeof request.query === 'string' ? request.query.replace(/"(?:\\.|[^"\\])*"|#[^\n]*/g, '') : ''
      if (path !== '/graphql' || !/^\s*query\b/.test(operation) || /\b(?:mutation|subscription)\b/.test(operation)) throw new Error('github-invalid-query')
    }
    if (path === '/graphql' && !request) throw new Error('github-invalid-query')
    if (!path.startsWith('/') || path.startsWith('//')) throw new Error('github-invalid-path')
    const endpoint = path === '/graphql' ? 'graphql' : path.startsWith('/search/code?') ? 'code_search' : path.startsWith('/search/') ? 'search' : 'core'
    for (let attempt = 0; attempt < 3; attempt++) {
      checkPhase()
      await pause(secondaryUntil)
      await pause(primaryUntil.get(resourceNames.get(endpoint) ?? endpoint) ?? 0, true)
      let response: Response
      requests++
      try {
        response = await fetchImpl(`https://api.github.com${path}`, {
          ...(request ? { method: 'POST', body: JSON.stringify(request) } : {}),
          redirect: 'error', signal: AbortSignal.timeout(Math.max(1, Math.min(30000, Math.floor(phaseDeadline - now())))),
          headers: {
            ...(request ? { 'Content-Type': 'application/json' } : {}),
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'awesome-jev-radar',
          },
        })
      } catch {
        checkPhase()
        if (attempt === 2) throw new Error('github-network-or-timeout')
        await pause(now() + 2000 * 2 ** attempt)
        continue
      }
      // 先保留认证失败；阶段截止和响应体取消均不能恢复凭据。
      if (response.status === 401) {
        halted = 'github-http-401'
        try { await response.body?.cancel() } finally { stop('github-http-401') }
      }
      const resource = response.headers.get('x-ratelimit-resource') ?? endpoint
      resourceNames.set(endpoint, resource)
      const reset = response.headers.get('x-ratelimit-reset')
      const resetAt = reset !== null && Number.isFinite(Number(reset)) ? Number(reset) * 1000 : 0
      const exhausted = response.headers.get('x-ratelimit-remaining') === '0'
      if (exhausted && resetAt > now()) primaryUntil.set(resource, resetAt)
      let graphqlLimited = false, explicitSecondary = false
      if (response.ok) {
        let data: unknown
        try { data = await response.json() } catch (error) {
          if (!(error instanceof SyntaxError)) checkPhase()
          throw new Error('github-invalid-response')
        }
        if (endpoint === 'graphql' && typeof data === 'object' && data !== null && 'errors' in data && Array.isArray(data.errors)) {
          for (const error of data.errors) {
            if (!error || typeof error !== 'object') continue
            const entry = error as { type?: unknown; message?: unknown; extensions?: { code?: unknown } }
            const message = rateLimitMessage(entry.message)
            graphqlLimited ||= entry.type === 'RATE_LIMITED' || entry.extensions?.code === 'RATE_LIMITED' || message !== undefined
            explicitSecondary ||= message === 'secondary'
          }
        }
        if (!graphqlLimited) { checkPhase(); return data }
      }
      const retry = response.headers.get('retry-after')
      const retryMs = retry !== null && Number.isFinite(Number(retry)) && Number(retry) >= 0 ? Number(retry) * 1000 : 0
      // 403/429 都能表示主限流；正文明确 secondary 时必须保留全局暂停。
      let limited = graphqlLimited || response.status === 429 || response.status === 403 && (exhausted || retry !== null)
      let unreadLimitBody = false
      if (response.status === 403 || response.status === 429) {
        try {
          const body: unknown = await response.json()
          const message = rateLimitMessage(typeof body === 'object' && body !== null && 'message' in body ? body.message : undefined)
          limited ||= message !== undefined
          explicitSecondary ||= message === 'secondary'
        } catch { unreadLimitBody = true }
      }
      if (!response.ok && !response.bodyUsed) await response.body?.cancel()
      if (limited) {
        // Retry-After 或正文缺失均不能排除 secondary，保守全局暂停。
        const primary = exhausted && retry === null && !explicitSecondary && !unreadLimitBody
        if (attempt === 2) {
          if (primary) { primaryUntil.set(resource, Math.max(resetAt, now() + 60000)); throw new Error('github-resource-deferred') }
          stop('github-rate-limited')
        }
        const until = Math.max(now() + (retryMs || (exhausted && resetAt > now() ? 0 : 60000 * 2 ** attempt)), exhausted ? resetAt : 0)
        if (!primary) secondaryUntil = until
        else primaryUntil.set(resource, until)
        await pause(until, primary)
        continue
      }
      checkPhase()
      if ([502, 503].includes(response.status) && attempt < 2) {
        await pause(now() + Math.max(2000 * 2 ** attempt, retryMs))
        continue
      }
      throw new Error(`github-http-${response.status}`)
    }
    throw new Error('github-unavailable')
  }
}

export function isGitHubRunDeferred(error: unknown): boolean {
  return error instanceof Error && ['github-deadline', 'github-rate-limited', 'github-request-budget', 'github-resource-deferred', 'github-phase-deadline'].includes(error.message)
}

export type GitHubWriter = (path: string, method: 'POST' | 'PUT' | 'PATCH', body: Record<string, unknown>) => Promise<unknown>

// --- 写操作不自动重试：响应丢失后由调用方重读远端事实恢复，不能重复建 PR 或合并 ---
export function createGitHubWriter(token: string | undefined, fetchImpl: FetchImpl = fetch): GitHubWriter {
  if (!token?.trim()) throw new Error('github-missing-token')
  return async (path, method, body) => {
    if (!/^\/repos\/[\w.-]+\/[\w.-]+\/[\w./-]+$/.test(path) ||
      path.split('/').some((part) => part === '.' || part === '..') ||
      !['POST', 'PUT', 'PATCH'].includes(method)) throw new Error('github-invalid-write')
    let response: Response
    try {
      response = await fetchImpl(`https://api.github.com${path}`, {
        method, body: JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(30000),
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'awesome-jev-intake' },
      })
    } catch { throw new Error('github-write-outcome-unknown') }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`github-write-http-${response.status}`) }
    if (response.status === 204) return null
    try { return await response.json() } catch { throw new Error('github-write-outcome-unknown') }
  }
}
