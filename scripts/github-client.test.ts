/**
 * [INPUT]: 依赖 Node test 与 GitHub 客户端的注入网络、时钟和等待接口
 * [OUTPUT]: 验证响应体截止、认证停机、限流作用域、预算与写入隔离
 * [POS]: scripts 的共享 REST/GraphQL 读取及条件收录写入边界验收，不连接真实 GitHub
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createGitHubClient, createGitHubWriter } from './github-client.ts'

function fixture(responses: (Response | Error)[], extra = {}) {
  let time = 1_000_000
  let calls = 0
  const waits: number[] = []
  const api = createGitHubClient('test-only', {
    now: () => time,
    wait: async (ms: number) => { waits.push(ms); time += ms },
    fetchImpl: async () => {
      calls++
      const result = responses.shift()
      if (result instanceof Error) throw result
      if (!result) throw new Error('unexpected request')
      return result
    },
    ...extra,
  })
  return { api, waits, calls: () => calls }
}
const ok = () => Response.json({ ok: true })

test('Retry-After 120 is honored without truncation', async () => {
  const f = fixture([new Response('', { status: 429, headers: { 'retry-after': '120' } }), ok()])
  await f.api('/repos/test/repo')
  assert.deepEqual(f.waits, [120_000])
})
test('primary quota waits until reset, not generic short backoff', async () => {
  const f = fixture([new Response('', { status: 403, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1120' } }), ok()])
  await f.api('/repos/test/repo')
  assert.deepEqual(f.waits, [120_000])
})
test('last successful request records exhaustion before next request in the same resource', async () => {
  const f = fixture([Response.json({}, { headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1120', 'x-ratelimit-resource': 'core' } }), ok()])
  await f.api('/repos/test/one'); await f.api('/repos/test/two')
  assert.deepEqual(f.waits, [120_000]); assert.equal(f.calls(), 2)
})
test('ordinary permission 403 does not retry or wait', async () => {
  const f = fixture([Response.json({ message: 'Resource not accessible by integration' }, { status: 403 })])
  await assert.rejects(f.api('/repos/test/repo'), /^Error: github-http-403$/)
  assert.equal(f.calls(), 1); assert.deepEqual(f.waits, [])
})
test('secondary limit without Retry-After waits at least one minute then backs off', async () => {
  const f = fixture([Response.json({ message: 'You have exceeded a secondary rate limit.' }, { status: 403 }), new Response('', { status: 429 }), ok()])
  await f.api('/repos/test/repo')
  assert.deepEqual(f.waits, [60_000, 120_000])
})
test('a wait outside deadline stops the whole client without early retry', async () => {
  const f = fixture([new Response('', { status: 429, headers: { 'retry-after': '120' } })], { deadline: 1_060_000 })
  await assert.rejects(f.api('/repos/test/one'), /github-deadline/)
  await assert.rejects(f.api('/repos/test/two'), /github-deadline/)
  assert.equal(f.calls(), 1); assert.deepEqual(f.waits, [])
})
test('an already expired deadline never starts a network request', async () => {
  const f = fixture([], { deadline: 1_000_000 })
  await assert.rejects(f.api('/repos/test/repo'), /github-deadline/)
  assert.equal(f.calls(), 0)
})
test('final rate limit halts subsequent resources, instead of hammering every repo', async () => {
  const f = fixture(Array.from({ length: 3 }, () => new Response('', { status: 429 })))
  await assert.rejects(f.api('/search/repositories?q=test'), /github-rate-limited/)
  await assert.rejects(f.api('/repos/test/one'), /github-rate-limited/)
  assert.equal(f.calls(), 3); assert.deepEqual(f.waits, [60_000, 120_000])
})
test('optional local request budget counts attempts, not just successful calls', async () => {
  const f = fixture([new Response('', { status: 503 }), ok()], { maxRequests: 1 })
  await assert.rejects(f.api('/repos/test/repo'), /github-request-budget/)
  assert.equal(f.calls(), 1)
})
test('5xx and network errors use bounded short retry without exposing upstream text', async () => {
  const f = fixture([new Error('private token'), new Response('private token', { status: 503 }), ok()])
  assert.deepEqual(await f.api('/repos/test/repo'), { ok: true })
  assert.deepEqual(f.waits, [2000, 4000])
})

test('resource exhaustion does not block a different resource bucket', async () => {
  const f = fixture([Response.json({}, { headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1120', 'x-ratelimit-resource': 'core' } }), ok()])
  await f.api('/repos/test/one'); await f.api('/search/repositories?q=test')
  assert.deepEqual(f.waits, [])
})
test('response parsing that finishes outside deadline cannot become a successful result', async () => {
  let time = 0
  const api = createGitHubClient('test-only', { now: () => time, deadline: 100,
    fetchImpl: async () => { time = 100; return ok() } })
  await assert.rejects(api('/repos/test/repo'), /github-deadline/)
})

// --- GraphQL 仍是只读请求，不能放宽共享客户端为任意写接口 ---
test('GraphQL query uses JSON POST while REST stays GET', async () => {
  const requests: RequestInit[] = []
  const api = createGitHubClient('test', { fetchImpl: async (_url, init) => { requests.push(init!); return ok() } })
  await api('/graphql', { query: 'query Metadata { rateLimit { cost } }' })
  await api('/repos/test/repo')
  assert.equal(requests[0].method, 'POST')
  assert.deepEqual(JSON.parse(requests[0].body as string), { query: 'query Metadata { rateLimit { cost } }' })
  assert.equal(requests[1].body, undefined)
})
test('query body cannot enable mutations or non-GraphQL writes', async () => {
  let calls = 0
  const api = createGitHubClient('test', { fetchImpl: async () => { calls++; return ok() } })
  for (const [path, query] of [['/repos/test/repo', 'query X { viewer { login } }'], ['/graphql', 'mutation X { deleteRepository(input:{repositoryId:"x"}) { clientMutationId } }'], ['/graphql', 'query X { viewer { login } } mutation Y { x }']]) {
    await assert.rejects(api(path, { query }), /github-invalid-query/)
  }
  assert.equal(calls, 0)
})
test('HTTP 200 GraphQL RATE_LIMITED is not success and obeys primary reset', async () => {
  const f = fixture([Response.json({ errors: [{ type: 'RATE_LIMITED', message: 'API rate limit exceeded' }] }, { headers: { 'x-ratelimit-resource': 'graphql', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1120' } }), ok()])
  await f.api('/graphql', { query: 'query X { rateLimit { cost } }' })
  assert.deepEqual(f.waits, [120000])
})
test('GraphQL exhausted resource does not consume REST primary window', async () => {
  const f = fixture([Response.json({ data: {} }, { headers: { 'x-ratelimit-resource': 'graphql', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1120' } }), ok()])
  await f.api('/graphql', { query: 'query X { rateLimit { cost } }' })
  await f.api('/repos/test/repo')
  assert.deepEqual(f.waits, [])
})
test('GraphQL HTTP 200 limit beyond deadline halts every resource', async () => {
  const f = fixture([Response.json({ errors: [{ type: 'RATE_LIMITED' }] }, { headers: { 'retry-after': '120' } })], { deadline: 1050000 })
  await assert.rejects(f.api('/graphql', { query: 'query X { rateLimit { cost } }' }), /github-deadline/)
  await assert.rejects(f.api('/repos/test/repo'), /github-deadline/)
  assert.equal(f.calls(), 1)
})

// --- 已发生的远端写入不能因响应丢失自动重发 ---
test('explicit writer preserves method/body and accepts dispatch 204 without JSON', async () => {
  let request: RequestInit | undefined
  const write = createGitHubWriter('test-only', async (_url, init) => {
    request = init
    return new Response(null, { status: 204 })
  })
  assert.equal(await write('/repos/test/repo/actions/workflows/radar.yml/dispatches', 'POST', { ref: 'main' }), null)
  assert.equal(request?.method, 'POST')
  assert.equal(request?.redirect, 'error')
  assert.deepEqual(JSON.parse(String(request?.body)), { ref: 'main' })
})
test('writer never retries network errors, invalid success or HTTP failures', async () => {
  for (const result of [new Error('lost'), new Response('not-json'), new Response('', { status: 503 })]) {
    let calls = 0
    const write = createGitHubWriter('test-only', async () => { calls++; if (result instanceof Error) throw result; return result })
    await assert.rejects(write('/repos/test/repo/pulls', 'POST', {}), /github-write-(outcome-unknown|http-503)/)
    assert.equal(calls, 1)
  }
})
test('writer refuses absolute URLs, traversal and query paths without sending credentials', async () => {
  let calls = 0
  const write = createGitHubWriter('test-only', async () => { calls++; return ok() })
  for (const path of ['https://example.com/repos/test/repo', '//example.com', '/repos/test/repo/../pulls', '/repos/test/repo/pulls?x=1']) {
    await assert.rejects(write(path, 'POST', {}), /github-invalid-write/)
  }
  assert.equal(calls, 0)
  assert.throws(() => createGitHubWriter(''), /github-missing-token/)
})

// --- 独立资源与阶段截止不能重置共享客户端的保护 ---
test('exhausted search primary beyond deadline does not halt available core', async () => {
  const f = fixture([Response.json({}, { status: 403, headers: { 'x-ratelimit-resource': 'search', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1120' } }), ok()], { deadline: 1_060_000 })
  await assert.rejects(f.api('/search/repositories?q=x'), /github-/)
  assert.deepEqual(await f.api('/repos/test/repo'), { ok: true })
  assert.equal(f.calls(), 2)
})
test('exhausted GraphQL primary beyond deadline leaves REST available', async () => {
  const f = fixture([Response.json({ errors: [{ type: 'RATE_LIMITED' }] }, { headers: { 'x-ratelimit-resource': 'graphql', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1120' } }), ok()], { deadline: 1_060_000 })
  await assert.rejects(f.api('/graphql', { query: 'query { viewer { login } }' }), /github-/)
  assert.deepEqual(await f.api('/repos/test/repo'), { ok: true })
})
test('phase deadline shares quota and still leaves time for evidence reads', async () => {
  const f = fixture([ok(), ok()], { deadline: 1_300_000 })
  await assert.rejects(f.api('/search/repositories?q=x', undefined, { deadline: 1_000_000 }), /github-phase-deadline/)
  assert.deepEqual(await f.api('/repos/test/repo'), { ok: true })
  assert.equal(f.calls(), 1)
})
test('secondary wait crossing phase window cannot be bypassed by switching resources', async () => {
  const f = fixture([new Response('', { status: 429, headers: { 'retry-after': '120' } }), ok()], { deadline: 1_300_000 })
  await assert.rejects(f.api('/search/repositories?q=x', undefined, { deadline: 1_060_000 }), /github-phase-deadline/)
  await f.api('/repos/test/repo')
  assert.deepEqual(f.waits, [120000])
  assert.equal(f.calls(), 2)
})
test('invalid authentication stops subsequent reads without another request', async () => {
  const f = fixture([new Response('', { status: 401 }), ok()])
  await assert.rejects(f.api('/search/repositories?q=x'), /github-http-401/)
  await assert.rejects(f.api('/repos/test/repo'), /github-http-401/)
  assert.equal(f.calls(), 1)
})
for (const scope of ['phase', 'run'] as const) for (const cancellation of ['success', 'abort'] as const) {
  test(`known 401 at ${scope} deadline retains global halt when body cancellation is ${cancellation}`, async () => {
    let time = 1_000_000, calls = 0, cancelled = 0
    const api = createGitHubClient('test-only', { now: () => time, deadline: 1_300_000,
      fetchImpl: async () => {
        if (++calls > 1) return ok()
        time = scope === 'phase' ? 1_060_000 : 1_300_000
        return new Response(new ReadableStream({ cancel() {
          cancelled++
          if (cancellation === 'abort') throw new DOMException('private upstream response', 'AbortError')
        } }), { status: 401 })
      } })
    await assert.rejects(api('/search/repositories?q=x', undefined, { deadline: 1_060_000 }), { message: 'github-http-401' })
    await assert.rejects(api('/repos/test/repo'), { message: 'github-http-401' })
    assert.equal(calls, 1); assert.equal(cancelled, 1)
  })
}

// --- 响应体读取也受阶段期限约束，错误正文不进入公开错误 ---
for (const scope of ['phase', 'run'] as const) test(`body abort at ${scope} deadline preserves its failure scope`, async () => {
  let time = 1_000_000, calls = 0
  const response = ok()
  response.json = async () => {
    time = scope === 'phase' ? 1_060_000 : 1_300_000
    throw new DOMException('private upstream response', 'AbortError')
  }
  const api = createGitHubClient('test-only', { now: () => time, deadline: 1_300_000,
    fetchImpl: async () => ++calls === 1 ? response : ok() })
  const reason = scope === 'phase' ? 'github-phase-deadline' : 'github-deadline'
  await assert.rejects(api('/search/repositories?q=x', undefined, { deadline: 1_060_000 }), { message: reason })
  if (scope === 'phase') {
    assert.deepEqual(await api('/repos/test/repo'), { ok: true })
    assert.equal(calls, 2)
  } else {
    await assert.rejects(api('/repos/test/repo'), { message: reason })
    assert.equal(calls, 1)
  }
})
test('malformed success JSON before deadline remains a sanitized response error', async () => {
  const f = fixture([new Response('private upstream response')])
  await assert.rejects(f.api('/repos/test/repo'), { message: 'github-invalid-response' })
  assert.equal(f.calls(), 1)
})
for (const scope of ['phase', 'run'] as const) test(`malformed success JSON at ${scope} deadline is not downgraded to a timeout`, async () => {
  let time = 1_000_000, calls = 0
  const api = createGitHubClient('test-only', { now: () => time, deadline: 1_300_000,
    fetchImpl: async () => {
      calls++
      time = scope === 'phase' ? 1_060_000 : 1_300_000
      return new Response('private malformed upstream response')
    } })
  await assert.rejects(api('/search/repositories?q=x', undefined, { deadline: 1_060_000 }), { message: 'github-invalid-response' })
  assert.equal(calls, 1)
})
test('error-body abort at phase deadline is not swallowed as an ordinary permission failure', async () => {
  let time = 1_000_000, calls = 0
  const api = createGitHubClient('test-only', { now: () => time, deadline: 1_300_000,
    fetchImpl: async () => {
      if (++calls > 1) return ok()
      time = 1_060_000
      return new Response(new ReadableStream({ start(controller) { controller.error(new DOMException('private upstream response', 'AbortError')) } }), { status: 403 })
    } })
  await assert.rejects(api('/search/repositories?q=x', undefined, { deadline: 1_060_000 }), { message: 'github-phase-deadline' })
  assert.deepEqual(await api('/repos/test/repo'), { ok: true })
  assert.equal(calls, 2)
})

// --- 状态码不能代替限流原因；明确 secondary 优先于同时耗尽的 primary ---
test('primary 429 without Retry-After is resource-scoped', async () => {
  const headers: Record<string, string> = { 'x-ratelimit-resource': 'search', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1120' }
  const f = fixture([Response.json({ message: 'API rate limit exceeded. private upstream response' }, { status: 429, headers }), ok()], { deadline: 1_060_000 })
  await assert.rejects(f.api('/search/repositories?q=x'), { message: 'github-resource-deferred' })
  assert.deepEqual(await f.api('/repos/test/repo'), { ok: true })
  await assert.rejects(f.api('/search/repositories?q=y'), { message: 'github-resource-deferred' })
  assert.equal(f.calls(), 2); assert.deepEqual(f.waits, [])
})
test('unread limit body cannot hide a secondary pause behind exhausted primary headers', async () => {
  let time = 1_000_000, calls = 0
  const waits: number[] = []
  const api = createGitHubClient('test-only', { now: () => time, deadline: 1_300_000,
    wait: async ms => { waits.push(ms); time += ms },
    fetchImpl: async () => {
      if (++calls > 1) return ok()
      const response = new Response('', { status: 403,
        headers: { 'x-ratelimit-resource': 'search', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1120' } })
      response.json = async () => { time = 1_060_000; throw new DOMException('private upstream response', 'AbortError') }
      return response
    } })
  await assert.rejects(api('/search/repositories?q=x', undefined, { deadline: 1_060_000 }), { message: 'github-phase-deadline' })
  assert.deepEqual(await api('/repos/test/repo'), { ok: true })
  assert.deepEqual(waits, [60_000]); assert.equal(calls, 2)
})
test('Retry-After remains global even when a generic limit message also reports primary exhaustion', async () => {
  const f = fixture([Response.json({ message: 'API rate limit exceeded.' }, {
    status: 429, headers: { 'retry-after': '30', 'x-ratelimit-resource': 'search', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1120' },
  }), ok()], { deadline: 1_300_000 })
  await assert.rejects(f.api('/search/repositories?q=x', undefined, { deadline: 1_060_000 }), { message: 'github-phase-deadline' })
  assert.deepEqual(await f.api('/repos/test/repo'), { ok: true })
  assert.deepEqual(f.waits, [120_000]); assert.equal(f.calls(), 2)
})
for (const status of [403, 429]) for (const body of ['malformed', 'aborted'] as const) {
  test(`Retry-After with exhausted primary and ${body} ${status} body cannot release another resource early`, async () => {
    let time = 1_000_000, calls = 0
    const waits: number[] = []
    const api = createGitHubClient('test-only', { now: () => time, deadline: 1_300_000,
      wait: async ms => { waits.push(ms); time += ms },
      fetchImpl: async () => {
        if (++calls > 1) return ok()
        const response = new Response('private malformed body', { status,
          headers: { 'retry-after': '120', 'x-ratelimit-resource': 'search', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1120' } })
        if (body === 'aborted') response.json = async () => { time = 1_060_000; throw new DOMException('private upstream response', 'AbortError') }
        return response
      } })
    await assert.rejects(api('/search/repositories?q=x', undefined, { deadline: 1_060_000 }), { message: 'github-phase-deadline' })
    assert.deepEqual(await api('/repos/test/repo'), { ok: true })
    assert.deepEqual(waits, [120_000]); assert.equal(calls, 2)
  })
}
test('explicit secondary 403 with zero primary remaining pauses every resource until reset', async () => {
  const f = fixture([Response.json({ message: 'You have exceeded a secondary rate limit. private upstream response' }, {
    status: 403, headers: { 'x-ratelimit-resource': 'search', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1120' },
  }), ok()], { deadline: 1_300_000 })
  await assert.rejects(f.api('/search/repositories?q=x', undefined, { deadline: 1_060_000 }), { message: 'github-phase-deadline' })
  assert.deepEqual(await f.api('/repos/test/repo'), { ok: true })
  assert.deepEqual(f.waits, [120_000]); assert.equal(f.calls(), 2)
})
test('explicit secondary GraphQL response cannot masquerade as exhausted primary quota', async () => {
  const f = fixture([Response.json({ errors: [{ type: 'RATE_LIMITED', message: 'You have exceeded a secondary rate limit.' }] }, {
    headers: { 'x-ratelimit-resource': 'graphql', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1120' },
  })], { deadline: 1_060_000 })
  await assert.rejects(f.api('/graphql', { query: 'query X { viewer { login } }' }), { message: 'github-deadline' })
  await assert.rejects(f.api('/repos/test/repo'), { message: 'github-deadline' })
  assert.equal(f.calls(), 1); assert.deepEqual(f.waits, [])
})
test('secondary headers survive an error-body abort at the phase boundary', async () => {
  let time = 1_000_000, calls = 0
  const waits: number[] = []
  const api = createGitHubClient('test-only', { now: () => time, deadline: 1_300_000,
    wait: async ms => { waits.push(ms); time += ms },
    fetchImpl: async () => {
      if (++calls > 1) return ok()
      const response = new Response('', { status: 429, headers: { 'retry-after': '120' } })
      response.json = async () => { time = 1_060_000; throw new DOMException('private upstream response', 'AbortError') }
      return response
    } })
  await assert.rejects(api('/search/repositories?q=x', undefined, { deadline: 1_060_000 }), { message: 'github-phase-deadline' })
  assert.deepEqual(await api('/repos/test/repo'), { ok: true })
  assert.ok(waits.reduce((sum, ms) => sum + ms, 0) >= 60_000)
  assert.equal(calls, 2)
})
test('secondary GraphQL body completed at phase expiry still retains its global pause', async () => {
  let time = 1_000_000, calls = 0
  const waits: number[] = []
  const api = createGitHubClient('test-only', { now: () => time, deadline: 1_300_000,
    wait: async ms => { waits.push(ms); time += ms },
    fetchImpl: async () => {
      if (++calls > 1) return ok()
      const response = ok()
      response.json = async () => { time = 1_060_000; return { errors: [{ type: 'RATE_LIMITED', message: 'You have exceeded a secondary rate limit.' }] } }
      return response
    } })
  await assert.rejects(api('/graphql', { query: 'query X { viewer { login } }' }, { deadline: 1_060_000 }), { message: 'github-phase-deadline' })
  assert.deepEqual(await api('/repos/test/repo'), { ok: true })
  assert.deepEqual(waits, [60_000]); assert.equal(calls, 2)
})
