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
import {
  IMAGE_HEIGHT,
  IMAGE_WIDTH,
  PORTRAIT_HEIGHT,
  PORTRAIT_WIDTH,
  allImages,
  characterImages,
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
      'act4-portrait-sir-cedric',
    )
  })

  it('gives ids that are slugs, unique among rooms and portraits of the game', () => {
    const ids = ACTS.flatMap((act) => allImages(act).map((i) => i.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(SLUG)
    expect(characterImages(new Act1()).map((i) => i.id)).toContain(
      'act1-portrait-mira',
    )
  })

  it('lists the rooms first and the portraits after them', () => {
    const act = new Act1()
    const rooms = roomImages(act).length
    expect(allImages(act).slice(0, rooms)).toEqual(roomImages(act))
    expect(allImages(act).slice(rooms)).toEqual(characterImages(act))
  })

  it('describes how a character looks, with no line of speech in it', () => {
    const knight = characterImages(new Act4()).find(
      (i) => i.id === 'act4-portrait-knight-of-despair',
    )
    expect(knight?.description.endsWith('his voice is hollow.')).toBe(true)
    for (const act of ACTS) {
      for (const [key, C] of Object.entries(act.classes)) {
        if (!(C.prototype instanceof Character)) continue
        const character = new (C as unknown as new () => Character)()
        const spoken = [
          ...character.description.matchAll(
            /\[dialogue\]([\s\S]*?)\[\/dialogue\]/g,
          ),
        ].map((m) => m[1] ?? '')
        const image = characterImages(act).find(
          (i) =>
            i.title.toLowerCase() === displayName(character.name).toLowerCase(),
        )
        for (const words of spoken) {
          expect(image?.description, key).not.toContain(words)
        }
      }
    }
  })
})
