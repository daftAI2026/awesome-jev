/**
 * [INPUT]: 依赖 Node timers 的等待与 model-types 的 GitHubApi / FetchImpl 契约
 * [OUTPUT]: 对外提供受限 REST/GraphQL 只读客户端、无重试的显式写入客户端与暂停错误分类
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
  const pause = async (until: number) => {
    check()
    const remaining = until - now()
    if (remaining <= 0) return
    // 不截短服务端要求的等待，也不占满快照保存所需的执行窗口。
    if (until >= deadline) stop('github-deadline')
    await wait(remaining)
    check()
  }
  return async function api(path: string, request): Promise<unknown> {
    if (request) {
      const operation = typeof request.query === 'string' ? request.query.replace(/"(?:\\.|[^"\\])*"|#[^\n]*/g, '') : ''
      if (path !== '/graphql' || !/^\s*query\b/.test(operation) || /\b(?:mutation|subscription)\b/.test(operation)) throw new Error('github-invalid-query')
    }
    if (path === '/graphql' && !request) throw new Error('github-invalid-query')
    if (!path.startsWith('/') || path.startsWith('//')) throw new Error('github-invalid-path')
    const endpoint = path === '/graphql' ? 'graphql' : path.startsWith('/search/code?') ? 'code_search' : path.startsWith('/search/') ? 'search' : 'core'
    for (let attempt = 0; attempt < 3; attempt++) {
      check()
      await pause(Math.max(secondaryUntil, primaryUntil.get(resourceNames.get(endpoint) ?? endpoint) ?? 0))
      let response: Response
      requests++
      try {
        response = await fetchImpl(`https://api.github.com${path}`, {
          ...(request ? { method: 'POST', body: JSON.stringify(request) } : {}),
          redirect: 'error', signal: AbortSignal.timeout(Math.max(1, Math.min(30000, Math.floor(deadline - now())))),
          headers: {
            ...(request ? { 'Content-Type': 'application/json' } : {}),
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'awesome-jev-radar',
          },
        })
      } catch {
        if (now() >= deadline) stop('github-deadline')
        if (attempt === 2) throw new Error('github-network-or-timeout')
        await pause(now() + 2000 * 2 ** attempt)
        continue
      }
      const resource = response.headers.get('x-ratelimit-resource') ?? endpoint
      resourceNames.set(endpoint, resource)
      const reset = response.headers.get('x-ratelimit-reset')
      const resetAt = reset !== null && Number.isFinite(Number(reset)) ? Number(reset) * 1000 : 0
      const exhausted = response.headers.get('x-ratelimit-remaining') === '0'
      if (exhausted && resetAt > now()) primaryUntil.set(resource, resetAt)
      let graphqlLimited = false
      if (response.ok) {
        let data: unknown
        try { data = await response.json() } catch { throw new Error('github-invalid-response') }
        if (now() >= deadline) stop('github-deadline')
        graphqlLimited = endpoint === 'graphql' && typeof data === 'object' && data !== null && 'errors' in data && Array.isArray(data.errors) && data.errors.some((error: unknown) => {
          if (!error || typeof error !== 'object') return false
          const entry = error as { type?: unknown; message?: unknown; extensions?: { code?: unknown } }
          return entry.type === 'RATE_LIMITED' || entry.extensions?.code === 'RATE_LIMITED' || typeof entry.message === 'string' && /rate limit|abuse detection/i.test(entry.message)
        })
        if (!graphqlLimited) return data
      }
      const retry = response.headers.get('retry-after')
      const retryMs = retry !== null && Number.isFinite(Number(retry)) && Number(retry) >= 0 ? Number(retry) * 1000 : 0
      // 权限不足也使用 403；只有限流头或限流消息才允许重试。
      let secondary = graphqlLimited || response.status === 429 || response.status === 403 && (exhausted || retry !== null)
      if (response.status === 403 && !secondary) {
        try {
          const body: unknown = await response.clone().json()
          secondary = typeof body === 'object' && body !== null && 'message' in body &&
            typeof body.message === 'string' && /rate limit|abuse detection/i.test(body.message)
        } catch { /* 非 JSON 权限错误仍按原 HTTP 状态处理，不回显内容。 */ }
      }
      if (!response.ok) await response.body?.cancel()
      if (secondary) {
        if (attempt === 2) stop('github-rate-limited')
        const until = Math.max(now() + (retryMs || (exhausted && resetAt > now() ? 0 : 60000 * 2 ** attempt)), exhausted ? resetAt : 0)
        if (!exhausted) secondaryUntil = until
        await pause(until)
        continue
      }
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
  return error instanceof Error && ['github-deadline', 'github-rate-limited', 'github-request-budget'].includes(error.message)
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
