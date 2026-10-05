/**
 * [INPUT]: 依赖收录控制器、目录生成器与 GitHub REST 形状
 * [OUTPUT]: 提供无网络、固定 Git 对象的共享收录状态机与可信报告样本
 * [POS]: scripts 的收录测试夹具；测试文件共享不可变提交与权限/CI 替身，不赋予线上权限
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { candidateRow, renderReadme, repoKey } from './catalog.ts'
import { buildSitemap } from './generate-sitemap.ts'
import { processIntake, type IntakeOptions } from './submission-intake.ts'
import { REPOSITORY, renderReport, repositoryLinks, reportLanguage, submissionFingerprint, type SubmissionResult } from './submission-review.ts'
import type { DirectoryItem, GitHubRepository, JevScore } from './model-types.ts'

export const PREFIX = `/repos/${REPOSITORY}`
export const BOT = { login: 'github-actions[bot]', type: 'Bot' }
export const WORKFLOW_ID = 99, REPOSITORY_ID = 42, SOURCE_ID = 71
export const ISSUE_NUMBER = 8, PR_NUMBER = 30
export const MAIN = '1'.repeat(40), SOURCE = 'a'.repeat(40)
export const BRANCH = `jev-intake/issue-${ISSUE_NUMBER}`
export const STEPS = ['Install locked dependencies', 'Verify new or edited rationale quotes at pinned sources', 'Verify catalog and delivery']
export const sha = (value: unknown) => createHash('sha1').update(JSON.stringify(value)).digest('hex')
export type Files = Record<string, string>
export type Mutation = { path: string; method: string; body: Record<string, unknown> }
export interface Comment { id: number; body: string; created_at: string; updated_at: string; user: { login: string; type: string } }
export interface Issue { number: number; title: string; body: string; state: string; user: { login: string }; labels: { name: string }[]; pull_request?: unknown }
export interface Pull { number: number; body: string; state: string; draft: boolean; mergeable: boolean; merged: boolean; merge_commit_sha?: string;
  merged_by?: { login: string; type: string }; user: { login: string; type: string };
  head: { sha: string; ref: string; repo: { id: number; full_name: string } }; base: { sha: string; ref: string; repo: { id: number; full_name: string } } }
export interface Run { id: number; workflow_id: number; path: string; event: string; display_title: string; head_sha: string; head_branch: string;
  head_repository: { id: number; full_name: string }; status: string; conclusion: string | null; run_attempt: number; pull_requests: { number: number }[] }
export interface Job { id: number; name: string; run_id: number; run_attempt: number; status: string; conclusion: string | null;
  steps: { name: string; number: number; status: string; conclusion: string | null }[] }

export const original: DirectoryItem = { id: 'gh-old', type: 'github', title: 'old', summary: 'The maintainer keeps this original description.',
  category: 'resources', url: 'https://github.com/test/old', sourceMeta: { repo: 'test/old', stars: 9,
    githubIdentity: { databaseId: 41, nodeId: 'R_41' }, inclusion: { text: { en: 'A documented Jev tutorial.', zh: '有明确文档的 Jev 教程。', ja: 'Jev の利用を説明する資料。' },
      evidence: [{ url: `https://github.com/test/old/blob/${'9'.repeat(40)}/README.md`, quote: 'A documented Jev tutorial.' }],
      checkedAt: '2026-10-01T00:00:00Z', reviewer: 'manual review' } } }
export const score: JevScore = { jevAbout: 0.96, jevKeep: 'keep', jevKeepConfidence: 0.97, category: 'sdk' }
export const deepReview = (): SubmissionResult => ({ repo: 'test/new', status: 'review', reason: 'insufficient-usage-evidence', deep: true,
  progress: { checked: 78, total: 78, excluded: 4, blocked: 0, inventoryComplete: true },
  evidence: `https://github.com/test/new/tree/${SOURCE}`, evidenceLinks: [`https://github.com/test/new/blob/${SOURCE}/src/head.py#L1-L9`] })
export const initialKeep = (): SubmissionResult => ({ repo: 'test/new', status: 'keep', score: { ...score }, evidence: `https://github.com/test/new/blob/${SOURCE}/README.md` })
export const template = '# Directory\n<!-- PROJECT_COUNT:START -->\n<!-- PROJECT_COUNT:END -->\n\n<!-- PROJECTS:START -->\n<!-- PROJECTS:END -->\n'

export function catalogFiles(rows: DirectoryItem[], readme = template): Files {
  return { 'data/github.json': JSON.stringify(rows, null, 2) + '\n', 'README.md': renderReadme(readme, rows),
    'data/news.json': '[]\n', 'public/sitemap.xml': buildSitemap(rows, 'https://awesomejev.cc', []).xml }
}

export function successCI(head: string, branch = BRANCH, event = 'workflow_dispatch', repositoryId = REPOSITORY_ID, number?: number): { run: Run; jobs: Job[] } {
  const run: Run = { id: 501, workflow_id: WORKFLOW_ID, path: '.github/workflows/radar.yml', event, head_sha: head, head_branch: branch,
    display_title: `Jev validate: ${branch}`,
    head_repository: { id: repositoryId, full_name: REPOSITORY }, status: 'completed', conclusion: 'success', run_attempt: 1,
    pull_requests: number ? [{ number }] : [] }
  return { run, jobs: [{ id: 601, name: 'verify', run_id: run.id, run_attempt: run.run_attempt, status: 'completed', conclusion: 'success',
    steps: ['Set up job', 'Run actions/checkout@pinned', 'Run actions/setup-node@pinned', ...STEPS, 'Complete job']
      .map((name, index) => ({ name, number: index + 1, status: 'completed', conclusion: 'success' })) }] }
}

// --- Git 对象一经建立不再改写；攻击与并发修改通过新提交产生新的 head ---
export function harness() {
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

