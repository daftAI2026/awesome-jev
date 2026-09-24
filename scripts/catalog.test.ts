import test, { type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { candidateRow, readCatalog, refreshRow, renderReadme, validateRows, validateSnapshot, applySnapshot, repoKey } from './catalog.ts'
import { writeSnapshot, emptyState } from './radar.ts'

type DirectoryRow = ReturnType<typeof readCatalog>['rows'][number]
type GithubRepo = Parameters<typeof candidateRow>[0]
type ReviewScore = NonNullable<Parameters<typeof candidateRow>[1]>
type SnapshotResult = Parameters<typeof writeSnapshot>[2]

const row = (name = 'one'): DirectoryRow => ({ id: `gh-${name}`, type: 'github', title: name, summary: 'Editorial summary',
  tags: ['awesome'], url: `https://github.com/test/${name}`, sourceMeta: { repo: `test/${name}`, author: 'test', stars: 3 } })
const text = 'Handwritten intro\n<!-- PROJECT_COUNT:START -->\nold\n<!-- PROJECT_COUNT:END -->\nHandwritten guide\n<!-- PROJECTS:START -->\nold\n<!-- PROJECTS:END -->\nHandwritten license\n'
const keptScore: ReviewScore = { jevAbout: 0.99, jevKeep: 'keep', jevKeepConfidence: 0.98 }
const meta: GithubRepo = { full_name: 'test/new', html_url: 'https://github.com/test/new', name: 'new', owner: { login: 'test' },
  description: 'Real upstream description', stargazers_count: 2, forks_count: 1, language: 'JavaScript', private: false, fork: false, archived: false }
function fixture(t: TestContext): string {
  const root = mkdtempSync(join(tmpdir(), 'jev-catalog-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'data')); mkdirSync(join(root, 'radar'))
  writeFileSync(join(root, 'data/github.json'), JSON.stringify([row(), row('two')]))
  writeFileSync(join(root, 'radar/state.json'), JSON.stringify(emptyState()))
  writeFileSync(join(root, 'radar/latest.json'), '{}')
  writeFileSync(join(root, 'README.md'), renderReadme(text, readCatalog(root).rows))
  return root
}
function snapshot(t: TestContext): { root: string; output: string; result: SnapshotResult } {
  const root = fixture(t), output = join(root, 'output'), catalog = readCatalog(root)
  const fresh = candidateRow(meta, keptScore)
  catalog.files.get('github.json')!.push(fresh)
  const result: SnapshotResult = {
    ...catalog,
    rows: [...catalog.files.values()].flat(),
    state: emptyState(),
    report: {
      at: '2026-09-22T00:00:00.000Z', model: 'jev-latest', status: 'complete', sources: [],
      metadata: { ok: 0, failed: 0 }, reviewed: 1, added: 1, pending: 0, overflow: 0, evicted: 0, receipts: [],
    },
  }
  writeSnapshot(root, output, result)
  return { root, output, result }
}

test('GitHub catalog remains readable', (t) => {
  const root = fixture(t), catalog = readCatalog(root)
  assert.equal(catalog.rows.length, 2)
  assert.equal(catalog.rows.filter((r) => r.type === 'github').length, 2)
})
test('metadata refresh preserves editorial content, stable ID and review scores', () => {
  const before = { ...row('new'), sourceMeta: { ...row('new').sourceMeta, ...keptScore, custom: 'preserve' } }
  const after = refreshRow(before, meta)
  assert.equal(after.id, before.id); assert.equal(after.summary, before.summary)
  assert.deepEqual(after.tags, before.tags); assert.equal(after.sourceMeta.jevAbout, 0.99)
  assert.equal(after.sourceMeta.custom, 'preserve'); assert.equal(after.sourceMeta.stars, 2)
  assert.throws(() => refreshRow(before, { ...meta, html_url: 'https://github.com/test/moved' }))
})
test('GitHub issue counts are ignored rather than stored', () => {
  const response = { ...meta, open_issues_count: 17 }
  assert.equal(Object.hasOwn(candidateRow(response, keptScore).sourceMeta, 'openIssues'), false)
  assert.equal(Object.hasOwn(refreshRow(row('new'), response).sourceMeta, 'openIssues'), false)
  assert.throws(() => validateRows([{ ...row(), sourceMeta: { ...row().sourceMeta, openIssues: 17 } }]), /Legacy openIssues/)
})
test('README is deterministic, escaped, count-correct, and preserves handwritten regions', () => {
  const rows = [row(), { ...row('two'), title: '<script> [bad]', summary: 'line\n<!-- PROJECTS:END -->' }]
  const out = renderReadme(text, rows)
  assert.equal(renderReadme(out, rows), out)
  assert.match(out, /projects-2-/); assert.match(out, /Handwritten license/)
  const badgeLine = out.split('<!-- PROJECT_COUNT:START -->\n')[1].split('\n<!-- PROJECT_COUNT:END -->')[0]
  assert.equal(badgeLine.split('\n').length, 1)
  assert.ok(badgeLine.indexOf('awesome.re/badge.svg') < badgeLine.indexOf('badge/site-awesomejev.cc'))
  assert.ok(badgeLine.indexOf('badge/site-awesomejev.cc') < badgeLine.indexOf('badge/projects-2'))
  assert.match(badgeLine, /radar\.yml\/badge\.svg\?branch=main&event=push/)
  assert.match(badgeLine, /github\/stars\/daftAI2026\/awesome-jev/)
  assert.match(out, /&lt;script&gt;/); assert.doesNotMatch(out, /<script>/)
  assert.equal(out.split('<!-- PROJECTS:END -->').length, 2)
})
test('ambiguous or missing README markers fail without replacing handwritten sections', () => {
  assert.throws(() => renderReadme('handwritten', [row()]), /region/)
  assert.throws(() => renderReadme(text + '<!-- PROJECTS:START -->', [row()]), /region/)
})
test('duplicate IDs, duplicate repo aliases and unsafe URLs are rejected', () => {
  assert.throws(() => validateRows([row(), row()]), /Duplicate/)
  assert.throws(() => validateRows([row(), { ...row(), id: 'another' }]), /Duplicate repository/)
  assert.equal(repoKey('https://evil.test/test/one'), null)
  assert.equal(repoKey('https://github.com/test/one?x=1'), null)
  assert.equal(repoKey('https://user:pass@github.com/test/one'), null)
})
test('legacy sourceMeta repo aliases remain valid; URL owns deduplication', () => {
  validateRows([{ ...row(), sourceMeta: { repo: 'old/name' } }])
})
test('new candidate IDs cannot collide on owner/repo hyphen boundaries', () => {
  const a = candidateRow({ ...meta, full_name: 'a-b/c', html_url: 'https://github.com/a-b/c' })
  const b = candidateRow({ ...meta, full_name: 'a/b-c', html_url: 'https://github.com/a/b-c' })
  assert.notEqual(a.id, b.id)
})
test('reviewed snapshot applies as a unit', (t) => {
  const { root, output } = snapshot(t)
  validateSnapshot(root, output); applySnapshot(root, output)
  assert.equal(readCatalog(root).rows.length, 3)
})
const snapshotMutations: ReadonlyArray<[string, (rows: DirectoryRow[]) => void]> = [
  ['delete old row', (rows) => { rows.shift() }],
  ['overwrite editorial summary', (rows) => { rows[0].summary = 'Changed' }],
  ['low-confidence addition', (rows) => { rows.at(-1)!.sourceMeta.jevKeepConfidence = 0.2 }],
  ['missing review', (rows) => { delete rows.at(-1)!.sourceMeta.jevAbout }],
]
for (const [name, mutate] of snapshotMutations) test(`snapshot rejects ${name}`, (t) => {
  const { root, output } = snapshot(t)
  const path = join(output, 'data/github.json'), rows = JSON.parse(readFileSync(path, 'utf8')) as DirectoryRow[]
  mutate(rows); writeFileSync(path, JSON.stringify(rows))
  assert.throws(() => validateSnapshot(root, output))
})
test('README grouping follows the reviewed category, not self-assigned topics', () => {
  const spoof = { ...row('spoof'), tags: ['sdk'], category: 'other' as const }
  const output = renderReadme(text, [spoof])
  const sdk = output.split('## SDKs & integrations')[1].split('## Developer tools')[0]
  assert.doesNotMatch(sdk, /spoof/)
  assert.match(output.split('## Other')[1], /spoof/)
})

test('unsupported sources and legacy shards are rejected', (t) => {
  const root = fixture(t)
  writeFileSync(join(root, 'data/youtube.json'), '[]')
  assert.throws(() => readCatalog(root), /Unsupported catalog/)
  rmSync(join(root, 'data/youtube.json'))
  writeFileSync(join(root, 'data/part-28.json'), '[]')
  assert.throws(() => readCatalog(root), /Unsupported catalog/)
})
test('GitHub file rejects non-GitHub rows', (t) => {
  const root = fixture(t)
  writeFileSync(join(root, 'data/github.json'), JSON.stringify([{ ...row(), type: 'x' }]))
  assert.throws(() => readCatalog(root), /Invalid DirectoryItem/)
})

test('README preserves inline-code language labels and omits missing languages', () => {
  for (const language of ['PHP', 'TypeScript', 'C++', 'F#', 'Jupyter Notebook']) {
    const item = row()
    item.sourceMeta.language = language
    const output = renderReadme(text, [item])
    assert.ok(output.includes(' · `' + language + '`\n'))
    assert.equal(renderReadme(output, [item]), output)
  }
  for (const language of [undefined, null, '']) {
    const item = row()
    item.sourceMeta.language = language
    assert.ok(!renderReadme(text, [item]).includes(' · '))
  }
})
test('language code fences contain remote backticks and escape README markers', () => {
  const item = row()
  item.sourceMeta.language = '`PHP`\n<!-- PROJECTS:END -->'
  const output = renderReadme(text, [item])
  assert.ok(output.includes(' · `` `PHP` &lt;!-- PROJECTS:END --&gt; ``'))
  assert.equal(output.split('<!-- PROJECTS:END -->').length, 2)
  assert.equal(renderReadme(output, [item]), output)
})
