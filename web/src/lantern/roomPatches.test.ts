/**
 * The patches of the room pictures: the declared lists against the areas, and
 * the golden path of every act met against them.
 */
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { Key } from '@/act1/items/Key'
import { Act2 } from '@/act2/Act2'
import { Act3 } from '@/act3/Act3'
import { Act4 } from '@/act4/Act4'
import { Game, Item, type Act } from '@/engine'
import { allImages, characterImages } from './imageLists'
import { declaredAreas, exitAreaId, thingAreaId } from './roomAreas'
import { declaredPatches, unpatchedAreas, type ImagePatch } from './roomPatches'
import { ACT1_ROOM_PATCHES } from './roomPatches/act1RoomPatches'
import { ACT2_ROOM_PATCHES } from './roomPatches/act2RoomPatches'
import { ACT3_ROOM_PATCHES } from './roomPatches/act3RoomPatches'
import { ACT4_ROOM_PATCHES } from './roomPatches/act4RoomPatches'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const ACTS: Array<() => Act> = [
  () => new Act1(),
  () => new Act2(),
  () => new Act3(),
  () => new Act4(),
]

/** The declared tables of each act, to check their keys. */
const ACT_TABLES: Record<string, Record<string, unknown>> = {
  Act1: ACT1_ROOM_PATCHES,
  Act2: ACT2_ROOM_PATCHES,
  Act3: ACT3_ROOM_PATCHES,
  Act4: ACT4_ROOM_PATCHES,
}

/** The picture variant room `key` shows now. */
function pictureOf(act: Act, game: Game, key: string): string {
  return act.rooms[key].pictureVariant(game.state)
}

/** The patches of every picture of room `key`. */
function patchesOfRoom(act: Act, key: string): readonly ImagePatch[] {
  return [
    ...declaredPatches(act.name, key),
    ...act.rooms[key]
      .pictureVariants()
      .flatMap((variant) => declaredPatches(act.name, key, variant)),
  ]
}

describe('room image patches', () => {
  it('carry the declared patches of the room, a portrait none', () => {
    const act = new Act1()
    const images = allImages(act)
    // The shed has its own patches on each picture: none on the outside.
    expect(
      images.find((i) => i.id === 'act1-abandoned-shed')?.patches,
    ).toBeUndefined()
    const inside = images.find((i) => i.id === 'act1-abandoned-shed-inside')
    expect(inside?.patches?.map((p) => p.id)).toEqual(
      expect.arrayContaining(['fishing-rod-appears', 'patches-gone']),
    )
    const insideAreas = declaredAreas('Act1', 'AbandonedShed', 'inside').map(
      (a) => a.id,
    )
    for (const patch of inside?.patches ?? [])
      expect(insideAreas).toContain(patch.area)
    for (const image of characterImages(act))
      expect(image.patches, image.id).toBeUndefined()
  })

  it("leave Elior's cottage unchanged when its ways open, and show the journal with the lantern's light", () => {
    const ids = declaredPatches('Act1', 'EliorsCottage').map((p) => p.id)
    expect(ids).not.toContain('exit-south-open')
    expect(ids).not.toContain('exit-east-open')
    expect(ids).not.toContain('eliors-journal-appears')
    expect(ids).toContain('lantern-lit')
    expect(unpatchedAreas('Act1', 'EliorsCottage')).toEqual([
      'exit-south',
      'exit-east',
      'eliors-journal',
    ])
  })

  it.each(ACTS.map((make) => [make().name, make] as const))(
    'of %s have no patch for an area that needs none, which is an area of its room',
    (_name, make) => {
      const act = make()
      for (const room of Object.keys(act.rooms)) {
        const areas = declaredAreas(act.name, room).map((a) => a.id)
        const patched = declaredPatches(act.name, room).map((p) => p.area)
        for (const area of unpatchedAreas(act.name, room)) {
          expect(areas, `${act.name} ${room} ${area}`).toContain(area)
          expect(patched, `${act.name} ${room} ${area}`).not.toContain(area)
        }
      }
    },
  )

  it("lay the chapel's locket over its candle's light, which covers almost the whole picture", () => {
    const ids = declaredPatches('Act1', 'VillageChapel').map((p) => p.id)
    expect(ids.indexOf('candle-lit')).toBeLessThan(
      ids.indexOf('locket-appears'),
    )
  })

  it('leave out the patches of a room that has none', () => {
    const images = allImages(new Act1())
    const dream = images.find((i) => i.id === 'act1-the-dream')
    expect(dream?.patches).toBeUndefined()
  })

  it.each(ACTS.map((make) => [make().name, make] as const))(
    'of %s are slugs with unique ids, words, and an area of the same image',
    (_name, make) => {
      const act = make()
      let total = 0
      for (const room of Object.keys(act.rooms)) {
        const patches = declaredPatches(act.name, room)
        total += patches.length
        const ids = patches.map((p) => p.id)
        expect(new Set(ids).size, `${act.name} ${room} ids`).toBe(ids.length)
        const areas = new Set(declaredAreas(act.name, room).map((a) => a.id))
        for (const patch of patches) {
          expect(patch.id).toMatch(SLUG)
          expect(patch.title.length).toBeGreaterThan(0)
          expect(patch.text.length).toBeGreaterThan(0)
          if (patch.area !== undefined)
            expect(areas, `${room} ${patch.id}`).toContain(patch.area)
        }
      }
      expect(total).toBeGreaterThan(0)
    },
  )

  it.each(ACTS.map((make) => [make().name, make] as const))(
    'of %s sit under rooms of the act, and take away only what the base picture shows',
    (_name, make) => {
      const act = make()
      const game = new Game([act])
      for (const key of Object.keys(ACT_TABLES[act.name] ?? {}))
        expect(Object.keys(act.rooms), key).toContain(key)
      for (const [key, room] of Object.entries(act.rooms)) {
        const atStart = new Set([
          ...[...room.items, ...room.characters].map((t) =>
            thingAreaId(act, t),
          ),
          ...Object.keys(room.getExits(game.state)).map(exitAreaId),
        ])
        const patches = declaredPatches(act.name, key)
        for (const patch of patches) {
          if (patch.area === undefined) continue
          const adds = /-(appears|open)$/.test(patch.id)
          const addedLater = patches.some(
            (p) => p.area === patch.area && /-appears$/.test(p.id),
          )
          expect(
            adds
              ? !atStart.has(patch.area)
              : atStart.has(patch.area) || addedLater,
            `${act.name} ${key} ${patch.id}`,
          ).toBe(true)
        }
      }
    },
  )
})

describe("a room's other pictures", () => {
  it('have a taken patch for every thing that can be carried and is in the room once the picture shows', () => {
    const act = new Act1()
    const game = new Game([act])
    game.state.currentRoom = game.state.allRooms.AbandonedShed
    game.state.addItemToInventory(new Key())
    game.commandParser.parse('use key with door')
    const shed = game.state.allRooms.AbandonedShed
    expect(shed.pictureVariant(game.state)).toBe('inside')
    const missing: string[] = []
    for (const item of shed.items) {
      if (!(item instanceof Item) || !item.canBeCarried) continue
      const id = thingAreaId(act, item)
      if (
        !declaredPatches(act.name, 'AbandonedShed', 'inside').some(
          (p) => p.area === id,
        )
      )
        missing.push(id)
    }
    expect(missing).toEqual([])
  })
})

describe.each(ACTS.map((make) => [make().name, make] as const))(
  '%s golden path',
  (_name, make) => {
    it('has a patch, linked to its area, for every thing that leaves, arrives in or is changed in a room', () => {
      const act = make()
      const game = new Game([act])
      const snapshot = (): Map<string, Set<string>> => {
        const seen = new Map<string, Set<string>>()
        for (const [key, room] of Object.entries(act.rooms)) {
          const ids = new Set<string>()
          for (const t of [...room.items, ...room.characters])
            ids.add(thingAreaId(act, t))
          for (const d of Object.keys(room.getExits(game.state)))
            ids.add(exitAreaId(d))
          seen.set(key, ids)
        }
        return seen
      }
      const missing: string[] = []
      const pictures = new Map<string, string>()
      for (const key of Object.keys(act.rooms))
        pictures.set(key, pictureOf(act, game, key))
      let before = snapshot()
      for (const command of act.goldenPath) {
        game.commandParser.parse(command)
        game.state.settleQuests()
        const after = snapshot()
        for (const [room, ids] of after) {
          for (const id of ids) {
            if (
              before.get(room)?.has(id) ||
              id.startsWith('sir-cedric') ||
              id.startsWith('scenery-')
            )
              continue
            const linked =
              patchesOfRoom(act, room).some((p) => p.area === id) ||
              unpatchedAreas(act.name, room).includes(id)
            // A thing that arrives with the room's other picture is in that picture.
            const withPicture =
              pictureOf(act, game, room) !== pictures.get(room) &&
              declaredAreas(act.name, room, pictureOf(act, game, room)).some(
                (a) => a.id === id,
              )
            if (!linked && !withPicture)
              missing.push(`${act.name} ${room} after "${command}": ${id}`)
          }
        }
        for (const [room, ids] of before) {
          for (const id of ids) {
            if (after.get(room)?.has(id)) continue
            if (id.startsWith('sir-cedric')) continue
            const linked = patchesOfRoom(act, room).some((p) => p.area === id)
            if (!linked)
              missing.push(`${act.name} ${room} after "${command}": ${id}`)
          }
        }
        before = after
        for (const key of Object.keys(act.rooms))
          pictures.set(key, pictureOf(act, game, key))
      }
      expect([...new Set(missing)]).toEqual([])
    })

    it('has a taken patch for every item of a room that can be carried', () => {
      const act = make()
      const missing: string[] = []
      for (const [key, room] of Object.entries(act.rooms)) {
        for (const item of room.items) {
          if (!(item instanceof Item) || !item.canBeCarried) continue
          const id = thingAreaId(act, item)
          if (!declaredPatches(act.name, key).some((p) => p.area === id))
            missing.push(`${act.name} ${key}: ${id}`)
        }
      }
      expect(missing).toEqual([])
    })
  },
)
