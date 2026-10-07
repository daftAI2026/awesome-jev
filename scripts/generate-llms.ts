/**
 * [INPUT]: 依赖规范项目/新闻校验、共享分类/排名/路径与 Agents 文档契约
 * [OUTPUT]: 提供 buildAgentDocuments 与 generateLlms，生成互链 Markdown 和两份 TXT
 * [POS]: scripts 的构建期公开出口；只投影展示字段，不输出审计或本机数据
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readCatalog } from './catalog.ts'
import { validateNews } from './news-sync.ts'
import type { GitHubDirectoryItem } from './model-types.ts'
import { AGENT_DOCUMENTS, AGENT_SITE_NAME } from '../src/lib/agent-links.ts'
import { CATEGORIES, CATEGORY_LABEL, CATEGORY_DESCRIPTION } from '../src/lib/categories.ts'
import { en } from '../src/i18n/locales/en.ts'
import { LOCALES, localizedPath } from '../src/lib/locale-routes.ts'
import { newsPath, sortNews, type NewsItem } from '../src/lib/news.ts'
import { projectPathFromUrl } from '../src/lib/project-routes.ts'
import { githubStarRanks } from '../src/lib/sort.ts'
import { SITE_ORIGIN } from '../src/lib/share-image.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPOSITORY = 'https://github.com/daftAI2026/awesome-jev'
const SOURCE = 'https://raw.githubusercontent.com/daftAI2026/awesome-jev/main'
type DocumentName = typeof AGENT_DOCUMENTS[number]
const TITLES: Record<DocumentName, string> = {
  'index.md': 'Reading guide', 'categories.md': 'Categories', 'tags.md': 'Repository topics',
  'collections.md': 'Top 100 and local saved items', 'projects.md': 'GitHub projects',
  'news.md': 'Source-attributed news', 'submit.md': 'Submit a project', 'about.md': 'About and boundaries',
}

// --- 作者文字只作为文本，不允许变成 HTML、链接或文档结构 ---
function text(value: string): string {
  return value.replace(/\s+/gu, ' ').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('\\', '\\\\').replace(/([[\]()*_`#!|])/g, '\\$1').trim()
}

function link(label: string, url: string): string {
  const parsed = new URL(url)
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Unsafe public document URL')
  return `[${text(label)}](${parsed.href.replaceAll('(', '%28').replaceAll(')', '%29')})`
}

function siteLinks(label: string, path: string): string {
  return LOCALES.map((locale) => link(`${label} (${locale})`, `${SITE_ORIGIN}${localizedPath(path, locale)}`)).join(' · ')
}

function projectEntry(item: GitHubDirectoryItem): string {
  const path = projectPathFromUrl(item.url)
  if (!path) throw new Error(`Invalid public project URL: ${item.url}`)
  const details = [item.category, item.sourceMeta.language,
    item.sourceMeta.stars == null ? null : `${item.sourceMeta.stars} snapshot stars`].filter(Boolean).map((value) => text(String(value)))
  return [`### ${text(item.title)}`, siteLinks('Project', path),
    `${link('Repository', item.url)} · ${details.join(' · ')}`,
    `Author description: ${text(item.summary) || 'Unavailable.'}`,
    item.tags?.length ? `Repository topics: ${item.tags.map(text).join(', ')}` : '',
  ].filter(Boolean).join('\n\n')
}

export function buildAgentDocuments(projects: readonly GitHubDirectoryItem[], news: readonly NewsItem[]) {
  const ranks = githubStarRanks([...projects])
  const ranked = [...projects].sort((a, b) => ranks.get(a.id)! - ranks.get(b.id)!)
  const publicNews = sortNews(news.filter((item) => item.summary?.trim()))
  const navigation = [link('llms.txt', `${SITE_ORIGIN}/llms.txt`), link('llms-full.txt', `${SITE_ORIGIN}/llms-full.txt`),
    ...AGENT_DOCUMENTS.map((name) => link(TITLES[name], `${SITE_ORIGIN}/agents/${name}`))].join(' · ')
  const boundary = 'This is a free community directory, not an official TypeSafe product. Listing is not a security, compatibility or maintenance certification. Repository descriptions are author statements, not inclusion evidence. Independent alternatives do not imply Jev API compatibility or affiliation. Stars and news are build-time snapshots. Cite the original source and say explicitly when a document cannot be accessed.'
  const topics = new Map<string, GitHubDirectoryItem[]>()
  for (const item of ranked) {
    for (const tag of new Set(item.tags ?? [])) topics.set(tag, [...(topics.get(tag) ?? []), item])
  }
  const body: Record<DocumentName, string> = {
    'index.md': [en.documentDescription,
      `Snapshot: ${projects.length} GitHub projects; ${publicNews.length} news summaries.`,
      siteLinks('Directory', '/'), siteLinks('Top 100', '/top100'), siteLinks('News', '/news'),
      'Read categories for purpose, projects for author descriptions and repository links, news for attributed summaries, and submit for contribution instructions. The site supports English, Chinese and Japanese; machine documents preserve source text rather than invent translations.',
      boundary,
    ].join('\n\n'),
    'categories.md': CATEGORIES.map((category) => {
      const entries = ranked.filter((item) => item.category === category)
      return [`## ${text(en[CATEGORY_LABEL[category]])} (${entries.length})`,
        en[CATEGORY_DESCRIPTION[category]], siteLinks('Browse category', `/category/${category}`),
        ...entries.map((item) => `- ${link(item.title, `${SITE_ORIGIN}${projectPathFromUrl(item.url)}`)} · ${link('Repository', item.url)}`),
      ].join('\n\n')
    }).join('\n\n'),
    'tags.md': ['Tags are repository topics, not independently curated classifications. The site searches topics; there is no standalone tag route.',
      ...[...topics].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([tag, entries]) =>
        `## ${text(tag)} (${entries.length})\n\n${entries.map((item) => `- ${link(item.title, `${SITE_ORIGIN}${projectPathFromUrl(item.url)}`)}`).join('\n')}`),
    ].join('\n\n'),
    'collections.md': [siteLinks('Top 100', '/top100'),
      'Top 100 ranks the full directory by snapshot stars. Equal stars use title then stable ID. Rankings do not certify quality. Saved items are kept only in the reader’s browser; this document never exports personal favorites. There are no other curated collection pages.',
      ...ranked.slice(0, 100).map((item, index) => `${index + 1}. ${link(item.title, `${SITE_ORIGIN}${projectPathFromUrl(item.url)}`)} · ${item.sourceMeta.stars ?? 0} snapshot stars`),
    ].join('\n\n'),
    'projects.md': ['Author descriptions below remain separate from source-backed inclusion notes shown on project pages. Missing inclusion notes are unavailable, not inferred from scores.',
      ...ranked.map(projectEntry),
    ].join('\n\n'),
    'news.md': [siteLinks('News index', '/news'),
      'News pages contain source-attributed summaries, not full articles. Publication time is taken from the source when available. Items without summaries are excluded from this document.',
      ...publicNews.map((item) => {
        const path = newsPath(item.id)
        if (!path) throw new Error(`Invalid public news ID: ${item.id}`)
        return [`## ${text(item.title)}`, siteLinks('Summary page', path),
          `${link(item.sourceName, item.originalUrl)} · ${link('AIHOT', item.aihotUrl)}`,
          item.publishedAt ? `Source publication: ${text(item.publishedAt)}` : 'Source publication time unavailable.',
          text(item.summary!),
        ].join('\n\n')
      }),
    ].join('\n\n'),
    'submit.md': [link('Contribution rules', `${SOURCE}/CONTRIBUTING.md`),
      link('Submit a project', `${REPOSITORY}/issues/new?template=submit-project.yml`),
      'Sign in to GitHub and propose one repository per issue. Supply its purpose and concrete same-repository Jev / System One evidence. Independent typed-decision alternatives need license evidence. Check existing entries and open submissions first. Never submit credentials or private material.',
      'A suggestion is not automatic acceptance. Review and intake are separate. A current recommendation or explicit maintainer approval precedes an addition-only catalog PR and exact-version CI. See the contribution rules for the authoritative schema and procedure.',
    ].join('\n\n'),
    'about.md': [en.documentDescription, boundary,
      'Public features: project search, categories, star/date/name sorting, card/list views, project previews and detail pages, local saved items, source-attributed news, three languages and light/dark/system themes. No paid product, advertising tariff or chat API is introduced by these documents.',
      link('Source repository', REPOSITORY), link('Project catalog', `${SOURCE}/README.md`),
      'Chat buttons share only a fixed public question and document URLs. They do not send searches, favorites, tokens or hidden site data. Providers decide whether to use the q parameter; opening a link does not guarantee automatic submission. The Gemini-branded button opens Google AI Mode, not the Gemini App. Brand marks do not imply affiliation or endorsement.',
      'Machine documents are generated at build time from the same public snapshots as the site. They do not prove search-engine indexing or guarantee AI citations or GEO ranking.',
    ].join('\n\n'),
  }
  const documents = Object.fromEntries(AGENT_DOCUMENTS.map((name) => [name, [
    '<!--\n[INPUT]: 规范项目与新闻快照的公开展示字段\n[OUTPUT]: 互链机器阅读文档\n[POS]: public/agents 的构建产物；修改 scripts/generate-llms.ts 后重新生成\n[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md\n-->',
    `# ${AGENT_SITE_NAME}: ${TITLES[name]}`, navigation, body[name], '',
  ].join('\n\n').trimEnd() + '\n'])) as Record<DocumentName, string>
  const llms = [`# ${AGENT_SITE_NAME}`, `> ${en.documentDescription}`,
    `Snapshot: ${projects.length} GitHub projects; ${publicNews.length} news summaries.`,
    '## Public documents', ...AGENT_DOCUMENTS.map((name) => `- ${link(TITLES[name], `${SITE_ORIGIN}/agents/${name}`)}`),
    `- ${link('Full machine-readable text', `${SITE_ORIGIN}/llms-full.txt`)}`,
    '## Site', siteLinks('Directory', '/'), siteLinks('Top 100', '/top100'), siteLinks('News', '/news'),
    link('Source repository', REPOSITORY), '## Reading boundaries', boundary, '',
  ].join('\n\n').trimEnd() + '\n'
  const full = [llms, ...AGENT_DOCUMENTS.map((name) => documents[name])].join('\n\n').trimEnd() + '\n'
  return { documents, llms, full }
}

export function generateLlms(root = ROOT) {
  const projects = readCatalog(root).rows
  const news = validateNews(JSON.parse(readFileSync(join(root, 'data/news.json'), 'utf8')))
  const result = buildAgentDocuments(projects, news)
  mkdirSync(join(root, 'public/agents'), { recursive: true })
  for (const name of AGENT_DOCUMENTS) writeFileSync(join(root, 'public/agents', name), result.documents[name])
  writeFileSync(join(root, 'public/llms.txt'), result.llms)
  writeFileSync(join(root, 'public/llms-full.txt'), result.full)
  return result
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  generateLlms()
  process.stdout.write('Generated public Agents documents and llms text from current snapshots.\n')
}
