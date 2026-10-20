import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import { debugScriptsPlugin, readDebugScript } from './debugScripts.config'

const DIR = resolve(__dirname, 'debug-scripts')

describe('readDebugScript', () => {
  it('reads a script by name', () => {
    expect(readDebugScript(DIR, 'act1.txt')).toContain('use lantern')
  })
  it.each(['../package.json', 'nope.txt', 'act1', '.txt', 'a/b.txt'])(
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
