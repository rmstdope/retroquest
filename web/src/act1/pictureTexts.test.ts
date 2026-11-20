import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { roomImages } from '@/lantern/imageLists'
import { narrationText } from '@/lantern/narrationKey'
import { Act1 } from './Act1'
import { SharpKnife } from './items/SharpKnife'
import { executeCommands } from '@/testing/gameHelpers'
import { appliedPatchIds } from '@/lantern/roomPatchState'

const images = roomImages(new Act1())
const byId = (id: string) => images.find((i) => i.id === id)

describe('the picture words of Act I (rq-v29l.20)', () => {
  it('describes the well as a narrow shaft with water far below', () => {
    expect(byId('act1-village-well')?.text).toContain('narrow stone shaft')
    expect(byId('act1-village-well')?.text).toContain('far below')
  })

  it('describes the chapel carving as a tree under two moons above the door', () => {
    expect(byId('act1-village-chapel')?.text).toContain(
      'Above the door a faint carving, worn almost smooth, shows a tree under two moons',
    )
  })

  it('gives the store one picture, described by the shut room text with rope', () => {
    const store = byId('act1-general-store')
    expect(store?.text).toBe(
      'A cluttered shop with the shutters half down. Rope, apples and ' +
        'trinkets crowd the shelves in the gloom. Hemlock stands at his ' +
        'counter, sorting apples, and keeps glancing at the lane to the chapel.',
    )
    expect(store?.areas?.map((a) => a.id)).toContain('patches')
    expect(byId('act1-general-store-shut')).toBeUndefined()
  })

  it('describes the shed inside in near-darkness with no cat in view', () => {
    const inside = byId('act1-abandoned-shed-inside')?.text
    expect(inside).toContain('near-darkness')
    expect(inside).toContain('thin cracks')
    expect(inside).toContain('No cat lies in view')
    expect(byId('act1-abandoned-shed')?.text).toContain(
      'Little light gets past',
    )
  })

  it('leaves every other room described by its own words', () => {
    const act = new Act1()
    const declared = ['VillageWell', 'VillageChapel', 'GeneralStore']
    for (const [key, room] of Object.entries(act.rooms)) {
      if (declared.includes(key)) continue
      const own = images.find((i) => i.title === room.name)
      expect(own?.text).toBe(narrationText(room.description))
    }
  })

  it('words the patches for the pictures that were sent back to the studio', () => {
    const patch = (room: string, id: string): string | undefined =>
      roomImages(new Act1())
        .find((i) => i.title === room)
        ?.patches?.find((p) => p.id === id)?.text
    expect(patch('Chicken Coop', 'key-appears')).toContain('straw on the floor')
    expect(patch('Riverbank', 'mothers-letter-appears')).toContain('askew')
    expect(patch('Forest Path', 'snare-appears')).toContain('fox kit caught')
    expect(patch('Forest Path', 'snare-cut')).toContain('cut and empty')
    expect(patch("Elior's Cottage", 'faded-photograph-appears')).toContain(
      'opened drawer',
    )
    expect(patch('Hidden Glade', 'rare-flower-appears')).toContain(
      'deep purple petals with gold',
    )
    expect(patch('General Store', 'patches-appears')).toContain('ginger')
    expect(patch("Elior's Cottage", 'patches-appears')).toContain('ginger')
    expect(
      roomImages(new Act1())
        .find((i) => i.id === 'act1-abandoned-shed-inside')
        ?.patches?.find((p) => p.id === 'fishing-rod-appears')?.text,
    ).toContain('dusty shelves')
  })
})

describe('the Forest Path snare patches', () => {
  it('shows the cut snare over the caught kit only once the kit is cut free', () => {
    const act = new Act1()
    const game = new Game([act])
    game.state.currentRoom = game.state.allRooms.ForestPath
    game.state.addItemToInventory(new SharpKnife())
    executeCommands(game, ['use sharp knife with vines'])
    const caught = appliedPatchIds(act, 'ForestPath', game.state, '')
    expect(caught).toContain('snare-appears')
    expect(caught).not.toContain('snare-cut')
    executeCommands(game, ['use sharp knife with snare'])
    const freed = appliedPatchIds(act, 'ForestPath', game.state, '')
    expect(freed).toContain('snare-appears')
    expect(freed.indexOf('snare-cut')).toBeGreaterThan(
      freed.indexOf('snare-appears'),
    )
  })
})
