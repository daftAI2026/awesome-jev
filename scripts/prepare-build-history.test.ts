import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareBuildHistory, type GitExecutor } from './prepare-build-history.ts'

test('does not fetch when the repository is not shallow', () => {
  const calls: string[][] = []
  const exec: GitExecutor = (args, cwd) => {
    calls.push([cwd, ...args])
    return 'false\n'
  }

  assert.deepEqual(prepareBuildHistory({ cwd: '/offline/repository', exec }), { shallow: false, fetched: false })
  assert.deepEqual(calls, [['/offline/repository', 'rev-parse', '--is-shallow-repository']])
})

test('fetches only the missing commit history for a shallow repository', () => {
  const calls: string[][] = []
  const exec: GitExecutor = (args, cwd) => {
    calls.push([cwd, ...args])
    return args[0] === 'rev-parse' ? 'true\n' : 'fetch completed\n'
  }

  assert.deepEqual(prepareBuildHistory({ cwd: '/offline/repository', exec }), { shallow: true, fetched: true })
  assert.deepEqual(calls, [
    ['/offline/repository', 'rev-parse', '--is-shallow-repository'],
    ['/offline/repository', 'fetch', '--unshallow', '--filter=blob:none', 'origin'],
  ])
})

test('fails closed when git is missing or cwd is not a repository', () => {
  const exec: GitExecutor = () => { throw new Error('git: not found') }
  assert.throws(
    () => prepareBuildHistory({ cwd: '/offline/not-a-repository', exec }),
    /git is unavailable or cwd is not a repository.*data timestamp would be unsafe/,
  )
})

test('fails closed when history fetch cannot complete', () => {
  const exec: GitExecutor = (args) => {
    if (args[0] === 'rev-parse') return 'true'
    throw new Error('remote unavailable')
  }
  assert.throws(
    () => prepareBuildHistory({ cwd: '/offline/repository', exec }),
    /unable to complete git fetch --unshallow --filter=blob:none origin.*data timestamp would be unsafe/,
  )
})

test('rejects an unexpected shallow-repository status without fetching', () => {
  let fetchCalled = false
  const exec: GitExecutor = (args) => {
    if (args[0] === 'fetch') fetchCalled = true
    return 'indeterminate'
  }
  assert.throws(
    () => prepareBuildHistory({ cwd: '/offline/repository', exec }),
    /invalid shallow-repository status.*data timestamp would be unsafe/,
  )
  assert.equal(fetchCalled, false)
})
