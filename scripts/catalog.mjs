import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { reviewDecision } from './jev-client.mjs'

// --- 固定来源边界：禁止旧分片悄悄回流，避免站点漏读新增数据 ---
export const catalogFiles = (root) => {
  if (readdirSync(join(root, 'data')).some((name) => /^(items|part-\d+)\.json$/.test(name))) {
    throw new Error('Legacy catalog shards must be migrated')
  }
  return ['github.json', 'youtube.json']
}

export function readCatalog(root) {
  const files = new Map(catalogFiles(root).map((file) => [file,
    JSON.parse(readFileSync(join(root, 'data', file), 'utf8'))]))
  const social = JSON.parse(readFileSync(join(root, 'data/x.json'), 'utf8'))
  for (const [file, entries] of [...files, ['x.json', social]]) {
    if (!Array.isArray(entries) || entries.some((row) => row?.type !== file.slice(0, -5))) {
      throw new Error(`Wrong source in ${file}`)
    }
  }
  const rows = [...files.values()].flat()
  validateRows([...rows, ...social])
  return { files, rows, social }
}

export function repoKey(url) {
  try {
    const u = new URL(url)
    if (u.origin !== 'https://github.com' || u.username || u.password || u.search || u.hash) return null
    const path = u.pathname.replace(/\/$/, '')
    return /^\/[\w.-]+\/[\w.-]+$/.test(path) ? path.slice(1).toLowerCase() : null
  } catch { return null }
}

export function validateRows(rows) {
  if (!Array.isArray(rows)) throw new Error('Catalog must be an array')
  const ids = new Set(), repos = new Set()
  for (const row of rows) {
    if (!row || !['github', 'x', 'youtube'].includes(row.type) ||
      !['id', 'title', 'summary', 'url'].every((key) => typeof row[key] === 'string' && row[key].trim()) ||
      !row.sourceMeta || typeof row.sourceMeta !== 'object' || Array.isArray(row.sourceMeta)) {
      throw new Error('Invalid DirectoryItem')
    }
    if (ids.has(row.id)) throw new Error(`Duplicate id: ${row.id}`)
    ids.add(row.id)
    const url = new URL(row.url)
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Unsafe catalog URL')
    if (row.tags !== undefined && (!Array.isArray(row.tags) || row.tags.some((t) => typeof t !== 'string'))) {
      throw new Error('Invalid tags')
    }
    if (row.type === 'github') {
      const key = repoKey(row.url)
      if (!key || typeof row.sourceMeta.repo !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(row.sourceMeta.repo)) {
        throw new Error(`Invalid repository: ${row.id}`)
      }
      if (repos.has(key)) throw new Error(`Duplicate repository: ${key}`)
      repos.add(key)
      for (const field of ['stars', 'forks', 'openIssues']) {
        const value = row.sourceMeta[field]
        if (value != null && (!Number.isSafeInteger(value) || value < 0)) throw new Error(`Invalid ${field}`)
      }
    }
  }
}

export function metadataOf(repo) {
  for (const field of ['stargazers_count', 'forks_count', 'open_issues_count']) {
    if (!Number.isSafeInteger(repo[field]) || repo[field] < 0) throw new Error('Invalid GitHub metadata')
  }
  return {
    stars: repo.stargazers_count, forks: repo.forks_count,
    openIssues: repo.open_issues_count, language: repo.language ?? null,
  }
}

export function refreshRow(row, repo) {
  // --- 只更新显示元数据；不重写人工摘要、标签、稳定 ID 和审查结论 ---
  if (repoKey(repo.html_url) !== repoKey(row.url)) throw new Error('Repository moved; manual review required')
  return { ...row, sourceMeta: { ...row.sourceMeta, ...metadataOf(repo) } }
}

export function candidateRow(repo, score) {
  const key = repoKey(repo.html_url)
  if (!key || key !== repo.full_name.toLowerCase() || repo.private || repo.fork || repo.archived) {
    throw new Error('Ineligible repository')
  }
  return {
    // 长度前缀避免 owner/name 中的连字符造成 ID 碰撞。
    id: `gh-${key.split('/')[0].length}-${key.replace('/', '-')}`,
    type: 'github', title: repo.name,
    summary: repo.description?.trim().slice(0, 500) || `${repo.name}: TypeSafe Jev ecosystem repository.`,
    tags: [...new Set(['jev', ...(repo.topics ?? []), repo.language?.toLowerCase()])]
      .filter((tag) => typeof tag === 'string' && /^[a-z0-9+# .-]{1,50}$/.test(tag)).slice(0, 8),
    url: repo.html_url,
    sourceMeta: { repo: repo.full_name, author: repo.owner.login, ...metadataOf(repo),
      date: repo.created_at?.slice(0, 10), ...score },
  }
}

const sections = [
  ['Official SDKs & skills', (r) => repoKey(r.url)?.split('/')[0] === 'typesafe-ai'],
  ['Awesome lists', (r) => /awesome/i.test(r.title) || r.tags?.includes('awesome')],
  ['Browser & computer use', (r) => /browser|computer-use|cdp/.test((r.tags ?? []).join(' '))],
  ['MCP, routers & adapters', (r) => /mcp|router|adapter/.test((r.tags ?? []).join(' '))],
  ['Research & benchmarks', (r) => /benchmark|research|evaluation|calibration/.test((r.tags ?? []).join(' '))],
  ['Libraries & SDKs', (r) => /sdk|library|api-client/.test((r.tags ?? []).join(' '))],
  ['Agents, demos & apps', (r) => /agent|demo|game|app/.test((r.tags ?? []).join(' '))],
  ['Tools & integrations', () => true],
]
const escapeMarkdown = (text) => String(text).replace(/[\r\n\t]+/g, ' ')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/[\\`*_{}[\]()!|]/g, '\\$&')

export function replaceRegion(text, name, content) {
  const start = `<!-- ${name}:START -->`, end = `<!-- ${name}:END -->`
  if (text.split(start).length !== 2 || text.split(end).length !== 2 || text.indexOf(end) < text.indexOf(start)) {
    throw new Error(`Missing or ambiguous README region: ${name}`)
  }
  return text.slice(0, text.indexOf(start) + start.length) + '\n' + content + '\n' + text.slice(text.indexOf(end))
}

export function renderReadme(text, rows) {
  validateRows(rows)
  const projects = rows.filter((r) => r.type === 'github')
  const groups = new Map(sections.map(([title]) => [title, []]))
  for (const row of projects) groups.get(sections.find(([, matches]) => matches(row))[0]).push(row)
  const body = [...groups].map(([title, group]) => {
    const lines = group.sort((a, b) => (b.sourceMeta.stars ?? 0) - (a.sourceMeta.stars ?? 0) ||
      a.sourceMeta.repo.localeCompare(b.sourceMeta.repo, 'en')).map((r) =>
      `- [**${escapeMarkdown(r.title)}**](${r.url}) - ${escapeMarkdown(r.summary)}${r.sourceMeta.language ? ` · ${escapeMarkdown(r.sourceMeta.language)}` : ''}`)
    return `## ${title}\n\n${lines.join('\n') || '_No projects yet._'}`
  }).join('\n\n')
  return replaceRegion(replaceRegion(text, 'PROJECTS', body), 'PROJECT_COUNT',
    `![Projects](https://img.shields.io/badge/projects-${projects.length}-10b981?style=classic)`)
}

export function syncReadme(root, { check = false } = {}) {
  const { rows } = readCatalog(root)
  const path = join(root, 'README.md')
  const before = readFileSync(path, 'utf8'), after = renderReadme(before, rows)
  if (check && after !== before) throw new Error('README is stale; run npm run readme:sync')
  if (!check && after !== before) writeFileSync(path, after)
  return rows.filter((r) => r.type === 'github').length
}

// --- 发布边界：快照不能删除旧数据、改人工编辑内容或修改非 GitHub 条目 ---
export function validateSnapshot(root, snapshot) {
  const current = readCatalog(root), next = readCatalog(snapshot)
  if (!isDeepStrictEqual([...current.files.keys()], [...next.files.keys()])) throw new Error('Unexpected source files')
  if (!isDeepStrictEqual(current.social, next.social)) throw new Error('X data changed')
  const oldById = new Map(current.rows.map((r) => [r.id, r]))
  for (const [file, rows] of current.files) {
    const after = next.files.get(file)
    if (after.length < rows.length) throw new Error('Catalog deletion')
    for (let i = 0; i < rows.length; i++) {
      const old = rows[i], fresh = after[i]
      if (old.type !== 'github') {
        if (!isDeepStrictEqual(old, fresh)) throw new Error('Non-GitHub data changed')
        continue
      }
      const expected = { ...old, sourceMeta: { ...old.sourceMeta } }
      for (const key of ['stars', 'forks', 'openIssues', 'language']) {
        if (Object.hasOwn(fresh.sourceMeta, key)) expected.sourceMeta[key] = fresh.sourceMeta[key]
      }
      if (!isDeepStrictEqual(expected, fresh)) throw new Error('Editorial data changed')
    }
    if (file !== 'github.json' && rows.length !== after.length) throw new Error('New rows must go into github.json')
  }
  for (const row of next.rows.filter((r) => !oldById.has(r.id))) {
    if (row.type !== 'github' || reviewDecision(row.sourceMeta) !== 'keep') throw new Error('Unreviewed addition')
  }
  const expected = renderReadme(readFileSync(join(root, 'README.md'), 'utf8'), next.rows)
  if (expected !== readFileSync(join(snapshot, 'README.md'), 'utf8')) throw new Error('Unexpected README changes')
  return next
}

export function applySnapshot(root, snapshot) {
  validateSnapshot(root, snapshot)
  // 所有输入先验证，之后才写入。state/latest 的结构由雷达 CLI 额外校验。
  for (const file of ['data/github.json'].concat(['README.md', 'radar/state.json', 'radar/latest.json'])) {
    const content = readFileSync(join(snapshot, file), 'utf8')
    if (content !== readFileSync(join(root, file), 'utf8')) writeFileSync(join(root, file), content)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const count = syncReadme(process.cwd(), { check: process.argv.includes('--check') })
  process.stdout.write(`Catalog valid: ${count} GitHub projects; README synchronized.\n`)
}
