import assert from 'node:assert/strict'
import test from 'node:test'
import type { DirectoryItem } from '../src/lib/types.ts'
import {
  findGitHubProject,
  parseGitHubRepositoryUrl,
  projectPath,
  projectPathFromUrl,
} from '../src/lib/project-routes.ts'

const project = (url: string, id = 'project'): DirectoryItem => ({
  id,
  type: 'github',
  title: id,
  summary: 'A useful project',
  url,
  sourceMeta: {},
})

test('normalizes valid GitHub repository URLs into lower-case stable routes', () => {
  assert.equal(projectPathFromUrl('https://github.com/TypeSafeAI/Jev-SDK'), '/projects/typesafeai/jev-sdk')
  assert.equal(projectPathFromUrl('https://github.com/TypeSafeAI/Jev-SDK/'), '/projects/typesafeai/jev-sdk')
  assert.equal(projectPathFromUrl('https://github.com/TypeSafeAI/Jev-SDK.git'), '/projects/typesafeai/jev-sdk')
})

test('rejects URLs which are not a safe canonical GitHub repository', () => {
  for (const value of [
    'http://github.com/owner/repo',
    'https://evil.example/owner/repo',
    'https://github.com.evil.example/owner/repo',
    'https://user:pass@github.com/owner/repo',
    'https://github.com/owner/repo?tab=readme',
    'https://github.com:444/owner/repo',
    'https://github.com/owner/repo#readme',
    'https://github.com/owner/repo/issues',
    'https://github.com/owner/../repo',
    'https://github.com/owner/%2e%2e',
    'https://github.com/owner%2frepo/name',
    'https://github.com/owner/repo%5cname',
    'https://github.com/../owner/repo',
    'https://github.com/owner/..',
  ]) assert.equal(projectPathFromUrl(value), null, value)
})

test('validates route params instead of accepting traversal or encoded separators', () => {
  assert.equal(projectPath('Owner', 'Repo.Name_1'), '/projects/owner/repo.name_1')
  for (const [owner, repo] of [
    ['../owner', 'repo'],
    ['owner/repo', 'name'],
    ['owner', '..'],
    ['owner', '%2fetc'],
    ['owner', 'repo\\name'],
    ['', 'repo'],
  ]) assert.equal(projectPath(owner, repo), null)
})

test('repository lookup is case-insensitive and distinguishes identical names by owner', () => {
  const first = project('https://github.com/FirstOwner/Shared')
  const second = project('https://github.com/SecondOwner/Shared', 'second')
  assert.equal(findGitHubProject([first, second], 'firstowner', 'shared'), first)
  assert.equal(findGitHubProject([first, second], 'SECONDOWNER', 'SHARED'), second)
  assert.equal(findGitHubProject([first, second], 'thirdowner', 'shared'), undefined)
})

test('ambiguous duplicate canonical repository records fail closed', () => {
  assert.equal(findGitHubProject([
    project('https://github.com/Owner/Repo', 'one'),
    project('https://github.com/owner/repo', 'two'),
  ], 'owner', 'repo'), undefined)
})

test('parser exposes normalized lookup key while preserving source spelling', () => {
  assert.deepEqual(parseGitHubRepositoryUrl('https://github.com/TypeSafeAI/Jev-SDK'), {
    owner: 'TypeSafeAI',
    repo: 'Jev-SDK',
    key: 'typesafeai/jev-sdk',
  })
})
