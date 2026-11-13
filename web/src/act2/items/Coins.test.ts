import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act2 } from '../Act2'
import { Coins } from './Coins'

/** Every number a text states. */
function numbersIn(text: string): number[] {
  return (text.match(/\d+/g) ?? []).map(Number)
}

describe('Coins (rq-pw5d)', () => {
  it('never states a count other than the one in the bag', () => {
    const game = new Game([new Act2()])
    game.state.addItemToInventory(new Coins(), 50)

    const entry = new GameController(game)
      .getInventory()
      .find((item) => item.name.includes('coins'))

    expect(entry?.name).toContain('50 coins')
    for (const stated of numbersIn(entry?.description ?? ''))
      expect(stated).toBe(50)
  })

  it('counts the coins actually carried when used', () => {
    const game = new Game([new Act2()])
    const coin = new Coins()
    game.state.addItemToInventory(coin, 50)

    const answer = coin.use(game.state)

    expect(numbersIn(answer)).toEqual([50])
  })
})
