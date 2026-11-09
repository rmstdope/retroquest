/** What is in a room right now that a named area of its picture can mark. */
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { areaThingsOf } from './areaThings'
import { declaredAreas } from './roomAreas'

/** Act I with Elior standing in the Village Square. */
function inTheSquare(): { act: Act1; game: Game } {
  const act = new Act1()
  const game = new Game([act])
  game.state.currentRoom = game.state.allRooms.VillageSquare
  return { act, game }
}

describe('areaThingsOf', () => {
  it('names a person, a thing, a piece of scenery and the ways out', () => {
    const { act, game } = inTheSquare()
    const things = areaThingsOf(act, 'VillageSquare', game.state)
    const byId = Object.fromEntries(things.map((t) => [t.areaId, t]))
    expect(byId['villager'].kind).toBe('character')
    expect(byId['bucket']).toMatchObject({ kind: 'item', label: 'Bucket' })
    expect(byId['scenery-village-square-fountain']).toMatchObject({
      kind: 'scenery',
      label: 'Fountain',
    })
    expect(byId['exit-north'].kind).toBe('exit')
    expect(byId['exit-north'].direction).toBe('north')
    expect(byId['exit-west'].direction).toBe('west')
    expect(byId['exit-north'].label).toMatch(/^↑ /)
    expect(byId['exit-west'].label).toMatch(/^← /)
    expect(byId['exit-east'].label).toMatch(/^→ /)
  })

  it("carries the engine's name of each thing, for the command it is pressed for", () => {
    const { act, game } = inTheSquare()
    const byId = Object.fromEntries(
      areaThingsOf(act, 'VillageSquare', game.state).map((t) => [t.areaId, t]),
    )
    const room = game.state.allRooms.VillageSquare
    expect(byId['bucket'].name).toBe(
      room.items.find((i) => i.name.toLowerCase().includes('bucket'))?.name,
    )
    expect(byId['villager'].name).toBe(room.characters[0].name)
    expect(byId['exit-north'].name).toBe('north')
  })

  it('only offers areas the room declares', () => {
    const { act, game } = inTheSquare()
    const declared = declaredAreas('Act1', 'VillageSquare').map((a) => a.id)
    for (const thing of areaThingsOf(act, 'VillageSquare', game.state))
      expect(declared).toContain(thing.areaId)
  })

  it('drops a thing that has been taken', () => {
    const { act, game } = inTheSquare()
    executeCommands(game, ['take bucket'])
    const ids = areaThingsOf(act, 'VillageSquare', game.state).map(
      (t) => t.areaId,
    )
    expect(ids).not.toContain('bucket')
  })

  it('is empty for a room the state does not hold', () => {
    const { act, game } = inTheSquare()
    expect(areaThingsOf(act, 'NoSuchRoom', game.state)).toEqual([])
  })

  it('titles scenery by the list of the picture that is shown', () => {
    const act = new Act1()
    const game = new Game([act])
    game.state.currentRoom = game.state.allRooms.AbandonedShed
    const titles = new Map(
      declaredAreas('Act1', 'AbandonedShed', 'inside').map((a) => [
        a.id,
        a.title,
      ]),
    )
    const scenery = areaThingsOf(
      act,
      'AbandonedShed',
      game.state,
      'inside',
    ).filter((thing) => thing.kind === 'scenery')
    expect(scenery.length).toBeGreaterThan(0)
    for (const thing of scenery)
      expect(thing.label).toBe(titles.get(thing.areaId))
  })
})
