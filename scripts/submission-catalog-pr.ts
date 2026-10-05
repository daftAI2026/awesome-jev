/**
 * [INPUT]: 依赖固定版本 GitHub 读取、规范目录追加门与 README/sitemap 生成器
 * [OUTPUT]: 提供完整纯投稿 PR 范围验证及新增目录行
 * [POS]: scripts 的正负向 PR 共用安全边界；夹带源码、旧行编辑或手改生成资产均不进入自动处理
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { GitHubApi } from './model-types.ts'
import { renderReadme } from './catalog.ts'
import { buildSitemap } from './generate-sitemap.ts'
import { assertIntakeFiles, intakeAdditions } from './submission-intake-policy.ts'
import { jsonAt } from './submission-review.ts'
import { pages, textAt, PREFIX } from './submission-github.ts'

export async function assertCatalogPrFiles(api: GitHubApi, number: number): Promise<void> {
  const files = await pages<Record<string, any>>(api, `${PREFIX}/pulls/${number}/files`)
  assertIntakeFiles(files.map((f) => f.filename))
  if (files.some((f) => f.status === 'removed' || f.status === 'renamed')) throw new Error('intake-file-deletion')
}
export async function catalogPrAdditions(api: GitHubApi, pr: { number?: number; head: { sha: string } }, base: string, scopeChecked = false) {
  if (!scopeChecked) await assertCatalogPrFiles(api, pr.number!)
  const before = await jsonAt(api, 'data/github.json', base)
  const after = await jsonAt(api, 'data/github.json', pr.head.sha)
  const additions = intakeAdditions(before, after)
  if (await textAt(api, 'README.md', pr.head.sha) !== renderReadme(await textAt(api, 'README.md', base), after)) throw new Error('intake-readme-modified')
  const news = JSON.parse(await textAt(api, 'data/news.json', base))
  if (await textAt(api, 'public/sitemap.xml', pr.head.sha) !== buildSitemap(after, 'https://awesomejev.cc', news).xml) throw new Error('intake-sitemap-modified')
  return additions
}
