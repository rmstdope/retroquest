/**
 * The game's image lists for Content Studio: one image per room of an act, with
 * its dimensions and its description free of markup.
 */
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { Act2 } from '@/act2/Act2'
import { Act3 } from '@/act3/Act3'
import { Act4 } from '@/act4/Act4'
import type { Act } from '@/engine'
import { Character } from '@/engine'
import { displayName } from './displayName'
import { PORTRAIT_PROMPTS, PORTRAIT_PROMPT_START } from './portraitPrompts'
import {
  IMAGE_HEIGHT,
  IMAGE_WIDTH,
  PORTRAIT_HEIGHT,
  PORTRAIT_WIDTH,
  SHARED_PORTRAITS,
  allImages,
  characterImages,
  portraitId,
  roomImages,
} from './imageLists'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const ACTS: Act[] = [new Act1(), new Act2(), new Act3(), new Act4()]

describe('roomImages', () => {
  it.each(ACTS.map((act) => [act.name, act] as const))(
    'lists every room of %s once, with slug ids',
    (_name, act) => {
      const images = roomImages(act)
      expect(images).toHaveLength(Object.keys(act.rooms).length)
      expect(new Set(images.map((i) => i.id)).size).toBe(images.length)
      for (const image of images) expect(image.id).toMatch(SLUG)
    },
  )

  it('gives each image the shared dimensions and the room name as title', () => {
    for (const act of ACTS) {
      const rooms = Object.values(act.rooms)
      roomImages(act).forEach((image, i) => {
        expect(image.width).toBe(IMAGE_WIDTH)
        expect(image.height).toBe(IMAGE_HEIGHT)
        expect(image.title).toBe(rooms[i].name)
      })
    }
  })

  it('describes each room without markup', () => {
    for (const act of ACTS)
      for (const image of roomImages(act)) {
        expect(image.description).not.toMatch(/\[[^\]]*\]/)
        expect(image.description.length).toBeGreaterThan(0)
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
        characterNames(act)
          .map((n) => displayName(n).toLowerCase())
          .sort(),
      )
      for (const image of images) {
        expect(image.width).toBe(PORTRAIT_WIDTH)
        expect(image.height).toBe(PORTRAIT_HEIGHT)
        expect(image.description).not.toMatch(/\[[^\]]*\]/)
        expect(image.description.length).toBeGreaterThan(0)
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
    expect(new Set(repeated)).toEqual(
      new Set(SHARED_PORTRAITS.map((key) => portraitId('Act1', key))),
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
        expect(image.description, image.id).toMatch(
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
