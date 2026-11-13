import { describe, it, expect } from 'vitest'
import { Game, GameController, type Item } from '@/engine'
import { Act1 } from '../Act1'
import { Mechanism } from './Mechanism'
import { MothersLetter } from './MothersLetter'
import { ShinyRing } from './ShinyRing'
import { Well } from './Well'
import { Bucket } from './Bucket'

/** What the Bag shows for the one carried item. */
function bag(game: Game): string | undefined {
  return new GameController(game).getInventory()[0]?.description
}

describe('Act I items: the Bag and examine read the same look', () => {
  it.each([
    ['mother’s letter', () => new MothersLetter()],
    ['shiny ring', () => new ShinyRing()],
  ])('for the %s', (_name, make: () => Item) => {
    const game = new Game([new Act1()])
    const item = make()
    game.state.addItemToInventory(item)
    expect(bag(game)).toBe(item.examine(game.state))
  })

  it('for a bucket that fills and for a well and a mechanism that change', () => {
    const game = new Game([new Act1()])
    const bucket = new Bucket()
    game.state.addItemToInventory(bucket)
    const empty = bag(game)
    bucket.useWith(game.state, new Well())
    expect(bag(game)).not.toBe(empty)
    expect(bag(game)).toBe(bucket.examine(game.state))

    const well = new Well()
    const before = well.examine(game.state)
    well.isPurified = true
    expect(well.examine(game.state)).not.toBe(before)

    const mechanism = new Mechanism()
    const working = mechanism.examine(game.state)
    mechanism.repaired = true
    expect(mechanism.examine(game.state)).not.toBe(working)
  })
})
