import { setTimeout as sleep } from 'node:timers/promises'
import type { FetchImpl, GitHubApi, Waiter } from './model-types.ts'

interface GitHubClientOptions {
  fetchImpl?: FetchImpl
  wait?: Waiter
}

export function createGitHubClient(token: string | undefined, {
  fetchImpl = fetch,
  wait = sleep,
}: GitHubClientOptions = {}): GitHubApi {
  if (!token?.trim()) throw new Error('github-missing-token')
  return async function api(path: string): Promise<unknown> {
    if (!path.startsWith('/') || path.startsWith('//')) throw new Error('github-invalid-path')
    for (let attempt = 0; attempt < 3; attempt++) {
      let response: Response
      try {
        response = await fetchImpl(`https://api.github.com${path}`, {
          redirect: 'error', signal: AbortSignal.timeout(30000),
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'awesome-jev-radar',
          },
        })
      } catch {
        throw new Error('github-network-or-timeout')
      }
      if ([403, 429, 502, 503].includes(response.status) && attempt < 2) {
        const seconds = Number(response.headers.get('retry-after'))
        await response.body?.cancel()
        await wait(Math.min(60000, Math.max(2000 * 2 ** attempt, Number.isFinite(seconds) ? seconds * 1000 : 0)))
        continue
      }
      if (!response.ok) {
        await response.body?.cancel()
        throw new Error(`github-http-${response.status}`)
      }
      try {
        const data: unknown = await response.json()
        return data
      } catch {
        throw new Error('github-invalid-response')
      }
    }
    throw new Error('github-unavailable')
  }
}
