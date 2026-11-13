import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { Matches } from './Matches'

/** An Act I game standing in the Village Chapel. */
function gameInChapel(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.VillageChapel
  return game
}

describe('Candle', () => {
  it('reads as cold, not giving light, before it is lit', () => {
    const game = gameInChapel()
    const text = executeCommands(game, ['examine candle'])
    expect(text).not.toContain('steady light')
    expect(text).toContain('cold')
  })

  it('says, when lit, that its light reaches the dark corner where the locket lies', () => {
    const game = gameInChapel()
    game.state.addItemToInventory(new Matches())
    const text = executeCommands(game, ['use candle with matches'])
    expect(text).toContain('dark corner by the altar')
    expect(text).toMatch(/dark corner[^.]*locket/)
  })

  it('reads as lit once it is lit', () => {
    const game = gameInChapel()
    game.state.addItemToInventory(new Matches())
    executeCommands(game, ['use candle with matches'])
    expect(executeCommands(game, ['examine candle'])).toBe(
      'The candle is lit, casting a warm, steady light.',
    )
  })

  it('keeps a lit candle lit through the saved-text refresh', () => {
    const game = gameInChapel()
    game.state.addItemToInventory(new Matches())
    executeCommands(game, ['use candle with matches'])
    const candle = game.state.currentRoom.getItemByName('candle')
    candle?.refreshSavedText(game.state)
    expect(candle?.description).toBe(
      'The candle is lit, casting a warm, steady light.',
    )
  })
})
