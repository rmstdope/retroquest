/**
 * The game's shared image style (`images/style.json`) and the `images` section
 * of `content-studio.json`, which points Content Studio at it and at each act's
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
  look: string
  keepOut: string
  acts: Record<string, string>
}
interface Studio {
  narration: { parts: { id: string }[] }
  images: { paths: { list: string; style: string } }
}

/** The fields Content Studio reads from a style file; any other is refused. */
const STYLE_FIELDS = [
  'look',
  'keepOut',
  'palette',
  'colourDepth',
  'dithering',
  'acts',
]

describe('images/style.json', () => {
  const style = readJson<Style>('images/style.json')

  it('uses only the fields Content Studio reads', () => {
    for (const field of Object.keys(style))
      expect(STYLE_FIELDS).toContain(field)
  })

  it('holds the look and things to keep out, and lists no palette', () => {
    expect(style.look.length).toBeGreaterThan(0)
    expect(style.keepOut.length).toBeGreaterThan(0)
    // No palette means full colour: Content Studio only resizes each take.
    expect(style).not.toHaveProperty('palette')
  })

  it('says in its own words what the picture must not hold', () => {
    expect(style.look).toContain('no fold, frame or border')
    expect(style.look).toContain(
      'no text, lettering, signature or watermark anywhere',
    )
    expect(style.look).not.toMatch(/lantern|picture book|worn/i)
  })

  it('keeps out only what does no harm when named in the prompt', () => {
    // The studio's models read no negative prompt: keepOut is added to the
    // prompt as words, so what would be drawn by naming it stays in the look.
    expect(style.keepOut).toBe(
      'photorealism, 3d render, anime, neon colours, modern objects',
    )
  })

  it('adds to the style only for acts of the game', () => {
    const ids = readJson<Studio>('content-studio.json').narration.parts.map(
      (p) => p.id,
    )
    for (const act of Object.keys(style.acts)) expect(ids).toContain(act)
  })
})

describe('content-studio.json images section', () => {
  const { narration, images } = readJson<Studio>('content-studio.json')

  it('finds the style file and every act image list', () => {
    const root = new URL('../../../', import.meta.url)
    expect(existsSync(new URL(images.paths.style, root))).toBe(true)
    expect(narration.parts.map((p) => p.id)).toEqual(
      ACT_NUMBERS.map((n) => `act${n}`),
    )
    for (const part of narration.parts)
      expect(
        existsSync(new URL(images.paths.list.replace('{part}', part.id), root)),
      ).toBe(true)
  })
})
