import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { CATEGORIES } from '../src/lib/categories.ts'
import { projectPathFromUrl } from '../src/lib/project-routes.ts'
import { localeAlternates, localizedPath } from '../src/lib/locale-routes.ts'

const SITE_ORIGIN = 'https://awesomejev.cc'
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

interface SitemapItem {
  type?: unknown
  url?: unknown
  summary?: unknown
  category?: unknown
}

export interface SitemapResult {
  xml: string
  urlCount: number
  projectCount: number
  categories: string[]
}

function xmlEscape(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
}

function isSitemapItem(value: unknown): value is SitemapItem {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Build deterministic index URLs; project pages without useful summaries stay out. */
export function buildSitemap(items: readonly unknown[], origin = SITE_ORIGIN): SitemapResult {
  const normalizedOrigin = new URL(origin).origin
  if (normalizedOrigin !== origin.replace(/\/$/, '')) throw new Error(`Invalid sitemap origin: ${origin}`)

  const projectPaths: string[] = []
  const pathSet = new Set<string>()
  const categorySet = new Set<string>()

  for (const value of items) {
    if (!isSitemapItem(value) || value.type !== 'github') continue

    const summary = typeof value.summary === 'string' ? value.summary.trim() : ''
    if (!summary) continue
    if (typeof value.url !== 'string') throw new Error('GitHub sitemap item is missing its URL')

    const path = projectPathFromUrl(value.url)
    if (!path) throw new Error(`Invalid GitHub repository URL in sitemap: ${value.url}`)
    if (pathSet.has(path)) throw new Error(`Duplicate canonical project route: ${path}`)
    pathSet.add(path)
    projectPaths.push(path)

    if (typeof value.category === 'string' && (CATEGORIES as readonly string[]).includes(value.category)) {
      categorySet.add(value.category)
    }
  }

  projectPaths.sort((a, b) => a.localeCompare(b))
  const categoryPaths = CATEGORIES
    .filter((category) => categorySet.has(category))
    .map((category) => `/category/${category}`)
  const englishPaths = ['/', '/top100', ...categoryPaths, ...projectPaths]
  const paths = [...englishPaths, ...englishPaths.map((path) => localizedPath(path, 'zh'))]
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...paths.flatMap((path) => [
      '  <url>',
      `    <loc>${xmlEscape(`${normalizedOrigin}${path}`)}</loc>`,
      ...localeAlternates(path, normalizedOrigin).map((alternate) =>
        `    <xhtml:link rel="alternate" hreflang="${alternate.hrefLang}" href="${xmlEscape(alternate.href)}" />`),
      '  </url>',
    ]),
    '</urlset>',
    '',
  ].join('\n')

  return { xml, urlCount: paths.length, projectCount: projectPaths.length, categories: categoryPaths.map((path) => path.slice('/category/'.length)) }
}

export function generateSitemap(root = ROOT): SitemapResult {
  const githubPath = join(root, 'data', 'github.json')
  const githubItems: unknown = JSON.parse(readFileSync(githubPath, 'utf8'))
  if (!Array.isArray(githubItems)) throw new Error(`${githubPath} must contain a JSON array`)

  const result = buildSitemap(githubItems)
  writeFileSync(join(root, 'public', 'sitemap.xml'), result.xml)
  return result
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = generateSitemap()
  console.log(`Generated sitemap with ${result.urlCount} URLs (${result.projectCount} projects, ${result.categories.length} categories).`)
}
