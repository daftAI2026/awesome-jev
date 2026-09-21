import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { readCatalog, repoKey, refreshRow, candidateRow, renderReadme, applySnapshot } from './catalog.mjs'
import { createGitHubClient } from './github-client.mjs'
import { evaluateJev, reviewDecision, JEV_MODEL } from './jev-client.mjs'

export const QUERIES = [
  'topic:jev fork:false', '"typesafe.ai" in:readme fork:false',
  '"Jev" "System One" in:readme fork:false', 'topic:typesafe-ai fork:false',
  '"@typesafe-ai/sdk" in:readme fork:false', '"TypeSafe" "Jev" fork:false',
]
const MAX_QUEUE = 2000
const DAY = 86400000
export const emptyState = () => ({ version: 1, pages: {}, metadataCursor: 0, candidates: {} })

const isTimestamp = (value) => typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value))

export function validateState(state) {
  if (state?.version !== 1 || !state.pages || Array.isArray(state.pages) || typeof state.pages !== 'object' ||
    !state.candidates || typeof state.candidates !== 'object' || Array.isArray(state.candidates) ||
    !Number.isSafeInteger(state.metadataCursor) || state.metadataCursor < 0) throw new Error('Invalid radar state')
  if (Object.keys(state.candidates).length > MAX_QUEUE) throw new Error('Radar queue overflow')
  for (const page of Object.values(state.pages)) {
    if (!Number.isSafeInteger(page) || page < 1 || page > 10) throw new Error('Invalid search cursor')
  }
  for (const [repo, entry] of Object.entries(state.candidates)) {
    if (repoKey(`https://github.com/${repo}`) !== repo || !entry ||
      !['pending', 'review', 'error', 'drop'].includes(entry.status) ||
      !isTimestamp(entry.discoveredAt) ||
      (entry.checkedAt != null && !isTimestamp(entry.checkedAt)) ||
      (entry.retryAt != null && !isTimestamp(entry.retryAt)) ||
      !Number.isSafeInteger(entry.attempts) || entry.attempts < 0) throw new Error('Invalid candidate state')
  }
}

const safeReason = (error) => /^(github|jev)-[a-z0-9-]+$/.test(error?.message ?? '') ? error.message : 'candidate-invalid-evidence'

function evidenceIssue(repo, readme) {
  const text = `${repo.name}\n${repo.description ?? ''}\n${readme}`
  // --- 确定性前置门槛只负责保守分流，不把模型置信度当作安全证明 ---
  const provider = /typesafe\.ai\b|@typesafe-ai\/|github\.com\/typesafe-ai\/|\bTypeSafe AI\b/i.test(text)
  const subject = /\bjev\b|system[\s_-]?one/i.test(text)
  if (!provider || !subject) return 'insufficient-provider-context'
  if (/\b(?:ignore|disregard|override)\b.{0,60}\b(?:instructions|rules|system prompt)\b/i.test(text) ||
    /\b(?:always|must)\s+(?:return|respond|output)\s+["'`]*(?:keep|accepted)\b/i.test(text)) {
    return 'instruction-like-evidence'
  }
  return null
}

export async function runRadar({ catalog, state = emptyState(), api, review, now = new Date(), limit = 20, queries = QUERIES }) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 60) throw new Error('limit must be 1..60')
  validateState(state)
  state = structuredClone(state)
  const started = now.toISOString()
  const files = new Map([...catalog.files].map(([file, rows]) => [file, structuredClone(rows)]))
  const rows = [...files.values()].flat()
  const known = new Set(rows.filter((r) => r.type === 'github').map((r) => repoKey(r.url)))
  for (const key of Object.keys(state.candidates)) if (known.has(key)) delete state.candidates[key]
  const report = { at: started, model: JEV_MODEL, status: 'partial', sources: [],
    metadata: { ok: 0, failed: 0 }, reviewed: 0, added: 0, pending: 0, overflow: 0, evicted: 0, receipts: [] }

  const rejectedCache = Object.entries(state.candidates).filter(([, e]) => e.status === 'drop')
    .sort(([, a], [, b]) => (a.checkedAt ?? a.discoveredAt).localeCompare(b.checkedAt ?? b.discoveredAt))
    .map(([key]) => key)
  const evicted = new Set()

  // --- 每个查询每轮两页；游标轮转到第十页，显式报告 GitHub 搜索上限 ---
  for (const query of queries) {
    let page = state.pages[query] ?? 1
    const source = { query, fetched: 0, total: 0, status: 'bounded' }
    try {
      for (let n = 0; n < 2; n++) {
        const data = await api(`/search/repositories?q=${encodeURIComponent(query + ' is:public')}&per_page=100&page=${page}&sort=updated&order=desc`)
        if (!Array.isArray(data.items) || !Number.isSafeInteger(data.total_count) || data.total_count < 0) throw new Error('github-invalid-response')
        source.total = data.total_count
        source.fetched += data.items.length
        for (const repo of data.items) {
          const key = repoKey(repo.html_url)
          if (!key || repo.private || repo.fork || repo.archived || known.has(key) || evicted.has(key) || key === 'daftai2026/awesome-jev') continue
          if (!Object.hasOwn(state.candidates, key)) {
            if (Object.keys(state.candidates).length >= MAX_QUEUE) {
              const oldestDrop = rejectedCache.shift()
              if (!oldestDrop) { report.overflow++; continue }
              delete state.candidates[oldestDrop]
              evicted.add(oldestDrop)
              report.evicted++
            }
            state.candidates[key] = { status: 'pending', discoveredAt: started, attempts: 0 }
          }
        }
        const lastPage = Math.max(1, Math.min(10, Math.ceil(data.total_count / 100)))
        state.pages[query] = page >= lastPage ? 1 : page + 1
        source.status = data.incomplete_results ? 'partial' : data.total_count > 1000 ? 'search-cap' :
          page === 1 && data.items.length >= data.total_count ? 'complete' : 'bounded'
        if (page >= lastPage || data.items.length < 100) break
        page++
      }
    } catch (error) { source.status = safeReason(error) }
    report.sources.push(source)
  }

  // --- 全量刷新已有仓库；失败保持旧数据，单个失效仓库不拖垮整轮 ---
  const github = rows.filter((r) => r.type === 'github')
  for (const row of github) {
    try {
      const meta = await api(`/repos/${repoKey(row.url)}`)
      Object.assign(row, refreshRow(row, meta))
      report.metadata.ok++
    } catch (error) {
      report.metadata.failed++
      report.receipts.push({ repo: repoKey(row.url), status: 'metadata-error', reason: safeReason(error) })
    }
  }
  // 兼容旧版持久化状态；全量刷新不再使用轮转游标。
  state.metadataCursor = 0

  const batch = Object.entries(state.candidates)
    .filter(([, entry]) => !entry.retryAt || Date.parse(entry.retryAt) <= now.getTime())
    .sort(([a, x], [b, y]) => (x.checkedAt ?? x.discoveredAt).localeCompare(y.checkedAt ?? y.discoveredAt) || a.localeCompare(b))
    .slice(0, limit)
  for (const [key, entry] of batch) {
    entry.checkedAt = started
    entry.attempts++
    report.reviewed++
    try {
      const repo = await api(`/repos/${key}`)
      if (repo.private || repo.fork || repo.archived || repoKey(repo.html_url) !== key) throw new Error('github-ineligible-repository')
      const branch = await api(`/repos/${key}/commits/${encodeURIComponent(repo.default_branch)}`)
      if (!/^[a-f0-9]{40}$/.test(branch.sha)) throw new Error('github-invalid-sha')
      const readme = await api(`/repos/${key}/readme?ref=${branch.sha}`)
      if (readme.encoding !== 'base64' || typeof readme.content !== 'string' ||
        readme.content.length > 180000 || readme.size > 128000 || typeof readme.path !== 'string') throw new Error('github-invalid-readme')
      const text = Buffer.from(readme.content, 'base64').toString('utf8').slice(0, 12000)
      if (!text.trim()) throw new Error('github-empty-readme')
      const candidate = candidateRow(repo)
      const reason = evidenceIssue(repo, text)
      const score = reason ? undefined : await review(candidate, text)
      const decision = reason ? 'review' : reviewDecision(score)
      const receipt = { repo: key, status: decision, score, reason: reason ?? undefined, sha: branch.sha,
        evidenceUrl: `https://github.com/${key}/blob/${branch.sha}/${readme.path.split('/').map(encodeURIComponent).join('/')}`,
        evidenceSha256: createHash('sha256').update(text).digest('hex') }
      report.receipts.push(receipt)
      if (decision === 'keep') {
        if (rows.some((r) => r.id === candidate.id)) throw new Error('github-id-collision')
        Object.assign(candidate.sourceMeta, score)
        files.get('github.json').push(candidate)
        rows.push(candidate)
        known.add(key)
        delete state.candidates[key]
        report.added++
      } else {
        entry.status = decision
        entry.retryAt = new Date(now.getTime() + (decision === 'drop' ? 30 : 7) * DAY).toISOString()
      }
    } catch (error) {
      const reason = safeReason(error)
      entry.status = 'error'
      entry.retryAt = new Date(now.getTime() + Math.min(7, 2 ** Math.min(entry.attempts - 1, 3)) * DAY).toISOString()
      report.receipts.push({ repo: key, status: 'error', reason })
      // 鉴权/服务异常不继续耗用额度；其余未尝试候选仍保留在队列。
      if (reason.startsWith('jev-')) break
    }
  }
  report.pending = Object.values(state.candidates).filter((e) => e.status !== 'drop').length
  report.totalProjects = known.size
  report.status = report.sources.every((s) => s.status === 'complete') && !report.metadata.failed &&
    !report.pending && !report.overflow && !report.evicted && !report.receipts.some((r) => r.status === 'error') ? 'complete' : 'partial'
  validateState(state)
  return { files, rows, state, report }
}

export function writeSnapshot(root, output, result) {
  mkdirSync(join(output, 'data'), { recursive: true })
  mkdirSync(join(output, 'radar'), { recursive: true })
  for (const [file, rows] of result.files) {
    const before = readFileSync(join(root, 'data', file), 'utf8')
    const content = JSON.stringify(JSON.parse(before)) === JSON.stringify(rows) ? before : JSON.stringify(rows, null, 2) + '\n'
    writeFileSync(join(output, 'data', file), content)
  }
  copyFileSync(join(root, 'data/x.json'), join(output, 'data/x.json'))
  writeFileSync(join(output, 'README.md'), renderReadme(readFileSync(join(root, 'README.md'), 'utf8'), result.rows))
  writeFileSync(join(output, 'radar/state.json'), JSON.stringify(result.state, null, 2) + '\n')
  writeFileSync(join(output, 'radar/latest.json'), JSON.stringify(result.report, null, 2) + '\n')
}

async function main() {
  const root = process.cwd()
  if (process.argv[2] === '--apply') {
    const snapshot = resolve(process.argv[3] ?? '')
    validateState(JSON.parse(readFileSync(join(snapshot, 'radar/state.json'), 'utf8')))
    const report = JSON.parse(readFileSync(join(snapshot, 'radar/latest.json'), 'utf8'))
    if (!['complete', 'partial'].includes(report.status) || !Array.isArray(report.receipts)) throw new Error('Invalid report')
    applySnapshot(root, snapshot)
    return
  }
  // Action 显式传入 Secrets；绝不自动读取开发者的 .env.local。
  const key = process.env.TYPESAFE_API_KEY
  if (!key?.trim()) throw new Error('Configure repository Actions secret TYPESAFE_API_KEY first')
  const output = process.argv[2]
  if (!output || resolve(output) === root) throw new Error('Provide a separate snapshot output directory')
  const result = await runRadar({ catalog: readCatalog(root),
    state: JSON.parse(readFileSync(join(root, 'radar/state.json'), 'utf8')),
    api: createGitHubClient(process.env.GITHUB_TOKEN),
    review: (row, text) => evaluateJev(key, row, text),
    limit: Number(process.env.RADAR_LIMIT ?? 20),
  })
  writeSnapshot(root, resolve(output), result)
  const summary = `## Jev radar\n\nStatus: ${result.report.status}\n\nAdded: ${result.report.added}; reviewed: ${result.report.reviewed}; pending: ${result.report.pending}; metadata refreshed: ${result.report.metadata.ok}; metadata failed: ${result.report.metadata.failed}.\n`
  process.stdout.write(summary)
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1 })
}
