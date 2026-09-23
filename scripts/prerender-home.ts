import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createElement, type ComponentType, type ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

const EMPTY_ROOT = '<div id="root"></div>'

export function injectPrerenderedHome(shell: string, content: string): string {
  if (shell.split(EMPTY_ROOT).length !== 2 || !content.includes('id="main"')) {
    throw new Error('seo-prerender-invalid-home')
  }
  return shell.replace(EMPTY_ROOT, `<div id="root">${content}</div>`)
}

export async function prerenderHome(root = process.cwd()): Promise<void> {
  const server = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  })
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.tsx') as { default: ComponentType }
    const { I18nProvider } = await server.ssrLoadModule('/src/i18n/index.tsx') as {
      I18nProvider: ComponentType<{ children?: ReactNode }>
    }
    const content = renderToString(createElement(I18nProvider, null, createElement(App)))
    const path = resolve(root, 'dist/index.html')
    const html = injectPrerenderedHome(readFileSync(path, 'utf8'), content)
    const temporary = `${path}.${process.pid}.tmp`
    writeFileSync(temporary, html)
    renameSync(temporary, path)
  } finally {
    await server.close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  prerenderHome().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'seo-prerender-failed'}\n`)
    process.exitCode = 1
  })
}
