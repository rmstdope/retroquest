import { describe, it, expect } from 'vitest'
import { pythonSourcePlugin, collectPythonFiles } from './pythonSourcePlugin'
import { resolve } from 'node:path'

const srcDir = resolve(__dirname, '..', '..', 'src')

describe('pythonSourcePlugin', () => {
  it('returns a Vite plugin with the correct name', () => {
    const plugin = pythonSourcePlugin({ srcDir })
    expect(plugin.name).toBe('retroquest-python-source')
  })

  it('has a configureServer hook', () => {
    const plugin = pythonSourcePlugin({ srcDir })
    expect(plugin.configureServer).toBeTypeOf('function')
  })
})

describe('collectPythonFiles', () => {
  it('finds .py files in the source tree', () => {
    const files = collectPythonFiles(srcDir, srcDir)
    expect(files.length).toBeGreaterThan(0)
    expect(files.every((f) => f.endsWith('.py'))).toBe(true)
  })

  it('returns paths sorted alphabetically', () => {
    const files = collectPythonFiles(srcDir, srcDir)
    const sorted = [...files].sort()
    expect(files).toEqual(sorted)
  })

  it('returns paths relative to the base directory', () => {
    const files = collectPythonFiles(srcDir, srcDir)
    expect(files.every((f) => !f.startsWith('/'))).toBe(true)
  })
})
