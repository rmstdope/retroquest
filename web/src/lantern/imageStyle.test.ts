/**
 * The game's shared image style (`images/style.json`) and the `images` section
 * of `audio-studio.json`, which points Audio Studio at it and at each act's
 * image list.
 */
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ACT_NUMBERS } from '../../../tts/actScripts'

/** Reads a JSON file of the repository (relative to its root). */
function readJson<T>(path: string): T {
  return JSON.parse(
    readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8'),
  ) as T
}

interface Style {
  style: string
  avoid: string[]
  palette: { name: string; hex: string }[]
  acts: Record<string, string>
}
interface Studio {
  images: {
    parts: { id: string }[]
    paths: { list: string; style: string }
  }
}

describe('images/style.json', () => {
  const style = readJson<Style>('images/style.json')

  it('holds the style text, things to keep out and a palette', () => {
    expect(style.style.length).toBeGreaterThan(0)
    expect(style.avoid.length).toBeGreaterThan(0)
    expect(style.palette.length).toBeGreaterThan(0)
    for (const colour of style.palette) {
      expect(colour.name).not.toBe('')
      expect(colour.hex).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('says in its own words what the picture must not hold', () => {
    expect(style.style).toContain('no fold, frame or border')
    expect(style.style).toContain(
      'no text, lettering, signature or watermark anywhere',
    )
    expect(style.style).not.toMatch(/lantern|picture book|worn/i)
  })

  it('keeps the full list of things to keep out', () => {
    expect(style.avoid).toEqual([
      'text',
      'lettering',
      'watermark',
      'signature',
      'photorealism',
      '3d render',
      'anime',
      'neon colours',
      'modern objects',
      'frame or border',
    ])
  })

  it('adds to the style only for acts of the game', () => {
    const ids = readJson<Studio>('audio-studio.json').images.parts.map(
      (p) => p.id,
    )
    for (const act of Object.keys(style.acts)) expect(ids).toContain(act)
  })
})

describe('audio-studio.json images section', () => {
  const { images } = readJson<Studio>('audio-studio.json')

  it('finds the style file and every act image list', () => {
    const root = new URL('../../../', import.meta.url)
    expect(existsSync(new URL(images.paths.style, root))).toBe(true)
    expect(images.parts.map((p) => p.id)).toEqual(
      ACT_NUMBERS.map((n) => `act${n}`),
    )
    for (const part of images.parts)
      expect(
        existsSync(new URL(images.paths.list.replace('{part}', part.id), root)),
      ).toBe(true)
  })
})
