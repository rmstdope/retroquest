import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { Candle } from './Candle'
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

  it('shows the Bag and examine the same look once the candle is lit', () => {
    const game = gameInChapel()
    game.state.addItemToInventory(new Matches())
    const candle = game.state.currentRoom.getItemByName('candle')
    const bag = (): string | undefined =>
      new GameController(game)
        .getInventory()
        .find((entry) => entry.name.includes('candle'))?.description
    if (!(candle instanceof Candle)) throw new Error('no candle')
    game.state.addItemToInventory(candle)
    expect(bag()).toBe(candle.examine(game.state))
    executeCommands(game, ['use candle with matches'])
    expect(bag()).toBe('The candle is lit, casting a warm, steady light.')
    expect(bag()).toBe(candle.examine(game.state))
  })

  it('looks lit even when a saved description still says cold', () => {
    const game = gameInChapel()
    game.state.addItemToInventory(new Matches())
    executeCommands(game, ['use candle with matches'])
    const candle = game.state.currentRoom.getItemByName('candle')
    expect(candle?.descriptionFor(game.state)).toBe(
      'The candle is lit, casting a warm, steady light.',
    )
  })
})
