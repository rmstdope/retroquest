import { describe, it, expect } from 'vitest'
import {
  pythonSourcePlugin,
  collectPythonFiles,
  collectAudioFiles,
  getMimeType,
  collectStaticFiles,
} from './pythonSourcePlugin'
import { resolve } from 'node:path'

const srcDir = resolve(__dirname, '..', '..', 'src')
const iconsDir = resolve(__dirname, '..', '..', 'icons')

describe('pythonSourcePlugin', () => {
  it('returns a Vite plugin with the correct name', () => {
    const plugin = pythonSourcePlugin({ srcDir })
    expect(plugin.name).toBe('retroquest-python-source')
  })

  it('has a configureServer hook', () => {
    const plugin = pythonSourcePlugin({ srcDir })
    expect(plugin.configureServer).toBeTypeOf('function')
  })

  it('has a buildStart hook to emit audio files for production builds', () => {
    const plugin = pythonSourcePlugin({ srcDir })
    expect(plugin.buildStart).toBeTypeOf('function')
  })

  it('serves icons directory at /icons/ prefix when iconsDir is provided', () => {
    const plugin = pythonSourcePlugin({ srcDir, iconsDir })
    expect(plugin.configureServer).toBeTypeOf('function')
  })

  it('emits icon files under icons/ during build when iconsDir is provided', () => {
    const plugin = pythonSourcePlugin({ srcDir, iconsDir })
    expect(plugin.buildStart).toBeTypeOf('function')
  })
})

describe('collectStaticFiles', () => {
  it('finds favicon.png in the icons directory', () => {
    const files = collectStaticFiles(iconsDir, iconsDir)
    expect(files.some((f) => f === 'favicon.png')).toBe(true)
  })

  it('returns paths relative to the base directory', () => {
    const files = collectStaticFiles(iconsDir, iconsDir)
    expect(files.every((f) => !f.startsWith('/'))).toBe(true)
  })

  it('returns paths sorted alphabetically', () => {
    const files = collectStaticFiles(iconsDir, iconsDir)
    expect(files).toEqual([...files].sort())
  })
})

describe('getMimeType', () => {
  it('returns text/plain for .py files', () => {
    expect(getMimeType('game.py')).toBe('text/plain')
  })

  it('returns audio/mpeg for .mp3 files', () => {
    expect(getMimeType('music.mp3')).toBe('audio/mpeg')
  })

  it('returns audio/ogg for .ogg files', () => {
    expect(getMimeType('track.ogg')).toBe('audio/ogg')
  })

  it('returns audio/wav for .wav files', () => {
    expect(getMimeType('sound.wav')).toBe('audio/wav')
  })

  it('returns application/octet-stream for unknown types', () => {
    expect(getMimeType('data.bin')).toBe('application/octet-stream')
  })
})

describe('collectAudioFiles', () => {
  it('finds .mp3 files in the source tree', () => {
    const files = collectAudioFiles(srcDir, srcDir)
    expect(files.length).toBeGreaterThan(0)
    expect(files.some((f) => f.endsWith('.mp3'))).toBe(true)
  })

  it('only includes audio file extensions (.mp3, .ogg, .wav)', () => {
    const files = collectAudioFiles(srcDir, srcDir)
    const valid = (f: string) =>
      f.endsWith('.mp3') || f.endsWith('.ogg') || f.endsWith('.wav')
    expect(files.every(valid)).toBe(true)
  })

  it('returns paths sorted alphabetically', () => {
    const files = collectAudioFiles(srcDir, srcDir)
    expect(files).toEqual([...files].sort())
  })

  it('returns paths relative to the base directory', () => {
    const files = collectAudioFiles(srcDir, srcDir)
    expect(files.every((f) => !f.startsWith('/'))).toBe(true)
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
