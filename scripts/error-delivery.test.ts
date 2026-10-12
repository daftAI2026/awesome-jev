/**
 * [INPUT]: 依赖真实源码隔离夹具、Vite HTTP 预览和三语言文案
 * [OUTPUT]: 验证加载/beforeLoad/嵌套失败的 500、脱敏与恢复入口
 * [POS]: scripts 的构建后故障验收，不向正式站点注入故障
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildErrorFixture, ERROR_CANARY } from './error-page-fixture.ts'
import { runDelivery } from './verify-delivery.ts'
import { en } from '../src/i18n/locales/en.ts'
import { zh } from '../src/i18n/locales/zh.ts'
import { ja } from '../src/i18n/locales/ja.ts'
import { localizedPath, LANGUAGE_TAG, LOCALES } from '../src/lib/locale-routes.ts'

if (process.env.TEST_ERROR_FIXTURE === '1') {
  const origin = process.env.TEST_SITE_ORIGIN!
  test('retry reissues the failed request and restores a healthy response', async () => {
    const first = await fetch(new URL('/fault-retry', origin))
    assert.equal(first.status, 500)
    await first.body?.cancel()
    const retry = await fetch(new URL('/fault-retry', origin))
    assert.equal(retry.status, 200)
    assert.match(await retry.text(), /Recovered successfully/)
  })
  for (const locale of LOCALES) {
    for (const route of ['/fault', '/fault-nested', '/fault-before']) {
      test(`500 ${localizedPath(route, locale)} is safe and recoverable`, async () => {
        const response = await fetch(new URL(localizedPath(route, locale) + '?private=query', origin), { signal: AbortSignal.timeout(30_000) })
        assert.equal(response.status, 500)
        assert.match(response.headers.get('cache-control') ?? '', /no-store/)
        assert.equal(response.headers.get('x-robots-tag'), 'noindex')
        const html = await response.text()
        assert.match(html, /data-recovery-status="500"/)
        assert.match(html, /data-jev-figure=""/)
        assert.ok(html.includes({ en, zh, ja }[locale].jevFigureTitle))
        assert.equal([...html.matchAll(/<h1\b/g)].length, 1)
        assert.ok(html.includes({ en, zh, ja }[locale].serverErrorTitle))
        assert.ok(html.includes(`<html lang="${LANGUAGE_TAG[locale]}"`))
        assert.match(html, /<title>500 · Awesome JEV<\/title>/)
        assert.match(html, /<meta name="robots" content="noindex, follow"/)
        assert.doesNotMatch(html, /<link rel="canonical"|SHOULD_NOT_RENDER|SHOULD_NOT_INDEX/)
        assert.ok(!html.includes(ERROR_CANARY), 'Exception text must not leak into SSR or hydration data')
        for (const target of ['/', '/top100', '/news']) assert.ok(html.includes(`href="${localizedPath(target, locale)}"`))
        assert.ok(html.includes({ en, zh, ja }[locale].errorRetry))
      })
    }
  }
} else {
  test('isolated production build delivers genuine safe 500 pages', { skip: !process.env.TEST_SITE_ORIGIN, timeout: 240_000 }, async () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
    const fixture = await buildErrorFixture(root)
    try {
      process.env.TEST_ERROR_FIXTURE = '1'
      const output = await runDelivery({ cwd: fixture.cwd, testCommand: [process.execPath, '--experimental-strip-types', '--test', '--test-reporter=tap', path.join(root, 'scripts/error-delivery.test.ts')] })
      assert.match(output, /# tests 10/)
    } finally {
      delete process.env.TEST_ERROR_FIXTURE
      await fixture.cleanup()
    }
  })
}
