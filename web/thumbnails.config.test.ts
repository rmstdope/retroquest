import { describe, it, expect } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { thumbFileName, thumbnailsPlugin } from './thumbnails.config'

interface Emitted {
  fileName: string
  source: Uint8Array
}

/** Runs the plugin's generateBundle against `dir` and returns what it emitted. */
async function emitted(dir: string): Promise<Emitted[]> {
  const out: Emitted[] = []
  const plugin = thumbnailsPlugin(dir)
  const hook = plugin.generateBundle as (this: {
    emitFile: (file: Emitted & { type: string }) => void
  }) => Promise<void>
  await hook.call({ emitFile: (file) => out.push(file) })
  return out
}

describe('thumbFileName', () => {
  it('names the small copy of a picture', () => {
    expect(thumbFileName('act1-forge.lamp.png')).toBe(
      'images/generated/thumbs/act1-forge.lamp.webp',
    )
  })
})

describe('thumbnailsPlugin', () => {
  it('emits a 224px wide webp copy of every png and skips other files', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'thumbs-'))
    const png = await sharp({
      create: {
        width: 800,
        height: 450,
        channels: 4,
        background: { r: 200, g: 40, b: 40, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer()
    writeFileSync(join(dir, 'a.png'), png)
    writeFileSync(join(dir, 'notes.txt'), 'not a picture')
    const files = await emitted(dir)
    expect(files.map((f) => f.fileName)).toEqual([
      'images/generated/thumbs/a.webp',
    ])
    const meta = await sharp(files[0].source).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.width).toBe(224)
    expect(meta.hasAlpha).toBe(true)
  })

  it('does not enlarge a picture that is already small', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'thumbs-'))
    writeFileSync(
      join(dir, 'tiny.png'),
      await sharp({
        create: { width: 100, height: 56, channels: 3, background: '#fff' },
      })
        .png()
        .toBuffer(),
    )
    const [file] = await emitted(dir)
    expect((await sharp(file.source).metadata()).width).toBe(100)
  })
})
