/**
 * The patches of the room pictures: the declared lists against the areas, and
 * the golden path of every act met against them.
 */
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { Act2 } from '@/act2/Act2'
import { Act3 } from '@/act3/Act3'
import { Act4 } from '@/act4/Act4'
import { Game, Item, type Act } from '@/engine'
import { allImages } from './imageLists'
import { declaredAreas, exitAreaId, thingAreaId } from './roomAreas'
import { declaredPatches } from './roomPatches'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const ACTS: Array<() => Act> = [
  () => new Act1(),
  () => new Act2(),
  () => new Act3(),
  () => new Act4(),
]

describe('room image patches', () => {
  it('carry the declared patches of the room, a portrait none', () => {
    const act = new Act1()
    const images = allImages(act)
    const shed = images.find((i) => i.id === 'act1-abandoned-shed')
    expect(shed?.patches?.map((p) => p.id)).toEqual(
      expect.arrayContaining(['fishing-rod-taken', 'patches-gone']),
    )
    const rooms = Object.keys(act.rooms).length
    for (const image of images.slice(rooms))
      expect(image.patches, image.id).toBeUndefined()
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
      expect(
        Object.keys(act.rooms).length,
        'declared rooms',
      ).toBeGreaterThanOrEqual(1)
    },
  )
})

describe.each(ACTS.map((make) => [make().name, make] as const))(
  '%s golden path',
  (_name, make) => {
    it('has a patch, linked to its area, for every thing that leaves a room', () => {
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
      let before = snapshot()
      for (const command of act.goldenPath) {
        game.commandParser.parse(command)
        game.state.settleQuests()
        const after = snapshot()
        for (const [room, ids] of before) {
          for (const id of ids) {
            if (after.get(room)?.has(id)) continue
            if (id.startsWith('sir-cedric')) continue
            const linked = declaredPatches(act.name, room).some(
              (p) => p.area === id,
            )
            if (!linked)
              missing.push(`${act.name} ${room} after "${command}": ${id}`)
          }
        }
        before = after
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
