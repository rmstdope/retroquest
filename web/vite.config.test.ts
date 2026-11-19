import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Reads one of the web/ config files as text. */
function source(name: string): string {
  return readFileSync(new URL(name, import.meta.url), 'utf8')
}

/** The relative module specifiers a config file imports. */
function relativeImports(text: string): string[] {
  return [...text.matchAll(/from '(\.[^']*)'/g)].map((match) => match[1])
}

describe.each(['vite.config.ts', 'vitest.config.ts'])('%s', (name) => {
  it('is ready for the native config loader', () => {
    const text = source(name)
    expect(text).not.toContain('__dirname')
    for (const specifier of relativeImports(text)) {
      expect(specifier, `${specifier} needs a file extension`).toMatch(/\.ts$/)
    }
  })
})
