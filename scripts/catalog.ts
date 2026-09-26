import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { isProjectCategory, reviewDecision } from './jev-client.ts'
import { isInclusionBasis } from '../src/lib/inclusion.ts'
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
    files.set(file, entriesFrom(parseJson(readFileSync(join(root, 'data', file), 'utf8'))))
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

export function validateRows(rows: unknown): asserts rows is DirectoryItem[] {
  if (!Array.isArray(rows)) throw new Error('Catalog must be an array')
  const ids = new Set<string>()
  const repos = new Set<string>()
  for (const candidate of rows) {
    if (!isRecord(candidate) || candidate.type !== 'github' ||
      !['id', 'title', 'summary', 'url'].every((key) => typeof candidate[key] === 'string' && candidate[key].trim()) ||
      !isRecord(candidate.sourceMeta)) {
      throw new Error('Invalid DirectoryItem')
    }
    const id = candidate.id as string
    const url = candidate.url as string
    const sourceMeta = candidate.sourceMeta
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
}

export function metadataOf(repo: GitHubRepository): CatalogSourceMeta {
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
  }
}

export function refreshRow<T extends DirectoryItem>(row: T, repo: GitHubRepository): T {
  // --- 只更新显示元数据；不重写人工摘要、标签与审查结论 ---
  if (repoKey(repo.html_url) !== repoKey(row.url)) throw new Error('Repository moved; manual review required')
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
      for (const key of ['stars', 'forks', 'language'] as const) {
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
