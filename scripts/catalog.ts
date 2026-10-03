/**
 * [INPUT]: 依赖规范目录 JSON、模型分类规则、收录依据、共享安全地址与 GitHub 身份基线校验
 * [OUTPUT]: 对外提供目录读取、运行时校验、容量发布门槛、README 渲染和受控快照应用
 * [POS]: scripts 的规范数据边界，守住人工编辑字段与自动发布权限
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { isProjectCategory, reviewDecision } from './jev-client.ts'
import { isInclusionBasis, isPinnedEvidenceUrl, pinnedSource } from '../src/lib/inclusion.ts'
import { projectPathFromUrl } from '../src/lib/project-routes.ts'
import { readGitHubIdentity, repositoryIdentity } from './github-identity.ts'
import type {
  Catalog,
  CatalogSourceMeta,
  DirectoryItem,
  GitHubDirectoryItem,
  GitHubRepository,
  ScoreInput,
} from './model-types.ts'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// --- 有界资源预算：同一规范快照也用于不可信 PR 的 base/head 读取 ---
export const MAX_CATALOG_FILE_BYTES = 16 * 1024 * 1024
export function catalogFileUsage(bytes: number): 'normal' | 'warning' | 'critical' | 'oversize' {
  if (!Number.isSafeInteger(bytes) || bytes < 0) throw new Error('Invalid catalog file size')
  return bytes > MAX_CATALOG_FILE_BYTES ? 'oversize' : bytes >= MAX_CATALOG_FILE_BYTES * 0.95 ? 'critical' :
    bytes >= MAX_CATALOG_FILE_BYTES * 0.9 ? 'warning' : 'normal'
}

const parseJson = (text: string): unknown => JSON.parse(text) as unknown

function entriesFrom(value: unknown): DirectoryItem[] {
  validateRows(value)
  return value
}

// --- 固定来源边界：禁止旧分片悄悄回流，避免站点漏读新增数据 ---
export const catalogFiles = (root: string): string[] => {
  if (readdirSync(join(root, 'data')).some((name) => /^(items|part-\d+|x|youtube)\.json$/.test(name))) {
    throw new Error('Unsupported catalog source or legacy shards')
  }
  return ['github.json']
}

export function readCatalog(root: string): Catalog {
  const files = new Map<string, DirectoryItem[]>()
  for (const file of catalogFiles(root)) {
    const bytes = readFileSync(join(root, 'data', file))
    if (catalogFileUsage(bytes.byteLength) === 'oversize') throw new Error('Catalog file too large; review the bounded catalog delivery design')
    files.set(file, entriesFrom(parseJson(bytes.toString('utf8'))))
  }
  const rows = [...files.values()].flat()
  validateRows(rows)
  return { files, rows }
}

export function repoKey(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.origin !== 'https://github.com' || parsed.username || parsed.password || parsed.search || parsed.hash) return null
    const path = parsed.pathname.replace(/\/$/, '')
    return /^\/[\w.-]+\/[\w.-]+$/.test(path) ? path.slice(1).toLowerCase() : null
  } catch {
    return null
  }
}

// --- 可选显示字段仍必须有真实类型；缺少收录说明不代表不合格 ---
function validDate(value: string, timestamp = false): boolean {
  const pattern = timestamp ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/ : /^\d{4}-\d{2}-\d{2}$/
  if (!pattern.test(value) || !Number.isFinite(Date.parse(value))) return false
  const canonical = new Date(value).toISOString()
  return timestamp ? canonical === (value.includes('.') ? value : value.replace('Z', '.000Z')) : canonical.slice(0, 10) === value
}
function validateScore(value: Record<string, unknown>): void {
  for (const key of ['jevAbout', 'jevKeepConfidence'] as const) {
    const score = value[key]
    if (score != null && (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1)) throw new Error(`Invalid ${key}`)
  }
  if (value.jevKeep != null && (typeof value.jevKeep !== 'string' || !['keep', 'review', 'drop'].includes(value.jevKeep))) throw new Error('Invalid jevKeep')
  for (const key of ['needsReview', 'conflictingEvidence'] as const) {
    if (value[key] !== undefined && typeof value[key] !== 'boolean') throw new Error(`Invalid ${key}`)
  }
  if (value.category !== undefined && !isProjectCategory(value.category)) throw new Error('Invalid score category')
}
function validateSourceFields(meta: Record<string, unknown>, url: string): void {
  if (meta.githubIdentity !== undefined && !readGitHubIdentity(meta.githubIdentity)) throw new Error('Invalid GitHub identity')
  for (const key of ['author', 'language'] as const) {
    if (meta[key] != null && typeof meta[key] !== 'string') throw new Error(`Invalid ${key}`)
  }
  if (meta.date != null && (typeof meta.date !== 'string' || !validDate(meta.date))) throw new Error('Invalid date')
  validateScore(meta)
  if (meta.jevEvidence != null) {
    const evidence = meta.jevEvidence
    if (!isRecord(evidence) || !isPinnedEvidenceUrl(evidence.evidenceUrl, url)) throw new Error('Invalid jevEvidence')
    if (evidence.repo !== undefined && (typeof evidence.repo !== 'string' || repoKey(`https://github.com/${evidence.repo}`) !== repoKey(url))) throw new Error('Invalid evidence repository')
    for (const [key, pattern] of [['sha', /^[a-f0-9]{40}$/], ['evidenceSha256', /^[a-f0-9]{64}$/]] as const) {
      if (evidence[key] !== undefined && (typeof evidence[key] !== 'string' || !pattern.test(evidence[key]))) throw new Error(`Invalid evidence ${key}`)
    }
    if (evidence.checkedAt !== undefined && (typeof evidence.checkedAt !== 'string' || !validDate(evidence.checkedAt, true))) throw new Error('Invalid evidence date')
    if (evidence.model !== undefined && (typeof evidence.model !== 'string' || !evidence.model.trim() || evidence.model.length > 120)) throw new Error('Invalid evidence model')
    if (evidence.status !== undefined && (typeof evidence.status !== 'string' || !['pending', 'review', 'keep', 'drop'].includes(evidence.status))) throw new Error('Invalid evidence status')
    if (evidence.score !== undefined) {
      if (!isRecord(evidence.score)) throw new Error('Invalid evidence score')
      validateScore(evidence.score)
    }
    if (evidence.evidenceLinks !== undefined && (!Array.isArray(evidence.evidenceLinks) || evidence.evidenceLinks.some((link) => {
      if (!isRecord(link) || typeof link.path !== 'string' || typeof link.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(link.sha256)) return true
      return pinnedSource(link.url, url)?.path !== link.path
    }))) throw new Error('Invalid evidence links')
  }
}

// --- 历史别名只在原身份不变时保留；新增/改名不能伪装成另一个仓库 ---
export function validateRepositoryIdentityChanges(rows: DirectoryItem[], baseline: DirectoryItem[]): void {
  const oldById = new Map(baseline.map((row) => [row.id, row]))
  for (const row of rows) {
    const old = oldById.get(row.id)
    const identity = readGitHubIdentity(old?.sourceMeta.githubIdentity)
    if (identity && identity.databaseId !== readGitHubIdentity(row.sourceMeta.githubIdentity)?.databaseId) {
      throw new Error(`GitHub identity changed: ${row.id}`)
    }
    if (old && old.url === row.url && old.sourceMeta.repo === row.sourceMeta.repo) continue
    if (typeof row.sourceMeta.repo !== 'string' || repoKey(`https://github.com/${row.sourceMeta.repo}`) !== repoKey(row.url)) {
      throw new Error(`Invalid repository identity: ${row.id}`)
    }
  }
}

export function validateRows(rows: unknown): asserts rows is DirectoryItem[] {
  if (!Array.isArray(rows)) throw new Error('Catalog must be an array')
  const ids = new Set<string>()
  const repos = new Set<string>()
  const githubIds = new Set<number>()
  const previousUrls = new Set<string>()
  for (const candidate of rows) {
    if (!isRecord(candidate) || candidate.type !== 'github' ||
      !['id', 'title', 'summary', 'url'].every((key) => typeof candidate[key] === 'string' && candidate[key].trim()) ||
      !isRecord(candidate.sourceMeta)) {
      throw new Error('Invalid DirectoryItem')
    }
    const id = candidate.id as string
    const url = candidate.url as string
    const sourceMeta = candidate.sourceMeta
    validateSourceFields(sourceMeta, url)
    const identity = readGitHubIdentity(sourceMeta.githubIdentity)
    if (identity) {
      if (githubIds.has(identity.databaseId)) throw new Error(`Duplicate GitHub identity: ${identity.databaseId}`)
      githubIds.add(identity.databaseId)
    }
    if (sourceMeta.previousUrls !== undefined) {
      if (!Array.isArray(sourceMeta.previousUrls)) throw new Error('Invalid previous repository URLs')
      for (const previous of sourceMeta.previousUrls) {
        const key = typeof previous === 'string' ? projectPathFromUrl(previous) : null
        if (!key || key === projectPathFromUrl(url) || previousUrls.has(key)) throw new Error('Invalid previous repository URLs')
        previousUrls.add(key)
      }
    }
    if (ids.has(id)) throw new Error(`Duplicate id: ${id}`)
    ids.add(id)
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'https:' || parsedUrl.username || parsedUrl.password) throw new Error('Unsafe catalog URL')
    if (candidate.tags !== undefined && (!Array.isArray(candidate.tags) || candidate.tags.some((tag) => typeof tag !== 'string'))) {
      throw new Error('Invalid tags')
    }
    if (candidate.category !== undefined && !isProjectCategory(candidate.category)) throw new Error(`Invalid category: ${id}`)
    const key = repoKey(url)
    if (!key || typeof sourceMeta.repo !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(sourceMeta.repo)) {
      throw new Error(`Invalid repository: ${id}`)
    }
    if (repos.has(key)) throw new Error(`Duplicate repository: ${key}`)
    repos.add(key)
    if (Object.hasOwn(sourceMeta, 'openIssues')) throw new Error('Legacy openIssues field')
    if (sourceMeta.inclusion !== undefined && !isInclusionBasis(sourceMeta.inclusion, url)) {
      throw new Error(`Invalid inclusion basis: ${id}`)
    }
    for (const field of ['stars', 'forks'] as const) {
      const value = sourceMeta[field]
      if (value != null && (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)) throw new Error(`Invalid ${field}`)
    }
  }
  if ([...repos].some((key) => previousUrls.has(projectPathFromUrl(`https://github.com/${key}`)!))) throw new Error('Previous URL collides with a published repository')
}

export function metadataOf(repo: GitHubRepository): CatalogSourceMeta {
  const identity = repositoryIdentity(repo)
  const stars = repo.stargazers_count
  const forks = repo.forks_count
  if (typeof stars !== 'number' || !Number.isSafeInteger(stars) || stars < 0 ||
    typeof forks !== 'number' || !Number.isSafeInteger(forks) || forks < 0) {
    throw new Error('Invalid GitHub metadata')
  }
  return {
    stars,
    forks,
    language: repo.language ?? null,
    ...(identity ? { githubIdentity: identity } : {}),
  }
}

export function refreshRow<T extends DirectoryItem>(row: T, repo: GitHubRepository): T {
  // --- 统计与 API 身份基线自动更新；公开地址、人工摘要与审查结论不变 ---
  if (repoKey(repo.html_url) !== repoKey(row.url)) throw new Error('Repository moved; manual review required')
  const identity = readGitHubIdentity(row.sourceMeta.githubIdentity)
  if (identity && identity.databaseId !== repositoryIdentity(repo)?.databaseId) throw new Error('github-identity-mismatch')
  return { ...row, sourceMeta: { ...row.sourceMeta, ...metadataOf(repo) } } as T
}

export function candidateRow(repo: GitHubRepository, score: ScoreInput = {}, { alternative = false }: { alternative?: boolean } = {}): GitHubDirectoryItem {
  const key = repoKey(repo.html_url)
  if (!key || key !== repo.full_name.toLowerCase() || repo.private || repo.fork || repo.archived) {
    throw new Error('Ineligible repository')
  }
  const tags = [...new Set([...(alternative ? [] : ['jev']), ...(repo.topics ?? []), repo.language?.toLowerCase()])]
    .filter((tag): tag is string => typeof tag === 'string' && /^[a-z0-9+# .-]{1,50}$/.test(tag)).slice(0, 8)
  return {
    id: `gh-${key.split('/')[0].length}-${key.replace('/', '-')}`,
    type: 'github',
    title: repo.name,
    summary: repo.description?.trim().slice(0, 500) || `${repo.name}: ${alternative ? 'independent typed-decision implementation' : 'TypeSafe Jev ecosystem repository'}.`,
    tags,
    category: score.category ?? 'other',
    url: repo.html_url,
    sourceMeta: {
      repo: repo.full_name,
      author: repo.owner.login,
      ...metadataOf(repo),
      date: repo.created_at?.slice(0, 10),
      ...score,
    },
  }
}

const sections: Array<[string, GitHubDirectoryItem['category']]> = [
  ['Agents & automation', 'agents'],
  ['Browser & computer use', 'browser'],
  ['SDKs & integrations', 'sdk'],
  ['Developer tools', 'developer'],
  ['Research & evaluation', 'research'],
  ['Learning & resources', 'resources'],
  ['Project directories', 'directories'],
  ['Apps & demos', 'applications'],
  ['Open-source alternatives', 'alternatives'],
  ['Other', 'other'],
]

const escapeMarkdown = (text: string): string => String(text).replace(/[\r\n\t]+/g, ' ')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/[\\`*_{}[\]()!|]/g, '\\$&')

// --- 语言标签使用行内代码；动态围栏防止远端反引号提前闭合 ---
const languageCode = (text: string): string => {
  const value = String(text).replace(/[\r\n\t]+/g, ' ').trim()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const runs = (value.match(/`+/g) ?? []).map((run) => run.length)
  const fence = '`'.repeat(1 + Math.max(0, ...runs))
  const padding = value.startsWith('`') || value.endsWith('`') ? ' ' : ''
  return `${fence}${padding}${value}${padding}${fence}`
}

export function replaceRegion(text: string, name: string, content: string): string {
  const start = `<!-- ${name}:START -->`, end = `<!-- ${name}:END -->`
  if (text.split(start).length !== 2 || text.split(end).length !== 2 || text.indexOf(end) < text.indexOf(start)) {
    throw new Error(`Missing or ambiguous README region: ${name}`)
  }
  return text.slice(0, text.indexOf(start) + start.length) + '\n' + content + '\n' + text.slice(text.indexOf(end))
}

export function renderReadme(text: string, rows: DirectoryItem[]): string {
  validateRows(rows)
  const projects = rows
  const groups = new Map<string, GitHubDirectoryItem[]>(sections.map(([title]) => [title, []]))
  for (const row of projects) {
    const section = sections.find(([, category]) => category === (row.category ?? 'other'))
    if (section) groups.get(section[0])?.push(row)
  }
  const renderRows = (group: GitHubDirectoryItem[]): string => group
    .sort((a, b) => (b.sourceMeta.stars ?? 0) - (a.sourceMeta.stars ?? 0) ||
      (a.sourceMeta.repo ?? '').localeCompare(b.sourceMeta.repo ?? '', 'en'))
    .map((row) => `- [**${escapeMarkdown(row.title)}**](${row.url}) - ${escapeMarkdown(row.summary)}${row.sourceMeta.language ? ` · ${languageCode(row.sourceMeta.language)}` : ''}`)
    .join('\n') || '_No projects yet._'
  const body = [...groups].map(([title, group]) => {
    const note = title === 'Project directories'
      ? 'These repositories maintain their own collections of Jev projects and resources. Their entries are not automatically imported into this catalog.\n\n'
      : ''
    return `## ${title}\n\n${note}${renderRows(group)}`
  }).join('\n\n')
  const badges = [
    '[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)',
    '[![Site](https://img.shields.io/badge/site-awesomejev.cc-000?style=classic)](https://awesomejev.cc)',
    `![Projects](https://img.shields.io/badge/projects-${projects.length}-10b981?style=classic)`,
    '[![Checks](https://github.com/daftAI2026/awesome-jev/actions/workflows/radar.yml/badge.svg?branch=main&event=push)](https://github.com/daftAI2026/awesome-jev/actions/workflows/radar.yml)',
    '[![Stars](https://img.shields.io/github/stars/daftAI2026/awesome-jev?style=classic)](https://github.com/daftAI2026/awesome-jev/stargazers)',
    '[![Last Update](https://img.shields.io/github/last-commit/daftAI2026/awesome-jev?label=Last%20update&style=classic)](https://github.com/daftAI2026/awesome-jev/commits/main)',
  ].join(' ')
  return replaceRegion(replaceRegion(text, 'PROJECTS', body), 'PROJECT_COUNT', badges)
}

export function syncReadme(root: string, { check = false }: { check?: boolean } = {}): number {
  const { rows } = readCatalog(root)
  if (check) {
    const bytes = readFileSync(join(root, 'data/github.json')).byteLength
    const usage = catalogFileUsage(bytes)
    // --- 提前阻止发布，保留读取/迁移所需余量；不是等到安全读上限才停机 ---
    if (usage === 'critical') {
      throw new Error(`Catalog publication capacity reached (${(100 * bytes / MAX_CATALOG_FILE_BYTES).toFixed(1)}% of ${MAX_CATALOG_FILE_BYTES} bytes); migrate to versioned bounded shards before publishing and retain 5% read-limit headroom.`)
    }
    if (usage === 'warning') {
      const message = `Catalog file is ${(100 * bytes / MAX_CATALOG_FILE_BYTES).toFixed(1)}% of the bounded ${MAX_CATALOG_FILE_BYTES}-byte submission limit (${usage}); plan the next catalog delivery boundary.`
      process.stderr.write(process.env.GITHUB_ACTIONS === 'true' ? `::warning file=data/github.json::${message}\n` : `${message}\n`)
    }
  }
  if (check && rows.some((row) => !isProjectCategory(row.category))) {
    throw new Error('GitHub project category missing; run npm run categories:classify')
  }
  const path = join(root, 'README.md')
  const before = readFileSync(path, 'utf8')
  const after = renderReadme(before, rows)
  if (check && after !== before) throw new Error('README is stale; run npm run readme:sync')
  if (!check && after !== before) writeFileSync(path, after)
  return rows.length
}

// --- 发布边界：快照不能删除旧数据或改写人工编辑内容 ---
export function validateSnapshot(root: string, snapshot: string): Catalog {
  const current = readCatalog(root)
  const next = readCatalog(snapshot)
  validateRepositoryIdentityChanges(next.rows, current.rows)
  if (!isDeepStrictEqual([...current.files.keys()], [...next.files.keys()])) throw new Error('Unexpected source files')
  const oldById = new Map(current.rows.map((row) => [row.id, row]))
  for (const [file, rows] of current.files) {
    const after = next.files.get(file)
    if (!after || after.length < rows.length) throw new Error('Catalog deletion')
    for (let i = 0; i < rows.length; i++) {
      const old = rows[i]
      const fresh = after[i]
      if (!old || !fresh) throw new Error('Catalog deletion')
      const editorial: Record<string, unknown> = { ...old.sourceMeta }
      for (const key of ['stars', 'forks', 'language', 'githubIdentity'] as const) {
        if (Object.hasOwn(fresh.sourceMeta, key)) editorial[key] = fresh.sourceMeta[key]
      }
      const expected: GitHubDirectoryItem = { ...old, sourceMeta: editorial }
      if (!isDeepStrictEqual(expected, fresh)) throw new Error('Editorial data changed')
    }
  }
  for (const row of next.rows.filter((item) => !oldById.has(item.id))) {
    if (reviewDecision(row.sourceMeta) !== 'keep') throw new Error('Unreviewed addition')
  }
  const expected = renderReadme(readFileSync(join(root, 'README.md'), 'utf8'), next.rows)
  if (expected !== readFileSync(join(snapshot, 'README.md'), 'utf8')) throw new Error('Unexpected README changes')
  return next
}

export function applySnapshot(root: string, snapshot: string, files = ['data/github.json', 'README.md', 'radar/state.json', 'radar/latest.json']): void {
  validateSnapshot(root, snapshot)
  // 所有输入先验证，之后才写入。state/latest 的结构由雷达 CLI 额外校验。
  for (const file of files) {
    const content = readFileSync(join(snapshot, file), 'utf8')
    if (content !== readFileSync(join(root, file), 'utf8')) writeFileSync(join(root, file), content)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const count = syncReadme(process.cwd(), { check: process.argv.includes('--check') })
  process.stdout.write(`Catalog valid: ${count} GitHub projects; README synchronized.\n`)
}
