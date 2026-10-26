import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act2 } from '../Act2'
import { Coins, COINS_DESCRIPTION } from './Coins'

/** Every number a text states. */
function numbersIn(text: string): number[] {
  return (text.match(/\d+/g) ?? []).map(Number)
}

describe('Coins (rq-pw5d)', () => {
  it.each([
    ['one coin each, as Sir Cedric pays them', () => new Coins()],
    ['a coin from the inn rooms', () => new Coins()],
  ])(
    'never states a count other than the one in the bag: %s',
    (_source, coin) => {
      const game = new Game([new Act2()])
      game.state.addItemToInventory(coin(), 50)

      const entry = new GameController(game)
        .getInventory()
        .find((item) => item.name.includes('coins'))

      expect(entry?.name).toContain('50 coins')
      for (const stated of numbersIn(entry?.description ?? ''))
        expect(stated).toBe(50)
    },
  )

  it('counts the coins actually carried when used', () => {
    const game = new Game([new Act2()])
    const coin = new Coins()
    game.state.addItemToInventory(coin, 50)

    const answer = coin.use(game.state)

    expect(numbersIn(answer)).toEqual([50])
  })

  it('a save made before the fix loads with a description that names no count', () => {
    const game = new Game([new Act2()])
    const coin = new Coins()
    Object.assign(coin, {
      amount: 1,
      description:
        'A pouch containing 1 gold coins. These will be useful for ' +
        'purchasing supplies and equipment in Greendale.',
    })
    game.state.addItemToInventory(coin, 50)

    const loaded = new Game([new Act2()])
    loaded.loadSaveData(game.toSaveData())

    const entry = new GameController(loaded)
      .getInventory()
      .find((item) => item.name.includes('coins'))
    expect(entry?.description).toBe(COINS_DESCRIPTION)
  })
})
