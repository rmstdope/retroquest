import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import {
  executeCommands,
  expectItemInInventory,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { FLAG_FOUND_RUNE_TOKEN } from '../Act1StoryFlags'
import { ExtendedMagneticFishingRod } from './ExtendedMagneticFishingRod'
import { Well } from './Well'

/** A game at the Village Well holding the extended magnetic fishing rod. */
function gameAtTheWell(): { game: Game; well: Well } {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.VillageWell
  game.state.addItemToInventory(new ExtendedMagneticFishingRod())
  const well = game.state.currentRoom.items.find((i) => i instanceof Well)
  if (!(well instanceof Well)) throw new Error('expected the well')
  return { game, well }
}

describe('Fishing the purified well', () => {
  it('brings up a black-iron rune token along with the ring', () => {
    const { game, well } = gameAtTheWell()
    well.isPurified = true

    const response = executeCommands(game, [
      'use extended magnetic fishing rod with well',
    ])

    expectItemInInventory(game.state, 'shiny ring')
    expectItemInInventory(game.state, 'rune token')
    expect(response).toContain('[item_name]rune token[/item_name]')
    expect(response).toContain('black iron')
    expect(game.state.getStoryFlag(FLAG_FOUND_RUNE_TOKEN)).toBe(true)
    expectMarkupWellFormed(response)
  })

  it('brings up nothing while the water is still murky', () => {
    const { game } = gameAtTheWell()

    executeCommands(game, ['use extended magnetic fishing rod with well'])

    expectItemInInventory(game.state, 'rune token', false)
    expect(game.state.getStoryFlag(FLAG_FOUND_RUNE_TOKEN)).toBe(false)
  })
})
