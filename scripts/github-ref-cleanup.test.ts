/**
 * [INPUT]: 依赖专用分支 CAS 删除能力与注入的离线 HTTP 响应
 * [OUTPUT]: 验证 expected SHA 原子删除、固定 mutation、错误不重试和主分支拒绝
 * [POS]: scripts 的破坏性网络能力验收；共享只读客户端继续禁止 mutation
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createBranchDeleter } from './github-ref-cleanup.ts'

const input = { repositoryId: 'R_current', ref: 'refs/heads/submission-branch', beforeOid: 'a'.repeat(40) }
test('dedicated writer only emits one fixed non-forced expected-SHA ref deletion', async () => {
  let calls = 0
  const remove = createBranchDeleter('test-only', async (url, init) => {
    calls++; assert.equal(url, 'https://api.github.com/graphql'); assert.equal(init?.redirect, 'error')
    const body = JSON.parse(String(init!.body))
    assert.match(body.query, /^mutation DeleteSubmissionBranch/)
    assert.deepEqual(body.variables.input, { repositoryId: input.repositoryId,
      refUpdates: [{ name: input.ref, beforeOid: input.beforeOid, afterOid: '0'.repeat(40), force: false }] })
    return Response.json({ data: { updateRefs: { clientMutationId: null } } })
  })
  await remove(input); assert.equal(calls, 1)
})
test('network/GraphQL/HTTP failure never repeats a potentially completed deletion or reveals server text', async () => {
  for (const response of [new Error('secret'), Response.json({ errors: [{ message: 'secret' }] }),
    new Response('secret', { status: 503 }), Response.json({ data: {} })]) {
    let calls = 0
    const remove = createBranchDeleter('test-only', async () => { calls++; if (response instanceof Error) throw response; return response })
    await assert.rejects(remove(input), /^Error: github-(write|ref)-[a-z0-9-]+$/)
    assert.equal(calls, 1)
  }
})
test('invalid ref, main and unpinned OID are rejected before any request', async () => {
  let calls = 0
  const remove = createBranchDeleter('test-only', async () => { calls++; return Response.json({}) })
  for (const change of [{ ref: 'refs/heads/main' }, { ref: 'refs/tags/test' }, { ref: 'refs/heads/../main' },
    { ref: 'refs/heads/test?token' }, { ref: 'refs/heads/test.lock' }, { beforeOid: 'main' },
    { beforeOid: '0'.repeat(40) }, { repositoryId: '' }]) {
    await assert.rejects(remove({ ...input, ...change }), /github-invalid-ref-delete/)
  }
  assert.equal(calls, 0)
})
