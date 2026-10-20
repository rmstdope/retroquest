import { describe, it, expect } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { debugScriptsPlugin, readDebugScript } from './debugScripts.config'

const DIR = mkdtempSync(join(tmpdir(), 'debug-scripts-'))
writeFileSync(join(DIR, 'mine.txt'), 'use lantern\n')

describe('readDebugScript', () => {
  it('reads a script by name', () => {
    expect(readDebugScript(DIR, 'mine.txt')).toContain('use lantern')
  })
  it.each(['../package.json', 'nope.txt', 'mine', '.txt', 'a/b.txt'])(
    'refuses %s',
    (file) => {
      expect(readDebugScript(DIR, file)).toBeNull()
    },
  )
})

describe('debugScriptsPlugin', () => {
  it('only exists under the dev server', () => {
    expect(debugScriptsPlugin(DIR).apply).toBe('serve')
  })
})
