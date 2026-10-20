import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import {
  FLAG_RUSTY_HOE_FIRST_COIN_FOUND,
  FLAG_RUSTY_HOE_SECOND_COIN_FOUND,
} from '../Act1StoryFlags'
import { RustyHoe } from './RustyHoe'

/** An Act I game in the Vegetable Field with the rusty hoe in hand. */
function gameInField(): { game: Game; hoe: RustyHoe } {
  const game = new Game([new Act1()])
  const hoe = new RustyHoe()
  game.state.currentRoom = game.state.allRooms.VegetableField
  game.state.addItemToInventory(hoe)
  return { game, hoe }
}

describe('RustyHoe coin discovery', () => {
  it('finds a single coin, even after it is spent', () => {
    const { game, hoe } = gameInField()
    const state = game.state

    expect(hoe.use(state)).toContain('unearth')
    expect(state.getItemCount('coin')).toBe(1)
    expect(state.getStoryFlag(FLAG_RUSTY_HOE_FIRST_COIN_FOUND)).toBe(true)
    expect(hoe.use(state)).toContain('[failure]')

    state.removeItemFromInventory('coin')
    expect(hoe.use(state)).toContain('[failure]')
    expect(state.getItemCount('coin')).toBe(0)
    expect(state.getStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND)).toBe(false)

    const restoredGame = new Game([new Act1()])
    restoredGame.loadSaveData(game.toSaveData())
    const restoredHoe = restoredGame.state.inventory.find(
      (item) => item instanceof RustyHoe,
    )
    if (!(restoredHoe instanceof RustyHoe)) {
      throw new Error('The rusty hoe was not restored from the save.')
    }
    expect(restoredHoe.use(restoredGame.state)).toContain('[failure]')
    expect(restoredGame.state.getItemCount('coin')).toBe(0)
  })
})
