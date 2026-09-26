import test from 'node:test'
import assert from 'node:assert/strict'
import { isInclusionBasis, pinnedSource, type InclusionBasis } from '../src/lib/inclusion.ts'
import { parseReviewedInclusions, mergeReviewedInclusions, sourceReader, pendingInclusions,
  verifyChangedInclusions, readInclusionBaseline } from './inclusion.ts'
import { refreshRow, validateRows } from './catalog.ts'
import type { DirectoryItem } from './model-types.ts'

const sha = 'a'.repeat(40)
const url = `https://github.com/test/project/blob/${sha}/README.md`
const quote = 'The TypeSafe Jev adapter selects tools.'
const inclusion: InclusionBasis = {
  text: { en: 'Provides a Jev tool adapter.', zh: '提供 Jev 工具适配器', ja: 'Jev 用のツールアダプターを提供します。' },
  evidence: [{ url, quote }],
  checkedAt: '2026-09-26T00:00:00.000Z', reviewer: 'gpt-6-luna',
}
const row: DirectoryItem = {
  id: 'test', type: 'github', title: 'project', summary: 'Original upstream description.',
  category: 'sdk', tags: ['tools'], url: 'https://github.com/test/project',
  sourceMeta: { repo: 'test/project', stars: 12, forks: 3, jevAbout: 0.95, jevKeep: 'keep', jevKeepConfidence: 0.96 },
}

test('inclusion accepts only pinned evidence from the same project', () => {
  assert.ok(isInclusionBasis(inclusion, row.url))
  assert.equal(pinnedSource(url, row.url)?.rawUrl, `https://raw.githubusercontent.com/test/project/${sha}/README.md`)
  assert.ok(pinnedSource(`${url}#L1-L3`, row.url))
  for (const invalid of [url.replace(sha, 'main'), url.replace('/test/', '/another/'),
    url.replace('github.com', 'github.com.evil.test'), `${url}?token=secret`, `${url}#anything`,
    url.replace('/README.md', '/%2e%2e/x'), url.replace('/README.md', '/%2fetc'),
    url.replace('github.com/', 'user@github.com/')]) {
    assert.equal(pinnedSource(invalid, row.url), null, invalid)
  }
})

test('missing or malformed reasons stay unavailable instead of becoming score-derived claims', () => {
  for (const value of [undefined, null, {}, { ...inclusion, evidence: [] },
    { ...inclusion, text: { en: 'Reason' } }, { ...inclusion, checkedAt: 'invalid' },
    { ...inclusion, checkedAt: '2026-02-31T00:00:00.000Z' },
    { ...inclusion, evidence: [{ url, quote: 'short' }] }]) assert.equal(isInclusionBasis(value, row.url), false)
  assert.throws(() => validateRows([{ ...row, sourceMeta: { ...row.sourceMeta, inclusion: {} } }]), /Invalid inclusion basis/)
})

test('a verified rationale changes only its dedicated field', async () => {
  const before = structuredClone(row)
  const result = await mergeReviewedInclusions([row], [{ id: row.id, inclusion }], async () => quote)
  const after = result.rows[0]
  assert.deepEqual(row, before)
  assert.deepEqual(after, { ...row, sourceMeta: { ...row.sourceMeta, inclusion } })
  assert.equal(result.reviewed, 1)
  assert.equal(result.unresolved, 0)
})

test('unresolved reviews preserve existing rationales and do not invent empty records', async () => {
  const withBasis = { ...row, sourceMeta: { ...row.sourceMeta, inclusion } }
  const result = await mergeReviewedInclusions([withBasis], [{ id: row.id, unresolved: 'insufficient-evidence' }], async () => {
    assert.fail('no source request expected')
  })
  assert.deepEqual(result.rows, [withBasis])
  assert.equal(result.reviewed, 0)
  assert.equal(result.unresolved, 1)
})

test('duplicate, unknown and ambiguous import records are rejected', () => {
  const valid = { id: row.id, inclusion }
  assert.throws(() => parseReviewedInclusions([valid, valid], [row]), /invalid-id/)
  assert.throws(() => parseReviewedInclusions([{ ...valid, id: 'missing' }], [row]), /invalid-id/)
  assert.throws(() => parseReviewedInclusions([{ ...valid, unresolved: 'ambiguous' }], [row]), /invalid-basis/)
})

test('citations stay short even when the same file is cited twice', () => {
  const long = 'word '.repeat(26).trim()
  assert.equal(isInclusionBasis({ ...inclusion, evidence: [{ url, quote: long }] }, row.url), false)
  const two = [{ url, quote: 'one '.repeat(13).trim() }, { url: `${url}#L2`, quote: 'two '.repeat(13).trim() }]
  assert.equal(isInclusionBasis({ ...inclusion, evidence: two }, row.url), false)
})

test('unspaced Chinese and Japanese excerpts cannot bypass the citation budget', () => {
  for (const character of ['字', 'あ', 'カ']) {
    assert.equal(isInclusionBasis({ ...inclusion, evidence: [{ url, quote: character.repeat(26) }] }, row.url), false)
  }
  assert.equal(isInclusionBasis({ ...inclusion, evidence: [{ url, quote: 'Jev ' + '字'.repeat(24) }] }, row.url), true)
  assert.equal(isInclusionBasis({ ...inclusion, evidence: [{ url, quote: 'Jev ' + '字'.repeat(25) }] }, row.url), false)
})

test('equivalent file URL spellings share one excerpt budget', () => {
  for (const equivalent of [url.replace('/test/project/', '/Test/Project/'), url.replace('README.md', '%52EADME.md')]) {
    const evidence = [{ url, quote: 'one '.repeat(13).trim() },
      { url: equivalent, quote: 'two '.repeat(13).trim() }]
    assert.equal(isInclusionBasis({ ...inclusion, evidence }, row.url), false)
  }
})

test('backfill queue skips completed notes but includes legacy rows without review receipts', () => {
  const completed = { ...row, sourceMeta: { ...row.sourceMeta, inclusion } }
  const legacy = { ...row, id: 'legacy', sourceMeta: { repo: 'test/project', stars: 100 } }
  const later = { ...row, id: 'later' }
  assert.deepEqual(pendingInclusions([completed, later, legacy], 1), [legacy])
  assert.throws(() => pendingInclusions([legacy], 0), /invalid-batch-size/)
})

test('a fabricated quote blocks the complete batch without mutating the catalog', async () => {
  const before = structuredClone(row)
  await assert.rejects(mergeReviewedInclusions([row], [{ id: row.id, inclusion }], async () => 'Different file contents'), /quote-not-found/)
  assert.deepEqual(row, before)
})

test('source quote verification normalizes only platform line endings', async () => {
  const multi = { ...inclusion, evidence: [{ url, quote: 'The TypeSafe Jev adapter\nselects tools.' }] }
  await assert.doesNotReject(mergeReviewedInclusions([row], [{ id: row.id, inclusion: multi }], async () => 'The TypeSafe Jev adapter\r\nselects tools.'))
  await assert.rejects(mergeReviewedInclusions([row], [{ id: row.id, inclusion: multi }], async () => 'The TypeSafe Jev adapter  selects tools.'), /quote-not-found/)
})

test('regular GitHub metadata refresh preserves the rationale and original review', () => {
  const before = { ...row, sourceMeta: { ...row.sourceMeta, inclusion } }
  const updated = refreshRow(before, {
    html_url: row.url, full_name: 'test/project', name: 'project', owner: { login: 'test' },
    description: 'A different upstream description', stargazers_count: 15, forks_count: 4,
  })
  assert.deepEqual(updated.sourceMeta.inclusion, inclusion)
  assert.equal(updated.summary, row.summary)
  assert.equal(updated.sourceMeta.jevKeepConfidence, row.sourceMeta.jevKeepConfidence)
  assert.equal(updated.sourceMeta.stars, 15)
})

test('evidence fetching caches sources and rejects HTTP and oversized responses', async () => {
  let calls = 0
  const read = sourceReader(async () => { calls++; return new Response(quote) })
  assert.deepEqual(await Promise.all([read('https://raw.githubusercontent.com/test'), read('https://raw.githubusercontent.com/test')]), [quote, quote])
  assert.equal(calls, 1)
  await assert.rejects(sourceReader(async () => new Response('', { status: 404 }))('https://raw.githubusercontent.com/test'), /http-404/)
  await assert.rejects(sourceReader(async () => new Response('x'.repeat(512 * 1024 + 1)))('https://raw.githubusercontent.com/test'), /too-large/)
})

test('incremental verification makes no source requests for metadata refresh or missing reasons', async () => {
  const before = { ...row, sourceMeta: { ...row.sourceMeta, inclusion } }
  const after = { ...before, sourceMeta: { ...before.sourceMeta, stars: 99 } }
  const noSource = async () => assert.fail('Unchanged evidence must not be fetched')
  assert.equal(await verifyChangedInclusions([after], [before], noSource), 0)
  assert.equal(await verifyChangedInclusions([row], [], noSource), 0)
  assert.equal(await verifyChangedInclusions([row], [before], noSource), 0)
})

test('incremental verification covers newly added reasons and rationale-only edits', async () => {
  const after = { ...row, sourceMeta: { ...row.sourceMeta, inclusion } }
  assert.equal(await verifyChangedInclusions([after], [row], async () => quote), 1)
  assert.equal(await verifyChangedInclusions([after], [], async () => quote), 1)
  const edited = { ...after, sourceMeta: { ...after.sourceMeta, inclusion: {
    ...inclusion, text: { ...inclusion.text, en: 'A revised source-backed reason.' },
  } } }
  assert.equal(await verifyChangedInclusions([edited], [after], async () => quote), 1)
  await assert.rejects(verifyChangedInclusions([edited], [after], async () => 'Unrelated source'), /quote-not-found/)
})

test('changed citations and repository identity cannot reuse prior verification', async () => {
  const before = { ...row, sourceMeta: { ...row.sourceMeta, inclusion } }
  const newQuote = { ...before, sourceMeta: { ...before.sourceMeta,
    inclusion: { ...inclusion, evidence: [{ url, quote: 'An invented Jev connection.' }] },
  } }
  await assert.rejects(verifyChangedInclusions([newQuote], [before], async () => quote), /quote-not-found/)
  const changedRepository = { ...before, url: 'https://github.com/test/different', sourceMeta: {
    ...before.sourceMeta, repo: 'test/different',
  } }
  await assert.rejects(verifyChangedInclusions([changedRepository], [before], async () => quote), /Invalid inclusion basis/)
})

test('Git baselines require fixed SHAs and a missing revision is not treated as an empty catalog', () => {
  assert.deepEqual(readInclusionBaseline(process.cwd(), '0'.repeat(40)), [])
  for (const revision of ['main', 'HEAD^', '--help', 'a'.repeat(40) + ';echo bad']) {
    assert.throws(() => readInclusionBaseline(process.cwd(), revision), /invalid-base-sha/)
  }
  assert.throws(() => readInclusionBaseline(process.cwd(), 'f'.repeat(40)))
})
