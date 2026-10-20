import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act1 } from '../Act1'
import { FLAG_PATCHES_FOUND } from '../Act1StoryFlags'
import { Coin } from '../items/Coin'
import { Egg } from '../items/Egg'
import { Key } from '../items/Key'
import { AbandonedShed } from '../rooms/AbandonedShed'
import { Patches } from './Patches'

/** An Act I game with Elior standing before the locked shed, key in hand. */
function gameAtShed(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.AbandonedShed
  game.state.addItemToInventory(new Key())
  return game
}

/** Whether Patches is in the room. */
function patchesIn(game: Game, roomKey: string): boolean {
  return game.state.allRooms[roomKey].characters.some(
    (c) => c instanceof Patches,
  )
}

describe('Patches in the Abandoned Shed', () => {
  it('is not in the shed while it is locked', () => {
    const game = gameAtShed()
    expect(patchesIn(game, 'AbandonedShed')).toBe(false)
  })

  it('bolts behind the crates when the shed is unlocked', () => {
    const game = gameAtShed()
    const answer = game.commandParser.parse('use key with door')
    expect(answer).toContain('mew')
    expect(findMarkupProblems(answer)).toEqual([])
    expect(patchesIn(game, 'AbandonedShed')).toBe(true)
  })

  it('watches from behind the crates while the shed is searched', () => {
    const game = gameAtShed()
    game.commandParser.parse('use key with door')
    expect(game.commandParser.parse('search')).toContain('behind the crates')
  })

  it('comes out when called by name and is carried off', () => {
    const game = gameAtShed()
    game.commandParser.parse('use key with door')
    const answer = game.commandParser.parse('talk to patches')
    expect(answer).toContain('[character_name]Patches[/character_name]')
    expect(answer).toContain('[character_name]Hemlock[/character_name]')
    expect(findMarkupProblems(answer)).toEqual([])
    expect(game.state.getStoryFlag(FLAG_PATCHES_FOUND)).toBe(true)
    expect(patchesIn(game, 'AbandonedShed')).toBe(false)
  })

  it('also comes out when her name is said to her', () => {
    const game = gameAtShed()
    game.commandParser.parse('use key with door')
    game.commandParser.parse('say patches to patches')
    expect(game.state.getStoryFlag(FLAG_PATCHES_FOUND)).toBe(true)
  })

  it('is coaxed out by a smelly egg, which Elior keeps', () => {
    const game = gameAtShed()
    game.commandParser.parse('use key with door')
    game.state.addItemToInventory(new Egg())
    const answer = game.commandParser.parse('give egg to patches')
    expect(findMarkupProblems(answer)).toEqual([])
    expect(game.state.getStoryFlag(FLAG_PATCHES_FOUND)).toBe(true)
    expect(game.state.hasItem('egg')).toBe(true)
  })

  it('ignores an offered item and hints at her name', () => {
    const game = gameAtShed()
    game.commandParser.parse('use key with door')
    game.state.addItemToInventory(new Coin())
    const answer = game.commandParser.parse('give coin to patches')
    expect(answer).toContain('name')
    expect(findMarkupProblems(answer)).toEqual([])
    expect(game.state.getStoryFlag(FLAG_PATCHES_FOUND)).toBe(false)
  })

  it('hides in a shed unlocked by a save made before she was there', () => {
    const game = gameAtShed()
    game.commandParser.parse('use key with door')
    const shed = game.state.allRooms.AbandonedShed
    shed.characters = []
    game.state.currentRoom = game.state.allRooms.VillageWell
    const loaded = new Game([new Act1()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    loaded.commandParser.parse('go south')

    expect(loaded.state.currentRoom).toBeInstanceOf(AbandonedShed)
    expect(patchesIn(loaded, 'AbandonedShed')).toBe(true)
    expect(loaded.commandParser.parse('go north')).toContain('Village Well')
    loaded.commandParser.parse('go south')
    expect(
      loaded.state.allRooms.AbandonedShed.characters.filter(
        (c) => c instanceof Patches,
      ),
    ).toHaveLength(1)
  })

  it('does not come back to the shed once found', () => {
    const game = gameAtShed()
    game.commandParser.parse('use key with door')
    game.commandParser.parse('talk to patches')
    game.commandParser.parse('go north')
    game.commandParser.parse('go south')
    game.commandParser.parse('search')
    expect(patchesIn(game, 'AbandonedShed')).toBe(false)
  })
})
