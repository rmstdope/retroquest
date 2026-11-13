import { describe, it, expect } from 'vitest'
import { Game, Item } from '@/engine'
import { Act1 } from '@/act1/Act1'
import { Matches } from '@/act1/items/Matches'
import { Candle } from '@/act1/items/Candle'
import { Scenery } from '@/act1/items/Scenery'
import { staleSaveMismatches } from './staleSave'

describe('staleSaveMismatches', () => {
  it('finds nothing when the load restores the wording', () => {
    expect(
      staleSaveMismatches({
        makeGame: () => new Game([new Act1()]),
        cases: [{ target: Candle, fields: ['description'] }],
      }),
    ).toEqual([])
  })

  it('names a field the load leaves stale', () => {
    expect(
      staleSaveMismatches({
        makeGame: () => new Game([new Act1()]),
        cases: [{ target: Scenery, fields: ['description'] }],
      }),
    ).toEqual(['Scenery.description'])
  })

  it('names a class that is not in the game', () => {
    class Missing extends Item {}
    expect(
      staleSaveMismatches({
        makeGame: () => new Game([new Act1()]),
        cases: [{ target: Missing, fields: ['description'] }],
      }),
    ).toEqual(['Missing: not found in the game'])
  })

  it('names an examine that still shows the saved wording', () => {
    expect(
      staleSaveMismatches({
        makeGame: () => {
          const game = new Game([new Act1()])
          game.state.addItemToInventory(new Matches())
          return game
        },
        cases: [{ target: Matches, fields: [], examine: true }],
      }),
    ).toEqual(['Matches.examine()'])
  })
})
