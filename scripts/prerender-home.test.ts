import test from 'node:test'
import assert from 'node:assert/strict'
import { injectPrerenderedHome } from './prerender-home.ts'

test('inserts crawlable markup into the one app root', () => {
  const shell = '<html><body><div id="root"></div><script src="/app.js"></script></body></html>'
  const content = '<main id="main"><a href="https://github.com/example/jev">Jev SDK</a></main>'
  assert.equal(injectPrerenderedHome(shell, content),
    `<html><body><div id="root">${content}</div><script src="/app.js"></script></body></html>`)
})

test('rejects missing or repeated roots and unrelated markup', () => {
  assert.throws(() => injectPrerenderedHome('<div id="other"></div>', '<main id="main"></main>'))
  assert.throws(() => injectPrerenderedHome('<div id="root"></div><div id="root"></div>', '<main id="main"></main>'))
  assert.throws(() => injectPrerenderedHome('<div id="root"></div>', '<p>No directory</p>'))
})
