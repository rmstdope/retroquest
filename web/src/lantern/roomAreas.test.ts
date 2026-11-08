/**
 * The named areas of the room pictures: the id rules, the declared lists, and
 * the golden path of every act met against them.
 */
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { Act2 } from '@/act2/Act2'
import { Act3 } from '@/act3/Act3'
import { Act4 } from '@/act4/Act4'
import { Game, type Act, type Room } from '@/engine'
import { Bucket } from '@/act1/items/Bucket'
import { Scenery } from '@/act1/items/Scenery'
import { MysteriousBox } from '@/act1/items/MysteriousBox'
import { WardStone } from '@/act4/items/WardStone'
import {
  declaredAreas,
  exitAreaId,
  thingAreaId,
  type ImageArea,
} from './roomAreas'
import { allImages, characterImages } from './imageLists'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const ACTS: Array<() => Act> = [
  () => new Act1(),
  () => new Act2(),
  () => new Act3(),
  () => new Act4(),
]

/** Every area id the room's current contents and open exits ask for, with what asked. */
function wantedAreas(
  act: Act,
  game: Game,
  room: Room,
): Array<{ id: string; what: string }> {
  return [
    ...room.items.map((i) => ({ id: thingAreaId(act, i), what: i.name })),
    ...room.characters.map((c) => ({ id: thingAreaId(act, c), what: c.name })),
    ...Object.keys(room.getExits(game.state)).map((d) => ({
      id: exitAreaId(d),
      what: `exit ${d}`,
    })),
  ]
}

describe('area ids', () => {
  it('come from the object, not its displayed name', () => {
    const act = new Act1()
    const bucket = new Bucket()
    const before = thingAreaId(act, bucket)
    bucket.name = 'bucket (full)'
    expect(thingAreaId(act, bucket)).toBe(before)
    expect(before).toBe('bucket')
    expect(thingAreaId(act, new MysteriousBox())).toBe('mysterious-box')
  })

  it('name a scenery piece by its key and an exit by its direction', () => {
    expect(
      thingAreaId(new Act1(), new Scenery('AbandonedShed.boards')),
    ).toMatch(/^scenery-/)
    expect(exitAreaId('north')).toBe('exit-north')
    expect(exitAreaId('secret_passage')).toBe('exit-secret-passage')
  })

  it('refuse a class the act does not register', () => {
    expect(() => thingAreaId(new Act2(), new Bucket())).toThrow()
  })
})

describe('declared room areas', () => {
  it('give each of the three ward stones its own area', () => {
    const ids = declaredAreas('Act4', 'FortressGates').map((a) => a.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'ward-stone-left',
        'ward-stone-middle',
        'ward-stone-right',
      ]),
    )
    expect(thingAreaId(new Act4(), new WardStone('right'))).toBe(
      'ward-stone-right',
    )
  })

  it("give Elior's cottage the Patches Grandmother can bring in", () => {
    const ids = declaredAreas('Act1', 'EliorsCottage').map((a) => a.id)
    expect(ids).toContain('patches')
  })

  it.each(ACTS.map((make) => [make().name, make] as const))(
    'of %s name a class of the act, a scenery piece or an exit',
    (_name, make) => {
      const act = make()
      const classIds = Object.keys(act.classes).map((k) =>
        k
          .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
          .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
          .toLowerCase(),
      )
      for (const room of Object.keys(act.rooms))
        for (const { id } of declaredAreas(act.name, room)) {
          if (id.startsWith('exit-') || id.startsWith('scenery-')) continue
          expect(
            classIds.some((c) => id === c || id.startsWith(`${c}-`)),
            `${act.name} ${room}: ${id}`,
          ).toBe(true)
        }
    },
  )

  it('give every room at least the exits it has', () => {
    for (const make of ACTS) {
      const act = make()
      for (const [key, room] of Object.entries(act.rooms)) {
        const ids = declaredAreas(act.name, key).map((a) => a.id)
        for (const d of Object.keys(room.exits))
          expect(ids, `${act.name} ${key}`).toContain(exitAreaId(d))
      }
    }
  })

  it('give a portrait no areas', () => {
    for (const make of ACTS) {
      const act = make()
      for (const image of characterImages(act))
        expect(image.areas, image.id).toBeUndefined()
    }
  })

  it('list the shed contents that only turn up once it is unlocked', () => {
    const outside = declaredAreas('Act1', 'AbandonedShed').map((a) => a.id)
    expect(outside).toEqual([
      'shed-door',
      'scenery-abandoned-shed-boards',
      'exit-north',
      'exit-south',
    ])
    const ids = declaredAreas('Act1', 'AbandonedShed', 'inside').map(
      (a) => a.id,
    )
    expect(ids).toEqual(
      expect.arrayContaining([
        'mysterious-box',
        'broken-shovel',
        'patches',
        'fishing-rod',
        'magnet',
        'exit-north',
        'exit-south',
      ]),
    )
  })

  it.each(ACTS.map((make) => [make().name, make] as const))(
    'of %s name only rooms of the act, with unique slug ids and a title',
    (_name, make) => {
      const act = make()
      for (const room of Object.keys(act.rooms)) {
        const areas: readonly ImageArea[] = declaredAreas(act.name, room)
        expect(areas.length, `${act.name} ${room}`).toBeGreaterThan(0)
        const ids = areas.map((a) => a.id)
        expect(new Set(ids).size, `${room} ids`).toBe(ids.length)
        for (const area of areas) {
          expect(area.id).toMatch(SLUG)
          expect(area.title.length).toBeGreaterThan(0)
        }
      }
    },
  )

  it.each(ACTS.map((make) => [make().name, make] as const))(
    'reach every room image of %s',
    (_name, make) => {
      const act = make()
      const rooms = allImages(act).slice(0, Object.keys(act.rooms).length)
      for (const image of rooms) {
        expect(image.areas?.length, image.id).toBeGreaterThan(0)
      }
    },
  )
})

describe.each(ACTS.map((make) => [make().name, make] as const))(
  '%s golden path',
  (_name, make) => {
    it('meets only things with a declared area, at every step', () => {
      const act = make()
      const game = new Game([act])
      const missing: string[] = []
      const check = (step: string): void => {
        for (const [key, room] of Object.entries(act.rooms)) {
          const declared = new Set(
            declaredAreas(act.name, key, room.pictureVariant(game.state)).map(
              (a) => a.id,
            ),
          )
          for (const want of wantedAreas(act, game, room)) {
            if (!declared.has(want.id)) {
              missing.push(
                `${act.name} ${key} after "${step}": ${want.what} (${want.id})`,
              )
            }
          }
        }
      }
      check('start')
      for (const command of act.goldenPath) {
        game.commandParser.parse(command)
        game.state.settleQuests()
        check(command)
      }
      expect([...new Set(missing)]).toEqual([])
    })
  },
)
