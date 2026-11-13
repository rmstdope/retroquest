/**
 * The game's image lists for Content Studio: one image per room of an act, with
 * its dimensions and its words (`text`) free of markup.
 */
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { Act2 } from '@/act2/Act2'
import { Act3 } from '@/act3/Act3'
import { Act4 } from '@/act4/Act4'
import type { Act } from '@/engine'
import { Character } from '@/engine'
import { displayName } from './displayName'
import {
  ELIOR_PORTRAIT_PROMPT,
  PORTRAIT_PROMPTS,
  PORTRAIT_PROMPT_START,
} from './portraitPrompts'
import {
  IMAGE_HEIGHT,
  IMAGE_WIDTH,
  PORTRAIT_HEIGHT,
  PORTRAIT_WIDTH,
  ELIOR_PORTRAIT_ID,
  SHARED_PORTRAITS,
  TITLE_IMAGE_ID,
  allImages,
  characterImages,
  portraitId,
  roomImages,
  titleImage,
} from './imageLists'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const ACTS: Act[] = [new Act1(), new Act2(), new Act3(), new Act4()]

describe('roomImages', () => {
  it("lists the shed's second picture after the rooms, with the inside's own areas", () => {
    const act = new Act1()
    const images = roomImages(act)
    const outside = images.find((i) => i.id === 'act1-abandoned-shed')
    const inside = images.find((i) => i.id === 'act1-abandoned-shed-inside')
    expect(inside?.title).toBe('Abandoned Shed, inside')
    expect(inside?.text).toBe(outside?.text)
    expect(inside?.text).toContain('workbench')
    expect(inside?.areas?.map((a) => a.id)).toContain('patches')
    expect(outside?.areas?.map((a) => a.id)).not.toContain('patches')
    expect(images.indexOf(inside!)).toBe(Object.keys(act.rooms).length)
  })

  it.each(ACTS.map((act) => [act.name, act] as const))(
    'lists every room of %s once, with slug ids',
    (_name, act) => {
      const images = roomImages(act)
      const variants = Object.values(act.rooms).flatMap((room) =>
        room.pictureVariants(),
      )
      expect(images).toHaveLength(
        Object.keys(act.rooms).length + variants.length,
      )
      expect(new Set(images.map((i) => i.id)).size).toBe(images.length)
      for (const image of images) expect(image.id).toMatch(SLUG)
    },
  )

  it('gives each image the shared dimensions and the room name as title', () => {
    for (const act of ACTS) {
      const rooms = Object.values(act.rooms)
      roomImages(act)
        .slice(0, rooms.length)
        .forEach((image, i) => {
          expect(image.width).toBe(IMAGE_WIDTH)
          expect(image.height).toBe(IMAGE_HEIGHT)
          expect([image.width, image.height]).toEqual([1920, 1080])
          expect(image.title).toBe(rooms[i].name)
        })
    }
  })

  it('describes each room without markup', () => {
    for (const act of ACTS)
      for (const image of roomImages(act)) {
        expect(image.text).not.toMatch(/\[[^\]]*\]/)
        expect(image.text.length).toBeGreaterThan(0)
      }
  })
})

/** The names of the characters an act registers, one per name. */
function characterNames(act: Act): string[] {
  const names = Object.values(act.classes)
    .filter((C) => C.prototype instanceof Character)
    .map((C) => new (C as unknown as new () => Character)().name)
  return [...new Set(names.map((n) => n.toLowerCase()))]
}

describe('characterImages', () => {
  it.each(ACTS.map((act) => [act.name, act] as const))(
    'lists a portrait for every character of %s once, with the portrait size',
    (_name, act) => {
      const images = characterImages(act)
      expect(images.length).toBeGreaterThan(0)
      expect(images.map((i) => i.title.toLowerCase()).sort()).toEqual(
        [...characterNames(act).map((n) => displayName(n)), 'Elior']
          .map((n) => n.toLowerCase())
          .sort(),
      )
      for (const image of images) {
        expect(image.width).toBe(PORTRAIT_WIDTH)
        expect(image.height).toBe(PORTRAIT_HEIGHT)
        expect(image.text).not.toMatch(/\[[^\]]*\]/)
        expect(image.text.length).toBeGreaterThan(0)
      }
    },
  )

  it('names a portrait by its display name', () => {
    const titles = characterImages(new Act2()).map((i) => i.title)
    expect(titles).toContain('Innkeeper Marcus')
    expect(titles).toContain('Master Healer Lyria')
  })

  it('lists a name shared by two classes once', () => {
    const titles = characterImages(new Act4()).map((i) => i.title)
    expect(titles.filter((t) => t === 'Sir Cedric')).toHaveLength(1)
    // The first class registered wins.
    expect(characterImages(new Act4()).map((i) => i.id)).toContain(
      'portrait-sir-cedric',
    )
  })

  it('gives ids that are slugs, unique among rooms and portraits of an act', () => {
    for (const act of ACTS) {
      const ids = allImages(act, ACTS).map((i) => i.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const id of ids) expect(id).toMatch(SLUG)
    }
    expect(characterImages(new Act1()).map((i) => i.id)).toContain(
      'portrait-mira',
    )
  })

  it('gives a character in several acts one portrait id and one entry in every act', () => {
    const lists = ACTS.map((act) => characterImages(act, ACTS))
    const mira = lists.flatMap((list) =>
      list.filter((i) => i.id === 'portrait-mira'),
    )
    expect(mira).toHaveLength(3)
    expect(mira[1]).toEqual(mira[0])
    expect(mira[2]).toEqual(mira[0])
    expect(lists[1].map((i) => i.id)).toContain('portrait-sir-cedric')
    expect(lists[3].map((i) => i.id)).toContain('portrait-grandmother')
  })

  it('repeats an id across the acts only for a shared portrait, and lists SHARED_PORTRAITS as exactly the characters of several acts', () => {
    const acts = new Map<string, Set<string>>()
    for (const act of ACTS)
      for (const [key, C] of Object.entries(act.classes))
        if (C.prototype instanceof Character)
          acts.set(key, (acts.get(key) ?? new Set()).add(act.name))
    const recurring = [...acts].filter(([, a]) => a.size > 1).map(([k]) => k)
    expect([...SHARED_PORTRAITS].sort()).toEqual(recurring.sort())
    const ids = ACTS.flatMap((act) =>
      characterImages(act, ACTS).map((i) => i.id),
    )
    const repeated = ids.filter((id, i) => ids.indexOf(id) !== i)
    // Elior is no class but is listed, identically, in every act.
    expect(new Set(repeated)).toEqual(
      new Set([
        ...SHARED_PORTRAITS.map((key) => portraitId('Act1', key)),
        ELIOR_PORTRAIT_ID,
      ]),
    )
  })

  it('keeps a character of one act under that act', () => {
    expect(portraitId('Act1', 'Deer')).toBe('act1-portrait-deer')
    expect(portraitId('Act4', 'Mira')).toBe('portrait-mira')
  })

  it('lists the rooms first and the portraits after them', () => {
    const act = new Act1()
    const rooms = roomImages(act).length
    expect(allImages(act).slice(0, rooms)).toEqual(roomImages(act))
    expect(allImages(act).slice(rooms)).toEqual(characterImages(act))
  })

  it('starts every portrait prompt with a face portrait, in every act', () => {
    for (const act of ACTS) {
      for (const image of characterImages(act)) {
        expect(image.text, image.id).toMatch(
          new RegExp(`^${PORTRAIT_PROMPT_START}\\S`),
        )
      }
    }
  })

  it('has a prompt for every listed character and no stray ones', () => {
    const keys = new Set<string>()
    for (const act of ACTS) {
      for (const [key, C] of Object.entries(act.classes)) {
        if (C.prototype instanceof Character) keys.add(key)
      }
    }
    // A class sharing a name with another is listed once, so it needs no prompt.
    for (const key of Object.keys(PORTRAIT_PROMPTS)) {
      expect(keys.has(key), key).toBe(true)
    }
    for (const act of ACTS) expect(() => characterImages(act)).not.toThrow()
  })

  it('lists a shared character with the identical entry in every act', () => {
    const entry = (act: Act): unknown =>
      characterImages(act, ACTS).find((i) => i.id === 'portrait-mira')
    expect(entry(ACTS[0]!)).toBeDefined()
    for (const act of ACTS.filter((a) => 'Mira' in a.classes)) {
      expect(entry(act)).toEqual(entry(ACTS[0]!))
    }
  })
})

describe('the portrait of Elior', () => {
  it('is listed once in every act, identical in each, with the agreed words', () => {
    const entries = ACTS.map((act) =>
      characterImages(act, ACTS).filter((i) => i.id === ELIOR_PORTRAIT_ID),
    )
    for (const list of entries) expect(list).toHaveLength(1)
    expect(ELIOR_PORTRAIT_ID).toBe('portrait-elior')
    expect(entries[0]![0]).toEqual({
      id: 'portrait-elior',
      title: 'Elior',
      width: PORTRAIT_WIDTH,
      height: PORTRAIT_HEIGHT,
      text:
        'A face portrait of a farm boy of about nineteen, sun-browned and ' +
        'freckled, with untidy brown hair, an earnest, searching look, and ' +
        'the frayed collar of a homespun shirt.',
    })
    for (const list of entries) expect(list[0]).toEqual(entries[0]![0])
    expect(ELIOR_PORTRAIT_PROMPT.startsWith(PORTRAIT_PROMPT_START)).toBe(true)
  })
})

describe('titleImage', () => {
  it('lists the title screen picture in the room image size, as a slug', () => {
    const image = titleImage()
    expect(image.id).toBe(TITLE_IMAGE_ID)
    expect(image.id).toMatch(SLUG)
    expect([image.width, image.height]).toEqual([IMAGE_WIDTH, IMAGE_HEIGHT])
    expect(image.text).toMatch(/sky/)
    const rooms = ACTS.flatMap((act) => allImages(act, ACTS).map((i) => i.id))
    expect(rooms).not.toContain(TITLE_IMAGE_ID)
  })
})
