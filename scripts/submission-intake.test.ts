/**
 * [INPUT]: 依赖公开收录控制器、真实目录生成器与 GitHub REST 形状的离线状态机
 * [OUTPUT]: 对外提供 Issue 到 PR/CI/合并/关闭，以及批准失效、篡改拒绝和中断恢复的回归验证
 * [POS]: scripts 的条件收录集成测试；读写替身保留 Git 对象不可变性，不调用模型或执行外部代码
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { candidateRow, renderReadme, repoKey } from './catalog.ts'
import { buildSitemap } from './generate-sitemap.ts'
import { processIntake, verifiedRun, parseIntakeMeta, type IntakeOptions } from './submission-intake.ts'
import { REPOSITORY, renderReport, repositoryLinks, reportLanguage, submissionFingerprint, type SubmissionResult } from './submission-review.ts'
import type { DirectoryItem, GitHubRepository, JevScore } from './model-types.ts'

const PREFIX = `/repos/${REPOSITORY}`
const BOT = { login: 'github-actions[bot]', type: 'Bot' }
const WORKFLOW_ID = 99, REPOSITORY_ID = 42, SOURCE_ID = 71
const ISSUE_NUMBER = 8, PR_NUMBER = 30
const MAIN = '1'.repeat(40), SOURCE = 'a'.repeat(40)
const BRANCH = `jev-intake/issue-${ISSUE_NUMBER}`
const STEPS = ['Install locked dependencies', 'Verify new or edited rationale quotes at pinned sources', 'Verify catalog and delivery']
const sha = (value: unknown) => createHash('sha1').update(JSON.stringify(value)).digest('hex')
type Files = Record<string, string>
type Mutation = { path: string; method: string; body: Record<string, unknown> }
interface Comment { id: number; body: string; created_at: string; updated_at: string; user: { login: string; type: string } }
interface Issue { number: number; title: string; body: string; state: string; user: { login: string }; labels: { name: string }[]; pull_request?: unknown }
interface Pull { number: number; body: string; state: string; draft: boolean; mergeable: boolean; merged: boolean; merge_commit_sha?: string;
  merged_by?: { login: string; type: string }; user: { login: string; type: string };
  head: { sha: string; ref: string; repo: { id: number; full_name: string } }; base: { sha: string; ref: string; repo: { id: number; full_name: string } } }
interface Run { id: number; workflow_id: number; path: string; event: string; display_title: string; head_sha: string; head_branch: string;
  head_repository: { id: number; full_name: string }; status: string; conclusion: string | null; run_attempt: number; pull_requests: { number: number }[] }
interface Job { id: number; name: string; run_id: number; run_attempt: number; status: string; conclusion: string | null;
  steps: { name: string; number: number; status: string; conclusion: string | null }[] }

const original: DirectoryItem = { id: 'gh-old', type: 'github', title: 'old', summary: 'The maintainer keeps this original description.',
  category: 'resources', url: 'https://github.com/test/old', sourceMeta: { repo: 'test/old', stars: 9,
    githubIdentity: { databaseId: 41, nodeId: 'R_41' }, inclusion: { text: { en: 'A documented Jev tutorial.', zh: '有明确文档的 Jev 教程。', ja: 'Jev の利用を説明する資料。' },
      evidence: [{ url: `https://github.com/test/old/blob/${'9'.repeat(40)}/README.md`, quote: 'A documented Jev tutorial.' }],
      checkedAt: '2026-10-01T00:00:00Z', reviewer: 'manual review' } } }
const score: JevScore = { jevAbout: 0.96, jevKeep: 'keep', jevKeepConfidence: 0.97, category: 'sdk' }
const deepReview = (): SubmissionResult => ({ repo: 'test/new', status: 'review', reason: 'insufficient-usage-evidence', deep: true,
  progress: { checked: 78, total: 78, excluded: 4, blocked: 0, inventoryComplete: true },
  evidence: `https://github.com/test/new/tree/${SOURCE}`, evidenceLinks: [`https://github.com/test/new/blob/${SOURCE}/src/head.py#L1-L9`] })
const initialKeep = (): SubmissionResult => ({ repo: 'test/new', status: 'keep', score: { ...score }, evidence: `https://github.com/test/new/blob/${SOURCE}/README.md` })
const template = '# Directory\n<!-- PROJECT_COUNT:START -->\n<!-- PROJECT_COUNT:END -->\n\n<!-- PROJECTS:START -->\n<!-- PROJECTS:END -->\n'

function catalogFiles(rows: DirectoryItem[], readme = template): Files {
  return { 'data/github.json': JSON.stringify(rows, null, 2) + '\n', 'README.md': renderReadme(readme, rows),
    'data/news.json': '[]\n', 'public/sitemap.xml': buildSitemap(rows, 'https://awesomejev.cc', []).xml }
}

function successCI(head: string, branch = BRANCH, event = 'workflow_dispatch', repositoryId = REPOSITORY_ID, number?: number): { run: Run; jobs: Job[] } {
  const run: Run = { id: 501, workflow_id: WORKFLOW_ID, path: '.github/workflows/radar.yml', event, head_sha: head, head_branch: branch,
    display_title: `Jev validate: ${branch}`,
    head_repository: { id: repositoryId, full_name: REPOSITORY }, status: 'completed', conclusion: 'success', run_attempt: 1,
    pull_requests: number ? [{ number }] : [] }
  return { run, jobs: [{ id: 601, name: 'verify', run_id: run.id, run_attempt: run.run_attempt, status: 'completed', conclusion: 'success',
    steps: ['Set up job', 'Run actions/checkout@pinned', 'Run actions/setup-node@pinned', ...STEPS, 'Complete job']
      .map((name, index) => ({ name, number: index + 1, status: 'completed', conclusion: 'success' })) }] }
}

// --- Git 对象一经建立不再改写；攻击与并发修改通过新提交产生新的 head ---
function harness() {
  const state = { issue: { number: ISSUE_NUMBER, title: '[Submission] Independent typed decisions', body: 'https://github.com/test/new',
      state: 'open', user: { login: 'submitter' }, labels: [{ name: 'submission' }] } as Issue,
    comments: [] as Comment[], permission: 'write', main: MAIN, ref: undefined as string | undefined, pr: undefined as Pull | undefined,
    source: { id: SOURCE_ID, node_id: 'R_71', full_name: 'test/new', html_url: 'https://github.com/test/new', name: 'new', owner: { login: 'test' },
      default_branch: 'main', description: 'Independent typed probabilistic decisions.', stargazers_count: 7, forks_count: 2, language: 'Python',
      created_at: '2026-09-10T01:00:00Z', license: { spdx_id: 'Apache-2.0' }, private: false, fork: false, archived: false } as GitHubRepository,
    sourceHead: SOURCE, runs: [] as Run[], jobs: new Map<number, Job[]>(), runCount: undefined as number | undefined,
    jobCount: undefined as number | undefined, afterJobs: undefined as (() => void) | undefined,
    failBodyPatch: 0, failMainDispatch: 0, failClose: 0, failPrCreate: 0, dispatches: [] as string[], reads: [] as string[], writes: [] as Mutation[] }
  const commits = new Map<string, Files>([[MAIN, catalogFiles([structuredClone(original)])]])
  const trees = new Map<string, Files>()
  const blobs = new Map<string, string>()
  const parents = new Map<string, string[]>([[MAIN, []]])
  const ancestors = (revision: string): Map<string, number> => {
    const result = new Map<string, number>([[revision, 0]])
    for (const [current, distance] of result) {
      for (const parent of parents.get(current) ?? []) {
        if (!result.has(parent)) result.set(parent, distance + 1)
      }
    }
    return result
  }
  const mergeBase = (base: string, head: string): string => {
    const before = ancestors(base), after = ancestors(head)
    const shared = [...before.keys()].filter((id) => after.has(id))
      .sort((a, b) => (before.get(a)! + after.get(a)!) - (before.get(b)! + after.get(b)!))
    assert.ok(shared.length, 'The mock must calculate a real shared ancestor instead of inventing the requested base')
    return shared[0]!
  }
  const treeOf = (revision: string): string => {
    const files = commits.get(revision)
    assert.ok(files, `Unknown fixed Git commit: ${revision}`)
    const tree = sha(files)
    trees.set(tree, structuredClone(files))
    return tree
  }
  const diff = (base: string, head: string) => {
    const before = commits.get(base)!, after = commits.get(head)!
    assert.ok(before && after)
    return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((path) => before[path] !== after[path])
      .map((filename) => ({ filename, status: after[filename] === undefined ? 'removed' : before[filename] === undefined ? 'added' : 'modified' }))
  }
  const setReport = (results: SubmissionResult[] = [deepReview()]) => {
    const baseline = JSON.parse(commits.get(state.main)!['data/github.json']) as DirectoryItem[]
    const known = new Set(baseline.map((row) => repoKey(row.url)!))
    const input = state.issue.pull_request
      ? { keys: (JSON.parse(commits.get(state.pr!.head.sha)!['data/github.json']) as DirectoryItem[])
        .map((row) => repoKey(row.url)!).filter((key) => !known.has(key)), version: state.pr!.head.sha }
      : { keys: repositoryLinks(state.issue.body), version: createHash('sha256').update(JSON.stringify([state.issue.title, state.issue.body])).digest('hex') }
    const at = '2026-10-04T10:00:00.000Z'
    const meta = { version: 1, inputVersion: input.version, fingerprint: submissionFingerprint(input, known, reportLanguage(state.issue)),
      at, day: '2026-10-04', used: 2, requests: 16, pending: false, retryable: false, completed: results }
    const report: Comment = { id: 11, body: renderReport(meta, results), created_at: at, updated_at: at, user: { ...BOT } }
    state.comments = [report, { id: 23, body: '/jev include alternatives', created_at: '2026-10-04T10:01:00.000Z',
      updated_at: '2026-10-04T10:01:00.000Z', user: { login: 'maintainer', type: 'User' } }]
  }
  const options: IntakeOptions = {
    api: async (path, request) => {
      assert.equal(request, undefined, 'Intake may not submit a GraphQL mutation or model request')
      state.reads.push(path)
      const url = new URL(`https://api.github.com${path}`), endpoint = url.pathname
      if (endpoint === `${PREFIX}/issues/${ISSUE_NUMBER}`) return structuredClone(state.issue)
      if (endpoint === `${PREFIX}/issues/${ISSUE_NUMBER}/comments`) return structuredClone(state.comments)
      if (endpoint.startsWith(`${PREFIX}/collaborators/`) && endpoint.endsWith('/permission')) {
        const login = endpoint.split('/').at(-2)!
        return { permission: login === 'maintainer' ? state.permission : 'read', user: { login } }
      }
      if (endpoint === `${PREFIX}/pulls`) {
        assert.equal(url.searchParams.get('state'), 'all', 'Closed merged PRs must remain recoverable')
        assert.equal(url.searchParams.get('head'), `daftAI2026:${BRANCH}`)
        return state.pr ? [structuredClone(state.pr)] : []
      }
      if (endpoint === `${PREFIX}/pulls/${state.pr?.number ?? PR_NUMBER}`) {
        assert.ok(state.pr)
        return structuredClone(state.pr)
      }
      if (endpoint === `${PREFIX}/pulls/${state.pr?.number ?? PR_NUMBER}/files`) {
        assert.ok(state.pr)
        return diff(mergeBase(state.main, state.pr.head.sha), state.pr.head.sha)
      }
      if (endpoint === `${PREFIX}/git/ref/heads/main`) return { ref: 'refs/heads/main', object: { type: 'commit', sha: state.main } }
      if (endpoint === `${PREFIX}/git/ref/heads/${BRANCH}`) {
        if (!state.ref) throw new Error('github-http-404')
        return { ref: `refs/heads/${BRANCH}`, object: { type: 'commit', sha: state.ref } }
      }
      if (endpoint.startsWith(`${PREFIX}/git/commits/`)) return { sha: endpoint.split('/').at(-1), tree: { sha: treeOf(endpoint.split('/').at(-1)!) } }
      if (endpoint.startsWith(`${PREFIX}/contents/`)) {
        const revision = url.searchParams.get('ref')!
        const file = endpoint.slice(`${PREFIX}/contents/`.length)
        const content = commits.get(revision)?.[file]
        assert.notEqual(content, undefined, `Only fixed known files are readable: ${revision}:${file}`)
        const bytes = Buffer.from(content!)
        return { type: 'file', path: file, encoding: 'base64', content: bytes.toString('base64'), size: bytes.length, sha: sha(content) }
      }
      if (endpoint.startsWith(`${PREFIX}/compare/`)) {
        const [base, head] = endpoint.slice(`${PREFIX}/compare/`.length).split('...')
        const common = mergeBase(base!, head!)
        return { status: base === head ? 'identical' : common === base ? 'ahead' : common === head ? 'behind' : 'diverged',
          merge_base_commit: { sha: common }, files: diff(common, head!) }
      }
      if (endpoint === '/repos/test/new') return structuredClone(state.source)
      if (endpoint === '/repos/test/new/commits/main') return { sha: state.sourceHead }
      if (endpoint === `${PREFIX}/actions/workflows/radar.yml`) return { id: WORKFLOW_ID, path: '.github/workflows/radar.yml', state: 'active' }
      if (endpoint === PREFIX) return { id: REPOSITORY_ID, full_name: REPOSITORY }
      if (endpoint === `${PREFIX}/actions/workflows/${WORKFLOW_ID}/runs`) {
        const requestedHead = url.searchParams.get('head_sha')
        assert.ok(requestedHead === state.pr?.head.sha || requestedHead === state.main, 'Runs must be requested for the exact PR or current main SHA')
        assert.ok(['workflow_dispatch', 'pull_request'].includes(url.searchParams.get('event')!))
        const runs = state.runs.filter((run) => run.head_sha === requestedHead && run.event === url.searchParams.get('event'))
        return { total_count: state.runCount ?? runs.length, workflow_runs: structuredClone(runs) }
      }
      const runId = endpoint.match(new RegExp(`^${PREFIX}/actions/runs/(\\d+)$`))?.[1]
      if (runId) {
        const run = state.runs.find((run) => run.id === Number(runId))
        assert.ok(run)
        return structuredClone(run)
      }
      const jobs = endpoint.match(new RegExp(`^${PREFIX}/actions/runs/(\\d+)/(?:attempts/(\\d+)/)?jobs$`))
      if (jobs) {
        const run = state.runs.find((run) => run.id === Number(jobs[1]))!
        if (jobs[2]) assert.equal(Number(jobs[2]), run.run_attempt)
        const result = structuredClone(state.jobs.get(Number(jobs[1])) ?? [])
        const mutate = state.afterJobs
        state.afterJobs = undefined
        mutate?.()
        return { total_count: state.jobCount ?? result.length, jobs: result }
      }
      assert.fail(`Unexpected intake GET: ${path}`)
    },
    write: async (path, method, body) => {
      state.writes.push({ path, method, body: structuredClone(body) })
      if (path === `${PREFIX}/git/blobs` && method === 'POST') {
        assert.equal(body.encoding, 'utf-8')
        assert.equal(typeof body.content, 'string')
        const id = sha(body.content)
        blobs.set(id, body.content as string)
        return { sha: id }
      }
      if (path === `${PREFIX}/git/trees` && method === 'POST') {
        const base = trees.get(body.base_tree as string)
        assert.ok(base)
        const files = structuredClone(base)
        for (const file of body.tree as Array<{ path: string; mode: string; type: string; sha: string }>) {
          assert.equal(file.mode, '100644')
          assert.equal(file.type, 'blob')
          assert.ok(blobs.has(file.sha))
          files[file.path] = blobs.get(file.sha)!
        }
        const id = sha(files)
        trees.set(id, files)
        return { sha: id }
      }
      if (path === `${PREFIX}/git/commits` && method === 'POST') {
        assert.ok(trees.has(body.tree as string))
        for (const parent of body.parents as string[]) assert.ok(commits.has(parent))
        const id = sha(body)
        commits.set(id, structuredClone(trees.get(body.tree as string)!))
        parents.set(id, body.parents as string[])
        return { sha: id }
      }
      if (path === `${PREFIX}/git/refs` && method === 'POST') {
        assert.equal(body.ref, `refs/heads/${BRANCH}`)
        assert.equal(state.ref, undefined)
        assert.ok(commits.has(body.sha as string))
        state.ref = body.sha as string
        return { ref: body.ref, object: { sha: state.ref } }
      }
      if (path === `${PREFIX}/git/refs/heads/${BRANCH}` && method === 'PATCH') {
        assert.equal(body.force, false)
        assert.ok(parents.get(body.sha as string)?.includes(state.ref!), 'Ref recovery must extend the previous head without force')
        state.ref = body.sha as string
        state.pr!.head.sha = state.ref
        return { object: { sha: state.ref } }
      }
      if (path === `${PREFIX}/pulls` && method === 'POST') {
        if (state.failPrCreate-- > 0) throw new Error('github-write-outcome-unknown')
        assert.equal(state.pr, undefined)
        assert.equal(body.head, BRANCH)
        assert.equal(body.base, 'main')
        assert.ok(state.ref)
        state.pr = { number: PR_NUMBER, body: body.body as string, state: 'open', draft: false, mergeable: true, merged: false,
          user: { ...BOT }, head: { sha: state.ref, ref: BRANCH, repo: { id: REPOSITORY_ID, full_name: REPOSITORY } },
          base: { sha: state.main, ref: 'main', repo: { id: REPOSITORY_ID, full_name: REPOSITORY } } }
        return structuredClone(state.pr)
      }
      if (path === `${PREFIX}/pulls/${PR_NUMBER}` && method === 'PATCH') {
        if (state.failBodyPatch-- > 0) throw new Error('github-write-outcome-unknown')
        state.pr!.body = body.body as string
        return structuredClone(state.pr)
      }
      if (path === `${PREFIX}/actions/workflows/radar.yml/dispatches` && method === 'POST') {
        assert.deepEqual(body.inputs, { mode: 'validate' })
        assert.ok(body.ref === 'main' || body.ref === BRANCH)
        if (body.ref === 'main' && state.failMainDispatch-- > 0) throw new Error('github-write-outcome-unknown')
        state.dispatches.push(body.ref as string)
        if (body.ref === 'main') {
          const { run } = successCI(state.main, 'main')
          state.runs.push({ ...run, id: 800 + state.dispatches.length, status: 'queued', conclusion: null })
        }
        return null
      }
      if (path === `${PREFIX}/pulls/${state.pr?.number ?? PR_NUMBER}/merge` && method === 'PUT') {
        assert.equal(body.sha, state.pr!.head.sha, 'Merge must pin the exact CI-verified PR head')
        assert.equal(body.merge_method, 'squash')
        assert.equal(state.pr!.merged, false, 'A recovery may not merge twice')
        const priorMain = state.main, merged = sha([priorMain, body.sha, 'squash'])
        commits.set(merged, structuredClone(commits.get(body.sha as string)!))
        parents.set(merged, [priorMain])
        state.main = merged
        Object.assign(state.pr!, { state: 'closed', merged: true, merge_commit_sha: merged, merged_by: { ...BOT } })
        if (state.issue.pull_request) state.issue.state = 'closed'
        return { merged: true, sha: merged, message: 'Pull Request successfully merged' }
      }
      if (path === `${PREFIX}/issues/${ISSUE_NUMBER}/comments` && method === 'POST') {
        const comment = { id: 50 + state.comments.length, body: body.body as string, created_at: '2026-10-04T10:05:00Z',
          updated_at: '2026-10-04T10:05:00Z', user: { ...BOT } }
        state.comments.push(comment)
        return structuredClone(comment)
      }
      if (path === `${PREFIX}/issues/${ISSUE_NUMBER}` && method === 'PATCH') {
        if (state.failClose-- > 0) throw new Error('github-write-outcome-unknown')
        assert.deepEqual(body, { state: 'closed', state_reason: 'completed' })
        state.issue.state = 'closed'
        return structuredClone(state.issue)
      }
      assert.fail(`Unexpected intake ${method}: ${path}`)
    },
  }
  const ready = () => {
    assert.ok(state.pr)
    const own = state.pr.user.login === BOT.login && state.pr.user.type === 'Bot'
    const { run, jobs } = successCI(state.pr.head.sha, state.pr.head.ref, own ? 'workflow_dispatch' : 'pull_request',
      state.pr.head.repo.id, own ? undefined : state.pr.number)
    state.runs = [run]
    state.jobs.set(run.id, jobs)
    return { run, jobs }
  }
  const rows = (revision = state.pr!.head.sha): DirectoryItem[] => JSON.parse(commits.get(revision)!['data/github.json'])
  const rewrite = (change: (files: Files) => void) => {
    const priorHead = state.pr!.head.sha, files = structuredClone(commits.get(priorHead)!)
    change(files)
    const head = sha([files, priorHead])
    commits.set(head, files)
    parents.set(head, [priorHead])
    state.ref = head
    state.pr!.head.sha = head
  }
  const advanceMain = () => {
    const old = structuredClone(original)
    old.summary = 'A concurrent human clarification must not be overwritten.'
    old.sourceMeta.stars = 19
    const other: DirectoryItem = { id: 'gh-other', type: 'github', title: 'other', summary: 'Another reviewed Jev resource.', category: 'sdk',
      url: 'https://github.com/test/other', sourceMeta: { repo: 'test/other', githubIdentity: { databaseId: 81, nodeId: 'R_81' } } }
    const files = catalogFiles([old, other])
    const priorMain = state.main
    state.main = sha(['main advance', files])
    commits.set(state.main, files)
    parents.set(state.main, [priorMain])
    return [old, other]
  }
  const advanceCode = () => {
    const priorMain = state.main, files = structuredClone(commits.get(priorMain)!)
    files['src/trusted-main.ts'] = 'export const trustedMain = true\n'
    state.main = sha(['code-only main advance', files])
    commits.set(state.main, files)
    parents.set(state.main, [priorMain])
    return state.main
  }
  const contributor = () => {
    const review = deepReview(), addition = candidateRow(state.source, {}, { alternative: true })
    addition.category = 'alternatives'
    addition.sourceMeta.jevEvidence = { repo: review.repo, sha: SOURCE, evidenceUrl: review.evidence,
      checkedAt: '2026-10-04T10:00:00.000Z', status: review.status }
    const files = catalogFiles([structuredClone(original), addition]), head = sha(['contributor commit', files])
    commits.set(head, files)
    parents.set(head, [state.main])
    state.issue.pull_request = { url: `https://api.github.com${PREFIX}/pulls/${ISSUE_NUMBER}` }
    state.pr = { number: ISSUE_NUMBER, body: 'Proposed catalog addition.', state: 'open', draft: false, mergeable: true, merged: false,
      user: { login: 'contributor', type: 'User' }, head: { sha: head, ref: 'contributor-branch', repo: { id: 52, full_name: 'contributor/awesome-jev' } },
      base: { sha: state.main, ref: 'main', repo: { id: REPOSITORY_ID, full_name: REPOSITORY } } }
    setReport()
  }
  setReport()
  return { state, commits, options, ready, rows, rewrite, advanceMain, advanceCode, contributor, setReport, process: () => processIntake(options, ISSUE_NUMBER) }
}

type Harness = ReturnType<typeof harness>
const writesTo = (h: Harness, suffix: string) => h.state.writes.filter((call) => call.path === `${PREFIX}${suffix}`)
const noMergeOrClose = (h: Harness) => {
  assert.equal(writesTo(h, `/pulls/${PR_NUMBER}/merge`).length, 0)
  assert.equal(writesTo(h, `/issues/${ISSUE_NUMBER}`).length, 0)
}

test('approved complete Issue creates one data PR, waits for exact CI, then merges and closes without Jev or budget edits', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => assert.fail('Intake must not call Jev or any unmocked network endpoint'))
  const h = harness(), budget = structuredClone(h.state.comments[0])
  assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
  assert.equal(writesTo(h, '/pulls').length, 1)
  assert.deepEqual(h.state.dispatches, [BRANCH])
  noMergeOrClose(h)
  assert.deepEqual(h.rows()[0], original)
  const addition = h.rows()[1]!
  assert.equal(addition.category, 'alternatives')
  assert.equal(addition.sourceMeta.githubIdentity?.databaseId, SOURCE_ID)
  assert.equal(addition.sourceMeta.jevAbout, undefined)
  assert.equal(addition.sourceMeta.jevKeep, undefined)
  assert.equal(addition.sourceMeta.jevEvidence && (addition.sourceMeta.jevEvidence as Record<string, unknown>).status, 'review')
  assert.equal(parseIntakeMeta(h.state.pr!.body)?.approvals[0]?.approvedBy, 'maintainer')
  const head = h.state.pr!.head.sha
  h.ready()
  assert.equal(await h.process(), 'merged-and-closed')
  assert.equal(writesTo(h, `/pulls/${PR_NUMBER}/merge`)[0]?.body.sha, head)
  assert.deepEqual(h.state.dispatches, [BRANCH, 'main'])
  assert.equal(h.state.issue.state, 'closed')
  assert.equal(h.state.comments.length, 3)
  assert.match(h.state.comments.at(-1)!.body, /@submitter/)
  assert.deepEqual(h.state.comments[0], budget)
  assert.ok(h.state.writes.every((call) => !call.path.includes('/issues/comments/11')))
  assert.equal(await h.process(), 'not-open')
  assert.equal(writesTo(h, `/pulls/${PR_NUMBER}/merge`).length, 1)
})

test('no command or revoked maintainer permission cannot approve a complete needs-review Issue', async () => {
  for (const configure of [(h: Harness) => { h.state.comments.pop() }, (h: Harness) => { h.state.permission = 'read' },
    (h: Harness) => { h.state.comments[1]!.body = 'OK 可以收录' },
    (h: Harness) => { h.state.comments[1]!.created_at = '2026-10-04T09:59:00Z' }]) {
    const h = harness()
    configure(h)
    assert.equal(await h.process(), 'awaiting-approval')
    assert.equal(h.state.writes.length, 0)
  }
  const h = harness()
  await h.process()
  h.ready()
  h.state.permission = 'read'
  assert.equal(await h.process(), 'awaiting-approval')
  noMergeOrClose(h)
})

test('fresh consent after CI refuses permission, command, report, body and source HEAD changes', async () => {
  const mutations: Array<{ name: string; mutate: (h: Harness) => void }> = [
    { name: 'permission revoked', mutate: (h) => { h.state.permission = 'read' } },
    { name: 'approval changed', mutate: (h) => { h.state.comments[1]!.body = '/jev include sdk' } },
    { name: 'approval edited', mutate: (h) => { h.state.comments[1]!.updated_at = '2026-10-04T10:04:00Z' } },
    { name: 'report edited', mutate: (h) => { h.state.comments[0]!.body += '\nChanged report text.' } },
    { name: 'new report after old command', mutate: (h) => { h.state.comments[0]!.updated_at = '2026-10-04T10:03:00Z' } },
    { name: 'Issue body changed', mutate: (h) => { h.state.issue.body += '\nChanged eligibility claim.' } },
    { name: 'Issue withdrawn', mutate: (h) => { h.state.issue.state = 'closed' } },
    { name: 'source HEAD changed', mutate: (h) => { h.state.sourceHead = 'b'.repeat(40) } },
  ]
  for (const { name, mutate } of mutations) {
    const h = harness()
    await h.process()
    h.ready()
    h.state.afterJobs = () => mutate(h)
    if (name === 'source HEAD changed') await assert.rejects(h.process(), /intake-source-changed/)
    else assert.equal(await h.process(), 'approval-changed', name)
    noMergeOrClose(h)
  }
})

test('a source repository move, missing alternative license or duplicate numeric identity fails before PR creation', async () => {
  for (const [mutate, error] of [
    [(h: Harness) => { h.state.sourceHead = 'b'.repeat(40) }, /intake-source-changed/],
    [(h: Harness) => { h.state.source.license = { spdx_id: 'NOASSERTION' } }, /intake-missing-license/],
    [(h: Harness) => { h.state.source.id = 41 }, /intake-already-listed/],
    [(h: Harness) => { h.state.source.private = true }, /Ineligible repository/],
  ] as const) {
    const h = harness()
    mutate(h)
    await assert.rejects(h.process(), error)
    assert.equal(h.state.writes.length, 0)
  }
})

test('PR code or workflow files cannot be sanitized away by intake regeneration', async () => {
  for (const path of ['src/App.tsx', '.github/workflows/radar.yml', 'package.json', 'data/news.json']) {
    const h = harness()
    await h.process()
    h.rewrite((files) => { files[path] = 'untrusted change' })
    h.ready()
    const before = h.state.writes.length
    await assert.rejects(h.process(), /submission-intake-unexpected-files/)
    assert.equal(h.state.writes.length, before, path)
    noMergeOrClose(h)
  }
})

test('PR additions cannot fabricate machine scores, alter the receipt or change old editorial rows', async () => {
  const mutations: Array<(rows: DirectoryItem[]) => void> = [
    (rows) => { Object.assign(rows[1]!.sourceMeta, { jevAbout: 0.99, jevKeep: 'keep', jevKeepConfidence: 0.99 }) },
    (rows) => { (rows[1]!.sourceMeta.jevEvidence as Record<string, unknown>).status = 'keep' },
    (rows) => { (rows[1]!.sourceMeta.jevEvidence as Record<string, unknown>).sha = 'b'.repeat(40) },
    (rows) => { rows[1]!.sourceMeta.githubIdentity!.nodeId = 'R_forged'; rows[1]!.sourceMeta.stars = Number.MAX_SAFE_INTEGER },
    (rows) => { rows[1]!.id = 'manually-invented-id' },
    (rows) => { rows[0]!.summary = 'Overwrite concurrent human data.' },
  ]
  for (const mutate of mutations) {
    const h = harness()
    await h.process()
    h.rewrite((files) => {
      const rows = JSON.parse(files['data/github.json']) as DirectoryItem[]
      mutate(rows)
      Object.assign(files, catalogFiles(rows))
    })
    h.ready()
    await assert.rejects(h.process(), /intake-review-receipt-changed|intake-identity-mismatch|intake-id-changed|submission-intake-not-append-only/)
    noMergeOrClose(h)
  }
})

test('real-shaped Actions responses with no verify job, wrong attempt or skipped step cannot merge', async () => {
  const mutations: Array<(run: Run, jobs: Job[]) => void> = [
    (_run, jobs) => { jobs.length = 0 },
    (run) => { run.run_attempt = 2 },
    (_run, jobs) => { jobs[0]!.name = 'scan' },
    (_run, jobs) => { jobs[0]!.conclusion = 'skipped' },
    (_run, jobs) => { jobs[0]!.steps.find((step) => step.name === STEPS[1])!.conclusion = 'skipped' },
    (run) => { run.path = '.github/workflows/fake.yml' },
    (run) => { run.workflow_id = 100 },
    (run) => { run.conclusion = 'failure' },
  ]
  for (const mutate of mutations) {
    const h = harness()
    await h.process()
    const { run, jobs } = h.ready()
    mutate(run, jobs)
    assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
    noMergeOrClose(h)
  }
  for (const key of ['runCount', 'jobCount'] as const) {
    const h = harness()
    await h.process()
    h.ready()
    h.state[key] = 101
    assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
    noMergeOrClose(h)
  }
})

test('verifiedRun checks workflow identity, exact SHA, source repository, attempt and each stable successful step', () => {
  const { run, jobs } = successCI(SOURCE)
  const verify = (r: unknown = run, j: unknown = jobs) => verifiedRun(r, WORKFLOW_ID, REPOSITORY_ID, SOURCE, BRANCH, j)
  assert.equal(verify(), true)
  for (const change of [{ workflow_id: 100 }, { path: '.github/workflows/evil.yml' }, { event: 'push' }, { head_sha: MAIN },
    { head_branch: 'main' }, { head_repository: { id: 7 } }, { status: 'in_progress' }, { conclusion: 'failure' }, { run_attempt: 0 }]) {
    assert.equal(verify({ ...run, ...change }), false)
  }
  for (const change of [{ run_attempt: 2 }, { status: 'queued' }, { conclusion: 'skipped' }, { name: 'validate' }, { steps: [] }]) {
    assert.equal(verify(run, [{ ...jobs[0], ...change }]), false)
  }
  assert.equal(verify(run, []), false)
  assert.equal(verify(run, [jobs[0], jobs[0]]), false)
  for (const name of STEPS) {
    for (const conclusion of ['skipped', 'failure', null]) {
      const altered = structuredClone(jobs)
      altered[0]!.steps.find((step) => step.name === name)!.conclusion = conclusion
      assert.equal(verify(run, altered), false)
    }
    const altered = structuredClone(jobs)
    altered[0]!.steps.push({ ...altered[0]!.steps.find((step) => step.name === name)! })
    assert.equal(verify(run, altered), false)
  }
  const fork = successCI(SOURCE, 'contributor-branch', 'pull_request', 52, PR_NUMBER)
  assert.equal(verifiedRun(fork.run, WORKFLOW_ID, 52, SOURCE, 'contributor-branch', fork.jobs, PR_NUMBER), true)
  assert.equal(verifiedRun({ ...fork.run, pull_requests: [] }, WORKFLOW_ID, 52, SOURCE, 'contributor-branch', fork.jobs, PR_NUMBER), true)
  assert.equal(verifiedRun({ ...fork.run, pull_requests: [{ number: 2 }] }, WORKFLOW_ID, 52, SOURCE, 'contributor-branch', fork.jobs, PR_NUMBER), false)
  assert.equal(verifiedRun({ ...fork.run, event: 'workflow_dispatch' }, WORKFLOW_ID, 52, SOURCE, 'contributor-branch', fork.jobs, PR_NUMBER), false)
})

test('latest failed rerun cannot fall back to an older successful run at the same head', async () => {
  const h = harness()
  await h.process()
  const { run, jobs } = h.ready()
  const failed: Run = { ...structuredClone(run), id: 502, run_attempt: 2, conclusion: 'failure' }
  h.state.runs = [run, failed]
  h.state.jobs.set(failed.id, [{ ...structuredClone(jobs[0]!), run_id: failed.id, run_attempt: 2, conclusion: 'failure' }])
  assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
  noMergeOrClose(h)
})

test('updated ref plus failed PR body patch recovers by proving exact generated data and preserves latest main', async () => {
  const h = harness()
  await h.process()
  const priorBody = h.state.pr!.body, priorHead = h.state.pr!.head.sha
  const concurrentRows = h.advanceMain(), currentMain = h.state.main
  h.state.failBodyPatch = 1
  await assert.rejects(h.process(), /github-write-outcome-unknown/)
  assert.notEqual(h.state.pr!.head.sha, priorHead)
  assert.equal(h.state.pr!.body, priorBody)
  assert.equal(parseIntakeMeta(h.state.pr!.body)?.baseSha, MAIN)
  assert.deepEqual(h.rows().slice(0, concurrentRows.length), concurrentRows)
  noMergeOrClose(h)
  const recoveredHead = h.state.pr!.head.sha
  h.ready()
  assert.equal(await h.process(), 'merged-and-closed')
  assert.equal(parseIntakeMeta(h.state.pr!.body)?.baseSha, currentMain)
  assert.equal(writesTo(h, `/git/refs/heads/${BRANCH}`).length, 1)
  assert.equal(writesTo(h, `/pulls/${PR_NUMBER}/merge`)[0]!.body.sha, recoveredHead)
  assert.deepEqual(h.rows(h.state.main).slice(0, concurrentRows.length), concurrentRows)
})

test('an orphan ref after uncertain PR creation is reused only when its entire generated contents match', async () => {
  const h = harness()
  h.state.failPrCreate = 1
  await assert.rejects(h.process(), /github-write-outcome-unknown/)
  assert.ok(h.state.ref)
  assert.equal(h.state.pr, undefined)
  const orphan = h.state.ref
  assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
  assert.equal(h.state.pr!.head.sha, orphan)
  assert.equal(writesTo(h, '/git/refs').length, 1)
  h.ready()
  assert.equal(await h.process(), 'merged-and-closed')
})

test('code-only main advancement regenerates an ancestry-preserving head and requires new CI despite identical data assets', async () => {
  const h = harness()
  await h.process()
  h.ready()
  const priorHead = h.state.pr!.head.sha, latestMain = h.advanceCode()
  assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
  assert.notEqual(h.state.pr!.head.sha, priorHead)
  assert.equal(parseIntakeMeta(h.state.pr!.body)?.baseSha, latestMain)
  assert.equal(h.commits.get(h.state.pr!.head.sha)!['src/trusted-main.ts'], h.commits.get(latestMain)!['src/trusted-main.ts'])
  assert.deepEqual(h.rows()[0], original)
  noMergeOrClose(h)
  h.ready()
  assert.equal(await h.process(), 'merged-and-closed')
  assert.equal(h.commits.get(h.state.main)!['src/trusted-main.ts'], 'export const trustedMain = true\n')
})

for (const failure of ['failMainDispatch', 'failClose'] as const) {
  test(`a successful merge followed by ${failure} resumes without a duplicate merge/comment`, async () => {
    const h = harness(), budget = structuredClone(h.state.comments[0])
    await h.process()
    h.ready()
    h.state[failure] = 1
    await assert.rejects(h.process(), /github-write-outcome-unknown/)
    assert.equal(h.state.pr!.merged, true)
    assert.equal(h.state.issue.state, 'open')
    assert.equal(await h.process(), 'merged-and-closed', failure)
    assert.equal(h.state.issue.state, 'closed')
    assert.equal(writesTo(h, `/pulls/${PR_NUMBER}/merge`).length, 1)
    assert.equal(writesTo(h, `/issues/${ISSUE_NUMBER}/comments`).length, 1)
    assert.ok(h.state.dispatches.includes('main'), 'Recovery must not silently omit the post-merge main validation')
    assert.deepEqual(h.state.comments[0], budget)
  })
}

test('main advancement or a changed PR head during CI never merges stale validated content', async () => {
  for (const change of ['main', 'head', 'draft'] as const) {
    const h = harness()
    await h.process()
    h.ready()
    h.state.afterJobs = () => {
      if (change === 'main') h.advanceMain()
      else if (change === 'head') h.rewrite((files) => { files['src/new.ts'] = 'late untrusted code' })
      else h.state.pr!.draft = true
    }
    assert.equal(await h.process(), change === 'main' ? 'main-advanced-retry' : 'pr-not-mergeable')
    noMergeOrClose(h)
  }
})

test('known included plus one new automatic keep closes only after all source Issue candidates exist at the merge commit', async () => {
  const h = harness()
  h.state.issue.body = 'https://github.com/test/old\nhttps://github.com/test/new'
  h.setReport([{ repo: 'test/old', status: 'included' }, initialKeep()])
  h.state.comments.pop()
  const budget = structuredClone(h.state.comments[0])
  assert.equal(await h.process(), `validating-pr-${PR_NUMBER}`)
  const meta = parseIntakeMeta(h.state.pr!.body)!
  assert.deepEqual(meta.approvals.map((approval) => approval.repo), ['test/new'])
  const addition = h.rows()[1]!
  assert.equal(addition.category, 'sdk')
  assert.equal(addition.sourceMeta.jevAbout, score.jevAbout)
  assert.equal(addition.sourceMeta.jevKeepConfidence, score.jevKeepConfidence)
  h.ready()
  assert.equal(await h.process(), 'merged-and-closed')
  assert.deepEqual(h.rows(h.state.main).map((row) => repoKey(row.url)), ['test/old', 'test/new'])
  assert.deepEqual(h.state.comments[0], budget)
})

test('a direct contributor PR consumes exact fork pull_request CI and never dispatches validation on the fork head', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => assert.fail('Contributor intake may not execute third-party code or call Jev'))
  const h = harness()
  h.contributor()
  const budget = structuredClone(h.state.comments[0])
  assert.equal(await h.process(), 'awaiting-exact-ci')
  assert.equal(h.state.writes.length, 0)
  const { run } = h.ready()
  assert.equal(run.event, 'pull_request')
  assert.equal(run.head_repository.id, 52)
  assert.deepEqual(run.pull_requests, [{ number: ISSUE_NUMBER }])
  run.pull_requests = []
  const head = h.state.pr!.head.sha
  assert.equal(await h.process(), 'merged-catalog-pr')
  assert.equal(writesTo(h, `/pulls/${ISSUE_NUMBER}/merge`)[0]!.body.sha, head)
  assert.deepEqual(h.state.dispatches, ['main'])
  assert.equal(writesTo(h, `/issues/${ISSUE_NUMBER}`).length, 0)
  assert.deepEqual(h.state.comments[0], budget)
})

test('a direct contributor PR rechecks the source commit after CI and rejects a changed source HEAD', async () => {
  const h = harness()
  h.contributor()
  h.ready()
  h.state.afterJobs = () => { h.state.sourceHead = 'b'.repeat(40) }
  await assert.rejects(h.process(), /intake-source-changed/)
  assert.equal(writesTo(h, `/pulls/${ISSUE_NUMBER}/merge`).length, 0)
  assert.equal(writesTo(h, `/issues/${ISSUE_NUMBER}`).length, 0)
  assert.equal(h.state.writes.length, 0)
})

test('an unprivileged later include command never replaces or cancels the earlier valid maintainer consent', async () => {
  const h = harness()
  await h.process()
  h.state.comments.push({ id: 24, body: '/jev include alternatives', created_at: '2026-10-04T10:02:00Z',
    updated_at: '2026-10-04T10:02:00Z', user: { login: 'visitor', type: 'User' } })
  h.ready()
  assert.equal(await h.process(), 'merged-and-closed')
  assert.equal(parseIntakeMeta(h.state.pr!.body)?.approvals[0]?.approvalCommentId, 23)
  assert.equal(parseIntakeMeta(h.state.pr!.body)?.approvals[0]?.approvedBy, 'maintainer')
})

test('post-merge validation ignores sync/skipped or wrong-origin main runs and reuses only the exact validate dispatch', async () => {
  for (const change of [{ display_title: 'Jev sync: main' }, { workflow_id: 100 }, { path: '.github/workflows/unrelated.yml' },
    { head_repository: { id: 52, full_name: 'contributor/awesome-jev' } }, {}]) {
    const h = harness()
    await h.process()
    h.ready()
    const head = sha([h.state.main, h.state.pr!.head.sha, 'squash'])
    const { run, jobs } = successCI(head, 'main')
    Object.assign(run, { id: 801, ...change })
    if (Object.keys(change).length) jobs[0]!.conclusion = 'skipped'
    h.state.runs.push(run)
    h.state.jobs.set(run.id, jobs)
    assert.equal(await h.process(), 'merged-and-closed')
    assert.equal(h.state.dispatches.filter((ref) => ref === 'main').length, Object.keys(change).length ? 1 : 0)
  }
})

test('contributor CI with a wrong PR association or a late non-main retarget cannot authorize merge', async () => {
  for (const wrongAssociation of [true, false]) {
    const h = harness()
    h.contributor()
    const { run } = h.ready()
    if (wrongAssociation) run.pull_requests = [{ number: 2 }]
    else h.state.afterJobs = () => { h.state.pr!.base.ref = 'release' }
    assert.equal(await h.process(), wrongAssociation ? 'awaiting-exact-ci' : 'pr-not-mergeable')
    assert.equal(h.state.writes.length, 0)
  }
  const h = harness()
  h.state.issue.title = 'A project request without a submission prefix'
  h.setReport()
  await h.process()
  h.ready()
  h.state.afterJobs = () => { h.state.issue.labels = [] }
  assert.equal(await h.process(), 'approval-changed')
  noMergeOrClose(h)
})

test('a genuine contributor review and CI cannot authorize forged previous repository redirects', async () => {
  const h = harness()
  h.contributor()
  h.rewrite((files) => {
    const rows = JSON.parse(files['data/github.json']) as DirectoryItem[]
    rows[1]!.sourceMeta.previousUrls = ['https://github.com/someone/innocent']
    Object.assign(files, catalogFiles(rows))
  })
  h.setReport()
  h.ready()
  await assert.rejects(h.process(), /intake-review-receipt-changed/)
  assert.equal(h.state.writes.length, 0)
})

test('a closed merged native contributor PR resumes an uncertain main dispatch without another merge', async () => {
  const h = harness()
  h.contributor()
  h.ready()
  h.state.failMainDispatch = 1
  await assert.rejects(h.process(), /github-write-outcome-unknown/)
  assert.equal(h.state.issue.state, 'closed')
  assert.equal(h.state.pr!.merged, true)
  assert.equal(await h.process(), 'recovered-main-validation')
  assert.equal(writesTo(h, `/pulls/${ISSUE_NUMBER}/merge`).length, 1)
  assert.deepEqual(h.state.dispatches, ['main'])
  await h.process()
  assert.deepEqual(h.state.dispatches, ['main'])
})

test('closed native recovery trusts only an actual bot merge into this repository main', async () => {
  for (const change of [(pr: Pull) => { pr.merged_by = { login: 'maintainer', type: 'User' } },
    (pr: Pull) => { pr.merged_by = { login: BOT.login, type: 'User' } }, (pr: Pull) => { pr.base.ref = 'release' },
    (pr: Pull) => { pr.base.repo.full_name = 'contributor/awesome-jev' }, (pr: Pull) => { pr.merge_commit_sha = 'invalid' }]) {
    const h = harness()
    h.contributor()
    h.ready()
    h.state.failMainDispatch = 1
    await assert.rejects(h.process(), /github-write-outcome-unknown/)
    change(h.state.pr!)
    const attempts = h.state.writes.length
    assert.equal(await h.process(), 'not-open-catalog-pr')
    assert.equal(h.state.writes.length, attempts)
  }
})
