#!/usr/bin/env node
/**
 * Score directory rows with TypeSafe Jev (collector-only).
 * Reads TYPESAFE_API_KEY from the environment or `.env.local`.
 * Never import this from the Vite app.
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'
import { classifyProjects, evaluateJev, isProjectCategory } from './jev-client.ts'
import { catalogFiles, repoKey } from './catalog.ts'
import { createGitHubClient } from './github-client.ts'
import { githubEvidence } from './github-evidence.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

type Keep = 'keep' | 'review' | 'drop'

interface DirectoryRow {
  id: string
  type: string
  title: string
  summary: string
  url: string
  tags?: string[]
  category?: string
  sourceMeta?: Record<string, unknown>
}

async function classifyGithub(key: string, limit: number, force: boolean, dryRun: boolean, withReadme: boolean, onlyOther: boolean): Promise<void> {
  const path = join(root, 'data/github.json')
  const rows = JSON.parse(readFileSync(path, 'utf8')) as DirectoryRow[]
  const pending = rows.filter((row) => onlyOther
    ? row.category === 'other' && (force || !row.sourceMeta?.categoryEvidenceSha)
    : force || !isProjectCategory(row.category)).slice(0, limit)
  const counts: Record<string, number> = {}
  const api = withReadme ? createGitHubClient(process.env.GITHUB_TOKEN) : null
  let unavailable = 0
  let consecutiveForbidden = 0
  for (let start = 0; start < pending.length; start += 8) {
    const batch = pending.slice(start, start + 8)
    let categories: string[]
    const evidenceByIndex: Array<{ sha: string; url: string } | undefined> = new Array(batch.length)
    if (withReadme && api) {
      categories = new Array<string>(batch.length)
      await mapPool(batch, 1, async (row, index) => {
        try {
          const repo = repoKey(row.url)
          if (!repo) throw new Error('github-invalid-path')
          let evidence: Awaited<ReturnType<typeof githubEvidence>> | undefined
          for (let attempt = 0; attempt < 3; attempt++) {
            try { evidence = await githubEvidence(api, repo); break }
            catch (error) {
              if (!(error instanceof Error) || error.message !== 'github-network-or-timeout' || attempt === 2) throw error
              await sleep(1000 * 2 ** attempt)
            }
          }
          if (!evidence) throw new Error('github-network-or-timeout')
          categories[index] = (await evaluateJev(key, row, evidence.text)).category ?? 'other'
          evidenceByIndex[index] = { sha: evidence.sha, url: evidence.evidenceUrl }
          consecutiveForbidden = 0
        } catch (error) {
          if (!(error instanceof Error)) throw error
          if (error.message === 'jev-http-403') {
            consecutiveForbidden++
            if (consecutiveForbidden >= 3) throw error
            unavailable++
            categories[index] = row.category ?? 'other'
            return
          }
          if (!['github-http-404', 'github-invalid-readme', 'github-empty-readme', 'github-ineligible-repository', 'github-invalid-sha', 'github-network-or-timeout'].includes(error.message)) {
            throw error
          }
          unavailable++
          categories[index] = (await classifyProjects(key, [row]))[0]
          consecutiveForbidden = 0
        }
      })
    } else {
      categories = await classifyProjects(key, batch)
    }
    for (let i = 0; i < batch.length; i++) {
      const category = categories[i]
      counts[category] = (counts[category] ?? 0) + 1
      if (!dryRun) {
        batch[i].category = category
        const evidence = evidenceByIndex[i]
        if (evidence) batch[i].sourceMeta = { ...batch[i].sourceMeta, categoryEvidenceSha: evidence.sha, categoryEvidenceUrl: evidence.url }
      }
    }
    if (!dryRun) {
      const temporary = `${path}.${process.pid}.tmp`
      writeFileSync(temporary, `${JSON.stringify(rows, null, 2)}\n`)
      renameSync(temporary, path)
    }
    process.stdout.write(`Classified ${Math.min(start + batch.length, pending.length)}/${pending.length}\r`)
  }
  process.stdout.write('\n' + JSON.stringify({ classified: pending.length, unavailable, dryRun, categories: counts }, null, 2) + '\n')
}

interface ScoreResult {
  jevAbout: number
  jevKeep: Keep
  jevKeepConfidence: number
}

function loadDotEnv(path: string): void {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

function apiKey(): string {
  loadDotEnv(join(root, '.env.local'))
  loadDotEnv(join(root, '.env'))
  const key = process.env.TYPESAFE_API_KEY?.trim()
  if (!key) {
    console.error(`Missing TYPESAFE_API_KEY.

Put the key in a gitignored file at the repo root (do not paste it in chat):

  ${join(root, '.env.local')}

  TYPESAFE_API_KEY=your_key_here

Mint a key at https://console.typesafe.ai/settings/keys
This script is collector-only; the Vite site must never see the key.`)
    process.exit(1)
  }
  return key
}

function arg(name: string, fallback: string | undefined): string | undefined {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  if (hit) return hit.slice(prefix.length)
  const idx = process.argv.indexOf(`--${name}`)
  if (idx >= 0) return process.argv[idx + 1]
  return fallback
}

async function evaluate(key: string, row: DirectoryRow): Promise<ScoreResult> {
  return await evaluateJev(key, row) as ScoreResult
}

function applyScore(row: DirectoryRow, score: ScoreResult): void {
  row.sourceMeta = {
    ...(row.sourceMeta ?? {}),
    jevAbout: score.jevAbout,
    jevKeep: score.jevKeep,
    jevKeepConfidence: score.jevKeepConfidence,
  }
}

function alreadyScored(row: DirectoryRow): boolean {
  const meta = row.sourceMeta ?? {}
  return (
    typeof meta.jevAbout === 'number' &&
    (meta.jevKeep === 'keep' ||
      meta.jevKeep === 'review' ||
      meta.jevKeep === 'drop')
  )
}

async function mapPool<T>(
  items: T[],
  width: number,
  fn: (item: T, i: number) => Promise<void>,
): Promise<void> {
  let i = 0
  const workers = Array.from({ length: Math.min(width, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      await fn(items[idx], idx)
    }
  })
  await Promise.all(workers)
}

async function scoreFile(
  key: string,
  rel: string,
  opts: { limit: number; force: boolean; dryRun: boolean; concurrency: number },
): Promise<{ scored: number; skipped: number; keep: number; review: number; drop: number }> {
  const path = join(root, rel)
  const rows = JSON.parse(readFileSync(path, 'utf8')) as DirectoryRow[]
  const pending = rows.filter((row) => opts.force || !alreadyScored(row))
  const batch = pending.slice(0, opts.limit)
  const counts = { scored: 0, skipped: rows.length - batch.length, keep: 0, review: 0, drop: 0 }
  await mapPool(batch, opts.concurrency, async (row) => {
    const score = await evaluate(key, row)
    if (!opts.dryRun) applyScore(row, score)
    counts.scored += 1
    counts[score.jevKeep] += 1
    console.log(
      `${row.id} about=${score.jevAbout.toFixed(3)} keep=${score.jevKeep} conf=${score.jevKeepConfidence.toFixed(3)}`,
    )
  })
  if (!opts.dryRun && counts.scored > 0) {
    writeFileSync(path, `${JSON.stringify(rows, null, 2)}\n`)
  }
  return counts
}

async function main(): Promise<void> {
  const limit = Number(arg('limit', '100000'))
  const force = process.argv.includes('--force')
  const dryRun = process.argv.includes('--dry-run')
  const concurrency = Math.max(1, Number(arg('concurrency', '4')))
  const only = arg('only', 'all') ?? 'all'
  if (!Number.isSafeInteger(limit) || limit < 1 || !Number.isSafeInteger(concurrency) || concurrency > 16) {
    throw new Error('limit must be a positive integer; concurrency must be 1..16')
  }
  if (process.argv.includes('--check-categories')) {
    const rows = JSON.parse(readFileSync(join(root, 'data/github.json'), 'utf8')) as DirectoryRow[]
    const missing = rows.filter((row) => !isProjectCategory(row.category))
    if (missing.length) throw new Error(`${missing.length} GitHub projects lack a valid category`)
    process.stdout.write(`${rows.length} GitHub project categories valid\n`)
    return
  }
  const key = apiKey()
  if (process.argv.includes('--classify')) {
    await classifyGithub(key, limit, force, dryRun, process.argv.includes('--with-readme'), process.argv.includes('--only-other'))
    return
  }
  const opts = { limit, force, dryRun, concurrency }
  const itemFiles = catalogFiles(root).map((file: string) => `data/${file}`)
  if (!['all', 'items', 'github', 'youtube', 'x'].includes(only)) throw new Error('Unknown source selection')
  const files = only === 'all' ? [...itemFiles, 'data/x.json']
    : only === 'items' ? itemFiles : [`data/${only}.json`]
  let scored = 0
  let skipped = 0
  const tallies = { keep: 0, review: 0, drop: 0 }
  for (const file of files) {
    const r = await scoreFile(key, file, { ...opts, limit: Math.max(0, limit - scored) })
    scored += r.scored
    skipped += r.skipped
    tallies.keep += r.keep
    tallies.review += r.review
    tallies.drop += r.drop
  }
  console.log(
    JSON.stringify({ scored, skipped, dryRun, ...tallies }, null, 2),
  )
}

await main()
