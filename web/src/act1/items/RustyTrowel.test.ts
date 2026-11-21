import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import {
  FLAG_RUSTY_HOE_FIRST_COIN_FOUND,
  FLAG_RUSTY_HOE_SECOND_COIN_FOUND,
} from '../Act1StoryFlags'
import { RustyTrowel } from './RustyTrowel'

/** An Act I game in the Vegetable Field with the rusty trowel in hand. */
function gameInField(): { game: Game; trowel: RustyTrowel } {
  const game = new Game([new Act1()])
  const trowel = new RustyTrowel()
  game.state.currentRoom = game.state.allRooms.VegetableField
  game.state.addItemToInventory(trowel)
  return { game, trowel }
}

describe('RustyTrowel coin discovery', () => {
  it('finds a single coin, even after it is spent', () => {
    const { game, trowel } = gameInField()
    const state = game.state

    expect(trowel.use(state)).toContain('unearth')
    expect(state.getItemCount('coin')).toBe(1)
    expect(state.getStoryFlag(FLAG_RUSTY_HOE_FIRST_COIN_FOUND)).toBe(true)
    expect(trowel.use(state)).toContain('[failure]')

    state.removeItemFromInventory('coin')
    expect(trowel.use(state)).toContain('[failure]')
    expect(state.getItemCount('coin')).toBe(0)
    expect(state.getStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND)).toBe(false)

    const restoredGame = new Game([new Act1()])
    restoredGame.loadSaveData(game.toSaveData())
    const restoredTrowel = restoredGame.state.inventory.find(
      (item) => item instanceof RustyTrowel,
    )
    if (!(restoredTrowel instanceof RustyTrowel)) {
      throw new Error('The rusty trowel was not restored from the save.')
    }
    expect(restoredTrowel.use(restoredGame.state)).toContain('[failure]')
    expect(restoredGame.state.getItemCount('coin')).toBe(0)
  })
})

describe('RustyTrowel room check', () => {
  it('digs the field by what the room is, not by what it is called', () => {
    const { game, trowel } = gameInField()
    game.state.currentRoom.name = 'The Parched Plot'

    expect(trowel.use(game.state)).toContain('unearth')
  })
})

describe('RustyTrowel in a save made when it was the rusty hoe', () => {
  /** A save of the field game with the trowel's saved words put back as the hoe's. */
  function oldSave(carried: boolean): string {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VegetableField
    if (carried) {
      executeCommands(game, ['take trowel'])
    }
    const save = game.toSaveData()
    return save
      .replaceAll('rusty trowel', 'rusty hoe')
      .replaceAll('"trowel"', '"hoe"')
      .replaceAll(
        'A trowel with a rusted blade and a worn wooden handle.',
        'A hoe with a rusted blade and a splintered handle.',
      )
  }

  it.each([true, false])(
    'shows a rusty hoe as the rusty trowel (carried: %s)',
    (carried) => {
      const save = oldSave(carried)
      expect(save).toContain('rusty hoe')
      const game = new Game([new Act1()])
      expect(game.loadSaveData(save)).toContain('loaded')
      game.state.currentRoom = game.state.allRooms.VegetableField
      if (!carried) executeCommands(game, ['take trowel'])
      const item = game.state.inventory.find((i) => i instanceof RustyTrowel)
      expect(item?.name).toBe('rusty trowel')
      expect(item?.shortName).toBe('trowel')
      expect(executeCommands(game, ['examine trowel'])).toContain(
        'A trowel with a rusted blade and a worn wooden handle.',
      )
      expect(executeCommands(game, ['examine hoe'])).not.toContain('rusted')
    },
  )
})
