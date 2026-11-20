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

  it('says only what is absent about modern things, naming no object of its own', () => {
    expect(style.look).toContain(
      'hand-painted, a simple pre-industrial handmade world ' +
        'with no electric light, no poles or wires, no aerials, ' +
        'no modern clothing, no logos, ' +
        'and no writing or symbols unless the scene asks for them, ' +
        'one single full-bleed image',
    )
    // Whatever the shared look names is painted in every room.
    expect(style.look).not.toMatch(/candle|lamp|wool|linen|leather|thatch/i)
  })

  it('keeps the words to keep out as they were', () => {
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

describe('the Act 1 pictures that showed modern objects or stray lettering', () => {
  const images = readJson<{ images: Record<string, { text: string }> }>(
    EDITS_FILE,
  ).images

  it('shows the fisherman empty-handed in homespun clothes, with no pole behind him', () => {
    expect(images['act1-riverbank'].text).toBe(
      "A gentle river flows past the village and makes a slow bend here, past the reeds and a broad, flat stone at the water's edge. " +
        'A couple of insects hum over the water. ' +
        'A weathered old fisherman in a homespun wool smock and a shapeless felt hood sits on an upturned crate at the bend, ' +
        'watching the water, his bad arm held close to his side. ' +
        'His hands are empty: no rod, no line, no net. ' +
        'Beyond the reeds, only thatched cottages and trees.',
    )
  })

  it("shows only the founders' mark over the chapel door", () => {
    const text = images['act1-village-chapel'].text
    expect(text).toContain(
      'Over the door, a small carving cut into the stone: a tree under two moons, ' +
        'its edges worn soft with age but the shape still clear. ' +
        'No other carving, letters, writing or symbols anywhere on the walls or the door.',
    )
    expect(text).not.toContain('strange symbols')
  })

  it('dresses Borin in linen and leather', () => {
    expect(images['act1-blacksmiths-forge'].text).toBe(
      'A smoky forge. Coals glow in the hearth. ' +
        'The blacksmith stands next to an anvil with a hammer in his hand. ' +
        'He wears a rough undyed linen shirt, sleeves rolled past the elbow, under a scorched leather apron; ' +
        'forearms like fence posts, old burns on his knuckles. ' +
        'There is a small horseshoe on the wall.',
    )
  })

  it('lights the cottage by the hearth alone, with bare walls', () => {
    expect(images['act1-eliors-cottage'].text).toContain(
      'The room is lit only by the hearth fire; ' +
        'the walls are bare plaster and timber with no fittings on them.',
    )
  })

  it('puts nothing but chimneys on the title screen roofs', () => {
    expect(images['title-screen'].text).toContain(
      'Thatched and slate roofs with stone chimneys and a curl of smoke; ' +
        'nothing on the roofs but chimneys.',
    )
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
