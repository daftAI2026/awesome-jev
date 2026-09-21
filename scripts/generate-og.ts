#!/usr/bin/env node
/**
 * Build-time OG generator. GitHub count comes from every catalog shard
 * (same rule as src/lib/counts.ts) — never hardcode the number.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readCatalog } from './catalog.mjs'

interface DirectoryRow {
  type?: string
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const items = readCatalog(root).rows as DirectoryRow[]
const github = items.reduce((n, it) => n + (it.type === 'github' ? 1 : 0), 0)
const banner = readFileSync(join(root, 'scripts/awesome-jev-banner.txt'), 'utf8')
  .split(/\n/)
  .filter((ln, i, arr) => ln.trim().length > 0 || i < arr.length - 1)
  .filter((ln) => ln.trim().length > 0)

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const lines: string[] = []
lines.push('<?xml version="1.0" encoding="UTF-8"?>')
lines.push(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">',
)
lines.push('<rect width="1200" height="630" fill="#0a0a0a"/>')
lines.push(
  '<g fill="#f5f5f5" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" font-size="10.5" xml:space="preserve">',
)
let y = 96
for (const ln of banner) {
  lines.push(`<text x="40" y="${y}">${esc(ln)}</text>`)
  y += 16
}
lines.push('</g>')
lines.push(
  '<text x="40" y="420" fill="#a3a3a3" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif" font-size="22">TypeSafe System One · Jev</text>',
)
lines.push(
  `<text x="40" y="470" fill="#fafafa" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif" font-size="28" font-weight="600">${github} GitHub projects</text>`,
)
lines.push(
  '<text x="40" y="580" fill="#737373" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif" font-size="16">awesomejev.cc</text>',
)
lines.push('</svg>')
writeFileSync(join(root, 'public/og.svg'), lines.join('\n') + '\n')
console.log(`og.svg written · ${github} GitHub projects`)
try {
  const { execFileSync } = await import('node:child_process')
  execFileSync(
    'rsvg-convert',
    [
      '-w',
      '1200',
      '-h',
      '630',
      join(root, 'public/og.svg'),
      '-o',
      join(root, 'public/og.png'),
    ],
    { stdio: 'inherit' },
  )
  console.log('og.png written via rsvg-convert')
} catch {
  console.log(
    'rsvg-convert unavailable; public/og.svg is the source of truth — keep an existing og.png or install librsvg',
  )
}
