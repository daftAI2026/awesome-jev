/**
 * [INPUT]: 依赖网站投稿链接、GitHub 表单文件、三语言文案和既有审核事件工具
 * [OUTPUT]: 对外提供投稿入口与机器人识别契约的离线回归检查
 * [POS]: scripts 的投稿连接护栏；不创建真实 Issue，不调用付费审核
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { eventTargets, REPOSITORY, repositoryLinks, submissionInput } from './submission-review.ts'
import { en } from '../src/i18n/locales/en.ts'
import { zh } from '../src/i18n/locales/zh.ts'
import { ja } from '../src/i18n/locales/ja.ts'

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const href = app.match(/href="(https:\/\/github\.com\/[^" ]+\/issues\/new\?template=[^" ]+)"/)?.[1]
assert.ok(href, 'Header needs a direct project submission link')
const url = new URL(href)
const template = url.searchParams.get('template')!
const form = readFileSync(new URL(`../.github/ISSUE_TEMPLATE/${template}`, import.meta.url), 'utf8')
const title = form.match(/^title: "([^"]+)"$/m)?.[1]

test('header submission link selects the installed form in the correct repository', () => {
  assert.equal(url.pathname, `/${REPOSITORY}/issues/new`)
  assert.equal(template, 'submit-project.yml')
  assert.ok(app.includes("aria-label={t('submitProject')}"))
  for (const messages of [en, zh, ja]) assert.ok(messages.submitProject.trim())
  for (const field of ['repository', 'description', 'relevance', 'checks']) {
    assert.ok(form.includes(`id: ${field}`))
  }
  assert.doesNotMatch(form, /^labels:/m, 'Recognition must not depend on a pre-created label')
})

test('form title triggers existing Issue review without labels or API calls', async () => {
  assert.equal(title, '[Submission] ')
  const targets = await eventTargets(async () => {
    throw new Error('Automatic Issue recognition must not make an API call')
  }, 'issues', {
    repository: { full_name: REPOSITORY }, action: 'opened',
    issue: { number: 42, state: 'open', title: `${title}Example`, labels: [] },
  })
  assert.deepEqual(targets, [{ number: 42, manual: false }])
})

test('filled form and same-repository evidence produce one review candidate', async () => {
  const body = `### GitHub repository / 仓库地址
https://github.com/example/jev-demo

### Project description / 项目简介
A demo using typed decisions.

### Jev / System One connection / 关联证据
Uses Jev in https://github.com/example/jev-demo/blob/main/README.md

### Before submitting / 提交前确认
- [x] Checked duplicates.`
  assert.deepEqual(repositoryLinks(body), ['example/jev-demo'])
  const input = await submissionInput(async () => {
    throw new Error('Issue candidate extraction must not make an API call')
  }, { number: 42, title: `${title}Example`, body })
  assert.deepEqual(input.keys, ['example/jev-demo'])
})
