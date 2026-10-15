/**
 * [INPUT]: 依赖规范目录校验、README 渲染与三方发布合并
 * [OUTPUT]: 验证迁址、可逆下架、新审核时效与分类、身份三方冲突
 * [POS]: 生命周期写权限的离线边界测试，不读取真实仓库或调用模型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { renderReadme, validateRows } from './catalog.ts'
import { mergePublishedCatalog } from './publication-merge.ts'
import type { DirectoryItem } from './model-types.ts'

const at = '2026-10-16T00:00:00.000Z'
const row = (id = 1, name = 'old'): DirectoryItem => ({ id: `local-${id}`, type: 'github', title: name,
  summary: '人工说明', category: 'developer', url: `https://github.com/owner/${name}`,
  sourceMeta: { repo: `owner/${name}`, author: 'owner', stars: 5, githubIdentity: { databaseId: id, nodeId: `node-${id}` },
    jevAbout: .99, jevKeep: 'keep', jevKeepConfidence: .99 } })
const readme = '<!-- PROJECT_COUNT:START -->\n<!-- PROJECT_COUNT:END -->\n<!-- PROJECTS:START -->\n<!-- PROJECTS:END -->'
const rename = (before: DirectoryItem): DirectoryItem => ({ ...structuredClone(before), title: 'new', url: 'https://github.com/next/new',
  sourceMeta: { ...structuredClone(before.sourceMeta), repo: 'next/new', author: 'next', previousUrls: [before.url] } })

test('README excludes every retired state while preserving canonical records', () => {
  for (const state of ['unavailable', 'review', 'replaced'] as const) {
    const old = row(); old.sourceMeta.lifecycle = { state, since: at, ...(state === 'unavailable' ? {} : { reason: 'identity-changed' as const, target: {url: old.url, databaseId: 3, nodeId: 'node-3'} }) }
    const output = renderReadme(readme, [old, row(2, 'visible')])
    assert.match(output, /projects-1-/)
    assert.ok(!output.includes(old.url)); assert.ok(output.includes('owner/visible'))
    assert.equal(old.id, 'local-1')
  }
})

test('hidden historical objects may share one URL with a reviewed replacement, never two public objects', () => {
  const old = row(), fresh = row(2)
  old.sourceMeta.lifecycle = { state: 'replaced', since: at, reason: 'identity-changed',
    target: { url: fresh.url, ...fresh.sourceMeta.githubIdentity! } }
  assert.doesNotThrow(() => validateRows([old, fresh]))
  delete old.sourceMeta.lifecycle
  assert.throws(() => validateRows([old, fresh]), /Duplicate repository/)
})

test('metadata can migrate one unchanged GitHub object without replacing its local identity', () => {
  const old = row(), next = rename(old)
  assert.deepEqual(mergePublishedCatalog([old], [next], [old], 'metadata'), [next])
  assert.throws(() => mergePublishedCatalog([old], [next], [old], 'alternatives'), /editorial|migration/i)
  next.sourceMeta.githubIdentity = { databaseId: 9, nodeId: 'different' }
  assert.throws(() => mergePublishedCatalog([old], [next], [old], 'metadata'), /identity/i)
})

test('metadata migration preserves concurrent manual text and refuses conflicting address history', () => {
  const old = row(), next = rename(old), latest = structuredClone(old)
  latest.summary = '另一位维护者的新说明'; latest.title = '维护者命名'
  const result = mergePublishedCatalog([old], [next], [latest], 'metadata')
  assert.equal(result[0].summary, latest.summary); assert.equal(result[0].title, latest.title)
  assert.equal(result[0].url, next.url)
  latest.sourceMeta.previousUrls = ['https://github.com/owner/earlier']
  assert.throws(() => mergePublishedCatalog([old], [next], [latest], 'metadata'), /conflict/i)
})

test('only metadata may hide an available object for sustained unavailability', () => {
  const old = row(), hidden = structuredClone(old)
  hidden.sourceMeta.lifecycle = { state: 'unavailable', since: at }
  assert.deepEqual(mergePublishedCatalog([old], [hidden], [old], 'metadata'), [hidden])
  assert.throws(() => mergePublishedCatalog([old], [hidden], [old], 'radar'), /editorial|lifecycle/i)
  assert.throws(() => mergePublishedCatalog([old], [hidden], [old], 'alternatives'), /editorial|lifecycle/i)
  assert.throws(() => mergePublishedCatalog([old], [], [old], 'metadata'), /deletion/i)
})

test('stale metadata recovery cannot overwrite a newer quarantine or revive a withdrawn record', () => {
  const old = row(); old.sourceMeta.lifecycle = { state: 'unavailable', since: at }
  const recovered = structuredClone(old); delete recovered.sourceMeta.lifecycle
  const latest = structuredClone(old)
  latest.sourceMeta.lifecycle = { state: 'review', since: at, reason: 'identity-changed', target: {url: old.url, databaseId: 2, nodeId:'node-2'} }
  assert.throws(() => mergePublishedCatalog([old], [recovered], [latest], 'metadata'), /conflict/i)
  assert.deepEqual(mergePublishedCatalog([old], [recovered], [], 'metadata'), [])
})

test('malformed lifecycle values fail closed instead of accidentally exposing a record', () => {
  for (const lifecycle of [{ state:'active',since:at }, {state:'unavailable',since:'yesterday'},
    {state:'review',since:at}, {state:'review',since:at,reason:'identity-changed',target:{url:'https://evil.test/a/b',databaseId:2,nodeId:'n'}}]) {
    const old = row(); Object.assign(old.sourceMeta, { lifecycle })
    assert.throws(() => validateRows([old]), /lifecycle/i)
  }
})

function receipt(item: DirectoryItem): void {
  const sha = 'a'.repeat(40)
  item.sourceMeta.jevEvidence = { repo: item.sourceMeta.repo, status: 'keep', sha, checkedAt: at,
    evidenceUrl: `${item.url}/blob/${sha}/README.md`,
    score: { jevAbout: .99, jevKeep: 'keep', jevKeepConfidence: .99, category: item.category } }
}
function replacement() {
  const old = row(), fresh = row(2)
  fresh.id = 'gh-repo-2'; receipt(fresh)
  old.sourceMeta.lifecycle = { state: 'review', since: at, reason: 'identity-changed', target: {url: fresh.url, ...fresh.sourceMeta.githubIdentity!} }
  const retired = structuredClone(old); retired.sourceMeta.lifecycle!.state = 'replaced'
  return {old, fresh, retired}
}
test('different ID replacement requires a new keep receipt and never inherits local identity', () => {
  const {old, fresh, retired} = replacement()
  assert.deepEqual(mergePublishedCatalog([old], [retired, fresh], [old], 'radar'), [retired, fresh])
  for (const mode of ['metadata', 'alternatives'] as const) assert.throws(() => mergePublishedCatalog([old], [retired, fresh], [old], mode))
  delete fresh.sourceMeta.jevEvidence
  assert.throws(() => mergePublishedCatalog([old], [retired, fresh], [old]), /unreviewed-replacement/)
})
test('replacement cannot survive a concurrently withdrawn source or steal another public address', () => {
  const {old, fresh, retired} = replacement()
  assert.throws(() => mergePublishedCatalog([old], [retired, fresh], []), /withdrawn/)
  const conflict = row(3)
  assert.throws(() => mergePublishedCatalog([old], [retired, fresh], [old, conflict]), /replacement-conflict/)
})
test('ordinary addition cannot use a hidden old URL without its bound replacement approval', () => {
  const {old, fresh} = replacement()
  assert.throws(() => mergePublishedCatalog([old], [old, fresh], [old]), /replacement/)
})
test('same ID re-review clears quarantine only with its own fresh pinned approval', () => {
  const old = row(), next = rename(old)
  old.sourceMeta.lifecycle = { state: 'review', since: at, reason: 'migration-evidence', target: {url: next.url, ...old.sourceMeta.githubIdentity!} }
  receipt(next)
  assert.deepEqual(mergePublishedCatalog([old], [next], [old]), [next])
  assert.throws(() => mergePublishedCatalog([old], [next], [old], 'metadata'), /transition/)
  const evidence = next.sourceMeta.jevEvidence as {evidenceUrl:string}
  evidence.evidenceUrl = evidence.evidenceUrl.replace('a'.repeat(40), 'b'.repeat(40))
  assert.throws(() => mergePublishedCatalog([old], [next], [old]), /unreviewed/)
})
test('metadata cannot use publication to add a new identity', () => {
  assert.throws(() => mergePublishedCatalog([row()], [row(), row(2,'new')], [row()], 'metadata'), /membership/)
})

for (const kind of ['same-ID', 'replacement'] as const) test(`${kind} approval predating its review request cannot clear quarantine`, () => {
  const { old, fresh, retired } = replacement()
  if (kind === 'replacement') {
    ;(fresh.sourceMeta.jevEvidence as { checkedAt: string }).checkedAt = '2026-10-15T23:59:59.999Z'
    assert.throws(() => mergePublishedCatalog([old], [retired, fresh], [old]), /unreviewed/)
  } else {
    old.sourceMeta.lifecycle = { state: 'review', since: at, reason: 'migration-evidence', target: { url: old.url, ...old.sourceMeta.githubIdentity! } }
    receipt(old)
    ;(old.sourceMeta.jevEvidence as { checkedAt: string }).checkedAt = '2026-10-15T23:59:59.999Z'
    const restored = structuredClone(old); delete restored.sourceMeta.lifecycle
    assert.throws(() => mergePublishedCatalog([old], [restored], [old]), /unreviewed/)
  }
})

for (const mode of ['radar', 'metadata'] as const) test(`${mode} structural changes cannot attach to a concurrently replaced numeric identity`, () => {
  const old = row(), next = rename(old)
  if (mode === 'radar') {
    old.sourceMeta.lifecycle = { state: 'review', since: at, reason: 'migration-evidence', target: { url: next.url, ...old.sourceMeta.githubIdentity! } }
    receipt(next)
  }
  const latest = structuredClone(old)
  latest.sourceMeta.githubIdentity = { databaseId: 3, nodeId: 'node-3' }
  assert.throws(() => mergePublishedCatalog([old], [next], [latest], mode), /conflict/)
  latest.sourceMeta.githubIdentity = { ...old.sourceMeta.githubIdentity!, nodeId: 'rotated-opaque-node' }
  const merged = mergePublishedCatalog([old], [next], [latest], mode)
  assert.equal(merged[0].sourceMeta.githubIdentity?.nodeId, 'rotated-opaque-node')
})

test('alternative replacement cannot use ordinary admission even with a matching ordinary score', () => {
  const { old, fresh, retired } = replacement()
  old.category = retired.category = 'alternatives'
  assert.throws(() => mergePublishedCatalog([old], [retired, fresh], [old]), /unreviewed-replacement/)
  fresh.category = 'alternatives'; receipt(fresh)
  assert.deepEqual(mergePublishedCatalog([old], [retired, fresh], [old]), [retired, fresh])
})

for (const kind of ['same-ID', 'replacement'] as const) test(`${kind} approval category must match the published category`, () => {
  const { old, fresh, retired } = replacement()
  if (kind === 'replacement') {
    ;(fresh.sourceMeta.jevEvidence as { score: { category: string } }).score.category = 'sdk'
    assert.throws(() => mergePublishedCatalog([old], [retired, fresh], [old]), /unreviewed/)
  } else {
    const next = rename(old)
    delete next.sourceMeta.lifecycle
    old.sourceMeta.lifecycle = { state: 'review', since: at, reason: 'migration-evidence', target: { url: next.url, ...old.sourceMeta.githubIdentity! } }
    receipt(next)
    ;(next.sourceMeta.jevEvidence as { score: { category: string } }).score.category = 'sdk'
    assert.throws(() => mergePublishedCatalog([old], [next], [old]), /unreviewed/)
    next.category = 'sdk'
    assert.throws(() => mergePublishedCatalog([old], [next], [old]), /editorial/)
  }
})

test('successive same-address replacements bind the current review without reviving retired generations', () => {
  const first = row(1), second = row(2), third = row(3)
  second.id = 'gh-repo-2'; third.id = 'gh-repo-3'; receipt(second); receipt(third)
  first.sourceMeta.lifecycle = { state: 'replaced', since: at, reason: 'identity-changed', target: {url: second.url, ...second.sourceMeta.githubIdentity!} }
  second.sourceMeta.lifecycle = { state: 'review', since: at, reason: 'identity-changed', target: {url: third.url, ...third.sourceMeta.githubIdentity!} }
  const retired = structuredClone(second); retired.sourceMeta.lifecycle!.state = 'replaced'
  assert.deepEqual(mergePublishedCatalog([first, second], [first, retired, third], [first, second]), [first, retired, third])
  assert.throws(() => mergePublishedCatalog([first, second], [first, second, third], [first, second]), /replacement/)
  assert.throws(() => mergePublishedCatalog([first], [first, third], [first]), /replacement/)
  third.sourceMeta.githubIdentity = {databaseId: 4, nodeId: 'node-4'}
  assert.throws(() => mergePublishedCatalog([first, second], [first, retired, third], [first, second]), /replacement/)
})

test('matching absent categories cannot count as a classified replacement approval', () => {
  const { old, fresh, retired } = replacement()
  delete fresh.category
  delete (fresh.sourceMeta.jevEvidence as { score: { category?: string } }).score.category
  assert.throws(() => mergePublishedCatalog([old], [retired, fresh], [old]), /unreviewed/)
})

for (const field of ['inclusion', 'previousInclusion'] as const) test(`a new replacement identity cannot inherit ${field} from the previous object`, () => {
  const { old, fresh, retired } = replacement()
  const basis = { text: { en: 'Old basis', zh: '旧依据', ja: '旧根拠' }, reviewer: 'curator', checkedAt: at,
    evidence: [{ url: `${old.url}/blob/${'c'.repeat(40)}/README.md`, quote: 'Old TypeSafe Jev evidence' }] }
  old.sourceMeta.inclusion = structuredClone(basis); retired.sourceMeta.inclusion = structuredClone(basis)
  if (field === 'inclusion') fresh.sourceMeta.inclusion = basis
  else fresh.sourceMeta.previousInclusion = [basis]
  assert.throws(() => mergePublishedCatalog([old], [retired, fresh], [old]), /unreviewed-replacement/)
})

test('scalar refresh never applies readings to a concurrently replaced numeric identity', () => {
  const old = row(), incoming = structuredClone(old), current = structuredClone(old)
  incoming.sourceMeta.stars = 100
  current.sourceMeta.githubIdentity = { databaseId: 3, nodeId: 'node-3' }
  assert.deepEqual(mergePublishedCatalog([old], [incoming], [current], 'metadata'), [current])
})
