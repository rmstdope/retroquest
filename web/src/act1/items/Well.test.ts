import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { Act1 } from '../Act1'
import { Well } from './Well'

describe('Well', () => {
  it('names the well as an item when purified before it is examined', () => {
    const game = new Game([new Act1()])
    expect(new Well().purify(game.state)).toContain(
      '[item_name]well[/item_name]?',
    )
  })

  it('splits the murky look into a silent echo and a narrated clue', () => {
    const game = new Game([new Act1()])
    const well = new Well()
    well.containsRing = true
    const lines = well.search(game.state).split('\n')
    expect(lines).toEqual([
      '[event]You peer into the murky depths.[/event]',
      "[failure][clue]It's hard to see clearly, but you think you catch a " +
        "glimpse of something shiny. It's far too deep to reach.[/clue][/failure]",
    ])
  })

  it('keeps the murky look without a ring a plain, silent refusal', () => {
    const game = new Game([new Act1()])
    const well = new Well()
    well.containsRing = false
    const blocks = parseTurn(well.search(game.state))
    expect(blocks).toHaveLength(1)
    expect(blocks[0].kind).toBe('failure')
    expect(blocks[0]).not.toHaveProperty('narrated')
  })
})
