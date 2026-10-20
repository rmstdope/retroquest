import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { Well } from './Well'

describe('Well', () => {
  it('names the well as an item when purified before it is examined', () => {
    const game = new Game([new Act1()])
    expect(new Well().purify(game.state)).toContain(
      '[item_name]well[/item_name]?',
    )
  })
})
