#!/usr/bin/env node
/**
 * Score directory rows with TypeSafe Jev (collector-only).
 * Reads TYPESAFE_API_KEY from the environment or `.env.local`.
 * Never import this from the Vite app.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluateJev } from './jev-client.mjs'
import { catalogFiles } from './catalog.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

type Keep = 'keep' | 'review' | 'drop'

interface DirectoryRow {
  id: string
  type: string
  title: string
  summary: string
  url: string
  sourceMeta?: Record<string, unknown>
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
  const key = apiKey()
  const limit = Number(arg('limit', '100000'))
  const force = process.argv.includes('--force')
  const dryRun = process.argv.includes('--dry-run')
  const concurrency = Math.max(1, Number(arg('concurrency', '4')))
  const only = arg('only', 'all') ?? 'all'
  if (!Number.isSafeInteger(limit) || limit < 1 || !Number.isSafeInteger(concurrency) || concurrency > 16) {
    throw new Error('limit must be a positive integer; concurrency must be 1..16')
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
