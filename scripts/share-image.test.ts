/**
 * [INPUT]: 依赖 Node test、共享图片身份和本地化 head，不读取网络/完整快照
 * [OUTPUT]: 对外提供计数/内容版本和 OG/Twitter 元数据契约验证
 * [POS]: scripts 的分享地址护栏，生成器与路由使用同一纯工具
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { imageText, projectShareImage, shareImageMeta, siteShareImage, SITE_ORIGIN } from '../src/lib/share-image.ts'
import { localizedHead } from '../src/lib/locale-head.ts'

const project = { url: 'https://github.com/Owner/Shared', title: 'Shared project', summary: 'A typed decision tool' }

test('complete counts above 2000 change site image identities without a fixed count', () => {
  const first = siteShareImage(2199)
  const second = siteShareImage(2301)
  assert.match(first.alt, /2199 GitHub projects/)
  assert.match(second.alt, /2301 GitHub projects/)
  assert.notEqual(first.path, second.path)
  assert.deepEqual(siteShareImage(2199), first)
  for (const count of [-1, 1.5, NaN]) assert.throws(() => siteShareImage(count))
})

test('project identities distinguish owners, version text and normalize repository aliases', () => {
  const image = projectShareImage(project)
  assert.match(image.path, /^\/api\/og\/projects\/owner\/shared\?v=[a-f0-9]{16}$/)
  assert.equal(projectShareImage({ ...project, url: 'https://github.com/owner/shared.git' }).path, image.path)
  assert.notEqual(projectShareImage({ ...project, url: 'https://github.com/Other/shared' }).path, image.path)
  assert.notEqual(projectShareImage({ ...project, title: 'Renamed project' }).path, image.path)
  assert.notEqual(projectShareImage({ ...project, summary: 'New description' }).path, image.path)
  assert.equal(projectShareImage({ ...project, summary: ' A typed   decision tool\n' }).path, image.path)
  for (const url of ['https://github.com/owner/../shared', 'https://evil.example/owner/shared', 'https://github.com/owner/%2fetc']) assert.throws(() => projectShareImage({ ...project, url }))
})

test('localized project head emits a complete coherent OG and Twitter image group', () => {
  const image = projectShareImage(project)
  for (const locale of ['en', 'zh', 'ja'] as const) {
    const head = localizedHead({ path: '/projects/owner/shared', locale, title: project.title, description: project.summary, type: 'article', image })
    const tags = new Map(head.meta.map((entry) => ['property' in entry ? entry.property : 'name' in entry ? entry.name : 'title', 'content' in entry ? entry.content : entry.title]))
    assert.equal(tags.get('og:image'), `${SITE_ORIGIN}${image.path}`)
    assert.equal(tags.get('og:image:secure_url'), tags.get('og:image'))
    assert.equal(tags.get('twitter:image'), tags.get('og:image'))
    assert.equal(tags.get('og:image:alt'), image.alt)
    assert.equal(tags.get('twitter:image:alt'), image.alt)
    assert.equal(tags.get('og:image:width'), '1200')
    assert.equal(tags.get('og:image:height'), '630')
    assert.equal(tags.get('og:image:type'), 'image/png')
    assert.equal(tags.get('twitter:card'), 'summary_large_image')
    assert.equal(tags.get('twitter:title'), tags.get('og:title'))
    assert.equal(tags.get('twitter:description'), tags.get('og:description'))
    assert.equal(tags.get('og:url'), head.links[0].href)
    assert.equal(head.meta.length, tags.size)
  }
  assert.equal(shareImageMeta(image).length, 9)
})

test('image text preserves Unicode while removing invalid XML controls and malformed surrogates', () => {
  assert.equal(imageText(' 判断\n工具\u0000 \ud800 '), '判断 工具 �')
  assert.equal(imageText('项目 😀'), '项目 😀')
})
