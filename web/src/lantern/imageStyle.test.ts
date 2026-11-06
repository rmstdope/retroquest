/**
 * The shared image style, Content Studio's own, in its images edits
 * (`content-studio/images/edits.json`), and the `images` section of
 * `content-studio.json`, which points the studio at each act's image list.
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
  parts: Record<string, string>
}
interface Studio {
  version: number
  parts: { id: string }[]
  images: { from: { part: string } }
}

/** Where Content Studio keeps the style, with its changes to the images. */
const EDITS_FILE = 'content-studio/images/edits.json'

/** The fields Content Studio reads from the style; any other is ignored, so a renamed field is lost. */
const STYLE_FIELDS = [
  'look',
  'keepOut',
  'palette',
  'colourDepth',
  'dithering',
  'parts',
]

describe('the style in content-studio/images/edits.json', () => {
  const style = readJson<{ style: Style }>(EDITS_FILE).style

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

  it('leaves the light to each room and act, not always warm', () => {
    expect(style.look).toContain('muted natural colours, soft light')
    expect(style.look).not.toMatch(/warm/i)
  })

  it('keeps out only what does no harm when named in the prompt', () => {
    // The studio's models read no negative prompt: keepOut is added to the
    // prompt as words, so what would be drawn by naming it stays in the look.
    expect(style.keepOut).toBe(
      'photorealism, 3d render, anime, neon colours, modern objects',
    )
  })

  it('adds to the style only for acts of the game', () => {
    const ids = readJson<Studio>('content-studio.json').parts.map((p) => p.id)
    for (const act of Object.keys(style.parts)) expect(ids).toContain(act)
  })

  it('gives every act its agreed mood of light and colour', () => {
    // Whatever an act's addition names is drawn in every room of the act.
    expect(style.parts).toEqual({
      act1:
        'Warm late-day light, earthy greens and straw golds, ' +
        'homely and lived-in, in a fantasy setting',
      act2:
        'Clear daylight and richer colour, deep greens, warm reds and creams, ' +
        'a faint grey haze at the edges, in a fantasy setting',
      act3:
        'Cooler, wilder light, colours a little drained, ' +
        'as if a sickness were creeping into the land, in a fantasy setting',
      act4:
        'Cold, dim light, violet and grey shadows, ' +
        'colours drained almost to stone, a hush of dread, in a fantasy setting',
    })
  })
})

describe('content-studio.json images section', () => {
  const { version, parts, images } = readJson<Studio>('content-studio.json')

  it('is in Content Studio format version 2', () => {
    expect(version).toBe(2)
  })

  it('finds every act image list, and the studio keeps the style in its own folder', () => {
    const root = new URL('../../../', import.meta.url)
    expect(existsSync(new URL(EDITS_FILE, root))).toBe(true)
    expect(existsSync(new URL('images/style.json', root))).toBe(false)
    expect(parts.map((p) => p.id)).toEqual(ACT_NUMBERS.map((n) => `act${n}`))
    for (const part of parts)
      expect(
        existsSync(new URL(images.from.part.replace('{part}', part.id), root)),
      ).toBe(true)
  })
})
